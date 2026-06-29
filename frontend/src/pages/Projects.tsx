import { useState, useEffect } from 'react';
import { FolderGit2, Plus, Settings, FolderOpen, Gamepad2, FileCode2, Image, Activity, X } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/projects');
      const data = await res.json();
      setProjects(data.projects || []);
      setActiveProjectId(data.active_project_id || "");
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setShowModal(false);
        setNewProjectName("");
        fetchProjects(); // Refresh
      } else {
        alert("Failed to create project: " + data.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await fetch('http://localhost:8000/api/projects/active', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: id })
      });
      setActiveProjectId(id);
    } catch (e) {
      console.error(e);
    }
  };

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  return (
    <div style={{ gridColumn: '2 / -1', gridRow: '1 / -1', display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      
      {/* Top Header */}
      <header style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Project Workspace</h1>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Manage your autonomous game development projects.</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', padding: '8px 16px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={16} /> New Project
        </button>
      </header>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="panel" style={{ width: '400px', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Create New Project
              <X size={16} style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} />
            </div>
            <div style={{ padding: '24px' }}>
              <input 
                type="text" 
                placeholder="Project Name (e.g. Platformer)"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}
                autoFocus
              />
              <button onClick={handleCreateProject} style={{ width: '100%', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Create Godot Project
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Project List Sidebar */}
        <div style={{ width: '280px', borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)', overflowY: 'auto' }}>
          <div style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '12px', letterSpacing: '0.5px' }}>Active Projects</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {isLoading ? <div style={{color:'var(--text-muted)', fontSize:'12px'}}>Loading...</div> : 
                projects.map((proj) => {
                const isActive = activeProjectId === proj.id;
                return (
                  <div key={proj.id} onClick={() => handleSetActive(proj.id)} style={{ 
                    padding: '12px', borderRadius: '8px', cursor: 'pointer',
                    background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--border-highlight)' : 'transparent'}`,
                    transition: 'all 0.2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ background: isActive ? 'var(--accent-glow)' : 'var(--bg-primary)', color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)', padding: '8px', borderRadius: '6px' }}>
                        <Gamepad2 size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{proj.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{proj.engine}</div>
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
          {activeProject ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <FolderOpen size={24} color="var(--accent-color)" />
                    <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>{activeProject.name}</h2>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px', wordBreak: 'break-all' }}>{activeProject.path}</div>
                </div>
                <Settings size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                {[
                  { label: 'Open Tasks', val: 0, color: 'var(--accent-color)' },
                  { label: 'Workers Assigned', val: '0 Active', color: 'var(--status-completed)' },
                  { label: 'Artifacts', val: '0', color: 'var(--text-primary)' },
                  { label: 'Health Score', val: '100%', color: 'var(--status-completed)' }
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
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><FolderOpen size={14} color="var(--accent-color)" /> .swarm/memory/</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingLeft: '24px' }}><FileCode2 size={14} /> project_bible.json</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingLeft: '24px' }}><FileCode2 size={14} /> architecture_graph.json</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><FileCode2 size={14} /> project.godot</div>
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
                        <div style={{ color: 'var(--text-primary)', marginBottom: '2px' }}>Project Scaffolded</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>ProjectManager • Just now</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              No active project selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
