import { GridState } from '../services/GridState.js';
import assert from 'node:assert';
import test from 'node:test';

test('Boss Aggressiveness & Movement Test Suite', async (t) => {
    
    await t.test('TC-050: moveBoss respects bossMoveChance = 0 (never moves)', () => {
        const grid = new GridState(10, 10);
        grid.setPlayMode('mode1');
        grid.bossPosition = { x: 5, y: 5 };
        grid.setBossRules({ bossMoveChance: 0, bossAggressiveness: 0.5, bossMoveRange: 1 });

        // Run 50 ticks
        for (let i = 0; i < 50; i++) {
            grid.moveBoss();
        }

        assert.deepStrictEqual(grid.bossPosition, { x: 5, y: 5 });
    });

    await t.test('TC-051: bossAggressiveness = 1.0 relentlessly moves boss closer to hunter head', () => {
        const grid = new GridState(10, 10);
        grid.setPlayMode('mode1');
        grid.bossPosition = { x: 0, y: 0 };
        grid.setHunter({ HeadCoordinate: { x: 5, y: 0 }, BodySegments: [] });
        grid.setBossRules({ bossMoveChance: 1.0, bossAggressiveness: 1.0, bossMoveRange: 1 });

        // Initial distance is 5 cells
        const initialDist = Math.abs(grid.bossPosition.x - 5) + Math.abs(grid.bossPosition.y - 0);
        assert.strictEqual(initialDist, 5);

        // Move 1 tick
        grid.moveBoss();

        // Distance after 1 aggressive step should be 4 cells
        const newDist = Math.abs(grid.bossPosition.x - 5) + Math.abs(grid.bossPosition.y - 0);
        assert.strictEqual(newDist, 4);
        assert.strictEqual(grid.bossPosition.x, 1);
        assert.strictEqual(grid.bossPosition.y, 0);
    });

    await t.test('TC-052: bossMoveRange > 1 allows boss to take multi-step moves in single tick', () => {
        const grid = new GridState(10, 10);
        grid.setPlayMode('mode1');
        grid.bossPosition = { x: 0, y: 0 };
        grid.setHunter({ HeadCoordinate: { x: 8, y: 0 }, BodySegments: [] });
        grid.setBossRules({ bossMoveChance: 1.0, bossAggressiveness: 1.0, bossMoveRange: 3 });

        // Move 1 tick with range = 3
        grid.moveBoss();

        // Distance should decrease by 3 (from 8 to 5)
        const newDist = Math.abs(grid.bossPosition.x - 8) + Math.abs(grid.bossPosition.y - 0);
        assert.strictEqual(newDist, 5);
        assert.strictEqual(grid.bossPosition.x, 3);
    });

    await t.test('TC-053: boss does not move in mode2 (Treasure Vault Mode)', () => {
        const grid = new GridState(10, 10);
        grid.setPlayMode('mode2');
        grid.bossPosition = { x: 2, y: 2 };
        grid.setBossRules({ bossMoveChance: 1.0, bossAggressiveness: 1.0, bossMoveRange: 1 });

        grid.moveBoss();

        assert.deepStrictEqual(grid.bossPosition, { x: 2, y: 2 });
    });
});
