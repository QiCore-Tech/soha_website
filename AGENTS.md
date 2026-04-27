# Repository Guidelines

## Project Structure & Module Organization

This is a static-exported Next.js site. App entry points live in `app/`: `app/layout.tsx` defines metadata, fonts, and global style injection, while `app/page.tsx` renders the homepage. Reusable UI and scene code lives in `components/`, including the voxel interaction surface. Shared data, types, and color/grid helpers are in `lib/site-data.ts`; browser capability logic is in `hooks/`. Static assets are served from `public/`. E2E tests live under `tests/e2e/` with helpers in `tests/e2e/helpers/`. Do not edit generated outputs such as `.next/`, `out/`, or `.artifacts/`.

## Build, Test, and Development Commands

- `npm run dev`: start the Next development server.
- `npm run build`: build the static export into `out/`.
- `npm run start`: serve a production Next build locally.
- `npm test`: run the E2E suite.
- `npm run test:e2e`: launch a temporary local server and run browser tests.
- `npm run test:e2e:ci`: build first, then run E2E tests.

Install dependencies with `npm install` and keep `package-lock.json` committed when dependencies change.

## Coding Style & Naming Conventions

Use TypeScript with strict checking enabled. Follow the existing style: two-space indentation, double quotes, semicolons, named exports for components, and `PascalCase` component names. Hooks use `use-*` filenames and `useCamelCase` exports. Keep shared constants and types in `lib/site-data.ts` unless they justify a new module. Use the `@/*` path alias for root-relative imports.

## Testing Guidelines

Tests use Node's built-in `node:test` runner with Playwright, not `@playwright/test`. Add E2E coverage in `tests/e2e/homepage.test.mjs` for user-visible homepage behavior, and put reusable browser actions in `tests/e2e/helpers/homepage-driver.mjs`. Prefer descriptive test names like `right click opens palette on blank canvas`. Run `npm run test:e2e` before interaction changes and `npm run test:e2e:ci` when deployment output may be affected.

## Commit & Pull Request Guidelines

Recent commits use concise, imperative, sentence-case subjects such as `Persist voxel layout in local storage` and `Refine cursor cube clear interaction`. Keep commits focused on one behavioral change. Pull requests should include a short summary, testing performed, linked issue if applicable, and screenshots or screen recordings for visual or interaction changes. Note any intentional test gaps or `test.todo` updates.

## Security & Configuration Tips

The site is configured for static export in `next.config.mjs`; avoid adding runtime-only server features unless deployment configuration changes too. Do not commit local build output, secrets, or Vercel state. Keep public metadata and canonical URLs aligned with `https://qicore.ai`.
