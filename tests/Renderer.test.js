import { Renderer } from '../services/Renderer.js';
import assert from 'node:assert';
import test from 'node:test';

// --- Mock DOM ---
function setupDOM() {
    global.document = {
        getElementById: (id) => {
            if (id === 'valid-canvas') {
                return {
                    width: 1280,
                    height: 720,
                    getContext: (type) => {
                        if (type === '2d') {
                            return {
                                fillStyle: '',
                                font: '',
                                fillRect: () => {},
                                fillText: () => {},
                                drawImage: () => {}
                            };
                        }
                        return null;
                    }
                };
            }
            if (id === 'no-context-canvas') {
                return {
                    getContext: () => null
                };
            }
            return null;
        }
    };

    global.Image = class {
        constructor() {
            this.src = '';
            this.complete = false;
            this.loaded = false;
            this.failed = false;
            this.onload = null;
            this.onerror = null;
        }
    };
}

test('Renderer Test Suite', async (t) => {

    t.beforeEach(() => {
        setupDOM();
    });

    /*
    ID: TC-012
    Type: Unit
    Linked story: US-010
    Linked task: TASK-006
    Scenario type: Null/empty
    Name: throws Error if canvas element is missing
    Precondition: DOM does not contain the requested ID
    Input: canvas ID 'missing-canvas'
    Expected output: Error
    Side effects: none
    Mocks / fixtures: global.document
    Acceptance link: US-010 Scenario 2
    */
    await t.test('TC-012: throws Error if canvas element is missing', () => {
        assert.throws(() => {
            new Renderer('missing-canvas');
        }, { message: /Canvas element 'missing-canvas' not found/ });
    });

    /*
    ID: TC-013
    Type: Unit
    Linked story: US-010
    Linked task: TASK-006
    Scenario type: Sad path
    Name: throws Error if getContext fails
    Precondition: Canvas element does not support 2d context
    Input: canvas ID 'no-context-canvas'
    Expected output: Error
    Side effects: none
    Mocks / fixtures: global.document
    Acceptance link: US-010 Scenario 2
    */
    await t.test('TC-013: throws Error if getContext fails', () => {
        assert.throws(() => {
            new Renderer('no-context-canvas');
        }, { message: /failed to acquire 2D context/ });
    });

    /*
    ID: TC-014
    Type: Unit
    Linked story: US-003, US-010
    Linked task: TASK-006
    Scenario type: Happy path
    Name: instantiates correctly with valid canvas
    Precondition: DOM contains valid canvas
    Input: canvas ID 'valid-canvas'
    Expected output: Renderer instance
    Side effects: context acquired
    Mocks / fixtures: global.document
    Acceptance link: US-010 Scenario 1
    */
    await t.test('TC-014: instantiates correctly with valid canvas', () => {
        const renderer = new Renderer('valid-canvas');
        assert.ok(renderer instanceof Renderer);
    });

    /*
    ID: TC-015
    Type: Unit
    Linked story: US-003
    Linked task: TASK-006
    Scenario type: Null/empty
    Name: renderFrame throws if state is missing
    Precondition: Renderer initialized
    Input: null
    Expected output: Error
    Side effects: none
    Mocks / fixtures: global.document
    Acceptance link: US-003 Scenario 1
    */
    await t.test('TC-015: renderFrame throws if state is missing', () => {
        const renderer = new Renderer('valid-canvas');
        assert.throws(() => {
            renderer.renderFrame(null);
        }, { message: /requires a valid state object/ });
    });

    /*
    ID: TC-016
    Type: Unit
    Linked story: US-003
    Linked task: TASK-006
    Scenario type: Sad path
    Name: renderFrame throws if state is malformed
    Precondition: Renderer initialized
    Input: empty object
    Expected output: TypeError
    Side effects: none
    Mocks / fixtures: global.document
    Acceptance link: US-003 Scenario 1
    */
    await t.test('TC-016: renderFrame throws if state is malformed', () => {
        const renderer = new Renderer('valid-canvas');
        assert.throws(() => {
            renderer.renderFrame({});
        }, { name: 'TypeError', message: /malformed state object/ });
    });

    /*
    ID: TC-017
    Type: Unit
    Linked story: US-010
    Linked task: TASK-006
    Scenario type: Happy path
    Name: renderFrame succeeds with targets and hunter segments
    Precondition: Renderer initialized
    Input: Valid state with activeTargets and hunter
    Expected output: successful execution
    Side effects: ctx.fillRect, ctx.fillText, ctx.drawImage called
    Mocks / fixtures: global.document, global.Image
    Acceptance link: US-010 Scenario 1
    */
    await t.test('TC-017: renderFrame succeeds with targets and hunter segments', () => {
        const renderer = new Renderer('valid-canvas');
        const targets = new Map();
        targets.set('10,10', {
            ID: 'T1',
            Avatar_Asset_Path: 'test.png',
            Computed_Value: 50
        });
        assert.doesNotThrow(() => {
            renderer.renderFrame({
                activeTargets: targets,
                hunter: {
                    HeadCoordinate: { x: 5, y: 5 },
                    BodySegments: [{x: 4, y: 5}]
                }
            });
        });
    });

});
