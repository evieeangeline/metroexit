// Turns lat/lon into SVG coordinates and smooths station-to-station runs into curves.

export type Pt = [number, number];

const BOUNDS = { west: 150.865, east: 151.245, north: -33.672, south: -33.948 };
const SCALE = 2600;
const LON_FACTOR = Math.cos((33.8 * Math.PI) / 180);

export const viewBox = {
  width: Math.round((BOUNDS.east - BOUNDS.west) * LON_FACTOR * SCALE),
  height: Math.round((BOUNDS.north - BOUNDS.south) * SCALE),
};

export function project(lat: number, lon: number): Pt {
  const x = (lon - BOUNDS.west) * LON_FACTOR * SCALE;
  const y = (BOUNDS.north - lat) * SCALE;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

const r = (n: number) => Math.round(n * 10) / 10;

/** Catmull-Rom spline through the points, returned as one cubic Bézier segment per gap. */
export function smoothSegments(pts: Pt[]): string[] {
  const segs: string[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    segs.push(`C${r(c1[0])},${r(c1[1])} ${r(c2[0])},${r(c2[1])} ${r(p2[0])},${r(p2[1])}`);
  }
  return segs;
}

export function smoothPath(pts: Pt[]): string {
  return `M${pts[0][0]},${pts[0][1]} ` + smoothSegments(pts).join(' ');
}
