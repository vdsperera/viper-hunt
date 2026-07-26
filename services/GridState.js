import { Direction } from '../models/HunterEntity.js';

export class GridState {
    constructor(gridWidth, gridHeight) {
        this.width = gridWidth;
        this.height = gridHeight;
        this.hunter = null;
        this.activeTargets = new Map(); // key: "x,y", value: CriminalRecord
        this.hazards = []; // Array of active hazard objects { id, type, name, icon, color, x, y }
        this.growthRules = null;
        this.playMode = 'mode1';
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

    moveHazards(overrideRules = null) {
        if (!this.hazards || this.hazards.length === 0 || (this.playMode !== 'mode1' && this.playMode !== 'mode3')) return;

        const rules = overrideRules || this.bossRules || {};
        const chance = typeof rules.bossMoveChance === 'number' ? rules.bossMoveChance : 0.4;
        const aggressiveness = typeof rules.bossAggressiveness === 'number' ? rules.bossAggressiveness : 0.6;
        const moveRange = typeof rules.bossMoveRange === 'number' ? rules.bossMoveRange : 1;

        if (Math.random() > chance) return;

        const dirs = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 }
        ];

        this.hazards.forEach(hazard => {
            for (let step = 0; step < moveRange; step++) {
                const validPositions = dirs
                    .map(d => ({ x: hazard.x + d.x, y: hazard.y + d.y }))
                    .filter(p => p.x >= 0 && p.x < this.width && p.y >= 0 && p.y < this.height && !this.activeTargets.has(`${p.x},${p.y}`));

                if (validPositions.length === 0) break;

                const isAggressiveMove = this.hunter && Math.random() < aggressiveness;

                if (isAggressiveMove) {
                    const targetHead = this.hunter.HeadCoordinate;
                    validPositions.sort((a, b) => {
                        const distA = Math.abs(a.x - targetHead.x) + Math.abs(a.y - targetHead.y);
                        const distB = Math.abs(b.x - targetHead.x) + Math.abs(b.y - targetHead.y);
                        return distA - distB;
                    });
                    hazard.x = validPositions[0].x;
                    hazard.y = validPositions[0].y;
                } else {
                    const nextPos = validPositions[Math.floor(Math.random() * validPositions.length)];
                    hazard.x = nextPos.x;
                    hazard.y = nextPos.y;
                }
            }
        });
    }

    moveBoss(overrideRules = null) {
        this.moveHazards(overrideRules);
    }
}
