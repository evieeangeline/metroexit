#!/usr/bin/env python3
"""Download the TfNSW Open Data "GTFS Pathways" dataset (stops.txt and
pathways.txt) via the CKAN API.

Stops include stations, platforms, entrances/exits and internal nodes
(escalator/lift landings) with coordinates; pathways link them with a
mode (walkway, stairs, escalator, lift, ...) and traversal time.

Usage:
    python3 scripts/fetch_gtfs_pathways.py
"""

import json
import sys
import urllib.request
from pathlib import Path

API = "https://opendata.transport.nsw.gov.au/api/3/action/package_show"
DATASET_ID = "gtfs-pathways"

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "data" / "gtfs_pathways"

# The portal serves the files as e.g. "stops_0.txt"; save them under
# their standard GTFS names.
FILES = {"stops.txt", "pathways.txt"}


def main():
    with urllib.request.urlopen(f"{API}?id={DATASET_ID}", timeout=60) as resp:
        resources = json.load(resp)["result"]["resources"]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    saved = []
    for r in resources:
        name = r["name"].strip()
        if name not in FILES:
            continue
        dest = OUT_DIR / name
        with urllib.request.urlopen(r["url"], timeout=120) as resp:
            dest.write_bytes(resp.read())
        saved.append(name)
        print(f"[downloaded] {dest.relative_to(ROOT)} (updated {r.get('last_modified')})")

    missing = FILES - set(saved)
    if missing:
        print(f"missing from dataset: {sorted(missing)}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
