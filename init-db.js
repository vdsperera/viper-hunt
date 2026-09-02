import { firebaseConfig } from './firebase-config.js';

async function init() {
    const projectId = firebaseConfig.projectId;
    if (!projectId || projectId.includes("YOUR_")) {
        console.error("Error: Please set your actual Firebase Project ID in firebase-config.js first.");
        process.exit(1);
    }

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/configs/gameRules`;
    
    // Firestore REST API expects values to be formatted with their specific data types
    const payload = {
        fields: {
            fps: { integerValue: "12" },
            targetsPerLevel: { integerValue: "5" },
            maxSimultaneousTargets: { integerValue: "3" },
            maxLevels: { integerValue: "10" },
            levelTargetSpecs: {
                arrayValue: {
                    values: [
                        { mapValue: { fields: { level: { integerValue: "1" }, targetValues: { arrayValue: { values: [ { integerValue: "20" }, { integerValue: "20" }, { integerValue: "50" }, { integerValue: "70" }, { integerValue: "100" } ] } } } } },
                        { mapValue: { fields: { level: { integerValue: "2" }, targetValues: { arrayValue: { values: [ { integerValue: "30" }, { integerValue: "40" }, { integerValue: "60" }, { integerValue: "80" }, { integerValue: "100" } ] } } } } },
                        { mapValue: { fields: { level: { integerValue: "3" }, targetValues: { arrayValue: { values: [ { integerValue: "50" }, { integerValue: "60" }, { integerValue: "75" }, { integerValue: "90" }, { integerValue: "100" } ] } } } } },
                        { mapValue: { fields: { level: { integerValue: "4" }, targetValues: { arrayValue: { values: [ { integerValue: "40" }, { integerValue: "50" }, { integerValue: "70" }, { integerValue: "90" }, { integerValue: "120" } ] } } } } },
                        { mapValue: { fields: { level: { integerValue: "5" }, targetValues: { arrayValue: { values: [ { integerValue: "50" }, { integerValue: "60" }, { integerValue: "80" }, { integerValue: "100" }, { integerValue: "130" } ] } } } } },
                        { mapValue: { fields: { level: { integerValue: "6" }, targetValues: { arrayValue: { values: [ { integerValue: "60" }, { integerValue: "70" }, { integerValue: "90" }, { integerValue: "110" }, { integerValue: "140" } ] } } } } },
                        { mapValue: { fields: { level: { integerValue: "7" }, targetValues: { arrayValue: { values: [ { integerValue: "60" }, { integerValue: "75" }, { integerValue: "95" }, { integerValue: "120" }, { integerValue: "150" } ] } } } } },
                        { mapValue: { fields: { level: { integerValue: "8" }, targetValues: { arrayValue: { values: [ { integerValue: "70" }, { integerValue: "80" }, { integerValue: "100" }, { integerValue: "130" }, { integerValue: "160" } ] } } } } },
                        { mapValue: { fields: { level: { integerValue: "9" }, targetValues: { arrayValue: { values: [ { integerValue: "80" }, { integerValue: "90" }, { integerValue: "110" }, { integerValue: "150" }, { integerValue: "180" } ] } } } } },
                        { mapValue: { fields: { level: { integerValue: "10" }, targetValues: { arrayValue: { values: [ { integerValue: "100" }, { integerValue: "120" }, { integerValue: "140" }, { integerValue: "170" }, { integerValue: "200" } ] } } } } }
                    ]
                }
            },
            levelTargetCounts: {
                arrayValue: {
                    values: [
                        { mapValue: { fields: { level: { integerValue: "1" }, count: { integerValue: "5" } } } },
                        { mapValue: { fields: { level: { integerValue: "2" }, count: { integerValue: "5" } } } },
                        { mapValue: { fields: { level: { integerValue: "3" }, count: { integerValue: "5" } } } },
                        { mapValue: { fields: { level: { integerValue: "4" }, count: { integerValue: "6" } } } },
                        { mapValue: { fields: { level: { integerValue: "5" }, count: { integerValue: "6" } } } },
                        { mapValue: { fields: { level: { integerValue: "6" }, count: { integerValue: "7" } } } },
                        { mapValue: { fields: { level: { integerValue: "7" }, count: { integerValue: "7" } } } },
                        { mapValue: { fields: { level: { integerValue: "8" }, count: { integerValue: "8" } } } },
                        { mapValue: { fields: { level: { integerValue: "9" }, count: { integerValue: "8" } } } },
                        { mapValue: { fields: { level: { integerValue: "10" }, count: { integerValue: "10" } } } }
                    ]
                }
            },
            levelSpeedMultipliers: {
                arrayValue: {
                    values: [
                        { mapValue: { fields: { level: { integerValue: "1" }, multiplier: { doubleValue: 1.0 } } } },
                        { mapValue: { fields: { level: { integerValue: "2" }, multiplier: { doubleValue: 1.0 } } } },
                        { mapValue: { fields: { level: { integerValue: "3" }, multiplier: { doubleValue: 1.0 } } } },
                        { mapValue: { fields: { level: { integerValue: "4" }, multiplier: { doubleValue: 1.1 } } } },
                        { mapValue: { fields: { level: { integerValue: "5" }, multiplier: { doubleValue: 1.15 } } } },
                        { mapValue: { fields: { level: { integerValue: "6" }, multiplier: { doubleValue: 1.2 } } } },
                        { mapValue: { fields: { level: { integerValue: "7" }, multiplier: { doubleValue: 1.25 } } } },
                        { mapValue: { fields: { level: { integerValue: "8" }, multiplier: { doubleValue: 1.3 } } } },
                        { mapValue: { fields: { level: { integerValue: "9" }, multiplier: { doubleValue: 1.35 } } } },
                        { mapValue: { fields: { level: { integerValue: "10" }, multiplier: { doubleValue: 1.4 } } } }
                    ]
                }
            },
            growthLow: { integerValue: "1" },
            growthMedium: { integerValue: "2" },
            growthHigh: { integerValue: "3" },
            growthElite: { integerValue: "4" },
            bossMoveChance: { doubleValue: 0.4 },
            bossAggressiveness: { doubleValue: 0.6 },
            bossMoveRange: { integerValue: "1" },
            geminiProxyUrl: { stringValue: "https://us-central1-viper-hunt.cloudfunctions.net/generateNarration" }
        }
    };

    console.log(`Attempting to upload rules to Firestore for project: "${projectId}"...`);

    try {
        const res = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            console.log("\n✅ Success! Custom game rules successfully written to your Firestore Database.");
            console.log("Your live game will now read these configs automatically.");
        } else {
            const errText = await res.text();
            console.error(`\n❌ Failed with Status Code: ${res.status}`);
            console.error("Details:", errText);
            console.error("\n👉 Action Required: Make sure your Firestore Rules are set to Test Mode (allow read, write: if true) in the Firebase console.");
        }
    } catch (e) {
        console.error("\n❌ Network error connecting to Firestore REST API:", e);
    }
}

init();
