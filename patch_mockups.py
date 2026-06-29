import os

overlay = """
      {/* COMING SOON OVERLAY */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
        <h2 style={{ fontSize: '32px', color: 'var(--text-primary)', marginBottom: '16px' }}>Work In Progress</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '400px', textAlign: 'center', lineHeight: '1.5' }}>This tab is a visual mockup for the SwarmCircuit vision. We are currently focusing backend development on the core Workspace Execution Graph and Memory Systems.</p>
      </div>
"""

files = [
    "frontend/src/pages/Fleet.tsx",
    "frontend/src/pages/Artifacts.tsx",
    "frontend/src/pages/History.tsx",
    "frontend/src/pages/MergeCenter.tsx"
]

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()
    
    # Inject position: relative if needed
    if "gridColumn: '2 / -1'" in content and "position: 'relative'" not in content:
        content = content.replace("background: 'var(--bg-primary)' }", "background: 'var(--bg-primary)', position: 'relative' }")
        
    # Inject overlay after the first opening div
    idx = content.find("<div style={{ gridColumn: '2 / -1'")
    if idx != -1:
        end_idx = content.find(">", idx) + 1
        content = content[:end_idx] + overlay + content[end_idx:]
        
    with open(file_path, "w") as f:
        f.write(content)

print("Patched mockup pages.")
