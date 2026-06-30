(function() {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    const state = {
        metrics: {
            public_trust: 50,
            social_tension: 50,
            economy: 50,
            corruption: 50,
            media_control: 50,
            government_stability: 50
        },
        factions: [
            { id: 'zealot', name: 'Zealots', color: '#EF4444', weight: 0.3, x: 0, y: 0 },
            { id: 'bureaucrat', name: 'Bureaucrats', color: '#3B82F6', weight: 0.4, x: 0, y: 0 },
            { id: 'oligarch', name: 'Oligarchs', color: '#F59E0B', weight: 0.3, x: 0, y: 0 }
        ],
        directives: [
            { text: "Implement Austerity", effect: { economy: 5, social_tension: 10, public_trust: -5 } },
            { text: "Expand Social Welfare", effect: { economy: -10, social_tension: -10, public_trust: 10 } },
            { text: "Crackdown on Dissent", effect: { media_control: 15, government_stability: 5, public_trust: -15 } },
            { text: "Anti-Corruption Purge", effect: { corruption: -15, government_stability: -10, public_trust: 10 } }
        ],
        logs: ["Welcome to CATALYST Situation Room. Awaiting Directive..."],
        lastUpdate: 0
    };

    const cascadeRules = [
        { condition: (s) => s.social_tension > 75 && s.public_trust < 30, effect: { government_stability: -0.1 }, label: "Cascade Instability" },
        { condition: (s) => s.economy < 20, effect: { social_tension: 0.1 }, label: "Economic Desperation" },
        { condition: (s) => s.corruption > 80, effect: { public_trust: -0.1 }, label: "Endemic Corruption" },
        { condition: (s) => s.media_control > 70, effect: { government_stability: 0.1 }, label: "Regime Stabilization" }
    ];

    function onResize() {
        state.factions.forEach((f, i) => {
            f.x = canvas.width * (0.2 + i * 0.3);
            f.y = canvas.height * 0.6;
        });
    }

    window.addEventListener('resize', onResize);
    onResize();

    function applyDirective(dir) {
        for (let key in dir.effect) {
            state.metrics[key] = Math.max(0, Math.min(100, state.metrics[key] + dir.effect[key]));
        }
        state.logs.push(`Directive: ${dir.text} executed.`);
        if (state.logs.length > 5) state.logs.shift();
    }

    function update(time) {
        const dt = time - state.lastUpdate;
        state.lastUpdate = time;

        cascadeRules.forEach(rule => {
            if (rule.condition(state.metrics)) {
                for (let key in rule.effect) {
                    state.metrics[key] = Math.max(0, Math.min(100, state.metrics[key] + rule.effect[key]));
                }
            }
        });

        draw();
        requestAnimationFrame(update);
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Metrics
        const metricKeys = Object.keys(state.metrics);
        const barWidth = canvas.width * 0.1;
        const barHeight = canvas.height * 0.2;
        const startX = canvas.width * 0.05;
        const startY = canvas.height * 0.1;

        metricKeys.forEach((key, i) => {
            const x = startX + i * (barWidth + canvas.width * 0.02);
            const val = state.metrics[key];
            
            ctx.fillStyle = '#334155';
            ctx.fillRect(x, startY, barWidth, barHeight);
            ctx.fillStyle = '#60a5fa';
            ctx.fillRect(x, startY + barHeight * (1 - val/100), barWidth, barHeight * (val/100));
            
            ctx.fillStyle = '#f8fafc';
            ctx.font = `${canvas.width * 0.01}px monospace`;
            ctx.fillText(key.replace('_', ' '), x, startY - 10);
            ctx.fillText(`${Math.round(val)}%`, x, startY + barHeight + 20);
        });

        // Draw Factions
        state.factions.forEach(f => {
            ctx.beginPath();
            ctx.arc(f.x, f.y, canvas.width * 0.04, 0, Math.PI * 2);
            ctx.fillStyle = f.color;
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(f.name, f.x, f.y + canvas.width * 0.06);
        });

        // Draw UI / Directives
        ctx.textAlign = 'left';
        ctx.fillStyle = '#94a3b8';
        ctx.font = `${canvas.width * 0.015}px monospace`;
        ctx.fillText("SITUATION ROOM: SELECT DIRECTIVE", canvas.width * 0.05, canvas.height * 0.8);

        state.directives.forEach((dir, i) => {
            const x = canvas.width * 0.05;
            const y = canvas.height * 0.8