import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AttackManager, DEFAULT_ATTACK_TYPES } from '../services/AttackManager.js';

describe('AttackManager Test Suite', () => {
    it('initializes with default attack types correctly', () => {
        const mgr = new AttackManager();
        const active = mgr.getActiveAttack();
        assert.equal(active.id, 'police');
        assert.equal(active.multiplier, 1.0);
        assert.equal(active.currentUses, -1);
    });

    it('selects attack by key string ("1", "2", "3", "4")', () => {
        const mgr = new AttackManager();
        
        const ok2 = mgr.selectAttack('2');
        assert.equal(ok2, true);
        assert.equal(mgr.getActiveAttack().id, 'caging');

        const ok3 = mgr.selectAttack('3');
        assert.equal(ok3, true);
        assert.equal(mgr.getActiveAttack().id, 'shooting');

        const ok4 = mgr.selectAttack('4');
        assert.equal(ok4, true);
        assert.equal(mgr.getActiveAttack().id, 'butchering');
    });

    it('applies score multipliers and decrements current uses when consumed', () => {
        const mgr = new AttackManager();
        
        // Select shooting (multiplier 1.5, 3 uses)
        mgr.selectAttack('3');
        const res1 = mgr.consumeActiveAttack(100);
        assert.equal(res1.finalValue, 150);
        assert.equal(res1.attackName, 'Shot Down');
        assert.equal(res1.pastAction, 'Shot Down in Action');
        assert.equal(res1.remainingUses, 2);

        const res2 = mgr.consumeActiveAttack(100);
        assert.equal(res2.remainingUses, 1);

        const res3 = mgr.consumeActiveAttack(100);
        assert.equal(res3.remainingUses, 0);

        // Uses reached 0, active attack should automatically fallback to index 0 (Police)
        assert.equal(mgr.getActiveAttack().id, 'police');
    });

    it('prevents selection of attack type with 0 uses', () => {
        const mgr = new AttackManager([
            { id: 'police', key: '1', name: 'Police', multiplier: 1.0, uses: -1 },
            { id: 'emptyAtt', key: '2', name: 'Empty', multiplier: 2.0, uses: 0 }
        ]);

        const selected = mgr.selectAttack('2');
        assert.equal(selected, false);
        assert.equal(mgr.getActiveAttack().id, 'police');
    });

    it('resets inventory counts back to initial values', () => {
        const mgr = new AttackManager();
        mgr.selectAttack('4'); // 2 uses
        mgr.consumeActiveAttack(100);
        mgr.consumeActiveAttack(100); // 0 uses remaining -> reverts to police

        assert.equal(mgr.getAttackList().find(a => a.id === 'butchering').currentUses, 0);

        mgr.resetInventory();
        assert.equal(mgr.getAttackList().find(a => a.id === 'butchering').currentUses, 2);
        assert.equal(mgr.getActiveAttack().id, 'police');
    });

    it('returns risk parameters and alignment scores on consumeActiveAttack', () => {
        const mgr = new AttackManager();
        
        // Police Custody
        mgr.selectAttack('1');
        const policeRes = mgr.consumeActiveAttack(100);
        assert.equal(policeRes.policeDelta, -1);
        assert.equal(policeRes.crimeBossDelta, 0);
        assert.equal(policeRes.alignmentScore, 10);

        // Butchering
        mgr.selectAttack('4');
        const butcherRes = mgr.consumeActiveAttack(100);
        assert.equal(butcherRes.policeDelta, 1);
        assert.equal(butcherRes.crimeBossDelta, 1);
        assert.equal(butcherRes.alignmentScore, -30);
    });

    it('evaluates alignment personas correctly based on accumulated scores', () => {
        const unrated = AttackManager.evaluateAlignment(0, 0);
        assert.equal(unrated.title, 'Unrated Operative');

        const lawful = AttackManager.evaluateAlignment(20, 2);
        assert.equal(lawful.title, 'Lawful Enforcer');

        const pragmatic = AttackManager.evaluateAlignment(5, 3);
        assert.equal(pragmatic.title, 'Pragmatic Vigilante');

        const lethal = AttackManager.evaluateAlignment(-15, 2);
        assert.equal(lethal.title, 'Lethal Executioner');

        const outlaw = AttackManager.evaluateAlignment(-60, 2);
        assert.equal(outlaw.title, 'Ruthless Outlaw');
    });
});

