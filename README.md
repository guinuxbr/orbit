# ☀️ Orbit

**Orbit** is a modern, high-performance, and beautiful web-based spinner designed for names, raffles, decisions, and
random picks. Built with a focus on aesthetics and user experience, it offers a premium feel with glassmorphism effects,
smooth animations, and customization options.

[![Deploy to GitHub Pages](https://github.com/guinuxbr/orbit/actions/workflows/deploy.yml/badge.svg)](https://github.com/guinuxbr/orbit/actions/workflows/deploy.yml)
[![Publish to GHCR](https://github.com/guinuxbr/orbit/actions/workflows/publish-ghcr.yml/badge.svg)](https://github.com/guinuxbr/orbit/actions/workflows/publish-ghcr.yml)
[![GitHub Release](https://img.shields.io/github/v/release/guinuxbr/orbit?sort=semver&logo=github&color=blue)](https://github.com/guinuxbr/orbit/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![GHCR](https://img.shields.io/badge/Container-ghcr.io-2496ED?logo=docker&logoColor=white)](https://github.com/guinuxbr/orbit/pkgs/container/orbit)

![Orbit Banner](public/img/banner.png)

## ✨ Features

- **📝 Smart Name Management**: Easily add, edit, and remove names from the wheel in real-time.
- **🖼️ Custom Imagery**: Set a central image for your wheel or use it as a full wheel background. Browse a built-in
gallery or upload your own.
- **🔊 Immersive Soundscapes**: Dynamic spinning music and winner sound effects (SFX) with full volume control and
custom MP3 support.
- **🎨 Premium Design System**:
  - **Glassmorphism UI**: Beautifully blurred, semi-transparent panels.
  - **Dark & Light Modes**: Seamless transition between themes with system auto-detection.
  - **Dynamic Palettes**: Choose from curated colour themes that adapt the entire application's look.
- **⚙️ Advanced Customization**: Adjust spin duration, spin speed (Very Slow → Very Fast), winner messages, and UI
scaling to fit any screen or use case.
- **🚀 Performance Focused**: Built with Vite and Tailwind CSS for lightning-fast loads and silky-smooth,
frame-rate-independent animations.

## 🛠️ Tech Stack

- **Frontend**: [Vite](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/)
- **Logic**: Modern ES6+ JavaScript
- **Infrastructure**: [Docker](https://www.docker.com/) + [Nginx](https://www.nginx.com/)
- **Base Images**: [Chainguard Images](https://www.chainguard.dev/) (for minimal attack surface and maximum security)
- **Container Registry**: [GitHub Container Registry (GHCR)](https://ghcr.io) — images published automatically on every release

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v22 or higher)
- [npm](https://www.npmjs.com/)
- [mise](https://mise.jdx.dev/) (recommended — provides task runner and tool version management)

### Development

1. **Clone the repository**:

    ```bash
    git clone https://github.com/guinuxbr/orbit.git && cd orbit
    ```

2. **Install dependencies**:

    ```bash
    npm install
    ```

3. **Start the development server**:

    ```bash
    mise run dev
    # or: npm run dev
    ```

The app will be available at `http://localhost:5173`.

### Available Mise Tasks

| Task                            | Description                                        |
|---------------------------------|----------------------------------------------------|
| `mise run dev`                  | Start the Vite development server                  |
| `mise run build`                | Build the production bundle                        |
| `mise run preview`              | Preview the production build locally               |
| `mise run test`                 | Run the test suite                                 |
| `mise run docker-up`            | Pull the GHCR image and start the container        |
| `mise run docker-down`          | Stop and remove the GHCR container                 |
| `mise run docker-local-build`   | Build the Docker image locally (with version info) |
| `mise run docker-local-up`      | Build locally and start the container              |
| `mise run docker-local-down`    | Stop and remove the locally built container        |
| `mise run docker-local-rebuild` | Full rebuild from scratch (no cache)               |

### Production Build

To create an optimized production bundle:

```bash
mise run build
# or: npm run build
```

The output will be in the `dist/` directory.

## 🐳 Docker Deployment

Orbit ships as a pre-built, secure container image on the GitHub Container Registry.

### Using Docker Compose — GHCR image (Recommended)

Pulls the latest image from GHCR and starts the container:

```bash
mise run docker-up
# or: docker compose up -d
```

The application will be accessible at `http://localhost:28080`.

### Pull and Run Manually

```bash
docker pull ghcr.io/guinuxbr/orbit:latest
docker run -d -p 28080:80 --name orbit ghcr.io/guinuxbr/orbit:latest
```

### Build Locally

The simplest way is via the Mise task, which handles the git metadata arguments automatically:

```bash
mise run docker-local-up
```

Or use Docker Compose directly with explicit `--build-arg` flags:

```bash
docker compose -f docker-compose.local.yml build \
  --build-arg VITE_COMMIT_HASH=$(git rev-parse --short HEAD) \
  --build-arg "VITE_BUILD_DATE=$(git log -1 --format=%ad --date=format:'%d %b %Y')" \
  --build-arg VITE_APP_VERSION=$(node -p "require('./package.json').version")
docker compose -f docker-compose.local.yml up -d
```

### Available Tags

| Tag          | Description                              |
|--------------|------------------------------------------|
| `latest`     | Most recent build from the `main` branch |
| `v1.2.3`     | Specific release version                 |
| `1.2`        | Latest patch of a minor version          |
| `sha-<hash>` | Exact commit build                       |

## ⚙️ Configuration

The project uses a standard Vite/Tailwind configuration. You can customize the look and feel by modifying:

- `tailwind.config.js`: Define your colour tokens and theme extensions.
- `theme.js`: Manage the dynamic colour palettes.
- `nginx.conf`: Fine-tune the production server performance and headers.

## 🔄 CI/CD

| Workflow                   | Trigger                       | Description                                        |
|----------------------------|-------------------------------|----------------------------------------------------|
| **Deploy to GitHub Pages** | Push to `main`                | Builds and publishes the app to GitHub Pages       |
| **Publish to GHCR**        | Push to `main` or version tag | Builds multi-arch Docker image and pushes to GHCR  |
| **Create Release**         | Push of `v*` tag              | Creates a GitHub Release with auto-generated notes |

To cut a new release, bump the version in `package.json`, commit to `main`, then push a matching tag:

```bash
git tag v1.2.3
git push origin v1.2.3
```

## 📜 Licence

This project is licensed under the MIT Licence - see the [LICENSE](LICENSE.md) file for details.

---

Built with ☕ by [guinuxbr](https://github.com/guinuxbr).
