import { Direction } from '../models/HunterEntity.js';
import { Pathfinder } from './Pathfinder.js';

export class GridState {
    constructor(gridWidth, gridHeight) {
        this.width = gridWidth;
        this.height = gridHeight;
        this.hunter = null;
        this.activeTargets = new Map(); // key: "x,y", value: CriminalRecord
        this.hazards = []; // Array of active hazard objects { id, type, name, icon, color, x, y, squadAlert }
        this.growthRules = null;
        this.playMode = 'mode1';
        this.squadBackupTriggered = false;
    }

    get bossPosition() {
        if (!this.hazards || this.hazards.length === 0) return null;
        const boss = this.hazards.find(h => h.type === 'crime_boss' || h.type === 'boss') || this.hazards[0];
        return boss ? { x: boss.x, y: boss.y } : null;
    }

    set bossPosition(pos) {
        if (!pos) {
            this.hazards = this.hazards.filter(h => h.type !== 'crime_boss' && h.type !== 'boss');
            return;
        }
        let boss = this.hazards.find(h => h.type === 'crime_boss' || h.type === 'boss');
        if (boss) {
            boss.x = pos.x;
            boss.y = pos.y;
        } else {
            this.hazards.push({
                id: 'boss-legacy',
                type: 'crime_boss',
                name: 'Crime Boss',
                icon: '🦹',
                color: '#ff0055',
                x: pos.x,
                y: pos.y
            });
        }
    }

    setPlayMode(mode) {
        this.playMode = mode;
    }

    setHunter(hunterEntity) {
        this.hunter = hunterEntity;
    }

    setGrowthRules(rules) {
        this.growthRules = rules;
    }

    moveHunter() {
        if (!this.hunter) return;
        
        const head = { ...this.hunter.HeadCoordinate };
        
        switch (this.hunter.Direction) {
            case Direction.UP: head.y -= 1; break;
            case Direction.DOWN: head.y += 1; break;
            case Direction.LEFT: head.x -= 1; break;
            case Direction.RIGHT: head.x += 1; break;
        }

        // Shift body segments to follow head
        const newBody = [this.hunter.HeadCoordinate, ...this.hunter.BodySegments];
        
        // If we haven't just grown, remove the last tail segment
        if (this.hunter.growAmount > 0) {
            this.hunter.growAmount--;
        } else {
            newBody.pop();
        }
        
        this.hunter.HeadCoordinate = head;
        this.hunter.BodySegments = newBody;
    }

    growHunter(value = 0) {
        if (!this.hunter) return;
        
        // US-006: Grow based on dynamic or default value tiers
        const rules = this.growthRules || {
            growthLow: 1,
            growthMedium: 2,
            growthHigh: 3,
            growthElite: 4
        };

        let segmentsToAdd = rules.growthLow;
        if (value >= 90) segmentsToAdd = rules.growthElite;
        else if (value >= 70) segmentsToAdd = rules.growthHigh;
        else if (value >= 40) segmentsToAdd = rules.growthMedium;

        this.hunter.growAmount = (this.hunter.growAmount || 0) + segmentsToAdd;
    }
    
    isCellOccupied(x, y) {
        if (this.hunter) {
            if (this.hunter.HeadCoordinate.x === x && this.hunter.HeadCoordinate.y === y) return true;
            for (const seg of this.hunter.BodySegments) {
                if (seg.x === x && seg.y === y) return true;
            }
        }
        if (this.hazards && this.hazards.some(h => h.x === x && h.y === y)) return true;
        if (this.activeTargets && this.activeTargets.has(`${x},${y}`)) return true;
        return false;
    }

    setBossRules(rules) {
        this.bossRules = rules;
    }

    spawnBoss() {
        this.spawnHazards([
            { type: 'crime_boss', name: 'Crime Boss', icon: '🦹', color: '#ff0055', count: 1 }
        ]);
    }

    addHazard(type = 'police_patrol') {
        let spawned = false;
        let attempts = 0;
        const pos = { x: 0, y: 0 };
        while (!spawned && attempts < 1000) {
            pos.x = Math.floor(Math.random() * this.width);
            pos.y = Math.floor(Math.random() * this.height);
            if (!this.isCellOccupied(pos.x, pos.y)) {
                spawned = true;
            }
            attempts++;
        }
        if (spawned) {
            const isPolice = type === 'police_patrol';
            const isReaper = type === 'death_reaper';
            const newHazard = {
                id: `hz-dyn-${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                type: type,
                name: isPolice ? 'Police Patrol' : isReaper ? 'Death Reaper' : 'Crime Boss',
                icon: isPolice ? '🚔' : isReaper ? '💀' : '🦹',
                color: isPolice ? '#0088ff' : isReaper ? '#aa00ff' : '#ff0055',
                x: pos.x,
                y: pos.y
            };
            if (!Array.isArray(this.hazards)) this.hazards = [];
            this.hazards.push(newHazard);
            return newHazard;
        }
        return null;
    }

    removeHazard(type = 'police_patrol') {
        if (!Array.isArray(this.hazards) || this.hazards.length === 0) return false;
        const idx = this.hazards.findIndex(h => h.type === type || (type === 'crime_boss' && h.type === 'boss'));
        if (idx !== -1) {
            this.hazards.splice(idx, 1);
            return true;
        }
        return false;
    }

    applyAttackConsequences(policeDelta = 0, crimeBossDelta = 0) {
        const outcomes = [];

        // Apply Police Delta
        if (policeDelta > 0) {
            for (let i = 0; i < policeDelta; i++) {
                if (this.addHazard('police_patrol')) {
                    outcomes.push({ type: 'police_add', text: '+1 Police Patrol 🚔 (Heat Raised)' });
                }
            }
        } else if (policeDelta < 0) {
            for (let i = 0; i < Math.abs(policeDelta); i++) {
                if (this.removeHazard('police_patrol')) {
                    outcomes.push({ type: 'police_remove', text: '-1 Police Heat 👮 (Heat Reduced)' });
                }
            }
        }

        // Apply Crime Boss Delta
        if (crimeBossDelta > 0) {
            for (let i = 0; i < crimeBossDelta; i++) {
                if (this.addHazard('crime_boss')) {
                    outcomes.push({ type: 'boss_add', text: '+1 Crime Boss 🦹 (Gang Retaliation)' });
                }
            }
        } else if (crimeBossDelta < 0) {
            for (let i = 0; i < Math.abs(crimeBossDelta); i++) {
                if (this.removeHazard('crime_boss')) {
                    outcomes.push({ type: 'boss_remove', text: '-1 Crime Boss 🦹' });
                }
            }
        }

        return outcomes;
    }

    spawnHazards(hazardSpecs = null) {
        this.hazards = [];
        if (!hazardSpecs || !Array.isArray(hazardSpecs) || hazardSpecs.length === 0) {
            let spawned = false;
            let attempts = 0;
            const pos = { x: 0, y: 0 };
            while (!spawned && attempts < 1000) {
                pos.x = Math.floor(Math.random() * this.width);
                pos.y = Math.floor(Math.random() * this.height);
                if (!this.isCellOccupied(pos.x, pos.y)) {
                    spawned = true;
                }
                attempts++;
            }
            if (spawned) {
                this.hazards.push({
                    id: 'boss-default',
                    type: 'crime_boss',
                    name: 'Crime Boss',
                    icon: '🦹',
                    color: '#ff0055',
                    x: pos.x,
                    y: pos.y
                });
            }
            return;
        }

        hazardSpecs.forEach((spec, idx) => {
            const count = spec.count || 1;
            for (let c = 0; c < count; c++) {
                let spawned = false;
                let attempts = 0;
                const pos = { x: 0, y: 0 };

                while (!spawned && attempts < 1000) {
                    pos.x = Math.floor(Math.random() * this.width);
                    pos.y = Math.floor(Math.random() * this.height);
                    if (!this.isCellOccupied(pos.x, pos.y)) {
                        spawned = true;
                    }
                    attempts++;
                }

                if (spawned) {
                    this.hazards.push({
                        id: `hz-${spec.type}-${idx}-${c}`,
                        type: spec.type || 'crime_boss',
                        name: spec.name || (spec.type === 'police_patrol' ? 'Police Patrol' : spec.type === 'death_reaper' ? 'Death Reaper' : 'Crime Boss'),
                        icon: spec.icon || (spec.type === 'police_patrol' ? '🚔' : spec.type === 'death_reaper' ? '💀' : '🦹'),
                        color: spec.color || (spec.type === 'police_patrol' ? '#0088ff' : spec.type === 'death_reaper' ? '#aa00ff' : '#ff0055'),
                        x: pos.x,
                        y: pos.y
                    });
                }
            }
        });
    }

    getThreatStatus() {
        if (!Array.isArray(this.hazards) || this.hazards.length === 0) {
            return {
                label: 'SECURE (NO HAZARDS)',
                color: '#00f0ff',
                bossCount: 0,
                policeCount: 0,
                reaperCount: 0,
                totalHazards: 0,
                effectiveChance: 0
            };
        }

        let bossCount = 0;
        let policeCount = 0;
        let reaperCount = 0;

        this.hazards.forEach(h => {
            if (h.type === 'police_patrol') policeCount++;
            else if (h.type === 'death_reaper') reaperCount++;
            else bossCount++;
        });

        const totalHazards = this.hazards.length;
        const rules = this.bossRules || {};
        const baseChance = typeof rules.bossMoveChance === 'number' ? rules.bossMoveChance : 0.4;
        const hazardBonus = Math.max(0, totalHazards - 1) * 0.15;
        const effectiveChance = Math.min(0.95, baseChance + hazardBonus);

        let label = 'STANDARD RISK';
        let color = '#00ff88';

        if (totalHazards >= 4 || bossCount >= 2) {
            label = `CRITICAL RISK (🦹x${bossCount} 🚔x${policeCount})`;
            color = '#ff0055';
        } else if (totalHazards >= 2) {
            label = `ELEVATED RISK (🦹x${bossCount} 🚔x${policeCount})`;
            color = '#ffb800';
        } else {
            label = `STANDARD RISK (🦹x${bossCount} 🚔x${policeCount})`;
            color = '#00ff88';
        }

        return {
            label,
            color,
            bossCount,
            policeCount,
            reaperCount,
            totalHazards,
            effectiveChance
        };
    }

    moveHazards(overrideRules = null) {
        if (!this.hazards || this.hazards.length === 0 || (this.playMode !== 'mode1' && this.playMode !== 'mode3')) return;

        const rules = overrideRules || this.bossRules || {};
        const baseChance = typeof rules.bossMoveChance === 'number' ? rules.bossMoveChance : 0.4;
        const baseAggressiveness = typeof rules.bossAggressiveness === 'number' ? rules.bossAggressiveness : 0.6;
        const moveRange = typeof rules.bossMoveRange === 'number' ? rules.bossMoveRange : 1;

        // Dynamic Risk Scaling: Each active hazard beyond 1 increases move frequency (+0.15) and pursuit aggressiveness (+0.10) for default rules
        const totalHazards = this.hazards.length;
        const hazardBonus = Math.max(0, totalHazards - 1) * 0.15;
        const effectiveChance = (typeof rules.bossMoveChance === 'number')
            ? rules.bossMoveChance
            : Math.min(0.95, baseChance + hazardBonus);
        const effectiveAggressiveness = (typeof rules.bossAggressiveness === 'number')
            ? rules.bossAggressiveness
            : Math.min(0.95, baseAggressiveness + (hazardBonus * 0.67));

        if (effectiveChance <= 0 || Math.random() > effectiveChance) return;

        // Build obstacle set (hunter body segments & active targets)
        const obstacles = new Set();
        if (this.hunter && Array.isArray(this.hunter.BodySegments)) {
            this.hunter.BodySegments.forEach(seg => obstacles.add(`${seg.x},${seg.y}`));
        }
        if (this.activeTargets) {
            for (const key of this.activeTargets.keys()) {
                obstacles.add(key);
            }
        }

        const dirVector = {
            'UP': { x: 0, y: -1 },
            'DOWN': { x: 0, y: 1 },
            'LEFT': { x: -1, y: 0 },
            'RIGHT': { x: 1, y: 0 }
        };

        this.hazards.forEach(hazard => {
            for (let step = 0; step < moveRange; step++) {
                let nextStep = null;
                const isAggressive = this.hunter && Math.random() < effectiveAggressiveness;

                if (!isAggressive) {
                    // Random adjacent valid step
                    const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
                    const valid = dirs
                        .map(d => ({ x: hazard.x + d.x, y: hazard.y + d.y }))
                        .filter(p => p.x >= 0 && p.x < this.width && p.y >= 0 && p.y < this.height && !obstacles.has(`${p.x},${p.y}`));
                    if (valid.length > 0) {
                        nextStep = valid[Math.floor(Math.random() * valid.length)];
                    }
                } else if (hazard.type === 'police_patrol') {
                    // 🚔 Police Patrol — Predictive Intercept
                    const head = this.hunter.HeadCoordinate;
                    const dir = dirVector[this.hunter.Direction] || { x: 1, y: 0 };
                    
                    const interceptTarget = {
                        x: Math.max(0, Math.min(this.width - 1, head.x + dir.x * 2)),
                        y: Math.max(0, Math.min(this.height - 1, head.y + dir.y * 2))
                    };

                    nextStep = Pathfinder.getNextStep(hazard, interceptTarget, this.width, this.height, obstacles);
                } else if (hazard.type === 'death_reaper') {
                    // 💀 Death Reaper — Tail Stalker
                    const tailTarget = (this.hunter.BodySegments && this.hunter.BodySegments.length > 0)
                        ? this.hunter.BodySegments[this.hunter.BodySegments.length - 1]
                        : this.hunter.HeadCoordinate;

                    nextStep = Pathfinder.getNextStep(hazard, tailTarget, this.width, this.height, obstacles);
                } else {
                    // 🦹 Crime Boss — A* Pathfinder to Hunter Head
                    const head = this.hunter.HeadCoordinate;
                    nextStep = Pathfinder.getNextStep(hazard, head, this.width, this.height, obstacles);
                }

                if (nextStep) {
                    hazard.x = nextStep.x;
                    hazard.y = nextStep.y;
                }

                if (hazard.type === 'police_patrol' && this.hunter) {
                    const head = this.hunter.HeadCoordinate;
                    const distToHead = Math.abs(hazard.x - head.x) + Math.abs(hazard.y - head.y);
                    if (distToHead <= 3) {
                        hazard.squadAlert = true;
                        this.squadBackupTriggered = true;
                    } else {
                        hazard.squadAlert = false;
                    }
                }
            }
        });
    }

    moveBoss(overrideRules = null) {
        this.moveHazards(overrideRules);
    }
}

