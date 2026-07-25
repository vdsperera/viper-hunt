import test from 'node:test';
import assert from 'node:assert';
import { GridState } from '../services/GridState.js';
import { LevelManager } from '../services/LevelManager.js';
import { TargetManager } from '../services/TargetManager.js';
import { CollisionDetector } from '../services/CollisionDetector.js';
import { HunterEntity, Direction } from '../models/HunterEntity.js';

test('Mode 3 - Emotional Death Quest Mode Test Suite', async (t) => {
    
    await t.test('TC-060: LevelManager populates answer choice targets and question for level 1 in mode3', () => {
        const gridState = new GridState(10, 10);
        gridState.setPlayMode('mode3');
        const targetManager = new TargetManager(gridState, null);
        const levelManager = new LevelManager(gridState, targetManager, null, 5, 3, 3);

        levelManager.advanceLevel();

        assert.strictEqual(levelManager.currentLevelIndex, 1);
        assert.strictEqual(levelManager.currentQuestion, "What gives you strength when facing despair?");
        assert.strictEqual(gridState.activeTargets.size, 3);
        assert.notStrictEqual(gridState.bossPosition, null);
    });

    await t.test('TC-061: Capturing one answer target in mode3 advances immediately to next level', () => {
        const gridState = new GridState(10, 10);
        gridState.setPlayMode('mode3');
        const targetManager = new TargetManager(gridState, null);
        const levelManager = new LevelManager(gridState, targetManager, null, 5, 3, 3);

        levelManager.advanceLevel();
        assert.strictEqual(levelManager.currentLevelIndex, 1);

        // Player captures 1 chosen target answer
        levelManager.handleCapture();

        // Should advance to Level 2
        assert.strictEqual(levelManager.currentLevelIndex, 2);
        assert.strictEqual(levelManager.currentQuestion, "What is your greatest vulnerability?");
        assert.strictEqual(gridState.activeTargets.size, 3);
    });

    await t.test('TC-062: DEATH figure moves towards hunter in mode3', () => {
        const gridState = new GridState(10, 10);
        gridState.setPlayMode('mode3');
        gridState.bossPosition = { x: 0, y: 0 };
        gridState.setHunter(new HunterEntity({
            HeadCoordinate: { x: 5, y: 0 },
            BodySegments: [],
            CurrentDirection: Direction.RIGHT
        }));
        gridState.setBossRules({ bossMoveChance: 1.0, bossAggressiveness: 1.0, bossMoveRange: 1 });

        gridState.moveBoss();

        // Distance should decrease by 1 step towards hunter's head (from x:0 to x:1)
        assert.deepStrictEqual(gridState.bossPosition, { x: 1, y: 0 });
    });

    await t.test('TC-063: CollisionDetector triggers collision when hunter hits DEATH in mode3', () => {
        const collisionDetector = new CollisionDetector();
        const head = { x: 3, y: 3 };
        const bounds = { width: 10, height: 10 };
        const body = [];
        const deathPos = { x: 3, y: 3 };

        const isCollision = collisionDetector.checkCollision(head, bounds, body, deathPos);
        assert.strictEqual(isCollision, true);
    });

    await t.test('TC-064: LevelManager accepts custom emotionalQuestions configuration', () => {
        const customQuestions = [
            {
                level: 1,
                question: "Custom Question 1?",
                answers: [
                    { text: "Choice A1", value: 15 },
                    { text: "Choice B1", value: 25 }
                ]
            }
        ];

        const gridState = new GridState(10, 10);
        gridState.setPlayMode('mode3');
        const targetManager = new TargetManager(gridState, null);
        const levelManager = new LevelManager(gridState, targetManager, null, 5, 3, 1, null, customQuestions);

        levelManager.advanceLevel();

        assert.strictEqual(levelManager.currentQuestion, "Custom Question 1?");
        assert.strictEqual(gridState.activeTargets.size, 2);
    });
});
