import { Direction } from '../models/HunterEntity.js';

export class GridState {
    constructor(gridWidth, gridHeight) {
        this.width = gridWidth;
        this.height = gridHeight;
        this.hunter = null;
        this.activeTargets = new Map(); // key: "x,y", value: CriminalRecord
        this.growthRules = null;
        this.playMode = 'mode1';
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
        if (!this.hunter) return false;
        if (this.hunter.HeadCoordinate.x === x && this.hunter.HeadCoordinate.y === y) return true;
        for (const seg of this.hunter.BodySegments) {
            if (seg.x === x && seg.y === y) return true;
        }
        if (this.bossPosition && this.bossPosition.x === x && this.bossPosition.y === y) return true;
        return false;
    }

    setBossRules(rules) {
        this.bossRules = rules;
    }

    spawnBoss() {
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
        this.bossPosition = spawned ? pos : null;
    }

    moveBoss(overrideRules = null) {
        if (!this.bossPosition || this.playMode !== 'mode1') return;

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

        for (let step = 0; step < moveRange; step++) {
            if (!this.bossPosition) break;

            const validPositions = dirs
                .map(d => ({ x: this.bossPosition.x + d.x, y: this.bossPosition.y + d.y }))
                .filter(p => p.x >= 0 && p.x < this.width && p.y >= 0 && p.y < this.height && !this.activeTargets.has(`${p.x},${p.y}`));

            if (validPositions.length === 0) break;

            const isAggressiveMove = this.hunter && Math.random() < aggressiveness;

            if (isAggressiveMove) {
                const targetHead = this.hunter.HeadCoordinate;
                // Sort candidate moves by Manhattan distance to hunter's head coordinate
                validPositions.sort((a, b) => {
                    const distA = Math.abs(a.x - targetHead.x) + Math.abs(a.y - targetHead.y);
                    const distB = Math.abs(b.x - targetHead.x) + Math.abs(b.y - targetHead.y);
                    return distA - distB;
                });
                this.bossPosition = validPositions[0];
            } else {
                // Random wander
                const nextPos = validPositions[Math.floor(Math.random() * validPositions.length)];
                this.bossPosition = nextPos;
            }
        }
    }
}
