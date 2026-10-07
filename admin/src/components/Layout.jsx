import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { collectionResources } from '../resources.jsx';

const NAV = [
  { title: null, links: [{ to: '/', label: 'Dashboard', end: true }] },
  {
    title: 'Content',
    links: [{ to: '/about', label: 'About' }, ...collectionResources.map((r) => ({ to: `/${r.key}`, label: r.label }))],
  },
  { title: 'Inbox', links: [{ to: '/messages', label: 'Messages' }] },
  { title: 'Library', links: [{ to: '/media', label: 'Media' }] },
  { title: 'Account', links: [{ to: '/settings', label: 'Settings' }] },
];

function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold text-white">C</div>
        <span className="font-semibold text-white">Portfolio CMS</span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {NAV.map((group, i) => (
          <div key={group.title ?? i}>
            {group.title && (
              <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">{group.title}</p>
            )}
            <ul className="space-y-0.5">
              {group.links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/60 hover:text-white'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-slate-800/60 hover:text-white"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-semibold text-slate-900">Portfolio CMS</span>
      </header>
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-xl">
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
