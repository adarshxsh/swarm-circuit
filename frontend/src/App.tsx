import { BrowserRouter, Routes, Route, Link, useLocation, useSearchParams } from 'react-router-dom';
import { Layout, GitBranch, Code2, Clock, FolderGit2, GitPullRequest } from 'lucide-react';
import Workspace from './pages/Workspace';
import Projects from './pages/Projects';
import Fleet from './pages/Fleet';
import Artifacts from './pages/Artifacts';
import History from './pages/History';
import MergeCenter from './pages/MergeCenter';

function AppLayout() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isJudgeMode = searchParams.get('judge') === 'true';

  const navItems = [
    { icon: FolderGit2, label: 'Projects', path: '/projects' },
    { icon: Layout, label: 'Execution Graph', path: '/' },
    { icon: GitBranch, label: 'Worker Fleet', path: '/fleet' },
    { icon: Code2, label: 'Artifacts', path: '/artifacts' },
    { icon: GitPullRequest, label: 'Merge Center', path: '/merge' },
    { icon: Clock, label: 'History', path: '/history' }
  ];

  return (
    <div className={`app-container ${isJudgeMode ? 'judge-mode' : ''}`}>
      {/* Sidebar Navigation */}
      {!isJudgeMode && (
        <aside className="sidebar panel" style={{ gridRow: '1 / -1', zIndex: 100 }}>
          <div className="panel-header">SwarmCircuit</div>
          <nav style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item, i) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={i} to={item.path} style={{ textDecoration: 'none' }}>
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px',
                  borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
                  background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}>
                  <item.icon size={16} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        </aside>
      )}

      {/* Main Content Area */}
      <div style={{ display: 'contents' }}>
        <Routes>
          <Route path="/" element={<Workspace />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/artifacts" element={<Artifacts />} />
          <Route path="/merge" element={<MergeCenter />} />
          <Route path="/history" element={<History />} />
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
