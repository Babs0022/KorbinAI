
import { generateAppStream } from '@/ai/flows/generate-component-flow';
import type { GenerateAppInput } from '@/types/ai';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body: GenerateAppInput = await req.json();

    if (!body.description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }
    
    const stream = await generateAppStream(body);
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error: any) {
    console.error('[API/generate-app-stream] Error:', error);
    const errorMessage = error.message || 'An internal server error occurred.';
    // Ensure we send a proper JSON error response
    return NextResponse.json(
        { error: `Failed to get a valid stream from the AI service. Reason: ${errorMessage}` }, 
        { status: 500 }
    );
  }
}
