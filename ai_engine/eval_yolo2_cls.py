"""Evaluasi nyata model YOLO 2 (klasifikasi kesehatan) atas split validasi.

Menghasilkan `outputs/metrik_yolo2.json` — sumber tunggal angka metrik yang
ditampilkan di halaman /tentang/model. Tidak ada angka yang boleh muncul di UI
tanpa lewat berkas ini.

Pakai:
    python eval_yolo2_cls.py            # semua komoditas
    python eval_yolo2_cls.py tomato     # satu komoditas
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from ultralytics import YOLO

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "datasets" / "yolo2_ready"
MODEL_DIR = SCRIPT_DIR / "export_models"
OUT_PATH = SCRIPT_DIR / "outputs" / "metrik_yolo2.json"

KOMODITAS = ["chili", "tomato", "carrot", "cucumber"]
IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def daftar_gambar(folder: Path) -> list[Path]:
    return sorted(p for p in folder.iterdir() if p.suffix.lower() in IMG_EXT)


def evaluasi(komoditas: str) -> dict | None:
    bobot = MODEL_DIR / f"{komoditas}_cls.pt"
    val_dir = DATA_DIR / komoditas / "val"
    if not bobot.exists():
        print(f"[LEWAT] {komoditas}: {bobot.name} tidak ada.")
        return None
    if not val_dir.is_dir():
        print(f"[LEWAT] {komoditas}: split val tidak ada.")
        return None

    model = YOLO(str(bobot))
    # `model.names` -> {index: nama_kelas}; dibalik agar label folder bisa dicari.
    nama_ke_idx = {nama: idx for idx, nama in model.names.items()}

    kelas_dir = sorted(d for d in val_dir.iterdir() if d.is_dir())
    kelas = [d.name for d in kelas_dir]
    tak_dikenal = [k for k in kelas if k not in nama_ke_idx]
    if tak_dikenal:
        print(f"[GAGAL] {komoditas}: kelas {tak_dikenal} tidak ada di model {model.names}.")
        return None

    # matriks[asli][prediksi]
    matriks = {a: {p: 0 for p in kelas} for a in kelas}
    for folder in kelas_dir:
        gambar = daftar_gambar(folder)
        if not gambar:
            continue
        for awal in range(0, len(gambar), 32):
            potongan = [str(p) for p in gambar[awal : awal + 32]]
            for hasil in model.predict(potongan, imgsz=224, verbose=False):
                prediksi = model.names[int(hasil.probs.top1)]
                matriks[folder.name][prediksi] += 1

    total = sum(sum(baris.values()) for baris in matriks.values())
    if total == 0:
        print(f"[LEWAT] {komoditas}: tidak ada gambar validasi.")
        return None

    benar = sum(matriks[k][k] for k in kelas)
    per_kelas: dict[str, dict[str, float | int]] = {}
    for k in kelas:
        tp = matriks[k][k]
        fn = sum(matriks[k][p] for p in kelas if p != k)
        fp = sum(matriks[a][k] for a in kelas if a != k)
        presisi = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * presisi * recall / (presisi + recall) if presisi + recall else 0.0
        per_kelas[k] = {
            "dukungan": tp + fn,
            "presisi": round(presisi, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
        }

    makro = {
        kunci: round(sum(v[kunci] for v in per_kelas.values()) / len(per_kelas), 4)
        for kunci in ("presisi", "recall", "f1")
    }

    print(
        f"[OK] {komoditas}: akurasi {benar / total:.4f} "
        f"F1-makro {makro['f1']:.4f} atas {total} gambar val."
    )
    return {
        "model": bobot.name,
        "arsitektur": "yolo11n-cls",
        "jumlah_val": total,
        "akurasi": round(benar / total, 4),
        "makro": makro,
        "per_kelas": per_kelas,
        "matriks_kebingungan": matriks,
    }


def main() -> int:
    target = [sys.argv[1].lower()] if len(sys.argv) > 1 else KOMODITAS
    hasil = {}
    for k in target:
        nilai = evaluasi(k)
        if nilai:
            hasil[k] = nilai

    if not hasil:
        print("Tidak ada komoditas yang berhasil dievaluasi.")
        return 1

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    # Gabung dengan hasil lama agar evaluasi satu komoditas tidak menghapus sisanya.
    lama = {}
    if OUT_PATH.exists():
        lama = json.loads(OUT_PATH.read_text(encoding="utf-8")).get("komoditas", {})
    lama.update(hasil)

    OUT_PATH.write_text(
        json.dumps(
            {
                "dievaluasi_pada": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "catatan": "Dihasilkan oleh eval_yolo2_cls.py atas split val di datasets/yolo2_ready.",
                "komoditas": lama,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"\nDitulis ke {OUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
