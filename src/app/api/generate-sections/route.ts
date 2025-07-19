// This API route has been removed as the feature is no longer available.
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'This feature is no longer available.' }, { status: 410 });
}
