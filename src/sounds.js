/**
 * @file sounds.js
 * @description Audio manager handling lazy-loaded music and SFX tracks.
 */

/**
 * Catalog of available music tracks.
 * @type {Array<{id: string, label: string, file: string}>}
 */
export const musicTracks = [
    { id: 'abyssal_annihilation', label: 'Abyssal Annihilation', file: '/audio/music/abyssal_annihilation.mp3' },
    { id: 'annihilation_protocol', label: 'Annihilation Protocol', file: '/audio/music/annihilation_protocol.mp3' },
    { id: 'apex_ascension', label: 'Apex Ascension', file: '/audio/music/apex_ascension.mp3' },
    { id: 'ascension_of_the_valiant', label: 'Ascension of the Valiant', file: '/audio/music/ascension_of_the_valiant.mp3' },
    { id: 'jungle_beat_expedition', label: 'Jungle Beat Expedition', file: '/audio/music/jungle_beat_expedition.mp3' },
    { id: 'log_drum_lullaby', label: 'Log Drum Lullaby', file: '/audio/music/log_drum_lullaby.mp3' },
    { id: 'nebula_bloom', label: 'Nebula Bloom', file: '/audio/music/nebula_bloom.mp3' },
    { id: 'neon_drive', label: 'Neon Drive', file: '/audio/music/neon_drive.mp3' },
    { id: 'nightmare_static', label: 'Nightmare Static', file: '/audio/music/nightmare_static.mp3' },
    { id: 'rhythm_revolution', label: 'Rhythm Revolution', file: '/audio/music/rhythm_revolution.mp3' },
    { id: 'symbolic_desperation', label: 'Symbolic Desperation', file: '/audio/music/symbolic_desperation.mp3' },
    { id: 'whispers_on_the_water', label: 'Whispers on the Water', file: '/audio/music/whispers_on_the_water.mp3' },
];

/**
 * Catalog of available sound effect tracks.
 * @type {Array<{id: string, label: string, file: string}>}
 */
export const sfxTracks = [
    { id: 'cat_meowing', label: 'Cat Meowing', file: '/audio/sfx/cat_meowing.mp3' },
    { id: 'crowd_cheering', label: 'Crowd Cheering', file: '/audio/sfx/crowd_cheering.mp3' },
    { id: 'evil_laughing', label: 'Evil Laughing', file: '/audio/sfx/evil_laughing.mp3' },
    { id: 'fighter_jet', label: 'Fighter Jet', file: '/audio/sfx/fighter_jet.mp3' },
    { id: 'ghostly_whisper', label: 'Ghostly Whisper', file: '/audio/sfx/ghostly_whisper.mp3' },
    { id: 'haunted_house_door', label: 'Haunted House Door', file: '/audio/sfx/haunted_house_door.mp3' },
    { id: 'rally_car', label: 'Rally Car', file: '/audio/sfx/rally_car.mp3' },
    { id: 'the_last_echo', label: 'The Last Echo', file: '/audio/sfx/the_last_echo.mp3' },
    { id: 'thunder', label: 'Thunder', file: '/audio/sfx/thunder.mp3' },
    { id: 'wake_up', label: 'Wake Up', file: '/audio/sfx/wake_up.mp3' },
];

/**
 * Audio element cache for lazy-loading.
 * @type {Map<string, HTMLAudioElement>}
 * @private
 */
const audioCache = new Map();

/**
 * Global volume state (normalized 0.0 to 1.0).
 * @type {number}
 * @private
 */
let currentVolume = 0.5;

/**
 * Reference to the currently playing music track audio element.
 * @type {HTMLAudioElement|null}
 * @private
 */
let currentMusic = null;

/**
 * Reference to the currently playing SFX audio element.
 * @type {HTMLAudioElement|null}
 * @private
 */
let currentSfx = null;

/**
 * ID of currently previewing music option ('none', 'random', or track ID).
 * @type {string|null}
 * @private
 */
let previewMusicOption = null;

/**
 * ID of currently previewing SFX option ('none', 'random', or track ID).
 * @type {string|null}
 * @private
 */
let previewSfxOption = null;

/**
 * Tracking for played tracks in the current cycle to avoid repetition.
 * @type {Set<string>}
 * @private
 */
const playedMusicIds = new Set();

/**
 * @type {Set<string>}
 * @private
 */
const playedSfxIds = new Set();

/**
 * Tracking for last random selections across cycle boundaries.
 * @type {string|null}
 * @private
 */
let lastRandomMusicId = null;

/**
 * @type {string|null}
 * @private
 */
let lastRandomSfxId = null;

/**
 * Resets the history of played random tracks for both music and sound effects.
 */
export function resetRandomHistory() {
    playedMusicIds.clear();
    playedSfxIds.clear();
    lastRandomMusicId = null;
    lastRandomSfxId = null;
}

/**
 * Retrieves or creates an Audio object for the given file path.
 * Implements lazy-loading by caching audio elements.
 * @param {string} filePath - The path to the audio file or a Blob URL.
 * @returns {HTMLAudioElement} The audio element.
 * @private
 */
function getAudio(filePath) {
    if (!audioCache.has(filePath)) {
        const audio = new Audio(filePath);
        audio.preload = 'auto';
        audioCache.set(filePath, audio);
    }
    return audioCache.get(filePath);
}

/**
 * Sets the global volume and updates all cached audio elements.
 * @param {number} value - Volume level between 0 and 1.
 */
export function setVolume(value) {
    currentVolume = Math.max(0, Math.min(1, value));
    audioCache.forEach(audio => {
        audio.volume = currentVolume;
    });
}

/**
 * Gets the current global volume.
 * @returns {number} The current volume (0.0 to 1.0).
 */
export function getVolume() {
    return currentVolume;
}

/**
 * Plays a music track by ID. Stops any currently playing music.
 * Music tracks are set to loop.
 * @param {string} trackId - The ID of the track to play.
 */
export function playMusic(trackId) {
    stopMusic();
    const track = musicTracks.find(trackItem => trackItem.id === trackId);
    if (!track) return;

    const audio = getAudio(track.file);
    audio.volume = currentVolume;
    audio.loop = true;
    audio.currentTime = 0;
    audio.play()?.catch?.(() => { }); // ignore autoplay restrictions
    currentMusic = audio;
}

/**
 * Stops the currently playing music track and resets its position.
 */
export function stopMusic() {
    if (currentMusic) {
        currentMusic.pause();
        currentMusic.currentTime = 0;
        currentMusic = null;
    }
}

/**
 * Stops the currently playing sound effect (SFX) and resets its position.
 */
export function stopSfx() {
    if (currentSfx) {
        currentSfx.pause();
        currentSfx.currentTime = 0;
        currentSfx = null;
    }
}

/**
 * Plays a sound effect (SFX) once.
 * @param {string} sfxId - The ID of the SFX to play.
 */
export function playSfx(sfxId) {
    stopSfx();
    const track = sfxTracks.find(trackItem => trackItem.id === sfxId);
    if (!track) return;

    const audio = getAudio(track.file);
    audio.volume = currentVolume;
    audio.loop = false;
    audio.currentTime = 0;
    audio.play()?.catch?.(() => { });
    currentSfx = audio;
}

/**
 * Toggles preview playback for a music track or random music selection.
 * @param {string} optionValue - Selected dropdown value ('none', 'random', or specific ID).
 * @returns {boolean} True if music preview is now playing, false if stopped.
 */
export function previewMusicTrack(optionValue) {
    if (optionValue === 'none') {
        stopMusic();
        previewMusicOption = null;
        return false;
    }

    if (previewMusicOption === optionValue && currentMusic) {
        stopMusic();
        previewMusicOption = null;
        return false;
    }

    let trackId = optionValue;
    if (optionValue === 'random') {
        trackId = getRandomMusicId();
    }

    if (!trackId) {
        stopMusic();
        previewMusicOption = null;
        return false;
    }

    playMusic(trackId);
    previewMusicOption = optionValue;
    return true;
}

/**
 * Toggles preview playback for an SFX track or random SFX selection.
 * @param {string} optionValue - Selected dropdown value ('none', 'random', or specific ID).
 * @param {Function} [onEnded] - Callback invoked when SFX finishes playing.
 * @returns {boolean} True if SFX preview started playing, false if stopped.
 */
export function previewSfxTrack(optionValue, onEnded) {
    if (optionValue === 'none') {
        stopSfx();
        previewSfxOption = null;
        return false;
    }

    if (previewSfxOption === optionValue && currentSfx) {
        stopSfx();
        previewSfxOption = null;
        return false;
    }

    stopSfx();

    let sfxId = optionValue;
    if (optionValue === 'random') {
        sfxId = getRandomSfxId();
    }

    const track = sfxTracks.find(trackItem => trackItem.id === sfxId);
    if (!track) {
        previewSfxOption = null;
        return false;
    }

    const audio = getAudio(track.file);
    audio.volume = currentVolume;
    audio.loop = false;
    audio.currentTime = 0;

    const handleEnded = () => {
        audio.removeEventListener('ended', handleEnded);
        if (currentSfx === audio) currentSfx = null;
        previewSfxOption = null;
        if (typeof onEnded === 'function') onEnded();
    };

    audio.addEventListener('ended', handleEnded);
    audio.play()?.catch?.(() => { });
    currentSfx = audio;
    previewSfxOption = optionValue;
    return true;
}

/**
 * Stops all preview playback and clears preview states.
 */
export function stopAllPreviews() {
    stopMusic();
    stopSfx();
    previewMusicOption = null;
    previewSfxOption = null;
}

/**
 * Picks a random music track ID from the catalog.
 * Ensures no repetition until all tracks in the catalog have been played at least once.
 * @returns {string|null} A random music track ID or null if catalog is empty.
 */
export function getRandomMusicId() {
    if (musicTracks.length === 0) return null;

    let available = musicTracks.filter(track => !playedMusicIds.has(track.id));

    if (available.length === 0) {
        playedMusicIds.clear();
        available = musicTracks.slice();
        if (lastRandomMusicId && musicTracks.length > 1) {
            const filtered = available.filter(track => track.id !== lastRandomMusicId);
            if (filtered.length > 0) available = filtered;
        }
    }

    const selectedTrack = available[Math.floor(Math.random() * available.length)];
    playedMusicIds.add(selectedTrack.id);
    lastRandomMusicId = selectedTrack.id;
    return selectedTrack.id;
}

/**
 * Picks a random SFX ID from the catalog.
 * Ensures no repetition until all tracks in the catalog have been played at least once.
 * @returns {string|null} A random SFX ID or null if catalog is empty.
 */
export function getRandomSfxId() {
    if (sfxTracks.length === 0) return null;

    let available = sfxTracks.filter(track => !playedSfxIds.has(track.id));

    if (available.length === 0) {
        playedSfxIds.clear();
        available = sfxTracks.slice();
        if (lastRandomSfxId && sfxTracks.length > 1) {
            const filtered = available.filter(track => track.id !== lastRandomSfxId);
            if (filtered.length > 0) available = filtered;
        }
    }

    const selectedTrack = available[Math.floor(Math.random() * available.length)];
    playedSfxIds.add(selectedTrack.id);
    lastRandomSfxId = selectedTrack.id;
    return selectedTrack.id;
}

/**
 * Dynamically adds a custom track to the music or SFX catalog.
 * @param {'music'|'sfx'} type - The category of the track.
 * @param {Object} trackObject - The track configuration object.
 * @param {string} trackObject.id - Unique identifier for the track.
 * @param {string} trackObject.label - Display label for the track.
 * @param {string} trackObject.file - Source URL or Blob for the audio file.
 */
export function addCustomTrack(type, trackObject) {
    const list = type === 'music' ? musicTracks : sfxTracks;
    list.push(trackObject);
}

