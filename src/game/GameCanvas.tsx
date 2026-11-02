import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { LINKEDIN_URL, SKILLS } from '../data/career';
import { GAME_FONT, Game, type Stats } from './Game';

type Phase = 'loading' | 'ready' | 'playing' | 'paused' | 'skill' | 'finished';

const MUTE_KEY = 'gtm-quest-muted';

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [skill, setSkill] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [muted, setMuted] = useState(readMuted);
  const mutedRef = useRef(muted);

  useEffect(() => {
    let cancelled = false;
    let game: Game | null = null;
    const fontReady = document.fonts?.load(GAME_FONT).catch(() => undefined) ?? Promise.resolve();
    void fontReady.then(() => {
      if (cancelled || !canvasRef.current) return;
      game = new Game(canvasRef.current, {
        onSkill: (i) => {
          setSkill(i);
          setPhase('skill');
        },
        onFinish: (s) => {
          setStats(s);
          setPhase('finished');
        },
        onPauseChange: (paused) => setPhase((p) => (p === 'skill' ? p : paused ? 'paused' : 'playing')),
      });
      game.setMuted(mutedRef.current);
      gameRef.current = game;
      if (import.meta.env.DEV) Object.assign(window, { __game: game });
      setPhase('ready');
    });
    return () => {
      cancelled = true;
      game?.destroy();
      gameRef.current = null;
    };
  }, []);

  const start = () => {
    gameRef.current?.start();
    setPhase('playing');
  };
  const restart = () => {
    gameRef.current?.restart();
    setStats(null);
    setPhase('playing');
  };
  const resume = () => {
    gameRef.current?.resume();
    setSkill(null);
    setPhase('playing');
  };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    gameRef.current?.setMuted(next);
    try {
      localStorage.setItem(MUTE_KEY, next ? '1' : '0');
    } catch {
      /* storage unavailable */
    }
  };

  // Touch buttons write straight into the game's input state.
  const hold = (key: 'left' | 'right' | 'jump', down: boolean) => (e: PointerEvent) => {
    e.preventDefault();
    const input = gameRef.current?.input;
    if (!input) return;
    if (key === 'jump') {
      if (down) input.pressJump();
      else input.releaseJump();
    } else {
      input[key] = down;
    }
  };
  const touchProps = (key: 'left' | 'right' | 'jump') => ({
    onPointerDown: hold(key, true),
    onPointerUp: hold(key, false),
    onPointerCancel: hold(key, false),
    onPointerLeave: hold(key, false),
    onContextMenu: (e: MouseEvent) => e.preventDefault(),
  });

  const activeSkill = skill !== null ? SKILLS[skill] : null;

  return (
    <div className="game">
      <div className="game-toolbar">
        <span className="game-hint">
          <kbd>←</kbd> <kbd>→</kbd> move · <kbd>Space</kbd> jump · <kbd>Esc</kbd> pause
        </span>
        <div className="game-toolbar-buttons">
          {(phase === 'playing' || phase === 'paused') && (
            <button
              type="button"
              className="icon-btn"
              onClick={() => (phase === 'playing' ? gameRef.current?.pause() : resume())}
              aria-label={phase === 'playing' ? 'Pause' : 'Resume'}
            >
              {phase === 'playing' ? 'II' : '▶'}
            </button>
          )}
          <button type="button" className="icon-btn" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted ? '♪̸' : '♪'}
          </button>
        </div>
      </div>

      <div className="stage">
        <canvas ref={canvasRef} className="stage-canvas" aria-label="GTM Quest: a platformer through Brodie's career" />

        {phase === 'loading' && <div className="stage-overlay">LOADING…</div>}

        {phase === 'ready' && (
          <div className="stage-overlay">
            <p className="overlay-kicker">Brodie Heginbotham presents</p>
            <h2 className="overlay-title">GTM QUEST</h2>
            <p className="overlay-sub">Run through my career. Collect deals, stomp objections, unlock skills.</p>
            <button type="button" className="pixel-btn" onClick={start} autoFocus>
              ▶ Press start
            </button>
          </div>
        )}

        {phase === 'paused' && (
          <div className="stage-overlay">
            <h2 className="overlay-title">PAUSED</h2>
            <div className="overlay-actions">
              <button type="button" className="pixel-btn" onClick={resume} autoFocus>Resume</button>
              <button type="button" className="pixel-btn pixel-btn-ghost" onClick={restart}>Restart</button>
            </div>
          </div>
        )}
      </div>

      <div className="touch-controls" aria-hidden="true">
        <div className="touch-dpad">
          <button type="button" className="touch-btn" {...touchProps('left')}>◀</button>
          <button type="button" className="touch-btn" {...touchProps('right')}>▶</button>
        </div>
        <button type="button" className="touch-btn touch-jump" {...touchProps('jump')}>JUMP</button>
      </div>

      {phase === 'skill' && activeSkill && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="skill-title">
          <div className="modal" style={{ '--skill': activeSkill.color } as CSSProperties}>
            <p className="overlay-kicker">Skill unlocked {skill! + 1}/{SKILLS.length}</p>
            <h2 id="skill-title" className="modal-title">{activeSkill.name}</h2>
            <p className="modal-power">
              <span className="power-chip">{activeSkill.power}</span> {activeSkill.powerDesc}
            </p>
            <p className="modal-body">{activeSkill.summary}</p>
            <button type="button" className="pixel-btn" onClick={resume} autoFocus>
              Continue ▶
            </button>
          </div>
        </div>
      )}

      {phase === 'finished' && stats && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="finish-title">
          <div className="modal">
            <p className="overlay-kicker">Course clear</p>
            <h2 id="finish-title" className="modal-title">Next level: your team?</h2>
            <dl className="stats">
              <div><dt>Deals</dt><dd>{stats.deals}/{stats.totalDeals}</dd></div>
              <div><dt>Skills</dt><dd>{stats.skills}/{SKILLS.length}</dd></div>
              <div><dt>Setbacks</dt><dd>{stats.setbacks}</dd></div>
              <div><dt>Time</dt><dd>{Math.floor(stats.seconds / 60)}:{String(stats.seconds % 60).padStart(2, '0')}</dd></div>
            </dl>
            <p className="modal-body">
              Thanks for playing. If you're hiring for GTM engineering, RevOps or enablement, let's talk.
            </p>
            <div className="overlay-actions">
              <a className="pixel-btn" href={LINKEDIN_URL} target="_blank" rel="noreferrer">Connect on LinkedIn</a>
              <Link className="pixel-btn pixel-btn-ghost" to="/about">Read the resume</Link>
              <button type="button" className="pixel-btn pixel-btn-ghost" onClick={restart}>Play again</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
