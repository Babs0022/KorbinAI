
import { conversationalChat } from '@/ai/flows/conversational-chat-flow';
import { ConversationalChatInputSchema } from '@/types/ai';
import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { MessageData, Part } from '@genkit-ai/ai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  try {
    const input = ConversationalChatInputSchema.parse(body);
    
    // Check if streaming is requested
    const shouldStream = body.stream === true;
    
    if (shouldStream) {
      // Create streaming response using Genkit directly
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

      const response = await ai.generate({
        model: 'googleai/gemini-2.5-pro',
        system: `You are Korbin, an expert AI Copilot and a strategic partner to ambitious creators and builders. Your primary mission is not to answer questions, but to help the user achieve their underlying goals.`,
        messages: messages,
      });

      // Create a readable stream from the response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Since Genkit doesn't support streaming directly in this way,
            // we'll simulate streaming by sending the response in chunks
            const responseText = response.text;
            const chunkSize = 10; // Send 10 characters at a time
            
            for (let i = 0; i < responseText.length; i += chunkSize) {
              const chunk = responseText.slice(i, i + chunkSize);
              controller.enqueue(chunk);
              // Add a small delay to simulate real streaming
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Return regular response for backward compatibility
      const responseText = await conversationalChat(input);
      return NextResponse.json({ response: responseText });
    }

  } catch (e: any) {
    console.error('API Error:', e);
    return NextResponse.json({ error: e.message || 'An error occurred.' }, { status: 500 });
  }
}
