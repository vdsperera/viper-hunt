# Viper Hunt 🐍⚡

A cyberpunk-themed browser-based arcade snake game with bounty hunting targets, roaming boss hazards, mobile virtual D-Pad controls, and cloud/local persistence.

Built using native **HTML5 Canvas 2D**, **ES6+ Vanilla JavaScript**, **CSS3**, and **Firebase Firestore** with local storage fallbacks.

---

## Key Features

- 🎮 **Tactical Bounty Hunter Mode:** Capture criminal targets loaded dynamically via Google Sheets CSV API or offline local JSON fallback *(future modes such as Treasure Vault and Emotional Death Quest are on the roadmap)*.
- 🎯 **Target Identity Badges & Wanted Roster:** Floating canvas name badges above targets and a live Wanted Targets Roster HUD bar.
- ⚔️ **Configurable Attack & Punishment System:** Select tactical attack methods using keys `1`-`4` (`Handed to Police`, `Brutally Caged`, `Shot Down in Action`, `Ruthlessly Butchered`) with score multipliers and limited inventory.
- 🚨 **Configurable Multi-Hazard Engine:** Escalating per-level risk featuring 🦹 Crime Bosses, 🚔 Police Patrols (flashing lights), and 💀 Death Reapers, complete with specific cause of death tracking.
- 📖 **Interactive "How to Play" Guide & Hints:** Multi-card carousel onboarding modal covering mission goals, controls, scoring streaks, and hazard evasion, plus first-time directional swipe hints.
- 🎛️ **Compact Audio Control Bar:** Start-screen control bar with instant one-tap toggles for SFX, BGM, and tactical Voice comms, plus dedicated volume sliders, BGM track selectors, and voice personality styles.
- 🏆 **Global Leaderboards & Sliding Bottom Sheet:** Real-time sliding bottom-sheet ranking with Daily, Weekly, and All-Time tabs, skeleton loading states, pinned player ranking, and guest upgrade prompts.
- 🔒 **Authentication & Callsign System:** Guest sessions with persistent player callsigns, 4-digit PIN protection, `localStorage` profile memory, and upgrade path to Google OAuth.
- 📱 **Mobile Virtual D-Pad & Gesture Controls:** Responsive on-screen directional D-Pad and touch swipe gesture support, paired with unobscured auto-dimming HUD elements.
- 📋 **End-of-Game Criminal Punishment Log:** Post-game breakdown modal presenting an itemized summary card table of every criminal captured, punishment used, and bounty payout.
- 💥 **Cyberpunk Glowing UI & FX:** Neon vector rendering engine, dynamic canvas scaling, spark particle bursts, and floating score popups.
- ☁️ **Cloud & Offline Local Persistence:** Firebase Firestore profile sync with transparent `localStorage` fallback.
- 🛡️ **XSS Protection:** Input sanitization on remote CSV fields and canvas-level safe image rendering.
- 🤖 **Procedural & AI Narrative Engine:** Generates dynamic criminal confessions, hazard radio taunts, and post-match rap sheets via an internal procedural generator (with optional Google Gemini AI proxy integration).
- 🌧️ **Dynamic Weather & Threat Levels:** Live sector weather effects and adaptive AI difficulty scaling.
- ⚡ **Kill Streak System:** Chain captures to build a streak multiplier for bonus points.
- ☕ **Support the Dev Integration:** Built-in interactive donation modal with Ko-fi and EVM multi-network crypto support.

---

## Quick Start

### 1. Run Locally
Serve the repository root directory with any local static HTTP server (e.g. VS Code Live Server, `npx serve`, or `python -m http.server 8000`):

```bash
npx serve .
# Open http://localhost:3000 in your web browser
```

### 2. Run Test Suite
Execute unit and integration tests using Node.js native test runner:

```bash
npm test
```

### 3. Database Initialization (Optional)
Seed or update Firestore cloud rules and collections:

```bash
node init-db.js
```

---

## Controls

- **Desktop Keyboard:**
  - Directional Movement: `Arrow Keys` or `W`, `A`, `S`, `D`
  - Attack / Punishment Selector: Number Keys `1`, `2`, `3`, `4`
- **Mobile Touch Devices:**
  - Directional Movement: Swipe across the screen or tap Virtual D-Pad buttons on screen overlay (`▲`, `▼`, `◄`, `►`)
  - Attack Selector: Tap HUD Attack Method Buttons (`[1] 👮`, `[2] 🔒`, `[3] 🎯`, `[4] 🪓`)

### Developer Cheats (Local Testing Only)
*Note: These cheats are securely restricted and will only function when playing the game locally via `localhost` or `127.0.0.1`.*
- **`G`** — Toggle God Mode (Invincibility against hazards and walls)
- **`L`** — Skip Level (Instantly captures all remaining targets and advances)

---

## Repository Structure

```
viper-hunt/
├── index.html                   # Game HTML shell, mode overlay, start/game-over screens, wanted roster & attack HUD
├── main.js                      # Application entry point (initializes App)
├── App.js                       # Core application bootstrapper, mode selection, Firebase init, and subsystem orchestration
├── style.css                    # Cyberpunk design system, glowing UI, responsive overlays, mobile D-Pad
├── init-db.js                   # Firestore initial database seed script
├── firebase-config.js           # Live Firebase configuration parameters
├── firebase-config.example.js   # Example configuration template
├── firebase.json                # Firebase hosting and project deployment configuration
├── firestore.rules              # Firestore security rules
├── assets/                      # Graphic assets (avatars, crypto QR code)
├── data/                        # Local fallback data (fallback_registry.json)
├── functions/                   # Firebase Cloud Functions (backend proxies / endpoints)
├── models/                      # Domain entities (CriminalRecord, HunterEntity)
├── services/                    # Game engine services
│   ├── AdaptiveDifficultyService.js # Scales AI threat level and entity speed
│   ├── AttackManager.js         # Tactical attack inventory, selection, multipliers, and story phrasing
│   ├── AudioService.js          # Procedural Web Audio synthesizer (BGM, SFX, and tactical voice styles)
│   ├── CollisionDetector.js     # Grid boundary, self, multi-hazard collision detection, and cause of death tracking
│   ├── ConfigManager.js         # Global configuration and constants
│   ├── EventBus.js              # Centralized event publishing/subscription system
│   ├── FirebaseService.js       # Firestore cloud sync & local storage persistence
│   ├── GameLoop.js              # Fixed delta requestAnimationFrame loop orchestrator
│   ├── GridState.js             # Spatial grid matrix, hunter segments, targets, multi-hazard entity management
│   ├── InputHandler.js          # WASD / Arrow key queueing, number keys (1-9), & Virtual D-Pad touch controls
│   ├── LevelManager.js          # Target spawning, level progression, per-level hazard scaling, recentering
│   ├── LLMService.js            # Gemini AI procedural generation for narrative flavor
│   ├── Pathfinder.js            # AI pathfinding and hazard navigation
│   ├── RegistryService.js       # Google Sheets CSV fetcher, XSS sanitizer, play mode provider
│   ├── RenderManager.js         # Render mode coordinator (2D / 3D) and weather propagation
│   ├── Renderer.js              # Canvas 2D renderer, cyberpunk glow FX, floating target badges, multi-hazard icons
│   ├── Renderer3D.js            # Experimental Three.js WebGL 3D renderer
│   ├── ScoreManager.js          # Level & session score calculators with criminal capture logging
│   ├── StreakManager.js         # Kill streak tracking and score multipliers
│   ├── TargetManager.js         # Random unoccupied grid cell target spawner
│   ├── UIController.js          # Orchestrator for HUD, overlays, and UI event bindings
│   └── WeatherService.js        # Dynamic sector weather conditions
├── tests/                       # Unit & integration test suites (including MultiHazard and AttackManager)
├── docs/                        # Living project documents and design proposals
│   ├── 00-hierarchy-breakdown.md# Architecture hierarchy and module dependency map
│   ├── 01-requirements.md       # Product requirements and specifications
│   ├── 02-user-stories.md       # User stories and Gherkin acceptance criteria
│   ├── 03-architecture.md       # System design and component interactions
│   ├── 04-tasks.md              # Task backlog and implementation progress
│   ├── 05-deployment.md         # Deployment and release workflows
│   └── proposals/               # Future mechanics proposals (bribe, respect, level expansion)
└── prompts/                     # Source prompts for AI development pipeline
```

---

## AI Development Pipeline

This project is built following an 8-agent AI development workflow:

```
prompts/
├── 01-requirements-analyst.md
├── 02-user-story-writer.md
├── 03-architect.md
├── 04-task-planner.md
├── 05-developer.md
├── 06-code-reviewer.md
├── 07-security-reviewer.md
└── 08-test-generator.md
```

Documentation files in `docs/` (`00-hierarchy-breakdown.md`, `01-requirements.md`, `02-user-stories.md`, `03-architecture.md`, `04-tasks.md`, `05-deployment.md`, and `docs/proposals/`) are kept strictly in sync with codebase features and task completions.


