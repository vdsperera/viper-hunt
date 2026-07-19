import { LevelManager } from '../services/LevelManager.js';
import assert from 'node:assert';
import test from 'node:test';

test('LevelManager Test Suite', async (t) => {

    const mockGridState = { width: 11, height: 11, hunter: null, activeTargets: new Map() };
    const mockTargetManager = { spawnTarget: () => ({ ID: 'T1' }) };
    const mockGameLoop = { stop: () => {} };

    t.beforeEach(() => {
        mockGridState.hunter = {
            HeadCoordinate: { x: 1, y: 1 },
            BodySegments: [{ x: 0, y: 1 }]
        };
    });

    /*
    ID: TC-043
    Type: Unit
    Linked story: US-007
    Linked task: TASK-014
    Scenario type: Happy path
    Name: seamless level transition when final target is captured
    Precondition: target limit is 2
    Input: handleCapture called 2nd time
    Expected output: capturedThisLevel resets, Hunter recentered
    Side effects: recenters Hunter, clears body segments, spawns target
    Mocks / fixtures: mockGridState, mockTargetManager
    Acceptance link: US-007 Scenario 1
    */
    await t.test('TC-043: seamless level transition when final target is captured', () => {
        const levelManager = new LevelManager(mockGridState, mockTargetManager, mockGameLoop, 2);
        
        // Capture 1
        levelManager.handleCapture();
        assert.strictEqual(levelManager.capturedThisLevel, 1);
        assert.strictEqual(mockGridState.hunter.HeadCoordinate.x, 1); // Not recentered yet
        
        // Capture 2 (advances level)
        levelManager.handleCapture();
        
        assert.strictEqual(levelManager.capturedThisLevel, 0); // Reset
        assert.strictEqual(mockGridState.hunter.HeadCoordinate.x, 5); // Math.floor(11/2)
        assert.strictEqual(mockGridState.hunter.HeadCoordinate.y, 5);
        assert.strictEqual(mockGridState.hunter.BodySegments.length, 1); // Retained length
    });

    /*
    ID: TC-044
    Type: Unit
    Linked story: US-007
    Linked task: TASK-014
    Scenario type: Sad path
    Name: level does not advance prematurely if active targets remain
    Precondition: target limit is 5
    Input: handleCapture called 3 times
    Expected output: capturedThisLevel = 3, no reset
    Side effects: none
    Mocks / fixtures: None
    Acceptance link: US-007 Scenario 2
    */
    await t.test('TC-044: level does not advance prematurely if active targets remain', () => {
        const levelManager = new LevelManager(mockGridState, mockTargetManager, mockGameLoop, 5);
        
        levelManager.handleCapture();
        levelManager.handleCapture();
        levelManager.handleCapture();
        
        assert.strictEqual(levelManager.capturedThisLevel, 3);
        assert.strictEqual(mockGridState.hunter.HeadCoordinate.x, 1); // Remains untouched
    });

    /*
    ID: TC-045
    Type: Unit
    Linked story: US-008
    Linked task: TASK-014
    Scenario type: Boundary
    Name: recenters hunter correctly on even grid dimensions
    Precondition: None
    Input: 10x10 grid
    Expected output: Head at (5,5)
    Side effects: none
    Mocks / fixtures: None
    Acceptance link: US-008 Scenario 1
    */
    await t.test('TC-045: recenters hunter correctly on even grid dimensions', () => {
        const evenGrid = { width: 10, height: 10, hunter: { HeadCoordinate: {x: 0, y: 0}, BodySegments: [] }, activeTargets: new Map() };
        const levelManager = new LevelManager(evenGrid, mockTargetManager, mockGameLoop, 1);
        
        levelManager.advanceLevel();
        assert.strictEqual(evenGrid.hunter.HeadCoordinate.x, 5);
        assert.strictEqual(evenGrid.hunter.HeadCoordinate.y, 5);
    });

});
