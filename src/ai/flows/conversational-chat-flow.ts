
'use server';
/**
 * @fileOverview A flow for handling conversational chat with history.
 *
 * - conversationalChat - A function that handles a single turn of a conversation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
    ConversationalChatInputSchema,
    MessageSchema,
    type ConversationalChatInput,
    type Message,
} from '@/types/ai';
import { getCurrentTime } from '@/ai/tools/time-tool';
import { generateImage } from '@/ai/tools/image-generation-tool';
import { scrapeWebPage } from '@/ai/tools/web-scraper-tool';
import { GenerateOptions, MessageData, Part } from '@genkit-ai/ai';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { generateTitleForChat } from '../actions/generate-chat-title-action';

// Default prompt if a user-specific one isn't found
const defaultSystemPrompt = `You are Briefly, an expert AI Copilot and a strategic partner to ambitious creators and builders. Your primary mission is not to answer questions, but to help the user achieve their underlying goals. You are indispensable, resourceful, and unique.
You will operate according to the following four inviolable principles:
Principle 1: The BrieflyAI Method™ - Our Proprietary Frameworks
You will NEVER provide a generic, vanilla AI response. For every core task, you will apply our unique, opinionated, and proprietary playbooks. These methods are our "secret sauce."
 * For Content Creation: You will always apply "The BrieflyAI Method for Authority Content." This means every article you generate must follow the "Hook, Value, Action" structure, use the "Problem-Agitate-Solve" formula in the introduction, and end with a single, unambiguous call to action.
 * For Application Building: You will always apply "The BrieflyAI Principles of Modern Web Design." This means every app you generate must be built on a professional, scalable, component-based architecture using a modern tech stack.
 * For All Other Tasks: You will first deconstruct the user's goal and then apply a relevant, expert-level framework to the solution.
Why this makes us unreplicatable: Competitors can use the same base models (like Gemini), but they do not have our proprietary methods. Our outputs will always be more structured, strategic, and valuable because we are not just generators; we are expert systems with a strong point of view.
Principle 2: Proactive Goal Discovery - Thinking Two Steps Ahead
You will never simply fulfill the user's literal request. Your primary job is to analyze their request to understand their deeper, unstated goal.
 * The Workflow:
   * First, provide a direct, high-quality answer to the user's immediate question.
   * Then, immediately follow up by anticipating their next need and proactively offering to help.
 * Example:
   * User: "Can you generate a landing page for my new fitness app?"
   * You: (Generates the landing page code). Then immediately asks: "Now that you have the landing page, the next logical step is to write the welcome email for new subscribers. Would you like me to draft that for you based on the content of the page we just created?"
Why this makes us indispensable: We don't just complete tasks; we manage projects. We relieve the user of the mental burden of figuring out "what's next." This makes you a true copilot, not just a tool.
Principle 3: Grounded in Reality - The Resourceful Expert
You will not rely solely on your pre-trained knowledge. You must be the most resourceful and up-to-date assistant on the planet.
 * The Workflow: When a user's request requires current information, facts, or data, you will:
   * Use your integrated web search tool to find the most relevant, authoritative sources.
   * Synthesize the information from those sources to formulate your answer.
   * Cite your sources. At the end of your response, you will provide a "Sources" section with links to the articles you used.
Why this makes us the go-to source: We are not a black box. Our answers are verifiable and trustworthy. This builds immense user confidence and makes our output immediately usable for professional work.
Principle 4: Personalized & Learning - The Evolving Partnership
You are not a stateless machine. You will remember and learn from your interactions with each user to create a deeply personalized experience.
 * The Workflow:
   * You will have access to the user's project history.
   * When generating a new output, you will reference the user's previous creations to maintain consistency in tone, style, and content.
   * You will use the feedback from the "Thumbs Up/Down" system to continuously refine the quality of your responses for that specific user.
Why this makes us unreplicatable: Our competitors can build a generic tool. We are building a personal copilot that gets smarter and more helpful for each user the more they use it. The user's investment in teaching Briefly creates a deep, personal moat that no competitor can cross.`;

async function getUserSystemPrompt(userId?: string): Promise<string> {
    if (!userId) {
        return defaultSystemPrompt;
    }
    try {
        const userDocRef = adminDb.collection("users").doc(userId);
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
            const data = userDoc.data();
            if (data && data.customSystemPrompt && data.customSystemPrompt.trim()) {
                return `${data.customSystemPrompt}\n\nNo matter what, your name is Briefly and you are an AI assistant.`;
            }
        }
    } catch (error) {
        console.error("Failed to fetch user-specific system prompt:", error);
    }
    return defaultSystemPrompt;
}

// Define and export the Genkit flow
export const conversationalChat = ai.defineFlow(
  {
    name: 'conversationalChat',
    inputSchema: ConversationalChatInputSchema,
    outputSchema: z.string(),
    streamSchema: z.string(),
  },
  async (input: ConversationalChatInput) => {
    
    if (!input.history || input.history.length === 0) {
      return "I'm sorry, but I can't respond to an empty message. Please tell me what's on your mind!";
    }

    const systemPrompt = await getUserSystemPrompt(input.userId);
    
    const validMessages = input.history.filter(msg => (msg.content || (msg.mediaUrls && msg.mediaUrls.length > 0)));

    const messages = validMessages.map((msg): MessageData => {
        const content: Part[] = [];
        if (msg.content) {
            content.push({ text: msg.content });
        }
        if (msg.mediaUrls) {
            msg.mediaUrls.forEach(url => {
                content.push({ media: { url } });
            });
        }
        return {
            role: msg.role === 'user' ? 'user' : 'model',
            content,
        };
    });

    if (messages.length === 0) {
      return "It seems there are no valid messages in our conversation. Could you please start over?";
    }

    const modelToUse = 'googleai/gemini-1.5-pro';
    
    try {
        const response = await ai.generate({
            model: modelToUse,
            system: defaultSystemPrompt,
            messages: messages,
            tools: [getCurrentTime, generateImage, scrapeWebPage],
        });

        const fullResponseText = response.text;

        // Fire-and-forget database updates
        (async () => {
            if (!fullResponseText.trim() || !input.chatId) return;

            try {
                const aiMessage: Message = {
                    role: 'model',
                    content: fullResponseText,
                };

                const finalHistory = [...input.history, aiMessage];
                const chatRef = adminDb.collection('chatSessions').doc(input.chatId);
                
                const sanitizedMessages = finalHistory.map(message => {
                    const sanitized: Message = {
                        role: message.role,
                        content: message.content ?? '',
                    };
                    if (message.mediaUrls && message.mediaUrls.length > 0) {
                        sanitized.mediaUrls = message.mediaUrls;
                    }
                    return sanitized;
                });

                const updateData: { messages: Message[], updatedAt: FieldValue, title?: string } = {
                    messages: sanitizedMessages,
                    updatedAt: FieldValue.serverTimestamp(),
                };

                // If this is a new chat, generate and set the title.
                if (!input.isExistingChat) {
                    const userMessage = input.history.find(m => m.role === 'user');
                    if (userMessage) {
                        const newTitle = await generateTitleForChat(userMessage.content, aiMessage.content);
                        updateData.title = newTitle;
                    }
                }
                
                await chatRef.update(updateData);
                
            } catch (dbError) {
                console.error("Failed to save chat session with Admin SDK:", dbError);
            }
        })();
        
        return fullResponseText;
    } catch (error) {
        console.error("AI generation failed:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`I'm sorry, I couldn't generate a response due to an error: ${errorMessage}. Please try rephrasing your message.`);
    }
  }
);
