// src/spin.js
import { easeOut } from './utils.js';
import { playMusic, stopMusic, playSfx, getRandomMusicId, getRandomSfxId } from './sounds.js';

export function finalizeSpin(sfxId, state, dom) {
    cancelAnimationFrame(state.animationId);
    state.isSpinningWheel = false;
    state.isSpinning = false; // Restore normal gravity velocity
    dom.spinBtn.classList.remove('spinning');

    stopMusic();

    // Calculate winner based on final angle
    const arc = (Math.PI * 2) / state.names.length;
    const normalizedAngle = ((state.startAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const index = Math.floor(((Math.PI * 2 - normalizedAngle) % (Math.PI * 2)) / arc) % state.names.length;

    const winner = state.names[index] || '???';
    state.lastWinner = winner;

    // Reveal toast
    const messageTemplate = dom.winnerMessageInput.value || '🎉 {name} wins!';
    document.getElementById('winner-text').textContent = messageTemplate.replace('{name}', winner);
    dom.winnerToast.classList.add('visible');

    // Re-show instruction after delay
    setTimeout(() => {
        if (!state.isSpinningWheel) dom.spinInstruction.classList.remove('hidden');
    }, 2000);

    if (sfxId !== 'none') playSfx(sfxId);
}

export function animateSpin(now, startTime, durationMs, spinAngleStart, sfxId, state, dom) {
    const elapsed = now - startTime;

    if (elapsed >= durationMs) {
        finalizeSpin(sfxId, state, dom);
        return;
    }

    const progress = elapsed / durationMs;
    const spinAngle = spinAngleStart * (1 - easeOut(progress, 0, 1, 1));
    state.startAngle += (spinAngle * Math.PI / 180);

    state.drawWheel();
    state.animationId = requestAnimationFrame((n) => animateSpin(n, startTime, durationMs, spinAngleStart, sfxId, state, dom));
}

export function spinWheel(state, dom) {
    if (state.isSpinningWheel || state.names.length === 0) return;

    state.isSpinningWheel = true;
    state.isSpinning = true; // Trigger gravity effect speedup
    state.hasEverSpun = true; // Disable idle spin permanently
    dom.spinBtn.classList.add('spinning');
    dom.spinInstruction.classList.add('hidden');
    dom.winnerToast.classList.remove('visible');
    state.lastWinner = null;


    const durationMs = (parseFloat(dom.spinDurationInput.value) || 5) * 1000;
    const spinAngleStart = Math.random() * 10 + 10;
    const startTime = performance.now();

    // Pick sound tracks
    let musicId = dom.spinningSoundSelect.value;
    if (musicId === 'random') musicId = getRandomMusicId();
    if (musicId !== 'none') playMusic(musicId);

    let sfxId = dom.winnerSoundSelect.value;
    if (sfxId === 'random') sfxId = getRandomSfxId();

    state.animationId = requestAnimationFrame((now) => animateSpin(now, startTime, durationMs, spinAngleStart, sfxId, state, dom));
}

export function removeWinnerOnce(state) {
    if (!state.lastWinner) return;

    const idx = state.names.indexOf(state.lastWinner);
    if (idx !== -1) {
        state.names.splice(idx, 1);
        state.syncNamesUI();
    }
}

export function removeWinnerAll(state) {
    if (!state.lastWinner) return;
    state.names = state.names.filter(n => n !== state.lastWinner);
    state.syncNamesUI();
}

export function updateNames(state, dom) {
    const input = dom.namesInput.value.trim();
    if (!input) return;
    const newNames = input.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (newNames.length > 0) {
        state.names = newNames;
        state.colors = state.generateColors(state.names.length, state.currentWheelPalette);
        state.drawWheel();
    }
}
