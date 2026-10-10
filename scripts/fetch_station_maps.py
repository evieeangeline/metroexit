#!/usr/bin/env python3
"""Download station map PDFs from the TfNSW Open Data "Train Station Maps
(including Metro)" and "Metro Station Maps" datasets via the CKAN API.
Files published in both datasets are only downloaded once.

Usage:
    python3 scripts/fetch_station_maps.py               # current Sydney maps
    python3 scripts/fetch_station_maps.py --superseded  # also superseded maps
    python3 scripts/fetch_station_maps.py --regional    # also Newcastle/Central Coast
"""

import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path

API = "https://opendata.transport.nsw.gov.au/api/3/action/package_show"
DATASETS = [
    "402c796e-afc6-43da-86e5-bcf7c167f670",  # Train Station Maps (including Metro)
    "metro-station-maps",                     # Metro Station Maps
]

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "data" / "station_maps"

# Stations in the dataset that are outside Greater Sydney.
REGIONAL = {"broadmeadow", "gosford", "hamilton", "newcastle", "tuggerah"}

# Sydney Metro stations (M1 Metro North West & Bankstown Line).
METRO = {
    "tallawong", "rouse-hill", "kellyville", "bella-vista", "norwest",
    "hills-showground", "castle-hill", "cherrybrook", "epping",
    "macquarie-university", "macquarie-park", "north-ryde", "chatswood",
    "crows-nest", "victoria-cross", "barangaroo", "martin-place", "gadigal",
    "central", "waterloo", "sydenham", "bankstown",
}

SUPERSEDED_PATTERN = re.compile(
    r"superseded|effective to|not to be used|no longer current|"
    r"26 august 2021 to 23 october 2021",
    re.IGNORECASE,
)


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def station_slug(name):
    """Best-effort station name from a resource title, e.g.
    'Chatswood – Train/Metro – Station Guide' -> 'chatswood'."""
    base = re.split(r"\s[–-]\s|\sstation\b|\smetro\b|\(", name, flags=re.IGNORECASE)[0]
    return slugify(base)


def fetch_resources(dataset_id):
    with urllib.request.urlopen(f"{API}?id={dataset_id}", timeout=60) as resp:
        return json.load(resp)["result"]["resources"]


def classify(resource, dataset_id):
    name = resource["name"].strip()
    text = f"{name} {resource.get('description') or ''}"
    station = station_slug(name)
    return {
        "id": resource["id"],
        "dataset": dataset_id,
        "name": name,
        "description": (resource.get("description") or "").strip(),
        "station": station,
        "format": resource["format"],
        "url": resource["url"],
        "size": resource.get("size"),
        "last_modified": resource.get("last_modified"),
        "superseded": bool(SUPERSEDED_PATTERN.search(text)),
        "regional": station in REGIONAL,
        "metro": station in METRO or "metro" in name.lower(),
        "network_map": "network" in name.lower(),
    }


def download(url, dest):
    if dest.exists() and dest.stat().st_size > 0:
        return "cached"
    tmp = dest.with_suffix(dest.suffix + ".part")
    with urllib.request.urlopen(url, timeout=120) as resp, open(tmp, "wb") as f:
        while chunk := resp.read(1 << 16):
            f.write(chunk)
    tmp.rename(dest)
    return "downloaded"


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--superseded", action="store_true", help="include superseded maps")
    parser.add_argument("--regional", action="store_true", help="include non-Sydney stations")
    args = parser.parse_args()

    # The same PDF is often republished in several datasets under a new
    # resource id; treat an identical station + byte size as a duplicate.
    entries, seen = [], set()
    for dataset_id in DATASETS:
        for r in fetch_resources(dataset_id):
            if r["format"].upper() != "PDF":
                continue
            e = classify(r, dataset_id)
            key = (e["station"], e["size"])
            if key not in seen:
                seen.add(key)
                entries.append(e)

    selected = [
        e for e in entries
        if (args.superseded or not e["superseded"])
        and (args.regional or not e["regional"])
    ]

    for e in selected:
        status_dir = "superseded" if e["superseded"] else "current"
        mode_dir = "metro" if e["metro"] else "train"
        filename = f"{slugify(e['name'])}__{e['id'][:8]}.pdf"
        dest = OUT_DIR / status_dir / mode_dir / filename
        dest.parent.mkdir(parents=True, exist_ok=True)
        try:
            status = download(e["url"], dest)
        except Exception as exc:  # keep going; report at the end
            status = f"failed: {exc}"
        e["path"] = str(dest.relative_to(ROOT))
        e["status"] = status
        print(f"[{status}] {e['path']}")

    manifest = OUT_DIR / "manifest.json"
    manifest.write_text(json.dumps(selected, indent=2, ensure_ascii=False) + "\n")

    failed = [e for e in selected if e["status"].startswith("failed")]
    print(f"\n{len(selected) - len(failed)}/{len(selected)} maps saved; manifest at {manifest.relative_to(ROOT)}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
