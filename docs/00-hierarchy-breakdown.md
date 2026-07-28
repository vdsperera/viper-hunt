# Complete Product Hierarchy & Feature Breakdown Guide
_Generated for Viper-Hunt — Retro Cyberpunk Snake Arcade Game_  
_Last updated: 2026-07-28_

---

## 1. Executive Summary & Concept Definitions

In modern agile development and technical leadership, software delivery artifacts are structured into distinct levels of abstraction. Each step down the stack increases precision, translating strategic goals into actionable engineering units.

```
Business Goal (Highest Level — Strategic "Why")
    ↓ (1:M)
Feature (System Capability — What the product offers)
    ↓ (1:M)
Requirements (Functional & Non-Functional Constraints — Precise Rules)
    ↓ (1:M)
User Stories (User Perspective & Acceptance Criteria — Gherkin Scenarios)
    ↓ (1:M)
Tasks (Implementation Work Units — Developer Code / Tests / Infra)
```

### Cardinality Rules (1:M Relationship)
- **1 Business Goal → Many Features**: A strategic business objective requires multiple system capabilities to be fulfilled.
- **1 Feature → Many Requirements**: A feature breaks down into multiple functional and non-functional specifications.
- **1 Requirement → Many User Stories**: A requirement is captured through user-centric scenarios with measurable acceptance criteria.
- **1 User Story → Many Tasks**: A user story requires multiple engineering tasks (data structures, UI components, API integrations, testing).

---

## 2. Artifact Decision Matrix

Use this matrix to classify any item during backlog refinement:

| Artifact Level | Primary Focus | Key Question Answered | Typical Owner | Example (Viper-Hunt) |
| :--- | :--- | :--- | :--- | :--- |
| **1. Business Goal** | Strategic ROI & Objectives | *Why are we building this?* | Executive / Product Manager | Increase player retention & browser engagement via a resilient retro arcade game. |
| **2. Feature** | System Capability | *What capability does the app offer?* | Product Manager / Tech Lead | Dynamic Target Spawning & Value Scoring Engine |
| **3. Requirement** | Rules & Constraints | *What must the system specifically do?* | Business Analyst / Systems Architect | Formula-driven target scoring: `(interpol * 40) + (fbi * 35) + (conviction * 25)` |
| **4. User Story** | User Scenario | *Who wants it and how do we accept it?* | Product Owner / Developer | *As a player, I want target point values rendered on-grid so I can prioritize high-value targets.* |
| **5. Task** | Engineering Execution | *How do we build, test, and ship it?* | Developer / Engineer | `TASK-012`: Implement `ScoreManager` for formula calculation & multipliers. |

---

## 3. Viper-Hunt Complete Hierarchy Mapping

Below is the complete 5-tier breakdown mapping every strategic objective down to developer tasks for **Viper-Hunt**.

---

### Goal 1 (BG-1): Core Gameplay & Player Engagement
> **Objective:** Deliver an intuitive, highly engaging 2D retro-cyberpunk arcade snake game where players hunt targets on a grid, grow their Hunter entity, avoid obstacles/hazards, and earn high scores across progressive levels.

#### FEAT-01: Grid Matrix & Physics Movement Engine
- **Requirements:**
  - [REQ-1.1](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#1-platform): MVP target platform is standard HTML5 Canvas and JavaScript (ES6+).
  - [REQ-1.2](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#1-platform): Fixed canvas resolution of 1280×720 pixels (16:9) with responsive CSS viewport scaling.
  - [REQ-4.1](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#4-core-game-mechanic): Discrete grid matrix with tick-based movement in cardinal directions.
  - [REQ-4.4](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#4-core-game-mechanic): Strict rejection of instantaneous 180° direction reversals.
- **User Stories:**
  - [US-003](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-003): Control the Hunter with keyboard input.
  - [US-019](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-019): Control Hunter via Mobile Virtual D-Pad.
- **Tasks:**
  - [TASK-001](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-001--scaffold-base-project-and-static-asset-structure): Scaffold base project and static asset structure.
  - [TASK-007](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-007--implement-inputhandler-module): Implement InputHandler for keyboard & touch D-Pad.
  - [TASK-014](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-014--build-main-gameloop-execution-engine): Build main GameLoop execution engine.

#### FEAT-02: Collision Detection & Death Resolution System
- **Requirements:**
  - [REQ-4.2](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#4-core-game-mechanic): Immediate session termination on wall boundary collision, self-collision, or hazard collision.
- **User Stories:**
  - [US-004](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-004): Detect and trigger game over on collision.
- **Tasks:**
  - [TASK-010](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-010--implement-collisiondetector-module): Implement CollisionDetector for walls, self, and hazards.

#### FEAT-03: Dynamic Target Spawning & Score Calculation Engine
- **Requirements:**
  - [REQ-4.3](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#4-core-game-mechanic): Target capture triggers target deletion, particle FX, score update, and tail growth.
  - [REQ-5.4](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#5-level-structure): Target pool bounds configured via `total_level_targets` and `max_simultaneous_targets`.
  - [REQ-6.1](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#6-target-value--display): Weighted formula target value calculation (`(interpol * 40) + (fbi * 35) + (conviction * 25)`).
  - [REQ-6.2](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#6-target-value--display): Linear time countdown bonus model (`max(0, Max_Level_Time - time) * weight`).
- **User Stories:**
  - [US-005](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-005): Capture a target by overlapping its cell.
  - [US-006](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-006): Grow the Hunter after a capture.
  - [US-009](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-009): Spawn targets within level constraints.
  - [US-011](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-011): Calculate the level score with time bonus.
  - [US-012](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-012): Accumulate the final session score.
- **Tasks:**
  - [TASK-008](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-008--implement-gridstate-module): Implement GridState position & tail growth logic.
  - [TASK-009](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-009--implement-targetmanager-spawning-algorithm): Implement TargetManager random spawning algorithm.
  - [TASK-012](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-012--implement-scoremanager-module): Implement ScoreManager for formula calculation & tactical multipliers.

#### FEAT-04: Level Progression & Grid Reset Lifecycle
- **Requirements:**
  - [REQ-5.1](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#5-level-structure): Automatic level advancement when target capture quota is reached.
  - [REQ-5.2](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#5-level-structure): Maintain total body length across level transitions.
  - [REQ-5.3](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#5-level-structure): Reset Hunter head to grid center `(X_mid, Y_mid)` with tail extending leftwards.
- **User Stories:**
  - [US-007](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-007): Progress to the next level automatically.
  - [US-008](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-008): Reset Hunter position at level start.
- **Tasks:**
  - [TASK-004](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-004--define-criminalrecord-and-hunterentity-data-structures): Define CriminalRecord and HunterEntity structures.
  - [TASK-013](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-013--implement-levelmanager-module): Implement LevelManager progression engine.

#### FEAT-05: Retro Cyberpunk Visuals, HUD & Audio FX Framework
- **Requirements:**
  - [REQ-6.3](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#6-target-value--display): Cyberpunk aesthetic with canvas glow, particle floating text, and HUD overlay.
- **User Stories:**
  - [US-010](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-010): Display target avatar and point value on-grid.
  - [US-021](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-021): Experience cyberpunk glowing visuals & particle FX.
- **Tasks:**
  - [TASK-006](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-006--create-renderer-stub-and-canvas-setup): Create Renderer stub and Canvas setup.
  - [TASK-015](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-015--implement-canvas-renderer-visuals-crt-glow-and-particle-fx): Implement Canvas Renderer visuals & particle FX.
  - [TASK-016](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-016--implement-start-screen-game-over-hud-overlay-and-ui-modal-flows): Implement Start Screen & Game Over HUD modal.
  - [TASK-021](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-021--add-web-audio-api-retro-sound-effects-and-background-track): Add Web Audio API retro sound effects and music.

---

### Goal 2 (BG-2): Resilient Platform Accessibility & Dynamic Administrative Data Management
> **Objective:** Enable seamless play on desktop and mobile web browsers with 100% offline resilience, and allow non-technical administrators to dynamically update target definitions via external cloud spreadsheets (Google Sheets).

#### FEAT-06: Remote Registry Hydration & Resilient Offline Fallback
- **Requirements:**
  - [REQ-1.3](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#1-platform): Offline play support via client caching and local fallback data.
  - [REQ-3.1](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#3-criminal-registry--play-data): Fetch Google Sheets CSV with 5s timeout, falling back to `data/fallback_registry.json`.
  - [REQ-3.3](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#3-criminal-registry--play-data): Strict target schema validation (`Name`, `Avatar_Asset_Path`, `Interpol_Red_Notice`, `FBI_Most_Wanted`, `Conviction_Status`).
  - [REQ-3.4](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#3-criminal-registry--play-data): Restrict criminal record to max 1 capture per session.
  - [REQ-3.5](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#3-criminal-registry--play-data): Remote sheet modifications take effect on next game launch/reset.
- **User Stories:**
  - [US-001](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-001): Load criminal registry at launch.
  - [US-002](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-002): Fall back to local registry when offline.
  - [US-013](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-013): Restrict each criminal record to one capture per session.
  - [US-014](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-014): Admin updates registry between sessions.
- **Tasks:**
  - [TASK-003](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-003--create-fallback-registry-json-data): Create fallback registry JSON data.
  - [TASK-005](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-005--create-registryservice-stub-and-interface): Create RegistryService stub and interface.
  - [TASK-011](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-011--wire-registryservice-to-live-google-sheets-csv-endpoint): Wire RegistryService to live Google Sheets endpoint with 5s timeout.
  - [TASK-017](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-017--integration-test-end-to-end-game-lifecycle): Integration test end-to-end game lifecycle.

#### FEAT-07: Responsive Multi-Platform Controls & Touch UI System
- **Requirements:**
  - [REQ-2.1](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#2-actors--roles): Keyboard arrows/WASD for desktop; touch Virtual D-Pad for mobile.
- **User Stories:**
  - [US-003](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-003): Control Hunter with keyboard.
  - [US-019](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-019): Control Hunter via Mobile Virtual D-Pad.
- **Tasks:**
  - [TASK-007](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-007--implement-inputhandler-module): Implement InputHandler module.
  - [TASK-019](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-019--bind-touch-virtual-d-pad-events-to-inputhandler): Bind Touch Virtual D-Pad events to InputHandler.

#### FEAT-08: Legal Compliance & Asset Deployment Gate
- **Requirements:**
  - [REQ-3.2](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#3-criminal-registry--play-data): Synthetic data & fictionalized artwork for public releases.
- **User Stories:**
  - [US-015](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-015): Enforce legal content gate before public deployment.
- **Tasks:**
  - [TASK-002](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-002--implement-legal-compliance-manual-check-gate): Implement legal compliance manual check gate in deployment pipeline.

---

### Goal 3 (BG-3): Feature Diversity, Tactical Depth & Competitive Retention
> **Objective:** Drive long-term player retention through selectable game modes (Criminal Hunt vs. Treasure Vault), tactical attack inventory systems with score multipliers, dynamic multi-hazard enemies (Crime Boss, Police Patrol, Death Reaper), and cloud-synced leaderboards (Firebase + LocalStorage).

#### FEAT-09: Multi-Mode Gameplay Engine
- **Requirements:**
  - [REQ-7.1](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#7-game-modes--hazards): Selectable gameplay modes (`mode1: Criminal Hunt`, `mode2: Treasure Vault`, `mode3: Custom`).
- **User Stories:**
  - [US-018](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-018): Select game mode on start screen.
- **Tasks:**
  - [TASK-018](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-018--implement-mode-selection-ui-and-registryservice-mode-switcher): Implement Mode Selection UI and RegistryService mode switcher.

#### FEAT-10: Multi-Hazard Roaming Enemies
- **Requirements:**
  - [REQ-7.2](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#7-game-modes--hazards): Dynamic roaming hazards (Crime Boss, Police Patrol, Death Reaper) with custom spatial movement patterns.
- **User Stories:**
  - [US-020](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-020): Avoid roaming Criminal Big Boss / hazard figures.
- **Tasks:**
  - [TASK-020](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-020--implement-hazard-entities-movement--collision): Implement Hazard entities movement & collision logic.

#### FEAT-11: Tactical Attack Inventory & Score Multiplier System
- **Requirements:**
  - [REQ-7.3](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#7-game-modes--hazards): Inventory of selectable tactical attacks (Police Custody, SWAT Raid, Interpol Warrant, Asset Seizure) consuming charges to apply multipliers (1.0x - 3.0x).
- **User Stories:**
  - [US-022](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-022): Use tactical attack inventory for score multipliers.
- **Tasks:**
  - [TASK-012](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-012--implement-scoremanager-module): Implement ScoreManager module.
  - [TASK-022](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-022--build-attackmanager-inventory-ui--tactical-punishment-multiplier-system): Build AttackManager inventory UI & tactical multiplier system.

#### FEAT-12: Player Profiles & Firebase Cloud Leaderboards
- **Requirements:**
  - [REQ-8.1](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#8-persistence--leaderboard): Player profile management.
  - [REQ-8.2](file:///c:/Activities/Projects/viper-hunt/docs/01-requirements.md#8-persistence--leaderboard): Firebase Firestore cloud leaderboard sync with automatic `localStorage` fallback.
- **User Stories:**
  - [US-023](file:///c:/Activities/Projects/viper-hunt/docs/02-user-stories.md#us-023): Persist profiles & high scores to cloud/local storage.
- **Tasks:**
  - [TASK-023](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-023--integrate-firebase-firestore-service--localstorage-fallback): Integrate Firebase Firestore service & LocalStorage fallback.
  - [TASK-024](file:///c:/Activities/Projects/viper-hunt/docs/04-tasks.md#task-024--perform-final-automated-unit-testing-suite): Perform final automated unit testing suite across all services.

---

## 4. End-to-End Traceability Matrix

| Feature ID | Feature Name | Parent Goal | Linked Requirements | Linked User Stories | Developer Tasks |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FEAT-01** | Grid Matrix & Physics Engine | BG-1 | REQ-1.1, REQ-1.2, REQ-4.1, REQ-4.4 | US-003, US-019 | TASK-001, TASK-007, TASK-014 |
| **FEAT-02** | Collision & Death Resolution | BG-1 | REQ-4.2 | US-004 | TASK-010 |
| **FEAT-03** | Target Spawning & Scoring | BG-1 | REQ-4.3, REQ-5.4, REQ-6.1, REQ-6.2 | US-005, US-006, US-009, US-011, US-012 | TASK-008, TASK-009, TASK-012 |
| **FEAT-04** | Level Progression & Reset | BG-1 | REQ-5.1, REQ-5.2, REQ-5.3 | US-007, US-008 | TASK-004, TASK-013 |
| **FEAT-05** | Retro Visuals, HUD & Audio | BG-1 | REQ-6.3 | US-010, US-021 | TASK-006, TASK-015, TASK-016, TASK-021 |
| **FEAT-06** | Remote Registry & Fallback | BG-2 | REQ-1.3, REQ-3.1, REQ-3.3, REQ-3.4, REQ-3.5 | US-001, US-002, US-013, US-014 | TASK-003, TASK-005, TASK-011, TASK-017 |
| **FEAT-07** | Responsive Multi-Platform UI | BG-2 | REQ-2.1 | US-003, US-019 | TASK-007, TASK-019 |
| **FEAT-08** | Legal Compliance Gate | BG-2 | REQ-3.2 | US-015 | TASK-002 |
| **FEAT-09** | Multi-Mode Gameplay Engine | BG-3 | REQ-7.1 | US-018 | TASK-018 |
| **FEAT-10** | Multi-Hazard Roaming Enemies | BG-3 | REQ-7.2 | US-020 | TASK-020 |
| **FEAT-11** | Tactical Attack & Multipliers | BG-3 | REQ-7.3 | US-022 | TASK-012, TASK-022 |
| **FEAT-12** | Cloud Sync & Leaderboards | BG-3 | REQ-8.1, REQ-8.2 | US-023 | TASK-023, TASK-024 |

---

## 5. Technical Lead "Break One Feature" Drill Deep Dive

When leading sprint planning or backlog refinement, a Tech Lead takes a **Feature** and breaks it down into implementable components:

### Feature Breakdown Example: `FEAT-11: Tactical Attack Inventory & Score Multiplier System`

```
FEAT-11: Tactical Attack & Multipliers
│
├── 1. Data Models & Constants
│   └── Define DEFAULT_ATTACK_TYPES (id, name, pastAction, icon, multiplier, uses, color)
│
├── 2. Inventory & Selection Management
│   └── Build AttackManager class (selectAttack, getActiveAttack, consumeActiveAttack)
│   └── Handle fallback to default infinite attack when charges reach 0
│
├── 3. UI Component & Event Listeners
│   └── Render attack selector buttons on HUD
│   └── Bind keyboard hotkeys (1-4) & click events to select attack type
│
├── 4. Score Integration
│   └── Multiply target base point value by active attack multiplier in ScoreManager
│   └── Emit floating particle text showing action phrase (e.g., "SWAT RAIDED! +300 PTS (2.0x)")
│
└── 5. Verification & Tests
    └── Unit test inventory charge depletion and multiplier application (ScoreManager.test.js)
```

This breakdown technique ensures developers receive clear, unambiguous tasks with well-defined boundaries and testable acceptance conditions.
