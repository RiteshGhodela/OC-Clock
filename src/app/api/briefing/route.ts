import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULTS = {
    events: [],
    notes: [],
    weatherUrl: process.env.OPENWEATHER_API_KEY || ''
};

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

        const body = await req.json();
        const { dateKey, events, notes, diaryEntries } = body;

        let weatherSummary = "Weather data unavailable.";
        try {
            if (DEFAULTS.weatherUrl) {
                const wRes = await fetch(DEFAULTS.weatherUrl);
                if (wRes.ok) {
                    const wData = await wRes.json();
                    // Basic extraction: current temp and daily max/min
                    const temp = wData.hourly?.temperature_2m?.[0] || 'Unknown';
                    const maxT = wData.daily?.temperature_2m_max?.[0] || 'Unknown';
                    const minT = wData.daily?.temperature_2m_min?.[0] || 'Unknown';
                    weatherSummary = `Currently ${temp}°C. High ${maxT}°C, Low ${minT}°C.`;
                }
            }
        } catch (we) {
            console.error("Failed to fetch weather:", we);
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
You are 'Horloge', a personal AI assistant. Generate a Morning Briefing for the user.
Tone: Professional, friendly, encouraging, strictly spoken style (like a radio host or personal butler). No asterisks, markdown, or bullet points. Just natural flowing sentences.

Here is the data for today (${dateKey}):
- Weather: ${weatherSummary}
- Calendar Events (${(events || []).length}): ${(events || []).map((e: any) => e.title + ' at ' + e.startTime).join(', ')}
- Calendar Notes: ${(notes || []).map((n: any) => n.text).join('; ')}
- Recent Diary Thoughts: ${(diaryEntries || []).map((d: any) => d.title).join(', ')}

First, greet the user with a good morning.
Then give a very brief weather summary.
Then summarize their schedule/agenda.
End with a short encouraging closing.
Keep it strictly under 100 words. Speak naturally.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/\*/g, '').replace(/_/g, '').trim();

        // Also try sending it to Telegram
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
            const tgUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
            fetch(tgUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_CHAT_ID,
                    text: "🌅 *Horloge Morning Briefing*\\n\\n" + text,
                    parse_mode: 'Markdown' // but text itself is stripped of markdown to prevent syntax errors
                })
            }).catch(e => console.error("Telegram send failed:", e));
        }

        return NextResponse.json({ briefing: text });

    } catch (error: any) {
        console.error('Briefing API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process briefing' },
            { status: 500 }
        );
    }
}
