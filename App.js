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
import { WeatherService } from './services/WeatherService.js';
import { eventBus, EVENTS } from './services/EventBus.js';
import { configManager } from './services/ConfigManager.js';
import { UIController } from './services/UIController.js';
import { StreakManager } from './services/StreakManager.js';

export class App {
    constructor() {
        this.firebaseService = null;
        this.audioService = null;
        this.uiController = null;
        
        // Game components
        this.gameLoop = null;
        this.levelManager = null;
        this.scoreManager = null;
    }

    async start() {
        // 1. Boot Config
        await configManager.loadLocalConfig();
        const firebaseConfig = configManager.getRawFirebaseConfig();
        let firebaseSdk = null;

        if (firebaseConfig) {
            try {
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
                console.warn("[App] Firebase setup skipped/failed.", e);
            }
        }

        // 2. Init Core Services
        this.firebaseService = new FirebaseService(firebaseSdk, firebaseConfig);
        await configManager.syncWithCloud(this.firebaseService);

        const gameRules = configManager.getAll();
        
        const registryService = new RegistryService(null, 'data/fallback_registry.json');
        
        this.audioService = new AudioService();
        if (gameRules.voiceStyle) {
            this.audioService.setVoiceStyle(gameRules.voiceStyle);
        }

        // 3. Init UI Controller
        this.uiController = new UIController(this, this.audioService, this.firebaseService);
        this.uiController.initMainUI();
        
        try {
            await registryService.loadRegistry();
            this.uiController.onRegistryLoaded();
            await this.uiController.loadProfiles();
        } catch (e) {
            console.error("[App] Fatal Error loading registry:", e);
            this.uiController.showFatalError("Failed to load registry data: " + (e.message || e));
            return;
        }
        
        this.registryService = registryService;
    }

    startGame(selectedMode, selectedProfile) {
        const gameRules = configManager.getAll();
        const isGeminiEnabled = configManager.isFeatureEnabled('GEMINI');
        const activeProxyUrl = isGeminiEnabled ? configManager.getGeminiProxyUrl() : '';

        const attackManager = new AttackManager(gameRules.attackTypes);

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
        this.uiController.bindGameInput(inputHandler, attackManager, selectedMode);

        const collisionDetector = new CollisionDetector();
        const renderer = new RenderManager('game-canvas', 'three-canvas', 32);
        this.uiController.bindRendererUI(renderer);

        const targetManager = new TargetManager(gridState, this.registryService);
        this.scoreManager = new ScoreManager();
        this.streakManager = new StreakManager(5000); // 5 seconds window
        const adaptiveDifficultyService = new AdaptiveDifficultyService();
        const llmService = new LLMService(activeProxyUrl);
        const weatherService = new WeatherService('tokyo');

        const isWeatherEnabled = configManager.isFeatureEnabled('WEATHER');
        if (isWeatherEnabled) {
            weatherService.fetchLiveWeather().then(weatherInfo => {
                renderer.setWeatherState(weatherInfo.weather);
                this.uiController.updateWeatherBadge(weatherService.getWeatherBadgeInfo(), weatherInfo.city);
            });
        } else {
            weatherService.setOverrideWeather('CLEAR');
            renderer.setWeatherState('CLEAR');
            this.uiController.setOfflineWeatherBadge();
        }

        // Developer Helper
        window.setWeatherOverride = (weatherType) => {
            weatherService.setOverrideWeather(weatherType);
            renderer.setWeatherState(weatherService.currentWeather);
            this.uiController.updateWeatherBadge(weatherService.getWeatherBadgeInfo(), null);
        };

        this.uiController.bindThreatLevel(adaptiveDifficultyService);

        this.gameLoop = new GameLoop(gameRules.fps, {
            inputHandler, gridState, collisionDetector, targetManager, playMode: selectedMode, attackManager, adaptiveDifficultyService
        });

        this.levelManager = new LevelManager(
            gridState,
            targetManager,
            this.gameLoop,
            gameRules.targetsPerLevel,
            gameRules.maxSimultaneousTargets,
            gameRules.maxLevels,
            gameRules.levelTargetSpecs,
            gameRules.emotionalQuestions,
            gameRules.levelHazards
        );

        this.setupGameEventWiring(llmService, renderer, selectedProfile, selectedMode);

        // Bootstrap the first level and commence tick
        this.levelManager.advanceLevel();
        this.uiController.resetLevelHUD();
        this.gameLoop.start();
        
        // Start HUD Interval
        this.uiController.startGameHUDLoop(this.gameLoop, this.scoreManager, selectedMode, gridState, attackManager);
    }

    setupGameEventWiring(llmService, renderer, selectedProfile, selectedMode) {
        // Event Bus Wiring (Decoupling)
        eventBus.on(EVENTS.GAME_STARTED, () => {
            if (this.audioService && typeof this.audioService.startBGM === 'function') {
                this.audioService.startBGM();
            }
        });

        eventBus.on(EVENTS.GAME_STOPPED, () => {
            if (this.audioService && typeof this.audioService.stopBGM === 'function') {
                this.audioService.stopBGM();
            }
        });

        eventBus.on(EVENTS.TICK, () => {
            if (this.streakManager) this.streakManager.tick();
        });

        eventBus.on(EVENTS.STREAK_UPDATED, (payload) => {
            if (this.gameLoop) {
                this.gameLoop.setSpeedMultiplier(payload.speedMultiplier);
            }
            if (this.uiController && typeof this.uiController.updateStreakHUD === 'function') {
                this.uiController.updateStreakHUD(payload);
            }
        });

        eventBus.on(EVENTS.TARGET_CAPTURED, (payload) => {
            if (this.streakManager) {
                this.streakManager.handleCapture();
                payload.addedScore = Math.round(payload.addedScore * this.streakManager.scoreMultiplier);
            }

            let confession = '';
            if (llmService && typeof llmService._synthesizeProceduralConfession === 'function') {
                confession = llmService._synthesizeProceduralConfession(payload.target.Name, payload.target.Incident, payload.attackInfo.name);
            }

            if (this.scoreManager) {
                if (typeof this.scoreManager.recordCriminalCapture === 'function') {
                    this.scoreManager.recordCriminalCapture(payload.target, payload.attackInfo, payload.addedScore, confession);
                }
                this.scoreManager.addCaptureValue(payload.addedScore);
            }

            if (this.levelManager) {
                this.levelManager.handleCapture();
            }

            if (this.audioService && typeof this.audioService.playAttackSound === 'function') {
                this.audioService.playAttackSound(payload.attackIdToPlay);
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
            if (this.audioService && typeof this.audioService.playGameOverSound === 'function') {
                this.audioService.playGameOverSound();
            }
        });

        eventBus.on(EVENTS.RENDER_TICK, (state) => {
            if (renderer && typeof renderer.renderFrame === 'function') {
                renderer.renderFrame(state);
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

        // Intercept Level Advance for UI Update
        const originalAdvanceLevel = this.levelManager.advanceLevel.bind(this.levelManager);
        let currentLevel = 0;
        this.levelManager.advanceLevel = () => {
            currentLevel++;
            this.uiController.updateLevelHUD(currentLevel);
            originalAdvanceLevel();
            
            if (selectedMode === 'mode3') {
                this.uiController.renderEQHUD(this.levelManager.currentQuestion, this.levelManager.currentRecordsForLevel);
            }
        };

        // Intercept GameLoop stop to show Game Over UI
        const originalStop = this.gameLoop.stop.bind(this.gameLoop);
        this.gameLoop.stop = async () => {
            originalStop();
            this.uiController.stopGameHUDLoop();
            
            const finalScore = this.scoreManager.getSessionScore();
            const breakdown = this.scoreManager.getScoreBreakdown();
            const isVictory = this.gameLoop.victory;
            const collisionReason = this.gameLoop.lastCollisionReason;
            
            await this.uiController.handleGameOver(selectedProfile, selectedMode, finalScore, breakdown, isVictory, collisionReason);
        };
    }
}
