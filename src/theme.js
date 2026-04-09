/**
 * @file theme.js
 * @description Manages application-level color scheme (Light, Dark, and Auto/System).
 */

/**
 * localStorage key for the system theme preference.
 * @type {string}
 */
const STORAGE_KEY = 'orbit-theme';

/** @type {MediaQueryList|null} */
let mediaQueryList = null;

/** @type {Function|null} */
let mediaQueryListener = null;

/**
 * Initializes the theme on application load.
 * Retrieves saved theme from storage or defaults to 'auto'.
 * @returns {string} The active theme string.
 */
export function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEY) || 'auto';
    applyTheme(saved);
    return saved;
}

/**
 * Applies a theme to the document and manages system preference listeners.
 * @param {'light'|'dark'|'auto'} theme - The theme to apply.
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

        /** @param {MediaQueryListEvent|MediaQueryList} event */
        const applySystem = (event) => {
            const systemTheme = event.matches ? 'dark' : 'light';
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
 * Retrieves the currently configured theme preference.
 * @returns {string} The theme value ('light', 'dark', or 'auto').
 */
export function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'auto';
}

