/**
 * ui/DomRefs.js
 * Centralized DOM Element References
 */
export const domRefs = {
    // Glassmorphism Overlay UI
    get uiOverlay() { return document.getElementById('overlay-ui'); },
    get uiTitle() { return document.getElementById('overlay-title'); },
    get uiMsg() { return document.getElementById('overlay-message'); },
    get startBtn() { return document.getElementById('start-btn'); },

    // Profile & Callsign Controls
    get profileSection() { return document.getElementById('profile-section'); },
    get newProfileName() { return document.getElementById('new-profile-name'); },
    get createProfileBtn() { return document.getElementById('create-profile-btn'); },
    get profileDropdown() { return document.getElementById('profile-dropdown'); },
    get modeDropdown() { return document.getElementById('mode-dropdown'); },
    get renderEngineDropdown() { return document.getElementById('render-engine-dropdown'); },
    get geminiStatusBadge() { return document.getElementById('gemini-status-badge'); },

    // Audio Controls
    get sfxToggleBtn() { return document.getElementById('sfx-toggle-btn'); },
    get bgmToggleBtn() { return document.getElementById('bgm-toggle-btn'); },
    get voiceToggleBtn() { return document.getElementById('voice-toggle-btn'); },
    get sfxVolSlider() { return document.getElementById('sfx-volume-slider'); },
    get bgmVolSlider() { return document.getElementById('bgm-volume-slider'); },
    get bgmTrackSelect() { return document.getElementById('bgm-track-select'); },
    get voiceStyleSelect() { return document.getElementById('voice-style-select'); },
    get renderModeToggleBtn() { return document.getElementById('render-mode-toggle-btn'); },

    // Main Game HUD
    get hud() { return document.getElementById('hud'); },
    get hudPlayer() { return document.getElementById('hud-player'); },
    get hudLevel() { return document.getElementById('hud-level'); },
    get hudScore() { return document.getElementById('hud-score'); },
    get hudThreatLevel() { return document.getElementById('hud-threat-level'); },

    // Dynamic HUD Controls
    get dpadControls() { return document.getElementById('dpad-controls'); },
    get attackSelectorHud() { return document.getElementById('attack-selector-hud'); },
    get attackButtonsContainer() { return document.getElementById('attack-buttons-container'); },
    get wantedRosterHud() { return document.getElementById('wanted-roster-hud'); },
    get wantedTargetsContainer() { return document.getElementById('wanted-targets-container'); },
    get eqHud() { return document.getElementById('emotional-question-hud'); },
    get scoreBreakdownContainer() { return document.getElementById('score-breakdown-container'); }
};
