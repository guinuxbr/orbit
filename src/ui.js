/**
 * @file ui.js
 * @description UI interaction logic, tab management, and dynamic theme synchronization.
 */

import { UI_THEMES } from './constants.js';
import { setVolume, musicTracks, sfxTracks, addCustomTrack } from './sounds.js';
import { validateFile } from './utils.js';

/**
 * Initializes the settings panel tab system.
 * The panel is a fixed right-side drawer driven by CSS translateX transition.
 * Clicking a tab opens it; clicking the same active tab closes it.
 */
export function setupTabs() {
    const settingsPanel = document.querySelector('.settings-panel');
    const links = document.querySelectorAll('.tab-link');
    const contents = document.querySelectorAll('.tab-content');

    /** Close the panel and reset all active states */
    function closePanel() {
        settingsPanel.classList.remove('open');
        links.forEach(link => link.classList.remove('active'));
        contents.forEach(content => content.classList.remove('active'));
    }

    /** Open the panel */
    function openPanel() {
        settingsPanel.classList.add('open');
    }

    // Handle close button
    const closeBtn = document.getElementById('close-settings-btn');
    if (closeBtn) closeBtn.addEventListener('click', closePanel);

    // Close on Escape key
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

    links.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.getAttribute('data-tab');
            const targetContent = document.getElementById(`tab-${tabId}`);
            const isActive = link.classList.contains('active');
            const isPanelOpen = settingsPanel.classList.contains('open');

            // Clicking the already-active tab while open → close
            if (isActive && isPanelOpen) {
                closePanel();
                return;
            }

            // Switch tab and open panel
            links.forEach(innerLink => innerLink.classList.remove('active'));
            contents.forEach(content => content.classList.remove('active'));

            link.classList.add('active');
            if (targetContent) targetContent.classList.add('active');
            openPanel();
        });
    });
}

/**
 * Applies a specific UI color palette by updating CSS variables and internal state.
 * @param {string} themeId - ID of the theme to apply (see constants.js).
 * @param {Object} state - Global application state.
 */
export function applyUITheme(themeId, state) {
    const theme = UI_THEMES.find(themeItem => themeItem.id === themeId) || UI_THEMES[0];

    const root = document.documentElement;
    
    // Update CSS variables used for the background gradient and primary branding
    root.style.setProperty('--bg-gradient', `radial-gradient(at 0% 0%, ${theme.primary} 0, transparent 50%),
                 radial-gradient(at 50% 0%, ${theme.secondary} 0, transparent 50%),
                 radial-gradient(at 100% 0%, ${theme.accent} 0, transparent 50%)`);

    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-primary-gradient', `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`);

    const shadowColor = theme.primary + '66';
    root.style.setProperty('--color-primary-shadow', shadowColor);

    // Update segments palette for the wheel
    state.currentWheelPalette = [theme.primary, theme.secondary, theme.accent, theme.primary, theme.secondary, theme.accent];
}

/**
 * Populates the UI theme selector and loads the saved preference.
 * @param {Object} state - Global application state.
 */
export function setupUITheme(state) {
    const uiThemeSelect = document.getElementById('ui-theme-select');
    const savedThemeId = localStorage.getItem('orbit-ui-theme') || 'teal';

    UI_THEMES.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.id;
        option.textContent = theme.label;
        uiThemeSelect.appendChild(option);
    });

    uiThemeSelect.value = savedThemeId;
    applyUITheme(savedThemeId, state);
}

/**
 * Attaches listeners to the volume slider to update internal and UI volume state.
 * @param {Object} dom - Global dictionary of DOM element references.
 */
export function setupVolume(dom) {
    const { volumeSlider, volumeValue } = dom;
    if (!volumeSlider) return;
    volumeSlider.addEventListener('input', () => {
        const volumeValue = parseInt(volumeSlider.value);
        dom.volumeValue.textContent = `${volumeValue}%`;
        setVolume(volumeValue / 100);
    });
}

/**
 * Fills music and SFX dropdown menus from the sound catalog.
 * @param {Object} dom - Global dictionary of DOM element references.
 */
export function populateSoundDropdowns(dom) {
    const { spinningSoundSelect, winnerSoundSelect } = dom;
    if (!spinningSoundSelect || !winnerSoundSelect) return;
    
    // Populate spinning sounds catalog
    musicTracks.forEach(track => {
        const option = document.createElement('option');
        option.value = track.id;
        option.textContent = track.label;
        spinningSoundSelect.appendChild(option);
    });

    // Populate victory sound effects catalog
    sfxTracks.forEach(track => {
        const option = document.createElement('option');
        option.value = track.id;
        option.textContent = track.label;
        winnerSoundSelect.appendChild(option);
    });
}

/**
 * Processes a custom audio file upload, adds it to the catalog, and selects it.
 * @param {Event} e - Input change event.
 * @param {'music'|'sfx'} type - Track category.
 * @param {Object} dom - Global dictionary of DOM element references.
 */
export function handleCustomSound(event, type, dom) {
    const file = event.target.files?.[0];
    if (!file) return;

    const isValid = validateFile(file, {
        allowedMimePrefix: 'audio/',
        allowedExtensions: ['.mp3', '.wav', '.ogg', '.m4a'],
        maxSizeMB: 3
    });

    if (!isValid) {
        event.target.value = '';
        return;
    }

    const url = URL.createObjectURL(file);
    const id = `custom-${Date.now()}`;
    const label = `📂 ${file.name}`;

    addCustomTrack(type, { id, label, file: url, isBlob: true });
    
    const select = type === 'music' ? dom.spinningSoundSelect : dom.winnerSoundSelect;
    const option = document.createElement('option');
    option.value = id;
    option.textContent = label;
    select.appendChild(option);
    select.value = id;
}

/**
 * Sets up "auto-apply" listeners for settings inputs to trigger immediate wheel updates and saves.
 * @param {Object} state - Global application state.
 * @param {Object} dom - Global dictionary of DOM element references.
 * @param {Function} [onSave] - Callback triggered to persist changes to storage.
 */
export function setupAutoApply(state, dom, onSave) {
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
            // Persist settings changes immediately
            if (typeof onSave === 'function') onSave();
        };
        input.addEventListener('input', triggerUpdate);
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', triggerUpdate);
        }
    });
}
