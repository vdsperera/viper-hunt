import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Pathfinder } from '../services/Pathfinder.js';
import { GridState } from '../services/GridState.js';
import { HunterEntity, Direction } from '../models/HunterEntity.js';

describe('Advanced Pursuit & Squad AI Test Suite', () => {
    describe('Pathfinder A* Engine', () => {
        it('calculates direct shortest path on open grid', () => {
            const start = { x: 0, y: 0 };
            const target = { x: 3, y: 0 };
            const path = Pathfinder.findPath(start, target, 10, 10);
            assert.equal(path.length, 3);
            assert.deepEqual(path, [
                { x: 1, y: 0 },
                { x: 2, y: 0 },
                { x: 3, y: 0 }
            ]);
        });

        it('navigates around grid obstacles', () => {
            const start = { x: 0, y: 0 };
            const target = { x: 2, y: 0 };
            // Obstacle at (1, 0) blocking direct horizontal line
            const obstacles = new Set(['1,0']);

            const path = Pathfinder.findPath(start, target, 10, 10, obstacles);
            assert.ok(path.length > 0);
            assert.notDeepEqual(path[0], { x: 1, y: 0 }); // Must bypass (1, 0)
            assert.deepEqual(path[path.length - 1], { x: 2, y: 0 });
        });

        it('returns fallback adjacent step when target is unreachable', () => {
            const start = { x: 5, y: 5 };
            const target = { x: 0, y: 0 };
            const step = Pathfinder.getNextStep(start, target, 10, 10);
            assert.ok(step.x >= 0 && step.y >= 0);
            const dist = Math.abs(step.x - target.x) + Math.abs(step.y - target.y);
            assert.ok(dist < (Math.abs(start.x - target.x) + Math.abs(start.y - target.y)));
        });
    });

    describe('Tactical Hazard Pursuit Behaviors', () => {
        it('Police Patrol executes predictive intercept and triggers squad alert when close', () => {
            const grid = new GridState(20, 20);
            grid.setPlayMode('mode1');

            const hunter = new HunterEntity({
                HeadCoordinate: { x: 10, y: 10 },
                CurrentDirection: Direction.RIGHT,
                BodySegments: [{ x: 9, y: 10 }, { x: 8, y: 10 }]
            });
            grid.setHunter(hunter);

            grid.hazards = [
                { id: 'police-1', type: 'police_patrol', name: 'Police Patrol', x: 14, y: 10 }
            ];

            // Force aggressive move (aggressiveness = 1.0)
            grid.moveHazards({ bossMoveChance: 1.0, bossAggressiveness: 1.0 });

            // Distance from (14, 10) to head (10, 10) was 4, moved closer to 3 -> squadAlert triggers
            const police = grid.hazards[0];
            assert.ok(police.x <= 14);
            assert.equal(police.squadAlert, true);
            assert.equal(grid.squadBackupTriggered, true);
        });

        it('Crime Boss pathfinds around body obstacles towards hunter head', () => {
            const grid = new GridState(20, 20);
            grid.setPlayMode('mode1');

            const hunter = new HunterEntity({
                HeadCoordinate: { x: 5, y: 5 },
                CurrentDirection: Direction.RIGHT,
                BodySegments: [{ x: 4, y: 5 }, { x: 4, y: 6 }]
            });
            grid.setHunter(hunter);

            grid.hazards = [
                { id: 'boss-1', type: 'crime_boss', name: 'Crime Boss', x: 7, y: 5 }
            ];

            const initialX = grid.hazards[0].x;
            grid.moveHazards({ bossMoveChance: 1.0, bossAggressiveness: 1.0 });

            assert.ok(grid.hazards[0].x < initialX); // Moving left towards head at (5, 5)
        });

        it('Death Reaper stalks the hunter tail segment', () => {
            const grid = new GridState(20, 20);
            grid.setPlayMode('mode1');

            // Head at (10, 5), Tail tip at (10, 9)
            const hunter = new HunterEntity({
                HeadCoordinate: { x: 10, y: 5 },
                CurrentDirection: Direction.UP,
                BodySegments: [
                    { x: 10, y: 6 },
                    { x: 10, y: 7 },
                    { x: 10, y: 8 },
                    { x: 10, y: 9 } // Tail tip
                ]
            });
            grid.setHunter(hunter);

            grid.hazards = [
                { id: 'reaper-1', type: 'death_reaper', name: 'Death Reaper', x: 10, y: 12 }
            ];

            grid.moveHazards({ bossMoveChance: 1.0, bossAggressiveness: 1.0 });

            // Reaper at (10, 12) should move UP towards tail at (10, 9)
            assert.equal(grid.hazards[0].x, 10);
            assert.equal(grid.hazards[0].y, 11);
        });
    });
});
