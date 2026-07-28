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
});
