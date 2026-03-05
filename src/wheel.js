// src/wheel.js
import { PALETTE } from './constants.js';
import { validateFile } from './utils.js';

export function generateColors(count, currentWheelPalette) {
    const result = [];
    const palette = currentWheelPalette.length > 0 ? currentWheelPalette : PALETTE;
    for (let i = 0; i < count; i++) {
        result.push(palette[i % palette.length]);
    }
    return result;
}

export function drawWheel(state, dom) {
    const { canvas, ctx, imageSizeSelect } = dom;
    const { names, colors, startAngle, useImageAsBackground, centerImage } = state;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const outerR = (Math.min(W, H) / 2) - 10;
    const innerR = parseInt(imageSizeSelect.value) || 110;

    ctx.clearRect(0, 0, W, H);

    // If names is empty, we still draw the outer ring and center hub
    if (names.length === 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw central hub
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim() || '#fff';
        ctx.fill();
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#6c5ce7';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw center icon
        if (state.defaultCenterImage) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, innerR - 4, 0, Math.PI * 2);
            ctx.clip();
            ctx.translate(cx, cy);
            const iconSize = (innerR - 4) * 2;
            ctx.drawImage(state.defaultCenterImage, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
            ctx.restore();

        }
        return;
    }

    const arc = (Math.PI * 2) / names.length;
    const isImageBackground = useImageAsBackground && centerImage;

    // Draw background image if enabled
    if (isImageBackground) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
        ctx.clip();

        // Rotate the background image with the wheel
        ctx.translate(cx, cy);
        ctx.rotate(startAngle);
        ctx.translate(-cx, -cy);

        const imgSize = outerR * 2;
        ctx.drawImage(centerImage, cx - outerR, cy - outerR, imgSize, imgSize);
        ctx.restore();
    }

    for (let i = 0; i < names.length; i++) {
        const angle = startAngle + i * arc;

        // Draw individual segment only if NOT using image background
        if (!isImageBackground) {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, outerR, angle, angle + arc);
            ctx.closePath();
            ctx.fillStyle = colors[i] || '#ccc';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Draw segment text
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle + arc / 2);

        const maxTextWidth = (outerR - innerR - 20);
        let fontSize = Math.min(35, Math.max(18, 350 / names.length));
        ctx.font = `600 ${fontSize}px 'Outfit', sans-serif`;

        let text = names[i];
        while (ctx.measureText(text).width > maxTextWidth && text.length > 3) {
            text = text.slice(0, -1);
        }
        if (text !== names[i]) text += '…';

        if (isImageBackground) {
            ctx.fillStyle = '#ffffff';
            // Add text shadow for maximum readability on arbitrary images
            ctx.shadowColor = 'rgba(0,0,0,1)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        } else {
            ctx.fillStyle = '#1a1a2e';
        }

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, outerR - 15, 0);
        ctx.restore();
    }

    // Draw central hub and icon only if NOT using image background
    if (!isImageBackground) {
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim() || '#fff';
        ctx.fill();
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#6c5ce7';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw center icon or chosen center image
        if (centerImage) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, innerR - 4, 0, Math.PI * 2);
            ctx.clip();
            ctx.translate(cx, cy);
            ctx.rotate(startAngle);
            ctx.translate(-cx, -cy);
            const imgSize = (innerR - 4) * 2;
            ctx.drawImage(centerImage, cx - innerR + 4, cy - innerR + 4, imgSize, imgSize);
            ctx.restore();
        } else if (state.defaultCenterImage) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, innerR - 4, 0, Math.PI * 2);
            ctx.clip();
            ctx.translate(cx, cy);
            ctx.rotate(startAngle);
            const iconSize = (innerR - 4) * 2;
            ctx.drawImage(state.defaultCenterImage, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
            ctx.restore();
        }
    }
}

export function loadImageFromURL(url, state) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
        state.centerImage = img;
        state.drawWheel();
    };
    img.src = url;
}

export function handleImageUpload(e, state) {
    const file = e.target.files[0];
    if (!file) return;

    const isValid = validateFile(file, {
        allowedMimePrefix: 'image/',
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'],
        maxSizeMB: 2
    });

    if (!isValid) {
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        loadImageFromURL(event.target.result, state);
    };
    reader.readAsDataURL(file);
}

export function clearImage(state, dom) {
    state.centerImage = null;
    dom.centerImageInput.value = '';
    state.drawWheel();
}
