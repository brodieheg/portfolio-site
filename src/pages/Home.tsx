import { Link } from 'react-router-dom';
import { BIO } from '../data/career';
import GameCanvas from '../game/GameCanvas';

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1 className="hero-title">
          Hi, I'm Brodie<span className="blink">_</span>
        </h1>
        <p className="hero-sub">{BIO.headline}</p>
      </section>

      <GameCanvas />

      <p className="skip-game">
        Rather read than jump? <Link to="/about">Skip to the résumé →</Link>
      </p>
    </>
  );
}
