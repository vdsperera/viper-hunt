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
import { AttackManager } from './services/AttackManager.js';

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
let selectedMode = modeDropdown ? (modeDropdown.value || 'mode1') : 'mode1';
let firebaseService = null;

function updateStartBtnState() {
    if (!selectedMode || selectedMode === '') {
        selectedMode = (modeDropdown && modeDropdown.value) ? modeDropdown.value : 'mode1';
    }
    if (startBtn) {
        startBtn.disabled = !selectedProfile || !selectedMode;
    }
}

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
    selectedMode = modeDropdown ? (modeDropdown.value || 'mode1') : 'mode1';
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
        const rawConfig = configModule.firebaseConfig || configModule.default || configModule;
        if (rawConfig && rawConfig.apiKey) {
            firebaseConfig = rawConfig;
        }

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
        // Set useCloudConfig to false for local testing (uses local default rules directly),
        // or true to fetch and sync live rules with Firebase Firestore.
        useCloudConfig: true,
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
            { id: 'police', key: '1', name: 'Police Custody', icon: '👮', multiplier: 1.0, uses: -1, color: '#00f0ff' },
            { id: 'caging', key: '2', name: 'Caging', icon: '🔒', multiplier: 1.2, uses: 5, color: '#ffb800' },
            { id: 'shooting', key: '3', name: 'Shooting', icon: '🎯', multiplier: 1.5, uses: 3, color: '#ff0055' },
            { id: 'butchering', key: '4', name: 'Butchering', icon: '🪓', multiplier: 2.0, uses: 2, color: '#aa00ff' }
        ]
    };

    let gameRules = { ...defaultRules };
    const allowCloud = firebaseConfig?.useCloudConfig !== false && defaultRules.useCloudConfig !== false;

    if (allowCloud) {
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
    } else {
        console.log("[main] Local testing mode active (useCloudConfig: false). Using local default rules directly:", gameRules);
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

    let gameLoop;
    let hudInterval;

    startBtn.addEventListener('click', () => {
        // Hide UI
        uiOverlay.classList.add('hidden');
        hud.classList.remove('hidden');
        if (dpadControls) dpadControls.classList.remove('hidden');
        hudPlayer.innerText = selectedProfile;

        const eqHud = document.getElementById('emotional-question-hud');
        if (eqHud) {
            if (selectedMode === 'mode3') {
                eqHud.classList.remove('hidden');
            } else {
                eqHud.classList.add('hidden');
            }
        }

        const wantedRosterHud = document.getElementById('wanted-roster-hud');
        const wantedTargetsContainer = document.getElementById('wanted-targets-container');
        if (wantedRosterHud) {
            if (selectedMode === 'mode1') {
                wantedRosterHud.classList.remove('hidden');
            } else {
                wantedRosterHud.classList.add('hidden');
            }
        }

        const attackSelectorHud = document.getElementById('attack-selector-hud');
        const attackButtonsContainer = document.getElementById('attack-buttons-container');
        const attackManager = new AttackManager(gameRules.attackTypes);

        if (attackSelectorHud) {
            if (selectedMode === 'mode1') {
                attackSelectorHud.classList.remove('hidden');
            } else {
                attackSelectorHud.classList.add('hidden');
            }
        }

        function renderAttackSelectorHud() {
            if (!attackButtonsContainer || selectedMode !== 'mode1') return;
            const attacks = attackManager.getAttackList();
            attackButtonsContainer.innerHTML = attacks.map(att => {
                const usesLabel = att.currentUses < 0 ? '∞' : att.currentUses;
                const outOfAmmo = att.currentUses === 0;
                return `
                    <div class="attack-btn ${att.isActive ? 'active' : ''} ${outOfAmmo ? 'out-of-ammo' : ''}" 
                         data-key="${att.key}" 
                         style="--att-color: ${att.color}">
                        <span class="attack-key-badge">[${att.key}]</span>
                        <span class="attack-icon">${att.icon}</span>
                        <span class="attack-name">${att.name}</span>
                        <span class="attack-multiplier">${att.multiplier}x</span>
                        <span class="attack-uses">(${usesLabel})</span>
                    </div>
                `;
            }).join('');

            attackButtonsContainer.querySelectorAll('.attack-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const key = btn.getAttribute('data-key');
                    if (attackManager.selectAttack(key)) {
                        renderAttackSelectorHud();
                    }
                });
            });
        }

        renderAttackSelectorHud();

        // 1280x720 canvas with 32px cells = 40x22 grid
        const gridState = new GridState(40, 22);
        gridState.setPlayMode(selectedMode);
        gridState.setGrowthRules(gameRules); // Set custom growth-tier segments rules
        gridState.setBossRules(gameRules); // Set custom boss aggressiveness & speed rules
        gridState.setHunter(new HunterEntity({
            HeadCoordinate: { x: 20, y: 11 },
            BodySegments: [],
            CurrentDirection: Direction.RIGHT
        }));

        const inputHandler = new InputHandler();
        if (dpadControls) inputHandler.bindDpadControls(dpadControls);
        inputHandler.bindTouchSwipe(document.getElementById('game-container'));
        inputHandler.onAttackSelect = (key) => {
            if (selectedMode === 'mode1') {
                if (attackManager.selectAttack(key)) {
                    renderAttackSelectorHud();
                }
            }
        };

        const collisionDetector = new CollisionDetector();
        const renderer = new Renderer('game-canvas', 32);
        const targetManager = new TargetManager(gridState, registryService);
        const scoreManager = new ScoreManager();

        gameLoop = new GameLoop(gameRules.fps, {
            inputHandler, gridState, collisionDetector, targetManager, renderer, scoreManager, attackManager, playMode: selectedMode
        });

        const levelManager = new LevelManager(
            gridState,
            targetManager,
            gameLoop,
            gameRules.targetsPerLevel,
            gameRules.maxSimultaneousTargets,
            gameRules.maxLevels,
            gameRules.levelTargetSpecs,
            gameRules.emotionalQuestions
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

        let prevTargetSignature = '';
        hudInterval = setInterval(() => {
            if (gameLoop.running) {
                hudScore.innerText = scoreManager.getSessionScore();

                if (selectedMode === 'mode1' && wantedTargetsContainer) {
                    const activeTargets = gridState.activeTargets;
                    const records = Array.from(activeTargets.values());
                    const sig = records.map(r => `${r.ID}-${r.Name}-${r.Computed_Value}`).join('|');
                    if (sig !== prevTargetSignature) {
                        prevTargetSignature = sig;
                        if (records.length === 0) {
                            wantedTargetsContainer.innerHTML = '<span style="font-size:0.75rem; color:#888; font-family:var(--font-body);">[ ALL TARGETS CAPTURED ]</span>';
                        } else {
                            wantedTargetsContainer.innerHTML = records.map(r => `
                                <div class="wanted-card ${r.Interpol_Red_Notice ? 'red-notice' : ''}">
                                    <div class="wanted-avatar-wrap">
                                        <img src="${r.Avatar_Asset_Path}" class="wanted-avatar-img" alt="${r.Name}" onerror="this.src='assets/avatars/placeholder.png'" />
                                    </div>
                                    <div class="wanted-info">
                                        <span class="wanted-name">${r.Name}</span>
                                        <div class="wanted-meta">
                                            <span class="wanted-value">$${r.Computed_Value}</span>
                                            ${r.Interpol_Red_Notice ? '<span class="wanted-badge interpol">INTERPOL</span>' : ''}
                                            ${r.FBI_Most_Wanted ? '<span class="wanted-badge fbi">FBI</span>' : ''}
                                        </div>
                                    </div>
                                </div>
                            `).join('');
                        }
                    }
                }
                if (selectedMode === 'mode1') {
                    renderAttackSelectorHud();
                }
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
            const eqHud = document.getElementById('emotional-question-hud');
            if (eqHud) eqHud.classList.add('hidden');
            if (wantedRosterHud) wantedRosterHud.classList.add('hidden');
            if (attackSelectorHud) attackSelectorHud.classList.add('hidden');

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
                if (selectedMode === 'mode3') {
                    uiTitle.innerText = "SOUL ASCENDED!";
                    uiMsg.innerText = `Congratulations, ${selectedProfile}! You answered all questions of the soul and conquered death.`;
                } else {
                    uiTitle.innerText = "Victory!";
                    uiMsg.innerText = `Congratulations, ${selectedProfile}! You captured all targets.`;
                }
            } else {
                if (selectedMode === 'mode3') {
                    uiTitle.innerText = "FATE SEALED";
                    uiMsg.innerText = `Sorry mate, you faced death before you found your answers...`;
                } else {
                    uiTitle.innerText = "Game Over";
                    uiMsg.innerText = `${selectedProfile}'s Tactical Session Concluded.`;
                }
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

