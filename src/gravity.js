/**
 * @file gravity.js
 * @description Background particle animation system and idle wheel rotation.
 */

import { getRootCssVar } from './utils.js';

const reducedMotionQuery = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

function prefersReducedMotion() {
    return Boolean(reducedMotionQuery?.matches);
}

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
 * Renders one frame of background particles (and advances positions when motion is active).
 * @param {Object} state - The global application state.
 * @param {Object} dom - Global dictionary of DOM element references.
 * @param {boolean} [animate=true] - Whether particle positions and idle wheel angle advance.
 */
function renderGravityFrame(state, dom, animate = true) {
    const { gravityContext, gravityCanvas } = dom;
    if (!gravityContext || !gravityCanvas) return;

    gravityContext.clearRect(0, 0, gravityCanvas.width, gravityCanvas.height);

    const centerX = gravityCanvas.width / 2;
    const centerY = gravityCanvas.height / 2;
    const primaryColor = getRootCssVar('--color-primary', '#00a489');

    gravityContext.fillStyle = primaryColor;

    const speedMultiplier = state.isSpinning ? 15 : 1;

    for (let particle of state.particles) {
        const deltaX = centerX - particle.x;
        const deltaY = centerY - particle.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (animate) {
            particle.angle += particle.baseSpeed * speedMultiplier;
            particle.x = centerX + Math.cos(particle.angle) * particle.orbitRadius;
            particle.y = centerY + Math.sin(particle.angle) * particle.orbitRadius;
        }

        gravityContext.beginPath();
        gravityContext.arc(particle.x, particle.y, particle.size * (state.isSpinning ? 1.5 : 1), 0, Math.PI * 2);
        gravityContext.fill();

        if (animate && state.isSpinning && distance < 400) {
            gravityContext.beginPath();
            gravityContext.moveTo(particle.x, particle.y);
            gravityContext.lineTo(centerX, centerY);
            gravityContext.strokeStyle = `${primaryColor}10`;
            gravityContext.stroke();
        }
    }

    if (animate && !state.isSpinningWheel && !state.hasEverSpun) {
        state.startAngle += 0.0015;
        state.drawWheel();
    }
}

/**
 * Main animation loop for the background particles and idle wheel rotation.
 * Pauses when the document is hidden or when `prefers-reduced-motion: reduce` is active.
 * @param {Object} state - The global application state.
 * @param {Object} dom - Global dictionary of DOM element references.
 */
export function animateGravity(state, dom) {
    const { gravityContext, gravityCanvas } = dom;
    if (!gravityContext || !gravityCanvas) return;

    if (document.hidden || prefersReducedMotion()) {
        state.gravityAnimationId = null;
        return;
    }

    renderGravityFrame(state, dom, true);
    state.gravityAnimationId = requestAnimationFrame(() => animateGravity(state, dom));
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
        if (prefersReducedMotion()) {
            renderGravityFrame(state, dom, false);
        }
    }

    window.addEventListener('resize', resizeGravityCanvas);
    resizeGravityCanvas();

    state.particles = [];
    for (let particleIndex = 0; particleIndex < 188; particleIndex++) {
        state.particles.push(createParticle(window.innerWidth, window.innerHeight));
    }

    const syncMotionState = () => {
        if (document.hidden || prefersReducedMotion()) {
            if (state.gravityAnimationId != null) {
                cancelAnimationFrame(state.gravityAnimationId);
                state.gravityAnimationId = null;
            }
            if (!document.hidden && prefersReducedMotion()) {
                renderGravityFrame(state, dom, false);
            }
        } else if (state.gravityAnimationId == null) {
            state.gravityAnimationId = requestAnimationFrame(() => animateGravity(state, dom));
        }
    };

    document.addEventListener('visibilitychange', syncMotionState);
    reducedMotionQuery?.addEventListener('change', syncMotionState);

    if (prefersReducedMotion()) {
        renderGravityFrame(state, dom, false);
    } else if (!document.hidden) {
        state.gravityAnimationId = requestAnimationFrame(() => animateGravity(state, dom));
    }
}
