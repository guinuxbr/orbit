/**
 * @file gallery.js
 * @description Integration with external image provider APIs for the wheel center image.
 * Supports Pexels via Cloudflare Worker proxy (for orbit.guinuxbr.com),
 * direct Pexels API key (BYOK for self-hosters/Docker), and Openverse/Picsum fallback.
 * Strictly complies with Pexels API attribution and branding guidelines.
 */

import { showError } from './utils.js';

export const STORAGE_KEY_PEXELS = 'orbit_pexels_api_key';
export const OFFICIAL_HOST = 'orbit.guinuxbr.com';
export const DEFAULT_PROXY_URL = 'https://orbit-image-proxy.guinuxbr.workers.dev';

/**
 * Gets the configured custom Pexels API key from localStorage.
 * @returns {string} The stored API key or empty string.
 */
export function getCustomApiKey() {
    try {
        return (localStorage.getItem(STORAGE_KEY_PEXELS) || '').trim();
    } catch {
        return '';
    }
}

/**
 * Saves or removes the custom Pexels API key in localStorage.
 * @param {string} key - The API key to store.
 */
export function setCustomApiKey(key) {
    const trimmed = (key || '').trim();
    try {
        if (trimmed) {
            localStorage.setItem(STORAGE_KEY_PEXELS, trimmed);
        } else {
            localStorage.removeItem(STORAGE_KEY_PEXELS);
        }
    } catch (e) {
        console.warn('Unable to access localStorage for API key:', e);
    }
}

/**
 * Clears the custom Pexels API key from localStorage.
 */
export function clearCustomApiKey() {
    try {
        localStorage.removeItem(STORAGE_KEY_PEXELS);
    } catch (e) {
        console.warn('Unable to remove API key from localStorage:', e);
    }
}

/**
 * Determines the active image provider configuration.
 * @returns {{ type: 'pexels-direct'|'proxy'|'openverse', label: string, key?: string, proxyUrl?: string }}
 */
export function getActiveProvider() {
    const customKey = getCustomApiKey();
    if (customKey) {
        return {
            type: 'pexels-direct',
            label: 'Pexels (BYOK)',
            key: customKey
        };
    }

    const isOfficialHost = typeof window !== 'undefined' && window.location.hostname === OFFICIAL_HOST;
    const proxyUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_IMAGE_PROXY_URL) || DEFAULT_PROXY_URL;

    if (isOfficialHost) {
        return {
            type: 'proxy',
            label: 'Pexels (Proxy)',
            proxyUrl
        };
    }

    return {
        type: 'openverse',
        label: 'Openverse (Free)'
    };
}

/**
 * Updates the gallery modal UI elements according to the active provider.
 * @param {Object} dom - Global dictionary of DOM element references.
 */
export function updateGalleryUI(dom) {
    const provider = getActiveProvider();
    const { gallerySearchInput, galleryProviderBadge, galleryKeyInput, galleryKeyBtn, galleryAttribution } = dom;

    if (gallerySearchInput) {
        if (provider.type === 'pexels-direct' || provider.type === 'proxy') {
            gallerySearchInput.placeholder = 'Search high-quality photos (dogs, mountains)...';
        } else {
            gallerySearchInput.placeholder = 'Search Openverse (dogs, clouds)...';
        }
    }

    if (galleryProviderBadge) {
        galleryProviderBadge.textContent = provider.label;
    }

    if (galleryKeyInput) {
        galleryKeyInput.value = getCustomApiKey();
    }

    if (galleryKeyBtn) {
        const hasKey = !!getCustomApiKey();
        galleryKeyBtn.classList.toggle('ring-2', hasKey);
        galleryKeyBtn.classList.toggle('ring-primary', hasKey);
        galleryKeyBtn.title = hasKey
            ? 'Custom Pexels API key active (Click to manage)'
            : 'Configure custom Pexels API key (for Docker/self-hosters)';
    }

    if (galleryAttribution) {
        if (provider.type === 'pexels-direct' || provider.type === 'proxy') {
            galleryAttribution.innerHTML = `
                <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-text-muted dark:text-gray-400 hover:text-primary transition-colors font-medium">
                    <span>Photos provided by</span>
                    <span class="inline-flex items-center gap-1 font-bold text-[#05a081]">
                        <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 32 32">
                            <path d="M2 0h28a2 2 0 0 1 2 2v28a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z"/>
                            <path d="M8.5 7h8a7 7 0 0 1 7 7v.5a7 7 0 0 1-7 7H13v3.5H8.5V7zm4.5 4v6.5h3.5a3 3 0 0 0 3-3V14a3 3 0 0 0-3-3H13z" fill="#fff"/>
                        </svg>
                        Pexels
                    </span>
                </a>
            `;
        } else {
            galleryAttribution.innerHTML = `
                <span>Images provided by <a href="https://openverse.org" target="_blank" rel="noopener noreferrer" class="underline hover:text-primary font-semibold">Openverse</a></span>
            `;
        }
    }
}

/**
 * Fetches and displays images from external APIs into the gallery modal.
 * @param {Object} state - The global application state.
 * @param {Object} dom - Global dictionary of DOM element references.
 * @returns {Promise<void>}
 */
export async function loadGalleryImages(state, dom) {
    const { gallerySearchInput, galleryGrid } = dom;
    const query = gallerySearchInput ? gallerySearchInput.value.trim() : '';
    const provider = getActiveProvider();

    try {
        let images = [];

        if (query) {
            if (provider.type === 'pexels-direct') {
                // 1. Direct Pexels API call with user-provided key
                const response = await fetch(
                    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${state.galleryPage}&per_page=12`,
                    {
                        headers: {
                            Authorization: provider.key
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(`Pexels API error: ${response.statusText}`);
                }

                const data = await response.json();
                images = (data.photos || []).map(photo => ({
                    id: photo.id,
                    thumbnail: photo.src?.medium || photo.src?.small || photo.src?.tiny || '',
                    url: photo.src?.large2x || photo.src?.large || photo.src?.original || '',
                    author: photo.photographer || 'Pexels Creator',
                    authorUrl: photo.photographer_url || 'https://www.pexels.com',
                    photoUrl: photo.url || 'https://www.pexels.com',
                    source: 'pexels'
                }));
            } else if (provider.type === 'proxy') {
                // 2. Cloudflare Worker proxy call (orbit.guinuxbr.com)
                try {
                    const response = await fetch(
                        `${provider.proxyUrl}/?q=${encodeURIComponent(query)}&page=${state.galleryPage}&page_size=12`
                    );

                    if (!response.ok) {
                        throw new Error(`Proxy error: ${response.statusText}`);
                    }

                    const data = await response.json();
                    images = (data.results || []).map(item => ({
                        ...item,
                        source: 'pexels'
                    }));
                } catch (proxyError) {
                    console.warn('Worker proxy unavailable, falling back to Openverse:', proxyError);
                    images = await fetchFromOpenverse(query, state.galleryPage);
                }
            } else {
                // 3. Openverse API (Docker / self-hosted without key)
                images = await fetchFromOpenverse(query, state.galleryPage);
            }
        } else {
            // Fallback to random Picsum images if no query is provided
            const response = await fetch(`https://picsum.photos/v2/list?page=${state.galleryPage}&limit=12`);
            const data = await response.json();

            images = data.map(image => ({
                id: image.id,
                thumbnail: `https://picsum.photos/id/${image.id}/400/400`,
                url: `https://picsum.photos/id/${image.id}/1200/1200`,
                author: image.author,
                authorUrl: image.url || 'https://picsum.photos',
                photoUrl: image.url || 'https://picsum.photos',
                source: 'picsum'
            }));
        }

        if (images.length === 0 && state.galleryPage === 1 && query) {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'col-span-full text-center py-8 text-text-muted dark:text-gray-400 font-semibold';
            emptyMsg.textContent = `No images found for "${query}". Try another term!`;
            galleryGrid.appendChild(emptyMsg);
            return;
        }

        // Create and append image cards with photographer attribution to the grid
        images.forEach(image => {
            const card = document.createElement('div');
            card.className = 'gallery-card relative group rounded-radius-sm overflow-hidden aspect-square bg-gray-100 dark:bg-white/5 cursor-pointer shadow-sm hover:shadow-md transition-shadow';

            const imageElement = document.createElement('img');
            imageElement.src = image.thumbnail;
            imageElement.alt = `Photo by ${image.author}`;
            imageElement.title = `Photo by ${image.author}`;
            imageElement.className = 'gallery-item w-full h-full object-cover transition-transform duration-200 group-hover:scale-105';

            const caption = document.createElement('div');
            caption.className = 'gallery-caption absolute inset-x-0 bottom-0 p-1.5 px-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between text-[11px] text-white opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity';

            const authorLink = document.createElement('a');
            authorLink.href = image.authorUrl || 'https://www.pexels.com';
            authorLink.target = '_blank';
            authorLink.rel = 'noopener noreferrer';
            authorLink.className = 'truncate hover:underline font-medium text-white';
            authorLink.textContent = image.author;
            authorLink.title = `View ${image.author} on ${image.source === 'pexels' ? 'Pexels' : 'Source'}`;
            authorLink.addEventListener('click', (e) => e.stopPropagation());

            const viewLink = document.createElement('a');
            viewLink.href = image.photoUrl || image.url;
            viewLink.target = '_blank';
            viewLink.rel = 'noopener noreferrer';
            viewLink.className = 'ml-1 text-white/80 hover:text-white shrink-0 text-xs';
            viewLink.textContent = '↗';
            viewLink.title = `View original on ${image.source === 'pexels' ? 'Pexels' : 'Source'}`;
            viewLink.addEventListener('click', (e) => e.stopPropagation());

            caption.appendChild(authorLink);
            caption.appendChild(viewLink);

            card.appendChild(imageElement);
            card.appendChild(caption);

            card.addEventListener('click', () => {
                state.loadImageFromURL(image.url);
                dom.galleryModal.classList.add('hidden');
            });

            galleryGrid.appendChild(card);
        });

        state.galleryPage++;
    } catch (error) {
        console.error('Failed to load gallery images:', error);
        showError('Failed to load images. Please check your network or API key.');
    }
}

/**
 * Fetches results from Openverse and normalizes to standard image format.
 * @param {string} query - The search query.
 * @param {number} page - Page number.
 * @returns {Promise<Array<{ id: string|number, thumbnail: string, url: string, author: string, authorUrl: string, photoUrl: string, source: string }>>}
 */
async function fetchFromOpenverse(query, page) {
    const response = await fetch(
        `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page=${page}&page_size=12`
    );
    if (!response.ok) {
        throw new Error(`Openverse error: ${response.statusText}`);
    }
    const data = await response.json();
    return (data.results || []).map(image => ({
        id: image.id,
        thumbnail: image.thumbnail,
        url: image.url,
        author: image.creator || 'Unknown',
        authorUrl: image.creator_url || image.foreign_landing_url || 'https://openverse.org',
        photoUrl: image.foreign_landing_url || image.url,
        source: 'openverse'
    }));
}

/**
 * Opens the gallery modal and triggers the initial image load.
 * @param {Object} state - The global application state.
 * @param {Object} dom - Global dictionary of DOM element references.
 */
export function openGallery(state, dom) {
    updateGalleryUI(dom);
    dom.galleryModal.classList.remove('hidden');
    state.galleryPage = 1;
    dom.galleryGrid.innerHTML = '';
    loadGalleryImages(state, dom);
}

/**
 * Clears existing gallery results and re-fetches based on a new search query.
 * @param {Object} state - The global application state.
 * @param {Object} dom - Global dictionary of DOM element references.
 */
export function searchGallery(state, dom) {
    state.galleryPage = 1;
    dom.galleryGrid.innerHTML = '';
    loadGalleryImages(state, dom);
}
