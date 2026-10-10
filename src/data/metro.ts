// Sydney Metro stations and a few surrounding Sydney Trains lines for context.
// North West coordinates come from data/gtfs_pathways/stops.txt; the rest are
// approximate station locations.

export type Line = 'northwest' | 'city' | 'bankstown';

/** How far along we are with door → exit data for a station (see docs/data-sources.md). */
export type Status = 'ready' | 'mapping' | 'soon';

/** Label placement relative to the dot: right, left, top, bottom, or rotated (Bankstown line). */
export type LabelPos = 'r' | 'l' | 't' | 'b' | 'rot';

export interface Station {
  id: string;
  name: string;
  label?: string;
  lat: number;
  lon: number;
  line: Line;
  interchange?: boolean;
  /** Labelled on the small phone overview map, placed at keyPos. */
  key?: boolean;
  keyPos?: LabelPos;
  status: Status;
  pos: LabelPos;
}

export const stations: Station[] = [
  // North West — Tallawong to Chatswood
  { id: 'tallawong', name: 'Tallawong', lat: -33.6916, lon: 150.906, line: 'northwest', key: true, keyPos: 't', status: 'ready', pos: 'l' },
  { id: 'rouse-hill', name: 'Rouse Hill', lat: -33.692, lon: 150.9243, line: 'northwest', status: 'ready', pos: 'r' },
  { id: 'kellyville', name: 'Kellyville', lat: -33.7134, lon: 150.9351, line: 'northwest', status: 'ready', pos: 'l' },
  { id: 'bella-vista', name: 'Bella Vista', lat: -33.7306, lon: 150.944, line: 'northwest', status: 'ready', pos: 'l' },
  { id: 'norwest', name: 'Norwest', lat: -33.7346, lon: 150.9636, line: 'northwest', status: 'ready', pos: 'b' },
  { id: 'hills-showground', name: 'Hills Showground', label: 'Showground', lat: -33.7279, lon: 150.987, line: 'northwest', status: 'ready', pos: 't' },
  { id: 'castle-hill', name: 'Castle Hill', lat: -33.7316, lon: 151.0073, line: 'northwest', status: 'ready', pos: 'b' },
  { id: 'cherrybrook', name: 'Cherrybrook', lat: -33.7367, lon: 151.032, line: 'northwest', status: 'ready', pos: 't' },
  { id: 'epping', name: 'Epping', lat: -33.7727, lon: 151.082, line: 'northwest', interchange: true, key: true, keyPos: 'l', status: 'ready', pos: 'l' },
  { id: 'macquarie-university', name: 'Macquarie University', label: 'Macquarie Uni', lat: -33.7771, lon: 151.118, line: 'northwest', status: 'ready', pos: 't' },
  { id: 'macquarie-park', name: 'Macquarie Park', lat: -33.7852, lon: 151.1283, line: 'northwest', status: 'ready', pos: 'l' },
  { id: 'north-ryde', name: 'North Ryde', lat: -33.7946, lon: 151.1378, line: 'northwest', status: 'ready', pos: 'b' },
  { id: 'chatswood', name: 'Chatswood', lat: -33.7969, lon: 151.1803, line: 'northwest', interchange: true, key: true, keyPos: 't', status: 'mapping', pos: 'r' },

  // City & Southwest — Crows Nest to Sydenham
  { id: 'crows-nest', name: 'Crows Nest', lat: -33.8263, lon: 151.2014, line: 'city', status: 'mapping', pos: 'r' },
  { id: 'victoria-cross', name: 'Victoria Cross', lat: -33.8389, lon: 151.2071, line: 'city', status: 'mapping', pos: 'r' },
  { id: 'barangaroo', name: 'Barangaroo', lat: -33.8613, lon: 151.2033, line: 'city', status: 'mapping', pos: 'l' },
  { id: 'martin-place', name: 'Martin Place', lat: -33.8679, lon: 151.2118, line: 'city', interchange: true, status: 'mapping', pos: 'r' },
  { id: 'gadigal', name: 'Gadigal', lat: -33.8746, lon: 151.2079, line: 'city', status: 'mapping', pos: 'l' },
  { id: 'central', name: 'Central', lat: -33.8826, lon: 151.2066, line: 'city', interchange: true, key: true, keyPos: 'l', status: 'mapping', pos: 'r' },
  { id: 'waterloo', name: 'Waterloo', lat: -33.8988, lon: 151.2063, line: 'city', status: 'mapping', pos: 'r' },
  { id: 'sydenham', name: 'Sydenham', lat: -33.9147, lon: 151.1675, line: 'city', interchange: true, key: true, keyPos: 'b', status: 'mapping', pos: 'r' },

  // Bankstown line — Marrickville to Bankstown
  { id: 'marrickville', name: 'Marrickville', lat: -33.9137, lon: 151.1549, line: 'bankstown', status: 'soon', pos: 'rot' },
  { id: 'dulwich-hill', name: 'Dulwich Hill', lat: -33.9111, lon: 151.1412, line: 'bankstown', status: 'soon', pos: 'rot' },
  { id: 'hurlstone-park', name: 'Hurlstone Park', lat: -33.91, lon: 151.1286, line: 'bankstown', status: 'soon', pos: 'rot' },
  { id: 'canterbury', name: 'Canterbury', lat: -33.9123, lon: 151.1186, line: 'bankstown', status: 'soon', pos: 'rot' },
  { id: 'campsie', name: 'Campsie', lat: -33.9103, lon: 151.1025, line: 'bankstown', status: 'soon', pos: 'rot' },
  { id: 'belmore', name: 'Belmore', lat: -33.9175, lon: 151.0892, line: 'bankstown', status: 'soon', pos: 'rot' },
  { id: 'lakemba', name: 'Lakemba', lat: -33.9198, lon: 151.0757, line: 'bankstown', status: 'soon', pos: 'rot' },
  { id: 'wiley-park', name: 'Wiley Park', lat: -33.9226, lon: 151.0675, line: 'bankstown', status: 'soon', pos: 'rot' },
  { id: 'punchbowl', name: 'Punchbowl', lat: -33.9256, lon: 151.0538, line: 'bankstown', status: 'soon', pos: 'rot' },
  { id: 'bankstown', name: 'Bankstown', lat: -33.9177, lon: 151.0347, line: 'bankstown', interchange: true, key: true, keyPos: 'l', status: 'soon', pos: 'l' },
];

export const lineInfo: Record<Line, { name: string; color: string }> = {
  northwest: { name: 'North West', color: 'var(--line-nw)' },
  city: { name: 'City & Southwest', color: 'var(--line-city)' },
  bankstown: { name: 'Bankstown line', color: 'var(--line-city)' },
};

const helpBlurb = 'We don’t know which doors line up with the exits here yet. Waiting on the platform? You can help.';

export const statusInfo: Record<Status, { chip: string; blurb: string }> = {
  ready: { chip: 'help map me!', blurb: helpBlurb },
  mapping: { chip: 'help map me!', blurb: helpBlurb },
  soon: { chip: 'coming soon', blurb: 'Not on the metro yet. We’ll be waiting at the doors.' },
};

/** Sydney Trains lines drawn faintly behind the metro, as [lat, lon] runs. */
export const railways: [number, number][][] = [
  // Western: Blacktown → Central
  [[-33.7686, 150.9074], [-33.7743, 150.9362], [-33.787, 150.952], [-33.8015, 150.9555], [-33.807, 150.9713], [-33.808, 150.9876], [-33.8172, 151.0048], [-33.8226, 151.0076], [-33.8328, 151.0119], [-33.8358, 151.0169], [-33.8492, 151.0329], [-33.8636, 151.0447], [-33.8644, 151.071], [-33.8669, 151.086], [-33.8722, 151.0943], [-33.8772, 151.1043], [-33.8836, 151.1149], [-33.8876, 151.1259], [-33.8904, 151.1387], [-33.8933, 151.1475], [-33.8946, 151.155], [-33.8948, 151.1645], [-33.8978, 151.1793], [-33.8967, 151.1874], [-33.8916, 151.1988], [-33.8826, 151.2066]],
  // North Shore: Central → Hornsby
  [[-33.8826, 151.2066], [-33.8732, 151.2071], [-33.8657, 151.2062], [-33.846, 151.2117], [-33.8411, 151.2074], [-33.838, 151.198], [-33.832, 151.1915], [-33.8224, 151.1942], [-33.8086, 151.1855], [-33.7969, 151.1803], [-33.7838, 151.1774], [-33.7756, 151.1691], [-33.766, 151.162], [-33.7558, 151.1544], [-33.7445, 151.1432], [-33.7332, 151.1294], [-33.7226, 151.121], [-33.718, 151.1175], [-33.71, 151.104], [-33.7035, 151.0984]],
  // Northern: Strathfield → Epping → Hornsby
  [[-33.8722, 151.0943], [-33.859, 151.0881], [-33.8485, 151.0856], [-33.8306, 151.0871], [-33.8163, 151.089], [-33.8073, 151.0902], [-33.7987, 151.0858], [-33.7901, 151.0822], [-33.7727, 151.082], [-33.7555, 151.079], [-33.7494, 151.0647], [-33.7381, 151.0725], [-33.7317, 151.0785], [-33.7207, 151.0975], [-33.7035, 151.0984]],
  // Richmond: Blacktown → Schofields
  [[-33.7686, 150.9074], [-33.7458, 150.899], [-33.733, 150.888], [-33.6966, 150.8723]],
  // Airport: Central → Wolli Creek
  [[-33.8826, 151.2066], [-33.9055, 151.2026], [-33.9217, 151.1874], [-33.9338, 151.1786], [-33.9348, 151.1659], [-33.9286, 151.1541]],
  // Illawarra: Redfern → Rockdale
  [[-33.8916, 151.1988], [-33.9, 151.1856], [-33.9073, 151.1802], [-33.9147, 151.1675], [-33.9238, 151.1566], [-33.9286, 151.1541], [-33.9364, 151.1471], [-33.9523, 151.1367]],
  // Eastern Suburbs: Town Hall → Edgecliff
  [[-33.8732, 151.2071], [-33.8679, 151.2118], [-33.8752, 151.2225], [-33.8794, 151.2367]],
  // City Circle: Central → Wynyard
  [[-33.8826, 151.2066], [-33.8765, 151.2098], [-33.8707, 151.2104], [-33.8612, 151.2107], [-33.8657, 151.2062]],
  // Lidcombe → Bankstown
  [[-33.8636, 151.0447], [-33.8717, 151.0313], [-33.8826, 151.0237], [-33.892, 151.0228], [-33.905, 151.0247], [-33.9177, 151.0347]],
];
