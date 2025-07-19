
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
import { saveAgentLog } from '@/services/agentLogService';
import type { AgentExecutionInput } from '@/types/ai';

const AgentExecutionInputSchema = z.object({
  userId: z.string().optional().describe("The ID of the user making the request."),
  prompt: z.string().describe("The user's high-level request for the agent to perform."),
});

// Export the main async function that calls the flow
export async function agentExecutor(input: AgentExecutionInput): Promise<string> {
  return agentExecutorFlow(input);
}

// Define the Genkit flow for the agent
const agentExecutorFlow = ai.defineFlow(
  {
    name: 'agentExecutorFlow',
    inputSchema: AgentExecutionInputSchema,
    outputSchema: z.string(),
  },
  async ({ userId, prompt }) => {
    
    await saveAgentLog({ userId, type: 'start', message: `Agent started for prompt: "${prompt}"` });

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
    let response;
    try {
      response = await ai.generate({
        model: 'googleai/gemini-1.5-pro-latest',
        system: systemPrompt,
        prompt: `User's Request: "${prompt}"`,
        tools: [
          brieflyWrittenContentGenerator,
          brieflyPromptGenerator,
          brieflyImageGenerator,
          brieflyStructuredDataGenerator,
        ],
      });

    } catch (error) {
      console.error('Error calling ai.generate():', error);
      const errorForFirestore = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { data: JSON.stringify(error) };
      await saveAgentLog({ userId, type: 'error', message: 'Agent failed to generate a response.', data: errorForFirestore });
      throw new Error('The agent failed to generate a response. Please check the logs for more details.');
    }
    
    if (!response || !response.choices || response.choices.length === 0) {
      console.error('Invalid response from ai.generate():', response);
      await saveAgentLog({ userId, type: 'error', message: 'Agent received an invalid response from the AI.', data: { response: JSON.parse(JSON.stringify(response)) } });
      throw new Error('The agent received an invalid response from the AI. Please check the logs for more details.');
    }

    const firstChoice = response.choices[0];
    
    // Check if the model decided to use a tool
    if (firstChoice.toolCalls && firstChoice.toolCalls.length > 0) {
        await saveAgentLog({ userId, type: 'info', message: `Agent decided to use tool: ${firstChoice.toolCalls[0].toolName}.` });
        const toolResult = await firstChoice.callTools();
        await saveAgentLog({ userId, type: 'result', message: `Tool returned a result.`, data: toolResult[0].output });

        // Generate a final, user-friendly response based on the tool's output
        const finalResponse = await ai.generate({
            model: 'googleai/gemini-1.5-flash', // Use a faster model for simple summarization
            prompt: `The user asked me to: "${prompt}". I've used the ${firstChoice.toolCalls[0].toolName} tool and got this result. Please formulate a friendly and clear final response to the user, presenting this result. If the result is an image URL, embed it using markdown. Result: ${JSON.stringify(toolResult[0].output)}`
        });

        await saveAgentLog({ userId, type: 'finish', message: 'Agent finished execution.' });
        return finalResponse.text;

    } else {
        // If the model doesn't use a tool, return its direct text response.
        await saveAgentLog({ userId, type: 'finish', message: 'Agent finished execution without using a tool.' });
        return firstChoice.text;
    }
  }
);
