"""Unit tests for GodotProjectParser."""
import os
import shutil
import tempfile
import unittest
from core.godot_parser import GodotProjectParser


class TestGodotProjectParser(unittest.TestCase):

    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        
        # Create dummy .tscn file
        self.tscn_path = os.path.join(self.test_dir, "Player.tscn")
        with open(self.tscn_path, "w", encoding="utf-8") as f:
            f.write("""[gd_scene load_steps=2 format=3]

[node name="Player" type="CharacterBody2D"]

[node name="Sprite2D" type="Sprite2D" parent="."]

[connection signal="hit" from="." to="." method="_on_player_hit"]
""")

        # Create dummy .gd file
        self.gd_path = os.path.join(self.test_dir, "player.gd")
        with open(self.gd_path, "w", encoding="utf-8") as f:
            f.write("""extends CharacterBody2D
class_name Player

signal hit
@export var speed: float = 300.0

func _ready():
    print("Player ready")

func _on_player_hit(damage):
    print("Hit for ", damage)
""")

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_scan_and_parse(self):
        parser = GodotProjectParser(self.test_dir)
        stats = parser.scan_project()
        
        self.assertEqual(stats["scene_count"], 1)
        self.assertEqual(stats["script_count"], 1)
        
        # Verify scene parsing
        scenes = parser.scenes["Player.tscn"]
        self.assertEqual(len(scenes), 2)
        self.assertEqual(scenes[0].name, "Player")
        self.assertEqual(scenes[0].node_type, "CharacterBody2D")
        self.assertEqual(scenes[1].name, "Sprite2D")
        self.assertEqual(scenes[1].parent, ".")
        
        conns = parser.connections["Player.tscn"]
        self.assertEqual(len(conns), 1)
        self.assertEqual(conns[0].signal, "hit")
        self.assertEqual(conns[0].method, "_on_player_hit")

    def test_get_context_slice_script(self):
        parser = GodotProjectParser(self.test_dir)
        parser.scan_project()
        
        slice_data = parser.get_context_slice("player.gd", symbol_name="_on_player_hit")
        self.assertEqual(slice_data["symbol"], "_on_player_hit")
        self.assertIn("func _on_player_hit(damage):", slice_data["content"])


if __name__ == "__main__":
    unittest.main()
