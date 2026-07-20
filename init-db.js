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
            growthLow: { integerValue: "1" },
            growthMedium: { integerValue: "2" },
            growthHigh: { integerValue: "3" },
            growthElite: { integerValue: "4" }
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
