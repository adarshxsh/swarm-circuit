import { BrowserRouter, Routes, Route, Link, useLocation, useSearchParams } from 'react-router-dom';
import { Layout, GitBranch, Code2, Clock, FolderGit2, GitPullRequest, Gamepad2, ChevronLeft, ChevronRight } from 'lucide-react';
import Workspace from './pages/Workspace';
import Projects from './pages/Projects';
import Fleet from './pages/Fleet';
import Artifacts from './pages/Artifacts';
import History from './pages/History';
import MergeCenter from './pages/MergeCenter';
import Play from './pages/Play';
import Games from './pages/Games';
import { useState } from 'react';

const SIDEBAR_W = 200;
const COLLAPSED_W = 56;

function AppLayout() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isJudgeMode = searchParams.get('judge') === 'true';
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { icon: FolderGit2, label: 'Projects',        path: '/projects' },
    { icon: Layout,     label: 'Workspace',        path: '/' },
    { icon: GitBranch,  label: 'Worker Fleet',     path: '/fleet' },
    { icon: Code2,      label: 'Artifacts',        path: '/artifacts' },
    { icon: Clock,      label: 'History',          path: '/history' },
    { icon: Gamepad2,   label: 'Games',            path: '/games' },
  ];

  const isActive = (path: string) =>
    location.pathname === path ||
    (path === '/' && location.pathname === '/workspace');

  const sideW = collapsed ? COLLAPSED_W : SIDEBAR_W;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>

      {/* ── Sidebar ───────────────────────────────────── */}
      {!isJudgeMode && (
        <div style={{
          width: sideW,
          minWidth: sideW,
          flexShrink: 0,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.22s cubic-bezier(.4,0,.2,1), min-width 0.22s cubic-bezier(.4,0,.2,1)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 10
        }}>

          {/* Brand row */}
          <div style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 10,
            borderBottom: '1px solid var(--border-color)',
            flexShrink: 0,
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-color)', letterSpacing: '-0.5px', flexShrink: 0 }}>⬡</span>
            {!collapsed && (
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>SwarmCircuit</span>
            )}
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }} title={collapsed ? item.label : undefined}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: collapsed ? '10px 0' : '9px 12px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: 7,
                    cursor: 'pointer',
                    background: active ? 'var(--bg-tertiary)' : 'transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    transition: 'background 0.15s, color 0.15s',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}>
                    <item.icon size={17} style={{ flexShrink: 0 }} />
                    {!collapsed && item.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Collapse toggle at bottom */}
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              margin: '8px',
              padding: '8px',
              borderRadius: 7,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 12,
              flexShrink: 0,
              transition: 'background 0.15s'
            }}
          >
            {collapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} /><span>Collapse</span></>}
          </button>
        </div>
      )}

      {/* ── Main content ─────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Routes>
          <Route path="/"           element={<Workspace />} />
          <Route path="/workspace"  element={<Workspace />} />
          <Route path="/projects"   element={<Projects />} />
          <Route path="/fleet"      element={<Fleet />} />
          <Route path="/artifacts"  element={<Artifacts />} />
          <Route path="/merge"      element={<MergeCenter />} />
          <Route path="/history"    element={<History />} />
          <Route path="/games"      element={<Games />} />
          <Route path="/games/:gameId" element={<Play />} />
          <Route path="/play/:gameId"  element={<Play />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
