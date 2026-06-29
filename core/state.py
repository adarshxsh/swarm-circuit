from typing import Dict, List
import threading

class GlobalState:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(GlobalState, cls).__new__(cls)
                cls._instance.is_paused = False
                cls._instance.chat_inbox = {}
        return cls._instance

    def toggle_pause(self):
        self.is_paused = not self.is_paused
        return self.is_paused

    def set_pause(self, state: bool):
        self.is_paused = state

    def add_chat_message(self, node_id: str, message: str):
        if node_id not in self.chat_inbox:
            self.chat_inbox[node_id] = []
        self.chat_inbox[node_id].append(message)

    def get_and_clear_chat_messages(self, node_id: str) -> List[str]:
        if node_id in self.chat_inbox:
            messages = self.chat_inbox[node_id]
            self.chat_inbox[node_id] = []
            return messages
        return []

    def clear(self):
        self.is_paused = False
        self.chat_inbox.clear()

    def wait_for_rate_limit(self):
        import time
        with self._lock:
            now = time.time()
            elapsed = now - getattr(self, '_last_api_call', 0)
            if elapsed < 1.0: # Enforce 1 call per second (60 RPM)
                time.sleep(1.0 - elapsed)
            self._last_api_call = time.time()

global_state = GlobalState()
