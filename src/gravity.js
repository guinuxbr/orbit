/**
 * @file gravity.js
 * @description Background particle animation system and idle wheel rotation.
 */

/**
 * Creates a single particle object for the gravity background effect.
 * @param {number} width - Canvas or window width.
 * @param {number} height - Canvas or window height.
 * @returns {Object} Particle properties (position, size, speed, orbit).
 */
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

/**
 * Main animation loop for the background particles and idle wheel rotation.
 * @param {Object} state - The global application state.
 * @param {Object} dom - Global dictionary of DOM element references.
 */
export function animateGravity(state, dom) {
    const { gravityContext, gravityCanvas } = dom;
    if (!gravityContext || !gravityCanvas) return;

    gravityContext.clearRect(0, 0, gravityCanvas.width, gravityCanvas.height);

    const centerX = gravityCanvas.width / 2;
    const centerY = gravityCanvas.height / 2;

    const rootStyle = getComputedStyle(document.documentElement);
    let primaryColor = rootStyle.getPropertyValue('--color-primary').trim() || '#00a489';

    gravityContext.fillStyle = primaryColor;

    const speedMultiplier = state.isSpinning ? 15 : 1;

    for (let particle of state.particles) {
        const deltaX = centerX - particle.x;
        const deltaY = centerY - particle.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        particle.angle += particle.baseSpeed * speedMultiplier;

        particle.x = centerX + Math.cos(particle.angle) * particle.orbitRadius;
        particle.y = centerY + Math.sin(particle.angle) * particle.orbitRadius;

        gravityContext.beginPath();
        gravityContext.arc(particle.x, particle.y, particle.size * (state.isSpinning ? 1.5 : 1), 0, Math.PI * 2);
        gravityContext.fill();

        if (state.isSpinning && distance < 400) {
            gravityContext.beginPath();
            gravityContext.moveTo(particle.x, particle.y);
            gravityContext.lineTo(centerX, centerY);
            gravityContext.strokeStyle = `${primaryColor}10`;
            gravityContext.stroke();
        }
    }

    if (!state.isSpinningWheel && !state.hasEverSpun) {
        state.startAngle += 0.0015;
        state.drawWheel();
    }

    requestAnimationFrame(() => animateGravity(state, dom));
}

/**
 * Initializes the background canvas, creates particles, and starts the animation loop.
 * @param {Object} state - The global application state.
 * @param {Object} dom - Global dictionary of DOM element references.
 */
export function initGravityEffect(state, dom) {
    dom.gravityCanvas = document.getElementById('gravity-canvas');
    if (!dom.gravityCanvas) return;

    dom.gravityContext = dom.gravityCanvas.getContext('2d');

    function resizeGravityCanvas() {
        if (!dom.gravityCanvas) return;
        dom.gravityCanvas.width = window.innerWidth;
        dom.gravityCanvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeGravityCanvas);
    resizeGravityCanvas();

    state.particles = [];
    for (let particleIndex = 0; particleIndex < 188; particleIndex++) {
        state.particles.push(createParticle(window.innerWidth, window.innerHeight));
    }

    requestAnimationFrame(() => animateGravity(state, dom));
}
