import type { SkillIcon } from '../data/career';
import { TILE } from './level';

export type Sprite = HTMLCanvasElement;

type Palette = Record<string, string>;

function canvas(w: number, h: number): [Sprite, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

/** Rasterise a pixel-art string grid. '.' (or any char missing from the palette) is transparent. */
function pixels(rows: string[], pal: Palette): Sprite {
  const w = Math.max(...rows.map((r) => r.length));
  const [c, ctx] = canvas(w, rows.length);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = pal[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  });
  return c;
}

function flip(src: Sprite): Sprite {
  const [c, ctx] = canvas(src.width, src.height);
  ctx.scale(-1, 1);
  ctx.drawImage(src, -src.width, 0);
  return c;
}

/* ---------- Player: Brodie (12x16), facing right ---------- */
// Dressed like the headshot: tousled brown hair, beard, sage jacket over a white tee, jeans.

const PLAYER_PAL: Palette = {
  H: '#5b3a1e', h: '#7a5230', S: '#f2c29a', s: '#d9a07a', E: '#1f2a36',
  D: '#7a4a26', W: '#ffffff', J: '#9fb3a8', j: '#748a80', P: '#3b4a6b', K: '#4a2f1a',
};

const HEAD = [
  '....hHHh....',
  '..HHHHHHHh..',
  '..HHSSSSSH..',
  '..HSSESSES..',
  '..HSSSSSSS..',
  '..SDDDDDDS..',
  '...DWWWWD...',
  '....DDDD....',
  '..JJWWWWJJ..',
];
const ARMS_DOWN = ['.JJJjWWjJJJ.', '.SJJjWWjJJS.'];
const ARMS_UP = ['SJJJjWWjJJJS', '..JJjWWjJJ..'];

const LEGS = {
  stand: ['...PPPPPP...', '...PP..PP...', '...PP..PP...', '...PP..PP...', '..KKK..KKK..'],
  run1: ['...PPPPPP...', '..PPP..PPP..', '.PPP....PPP.', '.PP......PP.', 'KKK......KKK'],
  run2: ['...PPPPPP...', '....PPPP....', '....PPP.....', '....PPP.....', '....KKKK....'],
  jump: ['...PPPPPP...', '..PPP..PPP..', '..PP....PP..', '.KKK.....KK.', '............'],
};

/* ---------- Enemies ---------- */

const OBJECTION_PAL: Palette = { R: '#e5484d', K: '#2a0a0c', W: '#ffffff' };
const OBJECTION_BODY = [
  '....RRRRRR....',
  '..RRRRRRRRRR..',
  '.RRRRRRRRRRRR.',
  '.RKKRRRRRRKKR.',
  'RRRKKRRRRKKRRR',
  'RRWWKRRRRKWWRR',
  'RRWWWRRRRWWWRR',
  'RRRRRRRRRRRRRR',
  'RRRRKKKKKKRRRR',
  'RRRKRRRRRRKRRR',
  '.RRRRRRRRRRRR.',
  '..RRRRRRRRRR..',
];
const OBJECTION_FEET = [
  ['..KKK....KKK..', '.KKKK....KKKK.'],
  ['...KKK..KKK...', '...KKKK.KKKK..'],
];

const SPAM_PAL: Palette = { W: '#cfe8ff', E: '#fafafa', K: '#8a8a8a', R: '#e5484d' };
const SPAM = [
  [
    'WW............WW',
    'WWW..........WWW',
    '.WWWEEEEEEEEWWW.',
    '...EKEEEEEEKE...',
    '...EEKEEEEKEE...',
    '...EEEKEEKEEE...',
    '...EEEEKKEEEE...',
    '...EEEEERREEE...',
    '...EEEEEEEEEE...',
    '...KKKKKKKKKK...',
  ],
  [
    '................',
    '................',
    '...EEEEEEEEEE...',
    '...EKEEEEEEKE...',
    '...EEKEEEEKEE...',
    '...EEEKEEKEEE...',
    '.WWEEEEKKEEEEWW.',
    'WWWEEEEERREEEWWW',
    'WW.EEEEEEEEEE.WW',
    '...KKKKKKKKKK...',
  ],
];

/* ---------- Items ---------- */

const COIN = pixels(
  [
    '..YYYYYY..',
    '.YYYYYYYY.',
    'YYYYDYYYYO',
    'YYYDDDDYYO',
    'YYDYDYYYYO',
    'YYYDDDYYYO',
    'YYYYDYDYYO',
    'YYDDDDYYYO',
    'YYYYDYYYYO',
    '.YYYYYYYO.',
    '..OOOOOO..',
  ],
  { Y: '#ffd23f', D: '#b8860b', O: '#c98a00' },
);

const GLYPHS: Record<SkillIcon, string[]> = {
  double: ['...W...', '..W.W..', '.W...W.', '...W...', '..W.W..', '.W...W.', '.......'],
  bolt: ['....WW.', '...WW..', '..WWWW.', '...WW..', '..WW...', '.WW....', '.......'],
  magnet: ['.WW.WW.', '.WW.WW.', '.WW.WW.', '.WW.WW.', '.WWWWW.', '..WWW..', '.......'],
  shield: ['.WWWWW.', '.WWWWW.', '.WWWWW.', '.WWWWW.', '..WWW..', '...W...', '.......'],
};

function badge(color: string, icon: SkillIcon): Sprite {
  const [c, ctx] = canvas(14, 14);
  const ring = ['....XXXXXX....', '..XXXXXXXXXX..', '.XXXXXXXXXXXX.', '.XXXXXXXXXXXX.'];
  const shape = [...ring, ...Array(6).fill('XXXXXXXXXXXXXX'), ...ring.slice().reverse()];
  ctx.drawImage(pixels(shape, { X: '#14142b' }), 0, 0);
  ctx.drawImage(pixels(shape.slice(1, -1).map((r) => r.slice(1, -1)), { X: color }), 1, 1);
  ctx.drawImage(pixels(GLYPHS[icon], { W: '#ffffff' }), 4, 4);
  return c;
}

/* ---------- Tiles (procedural) ---------- */

function tile(draw: (ctx: CanvasRenderingContext2D) => void): Sprite {
  const [c, ctx] = canvas(TILE, TILE);
  draw(ctx);
  return c;
}

function speckle(ctx: CanvasRenderingContext2D, color: string, seed: number, count: number, y0 = 0) {
  ctx.fillStyle = color;
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    const x = s % TILE;
    s = (s * 9301 + 49297) % 233280;
    const y = y0 + (s % (TILE - y0));
    ctx.fillRect(x, y, 1, 1);
  }
}

const dirt = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(0, 0, TILE, TILE);
  speckle(ctx, '#6e4420', 7, 14);
  speckle(ctx, '#a06a36', 3, 8);
};

const TILES = {
  dirt: () => tile(dirt),
  grass: () =>
    tile((ctx) => {
      dirt(ctx);
      ctx.fillStyle = '#3fbf6f';
      ctx.fillRect(0, 0, TILE, 4);
      ctx.fillStyle = '#2e8f52';
      for (let x = 0; x < TILE; x += 3) ctx.fillRect(x, 4, 2, 1 + (x % 2));
      ctx.fillStyle = '#7be39b';
      ctx.fillRect(0, 0, TILE, 1);
    }),
  block: () =>
    tile((ctx) => {
      ctx.fillStyle = '#5c6378';
      ctx.fillRect(0, 0, TILE, TILE);
      ctx.fillStyle = '#7d859c';
      ctx.fillRect(1, 1, 14, 6);
      ctx.fillRect(1, 9, 6, 6);
      ctx.fillRect(9, 9, 6, 6);
      ctx.fillStyle = '#9aa3bb';
      ctx.fillRect(1, 1, 14, 1);
      ctx.fillRect(1, 9, 6, 1);
      ctx.fillRect(9, 9, 6, 1);
    }),
  skill: () =>
    tile((ctx) => {
      ctx.fillStyle = '#8a5a00';
      ctx.fillRect(0, 0, TILE, TILE);
      ctx.fillStyle = '#f5b800';
      ctx.fillRect(1, 1, 14, 14);
      ctx.fillStyle = '#ffe27a';
      ctx.fillRect(1, 1, 14, 1);
      ctx.fillRect(1, 1, 1, 14);
      ctx.fillStyle = '#8a5a00';
      for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) ctx.fillRect(x, y, 1, 1);
      // sparkle
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 4, 2, 8);
      ctx.fillRect(4, 7, 8, 2);
      ctx.fillRect(6, 6, 4, 4);
    }),
  used: () =>
    tile((ctx) => {
      ctx.fillStyle = '#4a3416';
      ctx.fillRect(0, 0, TILE, TILE);
      ctx.fillStyle = '#7a5a2a';
      ctx.fillRect(1, 1, 14, 14);
      ctx.fillStyle = '#4a3416';
      for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) ctx.fillRect(x, y, 1, 1);
    }),
  platform: () =>
    tile((ctx) => {
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(0, 0, TILE, 6);
      ctx.fillStyle = '#c08a4a';
      ctx.fillRect(0, 0, TILE, 4);
      ctx.fillStyle = '#e0b070';
      ctx.fillRect(0, 0, TILE, 1);
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(7, 0, 1, 4);
    }),
  spike: () =>
    tile((ctx) => {
      // "Red tape": striped barrier spikes
      const widths = [1, 1, 2, 2, 2, 3, 3, 4];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? '#ffffff' : '#e5484d';
        widths.forEach((w, h) => ctx.fillRect(i * 4 + Math.floor((4 - w) / 2), 8 + h, w, 1));
      }
      ctx.fillStyle = '#8a1c20';
      ctx.fillRect(0, 15, TILE, 1);
    }),
};

function sign(): Sprite {
  const [c, ctx] = canvas(16, 16);
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(7, 8, 2, 8);
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(1, 1, 14, 9);
  ctx.fillStyle = '#d9a35c';
  ctx.fillRect(2, 2, 12, 7);
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(4, 4, 8, 1);
  ctx.fillRect(4, 6, 6, 1);
  return c;
}

export function buildSprites() {
  const player = (legs: string[], arms = ARMS_DOWN) => {
    const right = pixels([...HEAD, ...arms, ...legs], PLAYER_PAL);
    return { right, left: flip(right) };
  };
  const objection = OBJECTION_FEET.map((feet) => pixels([...OBJECTION_BODY, ...feet], OBJECTION_PAL));
  const spam = SPAM.map((rows) => pixels(rows, SPAM_PAL));
  return {
    player: {
      stand: player(LEGS.stand),
      run1: player(LEGS.run1),
      run2: player(LEGS.run2),
      jump: player(LEGS.jump, ARMS_UP),
    },
    objection,
    spam: spam.map((s) => ({ right: s, left: flip(s) })),
    coin: COIN,
    badge,
    sign: sign(),
    tiles: {
      dirt: TILES.dirt(),
      grass: TILES.grass(),
      block: TILES.block(),
      skill: TILES.skill(),
      used: TILES.used(),
      platform: TILES.platform(),
      spike: TILES.spike(),
    },
  };
}

export type Sprites = ReturnType<typeof buildSprites>;
