import type { Feature } from './survey';

/** 24×24 line icons for each door feature. Drawn with `stroke="currentColor"` by the <symbol> that holds them. */
export const featureIcons: Record<Feature, string> = {
  escalators: '<path d="M2 19h5L17 7h5"/><path d="M7 15l2-2"/>',
  stairs: '<path d="M3 20h4v-4h4v-4h4V8h4V4h2"/>',
  lift: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 10l3-3 3 3M9 14l3 3 3-3"/>',
  accessible: '<circle cx="11" cy="4.5" r="1.6"/><path d="M11 8v5h5l2.5 5.5"/><path d="M8 11.5a5 5 0 1 0 6.5 6.5"/>',
  seats: '<path d="M4 8h16M4 12h16M6 12v7M18 12v7"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r=".6" fill="currentColor"/>',
};
