export const DEFAULT_ATTACK_TYPES = [
    {
        id: 'police',
        key: '1',
        name: 'Police Custody',
        pastAction: 'Handed to Police',
        icon: '👮',
        multiplier: 1.0,
        uses: -1,
        color: '#00f0ff',
        policeDelta: -1,
        crimeBossDelta: 0,
        alignmentScore: 10,
        riskDescription: 'Low Reward, Reduces Police Heat'
    },
    {
        id: 'caging',
        key: '2',
        name: 'Brutally Caged',
        pastAction: 'Brutally Caged',
        icon: '🔒',
        multiplier: 1.2,
        uses: 5,
        color: '#ffb800',
        policeDelta: 0,
        crimeBossDelta: 0,
        alignmentScore: -5,
        riskDescription: '1.2x Reward, Neutral Risk'
    },
    {
        id: 'shooting',
        key: '3',
        name: 'Shot Down',
        pastAction: 'Shot Down in Action',
        icon: '🎯',
        multiplier: 1.5,
        uses: 3,
        color: '#ff0055',
        policeDelta: 1,
        crimeBossDelta: 0,
        alignmentScore: -15,
        riskDescription: '1.5x Reward, Spawns +1 Police Patrol'
    },
    {
        id: 'butchering',
        key: '4',
        name: 'Ruthlessly Butchered',
        pastAction: 'Ruthlessly Butchered',
        icon: '🪓',
        multiplier: 2.0,
        uses: 2,
        color: '#aa00ff',
        policeDelta: 1,
        crimeBossDelta: 1,
        alignmentScore: -30,
        riskDescription: '2.0x Reward, Spawns +1 Boss & +1 Police'
    }
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

        this.attacks = source.map((att, idx) => {
            const defaultMatch = DEFAULT_ATTACK_TYPES.find(d => d.id === att.id || d.key === att.key) || DEFAULT_ATTACK_TYPES[idx] || {};
            return {
                id: att.id || defaultMatch.id || `att-${idx + 1}`,
                key: att.key || defaultMatch.key || String(idx + 1),
                name: att.name || defaultMatch.name || `Attack ${idx + 1}`,
                pastAction: att.pastAction || defaultMatch.pastAction || att.name || `Captured via Attack ${idx + 1}`,
                icon: att.icon || defaultMatch.icon || '⚔️',
                multiplier: typeof att.multiplier === 'number' ? att.multiplier : (typeof defaultMatch.multiplier === 'number' ? defaultMatch.multiplier : 1.0),
                initialUses: typeof att.uses === 'number' ? att.uses : (typeof defaultMatch.uses === 'number' ? defaultMatch.uses : -1), // -1 means infinite
                currentUses: typeof att.uses === 'number' ? att.uses : (typeof defaultMatch.uses === 'number' ? defaultMatch.uses : -1),
                color: att.color || defaultMatch.color || '#00f0ff',
                policeDelta: typeof att.policeDelta === 'number' ? att.policeDelta : (typeof defaultMatch.policeDelta === 'number' ? defaultMatch.policeDelta : 0),
                crimeBossDelta: typeof att.crimeBossDelta === 'number' ? att.crimeBossDelta : (typeof defaultMatch.crimeBossDelta === 'number' ? defaultMatch.crimeBossDelta : 0),
                alignmentScore: typeof att.alignmentScore === 'number' ? att.alignmentScore : (typeof defaultMatch.alignmentScore === 'number' ? defaultMatch.alignmentScore : 0),
                riskDescription: att.riskDescription || defaultMatch.riskDescription || 'Standard Operational Risk'
            };
        });

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
     * @returns {Object} { finalValue, attackName, pastAction, color, remainingUses, attackId, policeDelta, crimeBossDelta, alignmentScore, riskDescription }
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
            pastAction: attack.pastAction || attack.name,
            icon: attack.icon,
            color: attack.color,
            remainingUses: attack.currentUses,
            attackId: attack.id,
            policeDelta: attack.policeDelta || 0,
            crimeBossDelta: attack.crimeBossDelta || 0,
            alignmentScore: attack.alignmentScore || 0,
            riskDescription: attack.riskDescription || ''
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

    /**
     * Evaluates player's morality alignment persona based on accumulated net alignment score
     * @param {number} netScore Cumulative alignment score across captures
     * @param {number} totalCaptures Number of targets captured
     * @returns {Object} Persona metadata { title, description, color, brutalityLabel }
     */
    static evaluateAlignment(netScore = 0, totalCaptures = 0) {
        if (totalCaptures === 0) {
            return {
                title: 'Unrated Operative',
                description: 'No tactical captures completed yet.',
                color: '#888888',
                brutalityLabel: 'None'
            };
        }

        if (netScore >= 15) {
            return {
                title: 'Lawful Enforcer',
                description: 'Aligned strictly with law enforcement. Minimizes civilian panic and reduces police heat.',
                color: '#00f0ff',
                brutalityLabel: 'Lawful (Zero Brutality)'
            };
        } else if (netScore >= 0) {
            return {
                title: 'Pragmatic Vigilante',
                description: 'Calculated hunter balancing force with protocol. Deploys non-lethal and lethal measures in moderation.',
                color: '#00ff88',
                brutalityLabel: 'Moderate'
            };
        } else if (netScore >= -25) {
            return {
                title: 'Lethal Executioner',
                description: 'Favors immediate lethal force over custody. Frequently alerts law enforcement response.',
                color: '#ffb800',
                brutalityLabel: 'High Brutality'
            };
        } else {
            return {
                title: 'Ruthless Outlaw',
                description: 'Extreme operational violence. Triggers severe gang boss retaliation and maximum police crackdowns.',
                color: '#aa00ff',
                brutalityLabel: 'Extreme Brutality'
            };
        }
    }
}

