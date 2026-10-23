import { CriminalRecord } from '../models/CriminalRecord.js';

const DEFAULT_FALLBACK_DATA = [
    { ID: "fb-001", Name: "Carmen Sandiego", Avatar_Asset_Path: "assets/avatars/carmen.png", Interpol_Red_Notice: true, FBI_Most_Wanted: true, Conviction_Status: false, Computed_Value: 100, Incident: "International art and cultural artifact theft" },
    { ID: "fb-002", Name: "DB Cooper", Avatar_Asset_Path: "assets/avatars/cooper.png", Interpol_Red_Notice: false, FBI_Most_Wanted: true, Conviction_Status: false, Computed_Value: 80, Incident: "Boeing 727 aircraft hijacking and ransom extortion" },
    { ID: "fb-003", Name: "Eddie 'Fingers' Malone", Avatar_Asset_Path: "assets/avatars/malone.png", Interpol_Red_Notice: false, FBI_Most_Wanted: false, Conviction_Status: true, Computed_Value: 20, Incident: "Commercial grand larceny and dockside freight tampering" },
    { ID: "fb-004", Name: "John Doe", Avatar_Asset_Path: "assets/avatars/placeholder.png", Interpol_Red_Notice: false, FBI_Most_Wanted: false, Conviction_Status: true, Computed_Value: 20, Incident: "Municipal code violation and evasion" },
    { ID: "fb-005", Name: "Arthur Slugworth", Avatar_Asset_Path: "assets/avatars/slugworth.png", Interpol_Red_Notice: false, FBI_Most_Wanted: false, Conviction_Status: true, Computed_Value: 30, Incident: "Industrial espionage and trade secret theft" },
    { ID: "fb-006", Name: "Nikolai Rostov", Avatar_Asset_Path: "assets/avatars/rostov.png", Interpol_Red_Notice: false, FBI_Most_Wanted: false, Conviction_Status: true, Computed_Value: 30, Incident: "Counterfeit customs documentation and offshore fuel smuggling" },
    { ID: "fb-007", Name: "Silas Chen", Avatar_Asset_Path: "assets/avatars/chen.png", Interpol_Red_Notice: false, FBI_Most_Wanted: false, Conviction_Status: false, Computed_Value: 40, Incident: "Unauthorized surveillance of metropolitan police telemetry" },
    { ID: "fb-008", Name: "Maya Lin", Avatar_Asset_Path: "assets/avatars/maya.png", Interpol_Red_Notice: false, FBI_Most_Wanted: true, Conviction_Status: false, Computed_Value: 40, Incident: "High-frequency algorithmic flash-crash manipulation" },
    { ID: "fb-009", Name: "Gordon Gekko", Avatar_Asset_Path: "assets/avatars/gekko.png", Interpol_Red_Notice: false, FBI_Most_Wanted: true, Conviction_Status: true, Computed_Value: 50, Incident: "Wall Street securities fraud and insider trading" },
    { ID: "fb-010", Name: "Vincent 'Vinny' Vance", Avatar_Asset_Path: "assets/avatars/vincent.png", Interpol_Red_Notice: false, FBI_Most_Wanted: true, Conviction_Status: true, Computed_Value: 50, Incident: "Underground syndicate gambling and racketeering network" },
    { ID: "fb-011", Name: "Marcus Brody", Avatar_Asset_Path: "assets/avatars/brody.png", Interpol_Red_Notice: false, FBI_Most_Wanted: false, Conviction_Status: true, Computed_Value: 50, Incident: "Subprime municipal bond forgery and offshore shell routing" },
    { ID: "fb-012", Name: "Elena Rostova", Avatar_Asset_Path: "assets/avatars/elena.png", Interpol_Red_Notice: true, FBI_Most_Wanted: false, Conviction_Status: false, Computed_Value: 50, Incident: "Diplomatic pouch smuggling and classified telemetry brokerage" },
    { ID: "fb-013", Name: "Jaxx 'Zero' Mercer", Avatar_Asset_Path: "assets/avatars/cipher.png", Interpol_Red_Notice: true, FBI_Most_Wanted: true, Conviction_Status: false, Computed_Value: 60, Incident: "Federal reserve clearing server breach and cyber extortion" },
    { ID: "fb-014", Name: "Lex Luthor", Avatar_Asset_Path: "assets/avatars/luthor.png", Interpol_Red_Notice: false, FBI_Most_Wanted: true, Conviction_Status: false, Computed_Value: 70, Incident: "LexCorp illegal arms trafficking and conspiracy" },
    { ID: "fb-015", Name: "Hans Gruber", Avatar_Asset_Path: "assets/avatars/gruber.png", Interpol_Red_Notice: true, FBI_Most_Wanted: false, Conviction_Status: false, Computed_Value: 75, Incident: "Nakatomi Plaza vault heist and hostage siege" },
    { ID: "fb-016", Name: "Ernst Stavro Blofeld", Avatar_Asset_Path: "assets/avatars/blofeld.png", Interpol_Red_Notice: true, FBI_Most_Wanted: false, Conviction_Status: false, Computed_Value: 85, Incident: "Global satellite extortion and syndicate operations" },
    { ID: "fb-017", Name: "Saman Jayalath", Avatar_Asset_Path: "assets/avatars/jayalath.png", Interpol_Red_Notice: true, FBI_Most_Wanted: true, Conviction_Status: true, Computed_Value: 90, Incident: "High Court of Negombo capital conviction case (Kotadeniyawa, Sep 2015)" },
    { ID: "fb-018", Name: "Keyser Soze", Avatar_Asset_Path: "assets/avatars/soze.png", Interpol_Red_Notice: true, FBI_Most_Wanted: true, Conviction_Status: false, Computed_Value: 95, Incident: "Port of Los Angeles cargo vessel explosion and smuggling" },
    { ID: "fb-019", Name: "Elara Vance", Avatar_Asset_Path: "assets/avatars/vance.png", Interpol_Red_Notice: true, FBI_Most_Wanted: true, Conviction_Status: false, Computed_Value: 100, Incident: "International luxury syndicate smuggling and high-value heist conspiracy" },
    { ID: "fb-020", Name: "Mateo Salazar", Avatar_Asset_Path: "assets/avatars/salazar.png", Interpol_Red_Notice: true, FBI_Most_Wanted: true, Conviction_Status: true, Computed_Value: 110, Incident: "Cross-border heavy arms cartel distribution network" },
    { ID: "fb-021", Name: "Kenji Takanashi", Avatar_Asset_Path: "assets/avatars/takanashi.png", Interpol_Red_Notice: true, FBI_Most_Wanted: true, Conviction_Status: true, Computed_Value: 120, Incident: "Metropolitan harbor extortion and illicit container racketeering" },
    { ID: "fb-022", Name: "Viper Prime", Avatar_Asset_Path: "assets/avatars/viper.png", Interpol_Red_Notice: true, FBI_Most_Wanted: true, Conviction_Status: false, Computed_Value: 200, Incident: "Supreme architect and elusive head of the global Viper Syndicate" }
];

export class RegistryService {
    constructor(csvUrl, fallbackUrl) {
        this._unspawnedRecords = [];
        this._masterRecords = [];
        this._allocatedRecordIds = new Set();
        this._levelAllocations = new Map();
        this.csvUrl = csvUrl;
        this.fallbackUrl = fallbackUrl || 'data/fallback_registry.json';
    }

    /**
     * @returns {Promise<Array<CriminalRecord>>}
     */
    async loadRegistry() {
        if (!this.csvUrl) {
            await this._loadFallback();
            this._sortAndSyncMaster();
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

        this._sortAndSyncMaster();
        return this._unspawnedRecords;
    }

    _sortAndSyncMaster() {
        // Sort deterministically by ID so every session allocates exact same records per level
        this._masterRecords = [...this._unspawnedRecords].sort((a, b) => (a.ID || '').localeCompare(b.ID || ''));
        this._unspawnedRecords = [...this._masterRecords];
    }

    /**
     * Resets active session pool back to full master records and clears level allocations.
     */
    resetSessionPool() {
        this._allocatedRecordIds.clear();
        this._levelAllocations.clear();
        this._unspawnedRecords = [...this._masterRecords];
    }

    /**
     * Returns a deterministic subset of target records allocated for a specific level.
     * Guarantees that profiles allocated in earlier levels are not repeated in subsequent levels.
     * @param {number} levelNumber
     * @param {number} targetsPerLevel
     * @param {Array<Object>|Object} levelTargetSpecs Configurable per-level target values and counts
     * @returns {Array<CriminalRecord>}
     */
    getRecordsForLevel(levelNumber = 1, targetsPerLevel = 5, levelTargetSpecs = null) {
        if (!this._masterRecords || this._masterRecords.length === 0) {
            this._sortAndSyncMaster();
        }

        // Return cached records if this level was already generated in this session (idempotent / deterministic)
        if (this._levelAllocations.has(levelNumber)) {
            return this._levelAllocations.get(levelNumber);
        }

        // Check if custom per-level target specifications are provided
        let targetValuesConfig = null;
        if (Array.isArray(levelTargetSpecs)) {
            const spec = levelTargetSpecs.find(s => s.level === levelNumber);
            if (spec) {
                if (Array.isArray(spec.targetValues)) {
                    targetValuesConfig = spec.targetValues;
                } else if (Array.isArray(spec.targets)) {
                    targetValuesConfig = [];
                    spec.targets.forEach(t => {
                        const cnt = t.count || 1;
                        for (let i = 0; i < cnt; i++) targetValuesConfig.push(t.value);
                    });
                }
            }
        } else if (levelTargetSpecs && typeof levelTargetSpecs === 'object') {
            const spec = levelTargetSpecs[levelNumber] || levelTargetSpecs[`level_${levelNumber}`];
            if (Array.isArray(spec)) {
                targetValuesConfig = spec;
            } else if (spec && Array.isArray(spec.targetValues)) {
                targetValuesConfig = spec.targetValues;
            }
        }

        // Filter master records excluding those already allocated to earlier levels in this session
        let availableMaster = this._masterRecords.filter(r => !this._allocatedRecordIds.has(r.ID));

        // In the rare event that all unallocated master records are exhausted across extremely long sessions,
        // fall back to the full master pool
        if (availableMaster.length === 0) {
            availableMaster = [...this._masterRecords];
        }

        const levelPool = [];

        if (targetValuesConfig && targetValuesConfig.length > 0) {
            targetValuesConfig.forEach((val, idx) => {
                // Find matching record with exact Computed_Value among unallocated records
                const matchIndex = availableMaster.findIndex(r => r.Computed_Value === val);
                if (matchIndex !== -1) {
                    const matched = availableMaster.splice(matchIndex, 1)[0];
                    levelPool.push(matched);
                    this._allocatedRecordIds.add(matched.ID);
                } else {
                    // Search master pool if unallocated subset didn't have this value (avoiding duplicates in this level)
                    const secondaryMatch = this._masterRecords.find(r => r.Computed_Value === val && !levelPool.some(p => p.ID === r.ID));
                    if (secondaryMatch) {
                        levelPool.push(secondaryMatch);
                        this._allocatedRecordIds.add(secondaryMatch.ID);
                    } else {
                        // Synthesize record with exact requested Computed_Value if not in master pool
                        const synth = new CriminalRecord({
                            ID: `cfg-lvl${levelNumber}-${idx}`,
                            Name: `Target ${val}pts`,
                            Avatar_Asset_Path: 'assets/avatars/placeholder.png',
                            Interpol_Red_Notice: val >= 80,
                            FBI_Most_Wanted: val >= 50,
                            Conviction_Status: true,
                            Computed_Value: val
                        });
                        levelPool.push(synth);
                        this._allocatedRecordIds.add(synth.ID);
                    }
                }
            });
        } else {
            // Default deterministic slicing of unallocated master pool
            const countToTake = Math.min(targetsPerLevel, availableMaster.length);
            const taken = availableMaster.slice(0, countToTake);
            taken.forEach(r => {
                levelPool.push(r);
                this._allocatedRecordIds.add(r.ID);
            });
        }

        this._levelAllocations.set(levelNumber, levelPool);
        return levelPool;
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
