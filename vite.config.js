import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Extract version from package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const version = packageJson.version;

// Get git information for the current build.
// Inside Docker builds, .git is excluded from the context so we fall back
// to VITE_* env vars that are injected as ARGs in the Dockerfile.
let commitHash = process.env.VITE_COMMIT_HASH ?? 'unknown';
let buildDate = process.env.VITE_BUILD_DATE ?? new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
  buildDate = execSync('git log -1 --format=%ad --date=format:"%d %b %Y"').toString().trim();
} catch {
  if (commitHash === 'unknown') {
    console.warn('[orbit] Could not retrieve git information for versioning.');
  }
}

export default defineConfig({
  base: '/',
  plugins: [
    tailwindcss(),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
  test: {
    environment: 'jsdom',
  },
});
