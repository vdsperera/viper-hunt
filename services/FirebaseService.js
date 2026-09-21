/**
 * FirebaseService
 * Handles communication with Cloud Firestore for saving/loading profiles and scores.
 * Implements a Dependency Injection pattern to remain fully testable in Node.js,
 * and falls back gracefully to localStorage if Firebase is unconfigured or offline.
 */
export class FirebaseService {
    /**
     * @param {Object} sdk - The Firebase SDK methods: { initializeApp, getFirestore, collection, getDocs, doc, getDoc, setDoc }
     * @param {Object} config - Firebase configuration credentials
     */
    constructor(sdk = null, config = null) {
        this.sdk = sdk;
        this.config = config;
        this.db = null;
        this.isInitialized = false;

        this.init();
    }

    init() {
        if (!this.sdk || !this.config) {
            console.warn("[FirebaseService] SDK or configuration missing. Running in LOCAL fallback mode.");
            return;
        }

        // Check for placeholder keys
        const isPlaceholder = !this.config.apiKey ||
            this.config.apiKey.includes("YOUR_") ||
            this.config.projectId.includes("YOUR_");

        if (isPlaceholder) {
            console.warn("[FirebaseService] Firebase configuration contains placeholder keys. Running in LOCAL fallback mode.");
            return;
        }

        // Check if explicitly disabled for local testing
        if (this.config.useCloudConfig === false) {
            console.warn("[FirebaseService] useCloudConfig is set to false. Running in LOCAL fallback mode. Scores will not be saved to production.");
            return;
        }

        try {
            const app = this.sdk.initializeApp(this.config);
            this.db = this.sdk.getFirestore(app);
            this.isInitialized = true;
            console.log("[FirebaseService] Firebase initialized successfully.");
        } catch (error) {
            console.error("[FirebaseService] Failed to initialize Firebase:", error);
            this.isInitialized = false;
        }
    }

    /**
     * Retrieves all player profiles, falling back to local storage if offline/unconfigured.
     * @returns {Promise<Array<{name: string, highScore: number}>>}
     */
    async getProfiles() {
        if (!this.isInitialized) {
            return this.getLocalProfiles();
        }

        try {
            const querySnapshot = await this.sdk.getDocs(this.sdk.collection(this.db, 'profiles'));
            const profiles = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data && data.name) {
                    profiles.push({
                        name: data.name,
                        highScore: data.highScore || 0,
                        hasPin: !!data.pinHash
                    });
                }
            });

            // Sync local storage so it has the latest offline copy
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('viperHuntProfiles', JSON.stringify(profiles));
            }
            return profiles;
        } catch (error) {
            console.warn("[FirebaseService] Firestore getProfiles failed, falling back to local storage.", error);
            return this.getLocalProfiles();
        }
    }

    async hashPin(pin) {
        if (!pin) return null;
        const msgUint8 = new TextEncoder().encode(pin.toString());
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Saves a new player profile.
     * @param {string} name
     * @param {string} pin - Optional 4-digit PIN
     * @returns {Promise<void>}
     */
    async saveProfile(name, pin = null) {
        if (!name || !name.trim()) return;
        const trimmedName = name.trim();
        
        let pinHash = null;
        if (pin) {
            pinHash = await this.hashPin(pin);
        }

        if (!this.isInitialized) {
            this.saveLocalProfile(trimmedName, pinHash);
            return;
        }

        try {
            const docRef = this.sdk.doc(this.db, 'profiles', trimmedName);
            const dataToSave = {
                name: trimmedName,
                highScore: 0,
                updatedAt: new Date().toISOString()
            };
            if (pinHash) dataToSave.pinHash = pinHash;

            await this.sdk.setDoc(docRef, dataToSave, { merge: true });

            this.saveLocalProfile(trimmedName, pinHash);
        } catch (error) {
            console.warn("[FirebaseService] Firestore saveProfile failed, falling back to local storage.", error);
            this.saveLocalProfile(trimmedName, pinHash);
        }
    }

    /**
     * Validates a PIN for an existing profile.
     * @param {string} name 
     * @param {string} pin 
     * @returns {Promise<boolean>}
     */
    async validatePin(name, pin) {
        if (!name || !pin || !this.isInitialized) {
            // Local mode bypass
            if (!this.isInitialized) return true;
            return false;
        }
        
        try {
            const docRef = this.sdk.doc(this.db, 'profiles', name);
            const docSnap = await this.sdk.getDoc(docRef);
            if (docSnap && docSnap.exists()) {
                const data = docSnap.data();
                if (!data.pinHash) return true; // Legacy profile with no PIN
                
                const inputHash = await this.hashPin(pin);
                return data.pinHash === inputHash;
            }
            return false;
        } catch (error) {
            console.error("[FirebaseService] Failed to validate PIN", error);
            return false;
        }
    }

    /**
     * Claims a profile by setting a PIN if one does not exist.
     * @param {string} name 
     * @param {string} pin 
     * @returns {Promise<boolean>}
     */
    async claimProfile(name, pin) {
        if (!name || !pin || !this.isInitialized) return false;
        try {
            const docRef = this.sdk.doc(this.db, 'profiles', name);
            const docSnap = await this.sdk.getDoc(docRef);
            if (docSnap && docSnap.exists()) {
                const data = docSnap.data();
                if (data.pinHash) return false; // Already claimed
                
                const pinHash = await this.hashPin(pin);
                await this.sdk.setDoc(docRef, {
                    pinHash: pinHash,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
                return true;
            }
            return false;
        } catch (error) {
            console.error("[FirebaseService] Failed to claim profile", error);
            return false;
        }
    }

    /**
     * Updates high score for a player if the new score is higher.
     * @param {string} name
     * @param {number} score
     * @returns {Promise<void>}
     */
    async updateHighScore(name, score) {
        if (!name || !name.trim()) return;
        const trimmedName = name.trim();

        if (!this.isInitialized) {
            this.updateLocalHighScore(trimmedName, score);
            return;
        }

        try {
            const docRef = this.sdk.doc(this.db, 'profiles', trimmedName);
            const docSnap = await this.sdk.getDoc(docRef);
            let currentHighScore = 0;

            if (docSnap && docSnap.exists()) {
                const data = docSnap.data();
                currentHighScore = data ? (data.highScore || 0) : 0;
            }

            if (score > currentHighScore) {
                await this.sdk.setDoc(docRef, {
                    highScore: score,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            }

            this.updateLocalHighScore(trimmedName, score);
        } catch (error) {
            console.warn("[FirebaseService] Firestore updateHighScore failed, falling back to local storage.", error);
            this.updateLocalHighScore(trimmedName, score);
        }
    }

    /**
     * Fetches custom game rules from Firestore.
     * @returns {Promise<Object|null>} The rules object or null if not found/uninitialized
     */
    async getGameRules() {
        if (!this.isInitialized || (this.config && this.config.useCloudConfig === false)) {
            return null;
        }

        try {
            const docRef = this.sdk.doc(this.db, 'configs', 'gameRules');
            const docSnap = await this.sdk.getDoc(docRef);
            if (docSnap && docSnap.exists()) {
                const data = docSnap.data();
                if (data) {
                    return {
                        fps: typeof data.fps === 'number' ? data.fps : undefined,
                        targetsPerLevel: typeof data.targetsPerLevel === 'number' ? data.targetsPerLevel : undefined,
                        maxSimultaneousTargets: typeof data.maxSimultaneousTargets === 'number' ? data.maxSimultaneousTargets : undefined,
                        maxLevels: typeof data.maxLevels === 'number' ? data.maxLevels : undefined,
                        levelTargetSpecs: Array.isArray(data.levelTargetSpecs) ? data.levelTargetSpecs : (typeof data.levelTargetSpecs === 'object' ? data.levelTargetSpecs : undefined),
                        levelTargetCounts: Array.isArray(data.levelTargetCounts) ? data.levelTargetCounts : undefined,
                        levelSpeedMultipliers: Array.isArray(data.levelSpeedMultipliers) ? data.levelSpeedMultipliers : undefined,
                        growthLow: typeof data.growthLow === 'number' ? data.growthLow : undefined,
                        growthMedium: typeof data.growthMedium === 'number' ? data.growthMedium : undefined,
                        growthHigh: typeof data.growthHigh === 'number' ? data.growthHigh : undefined,
                        growthElite: typeof data.growthElite === 'number' ? data.growthElite : undefined,
                        bossMoveChance: typeof data.bossMoveChance === 'number' ? data.bossMoveChance : undefined,
                        bossAggressiveness: typeof data.bossAggressiveness === 'number' ? data.bossAggressiveness : undefined,
                        bossMoveRange: typeof data.bossMoveRange === 'number' ? data.bossMoveRange : undefined,
                        geminiProxyUrl: typeof data.geminiProxyUrl === 'string' ? data.geminiProxyUrl : undefined
                    };
                }
            }
            return null;
        } catch (error) {
            console.warn("[FirebaseService] Firestore getGameRules failed.", error);
            return null;
        }
    }

    // --- Local Fallback Helpers ---

    getLocalProfiles() {
        if (typeof localStorage === 'undefined') {
            return [];
        }
        try {
            return JSON.parse(localStorage.getItem('viperHuntProfiles') || '[]');
        } catch (e) {
            console.error("[FirebaseService] Local storage access failed:", e);
            return [];
        }
    }

    saveLocalProfile(name, pinHash = null) {
        if (typeof localStorage === 'undefined') return;
        try {
            const profiles = this.getLocalProfiles();
            if (!profiles.find(p => p.name === name)) {
                profiles.push({ name, highScore: 0, hasPin: !!pinHash, pinHash: pinHash });
                localStorage.setItem('viperHuntProfiles', JSON.stringify(profiles));
            }

        } catch (e) {
            console.error("[FirebaseService] Local storage save profile failed:", e);
        }
    }

    updateLocalHighScore(name, score) {
        if (typeof localStorage === 'undefined') return;
        try {
            const profiles = this.getLocalProfiles();
            const profile = profiles.find(p => p.name === name);
            if (profile) {
                if (score > profile.highScore) {
                    profile.highScore = score;
                }
            } else {
                profiles.push({ name, highScore: score });
            }
            localStorage.setItem('viperHuntProfiles', JSON.stringify(profiles));
        } catch (e) {
            console.error("[FirebaseService] Local storage update high score failed:", e);
        }
    }
}
