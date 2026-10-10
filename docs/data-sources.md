# Data sources

Status as of 8 October 2026.

The goal of metroexit is to tell you which metro door to board at, so you get off next to the escalator, stairs or exit you need. To do that, we need to know where each exit sits along each platform. This page records where that information can come from and how complete it is so far.

**Summary:** the North West section (Tallawong to Chatswood) has both good station maps and structured data. The City section (Crows Nest to Sydenham) and the Bankstown line have neither from public sources yet.

## Coverage by station

| Station              | Station map quality                                        | GTFS Pathways                        |
| -------------------- | ---------------------------------------------------------- | ------------------------------------ |
| Tallawong            | Good (station guide)                                       | Yes                                  |
| Rouse Hill           | Good                                                       | Yes                                  |
| Kellyville           | Good                                                       | Yes                                  |
| Bella Vista          | Good                                                       | Yes                                  |
| Norwest              | Good                                                       | Yes                                  |
| Hills Showground     | Good                                                       | Yes                                  |
| Castle Hill          | Good                                                       | Yes                                  |
| Cherrybrook          | Good                                                       | Yes                                  |
| Epping               | Good                                                       | Yes                                  |
| Macquarie University | Good                                                       | Yes                                  |
| Macquarie Park       | Good                                                       | Yes                                  |
| North Ryde           | Good                                                       | Yes                                  |
| Chatswood            | Good                                                       | No                                   |
| Crows Nest           | Poor (local area guide)                                    | No                                   |
| Victoria Cross       | Poor                                                       | No                                   |
| Barangaroo           | Poor                                                       | No                                   |
| Martin Place         | Poor, but has a separate "Platforms" sheet still to review | Pre-2024 data only (train platforms) |
| Gadigal              | Poor                                                       | No                                   |
| Central              | Poor                                                       | Pre-2024 data only (train platforms) |
| Waterloo             | Poor                                                       | No                                   |
| Sydenham             | Poor                                                       | No                                   |
| Bankstown line       | Bankstown has a map, not yet reviewed                      | No                                   |

"Good" means the map is a station guide that shows the platforms, doors, escalators and lifts, like Bella Vista. "Poor" means it's a "Local area and station guide", which shows the streets around the station and gives little detail about the platforms. For the City-section stations, TfNSW only publishes the local-area style.

## 1. Station map PDFs

Fetch them with:

```sh
python3 scripts/fetch_station_maps.py               # current Sydney maps
python3 scripts/fetch_station_maps.py --superseded  # also superseded maps
python3 scripts/fetch_station_maps.py --regional    # also Newcastle/Central Coast
```

The script pulls from two TfNSW Open Data datasets through the portal's API:

- [Train Station Maps (including Metro)](https://opendata.transport.nsw.gov.au/data/dataset/train-station-maps-including-metro)
- [Metro Station Maps](https://opendata.transport.nsw.gov.au/data/dataset/metro-station-maps)

Most files appear in both datasets. If two files are for the same station and are exactly the same size, the script downloads only one of them.

Files are saved to:

```
data/station_maps/
├── current/
│   ├── metro/     29 maps (any station served by the metro, including interchanges)
│   └── train/     42 maps (Sydney Trains only, plus the Sydney Rail Network map)
├── superseded/
│   ├── metro/      6 maps
│   └── train/     43 maps
├── brochures/      Sydney Metro "Now Open" brochures (see below)
└── manifest.json   one entry per map: station, metro/train, superseded, source URL, dates
```

The PDFs are kept out of git (about 90 MB), so run the script to get them. `manifest.json` is committed.

Five regional stations (Newcastle, Hamilton, Broadmeadow, Gosford, Tuggerah) are skipped unless you pass `--regional`. The dataset also has a zip of all the maps; we skip it because it appears to repeat the individual PDFs.

Stations served by both metro and train go in `metro/`, because they're needed for metro-to-train connections.

## 2. Sydney Metro brochures

For the City-section stations, the [Transport NSW metro page](https://transportnsw.info/travel-info/ways-to-get-around/metro) has "Now Open" brochures, which were downloaded by hand to `data/station_maps/brochures/`:

- Crows Nest
- Victoria Cross
- Waterloo
- Sydenham
- a generic Sydney Metro brochure

**Not yet reviewed.** These are marketing material and may not include a station layout diagram. They're the last public lead for the City section. There are also cultural maps for Barangaroo, Central and Martin Place on the same page, which haven't been downloaded.

## 3. GTFS Pathways

Fetch it with:

```sh
python3 scripts/fetch_gtfs_pathways.py
```

This is the [GTFS Pathways](https://opendata.transport.nsw.gov.au/data/dataset/gtfs-pathways) dataset, saved to `data/gtfs_pathways/`. It uses the standard [GTFS pathways format](https://gtfs.org/schedule/reference/#pathwaystxt):

- **`stops.txt`**: the stations, platforms, entrances and exits, and internal nodes such as the top and bottom of escalators and lifts. Each has latitude and longitude.
- **`pathways.txt`**: the links between those stops. Each link has a type (walkway, stairs, escalator, lift, fare gate) and a walking time in seconds.

**Why it's useful:** because every node has coordinates, we can probably work out where along the platform each escalator or lift sits. That position is what decides the best carriage and door. For example, at Bella Vista the north lift and the south escalators are about 100 m apart, and the data shows that.

**Limitation:** the data was last updated in August 2023, before the City section opened in August 2024. It covers the 12 North West stations and Epping, but not Chatswood or anything south of it. Its Martin Place and Central entries are the Sydney Trains platforms, not the metro ones.

## 4. Platform door numbers

Each metro platform screen door has an official number, but TfNSW and Sydney Metro don't publish the numbering scheme. Searched October 2026:

- **Station map PDFs:** no door numbers, only where the escalators, stairs and lifts are.
- **OpenStreetMap:** platforms and platform edges are mapped, but no doors have a number (`ref`).
- **Sydney Metro articles:** the 8 city stations have 288 platform screen doors in total (18 per platform on average) along about 170 m of platform per station. That's long enough for an 8-car train, while metro trains have 6 cars (18 doors per side).

So door numbers come from surveying the platforms in person. What we know so far:

- **Victoria Cross:** doors are numbered 4 to 21 on each platform, which is 18 doors, one per train door. The numbering is mirrored: each door is directly across from the door with the same number on the other platform. Still unknown: which end door 4 is at.
- **Other stations:** not checked yet. Our working guess is 4 to 21, mirrored, everywhere. Confirm it at each station, and note which end door 4 is at.

## Why metro only

The metro is a much easier problem than Sydney Trains:

- **The doors never move.** Every metro platform has screen doors, and trains always stop in exactly the same spot, so a door-to-exit mapping stays reliable.
- **Every train is the same.** Metro trains always have 6 carriages. Sydney Trains run 4- or 8-car sets of different types that stop at different marks.

The train maps are kept because they're useful at interchange stations.

## Open questions and next steps

1. **Review the maps visually.** No PDF has been opened yet. Rendering them needs `sips` (built into macOS) or poppler (`brew install poppler`). Check first:
   - the brochures
   - the Martin Place "Platforms" sheet
   - the Bankstown map
   - the Chatswood guide, since Chatswood has no GTFS Pathways data
2. **Prototype on the North West line.** Use GTFS Pathways to place each exit along the platform, then check the result against the station guides.
3. **Fill the City-section gap.** If the brochures don't show the layout, these stations will need mapping some other way, for example from photos of the platform signs or by walking the platforms.
4. **Ask TfNSW.** The open data portal accepts dataset requests. Ask whether they plan to publish station guides or updated GTFS Pathways data for the City section.
