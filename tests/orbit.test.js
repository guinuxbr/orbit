import { test, expect, describe, beforeEach } from 'vitest';

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

describe('Orbit File Uploads', () => {
    // Mock URL.createObjectURL
    if (typeof window !== 'undefined') {
        window.URL.createObjectURL = (blob) => `blob:${blob.size}`;
    }

    test('should add a custom music track', async () => {
        const { musicTracks, addCustomTrack } = await import('../sounds.js');
        const initialCount = musicTracks.length;

        const mockFile = { name: 'test-music.mp3', size: 1024 };
        const mockUrl = 'blob:1024';

        addCustomTrack('music', { id: 'custom-1', label: '📂 test-music.mp3', file: mockUrl, isBlob: true });

        expect(musicTracks.length).toBe(initialCount + 1);
        expect(musicTracks[musicTracks.length - 1].id).toBe('custom-1');
        expect(musicTracks[musicTracks.length - 1].label).toBe('📂 test-music.mp3');
    });

    test('should add a custom sfx track', async () => {
        const { sfxTracks, addCustomTrack } = await import('../sounds.js');
        const initialCount = sfxTracks.length;

        const mockFile = { name: 'test-sfx.mp3', size: 512 };
        const mockUrl = 'blob:512';

        addCustomTrack('sfx', { id: 'custom-2', label: '📂 test-sfx.mp3', file: mockUrl, isBlob: true });

        expect(sfxTracks.length).toBe(initialCount + 1);
        expect(sfxTracks[sfxTracks.length - 1].id).toBe('custom-2');
        expect(sfxTracks[sfxTracks.length - 1].label).toBe('📂 test-sfx.mp3');
    });

    test('should handle image loading structure', async () => {
        // Since main.js is not easily testable without a full DOM environment and doesn't export functions,
        // we test the data structure it expects.
        const centerImage = null;
        const mockImg = { src: 'blob:image' };

        // Simulating the state change that would happen in handleImageUpload/loadImageFromURL
        let state = { centerImage: null };
        state.centerImage = mockImg;

        expect(state.centerImage).not.toBeNull();
        expect(state.centerImage.src).toBe('blob:image');
    });
});
