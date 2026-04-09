/**
 * @file gallery.js
 * @description Integration with external image provider APIs (Openverse and Picsum) for the wheel center image.
 */

import { showError } from './utils.js';

/**
 * Fetches and displays images from external APIs into the gallery modal.
 * Uses Openverse for keyword search and Picsum for random fallback.
 * @param {Object} state - The global application state.
 * @param {Object} dom - Global dictionary of DOM element references.
 * @returns {Promise<void>}
 */
export async function loadGalleryImages(state, dom) {
    const { gallerySearchInput, galleryGrid } = dom;
    const query = gallerySearchInput ? gallerySearchInput.value.trim() : '';

    try {
        let images = [];

        if (query) {
            // Use Openverse API for searching images (Creative Commons)
            const response = await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page=${state.galleryPage}&page_size=12`);
            const data = await response.json();
            
            // Map Openverse structure to our unified format
            images = data.results.map(image => ({
                id: image.id,
                thumbnail: image.thumbnail,
                url: image.url,
                author: image.creator || 'Unknown'
            }));
        } else {
            // Fallback to random Picsum images if no query is provided
            const response = await fetch(`https://picsum.photos/v2/list?page=${state.galleryPage}&limit=12`);
            const data = await response.json();
            
            images = data.map(image => ({
                id: image.id,
                thumbnail: `https://picsum.photos/id/${image.id}/400/400`,
                url: `https://picsum.photos/id/${image.id}/1200/1200`,
                author: image.author
            }));
        }

        // Create and append image elements to the grid
        images.forEach(image => {
            const imageElement = document.createElement('img');
            imageElement.src = image.thumbnail;
            imageElement.alt = `Photo by ${image.author}`;
            imageElement.title = `Photo by ${image.author}`;
            imageElement.classList.add('gallery-item');
            imageElement.addEventListener('click', () => {
                state.loadImageFromURL(image.url);
                dom.galleryModal.classList.add('hidden');
            });
            galleryGrid.appendChild(imageElement);
        });
        
        state.galleryPage++;
    } catch (error) {
        console.error('Failed to load gallery images:', error);
        showError('Failed to load images. Please try again later.');
    }
}

/**
 * Opens the gallery modal and triggers the initial image load.
 * @param {Object} state - The global application state.
 * @param {Object} dom - Global dictionary of DOM element references.
 */
export function openGallery(state, dom) {
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
