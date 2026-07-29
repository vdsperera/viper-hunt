export class LLMService {
    constructor(apiKey = null) {
        this.apiKey = apiKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') : null) || null;
        this.hasNativeAi = typeof window !== 'undefined' && Boolean(window.ai && window.ai.languageModel);
        this.geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    }

    setApiKey(key) {
        this.apiKey = key || null;
        if (typeof localStorage !== 'undefined') {
            if (key) localStorage.setItem('gemini_api_key', key);
            else localStorage.removeItem('gemini_api_key');
        }
    }

    getApiKey() {
        return this.apiKey;
    }

    hasApiKey() {
        return Boolean(this.apiKey && String(this.apiKey).trim().length > 0);
    }

    /**
     * Call Google AI Studio Gemini API endpoint with timeout and error handling
     * @param {string} prompt
     * @param {string} systemInstruction
     * @returns {Promise<string|null>}
     */
    async _callGeminiApi(prompt, systemInstruction = "You are a dramatic cyberpunk game narrator.") {
        if (!this.hasApiKey()) return null;

        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;

        try {
            const url = `${this.geminiEndpoint}?key=${encodeURIComponent(this.apiKey)}`;
            const payload = {
                contents: [
                    {
                        parts: [{ text: `${systemInstruction}\n\nTask: ${prompt}` }]
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
                body: JSON.stringify(payload),
                signal: controller ? controller.signal : undefined
            });

            if (timeoutId) clearTimeout(timeoutId);

            if (!response.ok) {
                console.warn(`[LLMService] Gemini API returned status ${response.status}`);
                return null;
            }

            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            return text ? text.trim() : null;
        } catch (e) {
            if (timeoutId) clearTimeout(timeoutId);
            console.warn("[LLMService] Gemini API call failed, using procedural fallback:", e.message || e);
            return null;
        }
    }

    /**
     * Generate a unique 1-sentence criminal confession / last words quote
     * @param {string} criminalName Name of the criminal
     * @param {string} incident Record of the criminal's incident
     * @param {string} attackName Name/action of takedown method
     * @returns {Promise<string>} Generated confession string
     */
    async generateConfession(criminalName, incident = '', attackName = '') {
        const name = criminalName || 'Fugitive';
        const action = (attackName || '').toLowerCase();

        // 1. Attempt Gemini API if key exists
        if (this.hasApiKey()) {
            const prompt = `Generate a realistic 1-sentence cyberpunk criminal confession quote for fugitive "${name}" captured via "${attackName}". Keep it under 20 words.`;
            const geminiResponse = await this._callGeminiApi(prompt, "You are a cyberpunk game narrator.");
            if (geminiResponse) return `"${geminiResponse.replace(/^"|"$/g, '')}"`;
        }

        // 2. Attempt Native Browser Local LLM (window.ai) if available
        if (this.hasNativeAi) {
            try {
                const session = await window.ai.languageModel.create({
                    systemPrompt: "You are a dramatic cyberpunk game narrator. Generate a realistic 1-sentence criminal confession quote when captured by a hunter."
                });
                const prompt = `Generate a 1-sentence criminal confession quote for ${name} who committed: ${incident}. Capture method: ${attackName}.`;
                const response = await session.prompt(prompt);
                if (response && response.trim()) {
                    return `"${response.trim().replace(/^"|"$/g, '')}"`;
                }
            } catch (e) {
                console.warn("[LLMService] Native browser LLM prompt failed, using procedural synthesis fallback:", e);
            }
        }

        // 3. High-Variety Cyberpunk Procedural Synthesis Fallback Engine
        return this._synthesizeProceduralConfession(name, incident, action);
    }

    /**
     * Generate dynamic real-time hazard radio taunt/dispatch line
     * @param {string} hazardType 
     * @param {string} hazardName 
     * @param {number} distanceToPlayer 
     * @returns {Promise<string>}
     */
    async generateHazardTaunt(hazardType, hazardName, distanceToPlayer = 3) {
        const name = hazardName || hazardType;

        if (this.hasApiKey()) {
            const prompt = `Generate a single short tactical radio dispatch/taunt line (under 12 words) from "${name}" closing in on the player hunter at distance ${distanceToPlayer} grid cells.`;
            const result = await this._callGeminiApi(prompt, "You are a cyberpunk police and boss hazard voice radio actor.");
            if (result) return result.replace(/^"|"$/g, '');
        }

        // Fallback procedural taunts
        const policeTaunts = [
            "Unit 3: Suspect located in sector! Stand by for intercept!",
            "Police Patrol on scene! Do not attempt to evade!",
            "Target cornered! Deploy tactical containment grids!",
            "Central Dispatch: Suspect closing in. Move to block exit corridors!"
        ];
        const bossTaunts = [
            "You dare hunt in my sector, Viper?",
            "Your algorithms won't save you from my grid!",
            "No hunter leaves my territory alive!",
            "You're walking straight into my trap, hunter!"
        ];
        const reaperTaunts = [
            "Your digital thread is fraying, mortal...",
            "The reaper claims all code in the end...",
            "Your tail grows long, but death grows closer...",
            "I walk in the shadow of your trailing pulse..."
        ];

        const list = hazardType === 'police_patrol' ? policeTaunts : hazardType === 'death_reaper' ? reaperTaunts : bossTaunts;
        return list[Math.floor(Math.random() * list.length)];
    }

    /**
     * Generate dynamic cyberpunk post-match news broadcast report
     * @param {Object} sessionSummary 
     * @returns {Promise<string>}
     */
    async generateNewsBroadcast(sessionSummary = {}) {
        const score = sessionSummary.totalScore || 0;
        const captures = sessionSummary.capturesCount || 0;
        const cause = sessionSummary.causeOfDeath || 'System Shutdown';

        if (this.hasApiKey()) {
            const prompt = `Write a dramatic 2-sentence cyberpunk news broadcast summary for a hunter run: Score ${score}, Criminals Captured ${captures}, Death Cause "${cause}".`;
            const result = await this._callGeminiApi(prompt, "You are a news anchor reporting live on Night City news network.");
            if (result) return result;
        }

        return `BREAKING NEWS: Cybernetic Hunter operation terminated due to ${cause}. Operative accumulated ${score} bounty credits across ${captures} high-value criminal captures before system offline.`;
    }

    /**
     * Generate target backstory rap sheet
     * @param {string} targetName 
     * @param {number} value 
     * @returns {Promise<string>}
     */
    async generateTargetBackstory(targetName, value = 50) {
        if (this.hasApiKey()) {
            const prompt = `Generate a 1-sentence cyberpunk criminal rap sheet backstory for target "${targetName}" with bounty value ${value}. Under 15 words.`;
            const result = await this._callGeminiApi(prompt, "You are an Interpol database archivist.");
            if (result) return result;
        }

        return `Wanted for high-level neural data theft and darknet smuggling operations in Sector 9.`;
    }

    /**
     * Generate dynamic philosophical quest question for Mode 3
     * @param {number} level Level index
     * @returns {Promise<{question: string, answers: Array<{text: string, isCorrect: boolean}>}>}
     */
    async generateQuestQuestion(level) {
        if (this.hasApiKey()) {
            const prompt = `Generate a cyberpunk philosophical question with 3 choices (1 true/wise answer and 2 wrong/reckless answers) for Level ${level}. Return strictly JSON format: {"question": "...", "answers": [{"text": "...", "isCorrect": true}, {"text": "...", "isCorrect": false}, {"text": "...", "isCorrect": false}]}`;
            const result = await this._callGeminiApi(prompt, "You are a philosophical AI entity testing a human soul on the digital grid. Respond ONLY in valid JSON.");
            if (result) {
                try {
                    const parsed = JSON.parse(result.replace(/```json|```/g, '').trim());
                    if (parsed && parsed.question && Array.isArray(parsed.answers) && parsed.answers.length >= 3) {
                        return parsed;
                    }
                } catch (e) {
                    console.warn("[LLMService] Failed to parse Gemini quest question JSON, using default:", e);
                }
            }
        }

        const defaultQuestions = [
            {
                question: "When death corners you on the digital grid, what defines your true soul?",
                answers: [
                    { text: "My relentless pursuit of justice", isCorrect: true },
                    { text: "The raw bounty points accumulated", isCorrect: false },
                    { text: "The fear of turning back", isCorrect: false }
                ]
            },
            {
                question: "If a convicted fugitive asks for mercy before containment, how do you respond?",
                answers: [
                    { text: "Enforce the rule of law without malice", isCorrect: true },
                    { text: "Execute maximum tactical strike", isCorrect: false },
                    { text: "Abandon the operation", isCorrect: false }
                ]
            },
            {
                question: "What is the ultimate purpose of hunting in the dark neon shadows?",
                answers: [
                    { text: "To protect innocent lives from chaos", isCorrect: true },
                    { text: "To achieve personal glory and power", isCorrect: false },
                    { text: "To escape my own mortality", isCorrect: false }
                ]
            }
        ];

        const idx = (level - 1) % defaultQuestions.length;
        return defaultQuestions[idx];
    }

    /**
     * Synthesize procedural cyberpunk confession quote with high dynamic randomness
     */
    _synthesizeProceduralConfession(name, incident, action) {
        const policeQuotes = [
            `"You caught me, Hunter... but the shadow network will carry on without me."`,
            `"Surrendering to Police Custody wasn't in my plan, but your tactical surveillance was relentless."`,
            `"Lock me up all you want, the grid never forgets what I built."`,
            `"Handcuffs won't undo the crimes, but I know when the game is over."`,
            `"The siren lights were the last thing I expected to see tonight."`,
            `"Take me to trial then... my lawyers will decrypt what you missed."`
        ];

        const cageQuotes = [
            `"Trapped like a rat in this high-security cage... you truly are a ruthless Hunter."`,
            `"These reinforced bars can hold my body, but my legacy is already encrypted."`,
            `"You boxed me in, Hunter. I underestimated your tactical containment units."`,
            `"Brutally caged... I thought I was untouchable in this sector."`,
            `"Containment breach failed... lock the cell, Hunter."`,
            `"No exit nodes... you cornered me in a dead-end grid."`
        ];

        const shotQuotes = [
            `"You shot me down before I could execute my final protocol..."`,
            `"Taking a bullet in an operational standoff... a fitting end for a fugitive."`,
            `"My code ends here... impressive marksmanship, Hunter."`,
            `"I fought to the final second, but your firepower breached my defenses."`,
            `"Down on the cold concrete... your aim was true."`,
            `"System pulse dropping... you won this shootout, Hunter."`
        ];

        const butcherQuotes = [
            `"Slashed to pieces in my own compound... you showed zero mercy, Hunter."`,
            `"Your strike was relentless... I never even saw the blade coming."`,
            `"Eliminated without a second thought... you operate like a true machine."`,
            `"My empire crumbles here in the dust... take your bounty, Hunter."`,
            `"Merciless breach... you left nothing standing in my sanctuary."`,
            `"No compromise, no surrender... just pure tactical butcher."`
        ];

        const genericQuotes = [
            `"My reign in the shadows is over. The Hunter wins this session."`,
            `"I knew this day would come when the Viper targeted my profile."`,
            `"You tracked down every ghost trace I left behind. Well played, Hunter."`,
            `"The grid belongs to you now. My bounty is yours."`,
            `"Your hunting algorithm bypassed all my defensive nodes."`,
            `"I ran as far as the grid went, but your pursuit was unbreakable."`,
            `"No regrets for my crimes... only that I slipped up on your grid."`,
            `"Claim your reward, Hunter... another ghost scrubbed from the sector."`
        ];

        const randomIndex = Math.floor(Math.random() * 1000);

        if (action.includes('police') || action.includes('custody')) {
            return policeQuotes[randomIndex % policeQuotes.length];
        } else if (action.includes('cage') || action.includes('caging') || action.includes('contain')) {
            return cageQuotes[randomIndex % cageQuotes.length];
        } else if (action.includes('shot') || action.includes('shooting') || action.includes('firearm')) {
            return shotQuotes[randomIndex % shotQuotes.length];
        } else if (action.includes('butcher') || action.includes('butchering') || action.includes('slash')) {
            return butcherQuotes[randomIndex % butcherQuotes.length];
        }

        return genericQuotes[randomIndex % genericQuotes.length];
    }
}
