# Coffee-Break Mini-Game — Research & Concept Handoff Brief

> **Origin:** Transferred from `Website (rolanbacalla.space)` planning session (26 Nov 2026).  
> **Language Standard:** British English (`en-GB`) across all UI copy, labels, and documentation.  
> **Team Mode:** Antigravity (Manager / Executor / Auditor) + Local Ollama (`gemma4:12b` for UX/writing/ideation, `qwen3.8:27b` for code/architecture).

---

## 1. Core Goal
Create a **2-to-4-minute coffee-break browser game** that lets knowledge workers take a genuinely restorative short break away from daily work, with **zero onboarding friction**, **tactile sensory polish**, and a **clean, guilt-free stopping point**.

---

## 2. Psychology & Design Pillars
1. **Active Psychological Detachment** *(Effort-Recovery Model & COR Theory)*: Unlike passive scrolling (which leaves room for work rumination), a light interactive mechanic cleanly detaches attention from work stress.
2. **"Soft Fascination" Over Executive Fatigue** *(Attention Restoration Theory)*: Avoid punishing timers, deep strategy trees, or complex rules that tax the prefrontal cortex. Prioritise low cognitive friction and tactile feedback.
3. **Zero-Second Onboarding & The 1-Round Contract**: Visually self-explanatory within 3 seconds. Must conclude naturally around 2–4 minutes to prevent "tab anxiety" (avoid endless idle/roguelike loops).
4. **Daily Ritual & Micro-Accomplishments**: Deterministic daily seeded puzzles (based on `YYYY-MM-DD`) + `localStorage` streaks + spoiler-free share cards create a rewarding daily habit with **zero backend required**.

---

## 3. Target Tech Stack (Proven & Feasible)
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling:** Tailwind CSS v4
- **Motion & Tactile Juice:** Framer Motion 12 (spring physics, drag, `layoutId` snapping) + GSAP 3 (organic curves, timelines) + Lucide React
- **Native Browser APIs (Zero Extra Dependencies):**
  - **Web Audio API** — procedurally synthesised cosy audio (ceramic clicks, soft marimba chimes, filtered pink-noise pouring water; no external audio files needed)
  - **HTML5 Canvas 2D / SVG** — crisp 60fps micro-simulations, particles, or geometric boards
  - **Deterministic Daily Seeding + `localStorage`** — shared daily challenge + streaks without a database
- **Reference Visual Direction (from `rolanbacalla.space`):** Warm paper light (`#faf8f5`), soft canvas (`#eaecef`), deep slate dark (`#0f131a`), ink (`#10161c`), emerald accent (`#2ca884`), soft lavender (`#c8bfff`), DM Sans + Plus Jakarta Sans.

---

## 4. Five Curated Game Concepts

| # | Concept | Vibe & Genre | 3-Second Mechanic & Length | Restorative Benefit | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Loom & Latch** *(Recommended #1)* | Minimalist, tactile spatial puzzle | Drag, rotate, and magnetically snap geometric tiles into a compact daily grid (5×5) to satisfy visual alignment cues. **2–3 mins.** | **Order from chaos:** instant magnetic snap + closure triggers micro-accomplishment without verbal/analytical strain. | **Low–Medium** (React 19 + Framer Motion + Web Audio) |
| 2 | **Daily Pour** *(Runner-Up)* | Cosy, tactile coffee ritual | 3-step 90s pour-over ritual: grind, pour hot water in a steady spiral within the bloom ring, unlock a daily tasting card (e.g. *94% Extraction*). **2 mins.** | **Literal coffee break:** rhythmic motor focus + soothing kettle/ceramic procedural audio + natural finite finish. | **Medium** (Canvas/SVG + GSAP + Web Audio) |
| 3 | **Chroma Calm** | Editorial, design-led colour puzzle | Rearrange scrambled swatches (or blend pigment drops) to restore a harmonious daily gradient. **2–3 mins.** | **Left-to-right brain switch:** pulls users out of text/code into pure visual perception. | **Low** (React 19 + Framer Motion `layout` + Tailwind v4) |
| 4 | **Prism Pulse** | Ambient synesthetic audio-visual flow | Tap a dark canvas to emit light ripples that trigger pentatonic chimes on intersection (impossible to play a wrong note). **2–4 mins.** | **Active sensory detachment:** meditative audio-visual flow. | **Medium** (Canvas 2D + Web Audio pentatonic synth + GSAP) |
| 5 | **Cairn / Aether Drift** | Zen physics sandbox (no win/lose) | Gently drop and balance 5 smooth river stones (or swirl fluid particles) until equilibrium. **3 mins.** | **Pure Attention Restoration:** zero failure state, zero score anxiety. | **Medium–High** (Canvas 2D physics/fluid + Web Audio) |

---

## 5. Team Verdict
- **#1 Pick — Loom & Latch:** Strongest repeat workday habit (daily seeded puzzle + optional untimed Zen Mode), instant 2-second visual onboarding, highest polish-per-hour on Next.js + Framer Motion + Web Audio, and works identically on desktop mouse and mobile touch.
- **Runner-Up — Daily Pour:** Unforgettable literal coffee-break signature experience with rich tactile/audio charm and a natural 2-minute cap.

---

## 6. Next Steps (Pick Up Here in New Chat)
1. Confirm which concept to build first (**Loom & Latch**, **Daily Pour**, **Chroma Calm**, or a **multi-game Coffee Break hub** starting with one).
2. Scaffold the Next.js + Tailwind CSS v4 + Framer Motion + GSAP project in this folder.
3. Design the core game loop, deterministic daily seed generator, procedural Web Audio soundscape, and build the playable MVP.
