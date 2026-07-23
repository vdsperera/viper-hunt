# Viper Hunt 🐍⚡

A cyberpunk-themed browser-based arcade snake game with bounty hunting targets, treasure vault loot extraction, roaming boss hazards, mobile virtual D-Pad controls, and cloud/local persistence.

Built using native **HTML5 Canvas 2D**, **ES6+ Vanilla JavaScript**, **CSS3**, and **Firebase Firestore** with local storage fallbacks.

---

## Key Features

- 🎮 **Dual Play Modes:**
  - **Mode 1 — Viper Bounty Hunter:** Capture criminal targets loaded via Google Sheets CSV API or local JSON fallback.
  - **Mode 2 — Treasure Vault:** Extract glowing vector loot items (chests, gems, ingots) with custom visual shapes.
- 👾 **Roaming Criminal Big Boss Hazard:** Autonomous boss figures spawning on level progression with custom collision hazards.
- 📱 **Mobile Virtual D-Pad:** Responsive touch-based directional control overlay for mobile web browsers.
- 💥 **Cyberpunk Glowing UI & FX:** Neon vector rendering engine, dynamic canvas scaling, and particle explosion animations on captures.
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
- **Mobile Touch Devices:**
  - Directional Movement: Tap Virtual D-Pad buttons on screen overlay (`▲`, `▼`, `◄`, `►`)

---

## Repository Structure

```
viper-hunt/
├── index.html                   # Game HTML shell, mode overlay, start/game-over screens, virtual D-Pad
├── main.js                      # Core entry point, mode selection, Firebase init, UI event wiring
├── style.css                    # Cyberpunk design system, glowing UI, responsive overlays, mobile D-Pad
├── init-db.js                   # Firestore initial database seed script
├── firebase-config.js           # Live Firebase configuration parameters
├── firebase-config.example.js   # Example configuration template
├── assets/                      # Graphic assets (avatars, icons, audio)
├── data/                        # Local fallback data (fallback_registry.json)
├── models/                      # Domain entities (CriminalRecord, HunterEntity)
├── services/                    # Game engine services
│   ├── CollisionDetector.js     # Grid boundary, self, and boss collision detection
│   ├── FirebaseService.js       # Firestore cloud sync & local storage persistence
│   ├── GameLoop.js              # Fixed delta requestAnimationFrame loop orchestrator
│   ├── GridState.js             # Spatial grid matrix, hunter segments, targets, boss position
│   ├── InputHandler.js          # WASD / Arrow key queueing & Virtual D-Pad touch controls
│   ├── LevelManager.js          # Target spawning, level progression, boss activation, recentering
│   ├── RegistryService.js       # Google Sheets CSV fetcher, XSS sanitizer, play mode provider
│   ├── Renderer.js              # Canvas 2D renderer, cyberpunk glow FX, particle explosions, loot shapes
│   ├── ScoreManager.js          # Level & session score calculators with time bonuses
│   └── TargetManager.js         # Random unoccupied grid cell target spawner
├── tests/                       # Unit & integration test suites
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


