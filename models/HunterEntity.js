export const Direction = {
    UP: 'UP',
    DOWN: 'DOWN',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT'
};

export class HunterEntity {
    /**
     * @param {Object} params
     * @param {{x: number, y: number}} params.HeadCoordinate
     * @param {Array<{x: number, y: number}>} params.BodySegments
     * @param {string} params.CurrentDirection
     */
    constructor({ HeadCoordinate, BodySegments = [], CurrentDirection }) {
        this._validateCoordinate(HeadCoordinate, "HeadCoordinate");
        
        if (!Array.isArray(BodySegments)) {
            throw new TypeError("HunterEntity validation failed: 'BodySegments' must be an array.");
        }
        for (let i = 0; i < BodySegments.length; i++) {
            this._validateCoordinate(BodySegments[i], `BodySegments[${i}]`);
        }

        if (!Object.values(Direction).includes(CurrentDirection)) {
            throw new TypeError(`HunterEntity validation failed: 'CurrentDirection' must be one of: ${Object.values(Direction).join(', ')}.`);
        }

        this.HeadCoordinate = HeadCoordinate;
        this.BodySegments = BodySegments;
        this.Direction = CurrentDirection;
    }

    _validateCoordinate(coord, fieldName) {
        if (!coord || typeof coord !== 'object') {
            throw new TypeError(`HunterEntity validation failed: '${fieldName}' must be an object containing x and y coordinates.`);
        }
        if (!Number.isInteger(coord.x) || !Number.isInteger(coord.y)) {
            throw new TypeError(`HunterEntity validation failed: '${fieldName}.x' and '${fieldName}.y' must be integers.`);
        }
    }
}
