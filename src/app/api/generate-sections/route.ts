
import { NextResponse, type NextRequest } from 'next/server';
import { generateSectionSuggestions } from '@/ai/flows/generate-section-suggestions-flow';

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'Description is required and must be a string.' }, { status: 400 });
    }

    const result = await generateSectionSuggestions({ description });
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[API/generate-sections] Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
