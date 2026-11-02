import type { CSSProperties } from 'react';
import headshot from '../assets/Headshot.png';
import { BIO, EDUCATION, EXPERIENCE, LINKEDIN_URL, SKILLS, TOOLBOX } from '../data/career';

export default function About() {
  return (
    <div className="page">
      <section className="about-intro">
        <img src={headshot} alt="Brodie Heginbotham" className="headshot" width={180} height={180} />
        <div>
          <p className="kicker">Player 1</p>
          <h1 className="page-title">{BIO.name}</h1>
          <p className="lead">{BIO.headline}</p>
          <p>{BIO.intro}</p>
          <p className="muted">{BIO.tagline}</p>
          <a className="pixel-btn" href={LINKEDIN_URL} target="_blank" rel="noreferrer">
            Connect on LinkedIn
          </a>
        </div>
      </section>

      <section aria-labelledby="xp">
        <h2 id="xp" className="section-title">Experience</h2>
        <ol className="timeline">
          {EXPERIENCE.map((role, i) => (
            <li key={role.title} className="timeline-item">
              <span className="world-tag">World {EXPERIENCE.length + 1 - i}</span>
              <h3>
                {role.title} <span className="at">@ {role.company}</span>
              </h3>
              <p className="dates">{role.dates}</p>
              <ul>
                {role.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="skills">
        <h2 id="skills" className="section-title">Power-ups</h2>
        <div className="skill-grid">
          {SKILLS.map((s) => (
            <article key={s.id} id={s.id} className="skill-card" style={{ '--skill': s.color } as CSSProperties}>
              <h3>{s.name}</h3>
              <p className="power-chip">{s.power}</p>
              <p>{s.summary}</p>
            </article>
          ))}
        </div>
        <ul className="toolbox" aria-label="Tools">
          {TOOLBOX.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="edu">
        <h2 id="edu" className="section-title">Education</h2>
        <ul className="edu">
          {EDUCATION.map((e) => (
            <li key={e.school}>
              <strong>{e.school}</strong>
              <span>{e.detail}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
