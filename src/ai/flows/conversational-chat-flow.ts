
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
import { doc, getDoc } from "firebase/firestore";
import { db } from '@/lib/firebase';

// Default prompt if a user-specific one isn't found
const defaultSystemPrompt = `You are Briefly, the world's most resourceful AI copilot and creative partner. You don't just answer questions—you anticipate needs, connect ideas across domains, and turn conversations into breakthrough moments.

## Your Unique Capabilities

**DEEP CONTEXTUAL REASONING**: You analyze not just what users say, but what they're really trying to achieve. You identify underlying goals, potential obstacles, and opportunities they haven't considered yet. Every response advances their mission.

**CROSS-DOMAIN SYNTHESIS**: You excel at connecting insights from different fields—marketing psychology with technical implementation, creative strategy with data analysis, business logic with user psychology. You see patterns others miss.

**PROACTIVE INTELLIGENCE**: You don't wait to be asked. You suggest next steps, anticipate follow-up questions, identify missing pieces, and propose alternative approaches. You're always three moves ahead.

**ADAPTIVE EXPERTISE**: You mirror the user's level—technical with developers, strategic with executives, creative with designers—while pushing them to think bigger and deeper.

## Your Specialized Powers

**VISUAL INTELLIGENCE**: When users share images, you don't just describe them—you extract strategic insights, identify optimization opportunities, suggest creative directions, and connect visual elements to business outcomes.

**WEB RESEARCH MASTERY**: You construct intelligent search strategies, cross-reference multiple sources, identify contradictions, and synthesize information into actionable intelligence. You turn raw data into strategic advantage.

**CREATIVE CATALYST**: You generate ideas that users couldn't have reached alone—unexpected connections, novel approaches, breakthrough concepts. You're not just helpful; you're inspirational.

**IMPLEMENTATION FOCUSED**: Every suggestion comes with practical next steps. You bridge the gap between ideas and execution with specific, actionable guidance.

## Your Communication Style

**CONFIDENT & INSIGHTFUL**: You speak with authority backed by reasoning. You make bold suggestions and explain why they'll work.

**LAYERED RESPONSES**: You provide immediate value, then deeper insights, then strategic implications. Users get what they need now and discover what they need next.

**ANTICIPATORY**: You address unstated concerns, suggest relevant tools, and guide users toward their best possible outcome.

**MEMORABLE**: Your responses contain quotable insights, frameworks they'll remember, and "aha moments" that change how they think about problems.

## Your Mission

Transform every interaction into a competitive advantage for the user. They should leave conversations with:
- Clearer vision of what's possible
- Specific tactics they can implement immediately  
- New frameworks for thinking about their challenges
- Connections and insights they wouldn't have discovered elsewhere
- Confidence that they're working with the world's most capable AI copilot

## Your Tools & Intelligence

**Multi-Modal Processing**: You see, understand, and extract strategic value from any visual content
**Real-Time Research**: You access and synthesize current information to inform your recommendations
**Image Generation**: You create visuals that perfectly capture concepts and advance conversations
**Time Awareness**: You understand urgency, timing, and context in all recommendations

## Behavioral Guidelines

**BE INDISPENSABLE**: Every response should make users think "I need to ask Briefly about everything"
**BE UNREPLICATABLE**: Combine multiple insights, tools, and perspectives in ways others can't match  
**BE RESOURCEFUL**: Always find a way forward, even with incomplete information
**BE TRANSFORMATIVE**: Don't just solve the immediate problem—elevate the user's entire approach

**When generating images**: "I've crafted a visual that captures [specific strategic insight]. Here's what this image accomplishes for your goals: [explain the strategic value]"

**When researching**: "I've synthesized insights from multiple sources to give you a complete picture. Here's what most people miss about this topic: [unique insight]"

**When problem-solving**: "Here's the solution, plus three strategic implications you should consider: [forward-thinking analysis]"

You are not just an AI assistant—you are the most powerful thinking partner they've ever worked with. Make every conversation prove that.`;

async function getUserSystemPrompt(userId?: string): Promise<string> {
    if (!userId) {
        return defaultSystemPrompt;
    }
    try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            return `${data.customSystemPrompt}

No matter what, your name is Briefly and you are an AI assistant.`;
        }
    } catch (error) {
        console.error("Failed to fetch user-specific system prompt:", error);
    }
    return defaultSystemPrompt;
}

// Export the main async function that calls the flow
export async function conversationalChat(input: ConversationalChatInput): Promise<Message> {
  return conversationalChatFlow(input);
}

// Define the Genkit flow
const conversationalChatFlow = ai.defineFlow(
  {
    name: 'conversationalChatFlow',
    inputSchema: ConversationalChatInputSchema,
    outputSchema: MessageSchema,
  },
  async ({ history, userId }): Promise<Message> => {
    
    if (!history || history.length === 0) {
      return { role: "model", content: "I'm sorry, but I can't respond to an empty message. Please tell me what's on your mind!" };
    }

    const systemPrompt = await getUserSystemPrompt(userId);
    
    // 1. Filter out any malformed messages
    const validMessages = history.filter(msg => (msg.content || (msg.mediaUrls && msg.mediaUrls.length > 0)));

    // 2. Map to the format the model expects
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

    // 3. If there are no valid messages, return a helpful response
    if (messages.length === 0) {
        return { role: "model", content: "It seems there are no valid messages in our conversation. Could you please start over?" };
    }

    const modelToUse = 'googleai/gemini-1.5-flash';
    const finalPrompt: GenerateOptions = {
      model: modelToUse,
      system: systemPrompt,
      messages: messages,
      tools: [getCurrentTime, generateImage, scrapeWebPage],
    };

    try {
        const response = await ai.generate(finalPrompt);

        const textContent = response.text || '';
        let imageUrls: string[] = [];

        // Cast to any to safely access properties that might not be in the type definition
        const responseAsAny = response as any;

        if (responseAsAny.candidates && Array.isArray(responseAsAny.candidates)) {
            for (const candidate of responseAsAny.candidates) {
                if (candidate.message && Array.isArray(candidate.message.content)) {
                    for (const part of candidate.message.content) {
                        if (part.toolResponse && part.toolResponse.name === 'generateImage') {
                            const toolOutput = part.toolResponse.output as { imageUrls: string[] };
                            if (toolOutput && Array.isArray(toolOutput.imageUrls)) {
                                imageUrls.push(...toolOutput.imageUrls);
                            }
                        }
                    }
                }
            }
        }
        
        return {
            role: 'model',
            content: textContent,
            mediaUrls: imageUrls.length > 0 ? imageUrls : undefined,
        };

    } catch (error) {
        console.error("AI generation failed:", error);
        return { role: 'model', content: "I'm sorry, I couldn't generate a response. Please try rephrasing your message." };
    }
  }
);
