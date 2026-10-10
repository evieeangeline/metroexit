// What a volunteer standing on a platform reports through /contribute, and the
// server-side check that /api/submissions runs before storing it.
import { stations } from '../data/metro';

export const DIRECTIONS = { tallawong: 'Tallawong', sydenham: 'Sydenham' } as const;

export const CONNECTION_TYPES = {
  escalators: 'Escalators',
  'escalators-stairs': 'Escalators + stairs',
  stairs: 'Stairs only',
  lift: 'Lift',
} as const;

export type Direction = keyof typeof DIRECTIONS;
export type ConnectionType = keyof typeof CONNECTION_TYPES;

/** One end door of a platform, and which end of an arriving train it lines up with. */
export interface EndDoor {
  door?: number;
  end?: 'front' | 'back';
}

/** A platform, named by where its trains are heading. */
export interface PlatformDoors {
  towards: Direction;
  lowest: EndDoor;
  highest: EndDoor;
}

/** A way off the platform: an escalator bank, stairs or a lift. */
export interface Connection {
  /** Which platform it was logged on, when the volunteer could see both. */
  towards: Direction | 'both';
  type: ConnectionType;
  /** Nearest platform door. */
  door: number;
  /** Escalators that only run one way, at the time of the survey. */
  direction?: 'up' | 'down' | 'both';
  leadsTo: string;
}

export interface Survey {
  station: string;
  platforms: PlatformDoors[];
  connections: Connection[];
  notes: string;
  name: string;
}

/** Stations people can survey: everything open on the metro now. */
export const surveyStations = stations.filter((s) => s.line !== 'bankstown');

const MAX_DOOR = 30;
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const door = (v: unknown) =>
  Number.isInteger(v) && (v as number) >= 1 && (v as number) <= MAX_DOOR ? (v as number) : undefined;
const oneOf = <T extends string>(v: unknown, options: readonly T[]): T | undefined =>
  options.includes(v as T) ? (v as T) : undefined;
const directions = Object.keys(DIRECTIONS) as Direction[];

function endDoor(raw: unknown): EndDoor {
  const r = (raw ?? {}) as Record<string, unknown>;
  const d = door(r.door);
  const end = oneOf(r.end, ['front', 'back'] as const);
  return { ...(d !== undefined && { door: d }), ...(end && { end }) };
}

/** Returns a clean Survey, or an error message for the volunteer. */
export function parseSurvey(raw: unknown): Survey | string {
  if (!raw || typeof raw !== 'object') return 'Empty submission.';
  const r = raw as Record<string, unknown>;

  const station = str(r.station, 40);
  if (!surveyStations.some((s) => s.id === station)) return 'Pick a station.';

  const platforms: PlatformDoors[] = [];
  for (const p of (Array.isArray(r.platforms) ? r.platforms : []) as Record<string, unknown>[]) {
    const towards = oneOf(p?.towards, directions);
    if (!towards || platforms.some((q) => q.towards === towards)) continue;
    platforms.push({ towards, lowest: endDoor(p.lowest), highest: endDoor(p.highest) });
  }
  if (!platforms.length) return 'Pick which way the trains are heading.';
  const only = platforms.length === 1 ? platforms[0].towards : null;

  // Rows without a type or door are half-filled extras; skip them.
  const connections: Connection[] = [];
  for (const c of (Array.isArray(r.connections) ? r.connections.slice(0, 24) : []) as Record<string, unknown>[]) {
    const type = oneOf(c?.type, Object.keys(CONNECTION_TYPES) as ConnectionType[]);
    const d = door(c?.door);
    if (!type || d === undefined) continue;
    connections.push({
      towards: only ?? oneOf(c.towards, [...directions, 'both'] as const) ?? 'both',
      type,
      door: d,
      ...(type !== 'lift' && { direction: oneOf(c.direction, ['up', 'down', 'both'] as const) ?? 'both' }),
      leadsTo: str(c.leadsTo, 200),
    });
  }

  if (!platforms.some((p) => p.lowest.door || p.highest.door) && !connections.length) {
    return 'Add at least one door number.';
  }

  return { station, platforms, connections, notes: str(r.notes, 2000), name: str(r.name, 80) };
}
