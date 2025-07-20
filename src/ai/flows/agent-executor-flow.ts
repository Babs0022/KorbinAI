
'use server';
/**
 * @fileOverview The Cognitive Core of the Autonomous AI Agent.
 * This flow implements the principles of a proactive, goal-oriented partner by
 * planning, reasoning, and using memory to accomplish complex tasks.
 *
 * - agentExecutor - A function that interprets a user request and uses available tools to fulfill it.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  brieflyImageGenerator,
  brieflyPromptGenerator,
  brieflyStructuredDataGenerator,
  brieflyWrittenContentGenerator,
} from '@/ai/tools/briefly-tools';
import { createLog } from '@/services/loggingService';
import { AgentExecutionInputSchema, type AgentExecutionInput, type Message } from '@/types/ai';
import { v4 as uuidv4 } from 'uuid';
import { getMemory, saveMemoryTool } from '@/services/memoryService';

const FLOW_NAME = 'agentExecutorFlow';

// Export the main async function that calls the flow
export async function agentExecutor(input: AgentExecutionInput): Promise<string> {
  return agentExecutorFlow(input);
}

// Define the Genkit flow for the agent
const agentExecutorFlow = ai.defineFlow(
  {
    name: FLOW_NAME,
    inputSchema: AgentExecutionInputSchema,
    outputSchema: z.string(),
  },
  async ({ userId, messages }) => {
    const traceId = uuidv4();
    const latestUserMessage = messages[messages.length - 1]?.content || '';
    
    await createLog({
      traceId,
      flowName: FLOW_NAME,
      userId,
      phase: 'Thinking',
      stepName: 'AgentStarted',
      level: 'info',
      status: 'started',
      message: `Agent started to process request: "${latestUserMessage}"`,
      source: 'agent-executor-flow.ts',
      data: { prompt: latestUserMessage },
    });

    // 1. Perception & Memory Retrieval
    const relevantMemory = userId ? await getMemory(userId, latestUserMessage) : null;
    const memoryContext = relevantMemory ? `
Here is some relevant information from past interactions (Long-Term Memory):
---
${relevantMemory}
---
` : "No relevant long-term memory found for this query.";


    const systemPrompt = `You are a proactive, goal-oriented AI agent for the application "BrieflyAI". Your purpose is to help users accomplish creative tasks by understanding high-level goals and creating multi-step plans.

Your Cognitive Process follows this reasoning loop:
1.  **Perception**: Analyze the user's request and the conversation history (Short-Term Memory). Also, consider any relevant information from your Long-Term Memory.
2.  **Planning**: Decompose the user's goal into a sequence of smaller, actionable steps. Determine which tool is best suited for each step.
3.  **Action**: Execute the chosen tool with the correct parameters.
4.  **Reflection**: Analyze the result of the action. If the plan is complete, formulate a final response. If not, decide the next step. If an error occurs, adapt your plan.
5.  **Learning**: After formulating the final response, identify a key takeaway from this interaction to store in your Long-Term Memory for future use.

**Available Tools**:
- **brieflyWrittenContentGenerator**: Use for writing text (blog posts, emails, articles).
- **brieflyPromptGenerator**: Use for creating or optimizing AI prompts.
- **brieflyImageGenerator**: Use for creating visual images.
- **brieflyStructuredDataGenerator**: Use for creating data (JSON, CSV).
- **saveMemoryTool**: Use to save a key takeaway to your long-term memory after a task is complete.

**Execution Guidance**:
- If the user's request is purely conversational (e.g., "hello"), respond naturally without using a tool.
- For tasks, first create a plan, then execute it.
- After a tool returns a result, present the final output clearly to the user. Do not just return raw tool output. For images, state that you have generated it and present the image URL.
- After the task is complete, you MUST call the 'saveMemoryTool' to record what you learned.

${memoryContext}
`;

    const formattedMessagesForApi = messages.reduce<Message[]>((acc, message) => {
        if (message.role === 'system') {
            return acc;
        }

        const parts: ({ text: string; } | { inlineData: { mimeType: string; data: string; }; })[] = [];
        if (message.content && typeof message.content === 'string' && message.content.trim() !== '') {
            parts.push({ text: message.content });
        }
        if (message.imageUrl) {
            const match = message.imageUrl.match(/^data:(image\/.+);base64,(.+)$/);
            if (match) {
                parts.push({
                    inlineData: { mimeType: match[1], data: match[2] },
                });
            }
        }
        
        if (parts.length > 0) {
            acc.push({
                role: message.role,
                content: parts,
            });
        }
        return acc;
    }, []);


    let response;
    try {
      response = await ai.generate({
        model: 'googleai/gemini-1.5-pro-latest',
        system: systemPrompt,
        messages: formattedMessagesForApi,
        tools: [
          brieflyWrittenContentGenerator,
          brieflyPromptGenerator,
          brieflyImageGenerator,
          brieflyStructuredDataGenerator,
          saveMemoryTool, // Add the new learning tool
        ],
        toolChoice: 'auto',
      });
    } catch (error) {
      const errorForLog = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { data: JSON.stringify(error) };
      await createLog({
        traceId,
        flowName: FLOW_NAME,
        userId,
        phase: 'Executing',
        stepName: 'AIGenerationFailed',
        level: 'error',
        status: 'failed',
        message: 'Agent failed to generate a response during ai.generate() call.',
        source: 'agent-executor-flow.ts',
        data: errorForLog,
      });
      throw new Error('The agent failed to generate a response. Please check the logs for more details.');
    }
    
    const toolCalls = response.toolCalls();
    
    // Handle the 'saveMemory' call specifically for the learning loop
    const memoryCall = toolCalls.find(call => call.toolName === 'saveMemoryTool');
    if (memoryCall && userId) {
      await createLog({ traceId, flowName: FLOW_NAME, userId, phase: 'Learning', stepName: 'SaveMemoryCalled', level: 'info', status: 'started', message: 'Agent is saving key takeaway to long-term memory.', source: 'agent-executor-flow.ts', data: memoryCall.args });
      await memoryCall.call();
    }
    
    // Filter out the memory call from the main response to the user
    const userFacingToolCalls = toolCalls.filter(call => call.toolName !== 'saveMemoryTool');
    
    // Case 1: A tool call is present.
    if (userFacingToolCalls.length > 0) {
        const firstToolCall = userFacingToolCalls[0];
        const toolName = firstToolCall.toolName;

        await createLog({
            traceId,
            flowName: FLOW_NAME,
            userId,
            phase: 'Planning',
            stepName: 'ToolDecision',
            level: 'info',
            status: 'completed',
            message: `Agent created a plan and decided to use tool: ${toolName}.`,
            source: 'agent-executor-flow.ts',
            data: { toolCall: firstToolCall },
        });
        
        // Pass traceId to tools
        if (userId) firstToolCall.args.userId = userId;
        firstToolCall.args.traceId = traceId;

        const toolResult = await firstToolCall.call();

        await createLog({
            traceId,
            flowName: FLOW_NAME,
            userId,
            phase: 'Executing',
            stepName: 'ToolExecution',
            level: 'info',
            status: 'completed',
            message: `Tool ${toolName} executed successfully. Now reflecting on the result.`,
            source: 'agent-executor-flow.ts',
        });
        
        await createLog({
            traceId,
            flowName: FLOW_NAME,
            userId,
            phase: 'Thinking',
            stepName: 'FormulatingFinalResponse',
            level: 'info',
            status: 'started',
            message: 'Agent is formulating the final response and identifying key takeaways for learning.',
            source: 'agent-executor-flow.ts',
        });

        // The final response prompt now also instructs the agent to save to memory
        const finalResponsePrompt = `The user asked: "${latestUserMessage}". I used the ${toolName} tool and got this result. 
        1. Formulate a friendly and clear final response to the user, presenting this result. If the result is an image URL, embed it using markdown.
        2. Based on the entire interaction, call the 'saveMemoryTool' with a concise takeaway (e.g., 'User prefers marketing content to be witty', 'User is building a React Native app').
        
        Result: ${JSON.stringify(toolResult)}`;
        
        const finalResponse = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            prompt: finalResponsePrompt,
            tools: [saveMemoryTool],
        });

        // Asynchronously call the memory tool without waiting for it, so user gets response faster
        const finalMemoryCall = finalResponse.toolCalls().find(call => call.toolName === 'saveMemoryTool');
        if (finalMemoryCall && userId) {
          finalMemoryCall.args.userId = userId;
          createLog({ traceId, flowName: FLOW_NAME, userId, phase: 'Learning', stepName: 'SaveMemoryCalled', level: 'info', status: 'started', message: 'Agent is saving final key takeaway to long-term memory.', source: 'agent-executor-flow.ts', data: finalMemoryCall.args }).then(() => finalMemoryCall.call());
        }

        await createLog({
            traceId,
            flowName: FLOW_NAME,
            userId,
            phase: 'Completed',
            stepName: 'AgentSuccessWithTool',
            level: 'info',
            status: 'completed',
            message: 'Agent finished execution successfully with tool.',
            source: 'agent-executor-flow.ts',
        });

        return finalResponse.text;
    }
    
    // Case 2: No tool call, just a text response.
    const textResponse = response.text;
    if (textResponse) {
        await createLog({
            traceId,
            flowName: FLOW_NAME,
            userId,
            phase: 'Completed',
            stepName: 'AgentSuccessNoTool',
            level: 'info',
            status: 'completed',
            message: 'Agent finished with a conversational response.',
            source: 'agent-executor-flow.ts',
            data: { response: textResponse },
        });
        return textResponse;
    }

    // Case 3: Invalid response from the AI.
    await createLog({
        traceId,
        flowName: FLOW_NAME,
        userId,
        phase: 'Executing',
        stepName: 'InvalidAIResponse',
        level: 'error',
        status: 'failed',
        message: 'Agent received an invalid response from the AI (no tool call and no parsable text).',
        source: 'agent-executor-flow.ts',
        data: { response: JSON.parse(JSON.stringify(response)) },
    });
    throw new Error('The agent received an invalid response from the AI. Please check the logs for more details.');
  }
);

