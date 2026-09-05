# 🛰️ Orbit Image Search Proxy (Cloudflare Worker)

This Cloudflare Worker provides a secure, cached proxy between Orbit (`https://orbit.guinuxbr.com`) and the
[Pexels API](https://www.pexels.com/api/).

## Security & Quota Features

- **Strict Origin Check**: Rejects any request that does not originate from `https://orbit.guinuxbr.com` (status
  `403 Forbidden`).
- **Edge Caching**: Caches search results on Cloudflare's global edge network for 2 hours
  (`Cache-Control: public, max-age=7200`), ensuring repeated searches don't consume Pexels rate limits.
- **Zero Exposed Secrets**: The Pexels API key is stored as a Cloudflare Worker secret and is never exposed in client
  bundles or Git.

---

## Deployment Instructions

### Method 1: Using Wrangler CLI (Fastest)

1. **Navigate to the worker directory**:

   ```bash
   cd worker
   ```

2. **Log in to Cloudflare** (if not already logged in):

   ```bash
   npx wrangler login
   ```

3. **Store your Pexels API key as a secret**:

   ```bash
   npx wrangler secret put PEXELS_API_KEY
   # When prompted, paste your Pexels API key and press Enter
   ```

4. **Deploy the worker**:

   ```bash
   npx wrangler deploy
   ```

5. Wrangler will output your worker URL (e.g., `https://orbit-image-proxy.<your-subdomain>.workers.dev`).

---

### Method 2: Via Cloudflare Dashboard (Web UI)

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) and go to **Workers & Pages**.
2. Click **Create Application** > **Create Worker**.
3. Name it `orbit-image-proxy` and click **Deploy**.
4. Click **Edit code**, paste the content of [`worker/index.js`](./index.js), and click **Save and Deploy**.
5. Go to the worker's **Settings** > **Variables and Secrets**.
6. Under **Secrets**, click **Add**:
   - Variable name: `PEXELS_API_KEY`
   - Value: `<your Pexels API key>`
   - Click **Deploy**.

---

## Configuring Orbit

If your deployed worker URL is different from `https://orbit-image-proxy.guinuxbr.workers.dev`, you can specify it in
Orbit's `.env`:

```bash
VITE_IMAGE_PROXY_URL=https://orbit-image-proxy.<your-subdomain>.workers.dev
```
