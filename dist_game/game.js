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
    x: 50,
    y: 300,
    width: 30,
    height: 30,
    velocity_y: 0,
    gravity: 0.6,
    jump_strength: -12,
    isGrounded: true,
    
    update() {
        if (!CAPABILITIES.has_physics) return;
        
        this.velocity_y += this.gravity;
        this.y += this.velocity_y;
        
        // Floor collision
        if (this.y >= 370 - this.height) {
            this.y = 370 - this.height;
            this.velocity_y = 0;
            this.isGrounded = true;
        }
    },
    
    jump() {
        if (this.isGrounded) {
            this.velocity_y = this.jump_strength;
            this.isGrounded = false;
        }
    },
    
    render() {
        if (!CAPABILITIES.has_player) return;
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
};

const obstacles = [];
const OBSTACLE_SPEED = 5;

function spawnObstacle() {
    if (!CAPABILITIES.has_obstacles) return;
    
    obstacles.push({
        x: canvas.width,
        y: 340, // Base y
        width: 20 + Math.random() * 20,
        height: 30 + Math.random() * 40
    });
}

function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= OBSTACLE_SPEED;
        
        // Collision Detection
        if (
            player.x < obstacles[i].x + obstacles[i].width &&
            player.x + player.width > obstacles[i].x &&
            player.y < obstacles[i].y + obstacles[i].height &&
            player.y + player.height > obstacles[i].y
        ) {
            gameOver();
        }
        
        // Remove offscreen
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            if (CAPABILITIES.has_score) {
                score++;
                scoreEl.innerText = score;
            }
        }
    }
}

function renderObstacles() {
    ctx.fillStyle = '#ef4444';
    for (let obs of obstacles) {
        // Ensure obstacles sit on the floor
        ctx.fillRect(obs.x, 370 - obs.height, obs.width, obs.height);
    }
}

function drawFloor() {
    ctx.fillStyle = '#666';
    ctx.fillRect(0, 370, canvas.width, 30);
}

// --- Core Loop ---
function init() {
    score = 0;
    scoreEl.innerText = score;
    frames = 0;
    obstacles.length = 0;
    player.y = 370 - player.height;
    player.velocity_y = 0;
    isPlaying = true;
    
    // Auto jump once to show it's alive
    setTimeout(() => player.jump(), 500);
    
    loop();
}

function loop() {
    if (!isPlaying) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Systems
    player.update();
    
    if (frames % 90 === 0) {
        spawnObstacle();
    }
    updateObstacles();
    
    // Rendering
    drawFloor();
    player.render();
    renderObstacles();
    
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
