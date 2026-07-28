# Getir Rush — Agent Guide

## Project Goal

Build **Getir Rush**, a fast, company-wide delivery roguelite inspired by Vampire Survivors. The game must be immediately understandable, fun in short work breaks, fair for leaderboard competition, and playable in a desktop browser without installation.

The current repository contains the first dependency-free Canvas vertical slice. Preserve a playable state after every meaningful change.

## Locked Product Decisions

- Each run lasts exactly **3 minutes of active gameplay**.
- Perk selection pauses gameplay and does not consume run time.
- The player controls one courier with WASD or arrow keys.
- Picking up orders and completing deliveries happen automatically by proximity.
- Traffic, rain, and environmental hazards deal damage.
- The run ends when health reaches zero or the 3-minute timer expires.
- Difficulty increases clearly every 30 seconds.
- The final 30 seconds are a high-intensity “Rush” wave.
- Level-ups present exactly three distinct random perk choices.
- A run should offer approximately 4–6 perk selections.
- The initial perk pool contains roughly 12 perks covering speed, defense, pickup range, healing, scoring, and hazard control.
- Scores reward deliveries, delivery streaks, and survival.
- The leaderboard is individual, with weekly and all-time views planned.
- Runs may be replayed without limits and use fresh randomness.
- Persistent progression may unlock cosmetics and side objectives, but must not grant ranked power.
- The tone is playful and fictional. Never connect game results to real employee or operational performance.
- The initial platform is single-player desktop web. Mobile and team leaderboards are out of scope unless explicitly requested.

## Experience Principles

- A new player must understand the basic loop within 30 seconds.
- Movement should feel responsive; automation should let the player focus on routing and dodging.
- The first perk must normally appear within 30–40 seconds.
- A meaningful build must emerge within one 3-minute run.
- No perk or build should become an obviously mandatory leaderboard choice.
- Failure should invite an immediate retry, not feel punitive.
- Prefer bold, readable UI and playful Getir-inspired purple/yellow styling. Any official brand asset or copy requires internal brand approval.

## Current Architecture

- `index.html`: application shell, HUD, overlays, leaderboard, and active-perk panel.
- `styles.css`: visual system and responsive desktop layout.
- `src/core.js`: pure game rules, perk definitions, scoring, timing, and difficulty progression.
- `src/game.js`: Canvas simulation, input, entities, collisions, and rendering.
- `src/app.js`: UI orchestration, player name, run lifecycle, and local leaderboard persistence.
- `test/core.test.js`: deterministic rule tests.
- `server.js`: minimal local static server.

Keep pure rules in `src/core.js`. Keep Canvas/game-loop concerns in `src/game.js`. Keep DOM and storage concerns in `src/app.js`. Avoid mixing these layers.

The prototype intentionally has no third-party runtime dependencies. Do not add a framework casually. A future production migration may use Phaser + TypeScript for gameplay and React for menus/profile/leaderboards, but only perform that migration when explicitly requested and when the full result can remain runnable.

## Data and Leaderboard Rules

Model completed runs with the following conceptual fields:

- player identifier and display name
- final score
- delivery count
- selected perks
- random seed
- active gameplay duration
- completion reason (`complete` or `energy`)
- completion timestamp

The current vertical slice stores mock scores in `localStorage`. Never present these as secure or authoritative. For a company beta:

- Introduce an OIDC-compatible authentication adapter; the specific SSO provider is not decided.
- Submit completed runs to a server and validate them before leaderboard insertion.
- Prevent duplicate run submissions with a unique run identifier/idempotency rule.
- Store authoritative profiles and runs in PostgreSQL.
- Keep weekly rankings separately queryable from all-time personal bests.
- Do not expose employee email addresses or internal identifiers on public leaderboard views.

## Engineering Rules

- Preserve the exact 180 seconds of active gameplay unless the product requirement changes.
- Use elapsed frame time, not frame counts, for timers and movement.
- Clamp unusually large frame deltas to prevent simulation jumps.
- Pause the simulation during perk selection and resume without consuming paused time.
- Keep scoring deterministic and covered by tests.
- Ensure a three-card perk offer contains no duplicates.
- Escape player-controlled names before rendering them into HTML.
- Keep controls keyboard-accessible, including perk choices via keys 1–3.
- Do not introduce real employee data, production SSO credentials, or secrets into the repository.
- Maintain Turkish player-facing copy unless localization is explicitly introduced.

## Verification

Run these checks after changes:

```bash
npm test
npm run check
```

For gameplay or UI changes, also run:

```bash
npm run dev
```

Then manually verify:

1. A run starts from the welcome screen and responds to WASD/arrows.
2. Orders are picked up and delivered automatically.
3. Damage, shields, healing, and run termination behave correctly.
4. Perk selection pauses the timer and accepts click or 1–3 input once only.
5. Difficulty rises every 30 seconds and Rush begins at 02:30 elapsed.
6. A surviving run ends at 03:00 active time.
7. The completed score is inserted once into the local leaderboard.
8. Restarting creates a clean run without leaking prior state or event handlers.

Add or update tests whenever changing scoring, difficulty thresholds, run timing, perk sampling, or persistence behavior.

## Definition of Done

A change is done only when the game remains runnable, automated checks pass, the locked product decisions remain intact, and the affected player flow has been manually verified where the environment permits. If browser or port access is restricted, report that limitation explicitly rather than claiming visual verification.
