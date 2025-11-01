# Popcorn — TV Show Dashboard

Popcorn is a Vue 3 + TypeScript single-page application that showcases TV shows grouped by genre using data from the [TVMaze API](https://www.tvmaze.com/api). Each genre is rendered as a horizontally scrollable, virtualized rail so the UI stays smooth even with large datasets. A global search bar lets you look up shows by name, and every card drills into a detailed view with rich metadata for the selected show.

## Features

- Responsive layout with a sticky global header and search-as-you-type results
- Virtualized horizontal rails per genre powered by `vue-virtual-scroller`
- Server-backed search results with vertical virtualization for long lists
- Detailed show pages highlighting metadata, schedules, ratings, and external links
- Clean architecture using composables for data fetching, caching, and state sharing

## Getting Started

```bash
pnpm install
pnpm dev        # start the development server
pnpm build      # type-check and generate a production build
pnpm preview    # preview the production build locally
```

The app consumes live data from the TVMaze API; no additional configuration is required.
