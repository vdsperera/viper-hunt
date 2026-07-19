import { GridState } from '../services/GridState.js';
import { Direction } from '../models/HunterEntity.js';
import assert from 'node:assert';
import test from 'node:test';

test('GridState Test Suite', async (t) => {
    
    /*
    ID: TC-040
    Type: Unit
    Linked story: US-003
    Linked task: TASK-007
    Scenario type: Happy path
    Name: moveHunter advances head and shifts tail segments correctly
    Precondition: Hunter is facing UP
    Input: none (calls moveHunter)
    Expected output: Head Y decreases, body shifts
    Side effects: modifies hunter coordinates
    Mocks / fixtures: None
    Acceptance link: US-003 Scenario 1
    */
    await t.test('TC-040: moveHunter advances head and shifts tail segments correctly', () => {
        const grid = new GridState(10, 10);
        grid.setHunter({
            HeadCoordinate: { x: 5, y: 5 },
            BodySegments: [{ x: 5, y: 6 }, { x: 5, y: 7 }],
            Direction: Direction.UP
        });
        
        grid.moveHunter();
        
        assert.strictEqual(grid.hunter.HeadCoordinate.x, 5);
        assert.strictEqual(grid.hunter.HeadCoordinate.y, 4);
        assert.strictEqual(grid.hunter.BodySegments.length, 2);
        assert.strictEqual(grid.hunter.BodySegments[0].x, 5);
        assert.strictEqual(grid.hunter.BodySegments[0].y, 5);
        assert.strictEqual(grid.hunter.BodySegments[1].x, 5);
        assert.strictEqual(grid.hunter.BodySegments[1].y, 6);
    });

    /*
    ID: TC-041
    Type: Unit
    Linked story: US-006
    Linked task: TASK-007
    Scenario type: Happy path
    Name: growHunter appends segment on next move
    Precondition: Hunter is moving RIGHT
    Input: none (calls growHunter then moveHunter)
    Expected output: Body array length increases by 1
    Side effects: modifies hunter length
    Mocks / fixtures: None
    Acceptance link: US-006 Scenario 1
    */
    await t.test('TC-041: growHunter appends segment on next move', () => {
        const grid = new GridState(10, 10);
        grid.setHunter({
            HeadCoordinate: { x: 5, y: 5 },
            BodySegments: [{ x: 4, y: 5 }],
            Direction: Direction.RIGHT,
            growPending: false
        });
        
        grid.growHunter(); // Sets growPending = true
        grid.moveHunter(); // Should advance head and keep old tail
        
        assert.strictEqual(grid.hunter.BodySegments.length, 2); // Was 1, now 2
    });

    /*
    ID: TC-041b
    Type: Unit
    Linked story: US-006
    Linked task: TASK-007
    Scenario type: Happy path
    Name: growHunter supports different growth tiers based on target value
    Precondition: None
    Input: target values (20, 50, 80, 100)
    Expected output: growAmount corresponds to tier values (1, 2, 3, 4)
    Side effects: modifies hunter.growAmount
    Mocks / fixtures: None
    Acceptance link: US-006 Scenario 1
    */
    await t.test('TC-041b: growHunter supports different growth tiers based on target value', () => {
        const grid = new GridState(10, 10);
        
        // Tier 1: Value 20 (Low: 0-39) -> should grow by 1
        grid.setHunter({
            HeadCoordinate: { x: 5, y: 5 },
            BodySegments: [],
            Direction: Direction.RIGHT,
            growAmount: 0
        });
        grid.growHunter(20);
        assert.strictEqual(grid.hunter.growAmount, 1);

        // Tier 2: Value 50 (Medium: 40-69) -> should grow by 2
        grid.hunter.growAmount = 0;
        grid.growHunter(50);
        assert.strictEqual(grid.hunter.growAmount, 2);

        // Tier 3: Value 80 (High: 70-89) -> should grow by 3
        grid.hunter.growAmount = 0;
        grid.growHunter(80);
        assert.strictEqual(grid.hunter.growAmount, 3);

        // Tier 4: Value 100 (Elite: 90+) -> should grow by 4
        grid.hunter.growAmount = 0;
        grid.growHunter(100);
        assert.strictEqual(grid.hunter.growAmount, 4);
    });


    /*
    ID: TC-042
    Type: Unit
    Linked story: US-005
    Linked task: TASK-007
    Scenario type: Happy path
    Name: isCellOccupied correctly identifies hunter position
    Precondition: Hunter has head and body
    Input: (5,5) head, (5,6) body, (0,0) empty
    Expected output: true, true, false
    Side effects: none
    Mocks / fixtures: None
    Acceptance link: US-005 Scenario 2
    */
    await t.test('TC-042: isCellOccupied correctly identifies hunter position', () => {
        const grid = new GridState(10, 10);
        grid.setHunter({
            HeadCoordinate: { x: 5, y: 5 },
            BodySegments: [{ x: 5, y: 6 }],
            Direction: Direction.UP
        });
        
        assert.strictEqual(grid.isCellOccupied(5, 5), true); // Head
        assert.strictEqual(grid.isCellOccupied(5, 6), true); // Body
        assert.strictEqual(grid.isCellOccupied(0, 0), false); // Empty
    });

});
