/**
 * @file spin.js
 * @description Core logic for the wheel spinning animation, winner calculation, and music/SFX synchronization.
 */

import { easeOut } from './utils.js';
import { playMusic, stopMusic, playSfx, getRandomMusicId, getRandomSfxId } from './sounds.js';

/**
 * Finalizes the spin animation, determines the winner, and triggers UI updates.
 * @param {string} sfxId - The sound effect ID to play for the win.
 * @param {Object} state - The global application state.
 * @param {Object} dom - Global dictionary of DOM element references.
 */
export function finalizeSpin(sfxId, state, dom) {
    cancelAnimationFrame(state.animationId);
    state.isSpinningWheel = false;
    state.isSpinning = false; // Restore normal background particle speed
    dom.spinBtn.classList.remove('spinning');

    stopMusic();

    // Calculate winner segment based on final wheel orientation
    const segmentArc = (Math.PI * 2) / state.names.length;
    const normalizedAngle = ((state.startAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const winnerIndex = Math.floor(((Math.PI * 2 - normalizedAngle) % (Math.PI * 2)) / segmentArc) % state.names.length;

    const winner = state.names[winnerIndex] || '???';
    state.lastWinner = winner;

    // Show the result toast with name substitution
    const messageTemplate = dom.winnerMessageInput.value || '🎉 {name} wins!';
    document.getElementById('winner-text').textContent = messageTemplate.replace('{name}', winner);
    dom.winnerToast.classList.add('visible');

    // Restore the "Click centre to SPIN!" overlay after a short delay
    setTimeout(() => {
        if (!state.isSpinningWheel) dom.spinInstruction.classList.remove('hidden');
    }, 2000);

    if (sfxId !== 'none') playSfx(sfxId);
}

/**
 * Recursive animation frame handler for the spinning wheel.
 * @param {number} now - High-res timestamp provided by requestAnimationFrame.
 * @param {number} startTime - Performance timestamp of when the spin began.
 * @param {number} durationMs - Configured duration of the spin in milliseconds.
 * @param {number} spinAngleStart - Initial rotational velocity.
 * @param {string} sfxId - SFX to play upon completion.
 * @param {Object} state - Global application state.
 * @param {Object} dom - Global dictionary of DOM element references.
 */
export function animateSpin(currentTimestamp, startTime, durationMs, spinAngleStart, sfxId, state, dom) {
    const elapsed = currentTimestamp - startTime;

    if (elapsed >= durationMs) {
        finalizeSpin(sfxId, state, dom);
        return;
    }

    // Easing progresses from 0 to 1 over durationMs
    const progress = elapsed / durationMs;
    const spinAngle = spinAngleStart * (1 - easeOut(progress, 0, 1, 1));
    state.startAngle += (spinAngle * Math.PI / 180);

    state.drawWheel();
    state.animationId = requestAnimationFrame((timestamp) => animateSpin(timestamp, startTime, durationMs, spinAngleStart, sfxId, state, dom));
}

/**
 * Initiates the spinning process. Checks validity and starts audio/animation.
 * @param {Object} state - Global application state.
 * @param {Object} dom - Global dictionary of DOM element references.
 */
export function spinWheel(state, dom) {
    if (state.isSpinningWheel || state.names.length === 0) return;

    state.isSpinningWheel = true;
    state.isSpinning = true; // Increases background particle velocity
    state.hasEverSpun = true; // Disables the ambient "idle" spin permanently
    dom.spinBtn.classList.add('spinning');
    dom.spinInstruction.classList.add('hidden');
    dom.winnerToast.classList.remove('visible');
    state.lastWinner = null;

    const durationMs = (parseFloat(dom.spinDurationInput.value) || 5) * 1000;
    const spinAngleStart = Math.random() * 10 + 10;
    const startTime = performance.now();

    // Select and play music track (Random vs Explicit)
    let musicId = dom.spinningSoundSelect.value;
    if (musicId === 'random') musicId = getRandomMusicId();
    if (musicId !== 'none') playMusic(musicId);

    // Prepare winner SFX for later
    let sfxId = dom.winnerSoundSelect.value;
    if (sfxId === 'random') sfxId = getRandomSfxId();

    state.animationId = requestAnimationFrame((currentTimestamp) => animateSpin(currentTimestamp, startTime, durationMs, spinAngleStart, sfxId, state, dom));
}

/**
 * Removes the first instance of the last winner from the names list.
 * @param {Object} state - Global application state.
 */
export function removeWinnerOnce(state) {
    if (!state.lastWinner) return;

    const winnerIndex = state.names.indexOf(state.lastWinner);
    if (winnerIndex !== -1) {
        state.names.splice(winnerIndex, 1);
        state.syncNamesUI();
    }
}

/**
 * Removes all instances of the last winner from the names list.
 * @param {Object} state - Global application state.
 */
export function removeWinnerAll(state) {
    if (!state.lastWinner) return;
    state.names = state.names.filter(name => name !== state.lastWinner);
    state.syncNamesUI();
}

/**
 * Synchronizes the internal names array with the values in the textarea.
 * @param {Object} state - Global application state.
 * @param {Object} dom - Global dictionary of DOM element references.
 */
export function updateNames(state, dom) {
    const input = dom.namesInput.value.trim();
    if (!input) return;
    const newNames = input.split('\n').map(name => name.trim()).filter(name => name !== '');
    if (newNames.length > 0) {
        state.names = newNames;
        state.colors = state.generateColors(state.names.length, state.currentWheelPalette);
        state.drawWheel();
    }
}
