import { LLMService } from '../services/LLMService.js';
import assert from 'node:assert';
import test from 'node:test';

test('LLMService Test Suite', async (t) => {

    await t.test('TC-070: instantiates LLMService correctly', () => {
        const llm = new LLMService();
        assert.strictEqual(typeof llm.generateConfession, 'function');
        assert.strictEqual(typeof llm.generateQuestQuestion, 'function');
    });

    await t.test('TC-071: generates non-empty procedural confession for Police Custody', async () => {
        const llm = new LLMService();
        const confession = await llm.generateConfession('John Doe', 'Bank Robbery', 'Police Custody');
        assert.strictEqual(typeof confession, 'string');
        assert.ok(confession.length > 10);
        assert.ok(confession.includes('"'));
    });

    await t.test('TC-072: generates distinct confessions for different attack types', async () => {
        const llm = new LLMService();
        const c1 = await llm.generateConfession('Target A', 'Case 1', 'Brutally Caged');
        const c2 = await llm.generateConfession('Target B', 'Case 2', 'Shot Down in Action');
        assert.strictEqual(typeof c1, 'string');
        assert.strictEqual(typeof c2, 'string');
        assert.notStrictEqual(c1, c2);
    });

    await t.test('TC-073: generates quest questions with valid structure for Mode 3', async () => {
        const llm = new LLMService();
        const quest = await llm.generateQuestQuestion(1);
        assert.strictEqual(typeof quest.question, 'string');
        assert.ok(Array.isArray(quest.answers));
        assert.strictEqual(quest.answers.length, 3);
        assert.strictEqual(quest.answers.filter(a => a.isCorrect).length, 1);
    });

    await t.test('TC-074: manages Gemini API Key state correctly', () => {
        const llm = new LLMService();
        assert.strictEqual(llm.hasApiKey(), false);
        llm.setApiKey('test_key_123');
        assert.strictEqual(llm.getApiKey(), 'test_key_123');
        assert.strictEqual(llm.hasApiKey(), true);
        llm.setApiKey(null);
        assert.strictEqual(llm.hasApiKey(), false);
    });

    await t.test('TC-075: generates hazard radio taunts for all hazard types', async () => {
        const llm = new LLMService();
        const policeTaunt = await llm.generateHazardTaunt('police_patrol', 'Police Patrol', 2);
        const bossTaunt = await llm.generateHazardTaunt('crime_boss', 'Crime Boss', 1);
        const reaperTaunt = await llm.generateHazardTaunt('death_reaper', 'Death Reaper', 3);

        assert.strictEqual(typeof policeTaunt, 'string');
        assert.ok(policeTaunt.length > 5);
        assert.strictEqual(typeof bossTaunt, 'string');
        assert.ok(bossTaunt.length > 5);
        assert.strictEqual(typeof reaperTaunt, 'string');
        assert.ok(reaperTaunt.length > 5);
    });

    await t.test('TC-076: generates post-match news broadcast report', async () => {
        const llm = new LLMService();
        const report = await llm.generateNewsBroadcast({
            totalScore: 1250,
            capturesCount: 4,
            causeOfDeath: 'Arrested by Police Patrol'
        });

        assert.strictEqual(typeof report, 'string');
        assert.ok(report.includes('1250'));
        assert.ok(report.includes('4'));
    });

    await t.test('TC-077: generates target backstory rap sheet', async () => {
        const llm = new LLMService();
        const backstory = await llm.generateTargetBackstory('Cyber Fugitive X', 95);
        assert.strictEqual(typeof backstory, 'string');
        assert.ok(backstory.length > 10);
    });

    await t.test('TC-078: handles mock Gemini API calls gracefully', async () => {
        const llm = new LLMService('mock_api_key');
        // Override _callGeminiApi for deterministic testing
        llm._callGeminiApi = async () => 'Mock Gemini AI Generated Response';

        const confession = await llm.generateConfession('Viper Target', 'Trial', 'Police Custody');
        assert.strictEqual(confession, '"Mock Gemini AI Generated Response"');

        const taunt = await llm.generateHazardTaunt('police_patrol', 'Police', 2);
        assert.strictEqual(taunt, 'Mock Gemini AI Generated Response');
    });
});
