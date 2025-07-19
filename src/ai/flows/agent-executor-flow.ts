
'use server';
/**
 * @fileOverview A flow for the autonomous agent to execute tasks.
 *
 * - agentExecutor - A function that interprets a user request and uses available tools to fulfill it.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import {
  brieflyImageGenerator,
  brieflyPromptGenerator,
  brieflyStructuredDataGenerator,
  brieflyWrittenContentGenerator,
} from '@/ai/tools/briefly-tools';
import { createLog } from '@/services/loggingService'; 
import { AgentExecutionInputSchema, type AgentExecutionInput } from '@/types/ai';

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
    const traceId = nanoid();
    const startTime = Date.now();
    const source = 'src/ai/flows/agent-executor-flow.ts';
    
    const latestUserMessage = messages[messages.length - 1]?.content || '';
    
    await createLog({
        traceId,
        flowName: FLOW_NAME,
        userId,
        level: 'info',
        status: 'started',
        message: `Agent execution started for prompt: "${latestUserMessage}"`,
        source,
        data: { messages },
    });

    const systemPrompt = `You are an autonomous AI agent for the application "BrieflyAI". Your purpose is to help users accomplish creative tasks by using the tools at your disposal.

You must determine which tool is best suited for the user's request, construct the correct input for that tool, and then execute it.

Here are the tools available to you:
- **brieflyWrittenContentGenerator**: Use this for requests involving writing text like blog posts, emails, or articles.
- **brieflyPromptGenerator**: Use this for requests to create or optimize a prompt for another AI.
- **brieflyImageGenerator**: Use this for requests to create a visual image, photo, or drawing.
- **brieflyStructuredDataGenerator**: Use this for requests to create data in a specific format like JSON or CSV.

Analyze the user's prompt and execute the most appropriate tool. If no tool is appropriate for a simple greeting or conversation, just respond naturally.

After a tool returns a result, your job is complete. You should then present the final output to the user in a clear and concise way. Do not just return the raw tool output. For example, if you generate an image, say "I have generated an image for you:" and then present the image URL.
`;

    const formattedMessagesForApi = messages
      .map(message => {
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
        if (parts.length === 0) return null;
        return {
          role: message.role,
          content: parts,
        };
      })
      .filter(m => m !== null && m.role !== 'system');


    let response;
    try {
      response = await ai.generate({
        model: 'googleai/gemini-2.5-pro',
        messages: [
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
      const executionTimeMs = Date.now() - startTime;
      const errorForLog = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { data: JSON.stringify(error) };
      await createLog({
        traceId,
        flowName: FLOW_NAME,
        userId,
        level: 'error',
        status: 'failed',
        message: 'Agent failed to generate a response during ai.generate() call.',
        source,
        data: errorForLog,
        executionTimeMs,
      });
      throw new Error('The agent failed to generate a response. Please check the logs for more details.');
    }
    
    // Case 1: A tool call is present.
    if (response.choices?.[0]?.toolCalls?.length > 0) {
        const firstChoice = response.choices[0];
        const toolName = firstChoice.toolCalls[0].toolName;

        await createLog({
            traceId,
            flowName: FLOW_NAME,
            userId,
            level: 'info',
            status: 'started',
            message: `Agent decided to use tool: ${toolName}.`,
            source,
            data: { toolCall: firstChoice.toolCalls[0] },
        });
        
        const toolResult = await firstChoice.callTools();

        await createLog({
            traceId,
            flowName: FLOW_NAME,
            userId,
            level: 'info',
            status: 'completed',
            message: `Tool ${toolName} returned a result.`,
            source,
            data: { toolResult },
        });

        const finalResponsePrompt = `The user asked me to: "${latestUserMessage}". I've used the ${toolName} tool and got this result. Please formulate a friendly and clear final response to the user, presenting this result. If the result is an image URL, embed it using markdown. Result: ${JSON.stringify(toolResult[0].output)}`;
        const finalResponse = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            messages: [{ role: 'user', content: [{ text: finalResponsePrompt }] }],
        });

        await createLog({
            traceId,
            flowName: FLOW_NAME,
            userId,
            level: 'info',
            status: 'completed',
            message: 'Agent finished execution successfully with tool.',
            source,
            executionTimeMs: Date.now() - startTime,
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
            level: 'info',
            status: 'completed',
            message: 'Agent finished execution successfully without using a tool.',
            source,
            data: { response: textResponse },
            executionTimeMs: Date.now() - startTime,
        });
        return textResponse;
    }

    // Case 3: Invalid response from the AI.
    const executionTimeMs = Date.now() - startTime;
    await createLog({
        traceId,
        flowName: FLOW_NAME,
        userId,
        level: 'error',
        status: 'failed',
        message: 'Agent received an invalid response from the AI (no tool call and no parsable text).',
        source,
        data: { response: JSON.parse(JSON.stringify(response)) },
        executionTimeMs,
    });
    throw new Error('The agent received an invalid response from the AI. Please check the logs for more details.');
  }
);
