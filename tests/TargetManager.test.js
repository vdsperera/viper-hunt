import { TargetManager } from '../services/TargetManager.js';
import assert from 'node:assert';
import test from 'node:test';

test('TargetManager Test Suite', async (t) => {
    
    // Mocks
    const mockGridState = {
        width: 10,
        height: 10,
        activeTargets: new Map(),
        isCellOccupied: (x, y) => false
    };

    const mockRegistryService = {
        pool: [
            { ID: '1', Name: 'Target A' },
            { ID: '2', Name: 'Target B' }
        ],
        getUnspawnedRecords() {
            return this.pool;
        }
    };

    t.beforeEach(() => {
        mockGridState.activeTargets.clear();
        mockRegistryService.pool = [
            { ID: '1', Name: 'Target A' },
            { ID: '2', Name: 'Target B' }
        ];
    });

    /*
    ID: TC-030
    Type: Unit
    Linked story: US-009
    Linked task: TASK-011
    Scenario type: Happy path
    Name: spawns target onto an unoccupied grid cell
    Precondition: Unspawned targets exist in pool
    Input: none
    Expected output: target record object
    Side effects: adds to activeTargets, removes from pool
    Mocks / fixtures: mockGridState, mockRegistryService
    Acceptance link: US-009 Scenario 1
    */
    await t.test('TC-030: spawns target onto an unoccupied grid cell', () => {
        const targetManager = new TargetManager(mockGridState, mockRegistryService);
        const spawned = targetManager.spawnTarget();
        
        assert.ok(spawned);
        assert.strictEqual(mockGridState.activeTargets.size, 1);
        assert.strictEqual(mockRegistryService.pool.length, 1);
    });

    /*
    ID: TC-031
    Type: Unit
    Linked story: US-005
    Linked task: TASK-011
    Scenario type: Happy path
    Name: handles capture by removing target from grid
    Precondition: Target exists on grid
    Input: coordKey '5,5'
    Expected output: target record object
    Side effects: removes from activeTargets
    Mocks / fixtures: mockGridState
    Acceptance link: US-005 Scenario 1
    */
    await t.test('TC-031: handles capture by removing target from grid', () => {
        mockGridState.activeTargets.set('5,5', { ID: '1', Name: 'Target A' });
        const targetManager = new TargetManager(mockGridState, mockRegistryService);
        
        const captured = targetManager.handleCapture('5,5');
        assert.strictEqual(captured.ID, '1');
        assert.strictEqual(mockGridState.activeTargets.size, 0);
    });

    /*
    ID: TC-032
    Type: Unit
    Linked story: US-013
    Linked task: TASK-011
    Scenario type: State transition
    Name: ensures captured record ID is removed from session pool
    Precondition: Target spawned
    Input: none
    Expected output: pool size decreased
    Side effects: pool mutation
    Mocks / fixtures: mockRegistryService
    Acceptance link: US-013 Scenario 1
    */
    await t.test('TC-032: ensures captured record ID is removed from session pool', () => {
        const targetManager = new TargetManager(mockGridState, mockRegistryService);
        targetManager.spawnTarget();
        assert.strictEqual(mockRegistryService.pool.length, 1); // Permanently removed from pool
    });

    /*
    ID: TC-033
    Type: Unit
    Linked story: US-009
    Linked task: TASK-011
    Scenario type: Edge case
    Name: defers spawn if no unoccupied cells are available
    Precondition: Grid is fully saturated
    Input: none
    Expected output: null
    Side effects: target returned to pool, activeTargets unchanged
    Mocks / fixtures: saturated grid mock
    Acceptance link: US-009 Scenario 4
    */
    await t.test('TC-033: defers spawn if no unoccupied cells are available', () => {
        const saturatedGridState = {
            width: 10,
            height: 10,
            activeTargets: new Map(),
            isCellOccupied: (x, y) => true // All cells occupied
        };
        const targetManager = new TargetManager(saturatedGridState, mockRegistryService);
        
        const spawned = targetManager.spawnTarget();
        
        assert.strictEqual(spawned, null);
        assert.strictEqual(mockRegistryService.pool.length, 2); // Put back in pool
        assert.strictEqual(saturatedGridState.activeTargets.size, 0);
    });

    /*
    ID: TC-034
    Type: Unit
    Linked story: US-009
    Linked task: TASK-011
    Scenario type: Boundary
    Name: returns null when session pool is empty
    Precondition: pool is empty
    Input: none
    Expected output: null
    Side effects: none
    Mocks / fixtures: empty pool mock
    Acceptance link: US-009 Scenario 3
    */
    await t.test('TC-034: returns null when session pool is empty', () => {
        mockRegistryService.pool = [];
        const targetManager = new TargetManager(mockGridState, mockRegistryService);
        const spawned = targetManager.spawnTarget();
        assert.strictEqual(spawned, null);
    });

});
