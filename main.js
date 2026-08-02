/**
 * Viper Hunt - Composition Root Entry Point
 * Wires services, initializes UI Controllers, and manages Game Loop lifecycle.
 */
import { RegistryService } from './services/RegistryService.js';
import { GameLoop } from './services/GameLoop.js';
import { RenderManager } from './services/RenderManager.js';
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
import { WeatherService, WeatherType } from './services/WeatherService.js';

// Modular UI Layer Controllers
import { domRefs } from './ui/DomRefs.js';
import { ProfileController } from './ui/ProfileController.js';
import { HudController } from './ui/HudController.js';

async function updateHighScore(firebaseService, name, score) {
    if (!name || !name.trim() || !firebaseService) return;
    await firebaseService.updateHighScore(name, score);
}

async function bootstrap() {
    // 1. Firebase SDK & Config Initialization (with local fallback safety)
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

    const firebaseService = new FirebaseService(firebaseSdk, firebaseConfig);

    // 2. UI Controllers Initialization
    const profileController = new ProfileController(firebaseService);
    const hudController = new HudController();

    // 3. System Level Default Game Rules & Firestore Rules Sync
    const defaultRules = {
        useCloudConfig: true,
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
        enableGeminiAI: firebaseConfig?.enableGeminiAI !== false,
        enableWeatherSystem: firebaseConfig?.enableWeatherSystem !== false,
        geminiProxyUrl: firebaseConfig?.geminiProxyUrl || ''
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
    }

    const isGeminiEnabled = firebaseConfig?.enableGeminiAI !== false && gameRules.enableGeminiAI !== false;
    const rawProxyUrl = (gameRules.geminiProxyUrl && gameRules.geminiProxyUrl.trim()) || (firebaseConfig && firebaseConfig.geminiProxyUrl && firebaseConfig.geminiProxyUrl.trim()) || '';
    const activeProxyUrl = isGeminiEnabled ? rawProxyUrl : '';

    // AI Status Badge Update
    if (domRefs.geminiStatusBadge) {
        if (activeProxyUrl) {
            domRefs.geminiStatusBadge.classList.add('active');
            domRefs.geminiStatusBadge.innerText = '⚡ GEMINI AI ONLINE (SECURE PROXY)';
        } else {
            domRefs.geminiStatusBadge.classList.remove('active');
            domRefs.geminiStatusBadge.innerText = '⚙️ PROCEDURAL ENGINE';
        }
    }

    // 4. Registry Service Loading
    const registryService = new RegistryService(null, 'data/fallback_registry.json');

    try {
        await registryService.loadRegistry();
        if (domRefs.uiTitle) domRefs.uiTitle.innerText = "Viper Hunt";
        if (domRefs.uiMsg) domRefs.uiMsg.innerText = "Registry Loaded. Select a profile.";

        if (domRefs.profileSection) domRefs.profileSection.classList.remove('hidden');
        try {
            await profileController.loadProfiles();
        } catch (profErr) {
            console.warn("[main] Failed to load profiles, proceeding with empty profile dropdown:", profErr);
        }
    } catch (e) {
        console.error("[main] Unexpected failure during registry load:", e);
        if (domRefs.uiTitle) domRefs.uiTitle.innerText = "Fatal Error";
        if (domRefs.uiMsg) domRefs.uiMsg.innerText = "Failed to load registry data: " + (e.message || e);
        return;
    }

    // 5. Audio Service & Controls Wiring
    const audioService = new AudioService();
    if (gameRules.voiceStyle) {
        audioService.setVoiceStyle(gameRules.voiceStyle);
    }

    function syncAudioUi() {
        if (domRefs.sfxToggleBtn) {
            domRefs.sfxToggleBtn.classList.toggle('off', !audioService.sfxEnabled);
            domRefs.sfxToggleBtn.querySelector('span').innerText = audioService.sfxEnabled ? '🔊 SFX: ON' : '🔇 SFX: OFF';
        }
        if (domRefs.bgmToggleBtn) {
            domRefs.bgmToggleBtn.classList.toggle('off', !audioService.bgmEnabled);
            domRefs.bgmToggleBtn.querySelector('span').innerText = audioService.bgmEnabled ? '🎵 BGM: ON' : '🔇 BGM: OFF';
        }
        if (domRefs.voiceToggleBtn) {
            domRefs.voiceToggleBtn.classList.toggle('off', !audioService.voiceEnabled);
            domRefs.voiceToggleBtn.querySelector('span').innerText = audioService.voiceEnabled ? '🎙 VOICE: ON' : '🔇 VOICE: OFF';
        }
        if (domRefs.sfxVolSlider) domRefs.sfxVolSlider.value = audioService.sfxVolume;
        if (domRefs.bgmVolSlider) domRefs.bgmVolSlider.value = audioService.bgmVolume;
        if (domRefs.bgmTrackSelect) domRefs.bgmTrackSelect.value = audioService.currentBgmTrack;
        if (domRefs.voiceStyleSelect) domRefs.voiceStyleSelect.value = audioService.voiceStyle;
    }

    syncAudioUi();

    if (domRefs.sfxToggleBtn) {
        domRefs.sfxToggleBtn.addEventListener('click', () => {
            audioService.setSfxEnabled(!audioService.sfxEnabled);
            syncAudioUi();
        });
    }

    if (domRefs.bgmToggleBtn) {
        domRefs.bgmToggleBtn.addEventListener('click', () => {
            audioService.setBgmEnabled(!audioService.bgmEnabled);
            syncAudioUi();
        });
    }

    if (domRefs.voiceToggleBtn) {
        domRefs.voiceToggleBtn.addEventListener('click', () => {
            audioService.setVoiceEnabled(!audioService.voiceEnabled);
            syncAudioUi();
        });
    }

    if (domRefs.bgmTrackSelect) {
        domRefs.bgmTrackSelect.addEventListener('change', (e) => {
            audioService.setBgmTrack(e.target.value);
            syncAudioUi();
        });
    }

    if (domRefs.voiceStyleSelect) {
        domRefs.voiceStyleSelect.addEventListener('change', (e) => {
            audioService.setVoiceStyle(e.target.value);
            syncAudioUi();
        });
    }

    if (domRefs.sfxVolSlider) {
        domRefs.sfxVolSlider.addEventListener('input', (e) => {
            audioService.setSfxVolume(parseFloat(e.target.value));
        });
    }

    if (domRefs.bgmVolSlider) {
        domRefs.bgmVolSlider.addEventListener('input', (e) => {
            audioService.setBgmVolume(parseFloat(e.target.value));
        });
    }

    // Render Engine Selection Wiring
    if (domRefs.renderEngineDropdown) {
        const savedEngineMode = localStorage.getItem('viper_hunt_render_mode') || '2d';
        domRefs.renderEngineDropdown.value = savedEngineMode;
        domRefs.renderEngineDropdown.addEventListener('change', (e) => {
            localStorage.setItem('viper_hunt_render_mode', e.target.value);
        });
    }

    // 6. Game Session Initialization & Start Session Click Handler
    let gameLoop = null;

    if (domRefs.startBtn) {
        domRefs.startBtn.addEventListener('click', () => {
            const selectedProfile = profileController.selectedProfile;
            const selectedMode = profileController.selectedMode;

            // Hide overlay UI & display main HUD
            if (domRefs.uiOverlay) domRefs.uiOverlay.classList.add('hidden');
            if (domRefs.hud) domRefs.hud.classList.remove('hidden');
            if (domRefs.dpadControls) domRefs.dpadControls.classList.remove('hidden');
            if (domRefs.hudPlayer) domRefs.hudPlayer.innerText = selectedProfile;

            if (domRefs.eqHud) {
                if (selectedMode === 'mode3') domRefs.eqHud.classList.remove('hidden');
                else domRefs.eqHud.classList.add('hidden');
            }

            if (domRefs.wantedRosterHud) {
                if (selectedMode === 'mode1') domRefs.wantedRosterHud.classList.remove('hidden');
                else domRefs.wantedRosterHud.classList.add('hidden');
            }

            if (domRefs.attackSelectorHud) {
                if (selectedMode === 'mode1') domRefs.attackSelectorHud.classList.remove('hidden');
                else domRefs.attackSelectorHud.classList.add('hidden');
            }

            // Domain Services Instantiation
            const attackManager = new AttackManager(gameRules.attackTypes);
            hudController.renderAttackSelectorHud(attackManager);

            const gridState = new GridState(40, 22);
            gridState.setPlayMode(selectedMode);
            gridState.setGrowthRules(gameRules);
            gridState.setBossRules(gameRules);
            gridState.setHunter(new HunterEntity({
                HeadCoordinate: { x: 20, y: 11 },
                BodySegments: [],
                CurrentDirection: Direction.RIGHT
            }));

            const inputHandler = new InputHandler();
            if (domRefs.dpadControls) inputHandler.bindDpadControls(domRefs.dpadControls);
            inputHandler.bindTouchSwipe(document.getElementById('game-container'));
            inputHandler.onAttackSelect = (key) => {
                if (selectedMode === 'mode1') {
                    if (attackManager.selectAttack(key)) {
                        hudController.renderAttackSelectorHud(attackManager);
                    }
                }
            };

            const collisionDetector = new CollisionDetector();
            const renderer = new RenderManager('game-canvas', 'three-canvas', 32);

            if (typeof renderer.setMode === 'function') {
                const selectedEngineMode = domRefs.renderEngineDropdown ? domRefs.renderEngineDropdown.value : (localStorage.getItem('viper_hunt_render_mode') || '2d');
                renderer.setMode(selectedEngineMode);

                const updateToggleBtnLabel = (mode) => {
                    if (domRefs.renderModeToggleBtn) {
                        domRefs.renderModeToggleBtn.classList.toggle('mode-3d', mode === '3d');
                        domRefs.renderModeToggleBtn.querySelector('span').innerText = mode === '3d' ? '🎲 VIEW: 3D' : '👁️ VIEW: 2D';
                    }
                };

                updateToggleBtnLabel(renderer.currentMode);

                if (domRefs.renderModeToggleBtn) {
                    domRefs.renderModeToggleBtn.onclick = () => {
                        const newMode = renderer.currentMode === '3d' ? '2d' : '3d';
                        renderer.setMode(newMode);
                        if (domRefs.renderEngineDropdown) domRefs.renderEngineDropdown.value = newMode;
                        localStorage.setItem('viper_hunt_render_mode', newMode);
                        updateToggleBtnLabel(newMode);
                    };
                }
            }

            const targetManager = new TargetManager(registryService, gridState);
            const scoreManager = new ScoreManager(gameRules);

            let adaptiveDifficultyService = null;
            if (selectedMode === 'mode1') {
                adaptiveDifficultyService = new AdaptiveDifficultyService(
                    gridState,
                    targetManager,
                    { baseTargetValue: 50 },
                    audioService
                );
            }

            let llmService = null;
            if (gameRules.enableGeminiAI !== false) {
                llmService = new LLMService(activeProxyUrl);
            }

            let weatherService = null;
            if (gameRules.enableWeatherSystem !== false) {
                weatherService = new WeatherService();
            }

            gameLoop = new GameLoop(gameRules.fps, {
                inputHandler, gridState, collisionDetector, targetManager, renderer, scoreManager, attackManager, audioService, adaptiveDifficultyService, llmService, weatherService, playMode: selectedMode
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

            // Wire Level Advance HUD Listener
            let currentLevel = 1;
            const originalAdvanceLevel = levelManager.advanceLevel.bind(levelManager);
            levelManager.advanceLevel = () => {
                currentLevel++;
                if (domRefs.hudLevel) domRefs.hudLevel.innerText = currentLevel;
                originalAdvanceLevel();
            };

            // Start HUD Polling
            hudController.startHudPolling(scoreManager, gridState, selectedMode);

            // Intercept GameLoop stop to show Game Over UI
            const originalStop = gameLoop.stop.bind(gameLoop);
            gameLoop.stop = async () => {
                originalStop();
                hudController.stopHudPolling();

                if (domRefs.dpadControls) domRefs.dpadControls.classList.add('hidden');
                if (domRefs.eqHud) domRefs.eqHud.classList.add('hidden');
                if (domRefs.wantedRosterHud) domRefs.wantedRosterHud.classList.add('hidden');
                if (domRefs.attackSelectorHud) domRefs.attackSelectorHud.classList.add('hidden');

                const finalScore = scoreManager.getSessionScore();
                const breakdown = scoreManager.getScoreBreakdown();

                if (domRefs.uiOverlay) domRefs.uiOverlay.classList.remove('hidden');
                if (domRefs.profileSection) domRefs.profileSection.classList.add('hidden');
                if (domRefs.uiTitle) domRefs.uiTitle.innerText = "Saving Score...";
                if (domRefs.uiMsg) domRefs.uiMsg.innerText = "Please wait";
                if (domRefs.startBtn) domRefs.startBtn.disabled = true;

                await updateHighScore(firebaseService, selectedProfile, finalScore);

                if (gameLoop.victory) {
                    if (selectedMode === 'mode3') {
                        if (domRefs.uiTitle) domRefs.uiTitle.innerText = "SOUL ASCENDED!";
                        if (domRefs.uiMsg) domRefs.uiMsg.innerText = `Congratulations, ${selectedProfile}! You answered all questions of the soul and conquered death.`;
                    } else {
                        if (domRefs.uiTitle) domRefs.uiTitle.innerText = "Victory!";
                        if (domRefs.uiMsg) domRefs.uiMsg.innerText = `Congratulations, ${selectedProfile}! You captured all targets.`;
                    }
                } else {
                    if (selectedMode === 'mode3') {
                        if (domRefs.uiTitle) domRefs.uiTitle.innerText = "FATE SEALED";
                        if (domRefs.uiMsg) domRefs.uiMsg.innerText = `Sorry mate, you faced death before you found your answers...`;
                    } else {
                        const cause = gameLoop.lastCollisionReason ? ` (${gameLoop.lastCollisionReason})` : '';
                        if (domRefs.uiTitle) domRefs.uiTitle.innerText = "Game Over";
                        if (domRefs.uiMsg) domRefs.uiMsg.innerText = `${selectedProfile}'s Tactical Session Concluded${cause}.`;
                    }
                }

                if (domRefs.overlayCard || (domRefs.uiOverlay && domRefs.uiOverlay.querySelector('.overlay-card'))) {
                    const card = domRefs.overlayCard || domRefs.uiOverlay.querySelector('.overlay-card');
                    if (card) card.classList.add('has-breakdown');
                }

                hudController.renderScoreBreakdown(breakdown, gameLoop.capturedCriminals || [], selectedMode, gameRules);

                if (domRefs.startBtn) {
                    domRefs.startBtn.innerText = "Play Again";
                    domRefs.startBtn.disabled = false;
                    domRefs.startBtn.onclick = () => window.location.reload();
                }
            };

            // Bootstrap level 1 & start main tick
            levelManager.advanceLevel();
            currentLevel = 1;
            if (domRefs.hudLevel) domRefs.hudLevel.innerText = '1';
            gameLoop.start();
        });
    }
}

// Bootstrap Application
bootstrap();
