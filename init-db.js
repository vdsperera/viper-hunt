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
            maxLevels: { integerValue: "3" },
            levelTargetSpecs: {
                arrayValue: {
                    values: [
                        {
                            mapValue: {
                                fields: {
                                    level: { integerValue: "1" },
                                    targetValues: { arrayValue: { values: [ { integerValue: "20" }, { integerValue: "20" }, { integerValue: "50" }, { integerValue: "70" }, { integerValue: "100" } ] } }
                                }
                            }
                        },
                        {
                            mapValue: {
                                fields: {
                                    level: { integerValue: "2" },
                                    targetValues: { arrayValue: { values: [ { integerValue: "30" }, { integerValue: "40" }, { integerValue: "60" }, { integerValue: "80" }, { integerValue: "100" } ] } }
                                }
                            }
                        },
                        {
                            mapValue: {
                                fields: {
                                    level: { integerValue: "3" },
                                    targetValues: { arrayValue: { values: [ { integerValue: "50" }, { integerValue: "60" }, { integerValue: "75" }, { integerValue: "90" }, { integerValue: "100" } ] } }
                                }
                            }
                        }
                    ]
                }
            },
            growthLow: { integerValue: "1" },
            growthMedium: { integerValue: "2" },
            growthHigh: { integerValue: "3" },
            growthElite: { integerValue: "4" },
            bossMoveChance: { doubleValue: 0.4 },
            bossAggressiveness: { doubleValue: 0.6 },
            bossMoveRange: { integerValue: "1" }
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
