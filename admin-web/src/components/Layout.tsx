import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';

import { useAuth } from '../auth/AuthContext';

const NAV: { section: string; links: { to: string; label: string; icon: string }[] }[] = [
  {
    section: 'Pilotage',
    links: [
      { to: '/', label: 'Tableau de bord', icon: '▦' },
      { to: '/alertes', label: 'Alertes', icon: '!' },
    ],
  },
  {
    section: 'Comptes',
    links: [
      { to: '/utilisateurs', label: 'Utilisatrices', icon: '♀' },
      { to: '/agents', label: 'Agents communautaires', icon: '⚑' },
    ],
  },
  {
    section: 'Contenus de l’app',
    links: [
      { to: '/contenus/conseils', label: 'Conseils santé', icon: '✎' },
      { to: '/contenus/methodes-pf', label: 'Méthodes PF', icon: '◎' },
      { to: '/contenus/vaccins', label: 'Calendrier vaccinal', icon: '✚' },
      { to: '/contenus/cpn-etapes', label: 'Étapes CPN', icon: '◷' },
    ],
  },
];

export function Layout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const [lastPath, setLastPath] = useState(location.pathname);

  // Referme le menu mobile à chaque navigation.
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setMenuOpen(false);
  }

  return (
    <div className="shell">
      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
        <div className="brand">
          <img src="/logo.png" alt="" width="40" height="40" />
          <div>
            <strong>Lahiyar Ouwa</strong>
            <span>Administration</span>
          </div>
        </div>
        <nav aria-label="Navigation principale">
          {NAV.map((group) => (
            <div key={group.section} className="nav-group">
              <span className="nav-section">{group.section}</span>
              {group.links.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.to === '/'} className="nav-link">
                  <span className="nav-icon" aria-hidden="true">
                    {link.icon}
                  </span>
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <Link to="/mon-compte" className="me" title="Mon compte">
            <span className="avatar" aria-hidden="true">
              {user?.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <strong>{user?.name}</strong>
              <span>{user?.email}</span>
            </div>
          </Link>
          <button type="button" className="btn btn-ghost btn-block" onClick={logout}>
            Se déconnecter
          </button>
        </div>
      </aside>

      {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <div className="main">
        <div className="topbar">
          <button
            type="button"
            className="icon-btn"
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            ☰
          </button>
          <strong>Lahiyar Ouwa · Admin</strong>
        </div>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
