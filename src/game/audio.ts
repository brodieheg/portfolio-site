interface Tone {
  f0: number;
  f1: number;
  dur: number;
  type: OscillatorType;
  delay?: number;
}

const arp = (notes: number[], step: number, type: OscillatorType = 'square'): Tone[] =>
  notes.map((f, i) => ({ f0: f, f1: f, dur: step * 1.4, type, delay: i * step }));

const SOUNDS = {
  jump: [{ f0: 300, f1: 640, dur: 0.12, type: 'square' }],
  double: [{ f0: 520, f1: 980, dur: 0.1, type: 'square' }],
  coin: arp([988, 1319], 0.06),
  stomp: [{ f0: 320, f1: 60, dur: 0.12, type: 'square' }],
  bump: [{ f0: 150, f1: 90, dur: 0.08, type: 'triangle' }],
  appear: arp([392, 523, 659], 0.05, 'triangle'),
  power: arp([523, 659, 784, 1047, 1319, 1568], 0.06),
  hurt: [{ f0: 520, f1: 70, dur: 0.45, type: 'sawtooth' }],
  shield: [{ f0: 880, f1: 220, dur: 0.22, type: 'triangle' }],
  win: arp([523, 659, 784, 1047, 784, 1047, 1319], 0.11),
} satisfies Record<string, Tone[]>;

export type SoundName = keyof typeof SOUNDS;

/** Tiny chiptune synth: square/triangle blips via Web Audio, no asset files. */
export class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;

  /** Must be called from a user gesture before sounds will play. */
  unlock() {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return;
      }
    }
    void this.ctx.resume();
  }

  play(name: SoundName) {
    const ctx = this.ctx;
    if (this.muted || !ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    for (const t of SOUNDS[name] as Tone[]) {
      const start = now + (t.delay ?? 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = t.type;
      osc.frequency.setValueAtTime(t.f0, start);
      osc.frequency.exponentialRampToValueAtTime(t.f1, start + t.dur);
      gain.gain.setValueAtTime(0.06, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + t.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + t.dur + 0.02);
    }
  }

  close() {
    void this.ctx?.close();
    this.ctx = null;
  }
}
