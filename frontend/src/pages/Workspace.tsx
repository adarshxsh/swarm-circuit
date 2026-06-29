import { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Square, Settings, Layout, Code2, Clock, Terminal, FastForward, Pause, Plus, MonitorPlay, Activity, Loader2, Menu } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ExecutionGraph from '../ExecutionGraph';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { useSidebar } from '../SidebarContext';

export default function Workspace() {
  const [events, setEvents] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const { isSidebarCollapsed, toggleSidebar } = useSidebar();
  const [isPaused, setIsPaused] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(true);
  
  const [searchParams] = useSearchParams();
  const isJudgeMode = searchParams.get('judge') === 'true';

  const [taskInput, setTaskInput] = useState('Build a Flappy Bird clone');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeWorker, setActiveWorker] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');

  const togglePause = async () => {
    const endpoint = isPaused ? '/api/resume' : '/api/pause';
    await fetch(`http://localhost:8000${endpoint}`, { method: 'POST' });
    setIsPaused(!isPaused);
  };

  const sendChatMessage = async () => {
    if (!selectedNodeId || !chatInput.trim()) return;
    await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ node_id: selectedNodeId, message: chatInput })
    });
    setChatInput('');
  };

  // Auto-start in Judge Mode
  useEffect(() => {
    if (isJudgeMode && !isPlaying && events.length === 0) {
      startSimulation();
    }
  }, [isJudgeMode, isPlaying, events.length]);

  const startSimulation = useCallback(() => {
    setEvents([]);
    setIsPlaying(true);
    setIsPaused(false);
    setActiveWorker(null);
    setActiveEvent(null);
  }, []);

  const stopSimulation = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    fetch('http://localhost:8000/api/resume', { method: 'POST' }).catch(() => {});
  }, []);

  // Live Mode SSE Loop
  useEffect(() => {
    let eventSource: EventSource | null = null;
    if (isPlaying && isLiveMode) {
      const objective = encodeURIComponent(taskInput || "Build a Flappy Bird clone");
      eventSource = new EventSource(`http://localhost:8000/stream?mode=live&objective=${objective}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setEvents((prev) => [...prev, data]);
        
        // Update active spotlight if it's a progress or completion event
        if (data.worker) {
          setActiveWorker(data.worker);
          setActiveEvent(data);
        }
        
        // Reload iframe when compiler finished or user edited game file
        if (
          (data.worker === "Compiler Agent" && data.status === "completed") ||
          data.type === 'GAME_FILE_CHANGED'
        ) {
          if (iframeRef.current) {
            setTimeout(() => {
              if (iframeRef.current) iframeRef.current.src = iframeRef.current.src;
            }, 600); // small delay so the file is fully written
          }
        }

        if (data.type === 'ERROR') {
          // On error keep stream open so user can see what happened
          eventSource?.close();
        }
        // DAG_COMPLETED: don't close — keep SSE alive for file-watch events
      };
    }
    return () => eventSource?.close();
  }, [isPlaying, isLiveMode, taskInput]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      
      {/* TOOLBAR */}
      <div style={{ height: '70px', flexShrink: 0, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', background: 'var(--bg-secondary)', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isJudgeMode && (
            <button
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{ background: isSidebarCollapsed ? 'var(--accent-color)' : 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', flexShrink: 0, transition: 'background 0.2s' }}
            >
              <Menu size={16} />
            </button>
          )}
          <Layout size={20} color="var(--text-secondary)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Live Studio Workspace</h1>
          {isJudgeMode && <span style={{ background: 'var(--status-running)', color: 'var(--bg-primary)', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>JUDGE MODE</span>}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <input 
            type="text" 
            value={taskInput} 
            onChange={e => setTaskInput(e.target.value)} 
            placeholder="What should we build?"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '6px', width: '300px' }}
          />
          {!isPlaying ? (
            <button onClick={startSimulation} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--status-running)', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              <Play size={16} /> Run Generation
            </button>
          ) : (
            <>
              <button onClick={togglePause} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isPaused ? 'var(--status-completed)' : '#f59e0b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                {isPaused ? <Play size={16} /> : <Pause size={16} />} {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button onClick={stopSimulation} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--status-failed)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                <Square size={16} /> Stop
              </button>
            </>
          )}
        </div>
      </div>

      <PanelGroup orientation="vertical" style={{ flex: 1 }}>
        {/* TOP HALF */}
        <Panel defaultSize={50} minSize={20}>
          <PanelGroup orientation="horizontal">
            {/* GRAPH */}
            <Panel defaultSize={50} minSize={20} style={{ position: 'relative', background: 'var(--bg-primary)' }}>
              <ExecutionGraph events={events} onNodeClick={setSelectedNodeId} />
            </Panel>
            
            <PanelResizeHandle style={{ width: '4px', cursor: 'col-resize', background: 'var(--border-color)' }} />
            
            {/* TIMELINE */}
            <Panel defaultSize={50} minSize={20} style={{ background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <Clock size={16} /> Event Stream
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {events.map((ev, i) => (
                  <div key={i} style={{ fontSize: '13px', borderLeft: `2px solid ${ev.status === 'failed' ? 'var(--status-failed)' : ev.status === 'completed' ? 'var(--status-completed)' : 'var(--status-running)'}`, paddingLeft: '12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ev.worker || ev.type}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>{ev.message || ev.content || ev.error || (ev.artifact ? 'Produced artifact' : 'Working...')}</div>
                  </div>
                ))}
              </div>
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle style={{ height: '4px', cursor: 'row-resize', background: 'var(--border-color)' }} />

        {/* BOTTOM HALF */}
        <Panel defaultSize={50} minSize={20}>
          <PanelGroup orientation="horizontal">
            {/* SPOTLIGHT */}
            <Panel defaultSize={50} minSize={20} style={{ background: '#1a1a1a', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', flexShrink: 0 }}>
                <Terminal size={16} /> Agent Spotlight
              </div>
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <AnimatePresence mode="wait">
                  {activeWorker ? (
                    <motion.div 
                      key={activeWorker}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}
                    >
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        <Activity color="var(--status-running)" /> {activeWorker} 
                        {activeEvent?.status !== 'completed' && activeEvent?.status !== 'failed' && (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                            <Loader2 color="var(--text-muted)" size={20} />
                          </motion.div>
                        )}
                      </div>
                      
                      <div style={{ background: '#000', borderRadius: '8px', padding: '16px', flex: 1, border: '1px solid var(--border-color)', overflowY: 'auto' }}>
                          <div style={{ color: 'var(--status-running)', fontFamily: 'monospace', marginBottom: '12px' }}>[{activeEvent?.status?.toUpperCase()}] {activeEvent?.message}</div>
                          
                          {activeEvent?.file && (
                              <div style={{ color: '#a1a1aa', fontFamily: 'monospace', marginBottom: '12px' }}>
                                  File: {activeEvent.file}
                              </div>
                          )}
                          
                          {activeEvent?.artifact && (
                              <pre style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                                  {JSON.stringify(activeEvent.artifact, null, 2)}
                              </pre>
                          )}
                          
                          {activeEvent?.error && (
                              <div style={{ color: 'var(--status-failed)', fontFamily: 'monospace' }}>
                                  ERROR: {activeEvent.error}
                              </div>
                          )}
                      </div>
                    </motion.div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                      Waiting for agent activity...
                    </div>
                  )}
                </AnimatePresence>

                {selectedNodeId && (
                  <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '320px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', zIndex: 50, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Chat with Agent</div>
                      <button onClick={() => setSelectedNodeId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }}>&times;</button>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontFamily: 'monospace' }}>Target: {selectedNodeId}</div>
                    <textarea 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)} 
                      placeholder="E.g. Make sure gravity is set to 9.8..."
                      style={{ width: '100%', height: '80px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px', borderRadius: '4px', resize: 'none', marginBottom: '12px', boxSizing: 'border-box' }}
                    />
                    <button onClick={sendChatMessage} disabled={!chatInput.trim()} style={{ width: '100%', background: chatInput.trim() ? 'var(--accent-color)' : 'var(--border-color)', color: chatInput.trim() ? '#fff' : 'var(--text-muted)', border: 'none', padding: '8px', borderRadius: '4px', fontWeight: 600, cursor: chatInput.trim() ? 'pointer' : 'default', transition: 'all 0.2s' }}>Send Instruction</button>
                  </div>
                )}
              </div>
            </Panel>

            <PanelResizeHandle style={{ width: '4px', cursor: 'col-resize', background: 'var(--border-color)' }} />

            {/* GAME RUNTIME */}
            <Panel defaultSize={50} minSize={20} style={{ background: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px', zIndex: 10 }}>
                  <div style={{ background: 'var(--status-completed)', color: '#000', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px' }}>
                      LIVE DEMO
                  </div>
                  <button onClick={() => { if (iframeRef.current) iframeRef.current.src = iframeRef.current.src; }} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '11px', fontWeight: 600, padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                      Reload
                  </button>
              </div>
              <iframe 
                  ref={iframeRef}
                  src="http://localhost:8000/dist_game/index.html" 
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="Game Engine"
                  sandbox="allow-scripts allow-same-origin"
              />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}
