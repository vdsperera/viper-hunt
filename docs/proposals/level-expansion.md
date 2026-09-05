# Proposal: Meaningful Level Expansion (3 → 10 Levels)

_Created: 2026-08-25_
_Status: Approved — Implemented on feature/level-expansion branch_

---

## Problem

The game currently ends after 3 levels. The difficulty scaling is minimal — levels mainly differ by:
- **Target bounty values** (slightly higher each level)
- **Hazard composition** (Level 1: 1 Crime Boss → Level 2: +1 Police → Level 3: +Death Reaper)
- **Barricade count** (if enabled: `5 + level × 2`)

This means a player going from Level 2 to Level 3 barely notices a difference. We need **10 levels** where each one feels meaningfully harder and introduces something new.

## Current Difficulty Levers

| Lever | Where | Currently Used? |
|-------|-------|-----------------|
| Target bounty values | `levelTargetSpecs` in ConfigManager | ✅ 3 levels defined |
| Hazard types & count | `levelHazards` in ConfigManager | ✅ 3 levels defined |
| Barricade count | `spawnBarricades(level)` in GridState | ✅ Scales with level (behind feature flag) |
| Game speed (FPS) | `GameLoop.setSpeedMultiplier()` | ⚠️ Only used by StreakManager, not per-level |
| Boss aggressiveness | `bossRules` in GridState | ⚠️ Static, never changes per level |
| Boss move chance | `bossMoveChance` in ConfigManager | ⚠️ Static, never changes per level |
| Targets per level | `targetsPerLevel` | ⚠️ Static, same every level |
| Emotional questions (Mode 3) | `emotionalQuestions` | ✅ 3 defined |

## Level Progression Design (Mode 1 — Viper Bounty Hunter)

The core idea: **each level introduces or escalates exactly one new dimension** so the player always notices "something changed."

| Level | Name | Targets | Bounty Range | Hazards | Speed | Barricades | New Mechanic |
|-------|------|---------|-------------|---------|-------|------------|-------------|
| 1 | **First Hunt** | 5 | 20-100 | 1x Crime Boss | 1.0x | 7 | Tutorial pace |
| 2 | **Street Heat** | 5 | 30-100 | 1x Crime Boss + 1x Police | 1.0x | 9 | Police introduced |
| 3 | **Dead Zone** | 5 | 50-100 | 1x Crime Boss + 1x Police + 1x Reaper | 1.0x | 11 | Death Reaper introduced |
| 4 | **Double Trouble** | 6 | 40-120 | 2x Crime Boss + 1x Police + 1x Reaper | 1.1x | 13 | More targets + bosses; speed ramp starts |
| 5 | **Patrol Surge** | 6 | 50-130 | 2x Crime Boss + 2x Police + 1x Reaper | 1.15x | 15 | Extra police, tighter corridors |
| 6 | **Reaper's Domain** | 7 | 60-140 | 2x Crime Boss + 2x Police + 2x Reaper | 1.2x | 18 | Double reapers — nowhere is safe |
| 7 | **Grid Lock** | 7 | 60-150 | 2x Crime Boss + 2x Police + 2x Reaper | 1.25x | 22 | Barricade explosion — tight maze |
| 8 | **Full Alert** | 8 | 70-160 | 3x Crime Boss + 3x Police + 2x Reaper | 1.3x | 25 | Maximum heat — swarm of pursuers |
| 9 | **Death March** | 8 | 80-180 | 3x Crime Boss + 3x Police + 3x Reaper | 1.35x | 28 | Triple everything |
| 10 | **Final Judgment** | 10 | 100-200 | 4x Crime Boss + 4x Police + 3x Reaper | 1.4x | 30 | Endgame — max everything |

### Key Difficulty Dimensions Being Scaled

1. **Hazard count** — more enemies chasing the player per level
2. **Game speed** — tick rate multiplier increases from Level 4 onwards (1.0x to 1.4x)
3. **Barricade density** — playable grid area shrinks
4. **Target count** — more targets to collect = longer exposure time per level
5. **Bounty values** — higher reward makes risk/reward decisions more impactful

## Implementation Plan

### Files to Modify

#### ConfigManager.js
- `maxLevels: 3` → `maxLevels: 10`
- Expand `levelTargetSpecs` from 3 to 10 entries with escalating bounty values
- Expand `levelHazards` from 3 to 10 entries with escalating counts
- Expand `emotionalQuestions` (Mode 3) from 3 to 10 questions
- Add new config: `levelSpeedMultipliers` — array of `{ level, multiplier }` objects
- Add new config: `levelTargetCounts` — array of `{ level, count }` objects

#### LevelManager.js
- In `advanceLevel()`, read `levelSpeedMultipliers` and call `gameLoop.setSpeedMultiplier()`
- Read `levelTargetCounts` to override per-level target count

#### init-db.js
- Update Firestore seed: `maxLevels: 10`
- Expand `levelTargetSpecs` to 10 entries
- Add `levelSpeedMultipliers` and `levelTargetCounts` arrays

#### FirebaseService.js
- Parse two new config arrays (`levelSpeedMultipliers`, `levelTargetCounts`) from Firestore

## Open Decisions

- **Barricades**: Currently disabled by default. Should they be enabled to make Levels 7+ feel maze-like?
- **Level names**: Should thematic names be displayed in HUD during level transitions?
- **Mode 3 questions**: Should we auto-generate the 7 additional emotional questions, or will the author write them?
