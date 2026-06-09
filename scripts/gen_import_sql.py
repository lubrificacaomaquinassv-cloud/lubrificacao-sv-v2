import json
import uuid
import pandas as pd

p = r"c:\Users\hmauricio\Downloads\óleo preventiva (1).xlsx"
df = pd.read_excel(p, header=None)
DATA = "2026-06-02"
records = []

for i in range(2, len(df)):
    modelo = df.iloc[i, 1]
    frota = df.iloc[i, 2]
    trocado = df.iloc[i, 3]
    prox = df.iloc[i, 5]
    atual = df.iloc[i, 7]
    nota = df.iloc[i, 8]
    if pd.isna(frota) or pd.isna(atual):
        continue
    frota = str(frota).strip()
    if frota.endswith(".0"):
        frota = str(int(float(frota)))
    modelo = str(modelo).strip() if pd.notna(modelo) else ""
    trocado = float(trocado) if pd.notna(trocado) else None
    prox = float(prox) if pd.notna(prox) else None
    atual = float(atual)
    intervalo = int(prox - trocado) if prox and trocado else 300
    obs_parts = [modelo, f"trocado {int(trocado)}h" if trocado else ""]
    if pd.notna(nota):
        obs_parts.append(str(nota).strip())
    obs = " | ".join(x for x in obs_parts if x)
    records.append(
        {
            "frota": frota,
            "modelo": modelo,
            "trocado": int(trocado) if trocado else None,
            "prox": int(prox) if prox else None,
            "atual": int(atual),
            "intervalo": intervalo,
            "obs": obs,
            "client_id": str(uuid.uuid4()),
        }
    )

print(json.dumps(records, ensure_ascii=False))
