"""Copia logo SV para pasta icons/ do PWA."""
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT.parent / "assets"
SRC = next(ASSETS.glob("logo_sv*.png"), None)
if not SRC:
    SRC = ASSETS / (
        "c__Users_hmauricio_AppData_Roaming_Cursor_User_workspaceStorage_"
        "empty-window_images_logo_sv-5a3514f5-2bb0-455f-a293-ac3be2e990dc.png"
    )

OUT = ROOT / "icons"
OUT.mkdir(exist_ok=True)
if not SRC.exists():
    raise SystemExit(f"Logo nao encontrado: {SRC}")

for name in ("logo-sv.png", "icon-192.png", "icon-512.png"):
    shutil.copy2(SRC, OUT / name)
print("OK:", list(OUT.glob("*.png")))
