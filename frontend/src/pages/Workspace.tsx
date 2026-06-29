import { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Square, Settings, Layout, Code2, Clock, Terminal, FastForward, Pause, Plus, MonitorPlay, Activity } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ExecutionGraph from '../ExecutionGraph';
import { motion, AnimatePresence } from 'framer-motion';

export default function Workspace() {
  const [events, setEvents] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(true);
  
  const [searchParams] = useSearchParams();
  const isJudgeMode = searchParams.get('judge') === 'true';

  const [taskInput, setTaskInput] = useState('Build a Flappy Bird clone');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeWorker, setActiveWorker] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<any>(null);

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
        
        // Reload iframe if compiler finished
        if (data.worker === "Compiler Agent" && data.status === "completed") {
            if (iframeRef.current) {
                iframeRef.current.src = iframeRef.current.src; // Reload
            }
        }

        if (data.type === 'DAG_COMPLETED' || data.type === 'ERROR') {
          setIsPlaying(false);
          eventSource?.close();
        }
      };
    }
    return () => eventSource?.close();
  }, [isPlaying, isLiveMode, taskInput]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gridTemplateRows: '70px 1fr 1fr', gridTemplateAreas: '"toolbar toolbar" "graph timeline" "spotlight game"', height: '100%', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      
      {/* TOOLBAR */}
      <div style={{ gridArea: 'toolbar', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Layout size={20} color="var(--text-secondary)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Live Studio Workspace</h1>
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
            <button onClick={stopSimulation} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--status-failed)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              <Square size={16} /> Stop
            </button>
          )}
        </div>
      </div>

      {/* GRAPH */}
      <div style={{ gridArea: 'graph', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
        <ExecutionGraph events={events} />
      </div>

      {/* TIMELINE */}
      <div style={{ gridArea: 'timeline', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} /> Event Stream
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {events.map((ev, i) => (
            <div key={i} style={{ fontSize: '13px', borderLeft: `2px solid ${ev.status === 'failed' ? 'var(--status-failed)' : ev.status === 'completed' ? 'var(--status-completed)' : 'var(--status-running)'}`, paddingLeft: '12px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ev.worker || ev.type}</div>
              <div style={{ color: 'var(--text-secondary)' }}>{ev.message || ev.content || (ev.artifact ? 'Produced artifact' : 'Working...')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SPOTLIGHT */}
      <div style={{ gridArea: 'spotlight', borderRight: '1px solid var(--border-color)', background: '#1a1a1a', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)' }}>
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
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Activity color="var(--status-running)" /> {activeWorker}
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
        </div>
      </div>

      {/* GAME RUNTIME */}
      <div style={{ gridArea: 'game', background: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'var(--status-completed)', color: '#000', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', zIndex: 10 }}>
            LIVE DEMO
        </div>
        <iframe 
            ref={iframeRef}
            src="http://localhost:8000/dist_game/index.html" 
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Game Engine"
            sandbox="allow-scripts allow-same-origin"
        />
      </div>

    </div>
  );
}
