import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MonitorPlay } from 'lucide-react';

export default function Play() {
  const { gameId } = useParams();

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      <header className="flex items-center gap-4 p-6 border-b border-white/5 bg-[#252526]">
        <Link 
          to="/workspace"
          className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-medium text-white flex items-center gap-2">
            <MonitorPlay className="w-5 h-5 text-green-400" />
            Game Runtime
          </h1>
          <p className="text-sm text-white/50">Execution ID: {gameId}</p>
        </div>
      </header>

      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="bg-black/50 p-4 rounded-xl border border-white/10 shadow-2xl relative">
          <div className="absolute -top-3 left-4 bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded border border-green-500/30">
            LIVE DEMO
          </div>
          
          <iframe 
            src="http://localhost:8000/dist_game/index.html" 
            className="w-[800px] h-[400px] rounded border border-white/10 bg-[#1a1a1a]"
            title="Game Engine"
            sandbox="allow-scripts allow-same-origin"
          />
          
          <div className="mt-4 text-center text-sm text-white/50 font-mono">
            Click inside the canvas and press SPACE to jump
          </div>
        </div>
      </div>
    </div>
  );
}
