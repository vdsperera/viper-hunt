export class CollisionDetector {
    constructor() {
        this.lastResult = null;
    }

    /**
     * @param {{x: number, y: number}} headCoord 
     * @param {{width: number, height: number}} gridBounds 
     * @param {Array<{x: number, y: number}>} bodySegments 
     * @param {Object|Array|null} bossPositionOrHazards
     * @param {Array<{x: number, y: number}>|null} barricades
     * @returns {boolean} True if collision detected, False otherwise
     */
    checkCollision(headCoord, gridBounds, bodySegments, bossPositionOrHazards = null, barricades = null) {
        this.lastResult = null;

        if (!headCoord || !gridBounds || !Array.isArray(bodySegments)) {
            this.lastResult = { collided: true, reason: 'System Invalid State', hazardName: null, hazardType: null };
            return true;
        }

        // Wall collision (out of bounds)
        if (headCoord.x < 0 || headCoord.x >= gridBounds.width || 
            headCoord.y < 0 || headCoord.y >= gridBounds.height) {
            this.lastResult = { collided: true, reason: 'Impacted Outer Wall', hazardName: null, hazardType: null };
            return true;
        }
        
        // Self collision (intersecting body)
        for (const segment of bodySegments) {
            if (headCoord.x === segment.x && headCoord.y === segment.y) {
                this.lastResult = { collided: true, reason: 'Self Collision', hazardName: null, hazardType: null };
                return true;
            }
        }

        // Hazards or Boss collision
        if (bossPositionOrHazards) {
            if (Array.isArray(bossPositionOrHazards)) {
                const hit = bossPositionOrHazards.find(h => h && h.x === headCoord.x && h.y === headCoord.y);
                if (hit) {
                    const actionWord = hit.type === 'police_patrol' ? 'Arrested by' : hit.type === 'death_reaper' ? 'Claimed by' : 'Eliminated by';
                    this.lastResult = {
                        collided: true,
                        reason: `${actionWord} ${hit.name || 'Hazard'}`,
                        hazardName: hit.name || 'Hazard',
                        hazardType: hit.type || 'boss'
                    };
                    return true;
                }
            } else if (typeof bossPositionOrHazards === 'object' && headCoord.x === bossPositionOrHazards.x && headCoord.y === bossPositionOrHazards.y) {
                const name = bossPositionOrHazards.name || 'Crime Boss';
                const type = bossPositionOrHazards.type || 'crime_boss';
                const actionWord = type === 'police_patrol' ? 'Arrested by' : type === 'death_reaper' ? 'Claimed by' : 'Eliminated by';
                this.lastResult = {
                    collided: true,
                    reason: `${actionWord} ${name}`,
                    hazardName: name,
                    hazardType: type
                };
                return true;
            }
        }
        
        // Barricades collision
        if (barricades && Array.isArray(barricades)) {
            for (const b of barricades) {
                if (headCoord.x === b.x && headCoord.y === b.y) {
                    this.lastResult = { collided: true, reason: 'Impacted Barricade', hazardName: null, hazardType: null };
                    return true;
                }
            }
        }

        return false;
    }
}
