import { FirebaseService } from '../services/FirebaseService.js';
import assert from 'node:assert';
import test from 'node:test';

// Mock localStorage setup
let localStorageStore = {};
globalThis.localStorage = {
    getItem: (key) => localStorageStore[key] || null,
    setItem: (key, value) => { localStorageStore[key] = String(value); },
    clear: () => { localStorageStore = {}; }
};

test('FirebaseService Test Suite', async (t) => {
    
    t.beforeEach(() => {
        localStorageStore = {};
    });

    await t.test('Should fallback to local storage when SDK or config is missing', async () => {
        const service = new FirebaseService(null, null);
        assert.strictEqual(service.isInitialized, false);
        
        localStorageStore['viperHuntProfiles'] = JSON.stringify([{ name: 'LocalPlayer', highScore: 10 }]);
        const profiles = await service.getProfiles();
        
        assert.strictEqual(profiles.length, 1);
        assert.strictEqual(profiles[0].name, 'LocalPlayer');
    });

    await t.test('Should fallback to local storage when placeholder config is provided', async () => {
        const mockSdk = {
            initializeApp: () => assert.fail("Should not call initializeApp"),
            getFirestore: () => assert.fail("Should not call getFirestore")
        };
        const placeholderConfig = {
            apiKey: "YOUR_API_KEY",
            projectId: "YOUR_PROJECT_ID"
        };
        
        const service = new FirebaseService(mockSdk, placeholderConfig);
        assert.strictEqual(service.isInitialized, false);
    });

    await t.test('Should initialize correctly with valid config', async () => {
        const mockSdk = {
            initializeApp: (cfg) => {
                assert.strictEqual(cfg.apiKey, "real-api-key");
                return { name: '[App]' };
            },
            getFirestore: (app) => {
                assert.strictEqual(app.name, '[App]');
                return { type: '[Firestore]' };
            }
        };
        const config = {
            apiKey: "real-api-key",
            projectId: "real-project-id"
        };
        
        const service = new FirebaseService(mockSdk, config);
        assert.strictEqual(service.isInitialized, true);
    });

    await t.test('getProfiles returns data from Firestore and syncs local storage', async () => {
        const mockSdk = {
            initializeApp: () => ({}),
            getFirestore: () => ({}),
            collection: (db, name) => {
                assert.strictEqual(name, 'profiles');
                return { name };
            },
            getDocs: async (colRef) => {
                return [
                    { data: () => ({ name: 'CloudAlice', highScore: 150 }) },
                    { data: () => ({ name: 'CloudBob', highScore: 220 }) }
                ];
            }
        };
        const config = { apiKey: "real-key", projectId: "real-project" };
        const service = new FirebaseService(mockSdk, config);
        
        const profiles = await service.getProfiles();
        assert.strictEqual(profiles.length, 2);
        assert.strictEqual(profiles[0].name, 'CloudAlice');
        assert.strictEqual(profiles[1].highScore, 220); // cloudBob
        
        // Verify local storage is synced
        const local = JSON.parse(localStorageStore['viperHuntProfiles']);
        assert.strictEqual(local.length, 2);
        assert.strictEqual(local[0].name, 'CloudAlice');
    });

    await t.test('saveProfile updates Firestore and local storage', async () => {
        let savedDoc = null;
        const mockSdk = {
            initializeApp: () => ({}),
            getFirestore: () => ({}),
            doc: (db, col, id) => {
                assert.strictEqual(col, 'profiles');
                assert.strictEqual(id, 'NewPlayer');
                return { col, id };
            },
            setDoc: async (docRef, data, options) => {
                assert.deepStrictEqual(options, { merge: true });
                savedDoc = { docRef, data };
            }
        };
        const config = { apiKey: "real-key", projectId: "real-project" };
        const service = new FirebaseService(mockSdk, config);
        
        await service.saveProfile('NewPlayer');
        
        assert.ok(savedDoc);
        assert.strictEqual(savedDoc.data.name, 'NewPlayer');
        assert.strictEqual(savedDoc.data.highScore, 0);
        
        // Verify local storage is updated
        const local = JSON.parse(localStorageStore['viperHuntProfiles']);
        assert.strictEqual(local.length, 1);
        assert.strictEqual(local[0].name, 'NewPlayer');
    });

    await t.test('updateHighScore writes to Firestore if new score is higher', async () => {
        let updatedData = null;
        const mockSdk = {
            initializeApp: () => ({}),
            getFirestore: () => ({}),
            doc: (db, col, id) => ({ col, id }),
            getDoc: async (docRef) => {
                return {
                    exists: () => true,
                    data: () => ({ name: docRef.id, highScore: 100 })
                };
            },
            setDoc: async (docRef, data, options) => {
                updatedData = data;
            }
        };
        const config = { apiKey: "real-key", projectId: "real-project" };
        const service = new FirebaseService(mockSdk, config);
        
        // Setup local storage first
        localStorageStore['viperHuntProfiles'] = JSON.stringify([{ name: 'Player1', highScore: 100 }]);
        
        // Lower score should not write
        await service.updateHighScore('Player1', 90);
        assert.strictEqual(updatedData, null);
        
        // Higher score should write
        await service.updateHighScore('Player1', 120);
        assert.ok(updatedData);
        assert.strictEqual(updatedData.highScore, 120);
        
        // Verify local storage updated
        const local = JSON.parse(localStorageStore['viperHuntProfiles']);
        assert.strictEqual(local[0].highScore, 120);
    });

    await t.test('updateHighScore creates document if it does not exist', async () => {
        let updatedData = null;
        const mockSdk = {
            initializeApp: () => ({}),
            getFirestore: () => ({}),
            doc: (db, col, id) => ({ col, id }),
            getDoc: async (docRef) => {
                return {
                    exists: () => false, // Does not exist
                    data: () => null
                };
            },
            setDoc: async (docRef, data, options) => {
                updatedData = data;
            }
        };
        const config = { apiKey: "real-key", projectId: "real-project" };
        const service = new FirebaseService(mockSdk, config);
        
        await service.updateHighScore('NewPlayer', 50);
        assert.ok(updatedData);
        assert.strictEqual(updatedData.highScore, 50);
    });
});
