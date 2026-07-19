/**
 * Viper Hunt - Main Entry Point
 * Wires dependencies and initiates Game Loop
 */
import { RegistryService } from './services/RegistryService.js';
import { GameLoop } from './services/GameLoop.js';
import { Renderer } from './services/Renderer.js';
import { InputHandler } from './services/InputHandler.js';
import { GridState } from './services/GridState.js';
import { CollisionDetector } from './services/CollisionDetector.js';
import { TargetManager } from './services/TargetManager.js';
import { ScoreManager } from './services/ScoreManager.js';
import { LevelManager } from './services/LevelManager.js';
import { HunterEntity, Direction } from './models/HunterEntity.js';
import { FirebaseService } from './services/FirebaseService.js';

const uiOverlay = document.getElementById('overlay-ui');
const uiTitle = document.getElementById('overlay-title');
const uiMsg = document.getElementById('overlay-message');
const startBtn = document.getElementById('start-btn');

// Profile & HUD UI
const profileSection = document.getElementById('profile-section');
const newProfileName = document.getElementById('new-profile-name');
const createProfileBtn = document.getElementById('create-profile-btn');
const profileDropdown = document.getElementById('profile-dropdown');

const hud = document.getElementById('hud');
const hudPlayer = document.getElementById('hud-player');
const hudLevel = document.getElementById('hud-level');
const hudScore = document.getElementById('hud-score');

let selectedProfile = '';
let firebaseService = null;

async function loadProfiles() {
    if (!firebaseService) return;
    
    // Disable inputs while performing async fetching
    profileDropdown.disabled = true;
    createProfileBtn.disabled = true;
    
    const profiles = await firebaseService.getProfiles();
    
    profileDropdown.innerHTML = '<option value="">-- Select Player --</option>';
    profiles.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.innerText = `${p.name} (High Score: ${p.highScore})`;
        profileDropdown.appendChild(opt);
    });
    
    profileDropdown.disabled = false;
    createProfileBtn.disabled = false;
    
    selectedProfile = profileDropdown.value;
    startBtn.disabled = !selectedProfile;
}

async function saveProfile(name) {
    if (!name || !name.trim()) return;
    createProfileBtn.disabled = true;
    await firebaseService.saveProfile(name);
    await loadProfiles();
}

async function updateHighScore(name, score) {
    if (!name || !name.trim() || !firebaseService) return;
    await firebaseService.updateHighScore(name, score);
}

async function bootstrap() {
    // Dynamically attempt to load Firebase config & SDK (ensures offline safety and 404 safety)
    let firebaseConfig = null;
    let firebaseSdk = null;

    try {
        const configModule = await import('./firebase-config.js');
        firebaseConfig = configModule.firebaseConfig;

        const isPlaceholder = !firebaseConfig ||
                              !firebaseConfig.apiKey ||
                              firebaseConfig.apiKey.includes("YOUR_") ||
                              firebaseConfig.projectId.includes("YOUR_");

        if (firebaseConfig && !isPlaceholder) {
            // Load Firebase modules dynamically
            const [appModule, firestoreModule] = await Promise.all([
                import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js'),
                import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js')
            ]);

            firebaseSdk = {
                initializeApp: appModule.initializeApp,
                getFirestore: firestoreModule.getFirestore,
                collection: firestoreModule.collection,
                getDocs: firestoreModule.getDocs,
                doc: firestoreModule.doc,
                getDoc: firestoreModule.getDoc,
                setDoc: firestoreModule.setDoc
            };
        }
    } catch (e) {
        console.warn("[main] Firebase setup skipped/failed. Local fallback enabled.", e);
    }

    firebaseService = new FirebaseService(firebaseSdk, firebaseConfig);

    // TASK-012: Network integration (using fallback file as default since we have no live CSV setup)
    const registryService = new RegistryService(null, 'data/fallback_registry.json');
    
    try {
        await registryService.loadRegistry();
        uiTitle.innerText = "Viper Hunt";
        uiMsg.innerText = "Registry Loaded. Select a profile.";
        
        profileSection.classList.remove('hidden');
        await loadProfiles();
    } catch (e) {
        uiTitle.innerText = "Fatal Error";
        uiMsg.innerText = "Failed to load registry data.";
        return;
    }

    createProfileBtn.addEventListener('click', async () => {
        await saveProfile(newProfileName.value);
        newProfileName.value = '';
    });

    profileDropdown.addEventListener('change', (e) => {
        selectedProfile = e.target.value;
        startBtn.disabled = !selectedProfile;
    });

    let gameLoop;
    let hudInterval;

    startBtn.addEventListener('click', () => {
        // Hide UI
        uiOverlay.classList.add('hidden');
        hud.classList.remove('hidden');
        hudPlayer.innerText = `Player: ${selectedProfile}`;
        
        // 1280x720 canvas with 32px cells = 40x22 grid
        const gridState = new GridState(40, 22);
        gridState.setHunter(new HunterEntity({
            HeadCoordinate: { x: 20, y: 11 },
            BodySegments: [],
            CurrentDirection: Direction.RIGHT
        }));

        const inputHandler = new InputHandler();
        const collisionDetector = new CollisionDetector();
        const renderer = new Renderer('game-canvas', 32);
        const targetManager = new TargetManager(gridState, registryService);
        const scoreManager = new ScoreManager();

        gameLoop = new GameLoop(12, {
            inputHandler, gridState, collisionDetector, targetManager, renderer, scoreManager
        });

        const levelManager = new LevelManager(gridState, targetManager, gameLoop);
        gameLoop.levelManager = levelManager;

        // HUD Update Loop
        let currentLevel = 1;
        const originalAdvanceLevel = levelManager.advanceLevel.bind(levelManager);
        levelManager.advanceLevel = () => {
            currentLevel++;
            hudLevel.innerText = `Level: ${currentLevel}`;
            originalAdvanceLevel();
        };

        hudInterval = setInterval(() => {
            if (gameLoop.running) {
                hudScore.innerText = `Score: ${scoreManager.getSessionScore()}`;
            }
        }, 100);

        // Intercept GameLoop stop to show Game Over UI (TASK-017)
        const originalStop = gameLoop.stop.bind(gameLoop);
        gameLoop.stop = async () => {
            originalStop();
            clearInterval(hudInterval);
            
            const finalScore = scoreManager.getSessionScore();
            
            // Show saving/updating state
            uiOverlay.classList.remove('hidden');
            profileSection.classList.add('hidden');
            uiTitle.innerText = "Saving Score...";
            uiMsg.innerText = "Please wait";
            startBtn.disabled = true;
            
            await updateHighScore(selectedProfile, finalScore);
            
            uiTitle.innerText = "Game Over";
            uiMsg.innerText = `${selectedProfile}'s Final Score: ${finalScore}`;
            startBtn.innerText = "Play Again";
            startBtn.disabled = false;
            startBtn.onclick = () => window.location.reload(); 
        };

        // Bootstrap the first level and commence tick
        levelManager.advanceLevel(); 
        currentLevel = 1; // Reset to 1 after advanceLevel increments it initially
        hudLevel.innerText = `Level: 1`;
        gameLoop.start();
    });
}

// Initialise Application
bootstrap();

