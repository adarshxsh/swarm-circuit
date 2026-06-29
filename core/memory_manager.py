import os
import json
import time
import shutil
import tempfile
from typing import Dict, Any, Optional
from core.godot_parser import GodotProjectParser

class MemoryManager:
    """Manages continuous persistent filesystem memory for SwarmCircuit agents."""

    def __init__(self, project_root: str):
        self.project_root = os.path.abspath(project_root)
        self.swarm_dir = os.path.join(self.project_root, ".swarm")
        self.memory_dir = os.path.join(self.swarm_dir, "memory")
        self.cache_dir = os.path.join(self.swarm_dir, "cache")
        
        self._ensure_directories()
        
        # In-memory cache to avoid disk reads
        self._cache: Dict[str, Any] = {}

    def _ensure_directories(self):
        """Creates the necessary .swarm directories if they do not exist."""
        os.makedirs(self.memory_dir, exist_ok=True)
        os.makedirs(self.cache_dir, exist_ok=True)

    def _atomic_write_json(self, file_path: str, data: Any):
        """Writes JSON data atomically to prevent corruption."""
        fd, temp_path = tempfile.mkstemp(dir=os.path.dirname(file_path), text=True)
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        os.replace(temp_path, file_path)

    def _atomic_append_jsonl(self, file_path: str, data: Any):
        """Appends a JSON object as a new line atomically-ish using file locks if needed.
        For hackathon simplicity, we do a simple append since workers run serially in memory,
        but real implementations use portalocker.
        """
        with open(file_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(data) + '\n')

    def read_json(self, filename: str) -> Optional[Any]:
        """Reads a JSON file from the memory directory, utilizing the cache."""
        if filename in self._cache:
            return self._cache[filename]
            
        file_path = os.path.join(self.memory_dir, filename)
        if not os.path.exists(file_path):
            return None
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self._cache[filename] = data
                return data
        except (json.JSONDecodeError, IOError):
            return None

    def write_json(self, filename: str, data: Any):
        """Writes data to a JSON file in the memory directory."""
        file_path = os.path.join(self.memory_dir, filename)
        self._atomic_write_json(file_path, data)
        self._cache[filename] = data

    def log_execution(self, log_entry: Dict[str, Any]):
        """Appends an execution result to execution_history.jsonl."""
        file_path = os.path.join(self.memory_dir, "execution_history.jsonl")
        log_entry["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        self._atomic_append_jsonl(file_path, log_entry)

    def update_architecture_graph(self, force_full: bool = False):
        """Extracts AST from the Godot project and saves it to architecture_graph.json.
        Performs incremental updates by checking file modification times.
        """
        parser = GodotProjectParser(self.project_root)
        
        # In a real incremental setup, we'd check cache modified times against os.path.getmtime(file).
        # For simplicity in this iteration, we use the parser which is extremely fast on small projects.
        graph_data = parser.scan_project()
        
        # PRESERVE AI-inferred semantic edges before overwriting
        existing_graph = self.read_json("architecture_graph.json")
        if existing_graph and "semantic_edges" in existing_graph:
            graph_data["semantic_edges"] = existing_graph["semantic_edges"]
        else:
            graph_data["semantic_edges"] = []
            
        self.write_json("architecture_graph.json", graph_data)
        
        # After updating the raw graph, we check if the Project Bible needs an update
        self._ensure_project_bible(graph_data)
        return graph_data

    def _ensure_project_bible(self, graph_data: Dict[str, Any]):
        """Generates the initial project_bible.json if it doesn't exist."""
        bible = self.read_json("project_bible.json")
        if bible is None:
            # Generate a skeleton bible based on the scanned project
            bible = {
                "projectName": os.path.basename(self.project_root),
                "version": "0.1.0",
                "creativeDirection": {
                    "genre": "Unknown",
                    "coreMechanics": [],
                    "targetAudience": "Unknown"
                },
                "techStack": {
                    "engine": "Godot 4",
                    "language": "GDScript"
                },
                "invariants": [
                    "All signal names must be snake_case.",
                    "No cyclical dependencies between scenes."
                ],
                "auto_generated_summary": f"Project contains {graph_data.get('metadata', {}).get('scene_count', 0)} scenes and {graph_data.get('metadata', {}).get('script_count', 0)} scripts."
            }
            self.write_json("project_bible.json", bible)

    def get_worker_context_payload(self, task_id: str, role: str, objective: str) -> Dict[str, Any]:
        """Constructs the exact JSON payload to be injected into a stateless worker prompt."""
        bible = self.read_json("project_bible.json") or {}
        graph = self.read_json("architecture_graph.json") or {}
        
        return {
            "taskId": task_id,
            "role": role,
            "objective": objective,
            "projectSummary": bible.get("creativeDirection", {}),
            "invariants": bible.get("invariants", []),
            "relevantFiles": [], # This would be populated by querying the architecture_graph based on objective keywords
            "upstreamArtifacts": []
        }
