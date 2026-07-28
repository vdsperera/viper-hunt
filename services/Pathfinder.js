/**
 * Pathfinder.js — A* Pathfinding Service for Grid Navigation
 */
export class Pathfinder {
    /**
     * Find optimal path from start to target on grid avoiding obstacles
     * @param {Object} start {x, y}
     * @param {Object} target {x, y}
     * @param {number} gridWidth
     * @param {number} gridHeight
     * @param {Set<string>|Function} obstacles Set of "x,y" keys or predicate function (x, y) => boolean
     * @returns {Array<{x: number, y: number}>} Path array from start (exclusive) to target (inclusive), or empty array if no path
     */
    static findPath(start, target, gridWidth, gridHeight, obstacles = new Set()) {
        if (!start || !target) return [];
        if (start.x === target.x && start.y === target.y) return [];

        const isObstacle = (x, y) => {
            if (obstacles instanceof Set) {
                return obstacles.has(`${x},${y}`);
            }
            if (typeof obstacles === 'function') {
                return obstacles(x, y);
            }
            return false;
        };

        const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        const nodeKey = (p) => `${p.x},${p.y}`;

        const openSet = [];
        const closedSet = new Set();
        const gScore = new Map();
        const fScore = new Map();
        const cameFrom = new Map();

        const startKey = nodeKey(start);
        gScore.set(startKey, 0);
        fScore.set(startKey, heuristic(start, target));

        openSet.push({ ...start, f: fScore.get(startKey) });

        const directions = [
            { x: 0, y: -1 }, // UP
            { x: 0, y: 1 },  // DOWN
            { x: -1, y: 0 }, // LEFT
            { x: 1, y: 0 }   // RIGHT
        ];

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();
            const currentKey = nodeKey(current);

            if (current.x === target.x && current.y === target.y) {
                const path = [];
                let currKey = currentKey;
                while (cameFrom.has(currKey)) {
                    const node = cameFrom.get(currKey);
                    path.unshift({ x: node.x, y: node.y });
                    currKey = nodeKey(node.parent);
                }
                return path;
            }

            closedSet.add(currentKey);

            for (const dir of directions) {
                const neighbor = { x: current.x + dir.x, y: current.y + dir.y };

                if (neighbor.x < 0 || neighbor.x >= gridWidth || neighbor.y < 0 || neighbor.y >= gridHeight) {
                    continue;
                }

                const neighborKey = nodeKey(neighbor);
                if (closedSet.has(neighborKey)) continue;

                const isTargetNode = (neighbor.x === target.x && neighbor.y === target.y);
                if (!isTargetNode && isObstacle(neighbor.x, neighbor.y)) {
                    continue;
                }

                const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;

                if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
                    cameFrom.set(neighborKey, { x: neighbor.x, y: neighbor.y, parent: current });
                    gScore.set(neighborKey, tentativeG);
                    const f = tentativeG + heuristic(neighbor, target);
                    fScore.set(neighborKey, f);

                    const existingInOpen = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
                    if (!existingInOpen) {
                        openSet.push({ ...neighbor, f });
                    } else {
                        existingInOpen.f = f;
                    }
                }
            }
        }

        return [];
    }

    /**
     * Get single next best step towards a target coordinate using A* with Manhattan fallback
     */
    static getNextStep(start, target, gridWidth, gridHeight, obstacles = new Set()) {
        const path = this.findPath(start, target, gridWidth, gridHeight, obstacles);
        if (path.length > 0) {
            return path[0];
        }

        const directions = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 }
        ];

        const isObstacle = (x, y) => {
            if (obstacles instanceof Set) return obstacles.has(`${x},${y}`);
            if (typeof obstacles === 'function') return obstacles(x, y);
            return false;
        };

        const validNeighbors = directions
            .map(d => ({ x: start.x + d.x, y: start.y + d.y }))
            .filter(p => p.x >= 0 && p.x < gridWidth && p.y >= 0 && p.y < gridHeight && !isObstacle(p.x, p.y));

        if (validNeighbors.length === 0) return { ...start };

        validNeighbors.sort((a, b) => {
            const distA = Math.abs(a.x - target.x) + Math.abs(a.y - target.y);
            const distB = Math.abs(b.x - target.x) + Math.abs(b.y - target.y);
            return distA - distB;
        });

        return validNeighbors[0];
    }
}
