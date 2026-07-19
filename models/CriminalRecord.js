export class CriminalRecord {
    /**
     * @param {Object} params
     * @param {string} params.ID
     * @param {string} params.Name
     * @param {string} params.Avatar_Asset_Path
     * @param {boolean} params.Interpol_Red_Notice
     * @param {boolean} params.FBI_Most_Wanted
     * @param {boolean} params.Conviction_Status
     * @param {number} params.Computed_Value
     */
    constructor({ ID, Name, Avatar_Asset_Path, Interpol_Red_Notice, FBI_Most_Wanted, Conviction_Status, Computed_Value }) {
        if (typeof ID !== 'string' || !ID.trim()) {
            throw new TypeError("CriminalRecord validation failed: 'ID' must be a non-empty string.");
        }
        if (typeof Name !== 'string' || !Name.trim()) {
            throw new TypeError("CriminalRecord validation failed: 'Name' must be a non-empty string.");
        }
        if (typeof Avatar_Asset_Path !== 'string') {
            throw new TypeError("CriminalRecord validation failed: 'Avatar_Asset_Path' must be a string.");
        }
        if (typeof Interpol_Red_Notice !== 'boolean') {
            throw new TypeError("CriminalRecord validation failed: 'Interpol_Red_Notice' must be a boolean.");
        }
        if (typeof FBI_Most_Wanted !== 'boolean') {
            throw new TypeError("CriminalRecord validation failed: 'FBI_Most_Wanted' must be a boolean.");
        }
        if (typeof Conviction_Status !== 'boolean') {
            throw new TypeError("CriminalRecord validation failed: 'Conviction_Status' must be a boolean.");
        }
        if (!Number.isInteger(Computed_Value) || Computed_Value < 0 || Computed_Value > 100) {
            throw new TypeError("CriminalRecord validation failed: 'Computed_Value' must be an integer between 0 and 100.");
        }

        this.ID = ID;
        this.Name = Name;
        this.Avatar_Asset_Path = Avatar_Asset_Path;
        this.Interpol_Red_Notice = Interpol_Red_Notice;
        this.FBI_Most_Wanted = FBI_Most_Wanted;
        this.Conviction_Status = Conviction_Status;
        this.Computed_Value = Computed_Value;
    }
}
