/**
 * @file wheel.js
 * @description Core canvas rendering for the wheel, segment coloring, and center image management.
 */

import { PALETTE } from './constants.js';
import { validateFile } from './utils.js';

/**
 * Generates an array of colors for the wheel segments based on the current palette.
 * @param {number} count - Number of segments to color.
 * @param {string[]} currentWheelPalette - Custom palette to use (falls back to defaults).
 * @returns {string[]} Array of color strings.
 */
export function generateColors(count, currentWheelPalette) {
    const result = [];
    const palette = currentWheelPalette.length > 0 ? currentWheelPalette : PALETTE;
    for (let segmentIndex = 0; segmentIndex < count; segmentIndex++) {
        result.push(palette[segmentIndex % palette.length]);
    }
    return result;
}

/**
 * Calculates an optimal font size for wheel segment labels.
 *
 * @param {number} count - Number of segments in the wheel.
 * @param {number} outerRadius - Outer radius of the wheel in pixels.
 * @param {number} innerRadius - Inner radius (hub) of the wheel in pixels.
 * @returns {number} The calculated font size in pixels.
 */
export function calculateFontSize(count, outerRadius, innerRadius) {
    const MIN_FONT_SIZE = 10;
    const MAX_FONT_SIZE = 56;

    if (count === 0) return MAX_FONT_SIZE;

    const segmentArc = (Math.PI * 2) / count;

    const arcChordHeight = 2 * outerRadius * Math.sin(segmentArc / 2);
    const verticalBudget = arcChordHeight * 0.75;

    const radialDepth = outerRadius - innerRadius - 20;
    const CHARS_ESTIMATE = 8;
    const CHAR_WIDTH_RATIO = 0.6;
    const horizontalBudget = (radialDepth * 0.90) / (CHARS_ESTIMATE * CHAR_WIDTH_RATIO);

    const fontSize = Math.min(verticalBudget, horizontalBudget);

    return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, fontSize));
}

/**
 * Main draw call that renders the wheel segments, text labels, and center hub/image.
 * @param {Object} state - Global application state.
 * @param {Object} dom - Global dictionary of DOM element references.
 */
export function drawWheel(state, dom) {
    const { canvas, context, imageSizeSelect } = dom;
    const { names, colors, startAngle, useImageAsBackground, centerImage } = state;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const outerRadius = (Math.min(canvasWidth, canvasHeight) / 2) - 10;
    
    let innerRadiusRatio = parseFloat(imageSizeSelect.value) || 0.30;
    if (innerRadiusRatio > 1) {
        // Fallback for legacy static pixel values (normalized to typical desktop radius of 450)
        innerRadiusRatio = Math.min(innerRadiusRatio / 450, 0.8);
    }
    const innerRadius = outerRadius * innerRadiusRatio;

    context.clearRect(0, 0, canvasWidth, canvasHeight);

    if (names.length === 0) {
        context.beginPath();
        context.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
        context.strokeStyle = 'rgba(255,255,255,0.6)';
        context.lineWidth = 1.5;
        context.stroke();

        context.beginPath();
        context.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim() || '#fff';
        context.fill();
        context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#6c5ce7';
        context.lineWidth = 4;
        context.stroke();

        if (state.defaultCenterImage) {
            context.save();
            context.beginPath();
            context.arc(centerX, centerY, innerRadius - 4, 0, Math.PI * 2);
            context.clip();
            context.translate(centerX, centerY);
            const iconSize = (innerRadius - 4) * 2;
            context.drawImage(state.defaultCenterImage, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
            context.restore();
        }
        return;
    }

    const segmentArc = (Math.PI * 2) / names.length;
    const isImageBackground = useImageAsBackground && centerImage;

    if (isImageBackground) {
        context.save();
        context.beginPath();
        context.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
        context.clip();

        context.translate(centerX, centerY);
        context.rotate(startAngle);
        context.translate(-centerX, -centerY);

        const imageDisplaySize = outerRadius * 2;
        context.drawImage(centerImage, centerX - outerRadius, centerY - outerRadius, imageDisplaySize, imageDisplaySize);
        context.restore();
    }

    for (let segmentIndex = 0; segmentIndex < names.length; segmentIndex++) {
        const angle = startAngle + segmentIndex * segmentArc;

        if (!isImageBackground) {
            context.beginPath();
            context.moveTo(centerX, centerY);
            context.arc(centerX, centerY, outerRadius, angle, angle + segmentArc);
            context.closePath();
            context.fillStyle = colors[segmentIndex] || '#ccc';
            context.fill();
            context.strokeStyle = 'rgba(255,255,255,0.6)';
            context.lineWidth = 1.5;
            context.stroke();
        }

        context.save();
        context.translate(centerX, centerY);
        context.rotate(angle + segmentArc / 2);

        const maxTextWidth = (outerRadius - innerRadius - 20);
        const fontSize = calculateFontSize(names.length, outerRadius, innerRadius);
        context.font = `600 ${fontSize}px 'Outfit', sans-serif`;

        let text = names[segmentIndex];
        while (context.measureText(text).width > maxTextWidth && text.length > 3) {
            text = text.slice(0, -1);
        }
        if (text !== names[segmentIndex]) text += '…';

        if (isImageBackground) {
            context.fillStyle = '#ffffff';
            context.shadowColor = 'rgba(0,0,0,1)';
            context.shadowBlur = 8;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
        } else {
            context.fillStyle = '#1a1a2e';
        }

        context.textAlign = 'right';
        context.textBaseline = 'middle';
        context.fillText(text, outerRadius - 15, 0);
        context.restore();
    }

    if (!isImageBackground) {
        context.beginPath();
        context.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim() || '#fff';
        context.fill();
        context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#6c5ce7';
        context.lineWidth = 4;
        context.stroke();

        if (centerImage) {
            context.save();
            context.beginPath();
            context.arc(centerX, centerY, innerRadius - 4, 0, Math.PI * 2);
            context.clip();
            context.translate(centerX, centerY);
            context.rotate(startAngle);
            context.translate(-centerX, -centerY);
            const imageDisplaySize = (innerRadius - 4) * 2;
            context.drawImage(centerImage, centerX - innerRadius + 4, centerY - innerRadius + 4, imageDisplaySize, imageDisplaySize);
            context.restore();
        } else if (state.defaultCenterImage) {
            context.save();
            context.beginPath();
            context.arc(centerX, centerY, innerRadius - 4, 0, Math.PI * 2);
            context.clip();
            context.translate(centerX, centerY);
            context.rotate(startAngle);
            const iconSize = (innerRadius - 4) * 2;
            context.drawImage(state.defaultCenterImage, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
            context.restore();
        }
    }
}

/**
 * Asynchronously loads an image from a URL and updates the wheel.
 * @param {string} url - Source URL or Data URL.
 * @param {Object} state - Global application state.
 * @param {Function} [onLoad] - Optional callback triggered after successful load.
 */
export function loadImageFromURL(url, state, onLoad) {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = function () {
        state.centerImage = image;
        state.centerImageUrl = url;
        state.drawWheel();
        if (typeof onLoad === 'function') onLoad();
    };
    image.src = url;
}

/**
 * Handles the local file upload event for the wheel image.
 * @param {Event} event - Input change event.
 * @param {Object} state - Global application state.
 * @param {Function} [onLoad] - Optional callback passed to loadImageFromURL.
 */
export function handleImageUpload(event, state, onLoad) {
    const file = event.target.files?.[0];
    if (!file) return;

    const isValid = validateFile(file, {
        allowedMimePrefix: 'image/',
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'],
        maxSizeMB: 2
    });

    if (!isValid) {
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (readerEvent) {
        loadImageFromURL(readerEvent.target.result, state, onLoad);
    };
    reader.readAsDataURL(file);
}

/**
 * Removes the current custom center image and reverts to the default icon.
 * @param {Object} state - Global application state.
 * @param {Object} dom - Global dictionary of DOM element references.
 */
export function clearImage(state, dom) {
    state.centerImage = null;
    state.centerImageUrl = null;
    if (dom.centerImageInput) dom.centerImageInput.value = '';
    state.drawWheel();
}
