/**
 * tests/gallery.test.js
 * Unit tests for gallery provider resolution, custom API key storage, Pexels attribution, and UI updates.
 */

import { test, expect, describe, beforeEach, afterEach, vi } from 'vitest';
import {
    STORAGE_KEY_PEXELS,
    OFFICIAL_HOST,
    getCustomApiKey,
    setCustomApiKey,
    clearCustomApiKey,
    getActiveProvider,
    updateGalleryUI,
    loadGalleryImages
} from '../src/gallery.js';

describe('gallery.js — API Key Management', () => {
    let store = {};
    const localStorageStub = {
        getItem: (k) => store[k] ?? null,
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { store = {}; },
    };

    beforeEach(() => {
        store = {};
        vi.stubGlobal('localStorage', localStorageStub);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test('getCustomApiKey returns empty string when not set', () => {
        expect(getCustomApiKey()).toBe('');
    });

    test('setCustomApiKey persists trimmed key to localStorage', () => {
        setCustomApiKey('  test_key_12345  ');
        expect(getCustomApiKey()).toBe('test_key_12345');
        expect(localStorage.getItem(STORAGE_KEY_PEXELS)).toBe('test_key_12345');
    });

    test('setCustomApiKey removes key when given null or empty string', () => {
        setCustomApiKey('key_to_remove');
        expect(getCustomApiKey()).toBe('key_to_remove');

        setCustomApiKey('');
        expect(getCustomApiKey()).toBe('');
        expect(localStorage.getItem(STORAGE_KEY_PEXELS)).toBeNull();
    });

    test('clearCustomApiKey removes the stored key', () => {
        setCustomApiKey('my_secret_key');
        clearCustomApiKey();
        expect(getCustomApiKey()).toBe('');
        expect(localStorage.getItem(STORAGE_KEY_PEXELS)).toBeNull();
    });
});

describe('gallery.js — Provider Selection (getActiveProvider)', () => {
    let store = {};
    const localStorageStub = {
        getItem: (k) => store[k] ?? null,
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { store = {}; },
    };

    beforeEach(() => {
        store = {};
        vi.stubGlobal('localStorage', localStorageStub);
        vi.stubGlobal('location', { hostname: 'localhost' });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test('returns openverse by default on localhost without key', () => {
        const provider = getActiveProvider();
        expect(provider.type).toBe('openverse');
        expect(provider.label).toContain('Openverse');
    });

    test('returns proxy when hostname matches OFFICIAL_HOST without key', () => {
        vi.stubGlobal('location', { hostname: OFFICIAL_HOST });
        const provider = getActiveProvider();
        expect(provider.type).toBe('proxy');
        expect(provider.label).toContain('Proxy');
        expect(provider.proxyUrl).toBeDefined();
    });

    test('prefers user BYOK pexels-direct over proxy even on official host', () => {
        vi.stubGlobal('location', { hostname: OFFICIAL_HOST });
        setCustomApiKey('custom_pexels_key_abc');

        const provider = getActiveProvider();
        expect(provider.type).toBe('pexels-direct');
        expect(provider.key).toBe('custom_pexels_key_abc');
        expect(provider.label).toContain('BYOK');
    });

    test('returns pexels-direct on localhost when user key is provided', () => {
        vi.stubGlobal('location', { hostname: 'localhost' });
        setCustomApiKey('custom_local_key');

        const provider = getActiveProvider();
        expect(provider.type).toBe('pexels-direct');
        expect(provider.key).toBe('custom_local_key');
    });
});

describe('gallery.js — updateGalleryUI', () => {
    let store = {};
    const localStorageStub = {
        getItem: (k) => store[k] ?? null,
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { store = {}; },
    };
    let dom;

    beforeEach(() => {
        store = {};
        vi.stubGlobal('localStorage', localStorageStub);
        vi.stubGlobal('location', { hostname: 'localhost' });

        dom = {
            gallerySearchInput: document.createElement('input'),
            galleryProviderBadge: document.createElement('span'),
            galleryKeyInput: document.createElement('input'),
            galleryKeyBtn: document.createElement('button'),
            galleryAttribution: document.createElement('div')
        };
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test('updates placeholders, badge, and attribution for Openverse provider', () => {
        updateGalleryUI(dom);
        expect(dom.gallerySearchInput.placeholder).toContain('Openverse');
        expect(dom.galleryProviderBadge.textContent).toContain('Openverse');
        expect(dom.galleryAttribution.innerHTML).toContain('Openverse');
        expect(dom.galleryKeyBtn.classList.contains('ring-2')).toBe(false);
    });

    test('updates placeholders, active ring, and Pexels attribution when custom key is set', () => {
        setCustomApiKey('saved_key_xyz');
        updateGalleryUI(dom);

        expect(dom.gallerySearchInput.placeholder).toContain('high-quality');
        expect(dom.galleryProviderBadge.textContent).toContain('BYOK');
        expect(dom.galleryAttribution.innerHTML).toContain('Pexels');
        expect(dom.galleryAttribution.innerHTML).toContain('https://www.pexels.com');
        expect(dom.galleryKeyInput.value).toBe('saved_key_xyz');
        expect(dom.galleryKeyBtn.classList.contains('ring-2')).toBe(true);
    });
});

describe('gallery.js — loadGalleryImages integration with Pexels BYOK', () => {
    let store = {};
    const localStorageStub = {
        getItem: (k) => store[k] ?? null,
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { store = {}; },
    };
    let dom;
    let state;
    const originalFetch = global.fetch;

    beforeEach(() => {
        store = {};
        vi.stubGlobal('localStorage', localStorageStub);
        vi.stubGlobal('location', { hostname: 'localhost' });

        dom = {
            gallerySearchInput: document.createElement('input'),
            galleryGrid: document.createElement('div'),
            galleryModal: document.createElement('div'),
            galleryAttribution: document.createElement('div')
        };
        state = {
            galleryPage: 1,
            loadImageFromURL: vi.fn()
        };
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.unstubAllGlobals();
    });

    test('calls Pexels with Authorization header, parses photos, and renders photographer credit', async () => {
        setCustomApiKey('test_user_key');
        dom.gallerySearchInput.value = 'mountains';

        let capturedUrl = '';
        let capturedHeaders = {};

        global.fetch = vi.fn().mockImplementation((url, options) => {
            capturedUrl = url;
            capturedHeaders = options?.headers || {};
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    photos: [
                        {
                            id: 101,
                            photographer: 'Alice Nature',
                            photographer_url: 'https://www.pexels.com/@alicenature',
                            url: 'https://www.pexels.com/photo/101',
                            src: {
                                medium: 'https://images.pexels.com/medium.jpg',
                                large2x: 'https://images.pexels.com/large.jpg'
                            }
                        }
                    ]
                })
            });
        });

        await loadGalleryImages(state, dom);

        expect(capturedUrl).toContain('https://api.pexels.com/v1/search?query=mountains');
        expect(capturedHeaders.Authorization).toBe('test_user_key');
        expect(state.galleryPage).toBe(2);

        const images = dom.galleryGrid.querySelectorAll('img');
        expect(images.length).toBe(1);
        expect(images[0].src).toBe('https://images.pexels.com/medium.jpg');
        expect(images[0].alt).toContain('Alice Nature');

        // Check photographer attribution link inside card caption
        const authorLinks = dom.galleryGrid.querySelectorAll('.gallery-caption a');
        expect(authorLinks.length).toBe(2);
        expect(authorLinks[0].href).toBe('https://www.pexels.com/@alicenature');
        expect(authorLinks[0].textContent).toBe('Alice Nature');
    });

    test('falls back to Picsum list when query is empty', async () => {
        dom.gallerySearchInput.value = '';

        global.fetch = vi.fn().mockImplementation(() => {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                    { id: 201, author: 'Bob Builder' }
                ])
            });
        });

        await loadGalleryImages(state, dom);

        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('https://picsum.photos/v2/list'));
        const images = dom.galleryGrid.querySelectorAll('img');
        expect(images.length).toBe(1);
    });
});
