export class CollisionDetector {
    /**
     * @param {{x: number, y: number}} headCoord 
     * @param {{width: number, height: number}} gridBounds 
     * @param {Array<{x: number, y: number}>} bodySegments 
     * @param {{x: number, y: number}|null} bossPosition
     * @returns {boolean} True if collision detected, False otherwise
     */
    checkCollision(headCoord, gridBounds, bodySegments, bossPosition = null) {
        if (!headCoord || !gridBounds || !Array.isArray(bodySegments)) {
            // Hard failure for malformed state
            return true;
        }

        // Wall collision (out of bounds)
        if (headCoord.x < 0 || headCoord.x >= gridBounds.width || 
            headCoord.y < 0 || headCoord.y >= gridBounds.height) {
            return true;
        }
        
        // Self collision (intersecting body)
        for (const segment of bodySegments) {
            if (headCoord.x === segment.x && headCoord.y === segment.y) {
                return true;
            }
        }

        // Boss collision
        if (bossPosition && headCoord.x === bossPosition.x && headCoord.y === bossPosition.y) {
            return true;
        }
        
        return false;
    }
}
