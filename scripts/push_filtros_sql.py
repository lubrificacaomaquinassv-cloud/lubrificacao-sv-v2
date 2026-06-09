import json
from pathlib import Path

items = json.loads(Path(__file__).with_name("filtros_import.json").read_text(encoding="utf-8"))
DATA = "2026-06-08"


def esc(s):
    return s.replace("'", "''")


chunks = []
for i in range(0, len(items), 40):
    batch = items[i : i + 40]
    vals = ",\n".join(
        f"('{esc(x['id_insumo'])}', '{esc(x['nome'])}', 'UN', 'FILTRO')" for x in batch
    )
    chunks.append(
        "INSERT INTO dim_insumo (id_insumo, nome, unidade, categoria) VALUES\n"
        + vals
        + "\nON CONFLICT (id_insumo) DO UPDATE SET nome=EXCLUDED.nome, unidade=EXCLUDED.unidade, categoria=EXCLUDED.categoria;"
    )

for i in range(0, len(items), 40):
    batch = items[i : i + 40]
    vals = ",\n".join(
        f"('PRE-{esc(x['id_insumo'])}', '{esc(x['id_insumo'])}', {x['custo']}, '{DATA}'::date, true)"
        for x in batch
    )
    chunks.append(
        "INSERT INTO preco_insumo (id, id_insumo, valor_unitario, data_vigencia, ativo) VALUES\n"
        + vals
        + "\nON CONFLICT (id) DO UPDATE SET valor_unitario=EXCLUDED.valor_unitario, data_vigencia=EXCLUDED.data_vigencia, ativo=true;"
    )

out = Path(__file__).with_name("filtros_sql_chunks.json")
out.write_text(json.dumps(chunks), encoding="utf-8")
print(len(chunks), "chunks", len(items), "items")
