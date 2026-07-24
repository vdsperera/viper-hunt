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
const modeDropdown = document.getElementById('mode-dropdown');

const hud = document.getElementById('hud');
const hudPlayer = document.getElementById('hud-player');
const hudLevel = document.getElementById('hud-level');
const hudScore = document.getElementById('hud-score');
const dpadControls = document.getElementById('dpad-controls');

let selectedProfile = '';
let selectedMode = '';
let firebaseService = null;

async function loadProfiles(autoSelectName = '') {
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
        if (autoSelectName && p.name === autoSelectName) {
            opt.selected = true;
        }
        profileDropdown.appendChild(opt);
    });

    profileDropdown.disabled = false;
    createProfileBtn.disabled = false;

    selectedProfile = profileDropdown.value;
    updateStartBtnState();
}

async function saveProfile(name) {
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    createProfileBtn.disabled = true;
    await firebaseService.saveProfile(trimmed);
    await loadProfiles(trimmed);
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
        const configModule = await import('./firebase-config.js?t=' + Date.now());
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

    const defaultRules = {
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
        growthElite: 4
    };

    let gameRules = { ...defaultRules };
    try {
        const cloudRules = await firebaseService.getGameRules();
        if (cloudRules) {
            Object.keys(cloudRules).forEach(key => {
                if (cloudRules[key] !== undefined) {
                    gameRules[key] = cloudRules[key];
                }
            });
            console.log("[main] Game rules successfully loaded from Firestore:", gameRules);
        }
    } catch (e) {
        console.warn("[main] Failed to load rules from Firestore. Using local defaults.", e);
    }

    // TASK-012: Network integration (using fallback file as default since we have no live CSV setup)
    const registryService = new RegistryService(null, 'data/fallback_registry.json');

    try {
        await registryService.loadRegistry();
        uiTitle.innerText = "Viper Hunt";
        uiMsg.innerText = "Registry Loaded. Select a profile.";

        profileSection.classList.remove('hidden');
        try {
            await loadProfiles();
        } catch (profErr) {
            console.warn("[main] Failed to load profiles, proceeding with empty profile dropdown:", profErr);
        }
    } catch (e) {
        console.error("[main] Unexpected failure during registry load:", e);
        uiTitle.innerText = "Fatal Error";
        uiMsg.innerText = "Failed to load registry data: " + (e.message || e);
        return;
    }

    createProfileBtn.addEventListener('click', async () => {
        await saveProfile(newProfileName.value);
        newProfileName.value = '';
    });

    profileDropdown.addEventListener('change', (e) => {
        selectedProfile = e.target.value;
        updateStartBtnState();
    });

    modeDropdown.addEventListener('change', (e) => {
        selectedMode = e.target.value;
        updateStartBtnState();
    });

    function updateStartBtnState() {
        startBtn.disabled = !selectedProfile || !selectedMode;
    }

    let gameLoop;
    let hudInterval;

    startBtn.addEventListener('click', () => {
        // Hide UI
        uiOverlay.classList.add('hidden');
        hud.classList.remove('hidden');
        if (dpadControls) dpadControls.classList.remove('hidden');
        hudPlayer.innerText = selectedProfile;

        // 1280x720 canvas with 32px cells = 40x22 grid
        const gridState = new GridState(40, 22);
        gridState.setPlayMode(selectedMode);
        gridState.setGrowthRules(gameRules); // Set custom growth-tier segments rules
        gridState.setHunter(new HunterEntity({
            HeadCoordinate: { x: 20, y: 11 },
            BodySegments: [],
            CurrentDirection: Direction.RIGHT
        }));

        const inputHandler = new InputHandler();
        if (dpadControls) inputHandler.bindDpadControls(dpadControls);
        inputHandler.bindTouchSwipe(document.getElementById('game-container'));

        const collisionDetector = new CollisionDetector();
        const renderer = new Renderer('game-canvas', 32);
        const targetManager = new TargetManager(gridState, registryService);
        const scoreManager = new ScoreManager();

        gameLoop = new GameLoop(gameRules.fps, {
            inputHandler, gridState, collisionDetector, targetManager, renderer, scoreManager, playMode: selectedMode
        });

        const levelManager = new LevelManager(
            gridState,
            targetManager,
            gameLoop,
            gameRules.targetsPerLevel,
            gameRules.maxSimultaneousTargets,
            gameRules.maxLevels,
            gameRules.levelTargetSpecs
        );
        gameLoop.levelManager = levelManager;

        // HUD Update Loop
        let currentLevel = 1;
        const originalAdvanceLevel = levelManager.advanceLevel.bind(levelManager);
        levelManager.advanceLevel = () => {
            currentLevel++;
            hudLevel.innerText = currentLevel;
            originalAdvanceLevel();
        };

        hudInterval = setInterval(() => {
            if (gameLoop.running) {
                hudScore.innerText = scoreManager.getSessionScore();
            }
        }, 100);

        const scoreBreakdownContainer = document.getElementById('score-breakdown-container');
        const overlayCard = document.querySelector('.overlay-card');

        function renderScoreBreakdown(container, breakdown) {
            if (!container || !breakdown) return;

            if (overlayCard) overlayCard.classList.add('has-breakdown');

            const { levelHistory, partialLevel, summary } = breakdown;

            let rowsHtml = '';

            levelHistory.forEach(lvl => {
                rowsHtml += `
            <tr>
                <td>Lvl ${lvl.level}</td>
                <td>${lvl.targetsCaptured}</td>
                <td>${lvl.capturedSum} <span class="cyan-text">(+${lvl.valueScore})</span></td>
                <td>${lvl.elapsedSeconds}s <span class="gold-text">(+${lvl.timeBonus})</span></td>
                <td class="green-text">${lvl.levelScore}</td>
            </tr>
        `;
            });

            if (partialLevel) {
                rowsHtml += `
            <tr class="partial-row">
                <td>Lvl ${partialLevel.level}<span class="badge-tag">PARTIAL</span></td>
                <td>${partialLevel.targetsCaptured}</td>
                <td>${partialLevel.capturedSum} <span class="cyan-text">(+${partialLevel.valueScore})</span></td>
                <td>-- <span class="gold-text">(+0)</span></td>
                <td class="green-text">${partialLevel.levelScore}</td>
            </tr>
        `;
            }

            container.innerHTML = `
        <div class="score-formula-badge">
            <div class="formula-title">SCORE CALCULATION FORMULA</div>
            <div class="formula-desc">Target Values × 60% + Remaining Time Bonus × 40%</div>
        </div>
        <div class="breakdown-table-wrapper">
            <table class="cyber-breakdown-table">
                <thead>
                    <tr>
                        <th>LEVEL</th>
                        <th>TARGETS</th>
                        <th>TARGET VAL (60%)</th>
                        <th>TIME BONUS (40%)</th>
                        <th>SCORE</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="5">No level activity recorded</td></tr>'}
                </tbody>
            </table>
        </div>
        <div class="score-summary-card">
            <div class="summary-row">
                <span>Total Target Value Points:</span>
                <strong class="cyan-text">${summary.totalTargetValueSum} pts (${summary.totalTargetScore} score)</strong>
            </div>
            <div class="summary-row">
                <span>Total Level Time Bonus:</span>
                <strong class="pink-text">+${summary.totalTimeBonus} score</strong>
            </div>
            <div class="summary-row highlight">
                <span>FINAL CALCULATED SCORE:</span>
                <strong class="green-text">${summary.finalScore}</strong>
            </div>
        </div>
    `;

            container.classList.remove('hidden');
        }

        // Intercept GameLoop stop to show Game Over UI (TASK-017)
        const originalStop = gameLoop.stop.bind(gameLoop);
        gameLoop.stop = async () => {
            originalStop();
            clearInterval(hudInterval);
            if (dpadControls) dpadControls.classList.add('hidden');

            const finalScore = scoreManager.getSessionScore();
            const breakdown = scoreManager.getScoreBreakdown();

            // Show saving/updating state
            uiOverlay.classList.remove('hidden');
            profileSection.classList.add('hidden');
            uiTitle.innerText = "Saving Score...";
            uiMsg.innerText = "Please wait";
            startBtn.disabled = true;

            await updateHighScore(selectedProfile, finalScore);

            if (gameLoop.victory) {
                uiTitle.innerText = "Victory!";
                uiMsg.innerText = `Congratulations, ${selectedProfile}! You captured all targets.`;
            } else {
                uiTitle.innerText = "Game Over";
                uiMsg.innerText = `${selectedProfile}'s Tactical Session Concluded.`;
            }

            renderScoreBreakdown(scoreBreakdownContainer, breakdown);

            startBtn.innerText = "Play Again";
            startBtn.disabled = false;
            startBtn.onclick = () => window.location.reload();
        };

        // Bootstrap the first level and commence tick
        levelManager.advanceLevel();
        currentLevel = 1; // Reset to 1 after advanceLevel increments it initially
        hudLevel.innerText = '1';
        gameLoop.start();
    });
}

// Initialise Application
bootstrap();

