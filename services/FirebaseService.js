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
        this.auth = null;
        this.currentUser = null;
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
            this.auth = this.sdk.getAuth(app);
            this.isInitialized = true;
            console.log("[FirebaseService] Firebase initialized successfully.");
        } catch (error) {
            console.error("[FirebaseService] Failed to initialize Firebase:", error);
            this.isInitialized = false;
        }
    }

    /**
     * Signs in anonymously and returns the user
     */
    async signIn() {
        if (!this.isInitialized) return null;
        try {
            return new Promise((resolve, reject) => {
                this.sdk.onAuthStateChanged(this.auth, async (user) => {
                    if (user) {
                        this.currentUser = user;
                        resolve(user);
                    } else {
                        try {
                            const result = await this.sdk.signInAnonymously(this.auth);
                            this.currentUser = result.user;
                            resolve(result.user);
                        } catch (err) {
                            console.error("[FirebaseService] Failed anonymous sign in:", err);
                            resolve(null);
                        }
                    }
                });
            });
        } catch (e) {
            console.error("[FirebaseService] Error during signIn:", e);
            return null;
        }
    }

    /**
     * Links the current anonymous account with Google OAuth
     */
    async linkGoogleAccount() {
        if (!this.isInitialized || !this.currentUser) return false;
        try {
            const provider = new this.sdk.GoogleAuthProvider();
            const result = await this.sdk.linkWithPopup(this.currentUser, provider);
            this.currentUser = result.user;
            
            // Update profile to note it's no longer anonymous
            if (this.currentUser.uid) {
                const docRef = this.sdk.doc(this.db, 'profiles', this.currentUser.uid);
                await this.sdk.setDoc(docRef, { isAnonymous: false }, { merge: true });
            }
            return true;
        } catch (error) {
            console.error("[FirebaseService] Failed to link Google account:", error);
            return false;
        }
    }

    /**
     * Gets the current user's profile
     */
    async getCurrentProfile() {
        if (!this.isInitialized || !this.currentUser) return null;
        try {
            const docRef = this.sdk.doc(this.db, 'profiles', this.currentUser.uid);
            const docSnap = await this.sdk.getDoc(docRef);
            if (docSnap && docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        } catch (error) {
            console.error("[FirebaseService] Failed to get profile:", error);
            return null;
        }
    }

    /**
     * Retrieves all player profiles for leaderboard, falling back to local storage if offline/unconfigured.
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
                        isAnonymous: data.isAnonymous !== false
                    });
                }
            });

            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('viperHuntProfiles', JSON.stringify(profiles));
            }
            return profiles;
        } catch (error) {
            console.warn("[FirebaseService] Firestore getProfiles failed, falling back to local storage.", error);
            return this.getLocalProfiles();
        }
    }

    /**
     * Saves a new player profile.
     * @param {string} name
     * @returns {Promise<void>}
     */
    async saveProfile(name) {
        if (!name || !name.trim()) return;
        const trimmedName = name.trim();

        if (!this.isInitialized || !this.currentUser) {
            this.saveLocalProfile(trimmedName);
            return;
        }

        try {
            const docRef = this.sdk.doc(this.db, 'profiles', this.currentUser.uid);
            const dataToSave = {
                uid: this.currentUser.uid,
                name: trimmedName,
                highScore: 0,
                isAnonymous: this.currentUser.isAnonymous,
                updatedAt: new Date().toISOString()
            };

            await this.sdk.setDoc(docRef, dataToSave, { merge: true });
            this.saveLocalProfile(trimmedName);
        } catch (error) {
            console.warn("[FirebaseService] Firestore saveProfile failed, falling back to local storage.", error);
            this.saveLocalProfile(trimmedName);
        }
    }

    /**
     * Updates high score for a player if the new score is higher.
     * @param {string} name (kept for local storage compatibility)
     * @param {number} score
     * @returns {Promise<void>}
     */
    async updateHighScore(name, score) {
        if (!name || !name.trim()) return;
        const trimmedName = name.trim();

        if (!this.isInitialized || !this.currentUser) {
            this.updateLocalHighScore(trimmedName, score);
            return;
        }

        try {
            const docRef = this.sdk.doc(this.db, 'profiles', this.currentUser.uid);
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

    saveLocalProfile(name) {
        if (typeof localStorage === 'undefined') return;
        try {
            const profiles = this.getLocalProfiles();
            if (!profiles.find(p => p.name === name)) {
                profiles.push({ name, highScore: 0, isAnonymous: true });
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
