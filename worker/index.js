/**
 * Orbit Image Search Proxy (Cloudflare Worker)
 * 
 * Proxies search requests to Pexels API with secure server-side API key handling.
 * Enforces strict Origin checking to prevent unauthorized third-party usage,
 * and caches search responses at Cloudflare edge to optimize upstream quota.
 */

const ALLOWED_ORIGIN = 'https://orbit.guinuxbr.com';

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';

    // 1. Enforce strict origin check
    if (origin !== ALLOWED_ORIGIN) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: This proxy is exclusively for https://orbit.guinuxbr.com' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 2. Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        },
      });
    }

    const apiKey = env.PEXELS_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: PEXELS_API_KEY secret not set.' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          },
        }
      );
    }

    const url = new URL(request.url);
    const query = (url.searchParams.get('q') || '').trim();
    const page = url.searchParams.get('page') || '1';
    const pageSize = url.searchParams.get('page_size') || '12';

    if (!query) {
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        },
      });
    }

    // 3. Cloudflare Edge Cache check
    const cacheKey = new Request(url.toString(), request);
    const cache = caches.default;
    let cachedResponse = await cache.match(cacheKey);

    if (cachedResponse) {
      return cachedResponse;
    }

    // 4. Fetch from Pexels API
    try {
      const pexelsUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${pageSize}`;
      const pexelsRes = await fetch(pexelsUrl, {
        headers: {
          Authorization: apiKey,
        },
      });

      if (!pexelsRes.ok) {
        return new Response(
          JSON.stringify({ error: `Pexels API error: ${pexelsRes.statusText}` }),
          {
            status: pexelsRes.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            },
          }
        );
      }

      const pexelsData = await pexelsRes.json();

      // Normalize into Orbit's gallery format with complete Pexels attribution
      const results = (pexelsData.photos || []).map((photo) => ({
        id: photo.id,
        thumbnail: photo.src?.medium || photo.src?.small || photo.src?.tiny || '',
        url: photo.src?.large2x || photo.src?.large || photo.src?.original || '',
        author: photo.photographer || 'Pexels Creator',
        authorUrl: photo.photographer_url || 'https://www.pexels.com',
        photoUrl: photo.url || 'https://www.pexels.com',
        source: 'pexels',
      }));

      const finalResponse = new Response(JSON.stringify({ results }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Cache-Control': 'public, max-age=7200', // Cache at edge for 2 hours
        },
      });

      // Save to cache in background
      ctx.waitUntil(cache.put(cacheKey, finalResponse.clone()));

      return finalResponse;
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from upstream image provider', details: err.message }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          },
        }
      );
    }
  },
};
