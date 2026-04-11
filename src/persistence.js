/**
 * @file persistence.js
 * @description Manages automatic saving and restoration of user configuration to localStorage.
 */

/**
 * Key used to store the application configuration JSON.
 * @type {string}
 */
const STORAGE_KEY = 'orbit-config-v1';

/**
 * Reads the current UI values and saves them to localStorage.
 * @param {Object} state - The global application state.
 * @param {Object} dom - Global dictionary of DOM element references.
 */
export function saveConfig(state, dom) {
    try {
        const config = {
            names: state.names,
            uiTheme: document.getElementById('ui-theme-select')?.value || 'teal',
            lightDarkTheme: localStorage.getItem('orbit-theme') || 'auto',
            spinDuration: dom.spinDurationInput?.value || '15',
            winnerMessage: dom.winnerMessageInput?.value || '{name} wins!',
            volume: dom.volumeSlider?.value || '50',
            spinningSound: dom.spinningSoundSelect?.value || 'random',
            winnerSound: dom.winnerSoundSelect?.value || 'random',
            imageBg: dom.imageBgToggle?.checked || false,
            imageSize: dom.imageSizeSelect?.value || '0.30',
            // Center image URL (data URL for uploads, remote URL for gallery picks)
            centerImageUrl: state.centerImageUrl || null,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
        // Storage may be unavailable (private mode, quota exceeded, etc.)
        console.warn('[orbit] Could not save config:', error);
    }
}

/**
 * Retrieves the saved configuration from localStorage.
 * @returns {Object|null} Parsed configuration object, or null if empty/invalid.
 */
export function loadConfig() {
    try {
        const rawConfig = localStorage.getItem(STORAGE_KEY);
        return rawConfig ? JSON.parse(rawConfig) : null;
    } catch (error) {
        console.warn('[orbit] Could not load config:', error);
        return null;
    }
}

/**
 * Wipes all saved configuration from storage, including theme overrides.
 * Used for the "Reset" functionality.
 */
export function clearConfig() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        // Also clear the keys managed by theme.js and ui.js directly
        localStorage.removeItem('orbit-theme');
        localStorage.removeItem('orbit-ui-theme');
    } catch (error) {
        console.warn('[orbit] Could not clear config:', error);
    }
}
