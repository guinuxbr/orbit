// ============================================
// main.js — Orbit (Refactored)
// ============================================

import { initTheme, applyTheme, getTheme } from './theme.js';
import { INITIAL_NAMES } from './constants.js';
import { showError, hideError } from './utils.js';
import { openGallery, loadGalleryImages, searchGallery } from './gallery.js';
import { initGravityEffect } from './gravity.js';
import { generateColors, drawWheel, loadImageFromURL, clearImage, handleImageUpload } from './wheel.js';
import { spinWheel, removeWinnerOnce, removeWinnerAll, updateNames } from './spin.js';
import {
  setupTabs,
  setupUITheme,
  applyUITheme,
  setupVolume,
  populateSoundDropdowns,
  handleCustomSound,
  setupAutoApply
} from './ui.js';

// ---- State & DOM ----
const state = {
  names: [...INITIAL_NAMES],
  colors: [],
  startAngle: 0,
  isSpinning: false,
  isSpinningWheel: false,
  animationId: null,
  centerImage: null,
  useImageAsBackground: false,
  lastWinner: null,
  galleryPage: 1,
  currentWheelPalette: [],
  particles: [],
  hasEverSpun: false,
  defaultCenterImage: null,

  // Methods that need to be accessed by modules
  drawWheel: () => drawWheel(state, dom),
  generateColors: (count, palette) => generateColors(count, palette),
  syncNamesUI: () => syncNamesUI(),
  loadImageFromURL: (url) => loadImageFromURL(url, state)
};

const dom = {};

/**
 * Synchronizes the names from the array back to the textarea UI.
 */
function syncNamesUI() {
  state.colors = generateColors(state.names.length, state.currentWheelPalette);
  dom.namesInput.value = state.names.join('\n');
  dom.winnerToast.classList.remove('visible');
  state.lastWinner = null;
  state.drawWheel();
}

/**
 * Sets up the theme switcher event listeners and active state.
 * Handles both desktop (#theme-switcher) and mobile (#theme-switcher-mobile).
 */
function setupThemeSwitcher() {
  const switchers = [
    document.getElementById('theme-switcher'),
    document.getElementById('theme-switcher-mobile')
  ].filter(Boolean);

  const activeTheme = getTheme();

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
        const theme = btn.getAttribute('data-theme-value');
        applyTheme(theme);
        updateActiveButtons(theme);
      });
    });
  });
}

/**
 * Sets up the hamburger button to toggle the mobile nav drawer.
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

  // Close drawer when a tab is clicked (mobile)
  drawer.querySelectorAll('.tab-link').forEach(link => {
    link.addEventListener('click', () => closeDrawer());
  });

  // Close drawer on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) closeDrawer();
  });

  function closeDrawer() {
    drawer.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
}

/**
 * Resizes the canvas to match the actual pixel size of its wrapper,
 * then redraws the wheel. Called on init and debounced on resize.
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
 * Main initialization entry point.
 */
function init() {
  // DOM References
  dom.canvas = document.getElementById('wheel');
  dom.ctx = dom.canvas.getContext('2d');
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

  dom.galleryModal = document.getElementById('gallery-modal');
  dom.galleryCloseBtn = document.getElementById('gallery-close-btn');
  dom.galleryGrid = document.getElementById('gallery-grid');
  dom.galleryLoadMore = document.getElementById('gallery-load-more');
  dom.browseGalleryBtn = document.getElementById('browse-gallery-btn');
  dom.gallerySearchInput = document.getElementById('gallery-search-input');
  dom.gallerySearchBtn = document.getElementById('gallery-search-btn');

  dom.namesInput.value = state.names.join('\n');

  initTheme(); // System theme (Auto/Light/Dark)
  setupUITheme(state); // Color palette theme
  initGravityEffect(state, dom); // Initialize gravity particle effect
  setupVolume(dom);
  populateSoundDropdowns(dom);
  setupTabs();
  setupThemeSwitcher();
  setupHamburger();

  state.colors = generateColors(state.names.length, state.currentWheelPalette);

  // Resize canvas to wrapper size before first draw
  resizeCanvas();

  // Also listen for window resize (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 100);
  });

  // Use ResizeObserver for wrapper changes (e.g., settings panel toggling)
  if (typeof ResizeObserver !== 'undefined') {
    const wrapper = document.getElementById('wheel-wrapper');
    if (wrapper) {
      new ResizeObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resizeCanvas, 50);
      }).observe(wrapper);
    }
  }

  // Preload default center image
  const sunImg = new Image();
  sunImg.onload = () => {
    state.defaultCenterImage = sunImg;
    state.drawWheel();
  };
  sunImg.src = '/img/sun_icon.png';

  state.drawWheel();

  dom.spinBtn.addEventListener('click', () => spinWheel(state, dom));

  let debounceTimer;
  dom.namesInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => updateNames(state, dom), 300);
  });

  setupAutoApply(state, dom);

  dom.customMusicInput.addEventListener('change', (e) => handleCustomSound(e, 'music', dom));
  dom.customSfxInput.addEventListener('change', (e) => handleCustomSound(e, 'sfx', dom));

  dom.centerImageInput.addEventListener('change', (e) => handleImageUpload(e, state));
  dom.clearImageBtn.addEventListener('click', () => clearImage(state, dom));

  dom.imageSizeSelect.addEventListener('change', () => state.drawWheel());

  dom.imageBgToggle.addEventListener('change', () => {
    state.useImageAsBackground = dom.imageBgToggle.checked;
    state.drawWheel();
  });

  if (dom.browseGalleryBtn) dom.browseGalleryBtn.addEventListener('click', () => openGallery(state, dom));
  if (dom.galleryCloseBtn) dom.galleryCloseBtn.addEventListener('click', () => dom.galleryModal.classList.add('hidden'));
  if (dom.galleryLoadMore) dom.galleryLoadMore.addEventListener('click', () => loadGalleryImages(state, dom));

  if (dom.gallerySearchBtn) dom.gallerySearchBtn.addEventListener('click', () => searchGallery(state, dom));
  if (dom.gallerySearchInput) {
    dom.gallerySearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') searchGallery(state, dom);
    });
  }

  dom.removeOneBtn.addEventListener('click', () => removeWinnerOnce(state));
  dom.removeAllBtn.addEventListener('click', () => removeWinnerAll(state));
  dom.closeToastBtn.addEventListener('click', () => dom.winnerToast.classList.remove('visible'));

  if (dom.galleryModal) {
    dom.galleryModal.addEventListener('click', (e) => {
      if (e.target === dom.galleryModal) dom.galleryModal.classList.add('hidden');
    });
  }

  const closeErrorBtn = document.getElementById('close-error-btn');
  if (closeErrorBtn) closeErrorBtn.addEventListener('click', hideError);
}

window.addEventListener('DOMContentLoaded', init);
