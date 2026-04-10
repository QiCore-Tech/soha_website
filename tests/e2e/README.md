# E2E Tests

This suite uses Node's built-in test runner plus `playwright`, so it does not depend on `@playwright/test`.

## Commands

- `npm run test:e2e`
  Starts a temporary Next dev server on a free local port and runs the browser tests.
- `npm run test:e2e:ci`
  Runs `next build` first, then executes the same E2E suite.

## Current Coverage

- Right-click opens the palette on blank canvas
- Right-click opens the palette on the outer black frame
- Right-click on a placed voxel deletes it instead of opening the palette
- Solid color selection updates cursor state and the next placed voxel
- Repeated top-face clicks stack upward instead of duplicating the same space
- Layout persists across reload via `localStorage`

## Pending

- Side-plane drag to build wall patches is marked as `TODO` until the interaction is finalized.
