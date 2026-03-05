// src/gallery.js
import { showError } from './utils.js';

export async function loadGalleryImages(state, dom) {
    const { gallerySearchInput, galleryGrid } = dom;
    const query = gallerySearchInput ? gallerySearchInput.value.trim() : '';

    try {
        let images = [];

        if (query) {
            // Use Openverse API for searching images directly on .org to avoid CORS redirect failure
            const res = await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page=${state.galleryPage}&page_size=12`);
            const data = await res.json();
            // Map Openverse structure to our needs (url for high-res, thumbnail for preview)
            images = data.results.map(img => ({
                id: img.id,
                thumbnail: img.thumbnail,
                url: img.url,
                author: img.creator || 'Unknown'
            }));
        } else {
            // Fallback to random Picsum images if no query
            const res = await fetch(`https://picsum.photos/v2/list?page=${state.galleryPage}&limit=12`);
            const data = await res.json();
            images = data.map(img => ({
                id: img.id,
                thumbnail: `https://picsum.photos/id/${img.id}/400/400`,
                url: `https://picsum.photos/id/${img.id}/1200/1200`,
                author: img.author
            }));
        }

        images.forEach(img => {
            const el = document.createElement('img');
            el.src = img.thumbnail;
            el.alt = `Photo by ${img.author}`;
            el.title = `Photo by ${img.author}`;
            el.classList.add('gallery-item');
            el.addEventListener('click', () => {
                state.loadImageFromURL(img.url);
                dom.galleryModal.classList.add('hidden');
            });
            galleryGrid.appendChild(el);
        });
        state.galleryPage++;
    } catch (err) {
        console.error('Failed to load gallery images:', err);
        showError('Failed to load images. Please try again later.');
    }
}

export function openGallery(state, dom) {
    dom.galleryModal.classList.remove('hidden');
    state.galleryPage = 1;
    dom.galleryGrid.innerHTML = '';
    loadGalleryImages(state, dom);
}

export function searchGallery(state, dom) {
    state.galleryPage = 1;
    dom.galleryGrid.innerHTML = '';
    loadGalleryImages(state, dom);
}
