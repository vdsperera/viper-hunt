import { RegistryService } from '../services/RegistryService.js';
import { CriminalRecord } from '../models/CriminalRecord.js';
import assert from 'node:assert';
import test from 'node:test';

// Mocks & Fixtures
const mockValidCSV = `Name, Avatar_Asset_Path, Interpol_Red_Notice, FBI_Most_Wanted, Conviction_Status, Computed_Value
John Doe, avatar1.png, 1, 0, 1, 50
Jane Smith, avatar2.png, 0, 1, 0, 75`;

const mockMalformedCSV = `Name, Avatar_Asset_Path, Interpol_Red_Notice, FBI_Most_Wanted, Conviction_Status, Computed_Value
MissingFields, avatar3.png
BadType, avatar4.png, not_a_bool, 0, 1, 10`;

const mockXSSCSV = `Name, Avatar_Asset_Path, Interpol_Red_Notice, FBI_Most_Wanted, Conviction_Status, Computed_Value
<script>alert(1)</script>Evil, javascript:void(0), 1, 1, 1, 100`;

const mockFallbackJSON = [
    {
        "ID": "fb-1",
        "Name": "Fallback User",
        "Avatar_Asset_Path": "fb.png",
        "Interpol_Red_Notice": false,
        "FBI_Most_Wanted": false,
        "Conviction_Status": false,
        "Computed_Value": 10
    }
];

// Helper to mock global fetch
function setupFetchMock(handler) {
    global.fetch = handler;
}

test('RegistryService Test Suite', async (t) => {

    /*
    ID: TC-001
    Type: Unit
    Linked story: US-001
    Linked task: TASK-012
    Scenario type: Happy path
    Name: fetches and parses remote CSV successfully into CriminalRecord objects
    Precondition: system initialized, network reachable
    Input: valid CSV URL
    Expected output: Array of 2 CriminalRecords
    Side effects: none
    Mocks / fixtures: mockValidCSV, global.fetch
    Acceptance link: US-001 Scenario 1
    */
    await t.test('TC-001: fetches and parses remote CSV successfully into CriminalRecord objects', async () => {
        setupFetchMock(async (url) => {
            return {
                ok: true,
                text: async () => mockValidCSV
            };
        });

        const service = new RegistryService('http://example.com/data.csv', 'dummy.json');
        const records = await service.loadRegistry();

        assert.strictEqual(records.length, 2);
        assert.ok(records[0] instanceof CriminalRecord);
        assert.strictEqual(records[0].Name, 'John Doe');
        assert.strictEqual(records[1].Name, 'Jane Smith');
    });

    /*
    ID: TC-002
    Type: Unit
    Linked story: US-002
    Linked task: TASK-012
    Scenario type: External failure
    Name: falls back to local JSON on network timeout or failure
    Precondition: network unreachable or timeout
    Input: invalid/unreachable CSV URL
    Expected output: Array of 1 CriminalRecord from fallback
    Side effects: console warning logged
    Mocks / fixtures: fetch throws Error, returns mockFallbackJSON for JSON
    Acceptance link: US-001 Scenario 2, US-002 Scenario 1
    */
    await t.test('TC-002: falls back to local JSON on network timeout or failure', async () => {
        setupFetchMock(async (url) => {
            if (url.includes('csv')) throw new Error('Network Error');
            return {
                ok: true,
                json: async () => mockFallbackJSON
            };
        });

        const service = new RegistryService('http://example.com/timeout.csv', 'dummy.json');
        const records = await service.loadRegistry();

        assert.strictEqual(records.length, 1);
        assert.strictEqual(records[0].Name, 'Fallback User');
        assert.strictEqual(records[0].ID, 'fb-1');
    });

    /*
    ID: TC-003
    Type: Unit
    Linked story: US-001
    Linked task: TASK-012
    Scenario type: Sad path
    Name: skips malformed rows in CSV and returns only valid records
    Precondition: CSV contains incomplete/invalid rows
    Input: mockMalformedCSV
    Expected output: Array of 0 valid records, falls back to local JSON
    Side effects: skips rows, loads fallback
    Mocks / fixtures: mockMalformedCSV, mockFallbackJSON
    Acceptance link: US-001 Scenario 3
    */
    await t.test('TC-003: skips malformed rows in CSV and returns only valid records', async () => {
        setupFetchMock(async (url) => {
            if (url.includes('csv')) return { ok: true, text: async () => mockMalformedCSV };
            return { ok: true, json: async () => mockFallbackJSON };
        });

        const service = new RegistryService('http://example.com/bad.csv', 'dummy.json');
        const records = await service.loadRegistry();

        // Expects to fallback because 0 valid records were parsed from the CSV
        assert.strictEqual(records.length, 1);
        assert.strictEqual(records[0].Name, 'Fallback User');
    });

    /*
    ID: TC-004
    Type: Security
    Linked story: US-018, US-001
    Linked task: TASK-018
    Scenario type: Security
    Name: strips HTML tags from text inputs to prevent XSS
    Precondition: CSV contains malicious payloads
    Input: mockXSSCSV
    Expected output: Array of 1 CriminalRecord with sanitized Name
    Side effects: none
    Mocks / fixtures: mockXSSCSV
    Acceptance link: US-018 Scenario 1
    */
    await t.test('TC-004: strips HTML tags from text inputs to prevent XSS', async () => {
        setupFetchMock(async (url) => {
            return { ok: true, text: async () => mockXSSCSV };
        });

        const service = new RegistryService('http://example.com/xss.csv', 'dummy.json');
        const records = await service.loadRegistry();

        assert.strictEqual(records.length, 1);
        assert.strictEqual(records[0].Name, 'Evil'); // <script>alert(1)</script> is stripped
    });

    /*
    ID: TC-005
    Type: Unit
    Linked story: US-013
    Linked task: TASK-012
    Scenario type: State transition
    Name: getUnspawnedRecords returns the current state pool
    Precondition: registry loaded
    Input: none
    Expected output: Same array reference as loaded
    Side effects: none
    Mocks / fixtures: mockValidCSV
    Acceptance link: US-013 Scenario 1
    */
    await t.test('TC-005: getUnspawnedRecords returns the current state pool', async () => {
        setupFetchMock(async (url) => {
            return { ok: true, text: async () => mockValidCSV };
        });

        const service = new RegistryService('http://example.com/data.csv', 'dummy.json');
        await service.loadRegistry();
        const records = service.getUnspawnedRecords();
        
        assert.strictEqual(records.length, 2);
    });

});
