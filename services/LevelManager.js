export class LevelManager {
    constructor(
        gridState, 
        targetManager, 
        gameLoop, 
        targetsPerLevel = 5, 
        maxSimultaneousTargets = 3, 
        maxLevels = 3,
        levelTargetSpecs = null,
        emotionalQuestions = null,
        levelHazards = null
    ) {
        this.gridState = gridState;
        this.targetManager = targetManager;
        this.gameLoop = gameLoop;
        
        this.targetsPerLevel = targetsPerLevel;
        this.maxSimultaneousTargets = maxSimultaneousTargets;
        this.maxLevels = maxLevels;
        this.levelTargetSpecs = levelTargetSpecs;
        this.levelHazards = levelHazards;
        this.emotionalQuestions = emotionalQuestions || [
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
        ];
        this.capturedThisLevel = 0;
        this.currentLevelIndex = 0;
        this.currentQuestion = "";
    }

    /**
     * Call this whenever the GameLoop detects a valid capture.
     */
    handleCapture() {
        this.capturedThisLevel++;
        // Mode 3: Player can only take down one chosen target answer per level
        const targetGoal = (this.gridState.playMode === 'mode3') ? 1 : (this.activeTargetsPerLevel || this.targetsPerLevel);
        if (this.capturedThisLevel >= targetGoal) {
            this.advanceLevel();
        }
    }

    /**
     * Seamless level transition logic.
     */
    advanceLevel() {
        if (this.gameLoop && this.gameLoop.scoreManager) {
            // Only apply level completion score if we actually played a level (not on initial bootstrap)
            if (this.levelStartTime) {
                const elapsed = (performance.now() - this.levelStartTime) / 1000;
                this.gameLoop.scoreManager.completeLevel(undefined, elapsed);
            }
        }

        this.currentLevelIndex++;

        if (this.currentLevelIndex > this.maxLevels) {
            if (this.gameLoop) {
                this.gameLoop.victory = true;
                this.gameLoop.stop();
            }
            return;
        }

        this.levelStartTime = performance.now();
        this.capturedThisLevel = 0;
        let activeCount = this.targetsPerLevel;
        
        // Allocate level target pool based on mode
        if (this.gridState.playMode === 'mode3') {
            const qList = this.emotionalQuestions || [];
            const qConfig = qList.find(q => q.level === this.currentLevelIndex) || qList[(this.currentLevelIndex - 1) % (qList.length || 1)];
            this.currentQuestion = qConfig ? qConfig.question : "Choose your path...";

            const optionLabels = ['A', 'B', 'C', 'D', 'E'];
            const colorMap = ['#00f0ff', '#ff00aa', '#ffd700', '#00ff88', '#ff7700'];
            const answers = qConfig?.answers || [
                { text: "Option A", value: 50 },
                { text: "Option B", value: 70 }
            ];
            
            const recordsForLevel = answers.map((ans, idx) => ({
                ID: `eq-lvl${this.currentLevelIndex}-ans${idx}`,
                Name: ans.text,
                Answer_Text: ans.text,
                Option_Label: optionLabels[idx] || `${idx + 1}`,
                Color: colorMap[idx % colorMap.length],
                Computed_Value: ans.value || 50,
                Avatar_Asset_Path: 'assets/avatars/placeholder.png'
            }));

            this.currentRecordsForLevel = recordsForLevel;

            if (this.targetManager) {
                this.targetManager.setLevelPool(recordsForLevel);
            }
            activeCount = recordsForLevel.length;
        } else if (this.targetManager && this.targetManager.registryService && typeof this.targetManager.registryService.getRecordsForLevel === 'function') {
            const recordsForLevel = this.targetManager.registryService.getRecordsForLevel(
                this.currentLevelIndex, 
                this.targetsPerLevel,
                this.levelTargetSpecs
            );
            if (recordsForLevel && recordsForLevel.length > 0) {
                this.targetManager.setLevelPool(recordsForLevel);
                activeCount = recordsForLevel.length;
            }
        }
        this.activeTargetsPerLevel = activeCount;

        if (this.gridState && typeof this.gridState.resetHunterPosition === 'function') {
            this.gridState.resetHunterPosition();
        }

        // Clear any uncaptured targets from previous level
        this.gridState.activeTargets.clear();

        // Spawn all configured targets for this level up front
        let spawnedAny = false;
        const countToSpawn = this.activeTargetsPerLevel || this.targetsPerLevel;
        for (let i = 0; i < countToSpawn; i++) {
            const newTarget = this.targetManager.spawnTarget();
            if (newTarget) spawnedAny = true;
        }

        // Spawn threat figures in Criminal mode (mode1) and Emotional Death mode (mode3)
        if (this.gridState.playMode === 'mode1' || this.gridState.playMode === 'mode3') {
            // Count dynamic risk hazards accumulated from brutal player takedowns
            const extraBossCount = (Array.isArray(this.gridState.hazards))
                ? this.gridState.hazards.filter(h => h.id && h.id.includes('dyn-crime_boss')).length
                : 0;
            const extraPoliceCount = (Array.isArray(this.gridState.hazards))
                ? this.gridState.hazards.filter(h => h.id && h.id.includes('dyn-police_patrol')).length
                : 0;

            let specForLevel = null;
            if (Array.isArray(this.levelHazards)) {
                const found = this.levelHazards.find(h => h.level === this.currentLevelIndex);
                if (found && Array.isArray(found.hazards)) specForLevel = found.hazards;
            }

            if (specForLevel) {
                this.gridState.spawnHazards(specForLevel);
            } else if (this.currentLevelIndex === 2) {
                this.gridState.spawnHazards([
                    { type: 'crime_boss', name: 'Crime Boss', icon: '🦹', color: '#ff0055', count: 1 },
                    { type: 'police_patrol', name: 'Police Patrol', icon: '🚔', color: '#0088ff', count: 1 }
                ]);
            } else if (this.currentLevelIndex >= 3) {
                this.gridState.spawnHazards([
                    { type: 'crime_boss', name: 'Crime Boss', icon: '🦹', color: '#ff0055', count: 1 },
                    { type: 'police_patrol', name: 'Police Patrol', icon: '🚔', color: '#0088ff', count: 1 },
                    { type: 'death_reaper', name: 'Death Reaper', icon: '💀', color: '#aa00ff', count: 1 }
                ]);
            } else {
                this.gridState.spawnBoss();
            }

            // Re-apply accumulated risk heat hazards into new level
            for (let b = 0; b < extraBossCount; b++) {
                this.gridState.addHazard('crime_boss');
            }
            for (let p = 0; p < extraPoliceCount; p++) {
                this.gridState.addHazard('police_patrol');
            }
        }
        
        if (!spawnedAny) {
            // Session complete, no registry data left
            if (this.gameLoop) {
                this.gameLoop.victory = true;
                this.gameLoop.stop();
            }
        }
    }
}
