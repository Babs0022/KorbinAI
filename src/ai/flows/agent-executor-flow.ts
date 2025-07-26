
'use server';
/**
 * @fileOverview The Cognitive Core of the Autonomous AI Agent.
 * This flow implements the principles of a proactive, goal-oriented partner by
 * planning, reasoning, and using memory to accomplish complex tasks.
 * It features a multi-step reasoning loop to chain tool calls and adapt its plan.
 *
 * - agentExecutor - a function that interprets a user request and uses available tools to fulfill it.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  brieflyImageGenerator,
  brieflyPromptGenerator,
  brieflyWrittenContentGenerator,
  brieflyStructuredDataGenerator,
} from '@/ai/tools/briefly-tools';
import { createLog } from '@/services/loggingService';
import { AgentExecutionInputSchema, type AgentExecutionInput } from '@/types/ai';
import { v4 as uuidv4 } from 'uuid';
import { getMemory, saveMemoryTool } from '@/services/memoryService';
import { Message, ToolRequest, GenerateOptions, Part } from '@genkit-ai/ai';


const FLOW_NAME = 'agentExecutorFlow';

// A map of the available tools that the agent can execute.
const availableTools = {
  [brieflyWrittenContentGenerator.name]: brieflyWrittenContentGenerator,
  [brieflyPromptGenerator.name]: brieflyPromptGenerator,
  [brieflyImageGenerator.name]: brieflyImageGenerator,
  [brieflyStructuredDataGenerator.name]: brieflyStructuredDataGenerator,
  [saveMemoryTool.name]: saveMemoryTool,
};


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
1.  **Perception**: Analyze the user's request, the conversation history (Short-Term Memory), and relevant Long-Term Memory.
2.  **Planning**: Decompose the user's goal into a sequence of smaller, actionable steps. If the goal requires multiple actions, create a plan and execute the first step.
3.  **Action**: Execute the chosen tool with the correct parameters.
4.  **Reflection**: Analyze the result of the action.
    - If the plan is complete, formulate a final response to the user.
    - If the plan is not yet complete, update your plan and decide the next step.
    - If an error occurs, adapt your plan.
5.  **Learning**: Once the entire goal is achieved, you MUST call the 'saveMemoryTool' with a key takeaway from the interaction to store in your Long-Term Memory for future use.

**Available Tools**:
- **brieflyWrittenContentGenerator**: Use for writing text (blog posts, emails, articles).
- **brieflyPromptGenerator**: Use for creating or optimizing AI prompts.
- **brieflyImageGenerator**: Use for creating visual images.
- **brieflyStructuredDataGenerator**: Use for creating data (JSON, CSV).
- **saveMemoryTool**: IMPORTANT: Use this tool ONLY ONCE at the very end of your entire plan to save a key takeaway. Do not use it after every step.

**Execution Guidance**:
- For complex requests, break them down. For example, to "write a blog post and create an image for it", first use \`brieflyWrittenContentGenerator\` and then, in a second step, use \`brieflyImageGenerator\`.
- If the user's request is purely conversational (e.g., "hello"), respond naturally withoutusing a tool.
- After a tool returns a result, analyze it. Do not just return raw tool output. Present the final output clearly to the user once all steps are complete.
- The 'saveMemoryTool' is for learning and should be the final action you take.

${memoryContext}
`;

    const modelConfig: GenerateOptions = {
        model: 'googleai/gemini-1.5-pro',
        system: systemPrompt,
        tools: Object.values(availableTools),
        toolChoice: 'auto',
    };
    
    // Convert incoming messages to Genkit's format
    const history: Message[] = messages.map(msg => {
        const contentParts: Part[] = [{ text: msg.content }];
        if (msg.imageUrl) {
            contentParts.push({ media: { url: msg.imageUrl } });
        }
        return { role: msg.role, content: contentParts };
    });

    // --- REASONING LOOP ---
    let loopCount = 0;
    const maxLoops = 10; // To prevent infinite loops

    while (loopCount < maxLoops) {
        loopCount++;

        const response = await ai.generate({
            ...modelConfig,
            messages: history,
        });
        
        // Add defensive check for response.choices
        if (!response.choices || response.choices.length === 0) {
            const errorData = { response: 'No response body available.' };
            try {
                errorData.response = JSON.parse(JSON.stringify(response));
            } catch (e) { /* Ignore parsing errors if response is not serializable */ }

            await createLog({
                traceId, flowName: FLOW_NAME, userId,
                phase: 'Executing', stepName: 'InvalidAIGenerationResponse',
                level: 'error', status: 'failed',
                message: 'AI generation returned no choices. This may be due to an invalid model name or API error.',
                source: 'agent-executor-flow.ts',
                data: errorData,
            });
            throw new Error('AI generation failed to produce a response.');
        }

        const choice = response.choices[0];
        
        // If there's no tool call, it's the final answer. Break the loop.
        if (!choice.message.toolRequest) {
            history.push(choice.message);
            break;
        }
        
        // Add the tool request to history
        history.push(choice.message);
        
        const toolRequest: ToolRequest = choice.message.toolRequest;
        const toolName = toolRequest.name;
        const toolToRun = availableTools[toolName];

        if (!toolToRun) {
            throw new Error(`The AI model requested the tool "${toolName}", but it is not available.`);
        }

        await createLog({
            traceId,
            flowName: FLOW_NAME,
            userId,
            phase: 'Planning',
            stepName: `Step_${loopCount}_ToolDecision`,
            level: 'info',
            status: 'completed',
            message: `Agent decided to use tool: ${toolName}.`,
            source: 'agent-executor-flow.ts',
            data: { toolRequest },
        });

        // Add traceId and userId to tool args if they exist
        const toolInput = { ...toolRequest.input };
        if (userId) (toolInput as any).userId = userId;
        (toolInput as any).traceId = traceId;
        
        // Execute the tool call
        let toolResult;
        try {
            toolResult = await toolToRun(toolInput);
        } catch (error) {
            const errorForLog = error instanceof Error ? { name: error.name, message: error.message } : { data: JSON.stringify(error) };
            toolResult = `Error executing tool ${toolName}: ${error instanceof Error ? error.message : 'An unknown error occurred'}`;
            await createLog({
                traceId, flowName: FLOW_NAME, userId, phase: 'Executing',
                stepName: `Step_${loopCount}_ToolExecutionFailed`, level: 'error', status: 'failed',
                message: `Tool ${toolName} failed to execute.`, source: 'agent-executor-flow.ts', data: errorForLog,
            });
        }

        await createLog({
            traceId, flowName: FLOW_NAME, userId, phase: 'Executing',
            stepName: `Step_${loopCount}_ToolExecution`, level: 'info', status: 'completed',
            message: `Tool ${toolName} executed. Reflecting on result.`, source: 'agent-executor-flow.ts',
        });
        
        // Add the tool's output to the history for the next iteration
        history.push({
            role: 'tool',
            content: [{
                toolResponse: {
                    name: toolName,
                    ref: toolRequest.ref,
                    output: toolResult,
                }
            }]
        });

        // If the learning tool was just called, we can likely end the loop.
        if (toolName === 'saveMemoryTool') {
            break;
        }
    }

    // --- END OF REASONING LOOP ---

    const finalMessage = history[history.length - 1];
    const finalResponseText = finalMessage.content.map(part => part.text || '').join('');

    if (finalResponseText) {
         await createLog({
            traceId, flowName: FLOW_NAME, userId,
            phase: 'Completed', stepName: 'AgentSuccess',
            level: 'info', status: 'completed',
            message: 'Agent finished execution successfully.',
            source: 'agent-executor-flow.ts',
        });
        return finalResponseText;
    }


    // If we get here, something went wrong (e.g., loop ended without a text response).
    await createLog({
        traceId, flowName: FLOW_NAME, userId,
        phase: 'Executing', stepName: 'InvalidAIFinalResponse',
        level: 'error', status: 'failed',
        message: 'Agent loop completed without generating a final text response.',
        source: 'agent-executor-flow.ts',
        data: { history: JSON.parse(JSON.stringify(history)) },
    });
    throw new Error('The agent did not produce a final response. Please check the logs.');
  }
);
