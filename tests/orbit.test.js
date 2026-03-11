/**
 * orbit.test.js — Orbit comprehensive test suite
 *
 * Runs in Vitest (jsdom environment for DOM-dependent modules).
 */

import { test, expect, describe, beforeEach, afterEach, vi } from 'vitest';

// ============================================================
// 1. CONSTANTS
// ============================================================
describe('Constants', () => {
    test('INITIAL_NAMES is a non-empty array of strings', async () => {
        const { INITIAL_NAMES } = await import('../src/constants.js');
        expect(Array.isArray(INITIAL_NAMES)).toBe(true);
        expect(INITIAL_NAMES.length).toBeGreaterThan(0);
        INITIAL_NAMES.forEach(name => expect(typeof name).toBe('string'));
    });

    test('PALETTE is a non-empty array of hex colour strings', async () => {
        const { PALETTE } = await import('../src/constants.js');
        expect(Array.isArray(PALETTE)).toBe(true);
        expect(PALETTE.length).toBeGreaterThan(0);
        PALETTE.forEach(colour => expect(colour).toMatch(/^#[0-9a-fA-F]{6}$/));
    });

    test('UI_THEMES entries have required fields', async () => {
        const { UI_THEMES } = await import('../src/constants.js');
        expect(Array.isArray(UI_THEMES)).toBe(true);
        expect(UI_THEMES.length).toBeGreaterThan(0);
        UI_THEMES.forEach(theme => {
            expect(theme).toHaveProperty('id');
            expect(theme).toHaveProperty('label');
            expect(theme).toHaveProperty('primary');
            expect(theme).toHaveProperty('sec');
            expect(theme).toHaveProperty('accent');
        });
    });

    test('UI_THEMES ids are unique', async () => {
        const { UI_THEMES } = await import('../src/constants.js');
        const ids = UI_THEMES.map(t => t.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });
});

// ============================================================
// 2. UTILS — easeOut
// ============================================================
describe('utils.js – easeOut', () => {
    test('easeOut returns 0 at t=0', async () => {
        const { easeOut } = await import('../src/utils.js');
        expect(easeOut(0, 0, 1, 1)).toBeCloseTo(0);
    });

    test('easeOut returns 1 at t=d (full progress)', async () => {
        const { easeOut } = await import('../src/utils.js');
        expect(easeOut(1, 0, 1, 1)).toBeCloseTo(1);
    });

    test('easeOut at t=0.5 is between 0 and 1', async () => {
        const { easeOut } = await import('../src/utils.js');
        const result = easeOut(0.5, 0, 1, 1);
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(1);
    });

    test('easeOut offset: b=10 c=10 gives 10 at t=0', async () => {
        const { easeOut } = await import('../src/utils.js');
        expect(easeOut(0, 10, 10, 1)).toBeCloseTo(10);
    });

    test('easeOut offset: b=10 c=10 gives 20 at t=d', async () => {
        const { easeOut } = await import('../src/utils.js');
        expect(easeOut(1, 10, 10, 1)).toBeCloseTo(20);
    });
});

// ============================================================
// 3. UTILS — validateFile
// ============================================================
describe('utils.js – validateFile', () => {
    test('returns false when file is null', async () => {
        const { validateFile } = await import('../src/utils.js');
        expect(validateFile(null, {})).toBe(false);
    });

    test('returns false when file is undefined', async () => {
        const { validateFile } = await import('../src/utils.js');
        expect(validateFile(undefined, {})).toBe(false);
    });

    test('returns false when file exceeds maxSizeMB', async () => {
        const { validateFile } = await import('../src/utils.js');
        const bigFile = { name: 'big.mp3', size: 10 * 1024 * 1024, type: 'audio/mp3' };
        expect(validateFile(bigFile, { maxSizeMB: 3 })).toBe(false);
    });

    test('returns false when MIME prefix does not match', async () => {
        const { validateFile } = await import('../src/utils.js');
        const wrongMime = { name: 'file.exe', size: 100, type: 'application/exe' };
        expect(validateFile(wrongMime, { allowedMimePrefix: 'audio/' })).toBe(false);
    });

    test('returns false when extension is not in allowedExtensions', async () => {
        const { validateFile } = await import('../src/utils.js');
        const wrongExt = { name: 'file.flac', size: 100, type: 'audio/flac' };
        expect(validateFile(wrongExt, { allowedExtensions: ['.mp3', '.wav'] })).toBe(false);
    });

    test('returns true for a valid audio file', async () => {
        const { validateFile } = await import('../src/utils.js');
        const valid = { name: 'track.mp3', size: 1024 * 1024, type: 'audio/mpeg' };
        expect(validateFile(valid, {
            allowedMimePrefix: 'audio/',
            allowedExtensions: ['.mp3', '.wav'],
            maxSizeMB: 3
        })).toBe(true);
    });

    test('returns true for a valid image file', async () => {
        const { validateFile } = await import('../src/utils.js');
        const valid = { name: 'photo.png', size: 500 * 1024, type: 'image/png' };
        expect(validateFile(valid, {
            allowedMimePrefix: 'image/',
            allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
            maxSizeMB: 2
        })).toBe(true);
    });
});

// ============================================================
// 4. WHEEL — generateColors
// ============================================================
describe('wheel.js – generateColors', () => {
    test('returns empty array when count is 0', async () => {
        const { generateColors } = await import('../src/wheel.js');
        expect(generateColors(0, ['#aaa', '#bbb'])).toEqual([]);
    });

    test('cycles palette for count > palette length', async () => {
        const { generateColors } = await import('../src/wheel.js');
        const result = generateColors(4, ['#aaa', '#bbb']);
        expect(result).toEqual(['#aaa', '#bbb', '#aaa', '#bbb']);
    });

    test('returns exactly count items', async () => {
        const { generateColors } = await import('../src/wheel.js');
        const result = generateColors(3, ['#111', '#222', '#333', '#444']);
        expect(result.length).toBe(3);
    });

    test('falls back to PALETTE when currentWheelPalette is empty', async () => {
        const { generateColors } = await import('../src/wheel.js');
        const { PALETTE } = await import('../src/constants.js');
        const result = generateColors(PALETTE.length, []);
        expect(result.length).toBe(PALETTE.length);
        expect(result[0]).toBe(PALETTE[0]);
    });

    test('single palette entry repeated for all segments', async () => {
        const { generateColors } = await import('../src/wheel.js');
        const result = generateColors(5, ['#ff0000']);
        expect(result).toEqual(['#ff0000', '#ff0000', '#ff0000', '#ff0000', '#ff0000']);
    });
});

// ============================================================
// 5. SPIN — updateNames, removeWinnerOnce, removeWinnerAll
// ============================================================
describe('spin.js – name management', () => {
    let state;

    beforeEach(() => {
        state = {
            names: ['Alice', 'Bob', 'Charlie', 'Bob'],
            colors: [],
            currentWheelPalette: ['#aaa', '#bbb'],
            lastWinner: null,
            drawWheel: vi.fn(),
            generateColors: vi.fn(() => ['#aaa', '#bbb', '#aaa', '#bbb']),
            syncNamesUI: vi.fn(),
        };
        // syncNamesUI needs to call drawWheel in real code; wire it up
        state.syncNamesUI = () => {
            state.colors = state.generateColors(state.names.length, state.currentWheelPalette);
            state.lastWinner = null;
            state.drawWheel();
        };
    });

    test('updateNames: parses textarea input into state.names', async () => {
        const { updateNames } = await import('../src/spin.js');
        const dom = { namesInput: { value: 'Alice\nBob\nCharlie\n' } };
        updateNames(state, dom);
        expect(state.names).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    test('updateNames: filters out empty lines', async () => {
        const { updateNames } = await import('../src/spin.js');
        const dom = { namesInput: { value: 'Alice\n\n  \nBob' } };
        updateNames(state, dom);
        expect(state.names).toEqual(['Alice', 'Bob']);
    });

    test('updateNames: trims whitespace from names', async () => {
        const { updateNames } = await import('../src/spin.js');
        const dom = { namesInput: { value: '  Alice  \n  Bob  ' } };
        updateNames(state, dom);
        expect(state.names).toEqual(['Alice', 'Bob']);
    });

    test('updateNames: calls generateColors and drawWheel', async () => {
        const { updateNames } = await import('../src/spin.js');
        const dom = { namesInput: { value: 'X\nY' } };
        updateNames(state, dom);
        expect(state.generateColors).toHaveBeenCalled();
        expect(state.drawWheel).toHaveBeenCalled();
    });

    test('removeWinnerOnce: removes one occurrence of lastWinner', async () => {
        const { removeWinnerOnce } = await import('../src/spin.js');
        state.lastWinner = 'Bob';
        removeWinnerOnce(state);
        // Should remove first occurrence only → ['Alice', 'Charlie', 'Bob']
        expect(state.names).toEqual(['Alice', 'Charlie', 'Bob']);
    });

    test('removeWinnerOnce: does nothing when lastWinner is null', async () => {
        const { removeWinnerOnce } = await import('../src/spin.js');
        state.lastWinner = null;
        const before = [...state.names];
        removeWinnerOnce(state);
        expect(state.names).toEqual(before);
    });

    test('removeWinnerOnce: does nothing when winner is not in list', async () => {
        const { removeWinnerOnce } = await import('../src/spin.js');
        state.lastWinner = 'Dave';
        const before = [...state.names];
        removeWinnerOnce(state);
        expect(state.names).toEqual(before);
    });

    test('removeWinnerAll: removes all occurrences of lastWinner', async () => {
        const { removeWinnerAll } = await import('../src/spin.js');
        state.lastWinner = 'Bob';
        removeWinnerAll(state);
        expect(state.names).toEqual(['Alice', 'Charlie']);
        expect(state.names).not.toContain('Bob');
    });

    test('removeWinnerAll: does nothing when lastWinner is null', async () => {
        const { removeWinnerAll } = await import('../src/spin.js');
        state.lastWinner = null;
        const before = [...state.names];
        removeWinnerAll(state);
        expect(state.names).toEqual(before);
    });
});

// ============================================================
// 6. ORBIT Name Management (existing tests kept intact)
// ============================================================
describe('Orbit Name Management', () => {
    let names = [];

    beforeEach(() => {
        names = ['Alice', 'Bob', 'Charlie'];
    });

    test('should allow adding a name', () => {
        names.push('Dave');
        expect(names).toContain('Dave');
        expect(names.length).toBe(4);
    });

    test('should allow removing a name', () => {
        names = names.filter(n => n !== 'Bob');
        expect(names).not.toContain('Bob');
        expect(names.length).toBe(2);
    });
});

// ============================================================
// 7. ORBIT File Uploads (existing tests kept intact)
// ============================================================
describe('Orbit File Uploads', () => {
    // Mock URL.createObjectURL
    if (typeof window !== 'undefined') {
        window.URL.createObjectURL = (blob) => `blob:${blob.size}`;
    }

    test('should add a custom music track', async () => {
        const { musicTracks, addCustomTrack } = await import('../src/sounds.js');
        const initialCount = musicTracks.length;

        addCustomTrack('music', { id: 'custom-1', label: '📂 test-music.mp3', file: 'blob:1024', isBlob: true });

        expect(musicTracks.length).toBe(initialCount + 1);
        expect(musicTracks[musicTracks.length - 1].id).toBe('custom-1');
        expect(musicTracks[musicTracks.length - 1].label).toBe('📂 test-music.mp3');
    });

    test('should add a custom sfx track', async () => {
        const { sfxTracks, addCustomTrack } = await import('../src/sounds.js');
        const initialCount = sfxTracks.length;

        addCustomTrack('sfx', { id: 'custom-2', label: '📂 test-sfx.mp3', file: 'blob:512', isBlob: true });

        expect(sfxTracks.length).toBe(initialCount + 1);
        expect(sfxTracks[sfxTracks.length - 1].id).toBe('custom-2');
        expect(sfxTracks[sfxTracks.length - 1].label).toBe('📂 test-sfx.mp3');
    });

    test('should handle image loading structure', () => {
        let state = { centerImage: null };
        const mockImg = { src: 'blob:image' };
        state.centerImage = mockImg;

        expect(state.centerImage).not.toBeNull();
        expect(state.centerImage.src).toBe('blob:image');
    });
});

// ============================================================
// 8. THEME — getTheme, applyTheme, initTheme
// ============================================================
describe('theme.js', () => {
    // Use a simple in-memory store to stand in for localStorage
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
        // jsdom does not implement window.matchMedia; stub it
        vi.stubGlobal('matchMedia', (query) => ({
            matches: false,
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {},
        }));
        document.documentElement.removeAttribute('data-theme');
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test('getTheme returns "auto" when nothing is stored', async () => {
        const { getTheme } = await import('../src/theme.js');
        expect(getTheme()).toBe('auto');
    });

    test('getTheme returns previously saved theme', async () => {
        localStorageStub.setItem('orbit-theme', 'dark');
        const { getTheme } = await import('../src/theme.js');
        expect(getTheme()).toBe('dark');
    });

    test('applyTheme("light") sets data-theme="light"', async () => {
        const { applyTheme } = await import('../src/theme.js');
        applyTheme('light');
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    test('applyTheme("dark") sets data-theme="dark"', async () => {
        const { applyTheme } = await import('../src/theme.js');
        applyTheme('dark');
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    test('applyTheme saves to localStorage', async () => {
        const { applyTheme } = await import('../src/theme.js');
        applyTheme('light');
        expect(localStorageStub.getItem('orbit-theme')).toBe('light');
    });

    test('initTheme returns saved theme', async () => {
        localStorageStub.setItem('orbit-theme', 'dark');
        const { initTheme } = await import('../src/theme.js');
        const result = initTheme();
        expect(result).toBe('dark');
    });

    test('initTheme defaults to "auto" when nothing stored', async () => {
        const { initTheme } = await import('../src/theme.js');
        const result = initTheme();
        expect(result).toBe('auto');
    });
});
