import { CriminalRecord } from '../models/CriminalRecord.js';

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

        return this._unspawnedRecords;
    }

    async _loadFallback() {
        const response = await fetch(this.fallbackUrl);
        if (!response.ok) {
            throw new Error("Fatal: Fallback registry missing or corrupt.");
        }
        const json = await response.json();
        
        // Strict mapping via constructor validation
        this._unspawnedRecords = json.map(data => new CriminalRecord(data));
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
