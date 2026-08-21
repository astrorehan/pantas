"""Buktikan tiap foto contoh mode demo benar-benar bisa dinilai engine.

Foto contoh tidak berguna kalau YOLO segmentasi tidak menemukan apa pun di
dalamnya — itulah persis keadaan foto stok sebelumnya. Skrip ini menjalankan
PantasModel yang sama dengan yang dipakai `/predict`, lalu gagal dengan status
bukan nol bila ada foto contoh yang menghasilkan nol objek.

    ai_engine/.venv/Scripts/python.exe ai_engine/probe_demo_samples.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import cv2

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from model import PantasModel  # noqa: E402

WEB_PUBLIC_IMG = ROOT.parent / "web" / "public" / "img"

# Semua pasangan foto contoh dan komoditas spesifiknya:
# 1. Foto untuk mode demo layar pindai (/petani/pindai)
# 2. Foto untuk mode demo landing page (CONTOH_BATCH)
PASANGAN = [
    ("contoh/chili.jpg", "chili_hijau_besar"),
    ("contoh/tomato.jpg", "tomato_merah"),
    ("demo-tomat-sayur-v2.jpg", "tomato_sayur"),
    ("demo-cabai-rawit-v3.jpg", "chili_rawit"),
    ("demo-timun-lokal-v4.jpg", "cucumber_lokal"),
    ("demo-wortel-v6.jpg", "carrot"),
]


def main() -> int:
    model = PantasModel()
    gagal = 0

    for nama, komoditas in PASANGAN:
        berkas = WEB_PUBLIC_IMG / nama
        gambar = cv2.imread(str(berkas))
        if gambar is None:
            print(f"GAGAL  {nama}: tidak terbaca")
            gagal += 1
            continue

        hasil, _ = model.predict(gambar, komoditas)
        if hasil.get("status") != "success":
            print(f"GAGAL  {nama}: {hasil.get('message')}")
            gagal += 1
            continue

        objek = hasil["objek_terdeteksi"]
        komposisi = hasil["ringkasan_batch"]["komposisi"]
        tanda = "OK   " if objek > 0 else "GAGAL"
        if objek == 0:
            gagal += 1
        print(f"{tanda}  {nama:<24} {komoditas:<20} {objek:>3} objek  {komposisi}")

    return 1 if gagal else 0


if __name__ == "__main__":
    raise SystemExit(main())
