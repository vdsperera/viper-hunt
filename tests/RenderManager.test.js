import { RenderManager } from '../services/RenderManager.js';
import assert from 'node:assert';
import test from 'node:test';

test('RenderManager Test Suite', async (t) => {
    // Setup Mock DOM Environment for Node.js test runner
    const mockElements = new Map();
    const createMockCanvas = (id) => ({
        id,
        classList: {
            contains: (cls) => mockElements.get(id)?.classes?.has(cls) || false,
            add: (cls) => mockElements.get(id)?.classes?.add(cls),
            remove: (cls) => mockElements.get(id)?.classes?.delete(cls)
        },
        getContext: (type) => ({
            fillRect: () => {},
            clearRect: () => {},
            beginPath: () => {},
            arc: () => {},
            fill: () => {},
            stroke: () => {},
            fillText: () => {}
        })
    });

    globalThis.document = {
        getElementById: (id) => {
            if (!mockElements.has(id)) {
                mockElements.set(id, {
                    canvas: createMockCanvas(id),
                    classes: new Set()
                });
            }
            return mockElements.get(id).canvas;
        }
    };

    await t.test('TC-030: initializes in 2D mode by default', () => {
        const manager = new RenderManager('game-canvas', 'three-canvas', 32);
        assert.strictEqual(manager.getMode(), '2d');
    });

    await t.test('TC-031: toggles render modes safely', () => {
        const manager = new RenderManager('game-canvas', 'three-canvas', 32);
        manager.setMode('2d');
        assert.strictEqual(manager.getMode(), '2d');
    });

    await t.test('TC-032: propagates weather state updates', () => {
        const manager = new RenderManager('game-canvas', 'three-canvas', 32);
        assert.doesNotThrow(() => {
            manager.setWeatherState('RAIN');
        });
    });
});
