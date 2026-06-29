import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MonitorPlay, Maximize2 } from 'lucide-react';
import { useRef } from 'react';

export default function Play() {
  const { gameId } = useParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div style={{ gridColumn: '2 / -1', gridRow: '1 / -1', display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      <header style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link 
          to="/"
          style={{ padding: '8px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MonitorPlay size={20} color="var(--status-completed)" />
            Game Runtime
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Execution ID: {gameId}</p>
        </div>
      </header>

      <div style={{ flex: 1, padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
        <div className="panel" style={{ padding: '24px', borderRadius: '12px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ position: 'absolute', top: '-12px', left: '24px', background: 'var(--status-completed)', color: '#000', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            LIVE DEMO
          </div>
          
          <button 
            onClick={handleFullscreen}
            style={{ position: 'absolute', top: '16px', right: '32px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, zIndex: 10 }}
          >
            <Maximize2 size={14} /> Fullscreen
          </button>
          
          <iframe 
            ref={iframeRef}
            src="http://localhost:8000/dist_game/index.html" 
            style={{ width: '1024px', height: '600px', border: '1px solid var(--border-color)', borderRadius: '8px', background: '#000', display: 'block' }}
            title="Game Engine"
            sandbox="allow-scripts allow-same-origin"
          />
          
          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            Click inside the canvas and press SPACE to jump
          </div>
        </div>
      </div>
    </div>
  );
}
