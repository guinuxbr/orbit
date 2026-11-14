/**
 * @file utils.js
 * @description General utility functions for easing, error handling, and file validation.
 */

/**
 * Cubic ease-out calculation for smooth animation stopping.
 * @param {number} time - Current time/frame.
 * @param {number} beginning - Beginning value.
 * @param {number} change - Change in value.
 * @param {number} duration - Duration.
 * @returns {number} The eased value.
 */
export function easeOut(time, beginning, change, duration) {
    const timeSquared = (time /= duration) * time;
    const timeCubed = timeSquared * time;
    return beginning + change * (timeCubed + -3 * timeSquared + 3 * time);
}

let errorTimeoutId = null;

const cssVarCache = {
    signature: null,
    values: new Map(),
};

/**
 * Reads a CSS custom property from `:root`, caching across animation frames until
 * `data-theme` or the inline `--color-primary` override changes.
 * @param {string} propertyName
 * @param {string} fallback
 * @returns {string}
 */
export function getRootCssVar(propertyName, fallback) {
    const root = document.documentElement;
    const signature = `${root.getAttribute('data-theme') || ''}|${root.style.getPropertyValue('--color-primary')}`;
    if (cssVarCache.signature !== signature) {
        cssVarCache.signature = signature;
        cssVarCache.values.clear();
    }
    if (cssVarCache.values.has(propertyName)) {
        return cssVarCache.values.get(propertyName);
    }
    const resolved = getComputedStyle(root).getPropertyValue(propertyName).trim() || fallback;
    cssVarCache.values.set(propertyName, resolved);
    return resolved;
}

/**
 * Displays a temporary error banner at the top of the interface.
 * @param {string} message - The error message to display.
 */
export function showError(message) {
    const banner = document.getElementById('error-banner');
    const messageElement = document.getElementById('error-message');
    if (messageElement) messageElement.textContent = message;
    if (banner) {
        banner.inert = false;
        banner.classList.add('visible');
        if (errorTimeoutId !== null) clearTimeout(errorTimeoutId);
        errorTimeoutId = setTimeout(() => {
            banner.classList.remove('visible');
            banner.inert = true;
            errorTimeoutId = null;
        }, 5000);
    }
}

/**
 * Manually hides the error banner.
 */
export function hideError() {
    if (errorTimeoutId !== null) {
        clearTimeout(errorTimeoutId);
        errorTimeoutId = null;
    }
    const banner = document.getElementById('error-banner');
    if (banner) {
        banner.classList.remove('visible');
        banner.inert = true;
    }
}

/**
 * Validates a file's type, extension, and size against specified constraints.
 * @param {File} file - The file object to validate.
 * @param {Object} options - Validation constraints.
 * @param {string} [options.allowedMimePrefix] - Optional MIME type prefix (e.g., 'image/').
 * @param {string[]} [options.allowedExtensions] - Array of allowed file extensions (e.g., ['.jpg']).
 * @param {number} [options.maxSizeMB] - Maximum allowed file size in Megabytes.
 * @returns {boolean} True if the file is valid, otherwise false.
 */
export function validateFile(file, { allowedMimePrefix, allowedExtensions, maxSizeMB }) {
    if (!file) return false;

    const fileSizeMB = file.size / (1024 * 1024);
    const extension = '.' + file.name.split('.').pop().toLowerCase();

    if (maxSizeMB && fileSizeMB > maxSizeMB) {
        showError(`File too large (${fileSizeMB.toFixed(2)}MB). Max: ${maxSizeMB}MB.`);
        return false;
    }

    if (allowedMimePrefix && !file.type.startsWith(allowedMimePrefix)) {
        showError('Invalid file type.');
        return false;
    }

    if (allowedExtensions && !allowedExtensions.includes(extension)) {
        showError(`Invalid extension (${extension}). Allowed: ${allowedExtensions.join(', ')}`);
        return false;
    }

    return true;
}
