import { CollisionDetector } from '../services/CollisionDetector.js';
import assert from 'node:assert';
import test from 'node:test';

test('CollisionDetector Test Suite', async (t) => {
    
    const detector = new CollisionDetector();
    const gridBounds = { width: 40, height: 22 };

    /*
    ID: TC-018
    Type: Unit
    Linked story: US-004
    Linked task: TASK-008
    Scenario type: Happy path
    Name: detects wall collision when head exceeds right boundary
    Precondition: None
    Input: headCoord (40, 5), gridBounds (40, 22), empty body
    Expected output: true
    Side effects: none
    Mocks / fixtures: none
    Acceptance link: US-004 Scenario 1
    */
    await t.test('TC-018: detects wall collision when head exceeds right boundary', () => {
        const headCoord = { x: 40, y: 5 }; // Exceeds index 39
        const isCollision = detector.checkCollision(headCoord, gridBounds, []);
        assert.strictEqual(isCollision, true);
    });

    /*
    ID: TC-019
    Type: Unit
    Linked story: US-004
    Linked task: TASK-008
    Scenario type: Happy path
    Name: detects wall collision when head exceeds left boundary
    Precondition: None
    Input: headCoord (-1, 5), gridBounds (40, 22), empty body
    Expected output: true
    Side effects: none
    Mocks / fixtures: none
    Acceptance link: US-004 Scenario 1
    */
    await t.test('TC-019: detects wall collision when head exceeds left boundary', () => {
        const headCoord = { x: -1, y: 5 };
        const isCollision = detector.checkCollision(headCoord, gridBounds, []);
        assert.strictEqual(isCollision, true);
    });

    /*
    ID: TC-020
    Type: Unit
    Linked story: US-004
    Linked task: TASK-008
    Scenario type: Happy path
    Name: detects self-collision when head intersects body segment
    Precondition: Hunter has body segments
    Input: headCoord intersecting a body segment coordinate
    Expected output: true
    Side effects: none
    Mocks / fixtures: none
    Acceptance link: US-004 Scenario 2
    */
    await t.test('TC-020: detects self-collision when head intersects body segment', () => {
        const headCoord = { x: 10, y: 10 };
        const bodySegments = [
            { x: 9, y: 10 },
            { x: 10, y: 10 }, // Collision here
            { x: 10, y: 11 }
        ];
        const isCollision = detector.checkCollision(headCoord, gridBounds, bodySegments);
        assert.strictEqual(isCollision, true);
    });

    /*
    ID: TC-021
    Type: Unit
    Linked story: US-004
    Linked task: TASK-008
    Scenario type: Sad path
    Name: returns false for valid open cell move
    Precondition: Head is within bounds and not on body
    Input: valid headCoord
    Expected output: false
    Side effects: none
    Mocks / fixtures: none
    Acceptance link: US-004 Scenario 3
    */
    await t.test('TC-021: returns false for valid open cell move', () => {
        const headCoord = { x: 15, y: 10 };
        const bodySegments = [
            { x: 14, y: 10 },
            { x: 13, y: 10 }
        ];
        const isCollision = detector.checkCollision(headCoord, gridBounds, bodySegments);
        assert.strictEqual(isCollision, false);
    });

    /*
    ID: TC-022
    Type: Unit
    Linked story: US-004
    Linked task: TASK-008
    Scenario type: Boundary
    Name: returns false when head is adjacent to boundary but does not exceed it
    Precondition: None
    Input: headCoord on the exact edge of grid bounds (39, 21)
    Expected output: false
    Side effects: none
    Mocks / fixtures: none
    Acceptance link: US-004 Scenario 4
    */
    await t.test('TC-022: returns false when head is adjacent to boundary but does not exceed it', () => {
        const headCoord = { x: 39, y: 21 }; // Max valid coordinate
        const isCollision = detector.checkCollision(headCoord, gridBounds, []);
        assert.strictEqual(isCollision, false);
    });

    /*
    ID: TC-023
    Type: Security
    Linked story: US-004
    Linked task: TASK-008
    Scenario type: Sad path
    Name: triggers hard failure (true) for malformed state inputs
    Precondition: None
    Input: null headCoord or missing bounds
    Expected output: true
    Side effects: none
    Mocks / fixtures: none
    Acceptance link: US-004 Scenario 5
    */
    await t.test('TC-023: triggers hard failure (true) for malformed state inputs', () => {
        // Missing headCoord
        assert.strictEqual(detector.checkCollision(null, gridBounds, []), true);
        // Missing gridBounds
        assert.strictEqual(detector.checkCollision({ x: 5, y: 5 }, null, []), true);
        // Missing body segments array
        assert.strictEqual(detector.checkCollision({ x: 5, y: 5 }, gridBounds, null), true);
    });

});
