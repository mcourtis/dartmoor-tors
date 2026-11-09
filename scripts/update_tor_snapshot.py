#!/usr/bin/env python3
"""Refresh the checked-in tor snapshot from the public Google Sheet CSV."""

from __future__ import annotations

import csv
import io
import json
import re
from pathlib import Path
from urllib.request import Request, urlopen

SHEET_CSV_URL = (
    "https://docs.google.com/spreadsheets/d/"
    "17kcZV7F5cieMI8o62_9SKc9OWEFGX3M5viaItzJF7o0/export"
    "?format=csv&gid=425023295"
)
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "tors.js"
REQUIRED_HEADERS = {
    "Name",
    "Grid Reference",
    "Grid X",
    "Grid Y",
    "Height [m]",
    "Run or Hike?",
    "Book",
    "Map",
}
GRID_REF_PATTERN = re.compile(r"^SX(?:\d{2}){2,5}$", re.IGNORECASE)


def clean(value: str | None) -> str:
    return (value or "").strip()


def optional_integer(value: str, label: str) -> int | None:
    value = clean(value)
    if not value:
        return None
    try:
        number = int(value)
    except ValueError as exc:
        raise ValueError(f"{label} must be a whole number, got {value!r}.") from exc
    return number


def parse_rows(csv_text: str) -> list[list[object]]:
    reader = csv.DictReader(io.StringIO(csv_text.lstrip("\ufeff")))
    headers = {clean(header) for header in (reader.fieldnames or [])}
    missing = REQUIRED_HEADERS - headers
    if missing:
        raise ValueError(f"Spreadsheet is missing columns: {', '.join(sorted(missing))}.")

    rows: list[list[object]] = []
    names: set[str] = set()
    for sheet_row, record in enumerate(reader, start=2):
        name = clean(record.get("Name"))
        if not name or name.upper() == "COUNT":
            continue  # Ignore blank/footer and summary rows.

        ref = re.sub(r"\s+", "", clean(record.get("Grid Reference"))).upper()
        if ref and not GRID_REF_PATTERN.fullmatch(ref):
            raise ValueError(f"Spreadsheet row {sheet_row} has invalid grid reference {ref!r}.")
        gx = optional_integer(record.get("Grid X", ""), f"row {sheet_row} Grid X")
        gy = optional_integer(record.get("Grid Y", ""), f"row {sheet_row} Grid Y")
        if not ref and (gx is None or gy is None or not 0 <= gx <= 99 or not 0 <= gy <= 99):
            raise ValueError(f"Spreadsheet row {sheet_row} needs a grid reference or valid fallback coordinates.")

        height_text = clean(record.get("Height [m]"))
        try:
            height_number = float(height_text)
        except ValueError as exc:
            raise ValueError(f"Spreadsheet row {sheet_row} has invalid height {height_text!r}.") from exc
        if not 0 <= height_number <= 2000:
            raise ValueError(f"Spreadsheet row {sheet_row} has an out-of-range height.")
        height: int | float = int(height_number) if height_number.is_integer() else height_number

        mode_text = clean(record.get("Run or Hike?")).upper()
        modes = {"": "", "R": "R", "RUN": "R", "H": "H", "HIKE": "H"}
        if mode_text not in modes:
            raise ValueError(f"Spreadsheet row {sheet_row} has unsupported mode {mode_text!r}.")
        mode = modes[mode_text]

        book = clean(record.get("Book")).upper()
        map_flag = clean(record.get("Map")).upper()
        if book not in {"", "Y"} or map_flag not in {"", "Y"}:
            raise ValueError(f"Spreadsheet row {sheet_row} has an unsupported Book or Map value.")

        name_key = name.casefold()
        if name_key in names:
            raise ValueError(f"Duplicate tor name {name!r} on spreadsheet row {sheet_row}.")
        names.add(name_key)
        rows.append([name, ref or None, height, mode, book, map_flag, gx, gy])

    if len(rows) < 150:
        raise ValueError(f"Only {len(rows)} tor records were found; refusing to replace the snapshot.")
    return rows


def main() -> None:
    request = Request(SHEET_CSV_URL, headers={"User-Agent": "dartmoor-tors-snapshot-refresh/1.0"})
    with urlopen(request, timeout=30) as response:
        csv_text = response.read().decode("utf-8-sig")
    rows = parse_rows(csv_text)

    serialized_rows = ",\n".join(
        f"  {json.dumps(row, ensure_ascii=False)}" for row in rows
    )
    generated = (
        "// Generated from the Google Sheet My List tab by scripts/update_tor_snapshot.py.\n"
        "// Columns: [name, gridRef (SX…) or null, height (m), mode ('R'|'H'|''), book ('Y'|''), map ('Y'|''), gridX, gridY]\n"
        "// gridX/gridY are fallback coordinates (km within SX square) for rows without a grid reference.\n"
        f"export const RAW_TORS = [\n{serialized_rows}\n];\n"
    )
    OUTPUT.write_text(generated, encoding="utf-8")
    print(f"Updated {OUTPUT.relative_to(ROOT)} with {len(rows)} tor records.")


if __name__ == "__main__":
    main()
