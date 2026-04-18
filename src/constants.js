/**
 * @file constants.js
 * @description Application constants including default names and UI theme definitions.
 */

/**
 * Default names list used when no configuration is saved.
 * @type {string[]}
 */
export const INITIAL_NAMES = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];

/**
 * Interface theme definitions matching the Tailwind color palette.
 * Each theme defines primary, secondary, and accent colors for the UI and wheel.
 * @type {Array<{id: string, label: string, primary: string, secondary: string, accent: string}>}
 */
export const UI_THEMES = [
    // ── Original themes ──────────────────────────────────────────────────
    { id: 'teal',       label: 'Teal',             primary: '#00a489', secondary: '#1aad95', accent: '#40bba7' },
    { id: 'cyan',       label: 'Vivid Cyan',       primary: '#35b9ab', secondary: '#4ac0b4', accent: '#68cbc0' },
    { id: 'green',      label: 'Fresh Green',      primary: '#73ba25', secondary: '#96cb5c', accent: '#35b9ab' },
    { id: 'soft-green', label: 'Soft Green',       primary: '#96cb5c', secondary: '#b9dc92', accent: '#73ba25' },
    { id: 'forest',     label: 'Forest',           primary: '#6da741', secondary: '#7cb054', accent: '#92bd71' },
    { id: 'sky',        label: 'Sky Blue',         primary: '#21a4df', secondary: '#38ade2', accent: '#59bbe7' },
    { id: 'ocean',      label: 'Ocean Blue',       primary: '#38ade2', secondary: '#59bbe7', accent: '#21a4df' },
    { id: 'dark-blue',  label: 'Midnight Blue',    primary: '#173f4f', secondary: '#2f5361', accent: '#516f7b' },
    { id: 'aqua',       label: 'Aqua',             primary: '#68cbc0', secondary: '#9adcd5', accent: '#35b9ab' },
    { id: 'slate',      label: 'Slate',            primary: '#516f7b', secondary: '#8b9fa7', accent: '#2f5361' },

    // ── New creative themes ───────────────────────────────────────────────
    { id: 'candy',      label: 'Candy Pop',         primary: '#ff6fb7', secondary: '#ff9de2', accent: '#a855f7' },
    { id: 'sunset',     label: 'Sunset',            primary: '#f97316', secondary: '#fb923c', accent: '#fbbf24' },
    { id: 'volcano',    label: 'Volcano',           primary: '#dc2626', secondary: '#ef4444', accent: '#f97316' },
    { id: 'aurora',     label: 'Aurora',            primary: '#6366f1', secondary: '#8b5cf6', accent: '#06b6d4' },
    { id: 'neon',       label: 'Neon Nights',       primary: '#22d3ee', secondary: '#a78bfa', accent: '#f472b6' },
    { id: 'galaxy',     label: 'Galaxy',            primary: '#7c3aed', secondary: '#4f46e5', accent: '#2563eb' },
    { id: 'rose-gold',  label: 'Rose Gold',         primary: '#f43f5e', secondary: '#fb7185', accent: '#fda4af' },
    { id: 'peach',      label: 'Peach Fuzz',        primary: '#fb923c', secondary: '#fdba74', accent: '#fcd34d' },
    { id: 'mint',       label: 'Mint Mojito',       primary: '#10b981', secondary: '#34d399', accent: '#6ee7b7' },
    { id: 'cobalt',     label: 'Cobalt Rush',       primary: '#1d4ed8', secondary: '#2563eb', accent: '#60a5fa' },
    { id: 'amber',      label: 'Amber Glow',        primary: '#d97706', secondary: '#f59e0b', accent: '#fcd34d' },
    { id: 'bubblegum',  label: 'Bubblegum',         primary: '#ec4899', secondary: '#f472b6', accent: '#a78bfa' },
    { id: 'earth',      label: 'Earthy Tones',      primary: '#78716c', secondary: '#a8a29e', accent: '#d6d3d1' },
    { id: 'noir',       label: 'Midnight Noir',     primary: '#374151', secondary: '#4b5563', accent: '#6b7280' },
];

/**
 * Global color palette for discrete wheel segments.
 * Used when generating random colors for the names array.
 * @type {string[]}
 */
export const PALETTE = [
    // Original greens / teals / blues
    '#73ba25', '#96cb5c', '#b9dc92', '#dceec8',
    '#173f4f', '#2f5361', '#516f7b', '#8b9fa7', '#c5cfd3',
    '#35b9ab', '#4ac0b4', '#68cbc0', '#9adcd5', '#ccedea',
    '#00a489', '#1aad95', '#40bba7', '#7fd1c4', '#bfe8e1',
    '#6da741', '#7cb054', '#92bd71', '#b6d3a0', '#dae9cf',
    '#21a4df', '#38ade2', '#59bbe7', '#90d1ef', '#c7e8f7',

    // Candy / pink / purple
    '#ff6fb7', '#ff9de2', '#a855f7', '#c084fc', '#f0abfc',
    '#ec4899', '#f472b6', '#a78bfa', '#818cf8', '#e879f9',

    // Sunset / warm
    '#f97316', '#fb923c', '#fbbf24', '#fcd34d', '#fde68a',
    '#dc2626', '#ef4444', '#f59e0b', '#d97706', '#b45309',

    // Cobalt / galaxy / aurora
    '#6366f1', '#8b5cf6', '#4f46e5', '#7c3aed', '#2563eb',
    '#1d4ed8', '#06b6d4', '#0284c7', '#0ea5e9', '#38bdf8',

    // Rose gold / peach / mint
    '#f43f5e', '#fb7185', '#fda4af', '#10b981', '#34d399',

    // Neutral / noir
    '#374151', '#4b5563', '#6b7280', '#9ca3af', '#78716c',
];

/**
 * Maps the spin-speed slider step (1–5) to a human-readable label.
 * @type {Object.<string, string>}
 */
export const SPIN_SPEED_LABELS = {
    '1': 'Very Slow',
    '2': 'Slow',
    '3': 'Medium',
    '4': 'Fast',
    '5': 'Very Fast',
};

/**
 * Maps the spin-speed slider step (1–5) to the base number of full wheel rotations.
 * A random ±20% jitter is applied per spin to prevent identical-feeling outcomes.
 * @type {Object.<string, number>}
 */
export const SPIN_SPEED_ROTATIONS = {
    '1': 2,    // ~2 full turns  (Very Slow)
    '2': 4,    // ~4 full turns  (Slow)
    '3': 7,    // ~7 full turns  (Medium — default)
    '4': 12,   // ~12 full turns (Fast)
    '5': 20,   // ~20 full turns (Very Fast)
};

