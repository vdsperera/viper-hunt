export class ConfigManager {
    constructor() {
        this.rawFirebaseConfig = null;
        
        this.defaultRules = {
            useCloudConfig: true,
            enableHitFreeze: false,
            enableBarricades: false,
            showCriminalPunishmentLog: false,
            voiceStyle: 'tactical_swat',
            fps: 12,
            targetsPerLevel: 5,
            maxSimultaneousTargets: 3,
            maxLevels: 1,
            levelTargetSpecs: [
                { level: 1, targetValues: [20, 20, 50, 70, 100] },
                { level: 2, targetValues: [30, 40, 60, 80, 100] },
                { level: 3, targetValues: [50, 60, 75, 90, 100] }
            ],
            growthLow: 1,
            growthMedium: 2,
            growthHigh: 3,
            growthElite: 4,
            bossMoveChance: 0.4,
            bossAggressiveness: 0.6,
            bossMoveRange: 1,
            emotionalQuestions: [
                {
                    level: 1,
                    question: "What gives you strength when facing despair?",
                    answers: [
                        { text: "Unwavering Hope", value: 50 },
                        { text: "Fiery Passion", value: 70 },
                        { text: "Silent Resilience", value: 90 }
                    ]
                },
                {
                    level: 2,
                    question: "What is your greatest vulnerability?",
                    answers: [
                        { text: "Blind Trust", value: 40 },
                        { text: "Fear of Failure", value: 60 },
                        { text: "Solitude", value: 80 }
                    ]
                },
                {
                    level: 3,
                    question: "What guides your ultimate destiny?",
                    answers: [
                        { text: "Duty & Honor", value: 60 },
                        { text: "Free Will", value: 85 },
                        { text: "Courage", value: 100 }
                    ]
                }
            ],
            attackTypes: [
                {
                    id: 'police',
                    key: '1',
                    name: 'Police Custody',
                    pastAction: 'Handed to Police',
                    icon: '👮',
                    multiplier: 1.0,
                    uses: -1,
                    color: '#00f0ff',
                    policeDelta: -1,
                    crimeBossDelta: 0,
                    alignmentScore: 10,
                    riskDescription: 'Low Reward, Reduces Police Heat'
                },
                {
                    id: 'caging',
                    key: '2',
                    name: 'Brutally Caged',
                    pastAction: 'Brutally Caged',
                    icon: '🔒',
                    multiplier: 1.2,
                    uses: 5,
                    color: '#ffb800',
                    policeDelta: 0,
                    crimeBossDelta: 0,
                    alignmentScore: -5,
                    riskDescription: '1.2x Reward, Neutral Risk'
                },
                {
                    id: 'shooting',
                    key: '3',
                    name: 'Shot Down',
                    pastAction: 'Shot Down in Action',
                    icon: '🎯',
                    multiplier: 1.5,
                    uses: 3,
                    color: '#ff0055',
                    policeDelta: 1,
                    crimeBossDelta: 0,
                    alignmentScore: -15,
                    riskDescription: '1.5x Reward, Spawns +1 Police Patrol'
                },
                {
                    id: 'butchering',
                    key: '4',
                    name: 'Ruthlessly Butchered',
                    pastAction: 'Ruthlessly Butchered',
                    icon: '🪓',
                    multiplier: 2.0,
                    uses: 2,
                    color: '#aa00ff',
                    policeDelta: 1,
                    crimeBossDelta: 1,
                    alignmentScore: -30,
                    riskDescription: '2.0x Reward, Spawns +1 Boss & +1 Police'
                }
            ],
            levelHazards: [
                { level: 1, hazards: [{ type: 'crime_boss', name: 'Crime Boss', icon: '🦹', color: '#ff0055', count: 1 }] },
                { level: 2, hazards: [{ type: 'crime_boss', name: 'Crime Boss', icon: '🦹', color: '#ff0055', count: 1 }, { type: 'police_patrol', name: 'Police Patrol', icon: '🚔', color: '#0088ff', count: 1 }] },
                { level: 3, hazards: [{ type: 'crime_boss', name: 'Crime Boss', icon: '🦹', color: '#ff0055', count: 1 }, { type: 'police_patrol', name: 'Police Patrol', icon: '🚔', color: '#0088ff', count: 1 }, { type: 'death_reaper', name: 'Death Reaper', icon: '💀', color: '#aa00ff', count: 1 }] }
            ],
            enableGeminiAI: true,
            enableWeatherSystem: true,
            geminiProxyUrl: ''
        };

        this.gameRules = { ...this.defaultRules };
    }

    async loadLocalConfig() {
        try {
            const configModule = await import('../firebase-config.js?t=' + Date.now());
            const rawConfig = configModule.firebaseConfig || configModule.default || configModule;
            
            if (rawConfig && rawConfig.apiKey) {
                const isPlaceholder = !rawConfig ||
                    !rawConfig.apiKey ||
                    rawConfig.apiKey.includes("YOUR_") ||
                    rawConfig.projectId.includes("YOUR_");

                if (!isPlaceholder) {
                    this.rawFirebaseConfig = rawConfig;
                    
                    // Override local defaults with explicitly defined firebaseConfig keys
                    if (this.rawFirebaseConfig.enableGeminiAI !== undefined) this.defaultRules.enableGeminiAI = this.rawFirebaseConfig.enableGeminiAI;
                    if (this.rawFirebaseConfig.enableWeatherSystem !== undefined) this.defaultRules.enableWeatherSystem = this.rawFirebaseConfig.enableWeatherSystem;
                    if (this.rawFirebaseConfig.useCloudConfig !== undefined) this.defaultRules.useCloudConfig = this.rawFirebaseConfig.useCloudConfig;
                    if (this.rawFirebaseConfig.geminiProxyUrl !== undefined) this.defaultRules.geminiProxyUrl = this.rawFirebaseConfig.geminiProxyUrl;
                    
                    this.gameRules = { ...this.defaultRules };
                }
            }
        } catch (e) {
            console.warn("[ConfigManager] Local firebase-config.js load skipped or failed. Using internal defaults.", e);
        }
    }

    async syncWithCloud(firebaseService) {
        if (!firebaseService) return;
        
        const allowCloud = this.gameRules.useCloudConfig !== false;
        
        if (allowCloud) {
            try {
                const cloudRules = await firebaseService.getGameRules();
                if (cloudRules) {
                    Object.keys(cloudRules).forEach(key => {
                        if (cloudRules[key] !== undefined) {
                            this.gameRules[key] = cloudRules[key];
                        }
                    });
                    console.log("[ConfigManager] Game rules successfully loaded from Firestore:", this.gameRules);
                }
            } catch (e) {
                console.warn("[ConfigManager] Failed to load rules from Firestore. Using local rules.", e);
            }
        } else {
            console.log("[ConfigManager] Local testing mode active (useCloudConfig: false). Using local rules directly:", this.gameRules);
        }
    }

    getRawFirebaseConfig() {
        return this.rawFirebaseConfig;
    }

    get(key) {
        return this.gameRules[key];
    }
    
    getAll() {
        return this.gameRules;
    }

    isFeatureEnabled(featureName) {
        switch (featureName.toUpperCase()) {
            case 'GEMINI':
                return this.gameRules.enableGeminiAI !== false;
            case 'WEATHER':
                return this.gameRules.enableWeatherSystem !== false;
            case 'HIT_FREEZE':
                return this.gameRules.enableHitFreeze === true;
            case 'BARRICADES':
                return this.gameRules.enableBarricades === true;
            default:
                return false;
        }
    }

    getGeminiProxyUrl() {
        return (this.gameRules.geminiProxyUrl && this.gameRules.geminiProxyUrl.trim()) || '';
    }
}

export const configManager = new ConfigManager();
