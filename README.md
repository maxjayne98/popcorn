# Popcorn – Architectural Overview & Setup Guide

Popcorn is a single-page TV discovery experience built with Vue 3 and TypeScript. The UI highlights curated rails of TV shows, fast search, and deep detail pages powered by the TVMaze API.

---

## Why This Architecture?

### Vue 3 + TypeScript  
We chose the Vue composition API because it keeps component logic explicit and testable while still feeling ergonomic for rapid UI work. TypeScript gives us strong typing across API responses and store state, which sharply reduces runtime surprises when the API schema evolves.

### Vite Build System  
Vite’s on-demand compilation keeps feedback loops fast for a component-heavy interface. Its native TypeScript support and first-class Vue plugin give us single-file component authoring without extra configuration.

### Pinia for Store Composition  
Where shared state is required (e.g., show catalog, saved searches, watchlist) Pinia provides a lightweight, tree-shakable store with TypeScript inference. Stores are expressed with the composition syntax so they can share logic with composables easily and expose reset hooks that make tests deterministic.

### Virtualized Lists & Accessibility  
Virtual rails are implemented with a dedicated component so scroll performance stays smooth, even when rendering hundreds of posters. Slots accept typed items so calling components can scope their own markup while the virtualization component handles layout constraints and `aria` roles.

**VirtualHorizontalList.vue highlights**
- Calculates item visibility on the fly using viewport width, buffer sizing, and scroll position.
- Maintains transform-based positioning so DOM nodes stay lightweight while preserving natural tab order with `role="list"` and `role="listitem"`.
- Adds ResizeObserver and scroll listeners to keep layout in sync with responsive breakpoints.
- Exposes typed slot props (`item`, `index`) so consumers can render arbitrary card content without losing TypeScript safety.
- Auto-clamps scroll positions when data shrinks, preventing empty gutters or inaccessible items.

### Testing Strategy  
Vitest with Vue Test Utils exercises stores, composables, and critical UI flows. Tests stub network calls and router navigation to keep the suite fast while still covering search workflows, saved searches, and detail view behaviour.

---

## Requirements

- **Node.js**: 20.16.x (LTS)  
- **npm**: 10.8.x  
  > The project also ships a `pnpm-lock.yaml`, so pnpm ≥ 9.10 works if you prefer, but all commands below use npm for portability.

---

## Installation & Commands

```bash
# install dependencies
npm install

# run in development mode (http://localhost:5173 by default)
npm run dev

# type-check and build for production
npm run build

# preview the production build locally
npm run preview

# execute the Vitest suite
npm run test:run
```

The application reads live data from the public [TVMaze API](https://www.tvmaze.com/api); no additional credentials or configuration are required.

---

## Repository Layout Highlights

```
src/
  components/         Reusable UI elements (cards, rails, controls)
  views/              Route-level views (home, search, detail)
  stores/             Pinia stores for catalog, watchlist, saved searches
  composables/        Domain logic hooks (API integration, virtualization)
tests/
  components/         Component-focused unit tests
  views/              Workflow tests that exercise view logic
```

---

## Development Workflow Notes

- **State management** is localized whenever possible. Long-lived cross-view state (catalog, saved searches, watchlist) lives in Pinia stores, while transient UI state (search loading state) is kept inside the owning view or component for clarity.
- **Error & loading surfaces** share a dedicated `AsyncState` component so pages stay visually consistent and edge cases (e.g., network failures) are easier to test.
- **Accessibility**: virtual rails render semantic list and listitem roles; detail views expose actionable buttons with `aria` labels, and search inputs wire clearing behaviour to keyboard events.
- **Styling** uses scoped SCSS inside SFCs to keep component styling co-located while allowing modern CSS features (CSS variables, clamp-based responsive sizing).

---

## Contributing Tips

1. Run `npm run test:run` before pushing changes to verify stores and views still behave correctly.
2. When adding API integration, define types in `src/types` first so components and stores enjoy static safety.
3. For new shared logic, prefer composables for reuse; if you need cross-route persistence or localStorage integration, consider a Pinia store.

Happy hacking!
