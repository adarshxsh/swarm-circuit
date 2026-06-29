import os
from core.game_exporter import GameExporter

class MockArtifact:
    def __init__(self, role):
        self.producer_role = role

artifacts = {
    "node_1": MockArtifact("Gameplay Engineer"),
    "node_2": MockArtifact("AI Systems Engineer"),
}

exporter = GameExporter(os.path.abspath("."))
exporter.export_game(artifacts)
