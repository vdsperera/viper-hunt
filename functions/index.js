const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

/**
 * Firebase Cloud Function: Secure Proxy for Gemini AI Narration Requests
 * 
 * Securely holds GEMINI_API_KEY server-side in environment variables,
 * preventing browser key exposure, enabling rate limiting & input truncation,
 * and forwarding requests to Google AI Studio models.
 */
exports.generateNarration = onRequest({ cors: true }, async (req, res) => {
    // 1. Enforce HTTP POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    }

    // 2. Retrieve Server-Side Gemini API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
        logger.error("[Proxy Error] GEMINI_API_KEY environment variable is not configured on server.");
        return res.status(500).json({ error: "Server LLM API Key unconfigured." });
    }

    // 3. Extract and sanitize payload
    const { prompt, systemInstruction } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ error: "Missing or invalid 'prompt' parameter." });
    }

    // Truncate inputs to prevent prompt injection abuse and control token costs
    const sanitizedPrompt = prompt.trim().slice(0, 500);
    const sanitizedInstruction = (typeof systemInstruction === 'string' && systemInstruction.trim())
        ? systemInstruction.trim().slice(0, 250)
        : "You are a dramatic cyberpunk game narrator.";

    // 4. Candidate models fallback chain
    const candidateModels = [
        'gemma-4-26b-a4b-it',
        'gemma-4-31b-it',
        'gemini-3.6-flash',
        'gemini-3.5-flash'
    ];

    for (const model of candidateModels) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
            const payload = {
                contents: [
                    {
                        parts: [{ text: `${sanitizedInstruction}\n\nTask: ${sanitizedPrompt}` }]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 150
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text && text.trim()) {
                    return res.status(200).json({ text: text.trim() });
                }
            } else {
                logger.warn(`[Proxy Warning] Model ${model} returned status ${response.status}`);
            }
        } catch (err) {
            logger.warn(`[Proxy Warning] Model ${model} request failed:`, err.message || err);
        }
    }

    return res.status(502).json({ error: "Narration generation failed across all model fallbacks." });
});
