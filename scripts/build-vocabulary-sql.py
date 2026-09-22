"""Build an idempotent PostgreSQL vocabulary import from two open datasets.

Usage (run from the project root):
  python scripts/build-vocabulary-sql.py <openjam-dir> <dictionary-sqlite> <output-sql>
"""

from __future__ import annotations

import json
import hashlib
import re
import sqlite3
import sys
from collections import defaultdict
from pathlib import Path


TARGET_SIZE = 5000
WORD_PATTERN = re.compile(r"^[a-z]+(?:[-'][a-z]+)*$")


def clean(value: object) -> str:
    return " ".join(str(value or "").replace("\x00", "").split()).strip()


def sql_literal(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def dictionary_rows(database_path: Path, words: list[str]) -> dict[str, tuple[str, str, str, str]]:
    connection = sqlite3.connect(database_path)
    found: dict[str, tuple[str, str, str, str]] = {}
    try:
        for start in range(0, len(words), 800):
            batch = words[start : start + 800]
            placeholders = ",".join("?" for _ in batch)
            query = f"""
                SELECT lower(w.word), d.definition, coalesce(d.pos, ''),
                       coalesce(wd.example, ''), coalesce(p.ipa, '')
                FROM words w
                JOIN word_definitions wd ON wd.word_id = w.id
                JOIN definitions d ON d.id = wd.definition_id
                LEFT JOIN pronunciations p ON p.word_id = w.id
                WHERE lower(w.word) IN ({placeholders})
                ORDER BY w.id, wd.id, p.id
            """
            for word, meaning, part_of_speech, example, ipa in connection.execute(query, batch):
                key = clean(word).lower()
                if key not in found and clean(meaning):
                    found[key] = (clean(meaning), clean(part_of_speech), clean(example), clean(ipa))
    finally:
        connection.close()
    return found


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit("Usage: build-vocabulary-sql.py <openjam-dir> <dictionary-sqlite> <output-sql>")

    openjam = Path(sys.argv[1])
    dictionary = Path(sys.argv[2])
    output = Path(sys.argv[3])
    words_data = json.loads((openjam / "data" / "json" / "words_en.json").read_text(encoding="utf-8"))
    phonetics_data = json.loads((openjam / "data" / "json" / "phonetics.json").read_text(encoding="utf-8"))
    categories_data = json.loads((openjam / "data" / "json" / "categories.json").read_text(encoding="utf-8"))
    word_categories_data = json.loads((openjam / "data" / "json" / "word_categories.json").read_text(encoding="utf-8"))

    category_names = {item["id"]: clean(item["name_en"]) for item in categories_data}
    category_by_word: dict[str, str] = {}
    for item in word_categories_data:
        category_by_word.setdefault(item["word_id"], category_names.get(item["category_id"], ""))
    ipa_by_word: dict[str, str] = {}
    for item in phonetics_data:
        if item.get("variant") in ("us", "uk"):
            ipa_by_word.setdefault(item["word_id"], clean(item.get("ipa")))

    ordered = sorted(words_data, key=lambda item: int(item.get("frequency_rank") or 999999))
    candidates = [
        item
        for item in ordered
        if WORD_PATTERN.fullmatch(clean(item.get("english")).lower())
        and clean(item.get("level")) in {"A1", "A2", "B1", "B2", "C1", "C2"}
        and item.get("senses")
    ]
    translation_map = dictionary_rows(dictionary, [clean(item["english"]).lower() for item in candidates])

    records: list[dict[str, str]] = []
    used: set[str] = set()
    for item in candidates:
        word = clean(item["english"]).lower()
        if word in used or word not in translation_map:
            continue
        meaning, dictionary_pos, dictionary_example, dictionary_ipa = translation_map[word]
        sense = item["senses"][0]
        definition = clean(sense.get("definition_en"))
        example = clean(sense.get("example_en")) or dictionary_example or f"Learn how to use {word} in a complete sentence."
        if not definition:
            continue
        used.add(word)
        records.append({
            "id": "vocab-import-" + hashlib.sha1(word.encode("utf-8")).hexdigest()[:24],
            "word": word,
            "ipa": ipa_by_word.get(item["id"]) or dictionary_ipa,
            "meaning": meaning,
            "definition": definition,
            "partOfSpeech": clean(sense.get("part_of_speech")) or dictionary_pos or "word",
            "example": example,
            "translation": f"Nghĩa trong ngữ cảnh: {meaning}",
            "category": category_by_word.get(item["id"]) or "High-frequency English",
            "level": clean(item["level"]),
        })
        if len(records) == TARGET_SIZE:
            break

    if len(records) < TARGET_SIZE:
        raise RuntimeError(f"Only found {len(records)} importable entries; expected {TARGET_SIZE}.")

    output.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "-- EnglishMaster vocabulary import: 5,000 high-frequency English entries.",
        "-- Generated by scripts/build-vocabulary-sql.py on 2026-09-22.",
        "-- Sources: Openjam (MIT, https://github.com/amirj4m/openjam) for CEFR/English definitions;",
        "-- English-Vietnamese Dictionary by Skypedia (CC BY-SA 4.0, https://github.com/skypediacode/english-vietnamese-dictionary)",
        "-- for Vietnamese meanings, IPA and example fallback. Keep this attribution with derived data.",
        "-- Safe to re-run: existing words are preserved by ON CONFLICT DO NOTHING.",
        "BEGIN;",
        "",
    ]
    columns = '("id", "word", "ipa", "meaning", "definition", "partOfSpeech", "example", "translation", "category", "level", "synonyms", "antonyms", "collocations", "wordFamily", "audioUrl")'
    for start in range(0, len(records), 250):
        lines.append(f"INSERT INTO \"Vocabulary\" {columns} VALUES")
        rows = []
        for record in records[start : start + 250]:
            values = [
                sql_literal(record["id"]), sql_literal(record["word"]), sql_literal(record["ipa"]), sql_literal(record["meaning"]),
                sql_literal(record["definition"]), sql_literal(record["partOfSpeech"]), sql_literal(record["example"]),
                sql_literal(record["translation"]), sql_literal(record["category"]), sql_literal(record["level"]),
                "ARRAY[]::text[]", "ARRAY[]::text[]", "ARRAY[]::text[]", "ARRAY[]::text[]", "NULL",
            ]
            rows.append("  (" + ", ".join(values) + ")")
        lines.append(",\n".join(rows) + "\nON CONFLICT (\"word\") DO NOTHING;\n")
    lines.extend([
        "COMMIT;",
        "",
        "-- Verify after import:",
        "-- SELECT count(*) AS vocabulary_count FROM \"Vocabulary\";",
        "-- SELECT \"level\", count(*) FROM \"Vocabulary\" GROUP BY \"level\" ORDER BY \"level\";",
    ])
    output.write_text("\n".join(lines), encoding="utf-8", newline="\n")
    level_counts: dict[str, int] = defaultdict(int)
    for record in records:
        level_counts[record["level"]] += 1
    print(f"Wrote {len(records)} entries to {output}")
    print("Levels: " + ", ".join(f"{level}={level_counts[level]}" for level in sorted(level_counts)))


if __name__ == "__main__":
    main()
