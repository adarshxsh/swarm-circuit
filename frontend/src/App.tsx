import { useEffect, useState } from 'react';
import { Play, Square, Settings, Layout, Code2, Clock, GitBranch, Terminal, FileCode2, ToggleLeft, ToggleRight } from 'lucide-react';
import ExecutionGraph from './ExecutionGraph';

export default function App() {
  const [events, setEvents] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  useEffect(() => {
    let eventSource: EventSource | null = null;
    
    if (isPlaying) {
      const mode = isLiveMode ? 'live' : 'demo';
      const objective = encodeURIComponent("Fix player movement bug");
      eventSource = new EventSource(`http://localhost:8000/stream?mode=${mode}&objective=${objective}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setEvents((prev) => [...prev, data]);
        
        if (data.type === 'DAG_COMPLETED' || data.type === 'ERROR') {
          setIsPlaying(false);
          eventSource?.close();
        }
      };
    }
    
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [isPlaying, isLiveMode]);

  // Derived state for the selected node
  const selectedNodeEvents = events.filter(e => e.node_id === selectedNodeId);
  const selectedNodeStart = selectedNodeEvents.find(e => e.type === 'NODE_STARTED');
  const selectedNodeCompleted = selectedNodeEvents.find(e => e.type === 'NODE_COMPLETED');
  const selectedNodeFailed = selectedNodeEvents.find(e => e.type === 'NODE_FAILED');
  
  const status = selectedNodeCompleted ? 'SUCCESS' : selectedNodeFailed ? 'FAILED' : selectedNodeStart ? 'RUNNING' : 'PENDING';
  const role = selectedNodeStart?.role || selectedNodeCompleted?.role || selectedNodeId;

  return (
    <div className="app-container">
      {/* 1. Toolbar */}
      <header className="toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--accent-color)' }} />
          <h1 style={{ fontSize: '14px', fontWeight: 600 }}>SwarmCircuit Observatory</h1>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
            mock_godot_game / main
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          
          {/* Live / Demo Toggle */}
          <div 
            onClick={() => !isPlaying && setIsLiveMode(!isLiveMode)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              fontSize: '12px', color: 'var(--text-secondary)',
              cursor: isPlaying ? 'not-allowed' : 'pointer',
              opacity: isPlaying ? 0.5 : 1
            }}
          >
            {isLiveMode ? <ToggleRight size={20} color="var(--status-completed)" /> : <ToggleLeft size={20} />}
            {isLiveMode ? 'Live Network (Cerebras API)' : 'Golden Demo (Simulated)'}
          </div>

          {/* Run Button */}
          <button 
            onClick={() => { setEvents([]); setIsPlaying(true); setSelectedNodeId(null); }}
            disabled={isPlaying}
            style={{ 
              background: isPlaying ? 'transparent' : 'var(--text-primary)', 
              color: isPlaying ? 'var(--text-muted)' : 'var(--bg-primary)',
              border: 'none', padding: '6px 12px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', fontWeight: 600, cursor: isPlaying ? 'default' : 'pointer'
            }}
          >
            {isPlaying ? <Square size={14} /> : <Play size={14} />}
            {isPlaying ? 'Running...' : 'Run Simulation'}
          </button>
          
          <Settings size={18} color="var(--text-secondary)" />
        </div>
      </header>

      {/* 2. Sidebar */}
      <aside className="sidebar panel">
        <div className="panel-header">Workspace</div>
        <nav style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { icon: Layout, label: 'Execution Graph', active: true },
            { icon: GitBranch, label: 'Worker Fleet' },
            { icon: Code2, label: 'Artifacts' },
            { icon: Clock, label: 'History' }
          ].map((item, i) => (
            <div key={i} style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px',
              borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
              background: item.active ? 'var(--bg-tertiary)' : 'transparent',
              color: item.active ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}>
              <item.icon size={16} />
              {item.label}
            </div>
          ))}
        </nav>
      </aside>

      {/* 3. Main Canvas */}
      <main className="canvas-container">
        {events.length > 0 ? (
          <ExecutionGraph events={events} onNodeClick={(id) => setSelectedNodeId(id)} />
        ) : (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>Live Execution Graph</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>
              Select mode and click 'Run Simulation'
            </p>
          </div>
        )}
      </main>

      {/* 4. Worker Inspector */}
      <aside className="inspector panel">
        <div className="panel-header">Worker Inspector</div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto' }}>
          {!selectedNodeId ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
              Select a node in the graph to view execution details, logs, and artifacts.
            </div>
          ) : (
            <>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{role}</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Model: Cerebras API (gemma-4-31b)</div>
                <div style={{ 
                  display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, marginTop: '8px',
                  background: status === 'RUNNING' ? 'var(--accent-glow)' : status === 'SUCCESS' ? 'rgba(23, 201, 100, 0.2)' : 'var(--bg-tertiary)',
                  color: status === 'RUNNING' ? 'var(--accent-color)' : status === 'SUCCESS' ? 'var(--status-completed)' : 'var(--text-secondary)'
                }}>
                  {status}
                </div>
              </div>

              {selectedNodeCompleted?.artifact?.deliverables && (
                <div>
                  <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Produced Artifacts</h4>
                  {selectedNodeCompleted.artifact.deliverables.map((d: any, i: number) => (
                    <div key={i} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                        <FileCode2 size={14} color="var(--accent-color)" />
                        {d.target_file}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Type: {d.artifact_type}</div>
                    </div>
                  ))}
                </div>
              )}

              {selectedNodeCompleted && (
                <div>
                  <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Execution Metrics</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Latency</span>
                      <span>{selectedNodeCompleted.artifact.execution_time_ms}ms</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Status</span>
                      <span style={{ color: 'var(--status-completed)' }}>SUCCESS</span>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Live Logs</h4>
                <div style={{ background: '#000', borderRadius: '6px', padding: '12px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)', height: '120px', overflowY: 'auto' }}>
                  {selectedNodeStart && <div>[System] Worker booted and attached to DAG.</div>}
                  {selectedNodeStart && <div>[Network] Connected to Cerebras API...</div>}
                  {selectedNodeStart && <div style={{ color: 'var(--accent-color)' }}>[Streaming] Generating response...</div>}
                  {selectedNodeCompleted && <div style={{ color: 'var(--status-completed)' }}>[Success] Artifact successfully committed.</div>}
                  {selectedNodeFailed && <div style={{ color: 'var(--status-failed)' }}>[Error] {selectedNodeFailed.error}</div>}
                </div>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* 5. Artifact Timeline */}
      <section className="timeline panel">
        <div className="panel-header">Artifact Timeline</div>
        <div style={{ padding: '16px', display: 'flex', gap: '16px', overflowX: 'auto', alignItems: 'center' }}>
          {events.filter(e => e.type === 'NODE_COMPLETED').reverse().map((e, i) => (
            <div key={i} style={{ 
              minWidth: '280px', padding: '16px', borderRadius: '8px',
              border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', flexShrink: 0,
              animation: 'slideUp 0.3s ease-out'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-completed)' }} />
                {e.role}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '8px', color: 'var(--text-primary)' }}>
                {e.artifact?.deliverables?.[0]?.target_file || 'Architecture Document'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--accent-color)', marginTop: '8px', cursor: 'pointer' }}>
                View Diff →
              </div>
            </div>
          ))}
          {events.length > 0 && events.filter(e => e.type === 'NODE_COMPLETED').length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
              Waiting for workers to deliver artifacts...
            </div>
          )}
        </div>
      </section>

      {/* 6. Status Bar */}
      <footer className="statusbar">
        <div style={{ display: 'flex', gap: '24px' }}>
          <span>Status: {isPlaying ? 'Running' : 'Idle'}</span>
          <span>Workers: 6</span>
          <span style={{ color: 'var(--accent-color)' }}>Provider: {isLiveMode ? 'Live LLM Inference' : 'Hybrid (Live-Sim)'}</span>
        </div>
      </footer>
    </div>
  );
}
