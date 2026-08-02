// Firebase configuration example
// Copy this file to `firebase-config.js` and fill in your actual settings from the Firebase Console.
export const firebaseConfig = {
    // Set useCloudConfig to false for local testing (uses local default rules directly),
    // or true to fetch and sync live rules with Firebase Firestore.
    useCloudConfig: false,
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    // Toggle enableGeminiAI to false to disable Gemini API calls and run in 100% offline procedural mode
    enableGeminiAI: true,
    // Enable/Disable live Real-Time Cyberpunk Weather & Volumetric Fog System (Open-Meteo API)
    enableWeatherSystem: true,
    // Serverless Firebase Cloud Function Proxy Endpoint for real-time boss taunts & LLM narration features
    geminiProxyUrl: "https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/generateNarration"
};
