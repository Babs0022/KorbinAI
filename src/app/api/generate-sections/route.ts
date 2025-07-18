
import { NextResponse, type NextRequest } from 'next/server';
import { generateSectionSuggestions } from '@/ai/flows/generate-section-suggestions-flow';
import { cookies } from 'next/headers';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// This must be done without arguments to use Application Default Credentials
// which works for both local development (via gcloud auth) and deployed environments.
if (!admin.apps.length) {
    admin.initializeApp();
}

export async function POST(request: NextRequest) {
  try {
    const idToken = cookies().get('firebaseIdToken')?.value;
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify the ID token to authenticate the user.
    await admin.auth().verifyIdToken(idToken);
    
    const { description } = await request.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'Description is required and must be a string.' }, { status: 400 });
    }

    const result = await generateSectionSuggestions({ description });
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[API/generate-sections] Error:', error);
    
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
        return NextResponse.json({ error: 'Unauthorized. Please sign in again.' }, { status: 401 });
    }

    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
