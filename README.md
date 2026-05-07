# Cal Gay Auto

A small React + Vite tool for visualizing Casio-style calculator programs step by step.

Demo: https://chaosq3q.github.io/cal-gay-auto/

The app parses pasted program text, expands it into calculator key presses, and highlights the next key on a calculator image. It also includes token-by-token playback so you can inspect how the source is interpreted.

## Features

- Paste calculator program text and normalize pasted content
- Parse source into tokens and playback steps
- Jump through the program by step or by token
- Highlight the active key on the calculator image
- Deployable to GitHub Pages

## Tech Stack

- React 18
- TypeScript
- Vite

## Local Development

```bash
npm install
npm run dev
```

Recommended runtime: Node 20 or newer.

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Deployment

This repo includes a GitHub Actions workflow for GitHub Pages deployment from the `main` branch.

The Vite base path is set automatically from `GITHUB_REPOSITORY` during GitHub Actions builds, so the app can be hosted under the repository path on GitHub Pages.

## Notes

- `package.json` keeps `"private": true` on purpose to avoid accidental npm publishing.
- No runtime secrets are required for the current app.
- The app uses calculator-specific notation and symbols, so some sample input may look unfamiliar if you have not worked with Casio-style program text before.

## Asset And Attribution Notes

- Please make sure the calculator imagery in `public/` is safe to redistribute publicly.
- This project is not affiliated with Casio.

## Known Limitations

- Token coverage depends on the current dictionary and parser rules in `src/logic/`.
- The parser is designed as a focused prototype and does not aim to support every possible calculator program syntax.

## License

MIT
