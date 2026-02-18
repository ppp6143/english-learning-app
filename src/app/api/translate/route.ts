import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { words } = body as { words: { word: string; context: string }[] };

        if (!words || !Array.isArray(words) || words.length === 0) {
            return NextResponse.json({ error: 'No words provided' }, { status: 400 });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const wordList = words
            .map((w, i) => `${i + 1}. "${w.word}" — context: "${w.context}"`)
            .join('\n');

        const prompt = `You are an English-Japanese translator for language learners.

For each English word below, provide the most appropriate Japanese translation(s) based on the given context.

Rules:
- Give 1 to 3 SHORT Japanese translations (訳語) for each word
- The FIRST translation must be the most contextually appropriate one
- Use simple, commonly-used Japanese words
- Return ONLY concise translations (e.g. "含む", "関わる"), NOT long explanations
- For common words like "the", "a", "is", return basic translations like "その", "一つの", "〜である"

Words:
${wordList}

Respond in STRICT JSON format only, no markdown code fences:
[{"word":"original","ja":["best translation","alternative1","alternative2"]}]`;

        // Retry with exponential backoff for rate limit (429) errors
        const MAX_RETRIES = 3;
        let rawText = '';

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            const geminiRes = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 4096,
                    },
                }),
            });

            if (geminiRes.ok) {
                const data = await geminiRes.json();
                rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
                break;
            }

            if (geminiRes.status === 429 && attempt < MAX_RETRIES) {
                const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
                console.log(`Gemini rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }

            const errText = await geminiRes.text();
            console.error('Gemini API error:', geminiRes.status, errText);
            return NextResponse.json(
                { error: `Gemini API error: ${geminiRes.status}` },
                { status: geminiRes.status }
            );
        }

        // Parse JSON from response
        let cleaned = rawText.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
        }

        try {
            const parsed = JSON.parse(cleaned);
            return NextResponse.json({ translations: parsed });
        } catch {
            console.error('Failed to parse Gemini response:', cleaned);
            return NextResponse.json(
                { error: 'Failed to parse response', raw: cleaned },
                { status: 500 }
            );
        }
    } catch (err) {
        console.error('Translation API error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
