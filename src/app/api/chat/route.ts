
import { conversationalChat, StreamPartSchema } from '@/ai/flows/conversational-chat-flow';
import { ConversationalChatInputSchema } from '@/types/ai';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  try {
    const input = ConversationalChatInputSchema.parse(body);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const onStream = (part: any) => {
          try {
            const validatedPart = StreamPartSchema.parse(part);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(validatedPart)}\n\n`));
          } catch (e) {
            console.error('Stream validation error:', e);
          }
        };

        try {
          // We don't await this call, as we want to return the stream immediately.
          // The flow will run in the background and push data to the stream.
          conversationalChat({ ...input, onStream })
            .catch(e => {
              console.error('Flow execution error:', e);
              const errorPayload = { type: 'error', payload: { message: e.message || 'An unknown error occurred.' } };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorPayload)}\n\n`));
            })
            .finally(() => {
              controller.close();
            });
        } catch (e: any) {
          console.error('Error starting flow:', e);
          const errorPayload = { type: 'error', payload: { message: e.message || 'An unknown error occurred.' } };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorPayload)}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (e: any) {
    console.error('API Error:', e);
    // This will catch errors in parsing the request body, for example.
    const errorPayload = { type: 'error', payload: { message: e.message || 'An unknown error occurred.' } };
    return new Response(`data: ${JSON.stringify(errorPayload)}\n\n`, {
      status: 500,
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }
}
