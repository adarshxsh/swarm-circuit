// SwarmCircuit Auto-Generated JS Runtime
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

// --- Capabilities Inferred from DAG ---
const CAPABILITIES = {"has_player": true, "has_physics": true, "has_obstacles": true, "has_score": true};

// --- Game State ---
let isPlaying = false;
let score = 0;
let frames = 0;
let animationId;

// --- Entities ---
const player = {
    x: 100,
    y: 200,
    width: 24,
    height: 24,
    velocity_y: 0,
    gravity: 0.5,
    jump_strength: -8,
    
    update() {
        if (!CAPABILITIES.has_physics) return;
        
        this.velocity_y += this.gravity;
        this.y += this.velocity_y;
        
        // Ceiling and Floor collision (Game Over)
        if (this.y >= canvas.height - this.height || this.y <= 0) {
            gameOver();
        }
    },
    
    jump() {
        this.velocity_y = this.jump_strength;
    },
    
    render() {
        if (!CAPABILITIES.has_player) return;
        ctx.fillStyle = '#facc15'; // yellow bird
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fill();
    }
};

const pipes = [];
const PIPE_SPEED = 3;
const PIPE_WIDTH = 50;
const GAP_SIZE = 120;

function spawnPipe() {
    if (!CAPABILITIES.has_obstacles) return;
    
    const minPipeHeight = 50;
    const maxPipeHeight = canvas.height - GAP_SIZE - minPipeHeight;
    const topPipeHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1) + minPipeHeight);
    
    pipes.push({
        x: canvas.width,
        topHeight: topPipeHeight,
        bottomY: topPipeHeight + GAP_SIZE,
        bottomHeight: canvas.height - (topPipeHeight + GAP_SIZE),
        passed: false
    });
}

function updatePipes() {
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;
        
        // Collision Detection
        if (
            player.x < pipes[i].x + PIPE_WIDTH &&
            player.x + player.width > pipes[i].x &&
            (player.y < pipes[i].topHeight || player.y + player.height > pipes[i].bottomY)
        ) {
            gameOver();
        }
        
        // Score Detection
        if (pipes[i].x + PIPE_WIDTH < player.x && !pipes[i].passed) {
            pipes[i].passed = true;
            if (CAPABILITIES.has_score) {
                score++;
                scoreEl.innerText = score;
            }
        }
        
        // Remove offscreen
        if (pipes[i].x + PIPE_WIDTH < 0) {
            pipes.splice(i, 1);
        }
    }
}

function renderPipes() {
    ctx.fillStyle = '#4ade80';
    for (let pipe of pipes) {
        // Top pipe
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, pipe.bottomHeight);
    }
}

// --- Core Loop ---
function init() {
    score = 0;
    scoreEl.innerText = score;
    frames = 0;
    pipes.length = 0;
    player.y = 200;
    player.velocity_y = 0;
    isPlaying = true;
    
    // Auto jump once to show it's alive
    setTimeout(() => player.jump(), 200);
    
    loop();
}

function loop() {
    if (!isPlaying) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Systems
    player.update();
    
    if (frames % 100 === 0) {
        spawnPipe();
    }
    updatePipes();
    
    // Rendering
    player.render();
    renderPipes();
    
    frames++;
    animationId = requestAnimationFrame(loop);
}

function gameOver() {
    isPlaying = false;
    cancelAnimationFrame(animationId);
    
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
    ctx.font = '16px Arial';
    ctx.fillText('Press SPACE to restart', canvas.width/2, canvas.height/2 + 40);
}

// --- Input ---
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (isPlaying) {
            player.jump();
        } else {
            init();
        }
    }
});

// Auto-start
init();
