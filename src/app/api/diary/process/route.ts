import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Analyze the following diary entry or voice note: "${text}"

Perform the following tasks:
1. Generate a short, catchy title (max 5 words).
2. Categorize it into EXACTLY ONE of these categories: Work, Personal, Idea, Reflection.
3. Extract any actionable tasks mentioned. If none, return an empty array.

Respond STRICTLY in valid JSON format like this:
{
  "title": "Generated Title",
  "category": "Work",
  "tasks": ["Task 1", "Task 2"]
}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Extract JSON block if surrounded by markdown
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)```/) || responseText.match(/```\n([\s\S]*?)```/);
        let jsonString = jsonMatch ? jsonMatch[1].trim() : responseText.trim();

        if (jsonString.startsWith('```')) jsonString = jsonString.replace(/```/g, '');

        const parsed = JSON.parse(jsonString);

        return NextResponse.json(parsed);
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({ error: error.message || 'Failed to process' }, { status: 500 });
    }
}
