/**
 * Viper Hunt - Main Entry Point
 * Wires dependencies and initiates Game Loop
 */
import { RegistryService } from './services/RegistryService.js';
import { GameLoop } from './services/GameLoop.js';
import { Renderer } from './services/Renderer.js';
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
import { eventBus, EVENTS } from './services/EventBus.js';
import { configManager } from './services/ConfigManager.js';

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
    await configManager.loadLocalConfig();
    const firebaseConfig = configManager.getRawFirebaseConfig();
    let firebaseSdk = null;

    if (firebaseConfig) {
        try {
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
        } catch (e) {
            console.warn("[main] Firebase setup skipped/failed. Local fallback enabled.", e);
        }
    }

    firebaseService = new FirebaseService(firebaseSdk, firebaseConfig);
    await configManager.syncWithCloud(firebaseService);

    const gameRules = configManager.getAll();
    const isGeminiEnabled = configManager.isFeatureEnabled('GEMINI');
    const activeProxyUrl = isGeminiEnabled ? configManager.getGeminiProxyUrl() : '';

    // UI Status Badge for Serverless Cloud Function Proxy
    const geminiStatusBadge = document.getElementById('gemini-status-badge');
    if (geminiStatusBadge) {
        if (activeProxyUrl) {
            geminiStatusBadge.classList.add('active');
            geminiStatusBadge.innerText = '⚡ GEMINI AI ONLINE (SECURE PROXY)';
        } else {
            geminiStatusBadge.classList.remove('active');
            geminiStatusBadge.innerText = '⚙️ PROCEDURAL ENGINE';
        }
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
    if (gameRules.voiceStyle) {
        audioService.setVoiceStyle(gameRules.voiceStyle);
    }

    const sfxToggleBtn = document.getElementById('sfx-toggle-btn');
    const bgmToggleBtn = document.getElementById('bgm-toggle-btn');
    const voiceToggleBtn = document.getElementById('voice-toggle-btn');
    const sfxVolSlider = document.getElementById('sfx-volume-slider');
    const bgmVolSlider = document.getElementById('bgm-volume-slider');
    const bgmTrackSelect = document.getElementById('bgm-track-select');
    const voiceStyleSelect = document.getElementById('voice-style-select');
    const renderEngineDropdown = document.getElementById('render-engine-dropdown');

    if (renderEngineDropdown) {
        const savedEngineMode = localStorage.getItem('viper_hunt_render_mode') || '2d';
        renderEngineDropdown.value = savedEngineMode;
        renderEngineDropdown.addEventListener('change', (e) => {
            localStorage.setItem('viper_hunt_render_mode', e.target.value);
        });
    }

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
        if (voiceStyleSelect) {
            voiceStyleSelect.value = audioService.voiceStyle;
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

    if (voiceStyleSelect) {
        voiceStyleSelect.addEventListener('change', (e) => {
            audioService.setVoiceStyle(e.target.value);
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
                if (hud) hud.classList.add('mode1-hud');
            } else {
                attackSelectorHud.classList.add('hidden');
                if (hud) hud.classList.remove('mode1-hud');
            }
        }

        function renderAttackSelectorHud() {
            if (!attackButtonsContainer || selectedMode !== 'mode1') return;
            const attacks = attackManager.getAttackList();
            attackButtonsContainer.innerHTML = attacks.map(att => {
                const usesLabel = att.currentUses < 0 ? '∞' : att.currentUses;
                const outOfAmmo = att.currentUses === 0;
                const riskClass = att.policeDelta < 0 ? 'safe-risk' : (att.policeDelta > 0 || att.crimeBossDelta > 0) ? 'danger-risk' : 'neutral-risk';
                const riskBadge = att.riskDescription || 'Standard Operational Risk';
                return `
                    <div class="attack-btn ${att.isActive ? 'active' : ''} ${outOfAmmo ? 'out-of-ammo' : ''}" 
                         data-key="${att.key}" 
                         title="${att.name} — ${riskBadge}"
                         style="--att-color: ${att.color}">
                        <div class="attack-btn-top">
                            <span class="attack-key-badge">[${att.key}]</span>
                            <span class="attack-icon">${att.icon}</span>
                            <span class="attack-name">${att.name}</span>
                            <span class="attack-multiplier">${att.multiplier}x</span>
                            <span class="attack-uses">(${usesLabel})</span>
                        </div>
                        <div class="attack-risk-tag ${riskClass}">
                            ${riskBadge}
                        </div>
                    </div>
                `;
            }).join('');

            attackButtonsContainer.querySelectorAll('.attack-btn').forEach(btn => {
                const handleSelect = (e) => {
                    if (e.cancelable && e.type === 'touchstart') e.preventDefault();
                    const key = btn.getAttribute('data-key');
                    if (attackManager.selectAttack(key)) {
                        renderAttackSelectorHud();
                    }
                };
                btn.addEventListener('click', handleSelect);
                btn.addEventListener('touchstart', handleSelect, { passive: false });
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
        const renderer = new RenderManager('game-canvas', 'three-canvas', 32);

        // 2D ↔ 3D Render Engine Mode Toggle Button Wiring
        const renderModeToggleBtn = document.getElementById('render-mode-toggle-btn');
        if (typeof renderer.setMode === 'function') {
            const selectedEngineMode = renderEngineDropdown ? renderEngineDropdown.value : (localStorage.getItem('viper_hunt_render_mode') || '2d');
            renderer.setMode(selectedEngineMode);

            const updateToggleBtnLabel = (mode) => {
                if (renderModeToggleBtn) {
                    renderModeToggleBtn.classList.toggle('mode-3d', mode === '3d');
                    renderModeToggleBtn.querySelector('span').innerText = mode === '3d' ? '🎲 VIEW: 3D' : '👁️ VIEW: 2D';
                }
                if (renderEngineDropdown) {
                    renderEngineDropdown.value = mode;
                }
            };

            updateToggleBtnLabel(renderer.getMode());

            renderer.onModeChange = (mode) => {
                localStorage.setItem('viper_hunt_render_mode', mode);
                updateToggleBtnLabel(mode);
            };

            if (renderModeToggleBtn) {
                const handleModeToggle = (e) => {
                    if (e.cancelable && e.type === 'touchstart') e.preventDefault();
                    const nextMode = renderer.getMode() === '2d' ? '3d' : '2d';
                    renderer.setMode(nextMode);
                };

                renderModeToggleBtn.addEventListener('click', handleModeToggle);
                renderModeToggleBtn.addEventListener('touchstart', handleModeToggle, { passive: false });
            }
        }
        const targetManager = new TargetManager(gridState, registryService);
        const scoreManager = new ScoreManager();
        const adaptiveDifficultyService = new AdaptiveDifficultyService();
        const llmService = new LLMService(activeProxyUrl);
        const isWeatherEnabled = firebaseConfig?.enableWeatherSystem !== false && gameRules.enableWeatherSystem !== false;
        const weatherService = new WeatherService('tokyo');
        const hudWeatherLevel = document.getElementById('hud-weather-level');

        if (isWeatherEnabled) {
            weatherService.fetchLiveWeather().then(weatherInfo => {
                renderer.setWeatherState(weatherInfo.weather);
                const badge = weatherService.getWeatherBadgeInfo();
                if (hudWeatherLevel) {
                    hudWeatherLevel.innerText = badge.label;
                    hudWeatherLevel.style.color = badge.color;
                    hudWeatherLevel.title = `${badge.desc} (${weatherInfo.city})`;
                }
            });
        } else {
            weatherService.setOverrideWeather('CLEAR');
            renderer.setWeatherState('CLEAR');
            if (hudWeatherLevel) {
                hudWeatherLevel.innerText = 'OFFLINE (ADMIN)';
                hudWeatherLevel.style.color = '#888888';
                hudWeatherLevel.title = 'Weather System Disabled by Admin Config';
            }
        }

        // Developer Console Weather Override Helper
        window.setWeatherOverride = (weatherType) => {
            weatherService.setOverrideWeather(weatherType);
            renderer.setWeatherState(weatherService.currentWeather);
            const badge = weatherService.getWeatherBadgeInfo();
            if (hudWeatherLevel) {
                hudWeatherLevel.innerText = badge.label;
                hudWeatherLevel.style.color = badge.color;
            }
            console.log(`[WeatherService] Manual Weather Override set to: ${weatherService.currentWeather}`);
        };

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
            inputHandler, gridState, collisionDetector, targetManager, playMode: selectedMode, attackManager, adaptiveDifficultyService
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

        // --- Event Bus Wiring (Decoupling) ---
        eventBus.on(EVENTS.GAME_STARTED, () => {
            if (audioService && typeof audioService.startBGM === 'function') {
                audioService.startBGM();
            }
        });

        eventBus.on(EVENTS.GAME_STOPPED, () => {
            if (audioService && typeof audioService.stopBGM === 'function') {
                audioService.stopBGM();
            }
        });

        eventBus.on(EVENTS.TARGET_CAPTURED, (payload) => {
            let confession = '';
            if (llmService && typeof llmService._synthesizeProceduralConfession === 'function') {
                confession = llmService._synthesizeProceduralConfession(payload.target.Name, payload.target.Incident, payload.attackInfo.name);
            }

            if (scoreManager) {
                if (typeof scoreManager.recordCriminalCapture === 'function') {
                    scoreManager.recordCriminalCapture(payload.target, payload.attackInfo, payload.addedScore, confession);
                }
                scoreManager.addCaptureValue(payload.addedScore);
            }

            if (levelManager) {
                levelManager.handleCapture();
            }

            if (audioService && typeof audioService.playAttackSound === 'function') {
                audioService.playAttackSound(payload.attackIdToPlay);
            }

            if (renderer) {
                const cs = renderer.cellSize || 32;
                const px = payload.position.x * cs + cs / 2;
                const py = payload.position.y * cs;
                if (typeof renderer.emitSparks === 'function') {
                    renderer.emitSparks(px, py + cs / 2, payload.popupColor, 18);
                }
                if (typeof renderer.addFloatingText === 'function') {
                    renderer.addFloatingText(px, py, payload.popupText, payload.popupColor);
                }
            }
        });

        eventBus.on(EVENTS.GAME_OVER, (payload) => {
            if (audioService && typeof audioService.playGameOverSound === 'function') {
                audioService.playGameOverSound();
            }
        });

        eventBus.on(EVENTS.RENDER_TICK, (state) => {
            if (renderer && typeof renderer.renderFrame === 'function') {
                renderer.renderFrame(state);
            }
        });

        eventBus.on(EVENTS.THREAT_LEVEL_CHANGED, (threat) => {
            const hudThreat = document.getElementById('hud-threat-level');
            if (hudThreat) {
                hudThreat.innerText = threat.label;
                hudThreat.style.color = threat.color;
            }
        });

        eventBus.on(EVENTS.RISK_OUTCOMES_APPLIED, (payload) => {
            if (renderer && Array.isArray(payload.outcomes)) {
                const cs = renderer.cellSize || 32;
                const px = payload.position.x * cs + cs / 2;
                const py = payload.position.y * cs;
                payload.outcomes.forEach((oc, i) => {
                    const color = oc.type.includes('boss') ? '#ff0055' : oc.type.includes('remove') ? '#00f0ff' : '#0088ff';
                    setTimeout(() => {
                        if (renderer && typeof renderer.addFloatingText === 'function') {
                            renderer.addFloatingText(px, py - (i + 1) * 22, oc.text, color);
                        }
                    }, (i + 1) * 150);
                });
            }
        });
        // --- End Event Bus Wiring ---

        // HUD Update Loop
        let currentLevel = 1;
        const originalAdvanceLevel = levelManager.advanceLevel.bind(levelManager);
        levelManager.advanceLevel = () => {
            currentLevel++;
            hudLevel.innerText = currentLevel;
            originalAdvanceLevel();
        };

        let prevTargetSignature = '';
        let prevAttackSignature = '';
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
                    const attacks = attackManager.getAttackList();
                    const attackSig = attacks.map(a => `${a.id}-${a.currentUses}-${a.isActive}`).join('|');
                    if (attackSig !== prevAttackSignature) {
                        prevAttackSignature = attackSig;
                        renderAttackSelectorHud();
                    }
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

                // 2. Build Compact Log (Only if gameRules.showCriminalPunishmentLog is set to true in Admin Game Rules)
                if (gameRules && gameRules.showCriminalPunishmentLog === true) {
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
                }
            } else if (selectedMode === 'mode1' && gameRules && gameRules.showCriminalPunishmentLog === true) {
                compactLogHtml = `
                    <div class="criminal-log-section">
                        <div class="criminal-log-title">
                            <span>CRIMINAL PUNISHMENT & CAPTURE LOG</span>
                        </div>
                        <div class="no-captures-badge">[ NO TARGETS CAPTURED THIS SESSION ]</div>
                    </div>
                `;
            }

            const alignment = breakdown.alignment || {};
            const persona = alignment.persona || { title: 'Unrated Operative', description: 'No tactical captures completed.', color: '#888888', brutalityLabel: 'None' };
            const netScore = alignment.netScore || 0;
            const riskStats = alignment.riskStats || { policeDelta: 0, crimeBossDelta: 0 };

            const alignmentCardHtml = selectedMode === 'mode1' ? `
                <div class="alignment-evaluation-card" style="--persona-color: ${persona.color}">
                    <div class="alignment-card-header">
                        <div class="alignment-title-wrap">
                            <span class="alignment-icon">⚖️</span>
                            <span class="alignment-label">TACTICAL MORALITY & ALIGNMENT EVALUATION</span>
                        </div>
                        <div class="alignment-persona-badge" style="background-color: ${persona.color}22; border-color: ${persona.color}; color: ${persona.color};">
                            ${persona.title.toUpperCase()}
                        </div>
                    </div>
                    <div class="alignment-card-body">
                        <p class="alignment-desc">${persona.description}</p>
                        <div class="alignment-stats-row">
                            <div class="alignment-stat">
                                <span class="stat-label">Net Alignment Score:</span>
                                <span class="stat-value" style="color: ${netScore >= 0 ? '#00f0ff' : '#ff0055'};">${netScore > 0 ? '+' : ''}${netScore}</span>
                            </div>
                            <div class="alignment-stat">
                                <span class="stat-label">Brutality Level:</span>
                                <span class="stat-value" style="color: ${persona.color};">${persona.brutalityLabel}</span>
                            </div>
                            <div class="alignment-stat">
                                <span class="stat-label">Police Heat Alteration:</span>
                                <span class="stat-value">${riskStats.policeDelta > 0 ? `+${riskStats.policeDelta} Patrols` : riskStats.policeDelta < 0 ? `${riskStats.policeDelta} Patrols` : '0 (Neutral)'}</span>
                            </div>
                            <div class="alignment-stat">
                                <span class="stat-label">Gang Retaliations:</span>
                                <span class="stat-value" style="color: ${riskStats.crimeBossDelta > 0 ? '#ff0055' : '#00ff88'};">${riskStats.crimeBossDelta > 0 ? `+${riskStats.crimeBossDelta} Crime Bosses` : '0 (None)'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ` : '';

            container.innerHTML = `
        <div class="top-replay-header">
            <button id="top-replay-btn" class="cyber-btn primary top-replay-btn">
                <span>🔄 PLAY AGAIN</span>
            </button>
        </div>
        ${slideshowHtml}
        ${alignmentCardHtml}
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

            const topReplayBtn = container.querySelector('#top-replay-btn');
            if (topReplayBtn) {
                topReplayBtn.addEventListener('click', () => {
                    window.location.reload();
                });
            }

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

