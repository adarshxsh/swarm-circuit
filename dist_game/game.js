// SwarmCircuit Compiler Agent (Mock Output)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

ctx.fillStyle = '#1e1e1e';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#4ade80';
ctx.font = '24px monospace';
ctx.textAlign = 'center';
ctx.fillText('SwarmCircuit Build Successful!', canvas.width/2, canvas.height/2);
ctx.fillStyle = '#a1a1aa';
ctx.font = '14px monospace';
ctx.fillText('(Compiler Agent invoked fallback mock)', canvas.width/2, canvas.height/2 + 30);
