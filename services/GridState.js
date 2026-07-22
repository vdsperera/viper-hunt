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
        return false;
    }
}
