export const TILE = 16;
export const LEVEL_ROWS = 11;

export const T = {
  Empty: 0,
  Ground: 1,
  Block: 2,
  Skill: 3,
  Used: 4,
  Platform: 5,
  Spike: 6,
} as const;

/*
 * Map legend (each zone is 11 rows; rows are padded with '.' so widths needn't match exactly)
 *   #  ground          B  solid block       ?  skill block (hands out SKILLS in order)
 *   =  one-way ledge   X  red tape (spikes) c  deal (coin)
 *   E  objection       F  spam email        S  signpost / checkpoint (MILESTONES in order)
 *   P  player start    G  goal flag
 *
 * Physics budget: a single jump clears ~3.4 tiles up and ~4.5 tiles across,
 * so keep required gaps <= 4 and required ledges <= 3 tiles above the floor.
 */
interface ZoneMap {
  name: string;
  role: string;
  sky: string;
  rows: string[];
}

const ZONE_MAPS: ZoneMap[] = [
  {
    name: 'Durham, NC',
    role: 'Where it all starts',
    sky: '#6fb4ff',
    rows: [
      '................................................',
      '................................................',
      '................................................',
      '................................................',
      '..............ccc.........cccc..................',
      '..............BBB...............................',
      '........................======..................',
      '......c.c.c.....................................',
      '..P.S..............E.............E.......E......',
      '#################################...############',
      '#################################...############',
    ],
  },
  {
    name: 'Rocket Lawyer',
    role: 'Enterprise SDR',
    sky: '#7ec8e3',
    rows: [
      '........................................................',
      '........................................................',
      '........................................................',
      '...........................ccc..........................',
      '........................................................',
      '..........B?B.............=====.........................',
      '.......................................F................',
      '..................====.............................c.c..',
      'S...........E..........E.......XX........B.......E......',
      '################...#####################################',
      '################...#####################################',
    ],
  },
  {
    name: 'Rocket Lawyer',
    role: 'Sales Ops & Enablement',
    sky: '#5aa9e6',
    rows: [
      '............................................................',
      '............................................................',
      '............................................................',
      '............................................................',
      '................................................cc..........',
      '......B?B..............................F.......=====........',
      '............................................................',
      '..............c.c.c.............====........................',
      'S.........E.........XX.....B..........B...E.........E.......',
      '##########################...######...######################',
      '##########################...######...######################',
    ],
  },
  {
    name: 'Make',
    role: 'SE Enablement',
    sky: '#f4a259',
    rows: [
      '..................................................',
      '..................................................',
      '..................................................',
      '...................cccc...........................',
      '..................................................',
      '........B?B......======...........................',
      '..................................F...............',
      '...c.c.c.c...........................c.c.c........',
      'S..............E..........XX...........E.....E....',
      '###################...############################',
      '###################...############################',
    ],
  },
  {
    name: 'ServiceTrade',
    role: 'GTM Engineer',
    sky: '#6a5acd',
    rows: [
      '..............................................................',
      '..............................................................',
      '..............................................................',
      '..............................................................',
      '..................................................BB..........',
      '.......B?B.......................................BBB..........',
      '..................F.............................BBBB..........',
      '..............................c.c.c............BBBBB..........',
      'S..........E.........E....XX..................BBBBBB......G...',
      '..............................................................'.replace(/\./g, '#'),
      '..............................................................'.replace(/\./g, '#'),
    ],
  },
];

export type EnemyKind = 'walker' | 'flyer';

export interface Level {
  cols: number;
  rows: number;
  tiles: Uint8Array;
  start: { x: number; y: number };
  enemies: { kind: EnemyKind; tx: number; ty: number }[];
  coins: { tx: number; ty: number }[];
  signs: { tx: number; ty: number }[];
  /** tile index -> skill index */
  skillBlocks: Map<number, number>;
  goalTx: number;
  zones: { name: string; role: string; sky: string; x: number }[];
}

export function parseLevel(skillCount: number): Level {
  const rows: string[] = Array(LEVEL_ROWS).fill('');
  const zones: Level['zones'] = [];
  for (const z of ZONE_MAPS) {
    const width = Math.max(...z.rows.map((r) => r.length));
    zones.push({ name: z.name, role: z.role, sky: z.sky, x: rows[0].length * TILE });
    for (let r = 0; r < LEVEL_ROWS; r++) rows[r] += (z.rows[r] ?? '').padEnd(width, '.');
  }

  const cols = rows[0].length;
  const level: Level = {
    cols,
    rows: LEVEL_ROWS,
    tiles: new Uint8Array(cols * LEVEL_ROWS),
    start: { x: 2, y: 8 },
    enemies: [],
    coins: [],
    signs: [],
    skillBlocks: new Map(),
    goalTx: cols - 2,
    zones,
  };

  // Column-major so signs and skill blocks are numbered left to right.
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < LEVEL_ROWS; r++) {
      const i = r * cols + c;
      switch (rows[r][c]) {
        case '#': level.tiles[i] = T.Ground; break;
        case 'B': level.tiles[i] = T.Block; break;
        case '=': level.tiles[i] = T.Platform; break;
        case 'X': level.tiles[i] = T.Spike; break;
        case '?':
          if (level.skillBlocks.size < skillCount) {
            level.skillBlocks.set(i, level.skillBlocks.size);
            level.tiles[i] = T.Skill;
          } else {
            level.tiles[i] = T.Block;
          }
          break;
        case 'c': level.coins.push({ tx: c, ty: r }); break;
        case 'E': level.enemies.push({ kind: 'walker', tx: c, ty: r }); break;
        case 'F': level.enemies.push({ kind: 'flyer', tx: c, ty: r }); break;
        case 'S': level.signs.push({ tx: c, ty: r }); break;
        case 'P': level.start = { x: c, y: r }; break;
        case 'G': level.goalTx = c; break;
      }
    }
  }
  return level;
}
