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
import { AudioService } from './services/AudioService.js';
import { AdaptiveDifficultyService } from './services/AdaptiveDifficultyService.js';
import { LLMService } from './services/LLMService.js';

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
            { id: 'police', key: '1', name: 'Police Custody', pastAction: 'Handed to Police', icon: '👮', multiplier: 1.0, uses: -1, color: '#00f0ff' },
            { id: 'caging', key: '2', name: 'Brutally Caged', pastAction: 'Brutally Caged', icon: '🔒', multiplier: 1.2, uses: 5, color: '#ffb800' },
            { id: 'shooting', key: '3', name: 'Shot Down', pastAction: 'Shot Down in Action', icon: '🎯', multiplier: 1.5, uses: 3, color: '#ff0055' },
            { id: 'butchering', key: '4', name: 'Ruthlessly Butchered', pastAction: 'Ruthlessly Butchered', icon: '🪓', multiplier: 2.0, uses: 2, color: '#aa00ff' }
        ],
        levelHazards: [
            { level: 1, hazards: [{ type: 'crime_boss', name: 'Crime Boss', icon: '🦹', color: '#ff0055', count: 1 }] },
            { level: 2, hazards: [{ type: 'crime_boss', name: 'Crime Boss', icon: '🦹', color: '#ff0055', count: 1 }, { type: 'police_patrol', name: 'Police Patrol', icon: '🚔', color: '#0088ff', count: 1 }] },
            { level: 3, hazards: [{ type: 'crime_boss', name: 'Crime Boss', icon: '🦹', color: '#ff0055', count: 1 }, { type: 'police_patrol', name: 'Police Patrol', icon: '🚔', color: '#0088ff', count: 1 }, { type: 'death_reaper', name: 'Death Reaper', icon: '💀', color: '#aa00ff', count: 1 }] }
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

    const audioService = new AudioService();

    const sfxToggleBtn = document.getElementById('sfx-toggle-btn');
    const bgmToggleBtn = document.getElementById('bgm-toggle-btn');
    const voiceToggleBtn = document.getElementById('voice-toggle-btn');
    const sfxVolSlider = document.getElementById('sfx-volume-slider');
    const bgmVolSlider = document.getElementById('bgm-volume-slider');
    const bgmTrackSelect = document.getElementById('bgm-track-select');

    function syncAudioUi() {
        if (sfxToggleBtn) {
            sfxToggleBtn.classList.toggle('off', !audioService.sfxEnabled);
            sfxToggleBtn.querySelector('span').innerText = audioService.sfxEnabled ? '🔊 SFX: ON' : '🔇 SFX: OFF';
        }
        if (bgmToggleBtn) {
            bgmToggleBtn.classList.toggle('off', !audioService.bgmEnabled);
            bgmToggleBtn.querySelector('span').innerText = audioService.bgmEnabled ? '🎵 BGM: ON' : '🔇 BGM: OFF';
        }
        if (voiceToggleBtn) {
            voiceToggleBtn.classList.toggle('off', !audioService.voiceEnabled);
            voiceToggleBtn.querySelector('span').innerText = audioService.voiceEnabled ? '🎙 VOICE: ON' : '🔇 VOICE: OFF';
        }
        if (sfxVolSlider) {
            sfxVolSlider.value = audioService.sfxVolume;
        }
        if (bgmVolSlider) {
            bgmVolSlider.value = audioService.bgmVolume;
        }
        if (bgmTrackSelect) {
            bgmTrackSelect.value = audioService.currentBgmTrack;
        }
    }

    syncAudioUi();

    if (sfxToggleBtn) {
        sfxToggleBtn.addEventListener('click', () => {
            audioService.setSfxEnabled(!audioService.sfxEnabled);
            syncAudioUi();
        });
    }

    if (bgmToggleBtn) {
        bgmToggleBtn.addEventListener('click', () => {
            audioService.setBgmEnabled(!audioService.bgmEnabled);
            syncAudioUi();
        });
    }

    if (voiceToggleBtn) {
        voiceToggleBtn.addEventListener('click', () => {
            audioService.setVoiceEnabled(!audioService.voiceEnabled);
            syncAudioUi();
        });
    }

    if (bgmTrackSelect) {
        bgmTrackSelect.addEventListener('change', (e) => {
            audioService.setBgmTrack(e.target.value);
            syncAudioUi();
        });
    }

    if (sfxVolSlider) {
        sfxVolSlider.addEventListener('input', (e) => {
            audioService.setSfxVolume(parseFloat(e.target.value));
        });
    }

    if (bgmVolSlider) {
        bgmVolSlider.addEventListener('input', (e) => {
            audioService.setBgmVolume(parseFloat(e.target.value));
        });
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
        const adaptiveDifficultyService = new AdaptiveDifficultyService();
        const llmService = new LLMService();

        const hudThreatLevel = document.getElementById('hud-threat-level');
        if (hudThreatLevel) {
            hudThreatLevel.innerText = adaptiveDifficultyService.currentTier.label;
            hudThreatLevel.style.color = adaptiveDifficultyService.currentTier.color;
            adaptiveDifficultyService.onTierChange = (tier) => {
                hudThreatLevel.innerText = tier.label;
                hudThreatLevel.style.color = tier.color;
            };
        }

        gameLoop = new GameLoop(gameRules.fps, {
            inputHandler, gridState, collisionDetector, targetManager, renderer, scoreManager, attackManager, audioService, adaptiveDifficultyService, llmService, playMode: selectedMode
        });

        const levelManager = new LevelManager(
            gridState,
            targetManager,
            gameLoop,
            gameRules.targetsPerLevel,
            gameRules.maxSimultaneousTargets,
            gameRules.maxLevels,
            gameRules.levelTargetSpecs,
            gameRules.emotionalQuestions,
            gameRules.levelHazards
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

            const { levelHistory, partialLevel, summary, capturedCriminals } = breakdown;

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

            let slideshowHtml = '';
            let compactLogHtml = '';

            if (Array.isArray(capturedCriminals) && capturedCriminals.length > 0) {
                // 1. Build Slideshow Slides
                const slidesHtml = capturedCriminals.map((c, idx) => {
                    const actionName = (c.attackName || '').toLowerCase();
                    const color = c.attackColor || '#00f0ff';
                    const pts = c.finalValue || c.baseValue || 0;

                    let narrativeText = '';
                    if (actionName.includes('police')) {
                        narrativeText = `Following active field surveillance, the Hunter tracked down <strong>${c.name}</strong> and executed a high-priority apprehension. The fugitive was surrendered to <strong>Police Custody</strong> without further resistance (<span style="color:${color}; font-weight:700;">+${pts} pts</span>).`;
                    } else if (actionName.includes('cage') || actionName.includes('caging')) {
                        narrativeText = `Pursuing <strong>${c.name}</strong> through volatile territory, the Hunter deployed heavy tactical containment units. The fugitive was cornered and <strong>Brutally Caged</strong> in a high-security lockup (<span style="color:${color}; font-weight:700;">+${pts} pts</span>).`;
                    } else if (actionName.includes('shot') || actionName.includes('shooting')) {
                        narrativeText = `Engaging <strong>${c.name}</strong> in an armed operational standoff, the Hunter closed in on the target's position. The fugitive was <strong>Shot Down in Action</strong> during the raid (<span style="color:${color}; font-weight:700;">+${pts} pts</span>).`;
                    } else if (actionName.includes('butcher') || actionName.includes('butchering')) {
                        narrativeText = `Breaching <strong>${c.name}</strong>'s fortified compound, the Hunter executed a relentless tactical strike. The target was <strong>Ruthlessly Butchered</strong> and eliminated (<span style="color:${color}; font-weight:700;">+${pts} pts</span>).`;
                    } else {
                        narrativeText = `The Hunter tracked down <strong>${c.name}</strong> and successfully completed the capture operation via <strong>${c.attackName || 'Tactical Interception'}</strong> (<span style="color:${color}; font-weight:700;">+${pts} pts</span>).`;
                    }

                    return `
                    <div class="slideshow-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                        <div class="dossier-story-card">
                            <div class="dossier-header-bar">
                                <span class="dossier-id">DOSSIER #${(c.id || `FB-${idx + 1}`).toUpperCase()}</span>
                                <div class="dossier-badge-row">
                                    ${c.interpol ? '<span class="wanted-badge interpol">INTERPOL</span>' : ''}
                                    ${c.fbi ? '<span class="wanted-badge fbi">FBI</span>' : ''}
                                    ${c.conviction ? '<span class="wanted-badge conviction">CONVICTED</span>' : ''}
                                </div>
                            </div>
                            <div class="dossier-main-row">
                                <div class="dossier-portrait-box">
                                    <img src="${c.avatar}" class="dossier-portrait-img" alt="${c.name}" onerror="this.src='assets/avatars/placeholder.png'" />
                                    <div class="dossier-bounty-tag">BOUNTY $${c.baseValue}</div>
                                </div>
                                <div class="dossier-text-details">
                                    <h4 class="dossier-target-name">${c.name}</h4>
                                    <div class="dossier-narrative-box incident-box">
                                        <div class="dossier-box-label">📋 CRIMINAL INCIDENT RECORD</div>
                                        <div class="dossier-box-content">${c.incident || 'Known High-Priority Fugitive Case'}</div>
                                    </div>
                                    <div class="dossier-narrative-box hunt-box" style="--action-color: ${c.attackColor}">
                                        <div class="dossier-box-label" style="color: ${c.attackColor}">⚡ OPERATIONAL HUNT NARRATIVE (WHAT HUNTER DID)</div>
                                        <div class="dossier-box-content">
                                            ${narrativeText}
                                        </div>
                                    </div>
                                    <div class="dossier-narrative-box confession-box">
                                        <div class="dossier-box-label" style="color: #ff0077">🎙️ CRIMINAL CONFESSION / LAST WORDS (AI DYNAMIC)</div>
                                        <div class="dossier-box-content confession-text">${c.confession || '"My reign in the shadows is over. The Hunter wins this session."'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                }).join('');

                const dotsHtml = capturedCriminals.map((_, idx) => `
                    <span class="slide-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>
                `).join('');

                slideshowHtml = `
                    <div class="hunt-slideshow-section">
                        <div class="slideshow-header-bar">
                            <div class="slideshow-title">
                                <span class="pulse-icon">🎬</span>
                                <span>OPERATIONAL HUNT NARRATIVE SLIDESHOW</span>
                            </div>
                            <div class="slideshow-controls">
                                <button id="slideshow-prev-btn" class="cyber-btn nav-btn" title="Previous Slide"><span>⏮ PREV</span></button>
                                <button id="slideshow-pause-btn" class="cyber-btn pause-btn" title="Pause / Play Slideshow"><span>⏸ PAUSE</span></button>
                                <button id="slideshow-next-btn" class="cyber-btn nav-btn" title="Next Slide"><span>NEXT ⏭</span></button>
                            </div>
                        </div>
                        <div class="slideshow-viewport">
                            ${slidesHtml}
                        </div>
                        <div class="slideshow-footer-bar">
                            <div id="slideshow-dots" class="slideshow-dots-row">
                                ${dotsHtml}
                            </div>
                            <div id="slideshow-counter" class="slideshow-counter-tag">DOSSIER 1 OF ${capturedCriminals.length}</div>
                        </div>
                    </div>
                `;

                // 2. Build Compact Log (Collapsible)
                const logCards = capturedCriminals.map(c => `
                    <div class="criminal-log-card">
                        <div class="criminal-log-avatar-wrap">
                            <img src="${c.avatar}" class="criminal-log-avatar" alt="${c.name}" onerror="this.src='assets/avatars/placeholder.png'" />
                        </div>
                        <div class="criminal-log-info">
                            <div class="criminal-log-name">${c.name}</div>
                            <div class="criminal-log-action" style="--action-color: ${c.attackColor}">
                                <span class="action-icon">${c.attackIcon}</span>
                                <span class="action-text">${c.attackName}</span>
                            </div>
                        </div>
                        <div class="criminal-log-payout">
                            <span class="payout-score">+${c.finalValue} pts</span>
                            <span class="payout-base">Base: $${c.baseValue}</span>
                        </div>
                    </div>
                `).join('');

                compactLogHtml = `
                    <div class="log-toggle-wrap">
                        <button id="toggle-compact-log-btn" class="cyber-btn secondary log-toggle-btn">
                            <span>📋 EXPLAIN / VIEW COMPACT CAPTURE LOG (${capturedCriminals.length})</span>
                        </button>
                    </div>
                    <div id="compact-log-container" class="criminal-log-section hidden">
                        <div class="criminal-log-title">
                            <span>CRIMINAL PUNISHMENT & CAPTURE LOG</span>
                        </div>
                        <div class="criminal-log-grid">
                            ${logCards}
                        </div>
                    </div>
                `;
            } else if (selectedMode === 'mode1') {
                compactLogHtml = `
                    <div class="criminal-log-section">
                        <div class="criminal-log-title">
                            <span>CRIMINAL PUNISHMENT & CAPTURE LOG</span>
                        </div>
                        <div class="no-captures-badge">[ NO TARGETS CAPTURED THIS SESSION ]</div>
                    </div>
                `;
            }

            container.innerHTML = `
        ${slideshowHtml}
        ${compactLogHtml}
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

            // Slideshow Interactivity
            let slideshowTimer = null;
            let currentSlideIndex = 0;
            let isSlideshowPlaying = true;

            const slides = container.querySelectorAll('.slideshow-slide');
            const dots = container.querySelectorAll('.slide-dot');
            const counterTag = container.querySelector('#slideshow-counter');
            const prevBtn = container.querySelector('#slideshow-prev-btn');
            const pauseBtn = container.querySelector('#slideshow-pause-btn');
            const nextBtn = container.querySelector('#slideshow-next-btn');

            if (slides.length > 0) {
                function goToSlide(index) {
                    slides.forEach(s => s.classList.remove('active'));
                    dots.forEach(d => d.classList.remove('active'));

                    currentSlideIndex = (index + slides.length) % slides.length;
                    slides[currentSlideIndex].classList.add('active');
                    if (dots[currentSlideIndex]) dots[currentSlideIndex].classList.add('active');
                    if (counterTag) counterTag.innerText = `DOSSIER ${currentSlideIndex + 1} OF ${slides.length}`;
                }

                function startSlideshow() {
                    if (slideshowTimer) clearInterval(slideshowTimer);
                    isSlideshowPlaying = true;
                    if (pauseBtn) pauseBtn.innerHTML = '<span>⏸ PAUSE</span>';
                    slideshowTimer = setInterval(() => {
                        goToSlide(currentSlideIndex + 1);
                    }, 4000);
                }

                function pauseSlideshow() {
                    if (slideshowTimer) clearInterval(slideshowTimer);
                    slideshowTimer = null;
                    isSlideshowPlaying = false;
                    if (pauseBtn) pauseBtn.innerHTML = '<span>▶ PLAY</span>';
                }

                if (prevBtn) {
                    prevBtn.addEventListener('click', () => {
                        goToSlide(currentSlideIndex - 1);
                        if (isSlideshowPlaying) startSlideshow();
                    });
                }

                if (nextBtn) {
                    nextBtn.addEventListener('click', () => {
                        goToSlide(currentSlideIndex + 1);
                        if (isSlideshowPlaying) startSlideshow();
                    });
                }

                if (pauseBtn) {
                    pauseBtn.addEventListener('click', () => {
                        if (isSlideshowPlaying) {
                            pauseSlideshow();
                        } else {
                            startSlideshow();
                        }
                    });
                }

                dots.forEach((dot, idx) => {
                    dot.addEventListener('click', () => {
                        goToSlide(idx);
                        if (isSlideshowPlaying) startSlideshow();
                    });
                });

                if (slides.length > 1) {
                    startSlideshow();
                } else {
                    if (pauseBtn) pauseBtn.style.display = 'none';
                    if (prevBtn) prevBtn.style.display = 'none';
                    if (nextBtn) nextBtn.style.display = 'none';
                }
            }

            // Compact Log toggle listener
            const toggleLogBtn = container.querySelector('#toggle-compact-log-btn');
            const compactLogWrap = container.querySelector('#compact-log-container');
            if (toggleLogBtn && compactLogWrap) {
                toggleLogBtn.addEventListener('click', () => {
                    compactLogWrap.classList.toggle('hidden');
                    const isHidden = compactLogWrap.classList.contains('hidden');
                    toggleLogBtn.querySelector('span').innerText = isHidden
                        ? `📋 EXPLAIN / VIEW COMPACT CAPTURE LOG (${capturedCriminals.length})`
                        : `🙈 HIDE COMPACT CAPTURE LOG`;
                });
            }

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
                    const cause = gameLoop.lastCollisionReason ? ` (${gameLoop.lastCollisionReason})` : '';
                    uiTitle.innerText = "Game Over";
                    uiMsg.innerText = `${selectedProfile}'s Tactical Session Concluded${cause}.`;
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

