
'use server';
/**
 * @fileOverview A flow for the autonomous agent to execute tasks.
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
      message: `Agent started for prompt: "${latestUserMessage}"`,
      source: 'agent-executor-flow.ts',
      data: { prompt: latestUserMessage },
    });

    const systemPrompt = `You are an autonomous AI agent for the application "BrieflyAI". Your purpose is to help users accomplish creative tasks by using the tools at your disposal.

You must determine which tool is best suited for the user's request, construct the correct input for that tool, and then execute it. If the user's request is conversational (e.g., "hello", "how are you?", "who are you?") or does not clearly map to a tool, you should respond naturally without using a tool.

Here are the tools available to you:
- **brieflyWrittenContentGenerator**: Use this for requests involving writing text like blog posts, emails, or articles.
- **brieflyPromptGenerator**: Use this for requests to create or optimize a prompt for another AI.
- **brieflyImageGenerator**: Use this for requests to create a visual image, photo, or drawing.
- **brieflyStructuredDataGenerator**: Use this for requests to create data in a specific format like JSON or CSV.

Analyze the user's prompt. If a tool is appropriate, call it. If not, respond as a helpful conversational assistant. After a tool returns a result, your job is to present the final output to the user in a clear and concise way. Do not just return the raw tool output. For example, if you generate an image, say "I have generated an image for you:" and then present the image URL.
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
        model: 'googleai/gemini-1.5-pro',
        prompt: [
            { role: 'system', content: [{ text: systemPrompt }] },
            ...formattedMessagesForApi,
        ],
        tools: [
          brieflyWrittenContentGenerator,
          brieflyPromptGenerator,
          brieflyImageGenerator,
          brieflyStructuredDataGenerator,
        ],
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
    
    // Case 1: A tool call is present.
    const toolCalls = response.toolCalls();
    if (toolCalls.length > 0) {
        const firstToolCall = toolCalls[0];
        const toolName = firstToolCall.toolName;

        await createLog({
            traceId,
            flowName: FLOW_NAME,
            userId,
            phase: 'Thinking',
            stepName: 'ToolDecision',
            level: 'info',
            status: 'completed',
            message: `Agent decided to use tool: ${toolName}.`,
            source: 'agent-executor-flow.ts',
            data: { toolCall: firstToolCall },
        });
        
        // Pass traceId to tools
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
            message: `Tool ${toolName} executed successfully.`,
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
            message: 'Agent is formulating the final response.',
            source: 'agent-executor-flow.ts',
        });

        const finalResponsePrompt = `The user asked me to: "${latestUserMessage}". I've used the ${toolName} tool and got this result. Please formulate a friendly and clear final response to the user, presenting this result. If the result is an image URL, embed it using markdown. Result: ${JSON.stringify(toolResult)}`;
        
        const finalResponse = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            prompt: [{ role: 'user', content: [{ text: finalResponsePrompt }] }],
        });

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
    if (textResponse && typeof textResponse === 'string' && textResponse.trim() !== '') {
        await createLog({
            traceId,
            flowName: FLOW_NAME,
            userId,
            phase: 'Completed',
            stepName: 'AgentSuccessNoTool',
            level: 'info',
            status: 'completed',
            message: 'Agent finished execution successfully without using a tool.',
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
