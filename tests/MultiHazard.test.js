import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GridState } from '../services/GridState.js';
import { CollisionDetector } from '../services/CollisionDetector.js';
import { LevelManager } from '../services/LevelManager.js';

describe('Multi-Hazard System Test Suite', () => {
    it('spawns multi-hazards according to level configuration', () => {
        const grid = new GridState(20, 20);
        grid.spawnHazards([
            { type: 'crime_boss', name: 'Crime Boss', icon: '🦹', color: '#ff0055', count: 1 },
            { type: 'police_patrol', name: 'Police Patrol', icon: '🚔', color: '#0088ff', count: 2 }
        ]);

        assert.equal(grid.hazards.length, 3);
        const bosses = grid.hazards.filter(h => h.type === 'crime_boss');
        const police = grid.hazards.filter(h => h.type === 'police_patrol');
        assert.equal(bosses.length, 1);
        assert.equal(police.length, 2);
    });

    it('detects collision with specific hazard types and returns metadata reason', () => {
        const cd = new CollisionDetector();
        const head = { x: 5, y: 5 };
        const bounds = { width: 20, height: 20 };
        const body = [];
        const hazards = [
            { id: 'h1', type: 'police_patrol', name: 'Police Patrol', x: 5, y: 5 }
        ];

        const res = cd.checkCollision(head, bounds, body, hazards);
        assert.equal(res, true);
        assert.equal(cd.lastResult.reason, 'Arrested by Police Patrol');
        assert.equal(cd.lastResult.hazardName, 'Police Patrol');
        assert.equal(cd.lastResult.hazardType, 'police_patrol');
    });

    it('detects collision with Death Reaper hazard', () => {
        const cd = new CollisionDetector();
        const head = { x: 8, y: 12 };
        const bounds = { width: 20, height: 20 };
        const body = [];
        const hazards = [
            { id: 'h2', type: 'death_reaper', name: 'Death Reaper', x: 8, y: 12 }
        ];

        const res = cd.checkCollision(head, bounds, body, hazards);
        assert.equal(res, true);
        assert.equal(cd.lastResult.reason, 'Claimed by Death Reaper');
    });

    it('LevelManager spawns scaling hazards as levels advance', () => {
        const grid = new GridState(20, 20);
        grid.setPlayMode('mode1');
        const dummyTargetManager = { spawnTarget: () => ({ ID: 't1', Computed_Value: 50 }) };
        const dummyGameLoop = { running: true, stop: () => {} };

        const levelManager = new LevelManager(
            grid, dummyTargetManager, dummyGameLoop, 5, 3, 3, null, null, [
                { level: 1, hazards: [ { type: 'crime_boss', count: 1 } ] },
                { level: 2, hazards: [ { type: 'crime_boss', count: 1 }, { type: 'police_patrol', count: 1 } ] },
                { level: 3, hazards: [ { type: 'crime_boss', count: 1 }, { type: 'police_patrol', count: 1 }, { type: 'death_reaper', count: 1 } ] }
            ]
        );

        levelManager.advanceLevel(); // Level 1
        assert.equal(grid.hazards.length, 1);

        levelManager.advanceLevel(); // Level 2
        assert.equal(grid.hazards.length, 2);

        levelManager.advanceLevel(); // Level 3
        assert.equal(grid.hazards.length, 3);
    });
});
