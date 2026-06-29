import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MonitorPlay, Maximize2 } from 'lucide-react';
import { useRef } from 'react';

const GAME_META: Record<string, { title: string; subtitle: string; hint: string }> = {
  catalyst: {
    title: 'CATALYST — Government Situation Room',
    subtitle: 'Built by SwarmCircuit DAG Pipeline',
    hint: 'Enter your Cerebras API key to start the simulation. Type directives in the command console and press Enter.'
  }
};

const DEFAULT_META = {
  title: 'Game Runtime',
  subtitle: 'SwarmCircuit Build',
  hint: 'Click inside to interact'
};

export default function Play() {
  const { gameId } = useParams<{ gameId: string }>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const meta = (gameId && GAME_META[gameId]) || DEFAULT_META;

  // Support both old dist_game root (no gameId) and new /games/:gameId
  const src = gameId
    ? `http://localhost:8000/dist_game/${gameId}/index.html`
    : `http://localhost:8000/dist_game/index.html`;

  const handleFullscreen = () => {
    if (iframeRef.current?.requestFullscreen) {
      iframeRef.current.requestFullscreen();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>

      <header style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        <Link
          to={gameId ? '/games' : '/'}
          style={{
            padding: '8px', color: 'var(--text-secondary)',
            background: 'var(--bg-secondary)', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none'
          }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MonitorPlay size={18} color="var(--status-completed)" />
            {meta.title}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0 0', fontFamily: 'monospace' }}>{meta.subtitle}</p>
        </div>
        <button
          onClick={handleFullscreen}
          style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', padding: '8px 14px', borderRadius: '6px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', fontWeight: 600
          }}
        >
          <Maximize2 size={13} /> Fullscreen
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', padding: '24px', overflow: 'auto' }}>
        <div className="panel" style={{ position: 'relative', borderRadius: '12px', padding: '20px', boxShadow: '0 24px 48px rgba(0,0,0,0.6)', maxWidth: '100%' }}>

          {/* LIVE tag */}
          <div style={{
            position: 'absolute', top: '-11px', left: '20px',
            background: 'var(--status-completed)', color: '#000',
            fontSize: '10px', fontWeight: 700, padding: '3px 8px',
            borderRadius: '4px', letterSpacing: '0.1em'
          }}>
            LIVE
          </div>

          <iframe
            ref={iframeRef}
            src={src}
            style={{
              width: '1200px', height: '680px',
              maxWidth: '80vw', maxHeight: '70vh',
              border: '1px solid var(--border-color)',
              borderRadius: '8px', background: '#060d1a', display: 'block'
            }}
            title={meta.title}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />

          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            {meta.hint}
          </div>
        </div>
      </div>
    </div>
  );
}
