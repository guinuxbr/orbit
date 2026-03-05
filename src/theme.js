// ============================================
// theme.js — Auto / Light / Dark theme manager
// ============================================

const STORAGE_KEY = 'orbit-theme';
let mediaQueryList = null;
let mediaQueryListener = null;

/**
 * Initializes the theme on application load.
 * Retrieves saved theme or defaults to 'auto'.
 * @returns {string} The active theme value.
 */
export function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEY) || 'auto';
    applyTheme(saved);
    return saved;
}

/**
 * Applies a theme ('light', 'dark', or 'auto') to the document.
 * If 'auto' is selected, it listens for system preference changes.
 * @param {string} theme - The theme to apply.
 */
export function applyTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);

    // Clean up previous system preference listener if it exists
    if (mediaQueryList && mediaQueryListener) {
        mediaQueryList.removeEventListener('change', mediaQueryListener);
        mediaQueryListener = null;
    }

    if (theme === 'auto') {
        // Remove explicit theme attribute to inherit from system or default
        document.documentElement.removeAttribute('data-theme');

        // Setup listener for system 'prefers-color-scheme' changes
        mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

        const applySystem = (e) => {
            const systemTheme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', systemTheme);
        };

        // Immediate application of system preference
        applySystem(mediaQueryList);

        // Store listener for future cleanup
        mediaQueryListener = applySystem;
        mediaQueryList.addEventListener('change', mediaQueryListener);

    } else {
        // Apply explicit theme ('light' or 'dark')
        document.documentElement.setAttribute('data-theme', theme);
    }
}

/**
 * Returns the currently configured theme value from localStorage.
 * @returns {string} The theme value ('light', 'dark', or 'auto').
 */
export function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'auto';
}

