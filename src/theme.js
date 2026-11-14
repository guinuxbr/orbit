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

/** @type {Function|null} */
let storageListener = null;

/**
 * Updates the `<meta name="color-scheme">` hint if present in the document head.
 * @param {'light'|'dark'|'auto'} theme - The configured theme preference.
 */
function updateColorSchemeMeta(theme) {
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) return;
    meta.setAttribute('content', theme === 'auto' ? 'light dark' : theme);
}

/**
 * Initializes the theme on application load.
 * Retrieves saved theme from storage or defaults to 'auto', and listens for cross-tab changes.
 * @returns {string} The active theme string.
 */
export function initTheme() {
    const saved = getTheme();
    applyTheme(saved, { persist: false });

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        if (storageListener) {
            window.removeEventListener('storage', storageListener);
        }
        storageListener = (event) => {
            if (event.key === STORAGE_KEY) {
                applyTheme(event.newValue || 'auto', { persist: false });
            }
        };
        window.addEventListener('storage', storageListener);
    }

    return saved;
}

/**
 * Applies a theme to the document and manages system preference listeners.
 * @param {'light'|'dark'|'auto'} theme - The theme to apply.
 * @param {{ persist?: boolean }} [options] - Persistence options.
 */
export function applyTheme(theme, { persist = true } = {}) {
    if (persist) {
        try {
            if (theme === 'auto') {
                localStorage.removeItem(STORAGE_KEY);
            } else {
                localStorage.setItem(STORAGE_KEY, theme);
            }
        } catch {
            // Ignore storage errors (private mode / blocked storage)
        }
    }

    updateColorSchemeMeta(theme);

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
    try {
        return localStorage.getItem(STORAGE_KEY) || 'auto';
    } catch {
        return 'auto';
    }
}

