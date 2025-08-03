
import { conversationalChat } from '@/ai/flows/conversational-chat-flow';
import { ConversationalChatInputSchema } from '@/types/ai';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  try {
    const input = ConversationalChatInputSchema.parse(body);
    
    const responseText = await conversationalChat(input);

    return NextResponse.json({ response: responseText });

  } catch (e: any) {
    console.error('API Error:', e);
    return NextResponse.json({ error: e.message || 'An error occurred.' }, { status: 500 });
  }
}
