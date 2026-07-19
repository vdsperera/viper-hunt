import { CriminalRecord } from '../models/CriminalRecord.js';
import { HunterEntity, Direction } from '../models/HunterEntity.js';
import assert from 'node:assert';
import test from 'node:test';

test('Models Test Suite', async (t) => {

    /*
    ID: TC-006
    Type: Unit
    Linked story: US-001
    Linked task: TASK-004
    Scenario type: Happy path
    Name: instantiates CriminalRecord correctly with valid data
    Precondition: None
    Input: valid parameter object
    Expected output: CriminalRecord instance
    Side effects: none
    Mocks / fixtures: none
    Acceptance link: US-001 Scenario 1
    */
    await t.test('TC-006: instantiates CriminalRecord correctly with valid data', () => {
        const record = new CriminalRecord({
            ID: "123",
            Name: "Test Name",
            Avatar_Asset_Path: "path.png",
            Interpol_Red_Notice: true,
            FBI_Most_Wanted: false,
            Conviction_Status: true,
            Computed_Value: 50
        });
        assert.ok(record instanceof CriminalRecord);
        assert.strictEqual(record.Name, "Test Name");
    });

    /*
    ID: TC-007
    Type: Unit
    Linked story: US-001
    Linked task: TASK-004
    Scenario type: Sad path
    Name: throws TypeError when CriminalRecord receives invalid boolean
    Precondition: None
    Input: parameter object with string instead of boolean
    Expected output: TypeError
    Side effects: none
    Mocks / fixtures: none
    Acceptance link: US-001 Scenario 3
    */
    await t.test('TC-007: throws TypeError when CriminalRecord receives invalid boolean', () => {
        assert.throws(() => {
            new CriminalRecord({
                ID: "123",
                Name: "Test Name",
                Avatar_Asset_Path: "path.png",
                Interpol_Red_Notice: "true", // invalid type
                FBI_Most_Wanted: false,
                Conviction_Status: true,
                Computed_Value: 50
            });
        }, { name: 'TypeError', message: /'Interpol_Red_Notice' must be a boolean/ });
    });

    /*
    ID: TC-008
    Type: Unit
    Linked story: US-010
    Linked task: TASK-004
    Scenario type: Boundary
    Name: throws TypeError when Computed_Value exceeds maximum bounds
    Precondition: None
    Input: Computed_Value = 150
    Expected output: TypeError
    Side effects: none
    Mocks / fixtures: none
    Acceptance link: US-010 Scenario 4
    */
    await t.test('TC-008: throws TypeError when Computed_Value exceeds maximum bounds', () => {
        assert.throws(() => {
            new CriminalRecord({
                ID: "123",
                Name: "Test Name",
                Avatar_Asset_Path: "path.png",
                Interpol_Red_Notice: true,
                FBI_Most_Wanted: false,
                Conviction_Status: true,
                Computed_Value: 150 // Out of bounds
            });
        }, { name: 'TypeError', message: /'Computed_Value' must be an integer between 0 and 100/ });
    });

    /*
    ID: TC-009
    Type: Unit
    Linked story: US-003
    Linked task: TASK-004
    Scenario type: Happy path
    Name: instantiates HunterEntity correctly with valid coordinates and direction
    Precondition: None
    Input: valid HunterEntity parameters
    Expected output: HunterEntity instance
    Side effects: none
    Mocks / fixtures: none
    Acceptance link: US-003 Scenario 1
    */
    await t.test('TC-009: instantiates HunterEntity correctly with valid coordinates and direction', () => {
        const hunter = new HunterEntity({
            HeadCoordinate: { x: 5, y: 5 },
            BodySegments: [{ x: 5, y: 6 }, { x: 5, y: 7 }],
            CurrentDirection: Direction.UP
        });
        assert.ok(hunter instanceof HunterEntity);
        assert.strictEqual(hunter.HeadCoordinate.x, 5);
    });

    /*
    ID: TC-010
    Type: Unit
    Linked story: US-004
    Linked task: TASK-004
    Scenario type: Sad path
    Name: throws TypeError on invalid coordinate in body segments
    Precondition: None
    Input: BodySegments containing non-integer
    Expected output: TypeError
    Side effects: none
    Mocks / fixtures: none
    Acceptance link: US-004 Scenario 2
    */
    await t.test('TC-010: throws TypeError on invalid coordinate in body segments', () => {
        assert.throws(() => {
            new HunterEntity({
                HeadCoordinate: { x: 5, y: 5 },
                BodySegments: [{ x: 5, y: 6 }, { x: "5", y: 7 }], // invalid type in body
                CurrentDirection: Direction.UP
            });
        }, { name: 'TypeError', message: /'BodySegments\[1\]\.x' and 'BodySegments\[1\]\.y' must be integers/ });
    });

    /*
    ID: TC-011
    Type: Unit
    Linked story: US-003
    Linked task: TASK-004
    Scenario type: Sad path
    Name: throws TypeError on unrecognised direction string
    Precondition: None
    Input: invalid direction
    Expected output: TypeError
    Side effects: none
    Mocks / fixtures: none
    Acceptance link: US-003 Scenario 3
    */
    await t.test('TC-011: throws TypeError on unrecognised direction string', () => {
        assert.throws(() => {
            new HunterEntity({
                HeadCoordinate: { x: 5, y: 5 },
                BodySegments: [],
                CurrentDirection: "NORTH" // invalid direction
            });
        }, { name: 'TypeError', message: /'CurrentDirection' must be one of/ });
    });

});
