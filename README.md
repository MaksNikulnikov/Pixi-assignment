
# Game Developer Assignment

This project implements three small PixiJS scenes as part of a technical assignment.  
Each task is accessible from an in-game menu.  
The app is written in **TypeScript**, uses **PixiJS v7** for rendering, and is responsive for both desktop and mobile.

---

## Tasks

### 1. “Ace of Shadows”
> Create 144 sprites (NOT graphic objects) that are stacked on top of each other like  
> cards in a deck. The top card must cover the bottom card, but not completely.  
> Every 1 second the top card should move to a different stack – the animation of the  
> movement should take 2 seconds.

**Implementation highlights:**
- 12 stacks arranged in a circular layout.  
- 144 card sprites scaled and positioned with small Y-offsets.  
- Top card moves to the next stack every second with a smooth arc animation (2s).  
- Uses tweening with easing for natural motion.

---

### 2. “Magic Words”
> Create a system that allows you to combine text and images like custom emojis.  
> Use it to render a dialogue between characters with the data taken from an  
> endpoint.

**Implementation highlights:**
- Dialogue bubbles rendered from fetched JSON data.  
- Supports inline emoji textures (`Texture.fromURL`).  
- Vertical scroll.  

---

### 3. “Phoenix Flame”
> Make a particle-effect demo showing a great fire effect. Keep the number of  
> images at max 10 sprites on the screen at the same time.

**Implementation highlights:**
- Reuses a small pool of 10 sprites with randomized velocity, alpha, and scale.  
- Additive blending for glowing flame effect.  
- Lightweight update loop (no new allocations).  

---

## Project structure

```
src/
├─ core/
│  ├─ AppGame.ts         # Main entry point (PIXI app, UI, fullscreen)
│  ├─ SceneManager.ts    # Switches scenes, handles onEnter/onExit
│  └─ Scene.ts           # IScene interface
│
├─ scenes/
│  ├─ BaseScene.ts       # Common layout, scaling, resize logic
│  ├─ MenuScene.ts       # Menu to open each demo
│  ├─ AceOfShadowsScene.ts
│  ├─ MagicWordsScene.ts
│  └─ PhoenixFlameScene.ts
│
├─ ui/                   # Buttons, FPS counter
├─ config/               # Game size, background colors
└─ services/             # Data fetch utilities
```

---

## Key design points

- **Modular architecture:** each scene is independent and implements `IScene`.  
- **No hard dependency on PIXI.Application:** scenes only expose a `Container` (`view`) that the manager adds to stage.  
- **Central SceneManager:** handles switching, cleanup, and resize forwarding.  
- **Responsive rendering:** unified scaling across devices.  
- **FPS counter** and **Fullscreen** button included by default.

---

## Tech stack

- **TypeScript**  
- **PixiJS v7**  
- **Vite** for bundling  

---

## Running locally

```bash
npm install
npm run dev
# open http://localhost:5173
```

To build for production:
```bash
npm run build
npm run preview
```

---

## Deployment

The project can be hosted on any static site provider (GitHub Pages, Netlify, Vercel, etc.).  
Build output is generated into `dist/`.

---

## Notes

Code emphasizes clarity and modularity rather than heavy abstraction.  
Each scene is self-contained and demonstrates a specific concept — animation, dialogue layout, or particles — while sharing a consistent rendering and UI framework.
