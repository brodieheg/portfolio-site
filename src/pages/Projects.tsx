import { Link } from 'react-router-dom';
import { PROJECTS } from '../data/projects';

export default function Projects() {
  return (
    <div className="page">
      <p className="kicker">Inventory</p>
      <h1 className="page-title">Projects</h1>
      <div className="project-grid">
        {PROJECTS.map((p) => (
          <article key={p.title} className="project-card">
            <h2>{p.title}</h2>
            <p>{p.description}</p>
            <ul className="tags">
              {p.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <div className="project-links">
              {p.links.map((l) =>
                l.href.startsWith('/') ? (
                  <Link key={l.label} to={l.href} className="pixel-btn">{l.label}</Link>
                ) : (
                  <a key={l.label} href={l.href} className="pixel-btn" target="_blank" rel="noreferrer">{l.label}</a>
                ),
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
