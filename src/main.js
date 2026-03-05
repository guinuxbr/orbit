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
 */
function setupThemeSwitcher() {
  if (!dom.themeSwitcher) return;
  const buttons = dom.themeSwitcher.querySelectorAll('button');
  const activeTheme = getTheme();

  const updateActiveButton = (theme) => {
    buttons.forEach(btn => {
      if (btn.getAttribute('data-theme-value') === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  };

  updateActiveButton(activeTheme);

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme-value');
      applyTheme(theme);
      updateActiveButton(theme);
    });
  });
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

  state.colors = generateColors(state.names.length, state.currentWheelPalette);

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

  // Global click listener to close settings when clicking outside
  document.addEventListener('click', (e) => {
    const settingsPanel = document.querySelector('.settings-panel');
    if (!settingsPanel) return;
    if (!settingsPanel.classList.contains('open')) return;
    const isClickInside = settingsPanel.contains(e.target);
    const isClickOnTab = e.target.closest('.tab-link');
    if (!isClickInside && !isClickOnTab) {
      settingsPanel.classList.remove('open');
      settingsPanel.style.display = 'none';
      document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
    }
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
