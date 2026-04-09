/**
 * @file main.js
 * @description Main application orchestrator. Handles state management, event wiring, and lifecycle initialization.
 */

import { initTheme, applyTheme, getTheme } from './theme.js';
import { INITIAL_NAMES } from './constants.js';
import { showError, hideError } from './utils.js';
import { openGallery, loadGalleryImages, searchGallery } from './gallery.js';
import { initGravityEffect } from './gravity.js';
import { generateColors, drawWheel, loadImageFromURL, clearImage, handleImageUpload } from './wheel.js';
import { spinWheel, removeWinnerOnce, removeWinnerAll, updateNames } from './spin.js';
import { saveConfig, loadConfig, clearConfig } from './persistence.js';
import {
  setupTabs,
  setupUITheme,
  applyUITheme,
  setupVolume,
  populateSoundDropdowns,
  handleCustomSound,
  setupAutoApply
} from './ui.js';

/**
 * Global application state object.
 * Contains configuration, animation handles, and shared methods.
 * @namespace
 */
const state = {
  /** @type {string[]} List of names currently on the wheel */
  names: [...INITIAL_NAMES],
  /** @type {string[]} Colors corresponding to each name segment */
  colors: [],
  /** @type {number} Current rotation angle of the wheel in radians */
  startAngle: 0,
  /** @type {boolean} Whether background particles should move at high speed */
  isSpinning: false,
  /** @type {boolean} Whether the wheel itself is currently animating a spin */
  isSpinningWheel: false,
  /** @type {number|null} requestAnimationFrame ID for the current spin */
  animationId: null,
  /** @type {HTMLImageElement|null} The current loaded center image object */
  centerImage: null,
  /** @type {string|null} Source URL of the center image (persisted) */
  centerImageUrl: null,
  /** @type {boolean} Whether the center image is used as a wheel-wide background */
  useImageAsBackground: false,
  /** @type {string|null} Name of the most recent winner */
  lastWinner: null,
  /** @type {number} Current page for gallery API pagination */
  galleryPage: 1,
  /** @type {string[]} Color palette assigned to the wheel segments */
  currentWheelPalette: [],
  /** @type {Object[]} Active particle objects for the gravity background */
  particles: [],
  /** @type {boolean} Tracks if the wheel has ever been spun by the user */
  hasEverSpun: false,
  /** @type {HTMLImageElement|null} Default fallback logo for the center hub */
  defaultCenterImage: null,

  // Shared methods linked to specific context-aware implementations
  drawWheel: () => drawWheel(state, dom),
  generateColors: (count, palette) => generateColors(count, palette),
  syncNamesUI: () => syncNamesUI(),
  loadImageFromURL: (url) => loadImageFromURL(url, state)
};

/**
 * Global dictionary of DOM element references.
 * Populated during the init() call.
 */
const dom = {};

/**
 * Synchronizes the internal names array back to the textarea UI.
 * Triggers a redraw and a persistence save.
 */
function syncNamesUI() {
  state.colors = generateColors(state.names.length, state.currentWheelPalette);
  dom.namesInput.value = state.names.join('\n');
  dom.winnerToast.classList.remove('visible');
  state.lastWinner = null;
  state.drawWheel();
  save();
}

/**
 * Central wrapper for state persistence.
 */
function save() {
  saveConfig(state, dom);
}

/**
 * Initializes and wires theme switcher buttons (Light/Dark/Auto).
 * Handles both desktop and mobile navigation variants.
 */
function setupThemeSwitcher() {
  const switchers = [
    document.getElementById('theme-switcher'),
    document.getElementById('theme-switcher-mobile')
  ].filter(Boolean);

  const activeTheme = getTheme();

  /** Updates the visual "active" class on the switcher buttons */
  const updateActiveButtons = (theme) => {
    switchers.forEach(switcher => {
      switcher.querySelectorAll('button').forEach(btn => {
        if (btn.getAttribute('data-theme-value') === theme) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    });
  };

  updateActiveButtons(activeTheme);

  switchers.forEach(switcher => {
    switcher.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const themeValue = btn.getAttribute('data-theme-value');
        applyTheme(themeValue);
        updateActiveButtons(themeValue);
        save();
      });
    });
  });
}

/**
 * Initializes the mobile hamburger menu and drawer interactions.
 */
function setupHamburger() {
  const menuBtn = document.getElementById('nav-menu-btn');
  const drawer = document.getElementById('nav-drawer');
  if (!menuBtn || !drawer) return;

  menuBtn.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('open');
    if (isOpen) {
      closeDrawer();
    } else {
      drawer.classList.add('open');
      menuBtn.setAttribute('aria-expanded', 'true');
    }
  });

  // Close drawer when a navigation link is clicked
  drawer.querySelectorAll('.tab-link').forEach(link => {
    link.addEventListener('click', () => closeDrawer());
  });

  // Ensure drawer closes if the window is resized to desktop width
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) closeDrawer();
  });

  function closeDrawer() {
    drawer.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
}

/**
 * Adjusts the canvas resolution to match its displayed element size.
 * Essential for maintaining correct aspect ratios and sharpness.
 */
function resizeCanvas() {
  const wrapper = document.getElementById('wheel-wrapper');
  const canvas = document.getElementById('wheel');
  if (!wrapper || !canvas) return;

  const size = wrapper.clientWidth;
  if (size > 0 && (canvas.width !== size || canvas.height !== size)) {
    canvas.width = size;
    canvas.height = size;
    state.drawWheel();
  }
}

/**
 * Application entry point. Executes on DOMContentLoaded.
 * Performs DOM mapping, state restoration, and multi-module initialization.
 */
function init() {
  // --- DOM Mapping ---
  dom.canvas = document.getElementById('wheel');
  dom.context = dom.canvas.getContext('2d');
  dom.spinBtn = document.getElementById('spin-btn');
  dom.namesInput = document.getElementById('names-input');
  dom.spinInstruction = document.getElementById('spin-instruction');
  dom.winnerToast = document.getElementById('winner-toast');
  dom.winnerText = document.getElementById('winner-text');
  dom.closeToastBtn = document.getElementById('close-toast-btn');
  dom.removeOneBtn = document.getElementById('remove-one-btn');
  dom.removeAllBtn = document.getElementById('remove-all-btn');
  dom.themeSwitcher = document.getElementById('theme-switcher');
  dom.volumeSlider = document.getElementById('volume-slider');
  dom.volumeValue = document.getElementById('volume-value');
  dom.spinDurationInput = document.getElementById('spin-duration');
  dom.winnerMessageInput = document.getElementById('winner-message');
  dom.spinningSoundSelect = document.getElementById('spinning-sound');
  dom.winnerSoundSelect = document.getElementById('winner-sound');
  dom.centerImageInput = document.getElementById('center-image-input');
  dom.clearImageBtn = document.getElementById('clear-image-btn');
  dom.imageSizeSelect = document.getElementById('image-size-select');
  dom.customMusicInput = document.getElementById('custom-music-input');
  dom.customSfxInput = document.getElementById('custom-sfx-input');
  dom.imageBgToggle = document.getElementById('image-bg-toggle');
  dom.versionDisplay = document.getElementById('version-display');

  dom.galleryModal = document.getElementById('gallery-modal');
  dom.galleryCloseBtn = document.getElementById('gallery-close-btn');
  dom.galleryGrid = document.getElementById('gallery-grid');
  dom.galleryLoadMore = document.getElementById('gallery-load-more');
  dom.browseGalleryBtn = document.getElementById('browse-gallery-btn');
  dom.gallerySearchInput = document.getElementById('gallery-search-input');
  dom.gallerySearchBtn = document.getElementById('gallery-search-btn');

  dom.namesInput.value = state.names.join('\n');

  // Redefine the gallery-accessible loadImageFromURL wrapper to include save(),
  // now that save() is properly closed over state and dom.
  state.loadImageFromURL = (url) => loadImageFromURL(url, state, save);

  // --- Core Lifecycle Init ---
  initTheme(); // Set system theme preference (Auto/Light/Dark)
  setupUITheme(state); // Setup UI color palette
  initGravityEffect(state, dom); // Start background particle animation
  setupVolume(dom); // Wire audio volume slider
  populateSoundDropdowns(dom); // Fill music/SFX menus
  setupTabs(); // Initialize side panel tab logic
  setupThemeSwitcher(); // Wire nav theme buttons
  setupHamburger(); // Wire mobile menu
  
  // --- Version Information ---
  if (dom.versionDisplay) {
    const releaseUrl = `https://github.com/guinuxbr/orbit/releases/tag/v${__APP_VERSION__}`;
    dom.versionDisplay.innerHTML = `<a href="${releaseUrl}" target="_blank" rel="noopener noreferrer" class="hover:text-primary transition-colors">v${__APP_VERSION__}</a> (<a href="${releaseUrl}" target="_blank" rel="noopener noreferrer" class="hover:text-primary transition-colors">${__COMMIT_HASH__}</a>, ${__BUILD_DATE__})`;
  }

  // --- Configuration Restoration ---
  const saved = loadConfig();
  if (saved) {
    if (Array.isArray(saved.names) && saved.names.length > 0) {
      state.names = saved.names;
      dom.namesInput.value = state.names.join('\n');
    }
    if (saved.uiTheme) {
      const themeSelector = document.getElementById('ui-theme-select');
      if (themeSelector) themeSelector.value = saved.uiTheme;
      applyUITheme(saved.uiTheme, state);
    }
    if (saved.spinDuration && dom.spinDurationInput) dom.spinDurationInput.value = saved.spinDuration;
    if (saved.winnerMessage && dom.winnerMessageInput) dom.winnerMessageInput.value = saved.winnerMessage;
    if (saved.volume && dom.volumeSlider) {
      dom.volumeSlider.value = saved.volume;
      if (dom.volumeValue) dom.volumeValue.textContent = `${saved.volume}%`;
    }
    if (saved.spinningSound && dom.spinningSoundSelect) dom.spinningSoundSelect.value = saved.spinningSound;
    if (saved.winnerSound && dom.winnerSoundSelect) dom.winnerSoundSelect.value = saved.winnerSound;
    if (saved.imageBg != null && dom.imageBgToggle) {
      dom.imageBgToggle.checked = Boolean(saved.imageBg);
      state.useImageAsBackground = Boolean(saved.imageBg);
    }
    if (saved.imageSize && dom.imageSizeSelect) dom.imageSizeSelect.value = saved.imageSize;
    if (saved.lightDarkTheme) applyTheme(saved.lightDarkTheme);
    
    // Asynchronous image restoration
    if (saved.centerImageUrl) {
      loadImageFromURL(saved.centerImageUrl, state, save);
    }
  }

  // Pre-generate segment colors for the initial draw
  state.colors = generateColors(state.names.length, state.currentWheelPalette);

  // Layout synchronization
  resizeCanvas();

  let canvasResizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(canvasResizeTimer);
    canvasResizeTimer = setTimeout(resizeCanvas, 100);
  });

  // Observe wrapper size changes (e.g., side panel opening/closing) to adjust canvas resolution
  if (typeof ResizeObserver !== 'undefined') {
    const wrapper = document.getElementById('wheel-wrapper');
    if (wrapper) {
      new ResizeObserver(() => {
        clearTimeout(canvasResizeTimer);
        canvasResizeTimer = setTimeout(resizeCanvas, 50);
      }).observe(wrapper);
    }
  }

  // Load default center hub logo
  const defaultLogoImage = new Image();
  defaultLogoImage.onload = () => {
    state.defaultCenterImage = defaultLogoImage;
    state.drawWheel();
  };
  defaultLogoImage.src = '/img/sun_icon.png';

  state.drawWheel();

  // --- Primary Event Wiring ---
  dom.spinBtn.addEventListener('click', () => spinWheel(state, dom));

  let namesDebounceTimer;
  dom.namesInput.addEventListener('input', () => {
    clearTimeout(namesDebounceTimer);
    namesDebounceTimer = setTimeout(() => {
      updateNames(state, dom);
      save();
    }, 300);
  });

  setupAutoApply(state, dom, save);

  // Volume: setupVolume drives audio - this listener ensures persistence
  dom.volumeSlider.addEventListener('input', () => save());

  dom.customMusicInput.addEventListener('change', (event) => handleCustomSound(event, 'music', dom));
  dom.customSfxInput.addEventListener('change', (event) => handleCustomSound(event, 'sfx', dom));

  dom.centerImageInput.addEventListener('change', (event) => handleImageUpload(event, state, save));
  dom.clearImageBtn.addEventListener('click', () => { clearImage(state, dom); save(); });

  dom.imageSizeSelect.addEventListener('change', () => {
    state.drawWheel();
    save();
  });

  dom.imageBgToggle.addEventListener('change', () => {
    state.useImageAsBackground = dom.imageBgToggle.checked;
    state.drawWheel();
    save();
  });

  if (dom.browseGalleryBtn) dom.browseGalleryBtn.addEventListener('click', () => openGallery(state, dom));
  if (dom.galleryCloseBtn) dom.galleryCloseBtn.addEventListener('click', () => dom.galleryModal.classList.add('hidden'));
  if (dom.galleryLoadMore) dom.galleryLoadMore.addEventListener('click', () => loadGalleryImages(state, dom));

  if (dom.gallerySearchBtn) dom.gallerySearchBtn.addEventListener('click', () => searchGallery(state, dom));
  if (dom.gallerySearchInput) {
    dom.gallerySearchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') searchGallery(state, dom);
    });
  }

  dom.removeOneBtn.addEventListener('click', () => { removeWinnerOnce(state); save(); });
  dom.removeAllBtn.addEventListener('click', () => { removeWinnerAll(state); save(); });
  dom.closeToastBtn.addEventListener('click', () => dom.winnerToast.classList.remove('visible'));

  // --- Reset Workflow (Custom Modal) ---
  const resetModal    = document.getElementById('reset-modal');
  const resetCancel   = document.getElementById('reset-modal-cancel');
  const resetConfirm  = document.getElementById('reset-modal-confirm');

  const openResetModal  = () => resetModal?.classList.remove('hidden');
  const closeResetModal = () => resetModal?.classList.add('hidden');

  ['reset-config-btn', 'reset-config-btn-mobile'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', openResetModal);
  });

  if (resetCancel)  resetCancel.addEventListener('click', closeResetModal);
  if (resetModal)   resetModal.addEventListener('click', (event) => { if (event.target === resetModal) closeResetModal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeResetModal(); });

  if (resetConfirm) {
    resetConfirm.addEventListener('click', () => {
      clearConfig();
      location.reload();
    });
  }

  if (dom.galleryModal) {
    dom.galleryModal.addEventListener('click', (event) => {
      if (event.target === dom.galleryModal) dom.galleryModal.classList.add('hidden');
    });
  }

  const closeErrorBtn = document.getElementById('close-error-btn');
  if (closeErrorBtn) closeErrorBtn.addEventListener('click', hideError);
}

// Start the application
window.addEventListener('DOMContentLoaded', init);
