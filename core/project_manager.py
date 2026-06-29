import os
import json
import shutil
from typing import Dict, List, Any

class ProjectManager:
    """Manages the lifecycle, creation, and selection of SwarmCircuit active projects."""
    
    def __init__(self, root_dir: str = "."):
        self.root_dir = os.path.abspath(root_dir)
        self.registry_path = os.path.join(self.root_dir, "projects.json")
        self.projects: List[Dict[str, Any]] = []
        self.active_project_id: str = ""
        self._load_registry()
        
    def _load_registry(self):
        if os.path.exists(self.registry_path):
            with open(self.registry_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.projects = data.get("projects", [])
                self.active_project_id = data.get("active_project_id", "")
        else:
            # Seed with the mock project for legacy compatibility if it exists
            mock_path = os.path.join(self.root_dir, "mock_godot_game")
            if os.path.exists(mock_path):
                self.projects = [{
                    "id": "mock_godot_game",
                    "name": "Mock Godot Game",
                    "engine": "Godot 4.x",
                    "path": mock_path
                }]
                self.active_project_id = "mock_godot_game"
                self._save_registry()
                
    def _save_registry(self):
        with open(self.registry_path, "w", encoding="utf-8") as f:
            json.dump({
                "projects": self.projects,
                "active_project_id": self.active_project_id
            }, f, indent=2)

    def get_projects(self) -> List[Dict[str, Any]]:
        return self.projects

    def get_active_project(self) -> Dict[str, Any]:
        for p in self.projects:
            if p["id"] == self.active_project_id:
                return p
        return self.projects[0] if self.projects else {}

    def set_active_project(self, project_id: str) -> bool:
        for p in self.projects:
            if p["id"] == project_id:
                self.active_project_id = project_id
                self._save_registry()
                return True
        return False

    def create_project(self, name: str, engine: str = "Godot 4.x") -> Dict[str, Any]:
        """Creates a new project directory and scaffolds the necessary files."""
        project_id = name.lower().replace(" ", "_").replace("-", "_")
        project_path = os.path.join(self.root_dir, project_id)
        
        if os.path.exists(project_path):
            raise ValueError(f"Project directory {project_id} already exists.")
            
        # 1. Create base directories
        os.makedirs(project_path)
        os.makedirs(os.path.join(project_path, ".swarm", "memory"))
        
        # 2. Scaffold a basic project.godot
        godot_project_content = f"""config_version=5

[application]

config/name="{name}"
"""
        with open(os.path.join(project_path, "project.godot"), "w") as f:
            f.write(godot_project_content)
            
        # 3. Initialize Memory schemas
        memory_dir = os.path.join(project_path, ".swarm", "memory")
        
        with open(os.path.join(memory_dir, "project_bible.json"), "w") as f:
            json.dump({
                "creativeDirection": {"corePillars": []},
                "system_notes": []
            }, f, indent=2)
            
        with open(os.path.join(memory_dir, "architecture_graph.json"), "w") as f:
            json.dump({
                "metadata": {"scene_count": 0, "script_count": 0},
                "scenes": {},
                "connections": {},
                "scripts": {},
                "semantic_edges": []
            }, f, indent=2)
            
        # 4. Register
        new_project = {
            "id": project_id,
            "name": name,
            "engine": engine,
            "path": project_path
        }
        self.projects.append(new_project)
        self.active_project_id = project_id
        self._save_registry()
        
        return new_project
