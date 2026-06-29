import { useState } from 'react';
import { History as HistoryIcon, Play, Code2, Clock, CheckCircle2, XCircle, Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function History() {
  const navigate = useNavigate();

  const executions = [
    { id: "Execution #12", task: "Fix player movement bug", status: "Success", workers: 6, artifacts: 3, time: "12 mins ago", duration: "18.2s" },
    { id: "Execution #11", task: "Add double jump mechanic", status: "Success", workers: 4, artifacts: 2, time: "2 hours ago", duration: "12.5s" },
    { id: "Execution #10", task: "Optimize particle system", status: "Failed", workers: 5, artifacts: 1, time: "Yesterday", duration: "8.1s", error: "Shader Engineer hallucinated GLSL syntax." },
    { id: "Execution #9", task: "Generate main menu UI", status: "Success", workers: 3, artifacts: 4, time: "2 days ago", duration: "24.0s" },
    { id: "Execution #8", task: "Refactor enemy state machine", status: "Success", workers: 6, artifacts: 5, time: "Last week", duration: "31.4s" },
  ];

  return (
    <div style={{ gridColumn: '2 / -1', gridRow: '1 / -1', display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)', position: 'relative' }}>
      {/* COMING SOON OVERLAY */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
        <h2 style={{ fontSize: '32px', color: 'var(--text-primary)', marginBottom: '16px' }}>Work In Progress</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '400px', textAlign: 'center', lineHeight: '1.5' }}>This tab is a visual mockup for the SwarmCircuit vision. We are currently focusing backend development on the core Workspace Execution Graph and Memory Systems.</p>
      </div>

      
      {/* Top Header */}
      <header style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Execution History</h1>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Review past swarm executions, inspect logs, and replay graph animations.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 12px', width: '300px' }}>
          <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
          <input type="text" placeholder="Search by task or ID..." style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '13px' }} />
        </div>
      </header>

      <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {executions.map((exec, i) => (
            <div key={i} className="panel" style={{ borderRadius: '12px', display: 'flex', alignItems: 'stretch', overflow: 'hidden' }}>
              
              {/* Status Bar */}
              <div style={{ width: '6px', background: exec.status === 'Success' ? 'var(--status-completed)' : 'var(--status-failed)' }} />
              
              <div style={{ padding: '24px', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                
                {/* Info Block */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{exec.id}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: exec.status === 'Success' ? 'var(--status-completed)' : 'var(--status-failed)', fontWeight: 600, background: exec.status === 'Success' ? 'rgba(23, 201, 100, 0.1)' : 'rgba(243, 24, 76, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                      {exec.status === 'Success' ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {exec.status}
                    </div>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{exec.task}</h3>
                  {exec.error && <div style={{ fontSize: '12px', color: 'var(--status-failed)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>Error: {exec.error}</div>}
                </div>

                {/* Metrics */}
                <div style={{ display: 'flex', gap: '48px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Workers</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{exec.workers} nodes</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Artifacts</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><Code2 size={14} color="var(--accent-color)" /> {exec.artifacts} generated</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Wall Time</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} color="var(--text-muted)" /> {exec.duration}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Date</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{exec.time}</div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => navigate('/')} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                    <Play size={14} /> Replay
                  </button>
                  <button style={{ background: 'transparent', border: '1px solid transparent', color: 'var(--text-secondary)', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}>
                    View Logs <ChevronRight size={16} />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
