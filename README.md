# GTM Quest: Brodie Heginbotham's portfolio

An 8-bit platformer résumé. Play through my career (Durham, Rocket Lawyer, Make, ServiceTrade), collect deals, stomp objections and unlock skills as power-ups. Prefer reading? `/about` has the résumé and `/projects` the work.

Built with React, TypeScript and Vite. The game is a small hand-written canvas engine with no game library, procedural pixel art, and Web Audio chiptune sound effects.

## Develop

```bash
npm install
npm run dev
```

## Where things live

| What | File |
| --- | --- |
| Bio, experience, skills/power-ups, signpost text | `src/data/career.ts` |
| Projects page | `src/data/projects.ts` |
| Level layout (ASCII map per world, legend at the top) | `src/game/level.ts` |
| Physics, enemies, rendering | `src/game/Game.ts` |
| Sprites | `src/game/sprites.ts` |

In dev builds the running game is exposed as `window.__game` for debugging.
