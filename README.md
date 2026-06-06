# Into the Typing

## Play Locally

Open `index.html` directly in a browser, or serve it over HTTP:

```sh
npm start
```

The local server prints a `Local` URL and, when available, a `Network` URL
that other devices on the same network can open.

## Publish Online

This is a static site, so it can be published without a backend.

### GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository settings, enable GitHub Pages with GitHub Actions.
3. Push to the `main` branch.

The workflow in `.github/workflows/pages.yml` deploys the current files.

### Other Static Hosts

For Netlify, Vercel, Cloudflare Pages, Firebase Hosting, or similar services:

- Build command: leave empty.
- Publish directory: `.`.
- Entry file: `index.html`.

## Folder Structure

- `index.html`
  - App entry point.
- `src/styles/main.css`
  - Screen layout, visual styling, and CSS animations.
- `src/app/game.js`
  - Main game state, typing logic, and battle flow.
- `src/config/enemyAnimations.js`
  - Enemy image frame paths and animation settings.
- `src/assets/images/backgrounds`
  - Stage and background images.
- `src/assets/images/home`
  - Player base images.
- `src/assets/images/enemies/{enemy}/level_{n}/{state}/frame_01.png`
  - Enemy frames grouped by character, level, and animation state.

## Asset Notes

- Add enemy frames under `src/assets/images/enemies/{enemy}/level_{n}`.
- Register new enemy frames in `src/config/enemyAnimations.js`.
- Enemy types without registered idle frames are skipped by the wave spawner.
- Keep temporary preview/check images outside the project, or delete them after use.

## Enemy Levels

- Level 1: `src/assets/images/enemies/goblin/level_1`
- Level 2: `src/assets/images/enemies/goblin/level_2`
  - Use this for the easy-mode boss and normal-mode base enemy.
- Level 3: `src/assets/images/enemies/goblin/level_3`
  - Use this for the normal-mode boss.

The base/idle image for the level 2 goblin goes here:

`src/assets/images/enemies/goblin/level_2/idle/frame_01.png`
