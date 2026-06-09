import json
from pathlib import Path

records = json.loads(Path(__file__).with_name("records.json").read_text(encoding="utf-8-sig"))
DATA = "2026-06-02"

def esc(s):
    return s.replace("'", "''")

parts = ["-- Import Excel oleo preventiva (1) 02/06/2026\n"]

equip_vals = []
ultima_vals = []
lub_vals = []

for r in records:
    f, m, iv = r["frota"], esc(r["modelo"]), r["intervalo"]
    equip_vals.append(f"('{f}', '{m}', {iv}, true)")
    if r["trocado"]:
        ultima_vals.append(f"('{f}', {r['trocado']}, '{DATA}'::date)")
    obs = esc(r["obs"] + f" | Base {DATA}")
    lub_vals.append(
        f"('{r['client_id']}', 'LUB3-IMP-{f}', '{f}', 'IMPORTACAO EXCEL', 'preventiva', "
        f"{r['atual']}, {r['prox']}, '{DATA}T12:00:00+00'::timestamptz, 'CAMPO', "
        f"'{obs}', '[]'::jsonb, 0)"
    )

parts.append(
    "INSERT INTO dim_equipamento_lubri (frota, modelo, intervalo_horas, ativo) VALUES\n"
    + ",\n".join(equip_vals)
    + "\nON CONFLICT (frota) DO UPDATE SET modelo = EXCLUDED.modelo, intervalo_horas = EXCLUDED.intervalo_horas, ativo = true;\n"
)

parts.append(
    "INSERT INTO ultima_troca_lubri (frota, horimetro_ultima_troca, data_ultima_troca) VALUES\n"
    + ",\n".join(ultima_vals)
    + "\nON CONFLICT (frota) DO UPDATE SET horimetro_ultima_troca = EXCLUDED.horimetro_ultima_troca, data_ultima_troca = EXCLUDED.data_ultima_troca;\n"
)

parts.append(
    "INSERT INTO lubrificacao_v3 (client_id, order_number, vehicle, operator, tipo_servico, hourmeter_atual, hourmeter_prox, data_servico, localizacao, observation, itens, custo_total) VALUES\n"
    + ",\n".join(lub_vals)
    + "\nON CONFLICT (client_id) DO NOTHING;\n"
)

sql = "\n".join(parts)
Path(__file__).with_name("import_preventiva.sql").write_text(sql, encoding="utf-8")
print(f"SQL OK: {len(records)} frotas")
