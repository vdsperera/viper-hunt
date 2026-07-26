export const DEFAULT_ATTACK_TYPES = [
    { id: 'police', key: '1', name: 'Police Custody', icon: '👮', multiplier: 1.0, uses: -1, color: '#00f0ff' },
    { id: 'caging', key: '2', name: 'Caging', icon: '🔒', multiplier: 1.2, uses: 5, color: '#ffb800' },
    { id: 'shooting', key: '3', name: 'Shooting', icon: '🎯', multiplier: 1.5, uses: 3, color: '#ff0055' },
    { id: 'butchering', key: '4', name: 'Butchering', icon: '🪓', multiplier: 2.0, uses: 2, color: '#aa00ff' }
];

export class AttackManager {
    /**
     * @param {Array<Object>} customAttackTypes Configurable attack type definitions
     */
    constructor(customAttackTypes = null) {
        this._initAttacks(customAttackTypes);
    }

    _initAttacks(customAttackTypes) {
        const source = (Array.isArray(customAttackTypes) && customAttackTypes.length > 0)
            ? customAttackTypes
            : DEFAULT_ATTACK_TYPES;

        this.attacks = source.map((att, idx) => ({
            id: att.id || `att-${idx + 1}`,
            key: att.key || String(idx + 1),
            name: att.name || `Attack ${idx + 1}`,
            icon: att.icon || '⚔️',
            multiplier: typeof att.multiplier === 'number' ? att.multiplier : 1.0,
            initialUses: typeof att.uses === 'number' ? att.uses : -1, // -1 means infinite
            currentUses: typeof att.uses === 'number' ? att.uses : -1,
            color: att.color || '#00f0ff'
        }));

        // Active index defaults to first attack (Police Custody)
        this.activeIndex = 0;
    }

    /**
     * Reset remaining uses to initial configured counts
     */
    resetInventory() {
        this.attacks.forEach(att => {
            att.currentUses = att.initialUses;
        });
        this.activeIndex = 0;
    }

    /**
     * Select attack type by ID or key string ('1', '2', '3', '4'...)
     * @param {string} keyOrId
     * @returns {boolean} True if successfully selected or already active
     */
    selectAttack(keyOrId) {
        if (!keyOrId) return false;

        const targetIndex = this.attacks.findIndex(
            a => a.key === String(keyOrId) || a.id === String(keyOrId)
        );

        if (targetIndex === -1) return false;

        const targetAttack = this.attacks[targetIndex];
        // Check if out of uses
        if (targetAttack.currentUses === 0) {
            return false;
        }

        this.activeIndex = targetIndex;
        return true;
    }

    /**
     * Get currently active attack definition
     * @returns {Object}
     */
    getActiveAttack() {
        return this.attacks[this.activeIndex] || this.attacks[0];
    }

    /**
     * Executes capture with active attack, decrements inventory if limited, and calculates score
     * @param {number} baseValue Base bounty score value
     * @returns {Object} { finalValue, attackName, color, remainingUses, attackId }
     */
    consumeActiveAttack(baseValue = 0) {
        const attack = this.getActiveAttack();
        const multiplier = attack.multiplier || 1.0;
        const finalValue = Math.round(baseValue * multiplier);

        if (attack.currentUses > 0) {
            attack.currentUses--;
        }

        const result = {
            finalValue,
            attackName: attack.name,
            icon: attack.icon,
            color: attack.color,
            remainingUses: attack.currentUses,
            attackId: attack.id
        };

        // If attack just ran out of uses (now 0), fall back to infinite default attack (index 0)
        if (attack.currentUses === 0 && this.activeIndex !== 0) {
            this.activeIndex = 0;
        }

        return result;
    }

    /**
     * @returns {Array<Object>} List of all attacks with remaining uses
     */
    getAttackList() {
        return this.attacks.map((att, idx) => ({
            ...att,
            isActive: idx === this.activeIndex
        }));
    }
}
