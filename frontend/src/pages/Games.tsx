import { Link } from 'react-router-dom';
import { Gamepad2, ExternalLink, Cpu, Zap, Shield, Brain } from 'lucide-react';

const GAMES = [
  {
    id: 'catalyst',
    title: 'CATALYST',
    subtitle: 'Government Situation Room Simulator',
    description: 'A high-density Bloomberg-terminal strategy game. Manage a nation in crisis by issuing directives to 3 parallel AI faction agents — The Zealot, The Bureaucrat, and The Opportunist — powered by Cerebras. Math governs state. AI governs behavior.',
    tags: ['Multi-Agent', 'Strategy', 'Cerebras AI', 'Deterministic Engine'],
    agent_count: 3,
    status: 'live',
    accent: '#F59E0B',
    accentDim: 'rgba(245,158,11,0.08)',
    accentBorder: 'rgba(245,158,11,0.25)',
    built_by: 'SwarmCircuit DAG Pipeline',
    tech: ['Vanilla JS', 'Cerebras API', 'Parallel fetch()', 'Deterministic Resolver'],
    factions: [
      { name: 'The Zealot',      color: '#EF4444', desc: 'Radical ideological commitment' },
      { name: 'The Bureaucrat',  color: '#3B82F6', desc: 'Institutional order & process' },
      { name: 'The Opportunist', color: '#8B5CF6', desc: 'Pure self-interest & chaos exploitation' }
    ]
  }
];

export default function Games() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)', overflow: 'hidden' }}>

      {/* Header */}
      <header style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <Gamepad2 size={22} color="var(--accent-color)" />
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Game Studio</h1>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Games autonomously built by the SwarmCircuit multi-agent pipeline.
        </p>
      </header>

      {/* Game cards grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(580px, 1fr))', gap: '24px' }}>
          {GAMES.map((game) => (
            <div
              key={game.id}
              className="panel"
              style={{
                borderRadius: '12px',
                border: `1px solid ${game.accentBorder}`,
                background: game.accentDim,
                overflow: 'visible',
                position: 'relative'
              }}
            >
              {/* Status badge */}
              <div style={{
                position: 'absolute', top: '-12px', left: '24px',
                background: game.status === 'live' ? 'var(--status-completed)' : 'var(--status-pending)',
                color: '#000', fontSize: '10px', fontWeight: 700,
                padding: '4px 10px', borderRadius: '4px', letterSpacing: '0.1em',
                display: 'flex', alignItems: 'center', gap: '5px'
              }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#000', display: 'inline-block'
                }} />
                {game.status === 'live' ? 'LIVE' : 'IN DEVELOPMENT'}
              </div>

              <div style={{ padding: '28px 24px 24px' }}>

                {/* Title row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{
                      fontFamily: 'monospace', fontSize: '24px', fontWeight: 700,
                      letterSpacing: '0.15em', color: game.accent,
                      textShadow: `0 0 20px ${game.accent}50`
                    }}>
                      {game.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                      {game.subtitle}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={`http://localhost:8000/dist_game/${game.id}/index.html`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px', borderRadius: '6px',
                        background: 'transparent', border: `1px solid ${game.accentBorder}`,
                        color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600,
                        textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap'
                      }}
                    >
                      <ExternalLink size={13} /> Open Tab
                    </a>
                    <Link
                      to={`/games/${game.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 18px', borderRadius: '6px',
                        background: game.accent, border: 'none',
                        color: '#000', fontSize: '12px', fontWeight: 700,
                        textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap'
                      }}
                    >
                      <Gamepad2 size={13} /> Play
                    </Link>
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '20px' }}>
                  {game.description}
                </p>

                {/* Factions */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Brain size={11} /> AI Faction Agents
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {game.factions.map((f) => (
                      <div key={f.name} style={{
                        display: 'flex', alignItems: 'center', gap: '7px',
                        padding: '6px 10px', borderRadius: '6px',
                        background: `${f.color}12`, border: `1px solid ${f.color}35`,
                        flex: '1', minWidth: '140px'
                      }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: f.color, fontFamily: 'monospace' }}>{f.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>{f.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {game.tech.map((t) => (
                      <span key={t} style={{
                        fontSize: '10px', padding: '3px 7px', borderRadius: '4px',
                        background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
                        fontFamily: 'monospace', border: '1px solid var(--border-color)'
                      }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                    <Cpu size={11} /> {game.built_by}
                  </div>
                </div>

                {/* Agent count stat */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  {[
                    { icon: Brain, label: 'AI Agents', val: game.agent_count, color: game.accent },
                    { icon: Zap,   label: 'Inference', val: '1,000+ tok/s', color: 'var(--status-completed)' },
                    { icon: Shield,label: 'State Engine', val: 'Deterministic', color: 'var(--accent-color)' }
                  ].map((stat) => (
                    <div key={stat.label} style={{
                      flex: 1, padding: '10px 12px', borderRadius: '6px',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)',
                      textAlign: 'center'
                    }}>
                      <stat.icon size={14} color={stat.color} style={{ marginBottom: '4px' }} />
                      <div style={{ fontSize: '14px', fontWeight: 700, color: stat.color }}>{stat.val}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
