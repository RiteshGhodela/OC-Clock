import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

        const body = await req.json();
        const { messages, entryTitle, entryBody } = body;

        const genAI = new GoogleGenerativeAI(apiKey);

        const systemPrompt = `You are an AI assistant helping the user write and brainstorm for their personal diary / notes app called Horloge.
The user is currently writing an entry titled: "${entryTitle || 'Untitled'}"
The current content of the entry is:
"""
${entryBody || '(Empty)'}
"""
Provide helpful, creative, and concise responses to assist them. If they ask you to write something, provide the text clearly so they can insert it into their diary.`;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemPrompt
        });

        const historyMessages = messages ? messages.slice(0, -1) : [];
        const latestMessage = messages && messages.length > 0
            ? messages[messages.length - 1].content
            : "Hello!";

        const actualHistory = historyMessages.map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const chatSession = model.startChat({ history: actualHistory });
        const result = await chatSession.sendMessage(latestMessage);
        const text = result.response.text();

        return NextResponse.json({ reply: text });

    } catch (error: any) {
        console.error('Diary Chat API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process chat' },
            { status: 500 }
        );
    }
}
