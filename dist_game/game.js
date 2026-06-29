const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const STATE = {
    metrics: {
        public_trust: 50,
        social_tension: 50,
        economy: 50,
        corruption: 50,
        media_control: 50,
        government_stability: 50
    },
    risks: {
        riot: 0,
        economic: 0,
        collapse: 0,
        media: 0,
        polarization: 0
    },
    turn: 1,
    logs: ["SYSTEM INITIALIZED: SITUATION ROOM ACTIVE"],
    isGameOver: false,
    gameOverReason: ""
};

const COLORS = {
    bg: '#0a0a0a',
    text: '#00ff41',
    accent: '#008f11',
    danger: '#ff0000',
    warning: '#ffff00',
    panel: '#1a1a1a'
};

function calculateRisks() {
    const m = STATE.metrics;
    STATE.risks.riot = (m.social_tension * 0.6) + (100 - m.public_trust) * 0.4;
    STATE.risks.economic = (100 - m.economy) * 0.7 + (m.corruption * 0.3);
    STATE.risks.collapse = (100 - m.government_stability) * 0.8 + (m.social_tension * 0.2);
    STATE.risks.media = (100 - m.media_control) * 0.5 + (100 - m.public_trust) * 0.5;
    STATE.risks.polarization = (m.social_tension * 0.5) + (m.corruption * 0.5);
}

function checkGameOver() {
    for (let key in STATE.metrics) {
        if (STATE.metrics[key] <= 0) {
            STATE.isGameOver = true;
            STATE.gameOverReason = `CRITICAL COLLAPSE: ${key.toUpperCase()} REACHED ZERO`;
            return;
        }
    }
    if (STATE.metrics.government_stability < 20) {
        STATE.isGameOver = true;
        STATE.gameOverReason = "GOVERNMENT COLLAPSED DUE TO INSTABILITY";
    }
}

function simulateTurn() {
    if (STATE.isGameOver) return;

    // Deterministic drift
    for (let key in STATE.metrics) {
        STATE.metrics[key] += (Math.random() * 4 - 2);
        STATE.metrics[key] = Math.max(0, Math.min(100, STATE.metrics[key]));
    }

    STATE.turn++;
    calculateRisks();
    checkGameOver();
    STATE.logs.unshift(`Turn ${STATE.turn}: State updated. Stability at ${STATE.metrics.government_stability.toFixed(1)}%`);
    if (STATE.logs.length > 10) STATE.logs.pop();
}

function draw() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const margin = canvas.width * 0.05;
    const colWidth = (canvas.width - (margin * 3)) / 2;
    const rowHeight = canvas.height * 0.12;

    // Header
    ctx.fillStyle = COLORS.text;
    ctx.font = `bold ${canvas.height * 0.04}px monospace`;
    ctx.fillText("CATALYST: GOVERNMENT SITUATION ROOM", margin, margin + (canvas.height * 0.04));
    ctx.font = `${canvas.height * 0.02}px monospace`;
    ctx.fillText(`TURN: ${STATE.turn} | STATUS: ${STATE.isGameOver ? 'TERMINATED' : 'ACTIVE'}`, margin, margin + (canvas.height * 0.07));

    // Metrics Panel
    ctx.fillStyle = COLORS.panel;
    ctx.fillRect(margin, canvas.height * 0.1, colWidth, canvas.height * 0.6);
    ctx.strokeStyle = COLORS.accent;
    ctx.strokeRect(margin, canvas.height * 0.1, colWidth, canvas.height * 0.6);

    ctx.fillStyle = COLORS.text;
    ctx.font = `${canvas.height * 0.025}px monospace`;
    ctx.fillText("SYSTEM METRICS", margin + 20, canvas.height * 0.14);

    let i = 0;
    for (let key in STATE.metrics) {
        const val = STATE.metrics[key];
        const y = canvas.height * 0.2 + (i * rowHeight);
        const barWidth = colWidth * 0.7;
        
        ctx.fillStyle = COLORS.text;
        ctx.fillText(key.replace('_', ' ').toUpperCase(), margin + 20, y);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(margin + 20, y + 10, barWidth, 10);
        
        ctx.fillStyle = val < 30 ? COLORS.danger : (val < 60 ? COLORS.warning : COLORS.text);
        ctx.fillRect(margin + 20, y + 10, barWidth * (val / 100), 10);
        
        ctx.fillStyle = COLORS.text;
        ctx.fillText(`${val.toFixed(1)}%`, margin + 20 + barWidth + 10, y + 18);
        i++;
    }

    // Risks Panel
    ctx.fillStyle = COLORS.panel;
    ctx.fillRect(margin * 2 + colWidth, canvas.height * 0.1, colWidth, canvas.height * 0.6);
    ctx.strokeStyle = COLORS.accent;
    ctx.strokeRect(margin * 2 + colWidth, canvas.height * 0.1, colWidth, canvas.height * 0.6);

    ctx.fillStyle = COLORS.text;
    ctx.fillText("RISK VECTORS", margin * 2 + colWidth + 20, canvas.height * 0.14);

    let j = 0;
    for (let key