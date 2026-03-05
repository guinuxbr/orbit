// ============================================
// sounds.js — Audio Manager with lazy-loaded real MP3 files
// ============================================

// Track catalogs
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

// Audio cache — lazy-loaded
const audioCache = new Map();

/**
 * Retrieves or creates an Audio object for the given file path.
 * Implements lazy-loading by caching audio elements.
 * @param {string} filePath - The path to the audio file or a Blob URL.
 * @returns {HTMLAudioElement} The audio element.
 */
function getAudio(filePath) {
    if (!audioCache.has(filePath)) {
        const audio = new Audio(filePath);
        audio.preload = 'auto';
        audioCache.set(filePath, audio);
    }
    return audioCache.get(filePath);
}

// Global volume state (0.0 to 1.0)
let currentVolume = 0.5;

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
 * @returns {number} The current volume.
 */
export function getVolume() {
    return currentVolume;
}

// Reference to the currently playing music track
let currentMusic = null;

/**
 * Plays a music track by ID. Stops any currently playing music.
 * Music tracks are set to loop.
 * @param {string} trackId - The ID of the track to play.
 */
export function playMusic(trackId) {
    stopMusic();
    const track = musicTracks.find(t => t.id === trackId);
    if (!track) return;

    const audio = getAudio(track.file);
    audio.volume = currentVolume;
    audio.loop = true;
    audio.currentTime = 0;
    audio.play().catch(() => { }); // ignore autoplay restrictions
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
 * Plays a sound effect (SFX) once.
 * @param {string} sfxId - The ID of the SFX to play.
 */
export function playSfx(sfxId) {
    const track = sfxTracks.find(t => t.id === sfxId);
    if (!track) return;

    const audio = getAudio(track.file);
    audio.volume = currentVolume;
    audio.loop = false;
    audio.currentTime = 0;
    audio.play().catch(() => { });
}

// Tracking for last random selections to avoid sequence repetition
let lastRandomMusicId = null;
let lastRandomSfxId = null;

/**
 * Picks a random music track ID from the catalog.
 * Ensures the same track is not played twice in a row.
 * @returns {string} A random music track ID.
 */
export function getRandomMusicId() {
    if (musicTracks.length <= 1) {
        return musicTracks.length > 0 ? musicTracks[0].id : null;
    }
    let newId;
    do {
        newId = musicTracks[Math.floor(Math.random() * musicTracks.length)].id;
    } while (newId === lastRandomMusicId);

    lastRandomMusicId = newId;
    return newId;
}

/**
 * Picks a random SFX ID from the catalog.
 * Ensures the same track is not played twice in a row.
 * @returns {string} A random SFX ID.
 */
export function getRandomSfxId() {
    if (sfxTracks.length <= 1) {
        return sfxTracks.length > 0 ? sfxTracks[0].id : null;
    }
    let newId;
    do {
        newId = sfxTracks[Math.floor(Math.random() * sfxTracks.length)].id;
    } while (newId === lastRandomSfxId);

    lastRandomSfxId = newId;
    return newId;
}

/**
 * Dynamically adds a custom track to the music or SFX catalog.
 * @param {string} type - Either 'music' or 'sfx'.
 * @param {Object} trackObj - The track configuration object.
 */
export function addCustomTrack(type, trackObj) {
    const list = type === 'music' ? musicTracks : sfxTracks;
    list.push(trackObj);
}

