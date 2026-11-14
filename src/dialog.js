/**
 * Native <dialog> top-layer helpers with feature-detected exit animation
 * and light-dismiss fallbacks per modern web guidance.
 */

let canTransitionDisplayCached;

/**
 * Probes whether the browser actually transitions the `display` property
 * (Firefox 129+ parses `transition-behavior: allow-discrete` without transitioning `display`).
 * @returns {boolean}
 */
function canTransitionDisplay() {
    if (canTransitionDisplayCached !== undefined) return canTransitionDisplayCached;
    if (typeof document === 'undefined' || !document.body) return false;

    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;display:none;transition:display 1ms allow-discrete';
    document.body.append(el);
    el.getBoundingClientRect();
    el.style.display = 'block';
    const computed = getComputedStyle(el).display;
    el.remove();

    canTransitionDisplayCached = computed === 'none';
    return canTransitionDisplayCached;
}

/**
 * Checks whether native CSS-only top-layer entry/exit transitions work.
 * @returns {boolean}
 */
function supportsTopLayerExit() {
    return (
        typeof CSS !== 'undefined' &&
        typeof CSS.supports === 'function' &&
        CSS.supports('overlay', 'auto') &&
        canTransitionDisplay()
    );
}

/**
 * Opens a <dialog> modally (falling back to `.hidden` removal for non-dialog mocks).
 * @param {HTMLDialogElement|HTMLElement|null} dialog
 */
export function openDialog(dialog) {
    if (!dialog) return;
    dialog.removeAttribute?.('data-closing');
    if (typeof dialog.showModal === 'function') {
        if (!dialog.open) dialog.showModal();
    } else {
        dialog.classList?.remove('hidden');
    }
}

/**
 * Closes a <dialog>, using WAAPI `[data-closing]` sequencing when native
 * `overlay` + `display` exit transitions are unsupported.
 * @param {HTMLDialogElement|HTMLElement|null} dialog
 */
export function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close !== 'function') {
        dialog.classList?.add('hidden');
        return;
    }
    if (!dialog.open) return;

    if (supportsTopLayerExit()) {
        dialog.close();
        return;
    }

    if (dialog.hasAttribute('data-closing')) return;
    dialog.setAttribute('data-closing', '');

    const animations = typeof dialog.getAnimations === 'function'
        ? dialog.getAnimations({ subtree: true }).map(anim => anim.finished)
        : [];

    if (animations.length === 0) {
        dialog.removeAttribute('data-closing');
        dialog.close();
        return;
    }

    const timeout = new Promise(resolve => setTimeout(resolve, 2000));
    Promise.race([Promise.allSettled(animations), timeout]).then(() => {
        if (dialog.open) {
            dialog.removeAttribute('data-closing');
            dialog.close();
        }
    });
}

/**
 * Attaches Escape exit-animation coordination (`cancel` event) and a
 * `closedby="any"` light-dismiss fallback for browsers without `closedBy` support.
 * @param {HTMLDialogElement|null} dialog
 */
export function wireDialogLightDismiss(dialog) {
    if (!dialog || typeof dialog.addEventListener !== 'function') return;

    dialog.addEventListener('cancel', (event) => {
        if (!supportsTopLayerExit() && event.cancelable) {
            event.preventDefault();
            closeDialog(dialog);
        }
    });

    if (typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
        let downOutside = false;

        const isOutsideDialog = (event) => {
            const rect = dialog.getBoundingClientRect();
            return (
                event.clientX < rect.left ||
                event.clientX > rect.right ||
                event.clientY < rect.top ||
                event.clientY > rect.bottom
            );
        };

        dialog.addEventListener('pointerdown', (event) => {
            downOutside = event.target === dialog && isOutsideDialog(event);
        });

        dialog.addEventListener('pointerup', (event) => {
            if (downOutside && event.target === dialog && isOutsideDialog(event)) {
                closeDialog(dialog);
            }
            downOutside = false;
        });
    }
}

