import { CriminalRecord } from '../models/CriminalRecord.js';

const DEFAULT_FALLBACK_DATA = [
    {
        ID: "fb-001",
        Name: "Carmen 'The Siren' Castiglione",
        Avatar_Asset_Path: "assets/avatars/carmen.png",
        Interpol_Red_Notice: true,
        FBI_Most_Wanted: true,
        Conviction_Status: false,
        Computed_Value: 100,
        Incident: "Suspect in the multi-state 'Black Rose' museum infiltrations and the murder of two night watchmen via paralyzed asphyxiation. Linked by microscopic cosmetic pigment transfer and high-tensile glass-cutter diamond dust left at three vault crime scenes."
    },
    {
        ID: "fb-002",
        Name: "Dan 'Skydrop' Cooper",
        Avatar_Asset_Path: "assets/avatars/cooper.png",
        Interpol_Red_Notice: false,
        FBI_Most_Wanted: true,
        Conviction_Status: false,
        Computed_Value: 80,
        Incident: "Fugitive hijacker who armed an altitude-sensitive pressure bomb aboard Flight 412, extorting $1.2M in unmarked cash before parachuting into dense wilderness. FBI ballistics recovered unexploded detonator wiring matching military salvage stolen from his remote cabin."
    },
    {
        ID: "fb-003",
        Name: "Eddie 'Fingers' Malone",
        Avatar_Asset_Path: "assets/avatars/malone.png",
        Interpol_Red_Notice: false,
        FBI_Most_Wanted: false,
        Conviction_Status: true,
        Computed_Value: 20,
        Incident: "Repeat dockside cargo predator convicted of violent freight warehouse ambushes. Known for breaking watchmen's fingers to extract safe combinations. Identified when crime lab luminol exposed wiped blood spatters and footwear tread casts on shipping crates."
    },
    {
        ID: "fb-004",
        Name: "The Railside Stalker ('John Doe')",
        Avatar_Asset_Path: "assets/avatars/placeholder.png",
        Interpol_Red_Notice: false,
        FBI_Most_Wanted: false,
        Conviction_Status: true,
        Computed_Value: 20,
        Incident: "Unidentified predatory home invader operating along dark municipal railway corridors. Captured on infrared surveillance after a 3-month stakeout following multiple violent basement break-ins and severe assaults on lone residents."
    },
    {
        ID: "fb-005",
        Name: "Arthur Slugworth",
        Avatar_Asset_Path: "assets/avatars/slugworth.png",
        Interpol_Red_Notice: false,
        FBI_Most_Wanted: false,
        Conviction_Status: true,
        Computed_Value: 30,
        Incident: "Industrial saboteur convicted of deliberately contaminating commercial infant formula production vats with toxic ethylene glycol during an extortion campaign against a multinational food conglomerate."
    },
    {
        ID: "fb-006",
        Name: "Nikolai Rostov",
        Avatar_Asset_Path: "assets/avatars/rostov.png",
        Interpol_Red_Notice: false,
        FBI_Most_Wanted: false,
        Conviction_Status: true,
        Computed_Value: 30,
        Incident: "Ruthless maritime fuel smuggler who deliberately rammed and sank a rival commercial trawler, abandoning four deckhands to freeze in open waters. Arrested after forensic sonar and metallurgical analysis matched his tugboat's reinforced steel prow."
    },
    {
        ID: "fb-007",
        Name: "Silas 'Wiretap' Chen",
        Avatar_Asset_Path: "assets/avatars/chen.png",
        Interpol_Red_Notice: false,
        FBI_Most_Wanted: false,
        Conviction_Status: false,
        Computed_Value: 40,
        Incident: "Predatory cyber-stalker and blackmailer who compromised smart-home cameras and nursery monitors across 300 households, live-streaming feeds to darknet voyeur rings and extorting victims with intimate surveillance recordings."
    },
    {
        ID: "fb-008",
        Name: "Maya Lin",
        Avatar_Asset_Path: "assets/avatars/maya.png",
        Interpol_Red_Notice: false,
        FBI_Most_Wanted: true,
        Conviction_Status: false,
        Computed_Value: 40,
        Incident: "Disgraced quant engineer who triggered artificial hospital medical-supply shortages to short municipal bonds, causing insulin and dialysis rationing across two counties. FBI forensic data recovered sub-millisecond server logs linking her private IP."
    },
    {
        ID: "fb-009",
        Name: "Gordon Gekko",
        Avatar_Asset_Path: "assets/avatars/gekko.png",
        Interpol_Red_Notice: false,
        FBI_Most_Wanted: true,
        Conviction_Status: true,
        Computed_Value: 50,
        Incident: "Ruthless corporate raider convicted of ordering the arson of a bankrupt manufacturing plant with night maintenance workers locked inside to collect a $40M insurance payout. Convicted via paper trail and kerosene trace accelerant."
    },
    {
        ID: "fb-010",
        Name: "Vincent 'Vinny' Vance",
        Avatar_Asset_Path: "assets/avatars/vincent.png",
        Interpol_Red_Notice: false,
        FBI_Most_Wanted: true,
        Conviction_Status: true,
        Computed_Value: 50,
        Incident: "Underground loan shark and syndicate enforcer notorious for acid-burn debt mutilations. Convicted in the brutal beatdown and disposal of an indebted small-business owner whose body was recovered from an industrial cement pit."
    },
    {
        ID: "fb-011",
        Name: "Marcus Brody",
        Avatar_Asset_Path: "assets/avatars/brody.png",
        Interpol_Red_Notice: false,
        FBI_Most_Wanted: false,
        Conviction_Status: true,
        Computed_Value: 50,
        Incident: "Disbarred estate attorney convicted in a multi-victim fraud ring targeting terminally ill hospice patients, draining their life savings and drugging victims with lethal doses of sedatives to prevent testimony."
    },
    {
        ID: "fb-012",
        Name: "Elena 'The Widow' Rostova",
        Avatar_Asset_Path: "assets/avatars/elena.png",
        Interpol_Red_Notice: true,
        FBI_Most_Wanted: false,
        Conviction_Status: false,
        Computed_Value: 50,
        Incident: "Suspected contract poisoner linked to the mysterious deaths of three diplomatic attachés. Forensic toxicologists detected rare radioactive polonium isotopes on teacups and upholstery, tracing the signature back to her embassy residence."
    },
    {
        ID: "fb-013",
        Name: "Jaxx 'Zero' Mercer",
        Avatar_Asset_Path: "assets/avatars/cipher.png",
        Interpol_Red_Notice: true,
        FBI_Most_Wanted: true,
        Conviction_Status: false,
        Computed_Value: 60,
        Incident: "Black-hat cyber-terrorist who executed a ransomware lockdown on an ICU regional trauma center network, causing three patient fatalities when life-support and oxygen regulators malfunctioned. Tracked through encrypted monero wallet laundering."
    },
    {
        ID: "fb-014",
        Name: "Alexander 'Lex' Luthor",
        Avatar_Asset_Path: "assets/avatars/luthor.png",
        Interpol_Red_Notice: false,
        FBI_Most_Wanted: true,
        Conviction_Status: false,
        Computed_Value: 70,
        Incident: "Defense contractor billionaire indicted for covertly testing experimental neuro-toxic acoustic crowd-control weapons on civilian detainee camps in sovereign conflict zones. Linked by whistle-blower encrypted telemetric telemetry."
    },
    {
        ID: "fb-015",
        Name: "Hans Gruber",
        Avatar_Asset_Path: "assets/avatars/gruber.png",
        Interpol_Red_Notice: true,
        FBI_Most_Wanted: false,
        Conviction_Status: false,
        Computed_Value: 75,
        Incident: "Terrorist cell commander who seized a 35-story corporate high-rise, taking 30 hostages and executing an executive on camera while drilling into a $640M vault. Forensic ballistics matched his custom suppressed automatic to two prior embassy assassinations."
    },
    {
        ID: "fb-016",
        Name: "Ernst Stavro Blofeld",
        Avatar_Asset_Path: "assets/avatars/blofeld.png",
        Interpol_Red_Notice: true,
        FBI_Most_Wanted: false,
        Conviction_Status: false,
        Computed_Value: 85,
        Incident: "Transnational syndicate mastermind behind oceanic biological pathogen dispersal tests that wiped out two isolated island fishing villages. Interpol red notice issued after intercepted satellite transmissions revealed global blackmail schemes."
    },
    {
        ID: "fb-017",
        Name: "Saman Jayalath",
        Avatar_Asset_Path: "assets/avatars/jayalath.png",
        Interpol_Red_Notice: true,
        FBI_Most_Wanted: true,
        Conviction_Status: true,
        Computed_Value: 90,
        Incident: "Negombo High Court capital conviction (Kotadeniyawa Case). Convicted in the abduction, assault, and strangulation of a four-year-old child near a canal, cracked via conclusive familial DNA swab matching and local forensic pathology."
    },
    {
        ID: "fb-018",
        Name: "Keyser Soze",
        Avatar_Asset_Path: "assets/avatars/soze.png",
        Interpol_Red_Notice: true,
        FBI_Most_Wanted: true,
        Conviction_Status: false,
        Computed_Value: 95,
        Incident: "Ruthless underworld shadow boss responsible for the Port of Los Angeles cargo freighter massacre, executing 27 crew members and incinerating the vessel to eliminate a single witness. Forensic arson analysis identified high-grade thermite."
    },
    {
        ID: "fb-019",
        Name: "Elara Vance",
        Avatar_Asset_Path: "assets/avatars/vance.png",
        Interpol_Red_Notice: true,
        FBI_Most_Wanted: true,
        Conviction_Status: false,
        Computed_Value: 100,
        Incident: "International syndicate heist coordinator and weapons broker who orchestrated the armed interception of a United Nations medical convoy, executing five peacekeepers to seize controlled surgical narcotics for cartel distribution."
    },
    {
        ID: "fb-020",
        Name: "Mateo 'El Carnicero' Salazar",
        Avatar_Asset_Path: "assets/avatars/salazar.png",
        Interpol_Red_Notice: true,
        FBI_Most_Wanted: true,
        Conviction_Status: true,
        Computed_Value: 110,
        Incident: "Border cartel death-squad commander convicted of running a clandestine torture compound in the Sonoran desert. Known for dismembering informants and burying bodies in quicklime barrels; linked by forensic tooth enamel DNA extraction."
    },
    {
        ID: "fb-021",
        Name: "Kenji Takanashi",
        Avatar_Asset_Path: "assets/avatars/takanashi.png",
        Interpol_Red_Notice: true,
        FBI_Most_Wanted: true,
        Conviction_Status: true,
        Computed_Value: 120,
        Incident: "Tokyo Yakuza syndicate oyabun convicted in a series of targeted retaliatory bombings, including the detonation of a downtown tea house that killed nine innocent patrons. Captured after explosive residue on his gloves matched C4 military plastic explosives."
    },
    {
        ID: "fb-022",
        Name: "Viper Prime (The Supreme Architect)",
        Avatar_Asset_Path: "assets/avatars/viper.png",
        Interpol_Red_Notice: true,
        FBI_Most_Wanted: true,
        Conviction_Status: false,
        Computed_Value: 200,
        Incident: "The apex architect of the Viper Syndicate network: orchestrates cross-border human trafficking, political assassinations, and catastrophic cyber warfare. Identified only through shredded encrypted cipher pads recovered from burned safehouses across three continents."
    }
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
