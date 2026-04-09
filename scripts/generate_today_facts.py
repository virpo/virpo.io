#!/usr/bin/env python3

from __future__ import annotations

import calendar
import html
import json
import re
import subprocess
import time
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "data" / "today-facts.json"
REVIEW_PATH = ROOT / "notes" / "today-facts-review.md"
ENRICH_SCRIPT_PATH = ROOT / "scripts" / "enrich_today_facts.mjs"
CACHE_DIR = ROOT / "data" / "_today-source-cache-muffinlabs"
SOURCE_API = "https://history.muffinlabs.com/date/{month}/{day}"
USER_AGENT = "virpo-homepage-lab/1.0 (research for personal website; contact via virpo.sk)"


@dataclass(frozen=True)
class Category:
    key: str
    emoji: str
    keywords: tuple[str, ...]


CATEGORIES: tuple[Category, ...] = (
    Category(
        "space",
        "🚀",
        (
            "space",
            "rocket",
            "satellite",
            "spacecraft",
            "orbiter",
            "rover",
            "lander",
            "apollo",
            "soyuz",
            "nasa",
            "esa",
            "mars",
            "moon",
            "lunar",
            "venus",
            "mercury",
            "jupiter",
            "telescope",
            "spacewalk",
            "shuttle",
            "orbit",
            "orbital",
            "cosmonaut",
        ),
    ),
    Category(
        "aviation",
        "✈️",
        (
            "airplane",
            "aeroplane",
            "aircraft",
            "aviation",
            "flight",
            "glider",
            "jet",
            "helicopter",
            "airship",
            "zeppelin",
            "balloon",
            "boeing",
            "airbus",
            "pilot",
        ),
    ),
    Category(
        "vehicles",
        "🚗",
        (
            "automobile",
            "car",
            "motor car",
            "motorcar",
            "engine",
            "diesel",
            "steam engine",
            "locomotive",
            "railway",
            "railroad",
            "train",
            "tram",
            "submarine",
            "steamship",
            "ship",
            "bicycle",
            "motorcycle",
            "subway",
        ),
    ),
    Category(
        "computing",
        "💻",
        (
            "computer",
            "computing",
            "internet",
            "rfc",
            "software",
            "microprocessor",
            "transistor",
            "integrated circuit",
            "chip",
            "ibm",
            "git",
            "television",
            "radio",
            "broadcast",
            "telephone",
            "telegraph",
            "camera",
            "photograph",
            "photography",
            "printer",
            "email",
            "web",
            "world wide web",
            "apple i",
            "apple ii",
            "dvd",
        ),
    ),
    Category(
        "science",
        "🔬",
        (
            "discover",
            "discovery",
            "discovers",
            "scientist",
            "experiment",
            "dna",
            "vaccine",
            "antibiotic",
            "x-ray",
            "laser",
            "microscope",
            "thermometer",
            "light bulb",
            "lightbulb",
            "electric",
            "electricity",
            "battery",
            "pencil",
            "element",
            "planet",
            "asteroid",
            "voltaic",
            "gram",
            "kilogram",
        ),
    ),
)

POSITIVE_TERMS: tuple[str, ...] = (
    "invent",
    "invention",
    "invented",
    "discover",
    "discovery",
    "discovered",
    "first",
    "launches",
    "launched",
    "announces",
    "announced",
    "demonstrates",
    "demonstrated",
    "patents",
    "patented",
    "publishes",
    "publication",
    "broadcast",
    "test",
    "tested",
    "unveils",
    "introduced",
    "developed",
    "takes effect",
    "opens",
)

NEGATIVE_TERMS: tuple[str, ...] = (
    "battle",
    "war",
    "election",
    "president",
    "prime minister",
    "king",
    "queen",
    "pope",
    "executed",
    "murdered",
    "dies",
    "dead",
    "earthquake",
    "tsunami",
    "flood",
    "hurricane",
    "terrorist",
    "prison",
    "football",
    "baseball",
    "olympics",
    "song",
    "album",
    "film",
    "movie",
    "television series",
    "riot",
    "assassinated",
)

DISASTER_TERMS: tuple[str, ...] = (
    "crash",
    "crashes",
    "crashed",
    "sink",
    "sinks",
    "sank",
    "hijack",
    "hijacked",
    "kill",
    "killed",
    "killing",
    "dies",
    "dead",
    "explode",
    "explodes",
    "exploded",
    "bomb",
    "ditches",
    "collide",
    "collides",
    "collision",
    "wreck",
    "wrecked",
    "disaster",
    "fatal",
)

CURATED_OVERRIDES: dict[str, dict[str, object]] = {
    "01-23": {
        "year": 1960,
        "emoji": "🌊",
        "category": "science",
        "event": "The bathyscaphe Trieste descends to Challenger Deep, the deepest known point in the ocean.",
        "source": "https://todayinsci.com/1/1_23.htm",
    },
    "01-17": {
        "year": 1949,
        "emoji": "⚛️",
        "category": "science",
        "event": "The first synchrotron releases full energy at Berkeley's Radiation Laboratory.",
        "source": "https://todayinsci.com/1/1_17.htm",
    },
    "01-13": {
        "year": 1976,
        "emoji": "🗣️",
        "category": "computing",
        "event": "Ray Kurzweil publicly demonstrates a machine that reads printed text aloud for blind users.",
        "source": "https://todayinsci.com/1/1_13.htm",
    },
    "02-02": {
        "year": 1935,
        "emoji": "🕵️",
        "category": "science",
        "event": "Leonard Keeler conducts the first use of his polygraph machine.",
        "source": "https://todayinsci.com/2/2_02.htm",
    },
    "02-05": {
        "year": 1974,
        "emoji": "🪐",
        "category": "space",
        "event": "Mariner 10 returns the first close-up photos of Venusian clouds.",
        "source": "https://todayinsci.com/2/2_05.htm",
    },
    "02-08": {
        "year": 1928,
        "emoji": "📺",
        "category": "computing",
        "event": "John Logie Baird's television image is received across the Atlantic by shortwave radio.",
        "source": "https://todayinsci.com/2/2_08.htm",
    },
    "02-22": {
        "year": 1946,
        "emoji": "💊",
        "category": "science",
        "event": "Selman Waksman announces streptomycin, the first specific antibiotic effective against tuberculosis.",
        "source": "https://todayinsci.com/2/2_22.htm",
    },
    "02-29": {
        "year": 1504,
        "emoji": "🌘",
        "category": "science",
        "event": "Christopher Columbus uses a predicted lunar eclipse to win supplies in Jamaica.",
        "source": "https://en.wikipedia.org/wiki/February_29",
    },
    "03-26": {
        "year": 1994,
        "emoji": "🔭",
        "category": "space",
        "event": "A picture is released showing Dactyl, the first moon discovered orbiting an asteroid.",
        "source": "https://todayinsci.com/3/3_26.htm",
    },
    "03-27": {
        "year": 1968,
        "emoji": "🏄",
        "category": "vehicles",
        "event": "The first U.S. patent application for the Windsurfer sailboard is filed.",
        "source": "https://todayinsci.com/3/3_27.htm",
    },
    "03-06": {
        "year": 1953,
        "emoji": "🧬",
        "category": "science",
        "event": "Watson and Crick submit their first paper describing the structure of DNA.",
        "source": "https://todayinsci.com/3/3_06.htm",
    },
    "03-15": {
        "year": 1959,
        "emoji": "⚛️",
        "category": "science",
        "event": "Brookhaven's medical research reactor reaches criticality for the first time.",
        "source": "https://todayinsci.com/3/3_15.htm",
    },
    "04-07": {
        "year": 1964,
        "emoji": "💻",
        "category": "computing",
        "event": "IBM announces the System/360.",
    },
    "04-18": {
        "year": 1925,
        "emoji": "📠",
        "category": "computing",
        "event": "The first U.S. commercial transcontinental radio facsimile is sent from San Francisco to New York.",
        "source": "https://todayinsci.com/4/4_18.htm",
    },
    "05-23": {
        "year": 1903,
        "emoji": "☎️",
        "category": "computing",
        "event": "Paris and Rome are linked by telephone for the first time.",
        "source": "https://todayinsci.com/5/5_23.htm",
    },
    "05-08": {
        "year": 1790,
        "emoji": "📏",
        "category": "science",
        "event": "The French National Assembly decides to create a simple decimal system of measurement units.",
        "source": "https://todayinsci.com/5/5_08.htm",
    },
    "06-19": {
        "year": -240,
        "emoji": "🌍",
        "category": "science",
        "event": "Eratosthenes estimates the circumference of the Earth.",
        "source": "https://todayinsci.com/6/6_19.htm",
    },
    "06-20": {
        "year": 1840,
        "emoji": "📡",
        "category": "computing",
        "event": "Samuel F. B. Morse receives a patent for telegraphy signals.",
        "source": "https://todayinsci.com/6/6_20.htm",
    },
    "07-09": {
        "year": 1957,
        "emoji": "🧪",
        "category": "science",
        "event": "Element 102 is announced and proposed under the name Nobelium.",
        "source": "https://todayinsci.com/7/7_09.htm",
    },
    "08-19": {
        "year": 1839,
        "emoji": "📷",
        "category": "computing",
        "event": "Louis Daguerre announces the daguerreotype, the first permanently fixed photographic process.",
        "source": "https://todayinsci.com/8/8_19.htm",
    },
    "08-22": {
        "year": 1989,
        "emoji": "🔭",
        "category": "space",
        "event": "Voyager 2 reveals the first complete ring around Neptune.",
        "source": "https://todayinsci.com/8/8_22.htm",
    },
    "09-22": {
        "year": 1851,
        "emoji": "📡",
        "category": "computing",
        "event": "Telegraph dispatching is used to control railroad traffic for the first time in the U.S.",
        "source": "https://todayinsci.com/9/9_22.htm",
    },
    "09-26": {
        "year": 1871,
        "emoji": "🧱",
        "category": "science",
        "event": "A U.S. patent is issued for the composition of Portland cement.",
        "source": "https://todayinsci.com/9/9_26.htm",
    },
    "10-02": {
        "year": 1956,
        "emoji": "⏱️",
        "category": "science",
        "event": "The Atomicron, the first atomic clock in the U.S., is unveiled in New York.",
        "source": "https://todayinsci.com/10/10_02.htm",
    },
    "11-25": {
        "year": 1975,
        "emoji": "🩻",
        "category": "science",
        "event": "The first U.S. patent for a whole-body CT scanner is issued.",
        "source": "https://todayinsci.com/11/11_25.htm",
    },
    "12-10": {
        "year": 1799,
        "emoji": "📏",
        "category": "science",
        "event": "France makes the metric system compulsory by law under a revised definition of the metre.",
        "source": "https://todayinsci.com/12/12_10.htm",
    },
    "12-06": {
        "year": 1998,
        "emoji": "🛰️",
        "category": "space",
        "event": "Astronauts begin assembling the International Space Station in orbit.",
        "source": "https://todayinsci.com/12/12_06.htm",
    },
    "12-16": {
        "year": 1954,
        "emoji": "💎",
        "category": "science",
        "event": "The first reproducible U.S.-made synthetic diamonds are created at GE Research Laboratories.",
        "source": "https://todayinsci.com/12/12_16.htm",
    },
    "12-17": {
        "year": 1979,
        "emoji": "🚗",
        "category": "vehicles",
        "event": "A rocket automobile claims the first supersonic run on land.",
        "source": "https://todayinsci.com/12/12_17.htm",
    },
    "12-18": {
        "year": 1958,
        "emoji": "🛰️",
        "category": "space",
        "event": "Project SCORE becomes the first American communications satellite to orbit Earth.",
        "source": "https://todayinsci.com/12/12_18.htm",
    },
    "12-29": {
        "year": 1939,
        "emoji": "💡",
        "category": "computing",
        "event": "William Shockley notes the semiconductor amplifier idea that leads to the transistor.",
        "source": "https://todayinsci.com/12/12_29.htm",
    },
}


def has_keyword(text: str, keyword: str) -> bool:
    return re.search(rf"\b{re.escape(keyword)}\b", text) is not None


def month_day_iter() -> Iterable[date]:
    leap_year = 2024
    for month in range(1, 13):
        for day in range(1, calendar.monthrange(leap_year, month)[1] + 1):
            yield date(leap_year, month, day)


def source_url(day: date) -> str:
    return f"https://en.wikipedia.org/wiki/{calendar.month_name[day.month]}_{day.day}"


def cache_path(day: date) -> Path:
    return CACHE_DIR / f"{day.strftime('%m-%d')}.json"


def fetch_day_payload(day: date) -> dict[str, object]:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cached_file = cache_path(day)
    if cached_file.exists():
        return json.loads(cached_file.read_text())

    request = Request(
        SOURCE_API.format(month=day.month, day=day.day),
        headers={"User-Agent": USER_AGENT},
    )

    payload = None
    for attempt in range(6):
        try:
            with urlopen(request, timeout=30) as response:
                payload = json.load(response)
            break
        except HTTPError as error:
            if error.code not in {429, 500, 502, 503, 504} or attempt == 5:
                raise
            time.sleep(2 ** attempt)

    if payload is None:
        raise RuntimeError(f"Source payload missing for {day}")

    cached_file.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    time.sleep(0.05)
    return payload


def clean_event_text(text: str | None) -> str:
    if not text:
        return ""
    cleaned = html.unescape(text)
    cleaned = re.sub(r"\[\d+\]", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def score_event(description: str) -> tuple[int, Category | None, list[str]]:
    low = description.lower()

    if any(has_keyword(low, term) for term in DISASTER_TERMS):
        return 0, None, []

    category_scores: dict[str, int] = {}

    for category in CATEGORIES:
        category_score = 0
        for keyword in category.keywords:
            if has_keyword(low, keyword):
                category_score += 6 if len(keyword) > 4 else 4
        if category_score:
            category_scores[category.key] = category_score

    if not category_scores:
        return 0, None, []

    score = sum(category_scores.values())

    if any(has_keyword(low, term) for term in POSITIVE_TERMS):
        score += 5
    if has_keyword(low, "first"):
        score += 3
    if any(has_keyword(low, term) for term in ("patent", "patents", "patented")):
        score += 4
    if any(has_keyword(low, term) for term in ("ibm", "bell labs", "at&t", "nasa")):
        score += 4
    if any(has_keyword(low, term) for term in NEGATIVE_TERMS):
        score -= 6

    for phrase in ("first flight", "world wide web", "light bulb", "lightbulb", "rocket", "spacecraft"):
        if has_keyword(low, phrase):
            score += 8

    best_key = max(category_scores, key=category_scores.get)
    best_category = next(category for category in CATEGORIES if category.key == best_key)
    return score, best_category, list(category_scores)


def build_record(day: date, payload: dict[str, object]) -> tuple[dict[str, object], dict[str, object]]:
    key = day.strftime("%m-%d")
    if key in CURATED_OVERRIDES:
        override = CURATED_OVERRIDES[key]
        return (
            {
                "dateKey": key,
                "month": day.month,
                "day": day.day,
                "year": override["year"],
                "emoji": override["emoji"],
                "category": override["category"],
                "event": override["event"],
                "source": override.get("source", source_url(day)),
            },
            {"score": 999, "matched": [override["category"]], "override": True},
        )

    events = payload.get("data", {}).get("Events", [])
    candidates: list[dict[str, object]] = []
    for item in events:
        raw_text = item.get("text", "")
        year_text = item.get("year", "")
        description = clean_event_text(raw_text)
        if not year_text or not description:
            continue
        year_match = re.search(r"-?\d{1,4}", str(year_text))
        if not year_match:
            continue
        year = int(year_match.group(0))
        if "BC" in str(year_text).upper():
            year = -abs(year)
        score, category, matched = score_event(description)
        if not category or score <= 0:
            continue
        candidates.append(
            {
                "year": year,
                "description": description,
                "score": score,
                "category": category,
                "matched": matched,
            }
        )

    if not candidates:
        raise RuntimeError(f"No invention-style candidate found for {key}")

    candidates.sort(
        key=lambda item: (
            item["score"],
            1 if item["year"] and item["year"] > 0 else 0,
            -(abs(item["year"]) if item["year"] is not None else 99999),
            -len(str(item["description"])),
        ),
        reverse=True,
    )
    winner = candidates[0]
    category = winner["category"]

    record = {
        "dateKey": key,
        "month": day.month,
        "day": day.day,
        "year": winner["year"],
        "emoji": category.emoji,
        "category": category.key,
        "event": winner["description"],
        "source": payload.get("url", source_url(day)),
    }
    review_meta = {
        "score": winner["score"],
        "matched": winner["matched"],
        "override": False,
    }
    return record, review_meta


def write_review(records: list[dict[str, object]], review_meta: dict[str, dict[str, object]]) -> None:
    weakest = sorted(records, key=lambda item: review_meta[item["dateKey"]]["score"])[:24]
    lines = [
        "# Today Facts Review",
        "",
        "Generated from the Muffinlabs Today in History API, which documents that it parses Wikipedia day pages into JSON.",
        "",
        "Weakest heuristic picks first:",
        "",
    ]
    for item in weakest:
        meta = review_meta[item["dateKey"]]
        lines.append(
            f"- `{item['dateKey']}` · score `{meta['score']}` · {item['emoji']} {item['year']}: {item['event']}"
        )
    REVIEW_PATH.write_text("\n".join(lines) + "\n")


def main() -> None:
    records: list[dict[str, object]] = []
    review_meta: dict[str, dict[str, object]] = {}

    for day in month_day_iter():
        payload = fetch_day_payload(day)
        record, meta = build_record(day, payload)
        records.append(record)
        review_meta[record["dateKey"]] = meta

    OUTPUT_PATH.write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n")
    subprocess.run(["node", str(ENRICH_SCRIPT_PATH)], cwd=ROOT, check=True)
    write_review(records, review_meta)

    weakest = sorted(records, key=lambda item: review_meta[item["dateKey"]]["score"])[:12]
    print(f"Wrote {len(records)} records to {OUTPUT_PATH}")
    print(f"Wrote review notes to {REVIEW_PATH}")
    print("")
    print("Weakest picks to review:")
    for item in weakest:
        meta = review_meta[item["dateKey"]]
        print(f"{item['dateKey']} score={meta['score']:>3} {item['emoji']} {item['year']}: {item['event']}")


if __name__ == "__main__":
    main()
