import { InputHandler } from '../services/InputHandler.js';
import { Direction } from '../models/HunterEntity.js';
import assert from 'node:assert';
import test from 'node:test';

test('InputHandler Test Suite', async (t) => {
    
    // Helper to simulate keydown
    function simulateKeyDown(key) {
        const event = new window.KeyboardEvent('keydown', { key });
        window.dispatchEvent(event);
    }

    t.beforeEach(() => {
        // Mock DOM window and events
        global.window = {
            listeners: {},
            addEventListener(type, cb) {
                if (!this.listeners[type]) this.listeners[type] = [];
                this.listeners[type].push(cb);
            },
            dispatchEvent(event) {
                if (this.listeners[event.type]) {
                    for (const cb of this.listeners[event.type]) {
                        cb(event);
                    }
                }
            },
            KeyboardEvent: class {
                constructor(type, init) {
                    this.type = type;
                    this.key = init.key;
                }
            }
        };
    });

    /*
    ID: TC-035
    Type: Unit
    Linked story: US-003
    Linked task: TASK-009
    Scenario type: Happy path
    Name: queues valid direction change (Arrow keys)
    Precondition: Handler bound to window, current direction RIGHT
    Input: ArrowUp
    Expected output: UP direction returned on next query
    Side effects: queues direction
    Mocks / fixtures: window.addEventListener, KeyboardEvent
    Acceptance link: US-003 Scenario 1
    */
    await t.test('TC-035: queues valid direction change (Arrow keys)', () => {
        const handler = new InputHandler();
        handler.getCurrentDirection(Direction.RIGHT); // Set baseline
        
        simulateKeyDown('ArrowUp');
        const nextDir = handler.getCurrentDirection(Direction.RIGHT);
        assert.strictEqual(nextDir, Direction.UP);
    });

    /*
    ID: TC-036
    Type: Unit
    Linked story: US-003
    Linked task: TASK-009
    Scenario type: Happy path
    Name: queues valid direction change (WASD)
    Precondition: Handler bound, current direction UP
    Input: d key (Right)
    Expected output: RIGHT direction returned
    Side effects: queues direction
    Mocks / fixtures: window.addEventListener
    Acceptance link: US-003 Scenario 2
    */
    await t.test('TC-036: queues valid direction change (WASD)', () => {
        const handler = new InputHandler();
        handler.getCurrentDirection(Direction.UP); 
        
        simulateKeyDown('d');
        const nextDir = handler.getCurrentDirection(Direction.UP);
        assert.strictEqual(nextDir, Direction.RIGHT);
    });

    /*
    ID: TC-037
    Type: Unit
    Linked story: US-003
    Linked task: TASK-009
    Scenario type: Sad path
    Name: discards forbidden 180-degree reversal
    Precondition: Current direction RIGHT
    Input: ArrowLeft
    Expected output: RIGHT direction maintained
    Side effects: input discarded
    Mocks / fixtures: window
    Acceptance link: US-003 Scenario 3
    */
    await t.test('TC-037: discards forbidden 180-degree reversal', () => {
        const handler = new InputHandler();
        handler.getCurrentDirection(Direction.RIGHT); 
        
        simulateKeyDown('ArrowLeft');
        const nextDir = handler.getCurrentDirection(Direction.RIGHT);
        assert.strictEqual(nextDir, Direction.RIGHT); // Did not reverse
    });

    /*
    ID: TC-038
    Type: Unit
    Linked story: US-003
    Linked task: TASK-009
    Scenario type: Edge case
    Name: handles multiple keys pressed within a single tick (queuing)
    Precondition: Current direction UP
    Input: ArrowRight then ArrowDown
    Expected output: returns RIGHT first, then DOWN on subsequent calls
    Side effects: queue stores both
    Mocks / fixtures: window
    Acceptance link: US-003 Scenario 4
    */
    await t.test('TC-038: handles multiple keys pressed within a single tick (queuing)', () => {
        const handler = new InputHandler();
        handler.getCurrentDirection(Direction.UP); 
        
        simulateKeyDown('ArrowRight');
        simulateKeyDown('ArrowDown');
        
        // Tick 1
        const firstDir = handler.getCurrentDirection(Direction.UP);
        assert.strictEqual(firstDir, Direction.RIGHT);
        
        // Tick 2 (simulate engine supplying the new facing)
        const secondDir = handler.getCurrentDirection(Direction.RIGHT);
        assert.strictEqual(secondDir, Direction.DOWN);
    });

    /*
    ID: TC-039
    Type: Unit
    Linked story: US-003
    Linked task: TASK-009
    Scenario type: Boundary
    Name: caps queue size to prevent unbounded memory growth from key mashing
    Precondition: None
    Input: 5 rapid direction changes (Right -> Down -> Left -> Up -> Right -> Down)
    Expected output: Max 3 items in queue
    Side effects: discards excess
    Mocks / fixtures: window
    Acceptance link: US-003
    */
    await t.test('TC-039: caps queue size to prevent unbounded memory growth from key mashing', () => {
        const handler = new InputHandler();
        handler.getCurrentDirection(Direction.UP); 
        
        simulateKeyDown('ArrowRight');
        simulateKeyDown('ArrowDown');
        simulateKeyDown('ArrowLeft'); // Valid relative to DOWN
        simulateKeyDown('ArrowUp');   // Valid relative to LEFT
        simulateKeyDown('ArrowRight'); // Should be dropped, queue capped at 3
        
        assert.strictEqual(handler.inputQueue.length, 3);
    });

    await t.test('TC-040: injectDirection enqueues valid touch/D-Pad input', () => {
        const handler = new InputHandler();
        handler.getCurrentDirection(Direction.RIGHT);
        
        handler.injectDirection(Direction.UP);
        const nextDir = handler.getCurrentDirection(Direction.RIGHT);
        assert.strictEqual(nextDir, Direction.UP);
    });

});
