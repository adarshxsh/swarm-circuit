import { useState } from 'react';
import { FolderGit2, Plus, Settings, FolderOpen, Gamepad2, Rocket, Sword, FileCode2, Image, Activity, BookOpen, Clock } from 'lucide-react';

export default function Projects() {
  const [activeProject, setActiveProject] = useState(0);

  const projects = [
    { name: "Platformer Demo", icon: Gamepad2, lastActive: "2 hours ago", tasks: 12, engine: "Godot 4.2" },
    { name: "RPG Prototype", icon: Sword, lastActive: "Yesterday", tasks: 45, engine: "Godot 4.2" },
    { name: "Space Shooter", icon: Rocket, lastActive: "Last week", tasks: 8, engine: "Godot 4.1" },
  ];

  return (
    <div style={{ gridColumn: '2 / -1', gridRow: '1 / -1', display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      
      {/* Top Header */}
      <header style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Project Workspace</h1>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Manage your autonomous game development projects.</div>
        </div>
        <button style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', padding: '8px 16px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={16} /> New Project
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Project List Sidebar */}
        <div style={{ width: '280px', borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)', overflowY: 'auto' }}>
          <div style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '12px', letterSpacing: '0.5px' }}>Active Projects</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {projects.map((proj, i) => {
                const isActive = activeProject === i;
                return (
                  <div key={i} onClick={() => setActiveProject(i)} style={{ 
                    padding: '12px', borderRadius: '8px', cursor: 'pointer',
                    background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--border-highlight)' : 'transparent'}`,
                    transition: 'all 0.2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ background: isActive ? 'var(--accent-glow)' : 'var(--bg-primary)', color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)', padding: '8px', borderRadius: '6px' }}>
                        <proj.icon size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{proj.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{proj.engine} • {proj.lastActive}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Project Details Panel */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <FolderOpen size={24} color="var(--accent-color)" />
                <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>{projects[activeProject].name}</h2>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>/Users/adarsh/Projects/personal/swarm-circuit/mock_godot_game</div>
            </div>
            <Settings size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
            {[
              { label: 'Open Tasks', val: projects[activeProject].tasks, color: 'var(--accent-color)' },
              { label: 'Workers Assigned', val: '6 Active', color: 'var(--status-completed)' },
              { label: 'Artifacts', val: '128', color: 'var(--text-primary)' },
              { label: 'Health Score', val: '98%', color: 'var(--status-completed)' }
            ].map((stat, i) => (
              <div key={i} className="panel" style={{ padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{stat.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: stat.color }}>{stat.val}</div>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Project Explorer</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* File Tree Mock */}
            <div className="panel" style={{ borderRadius: '8px', overflow: 'hidden' }}>
              <div className="panel-header" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <FileCode2 size={14} /> Source Files
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><FolderOpen size={14} color="var(--accent-color)" /> src/</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingLeft: '24px' }}><FileCode2 size={14} /> player.gd</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingLeft: '24px' }}><FileCode2 size={14} /> enemy.gd</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingLeft: '24px' }}><Gamepad2 size={14} color="var(--status-completed)" /> Player.tscn</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><FolderOpen size={14} color="var(--accent-color)" /> assets/</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingLeft: '24px' }}><Image size={14} /> sprites.png</div>
              </div>
            </div>

            {/* Recent Activity Mock */}
            <div className="panel" style={{ borderRadius: '8px', overflow: 'hidden' }}>
              <div className="panel-header" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Activity size={14} /> Recent Agent Activity
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ background: 'var(--status-completed)', width: '8px', height: '8px', borderRadius: '50%', marginTop: '4px' }} />
                  <div>
                    <div style={{ color: 'var(--text-primary)', marginBottom: '2px' }}>Merged PR #12: Fix jump mechanics</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Executive Reviewer • 2 hrs ago</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ background: 'var(--accent-color)', width: '8px', height: '8px', borderRadius: '50%', marginTop: '4px' }} />
                  <div>
                    <div style={{ color: 'var(--text-primary)', marginBottom: '2px' }}>Generated Architecture Document</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Technical Architect • 4 hrs ago</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
