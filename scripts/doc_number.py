#!/usr/bin/env python3
"""Allocate and record document numbers.

Format: NNN/<PREFIX>-OC/YYYY    e.g.  001/SPH-OC/2026

Subcommands:
    next <type>                                          → print next number (read-only)
    record <type> <number> <client> <subject> <pdf>      → append to data/doc-numbers.json

<type> is one of: sph, proposal, mou
"""
from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "doc-numbers.json"

PREFIX = {
    "sph":      "SPH-OC",
    "proposal": "PROP-OC",
    "mou":      "MOU-OC",
}


def load() -> dict:
    return json.loads(DATA.read_text())


def save(d: dict) -> None:
    DATA.write_text(json.dumps(d, indent=2) + "\n")


def _check_type(doc_type: str) -> None:
    if doc_type not in PREFIX:
        raise SystemExit(f"Unknown type: {doc_type!r}. Use one of: {', '.join(PREFIX)}")


def next_number(doc_type: str, year: int | None = None) -> str:
    _check_type(doc_type)
    year = year or date.today().year
    data = load()
    suffix = f"/{PREFIX[doc_type]}/{year}"
    seq = 0
    for entry in data.get(doc_type, []):
        n = entry.get("number", "")
        if n.endswith(suffix):
            try:
                seq = max(seq, int(n.split("/")[0]))
            except ValueError:
                pass
    return f"{seq + 1:03d}/{PREFIX[doc_type]}/{year}"


def record(doc_type: str, number: str, client: str, subject: str, pdf_path: str) -> None:
    _check_type(doc_type)
    data = load()
    arr = data.setdefault(doc_type, [])
    if any(e.get("number") == number for e in arr):
        raise SystemExit(f"Duplicate number: {number}")
    arr.append({
        "number":  number,
        "date":    date.today().isoformat(),
        "client":  client,
        "subject": subject,
        "pdf":     pdf_path,
    })
    save(data)
    print(f"recorded {number}")


def flat_filename(number: str) -> str:
    """Convert '001/SPH-OC/2026' to '001_SPH-OC_2026'."""
    return number.replace("/", "_")


def main() -> None:
    if len(sys.argv) < 3:
        print(__doc__, file=sys.stderr)
        sys.exit(2)

    cmd = sys.argv[1]
    if cmd == "next":
        print(next_number(sys.argv[2]))
    elif cmd == "record":
        if len(sys.argv) != 7:
            print(__doc__, file=sys.stderr)
            sys.exit(2)
        record(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6])
    elif cmd == "flat":
        print(flat_filename(sys.argv[2]))
    else:
        print(__doc__, file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
