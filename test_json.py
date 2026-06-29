import json
from dataclasses import dataclass

@dataclass
class WorkerArtifact:
    val: str

artifacts = {"node_1": WorkerArtifact(val="test")}
json.dumps(artifacts)
