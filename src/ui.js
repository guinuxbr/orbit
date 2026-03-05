// src/ui.js
import { UI_THEMES } from './constants.js';
import { setVolume, musicTracks, sfxTracks, addCustomTrack } from './sounds.js';
import { validateFile } from './utils.js';

export function setupTabs() {
    const settingsPanel = document.querySelector('.settings-panel');
    const links = document.querySelectorAll('.tab-link');
    const contents = document.querySelectorAll('.tab-content');

    links.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.getAttribute('data-tab');
            const targetContent = document.getElementById(`tab-${tabId}`);
            const isActive = link.classList.contains('active');
            const isPanelOpen = settingsPanel.classList.contains('open');

            if (isActive) {
                if (isPanelOpen) {
                    settingsPanel.classList.remove('open');
                    settingsPanel.style.display = 'none';
                    links.forEach(l => l.classList.remove('active'));
                } else {
                    settingsPanel.classList.add('open');
                    settingsPanel.style.display = 'flex';
                }
                return;
            }

            links.forEach(l => l.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            link.classList.add('active');
            if (targetContent) targetContent.classList.add('active');
            settingsPanel.classList.add('open');
            settingsPanel.style.display = 'flex';
        });
    });
}

export function applyUITheme(themeId, state) {
    const theme = UI_THEMES.find(t => t.id === themeId) || UI_THEMES[0];
    localStorage.setItem('orbit-ui-theme', themeId);

    const root = document.documentElement;
    // Update CSS variables for dynamic background
    root.style.setProperty('--bg-gradient', `radial-gradient(at 0% 0%, ${theme.primary} 0, transparent 50%),
                 radial-gradient(at 50% 0%, ${theme.sec} 0, transparent 50%),
                 radial-gradient(at 100% 0%, ${theme.accent} 0, transparent 50%)`);

    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-primary-gradient', `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`);

    const shadowColor = theme.primary + '66';
    root.style.setProperty('--color-primary-shadow', shadowColor);

    // Update segments palette
    state.currentWheelPalette = [theme.primary, theme.sec, theme.accent, theme.primary, theme.sec, theme.accent];
}

export function setupUITheme(state) {
    const uiThemeSelect = document.getElementById('ui-theme-select');
    const savedThemeId = localStorage.getItem('orbit-ui-theme') || 'teal';

    UI_THEMES.forEach(theme => {
        const opt = document.createElement('option');
        opt.value = theme.id;
        opt.textContent = theme.label;
        uiThemeSelect.appendChild(opt);
    });

    uiThemeSelect.value = savedThemeId;
    applyUITheme(savedThemeId, state);
}

export function setupVolume(dom) {
    const { volumeSlider, volumeValue } = dom;
    if (!volumeSlider) return;
    volumeSlider.addEventListener('input', () => {
        const val = parseInt(volumeSlider.value);
        volumeValue.textContent = `${val}%`;
        setVolume(val / 100);
    });
}

export function populateSoundDropdowns(dom) {
    const { spinningSoundSelect, winnerSoundSelect } = dom;
    if (!spinningSoundSelect || !winnerSoundSelect) return;
    // Populate spinning sounds
    musicTracks.forEach(track => {
        const opt = document.createElement('option');
        opt.value = track.id;
        opt.textContent = track.label;
        spinningSoundSelect.appendChild(opt);
    });

    // Populate winner sounds
    sfxTracks.forEach(track => {
        const opt = document.createElement('option');
        opt.value = track.id;
        opt.textContent = track.label;
        winnerSoundSelect.appendChild(opt);
    });
}

export function handleCustomSound(e, type, dom) {
    const file = e.target.files[0];
    if (!file) return;

    const isValid = validateFile(file, {
        allowedMimePrefix: 'audio/',
        allowedExtensions: ['.mp3', '.wav', '.ogg', '.m4a'],
        maxSizeMB: 3
    });

    if (!isValid) {
        e.target.value = '';
        return;
    }

    const url = URL.createObjectURL(file);
    const id = `custom-${Date.now()}`;
    const label = `📂 ${file.name}`;

    addCustomTrack(type, { id, label, file: url, isBlob: true });
    const select = type === 'music' ? dom.spinningSoundSelect : dom.winnerSoundSelect;
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = label;
    select.appendChild(opt);
    select.value = id;
}

export function setupAutoApply(state, dom) {
    const inputs = [
        document.getElementById('ui-theme-select'),
        document.getElementById('spin-duration'),
        document.getElementById('winner-message'),
        document.getElementById('spinning-sound'),
        document.getElementById('winner-sound'),
        document.getElementById('image-bg-toggle')
    ];

    inputs.forEach(input => {
        if (!input) return;
        const triggerUpdate = () => {
            if (input.id === 'ui-theme-select') {
                applyUITheme(input.value, state);
                state.colors = state.generateColors(state.names.length, state.currentWheelPalette);
                state.drawWheel();
            }
        };
        input.addEventListener('input', triggerUpdate);
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', triggerUpdate);
        }
    });
}
