import { MILESTONES, SKILLS } from '../data/career';
import { Sfx, type SoundName } from './audio';
import { Input } from './input';
import { LEVEL_ROWS, T, TILE, parseLevel, type Level } from './level';
import { buildSprites, type Sprite, type Sprites } from './sprites';

export const VIEW_W = 320;
export const VIEW_H = LEVEL_ROWS * TILE;
export const GAME_FONT = '8px "Press Start 2P"';
const FONT = `${GAME_FONT}, monospace`;

const STEP = 1000 / 60;
const GRAVITY = 0.35;
const MAX_FALL = 6.5;
const ACCEL = 0.22;
const DECEL = 0.3;
const AIR_DECEL = 0.08;
const RUN = 2.0;
const FAST_RUN = 2.8;
const JUMP_V = -6.1;
const DOUBLE_JUMP_V = -5.2;
const JUMP_CUT = -2.5;
const STOMP_BOUNCE = -4.5;
const COYOTE = 6;
const JUMP_BUFFER = 6;
const MAGNET_RANGE = 72;

// Abilities are looked up by icon so SKILLS can be reordered freely.
const skillIndex = (icon: string) => SKILLS.findIndex((s) => s.icon === icon);
const SKILL = {
  double: skillIndex('double'),
  speed: skillIndex('bolt'),
  shield: skillIndex('shield'),
  magnet: skillIndex('magnet'),
};

export interface Stats {
  deals: number;
  totalDeals: number;
  skills: number;
  setbacks: number;
  seconds: number;
}

export interface GameHooks {
  onSkill: (index: number) => void;
  onFinish: (stats: Stats) => void;
  onPauseChange: (paused: boolean) => void;
}

export type GameState = 'ready' | 'playing' | 'paused' | 'finished';

interface Rect { x: number; y: number; w: number; h: number }
interface Body extends Rect { vx: number; vy: number }

interface Player extends Body {
  onGround: boolean;
  facing: 1 | -1;
  coyote: number;
  jumpBuf: number;
  airJumps: number;
  invuln: number;
  respawn: number;
  anim: number;
}

interface Enemy extends Body {
  kind: 'walker' | 'flyer';
  alive: boolean;
  squash: number;
  t: number;
  homeX: number;
  homeY: number;
  awake: boolean;
  onGround: boolean;
}

interface Pickup extends Body { skill: number; rise: number; tileIndex: number }
interface Coin extends Rect { taken: boolean }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }
interface Popup { x: number; y: number; text: string; life: number; color: string }
interface Bump { tx: number; ty: number; t: number }

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) =>
    Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

function wrap(text: string, maxChars: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Game {
  readonly input = new Input();
  state: GameState = 'ready';

  private readonly ctx: CanvasRenderingContext2D;
  private readonly sprites: Sprites;
  private readonly level: Level;
  private readonly sfx = new Sfx();
  private readonly hooks: GameHooks;
  private readonly badges: Sprite[];
  private readonly scenery: {
    clouds: { x: number; y: number; w: number }[];
    buildings: { x: number; w: number; h: number; lit: boolean }[];
    hills: { x: number; r: number }[];
  };

  private tiles!: Uint8Array;
  private player!: Player;
  private enemies: Enemy[] = [];
  private coins: Coin[] = [];
  private pickups: Pickup[] = [];
  private particles: Particle[] = [];
  private popups: Popup[] = [];
  private bumps: Bump[] = [];
  private skills: boolean[] = [];
  private shield = false;
  private deals = 0;
  private setbacks = 0;
  private frames = 0;
  private tick = 0;
  private cam = 0;
  private checkpoint = { x: 0, y: 0 };
  private activeSign = -1;
  private zone = -1;
  private zoneBanner = 0;
  private finishing = 0;
  private modal = false;

  private raf = 0;
  private last = 0;
  private acc = 0;

  constructor(canvas: HTMLCanvasElement, hooks: GameHooks) {
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.hooks = hooks;
    this.sprites = buildSprites();
    this.badges = SKILLS.map((s) => this.sprites.badge(s.color, s.icon));
    this.level = parseLevel(SKILLS.length);

    const rand = rng(42);
    const worldW = this.level.cols * TILE;
    this.scenery = { clouds: [], buildings: [], hills: [] };
    for (let x = 0; x < worldW * 0.2 + VIEW_W; x += 60 + rand() * 80)
      this.scenery.clouds.push({ x, y: 14 + rand() * 40, w: 18 + rand() * 22 });
    for (let x = 0; x < worldW * 0.35 + VIEW_W; ) {
      const w = 18 + Math.floor(rand() * 26);
      this.scenery.buildings.push({ x, w, h: 30 + Math.floor(rand() * 60), lit: rand() > 0.4 });
      x += w + 2 + Math.floor(rand() * 10);
    }
    for (let x = 0; x < worldW * 0.6 + VIEW_W; x += 70 + rand() * 90)
      this.scenery.hills.push({ x, r: 30 + rand() * 40 });

    this.reset();
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.raf = requestAnimationFrame(this.loop);
  }

  /* ---------- public controls ---------- */

  start() {
    this.sfx.unlock();
    this.input.reset();
    this.state = 'playing';
  }

  restart() {
    this.reset();
    this.start();
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.input.reset();
    this.hooks.onPauseChange(true);
  }

  resume() {
    if (this.state !== 'paused') return;
    this.modal = false;
    this.input.reset();
    this.state = 'playing';
    this.hooks.onPauseChange(false);
  }

  setMuted(muted: boolean) {
    this.sfx.muted = muted;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.sfx.close();
  }

  /* ---------- setup ---------- */

  private reset() {
    const L = this.level;
    this.tiles = L.tiles.slice();
    const sx = L.start.x * TILE + 3;
    const sy = L.start.y * TILE + 1;
    this.player = {
      x: sx, y: sy, w: 10, h: 15, vx: 0, vy: 0, onGround: false, facing: 1,
      coyote: 0, jumpBuf: 0, airJumps: 0, invuln: 0, respawn: 0, anim: 0,
    };
    this.checkpoint = { x: sx, y: sy };
    this.enemies = L.enemies.map(({ kind, tx, ty }) =>
      kind === 'walker'
        ? { kind, x: tx * TILE + 2, y: ty * TILE + 4, w: 12, h: 12, vx: -0.5, vy: 0,
            alive: true, squash: 0, t: 0, homeX: 0, homeY: 0, awake: false, onGround: false }
        : { kind, x: tx * TILE, y: ty * TILE + 3, w: 14, h: 9, vx: 0, vy: 0,
            alive: true, squash: 0, t: tx * 17, homeX: tx * TILE, homeY: ty * TILE + 3,
            awake: false, onGround: false },
    );
    this.coins = L.coins.map(({ tx, ty }) => ({ x: tx * TILE + 3, y: ty * TILE + 2, w: 10, h: 11, taken: false }));
    this.pickups = [];
    this.particles = [];
    this.popups = [];
    this.bumps = [];
    this.skills = SKILLS.map(() => false);
    this.shield = false;
    this.deals = 0;
    this.setbacks = 0;
    this.frames = 0;
    this.cam = 0;
    this.activeSign = -1;
    this.zone = -1;
    this.finishing = 0;
    this.modal = false;
    this.state = 'ready';
  }

  /* ---------- input ---------- */

  private onKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;

    if ((e.code === 'Escape' || e.code === 'KeyP') && !this.modal) {
      if (this.state === 'playing') this.pause();
      else if (this.state === 'paused') this.resume();
      return;
    }
    if (this.state !== 'playing') return;

    switch (e.code) {
      case 'ArrowLeft': case 'KeyA': this.input.left = true; break;
      case 'ArrowRight': case 'KeyD': this.input.right = true; break;
      case 'Space': case 'ArrowUp': case 'KeyW': case 'KeyZ':
        if (!e.repeat) this.input.pressJump();
        break;
      case 'ArrowDown': break;
      default: return;
    }
    e.preventDefault();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowLeft': case 'KeyA': this.input.left = false; break;
      case 'ArrowRight': case 'KeyD': this.input.right = false; break;
      case 'Space': case 'ArrowUp': case 'KeyW': case 'KeyZ': this.input.releaseJump(); break;
    }
  };

  private onBlur = () => this.input.reset();

  private onVisibility = () => {
    if (document.hidden) this.pause();
  };

  /* ---------- loop ---------- */

  private loop = (now: number) => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(now - (this.last || now), 100);
    this.last = now;
    this.acc += dt;
    while (this.acc >= STEP) {
      this.acc -= STEP;
      this.tick++;
      if (this.state === 'playing') this.update();
    }
    this.render();
  };

  private play(name: SoundName) {
    this.sfx.play(name);
  }

  /* ---------- tile helpers ---------- */

  private tileAt(tx: number, ty: number): number {
    if (tx < 0 || tx >= this.level.cols) return T.Ground;
    if (ty < 0 || ty >= LEVEL_ROWS) return T.Empty;
    return this.tiles[ty * this.level.cols + tx];
  }

  private isSolid(t: number) {
    return t === T.Ground || t === T.Block || t === T.Skill || t === T.Used;
  }

  /** Returns true if the body hit a wall. */
  private moveX(b: Body): boolean {
    b.x += b.vx;
    const top = Math.floor(b.y / TILE);
    const bottom = Math.floor((b.y + b.h - 0.01) / TILE);
    if (b.vx > 0) {
      const tx = Math.floor((b.x + b.w - 0.01) / TILE);
      for (let ty = top; ty <= bottom; ty++)
        if (this.isSolid(this.tileAt(tx, ty))) { b.x = tx * TILE - b.w; b.vx = 0; return true; }
    } else if (b.vx < 0) {
      const tx = Math.floor(b.x / TILE);
      for (let ty = top; ty <= bottom; ty++)
        if (this.isSolid(this.tileAt(tx, ty))) { b.x = (tx + 1) * TILE; b.vx = 0; return true; }
    }
    return false;
  }

  private moveY(b: Body): { landed: boolean; head: [number, number] | null } {
    const prevBottom = b.y + b.h;
    b.y += b.vy;
    const left = Math.floor(b.x / TILE);
    const right = Math.floor((b.x + b.w - 0.01) / TILE);
    if (b.vy > 0) {
      const ty = Math.floor((b.y + b.h - 0.01) / TILE);
      for (let tx = left; tx <= right; tx++) {
        const t = this.tileAt(tx, ty);
        if (this.isSolid(t) || (t === T.Platform && prevBottom <= ty * TILE + 0.01)) {
          b.y = ty * TILE - b.h;
          b.vy = 0;
          return { landed: true, head: null };
        }
      }
    } else if (b.vy < 0) {
      const ty = Math.floor(b.y / TILE);
      const cx = b.x + b.w / 2;
      let hit: [number, number] | null = null;
      for (let tx = left; tx <= right; tx++) {
        if (!this.isSolid(this.tileAt(tx, ty))) continue;
        if (!hit || Math.abs((tx + 0.5) * TILE - cx) < Math.abs((hit[0] + 0.5) * TILE - cx)) hit = [tx, ty];
      }
      if (hit) {
        b.y = (ty + 1) * TILE;
        b.vy = 0;
        return { landed: false, head: hit };
      }
    }
    return { landed: false, head: null };
  }

  /* ---------- update ---------- */

  private update() {
    this.frames++;
    const p = this.player;

    if (this.finishing > 0) {
      this.finishing--;
      p.vx = 1;
      p.facing = 1;
      p.vy = Math.min(p.vy + GRAVITY, MAX_FALL);
      this.moveX(p);
      p.onGround = this.moveY(p).landed;
      if (this.finishing % 12 === 0) this.firework();
      this.updateEffects();
      this.updateCamera();
      if (this.finishing === 0) {
        this.state = 'finished';
        this.hooks.onFinish({
          deals: this.deals,
          totalDeals: this.coins.length,
          skills: this.skills.filter(Boolean).length,
          setbacks: this.setbacks,
          seconds: Math.round(this.frames / 60),
        });
      }
      return;
    }

    if (p.respawn > 0) {
      if (--p.respawn === 0) this.respawn();
    } else {
      this.updatePlayer();
    }
    this.updateEnemies();
    this.updatePickups();
    this.updateCoins();
    this.updateEffects();
    this.updateCamera();
    this.updateZone();
  }

  private updatePlayer() {
    const p = this.player;
    const inp = this.input;

    const max = this.skills[SKILL.speed] ? FAST_RUN : RUN;
    const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (dir) {
      if (p.vx * dir < 0) p.vx += dir * DECEL;
      p.vx = clamp(p.vx + dir * ACCEL * (p.onGround ? 1 : 0.8), -max, max);
      p.facing = dir as 1 | -1;
    } else {
      const d = p.onGround ? DECEL : AIR_DECEL;
      p.vx = Math.abs(p.vx) <= d ? 0 : p.vx - Math.sign(p.vx) * d;
    }

    if (inp.consumeJump()) p.jumpBuf = JUMP_BUFFER;
    if (p.jumpBuf > 0) {
      if (p.onGround || p.coyote > 0) {
        p.vy = JUMP_V;
        p.onGround = false;
        p.coyote = 0;
        p.jumpBuf = 0;
        this.play('jump');
      } else if (this.skills[SKILL.double] && p.airJumps > 0) {
        p.vy = DOUBLE_JUMP_V;
        p.airJumps--;
        p.jumpBuf = 0;
        this.play('double');
        this.burst(p.x + p.w / 2, p.y + p.h, '#ffffff', 6, 1.2);
      } else {
        p.jumpBuf--;
      }
    }
    if (!inp.jumpHeld && p.vy < JUMP_CUT) p.vy = JUMP_CUT;
    p.vy = Math.min(p.vy + GRAVITY, MAX_FALL);

    this.moveX(p);
    const { landed, head } = this.moveY(p);
    if (landed) {
      p.onGround = true;
      p.coyote = COYOTE;
      p.airJumps = 1;
    } else {
      p.onGround = false;
      if (p.coyote > 0) p.coyote--;
    }
    if (head) this.hitBlock(head[0], head[1]);

    p.x = clamp(p.x, 0, this.level.cols * TILE - p.w);
    p.anim += Math.abs(p.vx);
    if (p.invuln > 0) p.invuln--;

    if (p.y > VIEW_H + 8) return this.setback();

    // Red tape: lower half of spike tiles hurts.
    const l = Math.floor((p.x + 2) / TILE), r = Math.floor((p.x + p.w - 2.01) / TILE);
    const t = Math.floor(p.y / TILE), b = Math.floor((p.y + p.h - 0.01) / TILE);
    for (let tx = l; tx <= r; tx++)
      for (let ty = t; ty <= b; ty++)
        if (this.tileAt(tx, ty) === T.Spike && p.y + p.h > ty * TILE + 9) return this.hurt();

    // Signposts are checkpoints.
    this.activeSign = -1;
    this.level.signs.forEach((s, i) => {
      if (Math.abs(p.x + p.w / 2 - (s.tx * TILE + 8)) < 22) {
        this.activeSign = i;
        this.checkpoint = { x: s.tx * TILE + 3, y: s.ty * TILE + 1 };
        if (this.skills[SKILL.shield] && !this.shield) {
          this.shield = true;
          this.play('appear');
        }
      }
    });

    if (p.x >= this.level.goalTx * TILE - 4) {
      this.finishing = 150;
      this.activeSign = -1;
      this.play('win');
      this.popup(p.x, p.y - 8, 'HIRED?', '#ffd23f');
    }
  }

  private hitBlock(tx: number, ty: number) {
    this.bumps.push({ tx, ty, t: 0 });
    const i = ty * this.level.cols + tx;
    const skill = this.level.skillBlocks.get(i);
    if (this.tiles[i] === T.Skill && skill !== undefined) {
      this.tiles[i] = T.Used;
      const away = this.player.x + this.player.w / 2 < tx * TILE + 8 ? 1 : -1;
      this.pickups.push({ x: tx * TILE + 1, y: ty * TILE + 1, w: 14, h: 14, vx: 0.8 * away, vy: 0, skill, rise: 15, tileIndex: i });
      this.play('appear');
    } else {
      this.play('bump');
    }
  }

  private updateEnemies() {
    const p = this.player;
    for (const e of this.enemies) {
      if (!e.alive) {
        if (e.squash > 0) e.squash--;
        continue;
      }
      if (!e.awake) {
        if (e.x < this.cam + VIEW_W + 24) e.awake = true;
        else continue;
      }
      e.t++;
      if (e.kind === 'walker') {
        const before = e.vx;
        if (this.moveX(e)) e.vx = -before;
        e.vy = Math.min(e.vy + GRAVITY, MAX_FALL);
        e.onGround = this.moveY(e).landed;
        if (e.onGround) {
          const fx = e.vx > 0 ? e.x + e.w + 1 : e.x - 1;
          const below = this.tileAt(Math.floor(fx / TILE), Math.floor((e.y + e.h + 1) / TILE));
          if (!this.isSolid(below) && below !== T.Platform) e.vx = -e.vx;
        }
        if (e.y > VIEW_H) e.alive = false;
      } else {
        const nx = e.homeX + Math.sin(e.t * 0.02) * 40;
        e.vx = nx - e.x;
        e.x = nx;
        e.y = e.homeY + Math.sin(e.t * 0.07) * 10;
      }

      if (p.respawn > 0 || !overlaps(p, e)) continue;
      const stomp = p.vy > 0 && p.y + p.h - p.vy <= e.y + 6;
      if (stomp) {
        e.alive = false;
        e.squash = 24;
        p.vy = this.input.jumpHeld ? JUMP_V * 0.95 : STOMP_BOUNCE;
        p.airJumps = 1;
        this.play('stomp');
        this.burst(e.x + e.w / 2, e.y + e.h / 2, e.kind === 'walker' ? '#e5484d' : '#ffffff', 8, 1.5);
        this.popup(e.x, e.y - 6, e.kind === 'walker' ? 'YES!' : 'DELETED', '#ffffff');
      } else if (p.invuln === 0) {
        this.hurt();
      }
    }
  }

  private updatePickups() {
    const p = this.player;
    this.pickups = this.pickups.filter((k) => {
      if (k.rise > 0) {
        k.rise--;
        k.y -= 1;
        return true;
      }
      const before = k.vx;
      if (this.moveX(k)) k.vx = -before;
      k.vy = Math.min(k.vy + GRAVITY, MAX_FALL);
      this.moveY(k);
      if (k.y > VIEW_H) {
        this.tiles[k.tileIndex] = T.Skill; // fell in a pit: re-arm the block
        return false;
      }
      if (p.respawn === 0 && overlaps(p, k)) {
        this.collectSkill(k.skill);
        return false;
      }
      return true;
    });
  }

  private collectSkill(i: number) {
    this.skills[i] = true;
    if (i === SKILL.shield) this.shield = true;
    this.play('power');
    const p = this.player;
    this.burst(p.x + p.w / 2, p.y + p.h / 2, SKILLS[i].color, 18, 2.2);
    this.popup(p.x - 12, p.y - 10, SKILLS[i].power.toUpperCase(), SKILLS[i].color);
    this.modal = true;
    this.state = 'paused';
    this.input.reset();
    this.hooks.onSkill(i);
  }

  private updateCoins() {
    const p = this.player;
    const magnet = this.skills[SKILL.magnet];
    const pcx = p.x + p.w / 2, pcy = p.y + p.h / 2;
    for (const c of this.coins) {
      if (c.taken) continue;
      if (magnet && p.respawn === 0) {
        const dx = pcx - (c.x + c.w / 2), dy = pcy - (c.y + c.h / 2);
        const d = Math.hypot(dx, dy);
        if (d < MAGNET_RANGE && d > 0) {
          c.x += (dx / d) * 3;
          c.y += (dy / d) * 3;
        }
      }
      if (p.respawn === 0 && overlaps(p, c)) {
        c.taken = true;
        this.deals++;
        this.play('coin');
        this.burst(c.x + 5, c.y + 5, '#ffd23f', 5, 1);
      }
    }
  }

  private updateEffects() {
    for (const q of this.particles) {
      q.x += q.vx;
      q.y += q.vy;
      q.vy += 0.12;
      q.life--;
    }
    this.particles = this.particles.filter((q) => q.life > 0);
    for (const q of this.popups) {
      q.y -= 0.5;
      q.life--;
    }
    this.popups = this.popups.filter((q) => q.life > 0);
    for (const b of this.bumps) b.t++;
    this.bumps = this.bumps.filter((b) => b.t < 8);
  }

  private updateCamera() {
    const p = this.player;
    const target = p.x + p.w / 2 - VIEW_W * 0.4;
    this.cam = clamp(target, 0, this.level.cols * TILE - VIEW_W);
  }

  private updateZone() {
    const x = this.player.x;
    let z = 0;
    this.level.zones.forEach((zone, i) => {
      if (x >= zone.x) z = i;
    });
    if (z !== this.zone) {
      this.zone = z;
      this.zoneBanner = 150;
    }
    if (this.zoneBanner > 0) this.zoneBanner--;
  }

  private hurt() {
    const p = this.player;
    if (p.invuln > 0 || p.respawn > 0) return;
    if (this.shield) {
      this.shield = false;
      p.invuln = 90;
      p.vy = -3;
      this.play('shield');
      this.burst(p.x + p.w / 2, p.y + p.h / 2, SKILLS[SKILL.shield].color, 12, 2);
      this.popup(p.x - 8, p.y - 8, 'BLOCKED', SKILLS[SKILL.shield].color);
      return;
    }
    this.setback();
  }

  private setback() {
    const p = this.player;
    if (p.respawn > 0) return;
    this.setbacks++;
    this.play('hurt');
    this.burst(p.x + p.w / 2, Math.min(p.y, VIEW_H - 8) + p.h / 2, '#2f6fd6', 14, 2);
    this.popup(p.x - 16, Math.min(p.y, VIEW_H - 24), 'SETBACK', '#e5484d');
    p.respawn = 50;
    p.vx = p.vy = 0;
  }

  private respawn() {
    const p = this.player;
    p.x = this.checkpoint.x;
    p.y = this.checkpoint.y;
    p.vx = p.vy = 0;
    p.invuln = 60;
    p.facing = 1;
    if (this.skills[SKILL.shield]) this.shield = true;
  }

  private burst(x: number, y: number, color: string, n: number, speed: number) {
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      this.particles.push({
        x, y, color, size: Math.random() > 0.5 ? 2 : 1,
        vx: Math.cos(a) * speed * (0.5 + Math.random()),
        vy: Math.sin(a) * speed * (0.5 + Math.random()) - 1,
        life: 20 + Math.floor(Math.random() * 15),
      });
    }
  }

  private firework() {
    const colors = SKILLS.map((s) => s.color).concat('#ffd23f');
    const x = this.cam + 40 + Math.random() * (VIEW_W - 80);
    const y = 20 + Math.random() * 50;
    this.burst(x, y, colors[Math.floor(Math.random() * colors.length)], 16, 2);
  }

  private popup(x: number, y: number, text: string, color: string) {
    this.popups.push({ x, y, text, life: 50, color });
  }

  /* ---------- render ---------- */

  private render() {
    const ctx = this.ctx;
    const cam = Math.round(this.cam);
    this.drawBackground(cam);

    ctx.save();
    ctx.translate(-cam, 0);
    this.drawTiles(cam);
    this.drawSigns();
    this.drawGoal();
    this.drawCoins();
    this.drawPickups();
    this.drawEnemies();
    this.drawPlayer();
    for (const q of this.particles) {
      ctx.fillStyle = q.color;
      ctx.fillRect(Math.round(q.x), Math.round(q.y), q.size, q.size);
    }
    for (const q of this.popups) this.text(q.text, Math.round(q.x), Math.round(q.y), q.color);
    ctx.restore();

    if (this.state !== 'ready') {
      this.drawSignDialog();
      this.drawZoneBanner();
      this.drawHud();
    }
  }

  private skyAt(x: number) {
    const zones = this.level.zones;
    for (let i = 1; i < zones.length; i++) {
      const edge = zones[i].x;
      if (x < edge - 96) return zones[i - 1].sky;
      if (x < edge + 96) return mix(zones[i - 1].sky, zones[i].sky, (x - (edge - 96)) / 192);
    }
    return zones[zones.length - 1].sky;
  }

  private drawBackground(cam: number) {
    const ctx = this.ctx;
    const sky = this.skyAt(cam + VIEW_W / 2);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const toHex = (c: string) => {
      if (c.startsWith('#')) return c;
      const [r, g, b] = c.match(/\d+/g)!.map(Number);
      return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
    };
    const skyHex = toHex(sky);

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const c of this.scenery.clouds) {
      const x = Math.round(c.x - cam * 0.2);
      if (x > VIEW_W || x + c.w < 0) continue;
      const y = Math.round(c.y);
      const w = Math.round(c.w);
      ctx.fillRect(x, y + 4, w, 6);
      ctx.fillRect(x + 4, y, w - 10, 5);
      ctx.fillRect(x + 8, y - 3, Math.round(w / 3), 4);
    }

    const cityColor = mix(skyHex, '#1d2440', 0.45);
    const windowColor = mix(skyHex, '#ffe9a8', 0.6);
    for (const b of this.scenery.buildings) {
      const x = Math.round(b.x - cam * 0.35);
      if (x > VIEW_W || x + b.w < 0) continue;
      const top = VIEW_H - 32 - b.h;
      ctx.fillStyle = cityColor;
      ctx.fillRect(x, top, b.w, b.h + 32);
      if (!b.lit) continue;
      ctx.fillStyle = windowColor;
      for (let wy = top + 4; wy < VIEW_H - 36; wy += 6)
        for (let wx = x + 3; wx < x + b.w - 3; wx += 5)
          if (((wx * 7 + wy * 13) & 7) > 2) ctx.fillRect(wx, wy, 2, 3);
    }

    ctx.fillStyle = mix(skyHex, '#2e8f52', 0.7);
    for (const h of this.scenery.hills) {
      const x = h.x - cam * 0.6;
      if (x - h.r > VIEW_W || x + h.r < 0) continue;
      ctx.beginPath();
      ctx.arc(Math.round(x), VIEW_H - 24, h.r, Math.PI, 0);
      ctx.fill();
    }
  }

  private drawTiles(cam: number) {
    const ctx = this.ctx;
    const s = this.sprites.tiles;
    const c0 = Math.floor(cam / TILE);
    const c1 = Math.min(this.level.cols - 1, c0 + Math.ceil(VIEW_W / TILE) + 1);
    for (let ty = 0; ty < LEVEL_ROWS; ty++) {
      for (let tx = c0; tx <= c1; tx++) {
        const t = this.tileAt(tx, ty);
        if (t === T.Empty) continue;
        let img: Sprite;
        switch (t) {
          case T.Ground: img = this.tileAt(tx, ty - 1) === T.Ground ? s.dirt : s.grass; break;
          case T.Block: img = s.block; break;
          case T.Skill: img = s.skill; break;
          case T.Used: img = s.used; break;
          case T.Platform: img = s.platform; break;
          default: img = s.spike;
        }
        const bump = this.bumps.find((b) => b.tx === tx && b.ty === ty);
        const dy = bump ? -Math.round(Math.sin((bump.t / 8) * Math.PI) * 4) : 0;
        ctx.drawImage(img, tx * TILE, ty * TILE + dy);
        if (t === T.Skill && this.tick % 60 < 8) {
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.fillRect(tx * TILE + 1, ty * TILE + 1 + dy, 14, 14);
        }
      }
    }
  }

  private drawSigns() {
    for (const s of this.level.signs) this.ctx.drawImage(this.sprites.sign, s.tx * TILE, s.ty * TILE);
  }

  private drawGoal() {
    const ctx = this.ctx;
    const x = this.level.goalTx * TILE + 7;
    const groundY = 9 * TILE;
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(x, 24, 2, groundY - 24);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(x - 1, 20, 4, 4);
    const wave = Math.round(Math.sin(this.tick * 0.1) * 1);
    ctx.fillStyle = '#3fbf6f';
    ctx.fillRect(x + 2, 26 + wave, 22, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 6, 30 + wave, 3, 6);
    ctx.fillRect(x + 6, 32 + wave, 7, 2);
    ctx.fillRect(x + 12, 30 + wave, 3, 6);
    ctx.fillRect(x + 17, 30 + wave, 3, 6);
    ctx.fillStyle = '#5c6378';
    ctx.fillRect(x - 4, groundY - 6, 10, 6);
  }

  private drawCoins() {
    const ctx = this.ctx;
    const img = this.sprites.coin;
    for (const [i, c] of this.coins.entries()) {
      if (c.taken) continue;
      const w = Math.max(2, Math.round(Math.abs(Math.cos(this.tick * 0.06 + i * 0.5)) * img.width));
      ctx.drawImage(img, Math.round(c.x + (img.width - w) / 2), Math.round(c.y), w, img.height);
    }
  }

  private drawPickups() {
    for (const k of this.pickups) {
      const bob = k.rise > 0 ? 0 : Math.round(Math.sin(this.tick * 0.2) * 1);
      this.ctx.drawImage(this.badges[k.skill], Math.round(k.x), Math.round(k.y) + bob);
    }
  }

  private drawEnemies() {
    const ctx = this.ctx;
    for (const e of this.enemies) {
      if (!e.alive && e.squash === 0) continue;
      const x = Math.round(e.x), y = Math.round(e.y);
      if (e.kind === 'walker') {
        const img = this.sprites.objection[Math.floor(e.t / 10) % 2];
        if (e.alive) ctx.drawImage(img, x - 1, y - 2);
        else ctx.drawImage(img, x - 1, y + e.h - 5, img.width, 5);
      } else {
        const frames = this.sprites.spam[Math.floor(e.t / 8) % 2];
        const img = e.vx < 0 ? frames.left : frames.right;
        if (e.alive) ctx.drawImage(img, x - 1, y - 1);
        else {
          ctx.globalAlpha = e.squash / 24;
          ctx.drawImage(img, x - 1, y - 1 + (24 - e.squash));
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  private drawPlayer() {
    const p = this.player;
    if (p.respawn > 0) return;
    if (p.invuln > 0 && Math.floor(p.invuln / 3) % 2 === 0) return;
    const f = this.sprites.player;
    const frame = !p.onGround
      ? f.jump
      : Math.abs(p.vx) > 0.3
        ? Math.floor(p.anim / 10) % 2 ? f.run1 : f.run2
        : f.stand;
    const img = p.facing === 1 ? frame.right : frame.left;
    const x = Math.round(p.x) - 1, y = Math.round(p.y) - 1;
    this.ctx.drawImage(img, x, y);

    if (this.shield) {
      const ctx = this.ctx;
      ctx.strokeStyle = SKILLS[SKILL.shield].color;
      ctx.globalAlpha = 0.5 + Math.sin(this.tick * 0.15) * 0.25;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 3.5, y - 3.5, 19, 23);
      ctx.globalAlpha = 1;
    }
  }

  private text(s: string, x: number, y: number, color = '#ffffff', align: CanvasTextAlign = 'left') {
    const ctx = this.ctx;
    ctx.font = FONT;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000000';
    ctx.fillText(s, x + 1, y + 1);
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
  }

  private drawHud() {
    const ctx = this.ctx;
    ctx.drawImage(this.sprites.coin, 4, 4);
    this.text(`x${this.deals}`, 17, 6);

    const start = Math.round((VIEW_W - (SKILLS.length * 16 - 2)) / 2);
    this.badges.forEach((b, i) => {
      ctx.globalAlpha = this.skills[i] ? 1 : 0.25;
      ctx.drawImage(b, start + i * 16, 3);
    });
    ctx.globalAlpha = 1;

    const zone = this.level.zones[Math.max(0, this.zone)];
    this.text(zone.name.toUpperCase(), VIEW_W - 4, 6, '#ffffff', 'right');
  }

  private drawSignDialog() {
    if (this.activeSign < 0 || this.finishing > 0) return;
    const ctx = this.ctx;
    const msg = MILESTONES[this.activeSign] ?? '';
    const lines = wrap(msg, 36);
    const h = lines.length * 11 + 10;
    const x = 8, y = 22, w = VIEW_W - 16;
    ctx.fillStyle = '#14142b';
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#1f1f3d';
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    lines.forEach((line, i) => this.text(line, x + 7, y + 6 + i * 11));
  }

  private drawZoneBanner() {
    if (this.zoneBanner <= 0 || this.activeSign >= 0) return;
    const zone = this.level.zones[this.zone];
    if (!zone) return;
    const alpha = Math.min(1, this.zoneBanner / 30);
    this.ctx.globalAlpha = alpha;
    this.text(`WORLD ${this.zone + 1}`, VIEW_W / 2, 48, '#ffd23f', 'center');
    this.text(zone.name.toUpperCase(), VIEW_W / 2, 62, '#ffffff', 'center');
    this.text(zone.role.toUpperCase(), VIEW_W / 2, 76, '#cfd3ff', 'center');
    this.ctx.globalAlpha = 1;
  }
}
