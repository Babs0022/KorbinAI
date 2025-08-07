
import { NextResponse, type NextRequest } from 'next/server';
import { getGenerativeModel } from "firebase/ai";
import { app as firebaseApp } from '@/lib/firebase'; // Correctly import the initialized Firebase app
import { genkit } from 'genkit'; // Import genkit itself
import { googleAI } from '@genkit-ai/googleai'; // Import the plugin

// This is the correct way to initialize the AI object for server-side use.
// It should not be imported from the client-side firebase config.
const ai = genkit({
  plugins: [
      googleAI(),
  ],
});


export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const model = getGenerativeModel(ai as any, { model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Hello, I have 2 dogs in my house." }],
        },
        {
          role: "model",
          parts: [{ text: "Great to meet you. What would you like to know?" }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 100,
      },
    });

    const result = await chat.sendMessageStream(message);

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          controller.enqueue(chunkText);
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('Error in chat streaming:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
