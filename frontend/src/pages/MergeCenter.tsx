import { useState } from 'react';
import { GitPullRequest, Check, X, MessageSquare, AlertCircle, Eye, GitCommit, FileCode2 } from 'lucide-react';

export default function MergeCenter() {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const diffCode = `@@ -12,8 +12,11 @@
 \t# Add the gravity.
 \tif not is_on_floor():
 \t\tvelocity.y -= gravity * delta
 
-\t# Handle jump.
-\tif Input.is_action_just_pressed("ui_accept") and is_on_floor():
-\t\tvelocity.y = JUMP_VELOCITY
+\t# Handle double jump.
+\tif Input.is_action_just_pressed("ui_accept"):
+\t\tif is_on_floor():
+\t\t\tvelocity.y = JUMP_VELOCITY
+\t\t\tjumps_left = 1
+\t\telif jumps_left > 0:
+\t\t\tvelocity.y = JUMP_VELOCITY
+\t\t\tjumps_left -= 1
`;

  return (
    <div style={{ gridColumn: '2 / -1', gridRow: '1 / -1', display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)', position: 'relative' }}>
      {/* COMING SOON OVERLAY */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
        <h2 style={{ fontSize: '32px', color: 'var(--text-primary)', marginBottom: '16px' }}>Work In Progress</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '400px', textAlign: 'center', lineHeight: '1.5' }}>This tab is a visual mockup for the SwarmCircuit vision. We are currently focusing backend development on the core Workspace Execution Graph and Memory Systems.</p>
      </div>

      
      {/* Top Header */}
      <header style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Implement Double Jump Mechanic</h1>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>#14</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '16px', fontSize: '11px', fontWeight: 600,
              background: status === 'pending' ? 'var(--bg-tertiary)' : status === 'approved' ? 'rgba(23, 201, 100, 0.1)' : 'rgba(243, 24, 76, 0.1)',
              color: status === 'pending' ? 'var(--text-secondary)' : status === 'approved' ? 'var(--status-completed)' : 'var(--status-failed)'
            }}>
              <GitPullRequest size={12} />
              {status === 'pending' ? 'Open' : status === 'approved' ? 'Merged' : 'Closed'}
            </div>
            <span><span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Gameplay Engineer</span> wants to merge 1 commit into <code style={{ background: 'var(--bg-tertiary)', padding: '2px 4px', borderRadius: '4px' }}>main</code></span>
          </div>
        </div>
        
        {status === 'pending' && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setStatus('rejected')} style={{ background: 'var(--bg-primary)', border: '1px solid var(--status-failed)', color: 'var(--status-failed)', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <X size={16} /> Reject
            </button>
            <button style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={16} /> Request Revision
            </button>
            <button onClick={() => setStatus('approved')} style={{ background: 'var(--status-completed)', border: 'none', color: '#000', padding: '8px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} /> Approve & Merge
            </button>
          </div>
        )}
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          
          <div className="panel" style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCode2 size={16} color="var(--accent-color)" /> src/player.gd
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--status-completed)' }}>+6 additions</span>
                <span style={{ color: 'var(--status-failed)' }}>-3 deletions</span>
              </div>
            </div>
            <div style={{ background: '#0a0a0a', padding: '16px', overflowX: 'auto' }}>
              <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.6 }}>
                {diffCode.split('\n').map((line, i) => {
                  const isAdd = line.startsWith('+');
                  const isSub = line.startsWith('-');
                  const color = isAdd ? 'var(--status-completed)' : isSub ? 'var(--status-failed)' : '#e0e0e0';
                  const bg = isAdd ? 'rgba(23, 201, 100, 0.1)' : isSub ? 'rgba(243, 24, 76, 0.1)' : 'transparent';
                  return (
                    <div key={i} style={{ color, background: bg, padding: '0 8px' }}>
                      {line}
                    </div>
                  )
                })}
              </pre>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} color="var(--text-secondary)" />
            </div>
            <div className="panel" style={{ flex: 1, borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>Executive Reviewer</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>1 hour ago</div>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                I have reviewed the changes submitted by Gameplay Engineer. The implementation for double jumping is correct and follows our GDScript style guidelines. The <code>jumps_left</code> variable is correctly decremented. 
                <br /><br />
                <span style={{ color: 'var(--status-completed)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> Passes QA automated tests. Ready for merge.
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar */}
        <div style={{ width: '300px', borderLeft: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '24px' }}>
          <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '16px' }}>Reviewers</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Bot size={16} /> Executive Reviewer</div>
            <CheckCircle2 size={16} color="var(--status-completed)" />
          </div>

          <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '16px' }}>Assignees</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '24px' }}>
            <Bot size={16} /> Gameplay Engineer
          </div>

          <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '16px' }}>Linked Issues</h3>
          <div style={{ fontSize: '13px', color: 'var(--accent-color)', cursor: 'pointer' }}>
            #12 Feature: Double Jump
          </div>
        </div>
      </div>
    </div>
  );
}
