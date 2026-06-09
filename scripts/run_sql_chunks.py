"""Execute filtros SQL chunks via Supabase MCP-style (reads chunks from JSON)."""
import json
import subprocess
import sys
from pathlib import Path

CHUNKS = Path(__file__).with_name("filtros_sql_chunks.json")
PROJECT = "azhpxhrwhegfysoeqmft"


def main():
    start = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    end = int(sys.argv[2]) if len(sys.argv) > 2 else 999
    chunks = json.loads(CHUNKS.read_text(encoding="utf-8"))
    for i, sql in enumerate(chunks[start:end]):
        idx = start + i
        out = Path(__file__).with_name(f"chunk_{idx:02d}.sql")
        out.write_text(sql, encoding="utf-8")
        print(f"wrote {out.name} ({len(sql)} chars)")


if __name__ == "__main__":
    main()
