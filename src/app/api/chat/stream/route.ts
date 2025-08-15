
import { NextResponse, type NextRequest } from 'next/server';
import { getGenerativeModel } from 'firebase/ai';
import { ai } from '@/ai/genkit';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { generateTitleForChat } from '@/ai/actions/generate-chat-title-action';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
	try {
		const { history, userId, chatId, isExistingChat } = await req.json();

		if (!history || !Array.isArray(history) || history.length === 0) {
			return NextResponse.json({ error: 'Valid history is required' }, { status: 400 });
		}

		const lastMessage = history[history.length - 1];
		if (!lastMessage || lastMessage.role !== 'user' || !lastMessage.content) {
			return NextResponse.json({ error: 'Last history entry must be a user message with content' }, { status: 400 });
		}

		const model = getGenerativeModel(ai as any, { model: 'gemini-1.5-flash' });

		// Map prior messages into the expected history format for the Gemini chat
		const priorMessages = history
			.slice(0, -1)
			.filter((m: any) => (m.content && m.content.trim().length > 0))
			.map((m: any) => ({
				role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
				parts: [{ text: m.content }],
			})) as any;

		const chat = model.startChat({
			history: priorMessages,
			generationConfig: {
				maxOutputTokens: 2048,
				temperature: 0.7,
			},
		});

		const result = await chat.sendMessageStream(lastMessage.content);

		let fullResponseText = '';
		const encoder = new TextEncoder();

		const stream = new ReadableStream<Uint8Array>({
			async start(controller) {
				try {
					for await (const chunk of result.stream) {
						const chunkText = chunk.text();
						fullResponseText += chunkText;
						controller.enqueue(encoder.encode(chunkText));
					}

					// Persist the final AI message to Firestore
					if (chatId && fullResponseText.trim().length > 0) {
						const sanitizedMessages = [...history, { role: 'model', content: fullResponseText }].map((message: any) => {
							const sanitized: any = { role: message.role, content: message.content ?? '' };
							if (message.mediaUrls && Array.isArray(message.mediaUrls) && message.mediaUrls.length > 0) {
								sanitized.mediaUrls = message.mediaUrls;
							}
							return sanitized;
						});

						const updateData: { messages: any[]; updatedAt: FieldValue; title?: string } = {
							messages: sanitizedMessages,
							updatedAt: FieldValue.serverTimestamp(),
						};

						if (!isExistingChat) {
							try {
								const userMsg = lastMessage.content as string;
								const newTitle = await generateTitleForChat(userMsg, fullResponseText);
								if (newTitle && newTitle.trim().length > 0) {
									updateData.title = newTitle;
								}
							} catch (e) {
								console.error('Failed to generate title:', e);
							}
						}

						await adminDb.collection('chatSessions').doc(String(chatId)).update(updateData);
					}
				} catch (e) {
					console.error('Streaming error:', e);
					// Surface a simple error chunk to the client before closing
					controller.enqueue(encoder.encode(`\n[Error] ${e instanceof Error ? e.message : 'Unknown error'}`));
				} finally {
					controller.close();
				}
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
