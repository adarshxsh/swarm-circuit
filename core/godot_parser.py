"""Godot Project & Scene Tree Parser for SwarmCircuit v2.

Analyzes Godot 4 project directories, parses `.tscn` scene hierarchies and `.gd`
GDScript structures, and extracts minimal targeted context slices for stateless workers.
"""
import os
import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any


@dataclass
class GodotNode:
    """Represents a node in a Godot .tscn scene hierarchy."""
    name: str
    node_type: str
    parent: Optional[str] = None
    script_path: Optional[str] = None
    properties: Dict[str, str] = field(default_factory=dict)


@dataclass
class GodotSignalConnection:
    """Represents a signal connection defined in a scene."""
    signal: str
    from_node: str
    to_node: str
    method: str


@dataclass
class GDScriptFunction:
    """Represents a function definition in a GDScript file."""
    name: str
    start_line: int
    end_line: int # Estimated end line
    args: List[str]
    docstring: Optional[str] = None


@dataclass
class GDScriptSummary:
    """Summary metadata for a .gd file."""
    file_path: str
    extends: Optional[str] = None
    class_name: Optional[str] = None
    signals: List[str] = field(default_factory=list)
    exports: List[str] = field(default_factory=list)
    functions: Dict[str, GDScriptFunction] = field(default_factory=dict)
    total_lines: int = 0


class GodotProjectParser:
    """Parses Godot projects to generate dependency graphs and context slices."""

    def __init__(self, project_root: str):
        self.project_root = os.path.abspath(project_root)
        self.scenes: Dict[str, List[GodotNode]] = {}
        self.connections: Dict[str, List[GodotSignalConnection]] = {}
        self.scripts: Dict[str, GDScriptSummary] = {}

    def scan_project(self) -> Dict[str, Any]:
        """Scans the project directory for scenes and scripts."""
        if not os.path.exists(self.project_root):
            raise FileNotFoundError(f"Project root not found: {self.project_root}")

        for root, _, files in os.walk(self.project_root):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, self.project_root)
                if file.endswith(".tscn"):
                    self.parse_tscn(full_path, rel_path)
                elif file.endswith(".gd"):
                    self.parse_gdscript(full_path, rel_path)

        return {
            "metadata": {
                "scene_count": len(self.scenes),
                "script_count": len(self.scripts)
            },
            "scenes": {
                path: [vars(node) for node in nodes] 
                for path, nodes in self.scenes.items()
            },
            "connections": {
                path: [vars(conn) for conn in conns]
                for path, conns in self.connections.items()
            },
            "scripts": {
                path: {
                    "extends": summary.extends,
                    "class_name": summary.class_name,
                    "signals": summary.signals,
                    "exports": summary.exports,
                    "functions": {
                        fname: vars(finfo) 
                        for fname, finfo in summary.functions.items()
                    },
                    "total_lines": summary.total_lines
                }
                for path, summary in self.scripts.items()
            }
        }

    def parse_tscn(self, file_path: str, rel_path: str) -> List[GodotNode]:
        """Parses a Godot .tscn text scene file."""
        nodes: List[GodotNode] = []
        connections: List[GodotSignalConnection] = []
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception:
            return nodes

        # Match nodes e.g. [node name="Player" type="CharacterBody2D" parent="."]
        node_pattern = re.compile(r'\[node\s+name="([^"]+)"(?:\s+type="([^"]+)")?(?:\s+parent="([^"]+)")?.*\]')
        for match in node_pattern.finditer(content):
            name, ntype, parent = match.groups()
            nodes.append(GodotNode(
                name=name,
                node_type=ntype or "Node",
                parent=parent
            ))

        # Match connections e.g. [connection signal="hit" from="Player" to="." method="_on_player_hit"]
        conn_pattern = re.compile(r'\[connection\s+signal="([^"]+)"\s+from="([^"]+)"\s+to="([^"]+)"\s+method="([^"]+)"\]')
        for match in conn_pattern.finditer(content):
            sig, f_node, t_node, method = match.groups()
            connections.append(GodotSignalConnection(sig, f_node, t_node, method))

        self.scenes[rel_path] = nodes
        self.connections[rel_path] = connections
        return nodes

    def parse_gdscript(self, file_path: str, rel_path: str) -> GDScriptSummary:
        """Parses a .gd script file to extract structure and functions."""
        summary = GDScriptSummary(file_path=rel_path)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
        except Exception:
            return summary

        summary.total_lines = len(lines)
        current_func: Optional[GDScriptFunction] = None

        for idx, line in enumerate(lines):
            line_num = idx + 1
            stripped = line.strip()

            if stripped.startswith("extends "):
                summary.extends = stripped.split("extends ")[1].strip()
            elif stripped.startswith("class_name "):
                summary.class_name = stripped.split("class_name ")[1].strip()
            elif stripped.startswith("signal "):
                summary.signals.append(stripped)
            elif stripped.startswith("@export") or stripped.startswith("export"):
                summary.exports.append(stripped)
            elif stripped.startswith("func "):
                if current_func:
                    current_func.end_line = line_num - 1
                
                # Match func name(args):
                func_match = re.match(r'func\s+([a-zA-Z0-9__]+)\s*\((.*?)\)', stripped)
                if func_match:
                    fname, fargs = func_match.groups()
                    args_list = [a.strip() for a in fargs.split(",") if a.strip()]
                    current_func = GDScriptFunction(
                        name=fname,
                        start_line=line_num,
                        end_line=len(lines),
                        args=args_list
                    )
                    summary.functions[fname] = current_func

        if current_func:
            current_func.end_line = len(lines)

        self.scripts[rel_path] = summary
        return summary

    def get_context_slice(self, rel_path: str, symbol_name: Optional[str] = None) -> Dict[str, Any]:
        """Extracts minimal slice of code or scene hierarchy for stateless workers."""
        if rel_path in self.scenes:
            nodes = self.scenes[rel_path]
            conns = self.connections.get(rel_path, [])
            if symbol_name:
                nodes = [n for n in nodes if n.name == symbol_name]
            return {
                "file_type": "scene",
                "path": rel_path,
                "nodes": [vars(n) for n in nodes],
                "connections": [vars(c) for c in conns]
            }
        elif rel_path in self.scripts:
            summary = self.scripts[rel_path]
            full_path = os.path.join(self.project_root, rel_path)
            
            with open(full_path, "r", encoding="utf-8") as f:
                lines = f.readlines()

            if symbol_name and symbol_name in summary.functions:
                func = summary.functions[symbol_name]
                slice_lines = lines[func.start_line - 1 : func.end_line]
                return {
                    "file_type": "script",
                    "path": rel_path,
                    "symbol": symbol_name,
                    "start_line": func.start_line,
                    "end_line": func.end_line,
                    "content": "".join(slice_lines)
                }
            else:
                return {
                    "file_type": "script",
                    "path": rel_path,
                    "summary": {
                        "class_name": summary.class_name,
                        "extends": summary.extends,
                        "signals": summary.signals,
                        "exports": summary.exports,
                        "functions": list(summary.functions.keys())
                    },
                    "content": "".join(lines[: min(50, len(lines))]) + ("\n... [truncated]" if len(lines) > 50 else "")
                }
        else:
            raise ValueError(f"File not parsed or found in project: {rel_path}")
