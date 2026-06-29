import { useMemo, useEffect, useState } from 'react';
import ReactFlow, { Background, Controls, Handle, Position, MarkerType, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { Bot, UserCog, Beaker, CheckCircle2, Clock, PlayCircle, XCircle, Code2 } from 'lucide-react';
import clsx from 'clsx';

// Custom Node for Workers
const WorkerNode = ({ data }: any) => {
  const isRunning = data.status === 'RUNNING';
  const isCompleted = data.status === 'SUCCESS';
  const isFailed = data.status === 'FAILED';
  
  return (
    <div className={clsx(
      "panel",
      isRunning && "animate-pulse"
    )} style={{ 
      padding: '12px', 
      borderRadius: '8px', 
      width: '192px', 
      border: `2px solid ${isRunning ? 'var(--accent-color)' : isCompleted ? 'var(--status-completed)' : isFailed ? 'var(--status-failed)' : 'var(--border-color)'}`,
      opacity: data.status === 'PENDING' ? 0.8 : 1,
      transition: 'all 0.3s ease',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
    }}>
      
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-border-highlight" />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{ 
          color: isRunning ? 'var(--accent-color)' : isCompleted ? 'var(--status-completed)' : 'var(--text-secondary)'
        }}>
          {data.role === 'Technical Architect' && <UserCog size={18} />}
          {data.role.includes('Engineer') && <Code2 size={18} />}
          {data.role.includes('QA') && <Beaker size={18} />}
          {data.role === 'Documentation Agent' && <Bot size={18} />}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {data.role}
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isCompleted ? <CheckCircle2 size={12} color="var(--status-completed)" /> : 
           isRunning ? <PlayCircle size={12} color="var(--accent-color)" /> : 
           isFailed ? <XCircle size={12} color="var(--status-failed)" /> :
           <Clock size={12} />}
          <span>{data.status}</span>
        </div>
        {data.duration && <span>{data.duration}ms</span>}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-border-highlight" />
    </div>
  );
};

const nodeTypes = {
  worker: WorkerNode
};

export default function ExecutionGraph({ events, onNodeClick }: { events: any[], onNodeClick?: (nodeId: string) => void }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    // Process events to build graph
    const newNodes: any[] = [];
    const newEdges: any[] = [];
    
    // Very simplified hardcoded layout for the standard SwarmCircuit DAG
    const layoutMap: Record<string, { x: number, y: number }> = {
      "dag_prop_live_run_01": { x: 250, y: 50 },
      "dag_prop_live_run_02": { x: 250, y: 150 },
      "dag_prop_live_run_03_qa": { x: 100, y: 250 },
      "dag_prop_live_run_03_perf": { x: 400, y: 250 },
      "dag_prop_live_run_04_docs": { x: 250, y: 350 },
      "dag_prop_live_run_05_exec": { x: 250, y: 450 }
    };
    
    // We can extract nodes from the DAG_STARTED event
    const startEvent = events.find(e => e.type === 'DAG_STARTED');
    if (startEvent && startEvent.nodes) {
      Object.entries(startEvent.nodes).forEach(([nodeId, role]) => {
        // Find latest status in events
        let status = 'PENDING';
        let duration = null;
        
        const nodeEvents = events.filter(e => e.node_id === nodeId);
        if (nodeEvents.some(e => e.type === 'NODE_COMPLETED')) {
          status = 'SUCCESS';
        } else if (nodeEvents.some(e => e.type === 'NODE_FAILED')) {
          status = 'FAILED';
        } else if (nodeEvents.some(e => e.type === 'NODE_STARTED')) {
          status = 'RUNNING';
        }

        const completedEvent = nodeEvents.find(e => e.type === 'NODE_COMPLETED');
        if (completedEvent && completedEvent.artifact) {
            duration = completedEvent.artifact.execution_time_ms;
        }

        newNodes.push({
          id: nodeId,
          type: 'worker',
          position: layoutMap[nodeId] || { x: 0, y: 0 },
          data: { role, status, duration }
        });
      });

      // Standard DAG edges
      const edgeDefs = [
        { source: "dag_prop_live_run_01", target: "dag_prop_live_run_02" },
        { source: "dag_prop_live_run_02", target: "dag_prop_live_run_03_qa" },
        { source: "dag_prop_live_run_02", target: "dag_prop_live_run_03_perf" },
        { source: "dag_prop_live_run_03_qa", target: "dag_prop_live_run_04_docs" },
        { source: "dag_prop_live_run_03_perf", target: "dag_prop_live_run_04_docs" },
        { source: "dag_prop_live_run_04_docs", target: "dag_prop_live_run_05_exec" }
      ];

      edgeDefs.forEach(ed => {
        newEdges.push({
          id: `e-${ed.source}-${ed.target}`,
          source: ed.source,
          target: ed.target,
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'var(--border-highlight)', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--border-highlight)' }
        });
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [events]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onNodeClick?.(node.id)}
        fitView
      >
        <Background color="var(--border-highlight)" gap={24} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
