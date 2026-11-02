import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BIO, GITHUB_URL, LINKEDIN_URL } from '../data/career';

const NAV = [
  { to: '/', label: 'Play' },
  { to: '/about', label: 'About' },
  { to: '/projects', label: 'Projects' },
];

export default function Layout() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className="shell">
      <header className="site-header">
        <NavLink to="/" className="brand" aria-label="Home">
          <span className="brand-mark" aria-hidden="true">BH</span>
          <span className="brand-name">{BIO.name}</span>
        </NavLink>
        <nav aria-label="Main">
          <ul className="nav">
            {NAV.map(({ to, label }) => (
              <li key={to}>
                <NavLink to={to} end className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} {BIO.name} · {BIO.location}</span>
        <span className="footer-links">
          <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">LinkedIn</a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>
        </span>
      </footer>
    </div>
  );
}
