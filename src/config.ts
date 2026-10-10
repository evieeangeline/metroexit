/**
 * Live metro positions on the map (TfNSW GTFS-realtime via /api/metros).
 * The motion still jumps forward at times; see docs/live-trains.md.
 * While off, the map shows one decorative train and /api/metros returns 404.
 */
export const LIVE_TRAINS = true;
