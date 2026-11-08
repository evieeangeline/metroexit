// What a volunteer on a platform reports through the station card survey, and the
// server-side check that /api/submissions runs before storing it.
import { stations } from '../data/metro';

/**
 * Every metro platform has doors 4 to 21, with door 4 at the south (Bankstown)
 * end on both platforms. Confirmed at Victoria Cross and Gadigal; not yet on the
 * converted Bankstown line stations. See docs/data-sources.md.
 */
export const FIRST_DOOR = 4;
export const LAST_DOOR = 21;
export const DOOR_NUMBERS = Array.from({ length: LAST_DOOR - FIRST_DOOR + 1 }, (_, i) => FIRST_DOOR + i);

/**
 * Which platform a survey covers. "both" means the two sides match door for door.
 * Before the Bankstown line opened, southbound was "sydenham"; those are read as "bankstown".
 */
export const PLATFORMS = {
  tallawong: 'Towards Tallawong',
  bankstown: 'Towards Bankstown',
  both: 'Both platforms',
} as const;

/** Things a volunteer can mark next to a door. */
export const FEATURES = {
  escalators: 'Escalators',
  stairs: 'Stairs',
  lift: 'Lift',
  accessible: 'Accessible door',
  seats: 'Seats',
  help: 'Help point',
} as const;

export type Platform = keyof typeof PLATFORMS;
export type Feature = keyof typeof FEATURES;

export interface DoorReport {
  door: number;
  features: Feature[];
  /** Where the escalators or lift go, or anything else worth knowing. */
  note: string;
}

export interface Survey {
  station: string;
  platform: Platform;
  /** Only doors with something marked, in door order. */
  doors: DoorReport[];
  notes: string;
  name: string;
}

/** Stations people can survey: everything open on the metro now. */
export const surveyStations = stations.filter((s) => s.status !== 'soon');

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const oneOf = <T extends string>(v: unknown, options: readonly T[]): T | undefined =>
  options.includes(v as T) ? (v as T) : undefined;
const featureKeys = Object.keys(FEATURES) as Feature[];

/** Returns a clean Survey, or an error message for the volunteer. */
export function parseSurvey(raw: unknown): Survey | string {
  if (!raw || typeof raw !== 'object') return 'Empty submission.';
  const r = raw as Record<string, unknown>;

  const station = str(r.station, 40);
  if (!surveyStations.some((s) => s.id === station)) return 'Pick a station.';
  const platform = oneOf(r.platform === 'sydenham' ? 'bankstown' : r.platform, Object.keys(PLATFORMS) as Platform[]);
  if (!platform) return 'Pick which platform you’re on.';

  const byDoor = new Map<number, DoorReport>();
  for (const d of (Array.isArray(r.doors) ? r.doors.slice(0, 40) : []) as Record<string, unknown>[]) {
    const door = d?.door as number;
    if (!DOOR_NUMBERS.includes(door) || byDoor.has(door)) continue;
    const features = featureKeys.filter((f) => Array.isArray(d.features) && d.features.includes(f));
    const note = str(d.note, 200);
    if (features.length || note) byDoor.set(door, { door, features, note });
  }
  if (!byDoor.size) return 'Tap a door and mark what’s next to it.';

  return {
    station,
    platform,
    doors: [...byDoor.values()].sort((a, b) => a.door - b.door),
    notes: str(r.notes, 2000),
    name: str(r.name, 80),
  };
}
