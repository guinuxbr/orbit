// src/gravity.js

export function createParticle(width, height) {
    return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1,
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.5 - 0.25,
        angle: Math.random() * Math.PI * 2,
        orbitRadius: Math.random() * (Math.max(width, height)) + 100,
        baseSpeed: Math.random() * 0.002 + 0.0005,
    };
}

export function animateGravity(state, dom) {
    const { gravityCtx, gravityCanvas } = dom;
    if (!gravityCtx || !gravityCanvas) return;

    gravityCtx.clearRect(0, 0, gravityCanvas.width, gravityCanvas.height);

    const centerX = gravityCanvas.width / 2;
    const centerY = gravityCanvas.height / 2;

    // Primary color for particles, pulled from CSS variable
    const rootStyle = getComputedStyle(document.documentElement);
    let pColor = rootStyle.getPropertyValue('--color-primary').trim() || '#00a489';

    gravityCtx.fillStyle = pColor;

    // Speed multiplier based on wheel spin state
    const speedMultiplier = state.isSpinning ? 15 : 1;

    for (let p of state.particles) {
        // Determine the center offset
        const dx = centerX - p.x;
        const dy = centerY - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Gravity vector towards center
        // let forceDirectionX = dx / distance;
        // let forceDirectionY = dy / distance;

        // Calculate orbital motion 
        p.angle += p.baseSpeed * speedMultiplier;

        // Instead of free-floating, let's make them loosely orbit the center
        // Some drift is allowed
        p.x = centerX + Math.cos(p.angle) * p.orbitRadius;
        p.y = centerY + Math.sin(p.angle) * p.orbitRadius;

        // Draw particle
        gravityCtx.beginPath();
        gravityCtx.arc(p.x, p.y, p.size * (state.isSpinning ? 1.5 : 1), 0, Math.PI * 2);
        gravityCtx.fill();

        // Optional: draw faint line to center if close enough and spinning
        if (state.isSpinning && distance < 400) {
            gravityCtx.beginPath();
            gravityCtx.moveTo(p.x, p.y);
            gravityCtx.lineTo(centerX, centerY);
            gravityCtx.strokeStyle = `${pColor}10`; // Very transparent
            gravityCtx.stroke();
        }
    }

    // Idle wheel rotation - only before the first user spin
    if (!state.isSpinningWheel && !state.hasEverSpun) {
        state.startAngle += 0.0015; // Slower idle speed
        state.drawWheel();
    }

    requestAnimationFrame(() => animateGravity(state, dom));
}

export function initGravityEffect(state, dom) {
    dom.gravityCanvas = document.getElementById('gravity-canvas');
    if (!dom.gravityCanvas) return;

    dom.gravityCtx = dom.gravityCanvas.getContext('2d');

    function resizeGravityCanvas() {
        if (!dom.gravityCanvas) return;
        dom.gravityCanvas.width = window.innerWidth;
        dom.gravityCanvas.height = window.innerHeight;
    }

    // Resize canvas to window size
    window.addEventListener('resize', resizeGravityCanvas);
    resizeGravityCanvas();

    // Create initial particles (150 * 1.25 = 188)
    state.particles = [];
    for (let i = 0; i < 188; i++) {
        state.particles.push(createParticle(window.innerWidth, window.innerHeight));
    }

    // Start animation loop
    requestAnimationFrame(() => animateGravity(state, dom));
}
