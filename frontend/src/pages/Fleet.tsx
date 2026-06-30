import { useState } from 'react';
import { Bot, Search, BrainCircuit, Activity, Cpu, Code2, Paintbrush, AudioLines, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

export default function Fleet() {
  const [searchTerm, setSearchTerm] = useState('');

  const agents = [
    { name: "Technical Architect", category: "Engineering", icon: BrainCircuit, engine: "Godot Expert", model: "Gemma 4-31b", confidence: 98, capabilities: ["Scene Trees", "Data Architecture", "Performance Tuning"] },
    { name: "Gameplay Engineer", category: "Engineering", icon: Code2, engine: "Godot Expert", model: "Gemma 4-31b", confidence: 94, capabilities: ["Movement Physics", "Combat Logic", "State Machines"] },
    { name: "QA & Balance", category: "Quality", icon: Activity, engine: "General", model: "DeepSeek Reasoner", confidence: 91, capabilities: ["Exploit Detection", "Stat Balancing", "Regression Testing"] },
    { name: "Shader Engineer", category: "Graphics", icon: Paintbrush, engine: "GLSL / Godot", model: "Gemma 4-31b", confidence: 85, capabilities: ["Screen Space Effects", "Particle Systems", "Material Optimization"] },
    { name: "Audio Designer", category: "Audio", icon: AudioLines, engine: "FMOD / Godot", model: "Gemma 4-31b", confidence: 88, capabilities: ["Dynamic Mixing", "SFX Triggering", "Spatial Audio"] },
    { name: "Executive Reviewer", category: "Management", icon: Bot, engine: "General", model: "Gemma 4-31b", confidence: 99, capabilities: ["Code Review", "Merge Approval", "Conflict Resolution"] },
  ];

  const filteredAgents = agents.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.category.toLowerCase().includes(searchTerm.toLowerCase()));

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
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Agent Marketplace</h1>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Browse and assign specialized AI workers to your project.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 12px', width: '300px' }}>
          <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Search agents by role or capability..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '13px' }}
          />
        </div>
      </header>

      <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {filteredAgents.map((agent, i) => (
            <div key={i} className="panel" style={{ borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>

              <div style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '12px', color: 'var(--accent-color)' }}>
                  <agent.icon size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{agent.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--status-completed)', fontWeight: 600, background: 'rgba(23, 201, 100, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                      <CheckCircle2 size={12} /> {agent.confidence}% Confidence
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{agent.category} • {agent.model}</div>
                </div>
              </div>

              <div style={{ padding: '20px', background: 'var(--bg-secondary)', flex: 1 }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={12} /> Core Capabilities
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {agent.capabilities.map((cap, j) => (
                    <span key={j} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '11px', padding: '4px 10px', borderRadius: '16px' }}>
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--accent-color)', fontWeight: 500 }}>
                  <Zap size={14} /> {agent.engine}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Hire Agent <ChevronRight size={14} />
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
