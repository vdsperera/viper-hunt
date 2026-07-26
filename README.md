# Viper Hunt 🐍⚡

A cyberpunk-themed browser-based arcade snake game with bounty hunting targets, treasure vault loot extraction, roaming boss hazards, mobile virtual D-Pad controls, and cloud/local persistence.

Built using native **HTML5 Canvas 2D**, **ES6+ Vanilla JavaScript**, **CSS3**, and **Firebase Firestore** with local storage fallbacks.

---

## Key Features

- 🎮 **Multiple Play Modes:**
  - **Mode 1 — Viper Bounty Hunter:** Capture criminal targets loaded via Google Sheets CSV API or local JSON fallback.
  - **Mode 2 — Treasure Vault:** Extract glowing vector loot items (chests, gems, ingots) with custom visual shapes.
  - **Mode 3 — Emotional Death Quest:** Answer philosophical soul questions while evading the Death entity.
- 🎯 **Target Identity Badges & Wanted Roster:** Floating canvas name badges above targets and a live Wanted Targets Roster HUD bar.
- ⚔️ **Configurable Attack & Punishment System:** Select tactical attack methods using keys `1`-`4` (`Handed to Police`, `Caged Like an Animal`, `Shot Down in Action`, `Ruthlessly Butchered`) with score multipliers and limited inventory.
- 🚨 **Configurable Multi-Hazard Engine:** Escalating per-level risk featuring 🦹 Crime Bosses, 🚔 Police Patrols (flashing lights), and 💀 Death Reapers, complete with specific cause of death tracking.
- 📋 **End-of-Game Criminal Punishment Log:** Post-game breakdown modal presenting an itemized summary card table of every criminal captured, punishment used, and bounty payout.
- 📱 **Mobile Virtual D-Pad & Unobscured Layout:** Responsive touch controls with transparent auto-dimming HUD elements for clear target visibility.
- 💥 **Cyberpunk Glowing UI & FX:** Neon vector rendering engine, dynamic canvas scaling, spark particle bursts, and floating score popups.
- ☁️ **Cloud & Offline Local Persistence:** Firebase Firestore profile sync with transparent `localStorage` fallback.
- 🛡️ **XSS Protection:** Input sanitization on remote CSV fields and canvas-level safe image rendering.

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
  - Directional Movement: Tap Virtual D-Pad buttons on screen overlay (`▲`, `▼`, `◄`, `►`)
  - Attack Selector: Tap HUD Attack Method Buttons (`[1] 👮`, `[2] 🔒`, `[3] 🎯`, `[4] 🪓`)

---

## Repository Structure

```
viper-hunt/
├── index.html                   # Game HTML shell, mode overlay, start/game-over screens, wanted roster & attack HUD
├── main.js                      # Core entry point, mode selection, Firebase init, UI event wiring
├── style.css                    # Cyberpunk design system, glowing UI, responsive overlays, mobile D-Pad
├── init-db.js                   # Firestore initial database seed script
├── firebase-config.js           # Live Firebase configuration parameters
├── firebase-config.example.js   # Example configuration template
├── assets/                      # Graphic assets (avatars, icons, audio)
├── data/                        # Local fallback data (fallback_registry.json)
├── models/                      # Domain entities (CriminalRecord, HunterEntity)
├── services/                    # Game engine services
│   ├── AttackManager.js         # Tactical attack inventory, selection, multipliers, and story phrasing
│   ├── CollisionDetector.js     # Grid boundary, self, multi-hazard collision detection, and cause of death tracking
│   ├── FirebaseService.js       # Firestore cloud sync & local storage persistence
│   ├── GameLoop.js              # Fixed delta requestAnimationFrame loop orchestrator
│   ├── GridState.js             # Spatial grid matrix, hunter segments, targets, multi-hazard entity management
│   ├── InputHandler.js          # WASD / Arrow key queueing, number keys (1-9), & Virtual D-Pad touch controls
│   ├── LevelManager.js          # Target spawning, level progression, per-level hazard scaling, recentering
│   ├── RegistryService.js       # Google Sheets CSV fetcher, XSS sanitizer, play mode provider
│   ├── Renderer.js              # Canvas 2D renderer, cyberpunk glow FX, floating target badges, multi-hazard icons
│   ├── ScoreManager.js          # Level & session score calculators with criminal capture logging
│   └── TargetManager.js         # Random unoccupied grid cell target spawner
├── tests/                       # Unit & integration test suites (including MultiHazard and AttackManager)
├── docs/                        # Living project documents (01-requirements, 02-user-stories, 03-architecture, 04-tasks, 05-deployment)
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

Documentation files in `docs/` (`01-requirements.md`, `02-user-stories.md`, `03-architecture.md`, `04-tasks.md`, `05-deployment.md`) are kept strictly in sync with codebase features and task completions.


