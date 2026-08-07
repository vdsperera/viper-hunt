# Welcome to the viper-hunt wiki!

**Viper Hunt** is a dynamic, high-stakes 2D grid-based action game where you play as a rogue assassin hunting down a roster of wanted criminals. But every action has a consequence—brutally taking down targets will increase your Heat Level, drawing the attention of Police Patrols, rival Crime Bosses, and even the supernatural Death Reaper!

---

## 🎯 Gameplay Overview

The core loop combines classic grid-movement mechanics (think Snake) with tactical decision-making, dynamic risk-scaling, and an immersive narrative.

- **Hunt Targets**: Move across the grid to capture spawned criminals. Capturing a criminal adds them to your "tail", increasing your length and score.
- **Manage Risk**: Some captures can be resolved peacefully (handing them to the police) or brutally. Brutal takedowns yield more points but permanently increase the threat level for that match.
- **Evade Hazards**: As your Heat rises, AI-controlled hazards will spawn and actively hunt you.
  - 🚔 **Police Patrols**: Use A* pathfinding to predictively intercept your movement. Getting too close triggers a Squad Alert.
  - 🦹 **Crime Bosses**: Relentlessly track your head coordinate, pathfinding around obstacles.
  - 💀 **Death Reaper**: A supernatural stalker that follows your tail segment.

---

## 🕹️ Game Modes

### 1. 🩸 Criminal Bounty Mode (Mode 1)
The core experience. You are an assassin hunting down targets. When you capture a target, you must choose an attack style. 
Your alignment shifts based on your choices:
- **Lethal/Brutal**: High points, high risk. Spawns more Crime Bosses.
- **Non-Lethal/Handover**: Lower points, reduces Police Heat.

### 2. 🎭 Emotional Death Mode (Mode 3)
A narrative-driven mode powered by LLM integration. You are presented with moral dilemmas and emotional questions. Your answers dictate your path, the value of the targets on the board, and the ultimate outcome of the level.

---

## 🏗️ Architecture & Technical Design

Viper Hunt is built with a highly modular, decoupled architecture to ensure smooth gameplay and easy feature expansion.

### Core Modules
* **`App.js`**: The main bootstrapper and Dependency Injection container. It wires up all services and initiates the game.
* **`UIController.js`**: A dedicated class that handles all DOM manipulation, menus, HUD updates, and slideshows. The core game loop never touches the DOM directly.
* **`GameLoop.js`**: A 100% headless, fixed-timestep physics loop. It ensures the game runs at a consistent physical speed regardless of browser frame drops or lag.
* **`GridState.js`**: The single source of truth for the board, managing the Hunter's coordinates, active targets, and AI hazards.
* **`EventBus.js`**: A PubSub system that decouples services. For example, `GameLoop` emits a `TARGET_CAPTURED` event, and the `AudioService`, `ScoreManager`, and `LLMService` listen and react independently.
* **`LLMService.js`**: Integrates with Gemini AI to procedurally generate criminal confessions, quest text, and post-match news broadcasts based on the player's in-game actions.

---

## 🚀 Getting Started Locally

1. **Install Dependencies**: Make sure you have Node.js installed.
2. **Start the Server**: 
   ```bash
   npx http-server -p 8080
   ```
3. **Play**: Open your browser and navigate to `http://localhost:8080`.
4. **Testing**: Run the automated test suite with:
   ```bash
   npm test
   ```

---

## 🔮 Future Roadmap
* **Kill Streak Meter**: Gain temporary speed boosts or multipliers for chaining captures.
* **Black Market Gear**: Consumable drops that grant shields, EMP blasts, or temporary invisibility.
* **Hideout Barricades**: Criminals will dynamically place obstacles on the grid to block your path.
