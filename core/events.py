import time
from dataclasses import dataclass, field, asdict
from typing import Dict, Any, Optional

@dataclass
class SwarmEvent:
    """Base class for all SwarmCircuit events."""
    worker: str
    status: str
    message: str
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class WorkerProgressEvent(SwarmEvent):
    """Emitted when a worker is actively processing a file or task."""
    file: Optional[str] = None
    progress: int = 0

@dataclass
class WorkerCompletionEvent(SwarmEvent):
    """Emitted when a worker finishes a task."""
    artifact: Optional[Dict[str, Any]] = None

@dataclass
class WorkerErrorEvent(SwarmEvent):
    """Emitted when a worker encounters an error."""
    error: str = ""

@dataclass
class QAIssueEvent(SwarmEvent):
    """Emitted by the QA agent when a bug is found."""
    severity: str = "warning"
