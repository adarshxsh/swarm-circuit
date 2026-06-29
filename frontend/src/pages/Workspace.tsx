import { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Square, Settings, Layout, Code2, Clock, GitBranch, Terminal, FileCode2, ToggleLeft, ToggleRight, FastForward, Download, Pause, Plus, Bug, Zap, Wand2, BookOpen, Presentation } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ExecutionGraph from '../ExecutionGraph';

export default function Workspace() {
  const [events, setEvents] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2>(1);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const isJudgeMode = searchParams.get('judge') === 'true';

  const [showComposer, setShowComposer] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('High');

  // Golden Run playback state
  const [goldenEvents, setGoldenEvents] = useState<any[]>([]);
  const goldenIndexRef = useRef(0);
  const playbackTimeoutRef = useRef<number | NodeJS.Timeout | null>(null);
  const lastEventTimeRef = useRef<number>(0);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!isPlaying && !showComposer) {
          startSimulation();
        } else if (!isLiveMode && !showComposer) {
          setIsPaused(p => !p);
        }
      } else if (e.code === 'Escape') {
        setSelectedNodeId(null);
        setShowComposer(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isLiveMode, showComposer]);

  const startSimulation = useCallback(() => {
    setEvents([]);
    setIsPlaying(true);
    setIsPaused(false);
    setSelectedNodeId(null);
    setShowComposer(false);
    goldenIndexRef.current = 0;
    lastEventTimeRef.current = 0;
    
    if (!isLiveMode) {
      if (goldenEvents.length === 0) {
        fetch('http://localhost:8000/golden-run')
          .then(res => res.json())
          .then(data => {
            setGoldenEvents(data);
          });
      }
    }
  }, [isLiveMode, goldenEvents.length]);

  // Auto-start in Judge Mode
  useEffect(() => {
    if (isJudgeMode && !isPlaying && events.length === 0) {
      startSimulation();
    }
  }, [isJudgeMode, isPlaying, events.length, startSimulation]);

  const stopSimulation = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current as number);
  }, []);

  // Demo Mode Playback Loop
  useEffect(() => {
    if (!isPlaying || isLiveMode || goldenEvents.length === 0 || isPaused) return;

    const playNextEvent = () => {
      if (goldenIndexRef.current >= goldenEvents.length) {
        setIsPlaying(false);
        return;
      }

      const event = goldenEvents[goldenIndexRef.current];
      const delay = event.delay || 0;
      const waitTime = (delay - lastEventTimeRef.current) * 1000;
      
      const adjustedWaitTime = Math.max(0, waitTime / playbackSpeed);

      playbackTimeoutRef.current = setTimeout(() => {
        setEvents(prev => [...prev, event]);
        lastEventTimeRef.current = delay;
        goldenIndexRef.current++;
        
        if (event.type === 'DAG_COMPLETED' || event.type === 'ERROR') {
          setIsPlaying(false);
        } else {
          playNextEvent();
        }
      }, adjustedWaitTime);
    };

    playNextEvent();

    return () => {
      if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current as number);
    };
  }, [isPlaying, isLiveMode, goldenEvents, isPaused, playbackSpeed]);

  // Live Mode SSE Loop
  useEffect(() => {
    let eventSource: EventSource | null = null;
    if (isPlaying && isLiveMode) {
      const objective = encodeURIComponent(taskInput || "Fix player movement bug");
      eventSource = new EventSource(`http://localhost:8000/stream?mode=live&objective=${objective}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setEvents((prev) => [...prev, data]);
        if (data.type === 'DAG_COMPLETED' || data.type === 'ERROR') {
          setIsPlaying(false);
          eventSource?.close();
        }
      };
    }
    return () => eventSource?.close();
  }, [isPlaying, isLiveMode, taskInput]);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "execution_report.json");
    dlAnchorElem.click();
  };

  const selectedNodeEvents = events.filter(e => e.node_id === selectedNodeId);
  const selectedNodeStart = selectedNodeEvents.find(e => e.type === 'NODE_STARTED');
  const selectedNodeCompleted = selectedNodeEvents.find(e => e.type === 'NODE_COMPLETED');
  const selectedNodeFailed = selectedNodeEvents.find(e => e.type === 'NODE_FAILED');
  
  const status = selectedNodeCompleted ? 'SUCCESS' : selectedNodeFailed ? 'FAILED' : selectedNodeStart ? 'RUNNING' : 'PENDING';
  const role = selectedNodeStart?.role || selectedNodeCompleted?.role || selectedNodeId;

  const isCompleted = events.some(e => e.type === 'DAG_COMPLETED');

  const promptTemplates = [
    { icon: Bug, label: "Bug Fix", text: "Fix player movement bug in Platformer demo." },
    { icon: Wand2, label: "Feature", text: "Add double jump mechanic to the Player scene." },
    { icon: Zap, label: "Performance", text: "Optimize signal connections in enemy pool." },
    { icon: BookOpen, label: "Documentation", text: "Update docstrings for all state machine logic." }
  ];

  return (
    <>
      <header className="toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--accent-color)' }} />
          <h1 style={{ fontSize: '14px', fontWeight: 600 }}>Execution Workspace</h1>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
            Task: {taskInput || "Fix player movement bug"}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          
          <button 
            onClick={() => setShowComposer(true)}
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={14} /> New Task
          </button>

          <button 
            onClick={() => setSearchParams(isJudgeMode ? {} : { judge: 'true' })}
            style={{ background: isJudgeMode ? 'var(--accent-glow)' : 'transparent', border: `1px solid ${isJudgeMode ? 'var(--accent-color)' : 'var(--border-color)'}`, color: isJudgeMode ? 'var(--accent-color)' : 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Presentation size={14} /> Judge Mode
          </button>

          {isPlaying && !isLiveMode && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => setIsPaused(!isPaused)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                {isPaused ? <Play size={14} /> : <Pause size={14} />}
              </button>
              <button onClick={() => setPlaybackSpeed(s => s === 1 ? 2 : 1)} style={{ background: playbackSpeed === 2 ? 'var(--accent-color)' : 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: playbackSpeed === 2 ? '#000' : 'var(--text-primary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FastForward size={14} /> {playbackSpeed}x
              </button>
            </div>
          )}

          <div 
            onClick={() => !isPlaying && setIsLiveMode(!isLiveMode)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: isPlaying ? 'not-allowed' : 'pointer', opacity: isPlaying ? 0.5 : 1 }}
          >
            {isLiveMode ? <ToggleRight size={20} color="var(--status-completed)" /> : <ToggleLeft size={20} />}
            {isLiveMode ? 'Live Network (Cerebras)' : 'Golden Demo'}
          </div>

          <button 
            onClick={isPlaying ? stopSimulation : startSimulation}
            style={{ background: isPlaying ? 'transparent' : 'var(--text-primary)', color: isPlaying ? 'var(--text-muted)' : 'var(--bg-primary)', border: isPlaying ? '1px solid var(--border-color)' : 'none', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            {isPlaying ? <Square size={14} color="var(--status-failed)" /> : <Play size={14} />}
            {isPlaying ? 'Stop' : 'Run Simulation'}
          </button>

          {isCompleted && (
            <button onClick={handleExport} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} /> Export Report
            </button>
          )}
        </div>
      </header>

      <main className="canvas-container" style={{ position: 'relative' }}>
        
        {/* Task Composer Modal */}
        {showComposer && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="panel" style={{ width: '600px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <div className="panel-header" style={{ fontSize: '14px' }}>Task Composer</div>
              <div style={{ padding: '24px' }}>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Prompt Templates</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    {promptTemplates.map((pt, i) => (
                      <button key={i} onClick={() => setTaskInput(pt.text)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                        <pt.icon size={20} color="var(--accent-color)" />
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>{pt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Task Description</label>
                  <textarea 
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    placeholder="Describe what you want the SwarmCircuit agents to build..."
                    style={{ width: '100%', height: '100px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)', fontSize: '14px', resize: 'none', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Priority</label>
                    <select value={selectedPriority} onChange={e => setSelectedPriority(e.target.value)} style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: 'var(--text-primary)', outline: 'none' }}>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Target File</label>
                    <input type="text" defaultValue="player.gd" style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Required Workers</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {['Technical Architect', 'Gameplay Engineer', 'QA & Balance', 'Performance Reviewer', 'Documentation Agent'].map((w, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked /> {w}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button onClick={() => setShowComposer(false)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={startSimulation} style={{ background: 'var(--text-primary)', border: 'none', color: 'var(--bg-primary)', padding: '10px 24px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Play size={16} /> Execute DAG
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {events.length > 0 ? (
          <ExecutionGraph events={events} onNodeClick={(id) => setSelectedNodeId(id)} />
        ) : (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <Layout size={48} color="var(--border-color)" style={{ marginBottom: '16px' }} />
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '16px' }}>Ready to build your game</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>
              Press <kbd style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>Space</kbd> or click 'New Task' to start
            </p>
          </div>
        )}

        {isCompleted && (
          <div style={{ position: 'absolute', top: '24px', left: '24px', display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 10, animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-highlight)', borderRadius: '8px', padding: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={16} color="var(--accent-color)" /> Execution Summary
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px' }}>
                <div><div style={{ color: 'var(--text-muted)' }}>Total Workers</div><div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>6</div></div>
                <div><div style={{ color: 'var(--text-muted)' }}>Artifacts</div><div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{events.filter(e => e.type === 'NODE_COMPLETED').length}</div></div>
                <div><div style={{ color: 'var(--text-muted)' }}>Wall Time</div><div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{(events[events.length-1]?.delay || 0).toFixed(1)}s</div></div>
                <div><div style={{ color: 'var(--text-muted)' }}>Status</div><div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--status-completed)' }}>SUCCESS</div></div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wand2 size={14} color="var(--accent-color)" /> AI Recommendations
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { text: 'Optimize enemy AI state machine', time: '15 min' },
                  { text: 'Improve camera smoothing', time: '10 min' },
                  { text: 'Refactor inventory system', time: '30 min' }
                ].map((rec, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{rec.text}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600 }}>{rec.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <aside className="inspector panel">
        <div className="panel-header">Worker Inspector <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto', fontWeight: 'normal' }}>Press ESC to close</span></div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto' }}>
          {!selectedNodeId ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>Select a node in the graph to view execution details, logs, and artifacts.</div>
          ) : (
            <>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{role}</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Model: Cerebras API (gemma-4-31b)</div>
                <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, marginTop: '8px', background: status === 'RUNNING' ? 'var(--accent-glow)' : status === 'SUCCESS' ? 'rgba(23, 201, 100, 0.2)' : 'var(--bg-tertiary)', color: status === 'RUNNING' ? 'var(--accent-color)' : status === 'SUCCESS' ? 'var(--status-completed)' : 'var(--text-secondary)' }}>
                  {status}
                </div>
              </div>

              {selectedNodeCompleted?.artifact?.deliverables && (
                <div>
                  <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Produced Artifacts</h4>
                  {selectedNodeCompleted.artifact.deliverables.map((d: any, i: number) => (
                    <div key={i} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '8px' }}><FileCode2 size={14} color="var(--accent-color)" />{d.target_file}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Type: {d.artifact_type}</div>
                    </div>
                  ))}
                </div>
              )}

              {selectedNodeCompleted && (
                <div>
                  <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Execution Metrics</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Latency</span><span>{selectedNodeCompleted.artifact.execution_time_ms}ms</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Status</span><span style={{ color: 'var(--status-completed)' }}>SUCCESS</span></div>
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

      <section className="timeline panel">
        <div className="panel-header">Artifact Timeline</div>
        <div style={{ padding: '16px', display: 'flex', gap: '16px', overflowX: 'auto', alignItems: 'center' }}>
          {events.filter(e => e.type === 'NODE_COMPLETED').reverse().map((e, i) => (
            <div key={i} style={{ minWidth: '280px', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', flexShrink: 0, animation: 'slideUp 0.3s ease-out' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-completed)' }} />{e.role}</div>
              <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '8px', color: 'var(--text-primary)' }}>{e.artifact?.deliverables?.[0]?.target_file || 'Architecture Document'}</div>
              <div style={{ fontSize: '12px', color: 'var(--accent-color)', marginTop: '8px', cursor: 'pointer' }}>View Diff →</div>
            </div>
          ))}
          {events.length > 0 && events.filter(e => e.type === 'NODE_COMPLETED').length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>Waiting for workers to deliver artifacts...</div>
          )}
        </div>
      </section>

      <footer className="statusbar">
        <div style={{ display: 'flex', gap: '24px' }}>
          <span>Status: {isPlaying ? (isPaused ? 'Paused' : 'Running') : 'Idle'}</span>
          <span>Workers: 6</span>
          <span style={{ color: 'var(--accent-color)' }}>Provider: {isLiveMode ? 'Live LLM Inference' : 'Golden Demo'}</span>
        </div>
      </footer>
    </>
  );
}
