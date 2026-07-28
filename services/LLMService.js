export class LLMService {
    constructor() {
        this.hasNativeAi = typeof window !== 'undefined' && Boolean(window.ai && window.ai.languageModel);
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

        // 1. Attempt Native Browser Local LLM (window.ai) if available
        if (this.hasNativeAi) {
            try {
                const session = await window.ai.languageModel.create({
                    systemPrompt: "You are a dramatic cyberpunk game narrator. Generate a realistic 1-sentence criminal confession quote when captured by a hunter."
                });
                const prompt = `Generate a 1-sentence criminal confession quote for ${name} who committed: ${incident}. Capture method: ${attackName}.`;
                const response = await session.prompt(prompt);
                if (response && response.trim()) {
                    return `"${response.trim()}"`;
                }
            } catch (e) {
                console.warn("[LLMService] Native browser LLM prompt failed, using procedural synthesis fallback:", e);
            }
        }

        // 2. High-Variety Cyberpunk Procedural Synthesis Fallback Engine
        return this._synthesizeProceduralConfession(name, incident, action);
    }

    /**
     * Synthesize procedural cyberpunk confession quote
     */
    _synthesizeProceduralConfession(name, incident, action) {
        const policeQuotes = [
            `"You caught me, Hunter... but the shadow network will carry on without me."`,
            `"Surrendering to Police Custody wasn't in my plan, but your tactical surveillance was relentless."`,
            `"Lock me up all you want, the grid never forgets what I built."`,
            `"Handcuffs won't undo the crimes, but I know when the game is over."`
        ];

        const cageQuotes = [
            `"Trapped like a rat in this high-security cage... you truly are a ruthless Hunter."`,
            `"These reinforced bars can hold my body, but my legacy is already encrypted."`,
            `"You boxed me in, Hunter. I underestimated your tactical containment units."`,
            `"Brutally caged... I thought I was untouchable in this sector."`
        ];

        const shotQuotes = [
            `"You shot me down before I could execute my final protocol..."`,
            `"Taking a bullet in an operational standoff... a fitting end for a fugitive."`,
            `"My code ends here... impressive marksmanship, Hunter."`,
            `"I fought to the final second, but your firepower breached my defenses."`
        ];

        const butcherQuotes = [
            `"Slashed to pieces in my own compound... you showed zero mercy, Hunter."`,
            `"Your strike was relentless... I never even saw the blade coming."`,
            `"Eliminated without a second thought... you operate like a true machine."`,
            `"My empire crumbles here in the dust... take your bounty, Hunter."`
        ];

        const genericQuotes = [
            `"My reign in the shadows is over. The Hunter wins this session."`,
            `"I knew this day would come when the Viper targeted my profile."`,
            `"You tracked down every ghost trace I left behind. Well played, Hunter."`,
            `"The grid belongs to you now. My bounty is yours."`
        ];

        // Deterministic hash based on criminal name to select consistent variety
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = (hash << 5) - hash + name.charCodeAt(i);
            hash |= 0;
        }
        const index = Math.abs(hash);

        if (action.includes('police')) {
            return policeQuotes[index % policeQuotes.length];
        } else if (action.includes('cage') || action.includes('caging')) {
            return cageQuotes[index % cageQuotes.length];
        } else if (action.includes('shot') || action.includes('shooting')) {
            return shotQuotes[index % shotQuotes.length];
        } else if (action.includes('butcher') || action.includes('butchering')) {
            return butcherQuotes[index % butcherQuotes.length];
        }

        return genericQuotes[index % genericQuotes.length];
    }

    /**
     * Generate dynamic philosophical quest question for Mode 3
     * @param {number} level Level index
     * @returns {Promise<{question: string, answers: Array<{text: string, isCorrect: boolean}>}>}
     */
    async generateQuestQuestion(level) {
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
}
