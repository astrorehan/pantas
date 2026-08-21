"""
Estimasi berat batch dari luas terkalibrasi (F-101).

    berat_est = Σ area_mm² × faktor_densitas[komoditas]

Faktor densitas areal (gram per mm² luas terproyeksi) dibaca dari
`densitas_faktor.json`, yang dikalibrasi ulang dari serah terima nyata oleh
`calibrate_density.py`. Nilai bawaannya turunan geometri, bukan hasil
penimbangan, dan berkas itu menyatakannya apa adanya.

Aturan penting: hasilnya selalu estimasi, tidak pernah fakta. Karena itu
`estimasi_berat()` selalu mengembalikan rentang keyakinan, dan mengembalikan
`tersedia: False` — bukan angka tebakan — ketika kalibrasi koin gagal, ketika
komoditasnya belum punya faktor, atau ketika tak satu pun objek punya ukuran.
"""

import json
from pathlib import Path

FAKTOR_PATH = Path(__file__).parent / "densitas_faktor.json"

# Dipakai bila sebuah entri faktor lupa mencantumkan ketidakpastiannya. Lebar
# 25% masih lebih jujur daripada menyajikan satu angka tanpa rentang.
KETIDAKPASTIAN_BAWAAN = 0.25

_cache = None


def muat_faktor(path: Path = FAKTOR_PATH) -> dict:
    """Baca tabel faktor sekali lalu tahan di memori (proses API berumur panjang)."""
    global _cache
    if _cache is None:
        try:
            with open(path, "r", encoding="utf-8") as f:
                _cache = json.load(f).get("faktor", {})
        except (OSError, json.JSONDecodeError):
            _cache = {}
    return _cache


def reset_cache() -> None:
    """Buang cache — dipakai tes dan `calibrate_density.py` sesudah menulis ulang."""
    global _cache
    _cache = None


def estimasi_berat(objek: list, commodity_specific: str, terkalibrasi: bool) -> dict:
    """
    Args:
        objek: daftar hasil grading per objek; yang dibaca hanya `ukuran_mm2`.
        commodity_specific: mis. "tomato_ceri" — faktornya dicari per kata dasar.
        terkalibrasi: `kalibrasi.valid` dari model. False berarti `ukuran_mm2`
            tidak punya arti milimeter sama sekali.

    Returns:
        dict dengan `tersedia: bool`. Saat True ia memuat `gram`, `kg`,
        `min_kg`, `max_kg`, faktor yang dipakai, dan cakupan objeknya.
    """
    dasar = commodity_specific.split("_")[0]
    faktor_semua = muat_faktor()
    entri = faktor_semua.get(dasar)

    if not terkalibrasi:
        return {
            "tersedia": False,
            "alasan": (
                "Kalibrasi koin gagal, sehingga luas objek tidak terukur dalam "
                "milimeter. Ulangi foto dengan koin Rp500 di dalam bingkai."
            ),
        }

    if entri is None:
        return {
            "tersedia": False,
            "alasan": f"Belum ada faktor densitas terkalibrasi untuk komoditas '{dasar}'.",
        }

    luas = [
        float(o["ukuran_mm2"])
        for o in objek
        if o.get("ukuran_mm2") is not None and float(o["ukuran_mm2"]) > 0
    ]
    if not luas:
        return {
            "tersedia": False,
            "alasan": "Tidak ada objek dengan ukuran terukur pada foto ini.",
        }

    gram_per_mm2 = float(entri["gram_per_mm2"])
    rel = float(entri.get("rel_ketidakpastian", KETIDAKPASTIAN_BAWAAN))
    total_mm2 = sum(luas)
    gram = total_mm2 * gram_per_mm2

    return {
        "tersedia": True,
        "gram": round(gram, 1),
        "kg": round(gram / 1000.0, 3),
        # Rentang keyakinan, bukan hiasan: inilah satu-satunya bentuk angka ini
        # boleh dibaca. Batas bawah tidak pernah negatif.
        "min_kg": round(max(0.0, gram * (1 - rel)) / 1000.0, 3),
        "max_kg": round(gram * (1 + rel) / 1000.0, 3),
        "luas_total_mm2": round(total_mm2, 1),
        "faktor_gram_per_mm2": gram_per_mm2,
        "rel_ketidakpastian": rel,
        "n_sampel_kalibrasi": int(entri.get("n_sampel", 0)),
        "sumber_faktor": entri.get("sumber", "tidak dicantumkan"),
        # Objek yang lolos filter luas versus seluruh objek terdeteksi: bila
        # sebagian tidak terukur, estimasinya hanya mencakup sebagian batch.
        "objek_terukur": len(luas),
        "objek_total": len(objek),
    }
