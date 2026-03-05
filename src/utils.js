// src/utils.js

/**
 * Cubic ease-out function for smooth stopping.
 */
export function easeOut(t, b, c, d) {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
}

/**
 * Shows the custom error banner.
 */
export function showError(msg) {
    const banner = document.getElementById('error-banner');
    const messageElement = document.getElementById('error-message');
    if (messageElement) messageElement.textContent = msg;
    if (banner) {
        banner.classList.add('visible');
        setTimeout(() => banner.classList.remove('visible'), 5000);
    }
}

/**
 * Hides the custom error banner.
 */
export function hideError() {
    const banner = document.getElementById('error-banner');
    if (banner) banner.classList.remove('visible');
}

/**
 * Validates a file based on allowed MIME types, extensions, and max size.
 */
export function validateFile(file, { allowedMimePrefix, allowedExtensions, maxSizeMB }) {
    if (!file) return false;

    const fileSizeMB = file.size / (1024 * 1024);
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (maxSizeMB && fileSizeMB > maxSizeMB) {
        showError(`File too large (${fileSizeMB.toFixed(2)}MB). Max: ${maxSizeMB}MB.`);
        return false;
    }

    if (allowedMimePrefix && !file.type.startsWith(allowedMimePrefix)) {
        showError('Invalid file type.');
        return false;
    }

    if (allowedExtensions && !allowedExtensions.includes(ext)) {
        showError(`Invalid extension (${ext}). Allowed: ${allowedExtensions.join(', ')}`);
        return false;
    }

    return true;
}
