import { CriminalRecord } from '../models/CriminalRecord.js';

const DEFAULT_FALLBACK_DATA = [
    { ID: "fb-001", Name: "Carmen Sandiego", Avatar_Asset_Path: "assets/avatars/carmen.png", Interpol_Red_Notice: true, FBI_Most_Wanted: true, Conviction_Status: false, Computed_Value: 100 },
    { ID: "fb-002", Name: "DB Cooper", Avatar_Asset_Path: "assets/avatars/cooper.png", Interpol_Red_Notice: false, FBI_Most_Wanted: true, Conviction_Status: false, Computed_Value: 80 },
    { ID: "fb-003", Name: "John Doe", Avatar_Asset_Path: "assets/avatars/placeholder.png", Interpol_Red_Notice: false, FBI_Most_Wanted: false, Conviction_Status: true, Computed_Value: 20 },
    { ID: "fb-004", Name: "Jane Doe", Avatar_Asset_Path: "assets/avatars/placeholder.png", Interpol_Red_Notice: false, FBI_Most_Wanted: false, Conviction_Status: false, Computed_Value: 10 },
    { ID: "fb-005", Name: "Arthur Slugworth", Avatar_Asset_Path: "assets/avatars/slugworth.png", Interpol_Red_Notice: false, FBI_Most_Wanted: false, Conviction_Status: true, Computed_Value: 30 },
    { ID: "fb-006", Name: "Keyser Soze", Avatar_Asset_Path: "assets/avatars/soze.png", Interpol_Red_Notice: true, FBI_Most_Wanted: true, Conviction_Status: false, Computed_Value: 95 },
    { ID: "fb-007", Name: "Gordon Gekko", Avatar_Asset_Path: "assets/avatars/gekko.png", Interpol_Red_Notice: false, FBI_Most_Wanted: true, Conviction_Status: true, Computed_Value: 50 },
    { ID: "fb-008", Name: "Hans Gruber", Avatar_Asset_Path: "assets/avatars/gruber.png", Interpol_Red_Notice: true, FBI_Most_Wanted: false, Conviction_Status: false, Computed_Value: 75 },
    { ID: "fb-009", Name: "Ernst Stavro Blofeld", Avatar_Asset_Path: "assets/avatars/blofeld.png", Interpol_Red_Notice: true, FBI_Most_Wanted: false, Conviction_Status: false, Computed_Value: 85 },
    { ID: "fb-010", Name: "Lex Luthor", Avatar_Asset_Path: "assets/avatars/luthor.png", Interpol_Red_Notice: false, FBI_Most_Wanted: true, Conviction_Status: false, Computed_Value: 70 }
];

export class RegistryService {
    constructor(csvUrl, fallbackUrl) {
        this._unspawnedRecords = [];
        this.csvUrl = csvUrl;
        this.fallbackUrl = fallbackUrl || 'data/fallback_registry.json';
    }

    /**
     * @returns {Promise<Array<CriminalRecord>>}
     */
    async loadRegistry() {
        if (!this.csvUrl) {
            await this._loadFallback();
            return this._unspawnedRecords;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout limit

            const response = await fetch(this.csvUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const csvText = await response.text();
            this._unspawnedRecords = this._parseCSV(csvText);

            if (this._unspawnedRecords.length === 0) throw new Error("Parsed CSV was empty");

        } catch (error) {
            console.warn(`[RegistryService] Failed to load live CSV (${error.message}). Gracefully degrading to local JSON fallback.`);
            await this._loadFallback();
        }

        if (!this._unspawnedRecords || this._unspawnedRecords.length === 0) {
            this._unspawnedRecords = DEFAULT_FALLBACK_DATA.map(data => new CriminalRecord(data));
        }

        return this._unspawnedRecords;
    }

    async _loadFallback() {
        try {
            const response = await fetch(this.fallbackUrl);
            if (!response.ok) throw new Error(`Fallback HTTP status ${response.status}`);
            const json = await response.json();
            this._unspawnedRecords = json.map(data => new CriminalRecord(data));
        } catch (error) {
            console.warn(`[RegistryService] Failed to fetch fallback JSON (${error.message}). Using inline default records.`);
            this._unspawnedRecords = DEFAULT_FALLBACK_DATA.map(data => new CriminalRecord(data));
        }
    }

    _parseCSV(csvText) {
        const lines = csvText.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 2) return [];

        const records = [];

        const parseStrictBool = (val) => {
            if (val === undefined || val === '') return false;
            const v = val.toLowerCase();
            if (v === '1' || v === 'true') return true;
            if (v === '0' || v === 'false') return false;
            throw new Error(`Invalid boolean value: ${val}`);
        };

        // Assumes headers: Name, Avatar_Asset_Path, Interpol_Red_Notice, FBI_Most_Wanted, Conviction_Status, Computed_Value
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim());

            // XSS Mitigation (TASK-018): Strip all HTML injection tags and their contents
            const rawName = cols[0] || "Unknown";
            const safeName = rawName.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<[^>]*>?/gm, '');

            try {
                if (cols.length < 6) throw new Error("Missing required fields");

                records.push(new CriminalRecord({
                    ID: `csv-${i}`,
                    Name: safeName,
                    Avatar_Asset_Path: cols[1] || 'placeholder.png',
                    Interpol_Red_Notice: parseStrictBool(cols[2]),
                    FBI_Most_Wanted: parseStrictBool(cols[3]),
                    Conviction_Status: parseStrictBool(cols[4]),
                    Computed_Value: parseInt(cols[5]) || 50
                }));
            } catch (err) {
                // Drop invalid rows rather than crashing the whole pool
                console.warn(`Skipping invalid CSV record at line ${i + 1}: ${err.message}`);
            }
        }
        return records;
    }

    /**
     * @returns {Array<CriminalRecord>}
     */
    getUnspawnedRecords() {
        return this._unspawnedRecords;
    }
}
