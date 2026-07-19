import { GameLoop } from '../services/GameLoop.js';
import assert from 'node:assert';
import test from 'node:test';

test('GameLoop Test Suite', async (t) => {
    
    // Mocks
    const mockInputHandler = { getCurrentDirection: () => 'UP' };
    const mockGridState = {
        width: 10,
        height: 10,
        hunter: { Direction: 'UP', HeadCoordinate: {x: 5, y: 5}, BodySegments: [] },
        activeTargets: new Map(),
        moveHunter: () => {},
        growHunter: () => {}
    };
    const mockCollisionDetector = { checkCollision: () => false };
    const mockTargetManager = { handleCapture: () => ({ Computed_Value: 100 }) };
    const mockRenderer = { renderFrame: () => {} };
    const mockScoreManager = { addCaptureValue: () => {} };

    const deps = {
        inputHandler: mockInputHandler,
        gridState: mockGridState,
        collisionDetector: mockCollisionDetector,
        targetManager: mockTargetManager,
        renderer: mockRenderer,
        scoreManager: mockScoreManager
    };

    t.beforeEach(() => {
        // Reset state
        mockCollisionDetector.checkCollision = () => false;
        mockGridState.activeTargets.clear();
        
        // Mock requestAnimationFrame / cancelAnimationFrame
        global.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
        global.cancelAnimationFrame = (id) => clearTimeout(id);
        global.performance = { now: () => Date.now() };
    });

    /*
    ID: TC-046
    Type: Unit
    Linked story: US-003
    Linked task: TASK-013
    Scenario type: Happy path
    Name: start initiates the requestAnimationFrame loop
    Precondition: dependencies injected
    Input: none
    Expected output: running = true
    Side effects: assigns animationId
    Mocks / fixtures: global.requestAnimationFrame
    Acceptance link: US-003
    */
    await t.test('TC-046: start initiates the requestAnimationFrame loop', () => {
        const loop = new GameLoop(60, deps);
        loop.start();
        assert.strictEqual(loop.running, true);
        assert.ok(loop.animationId);
        loop.stop();
    });

    /*
    ID: TC-047
    Type: Unit
    Linked story: US-004
    Linked task: TASK-013
    Scenario type: Sad path
    Name: halts loop on collision detection
    Precondition: loop is running
    Input: checkCollision returns true
    Expected output: running becomes false
    Side effects: calls stop()
    Mocks / fixtures: mockCollisionDetector
    Acceptance link: US-004 Scenario 1
    */
    await t.test('TC-047: halts loop on collision detection', () => {
        const loop = new GameLoop(60, deps);
        mockCollisionDetector.checkCollision = () => true; // Force collision
        
        loop.start();
        loop.update(); // Trigger collision logic
        
        assert.strictEqual(loop.running, false);
    });

    /*
    ID: TC-048
    Type: Unit
    Linked story: US-005
    Linked task: TASK-013
    Scenario type: Happy path
    Name: triggers target capture and score update when head overlaps target
    Precondition: Target at (5,5)
    Input: none
    Expected output: handleCapture and addCaptureValue called
    Side effects: calls growHunter
    Mocks / fixtures: mockGridState, mockScoreManager
    Acceptance link: US-005 Scenario 1
    */
    await t.test('TC-048: triggers target capture and score update when head overlaps target', (t) => {
        const loop = new GameLoop(60, deps);
        mockGridState.activeTargets.set('5,5', { Computed_Value: 50 });
        
        let addedScore = 0;
        let grew = false;
        mockScoreManager.addCaptureValue = (val) => { addedScore = val; };
        mockGridState.growHunter = () => { grew = true; };
        
        loop.update();
        
        assert.strictEqual(addedScore, 100); // from mockTargetManager
        assert.strictEqual(grew, true);
    });

});
