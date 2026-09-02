"""
FastAPI pembungkus PantasModel (docs/BACKEND.md Fase 2).

Dua endpoint:

- POST /predict — satu foto batch + komoditas, mengembalikan persis
  `dict_results` dari model.py, plus `annotated_img` (JPEG data URL) untuk
  ditampilkan di layar hasil.
- POST /predict/batch — 2–5 foto sudut berbeda dari tumpukan yang sama (F-12),
  mengembalikan hasil per foto plus satu ringkasan agregat berhash sendiri.

Jalankan lokal:
    uvicorn api:app --host 0.0.0.0 --port 7860

Deploy: Hugging Face Spaces (Docker) — lihat Dockerfile di folder ini.
"""

import base64
import json
import os
import threading
import time
from collections import deque
from datetime import datetime, timezone

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from batch_aggregate import agregasi
from model import PantasModel

app = FastAPI(title="PANTAS Grading API", version="1.0.0")

# Origin browser dibatasi: endpoint inferensi memang tidak memakai kredensial,
# tetapi wildcard membuat situs mana pun dapat memakai CPU model sebagai proxy
# gratis. Deployment lain dapat menambah origin lewat PANTAS_ALLOWED_ORIGINS
# (daftar dipisahkan koma) tanpa mengubah image.
_origin_tambahan = [
    origin.strip()
    for origin in os.getenv("PANTAS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://pantas-ai.vercel.app",
    *_origin_tambahan,
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
    max_age=600,
)

# Muat sekali saat startup; PantasModel meng-cache model YOLO per komoditas.
model = PantasModel()

VALID_COMMODITIES = {
    "carrot",
    "chili_hijau_besar",
    "chili_merah_besar",
    "chili_merah_keriting",
    "chili_rawit",
    "cucumber_baby",
    "cucumber_lokal",
    "tomato_beef",
    "tomato_ceri",
    "tomato_merah",
    "tomato_sayur",
}
VALID_COMMODITY_BASES = {commodity.split("_")[0] for commodity in VALID_COMMODITIES}

# Batas atas /predict/batch. F-12 bicara tentang 3–5 sudut; di atas itu waktu
# inferensinya melewati anggaran latensi NFR-06 dan payload balasannya (satu
# foto beranotasi per sudut) jadi berat untuk jaringan ponsel di kebun.
MAX_FOTO_BATCH = 5
# Payload kamera jauh di bawah 10 MiB. Batas ini menghentikan berkas besar
# sebelum OpenCV mendekode dan mengalokasikan matriks gambarnya.
MAX_IMAGE_BYTES = 10 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

# ---------------------------------------------------------------- Telemetri
#
# Jendela bergulir dari inferensi terakhir, sumber angka p50/p95 dan tingkat
# keberhasilan yang dibaca panel operator di /admin (F-92). Disimpan di memori
# proses dengan sengaja: nilainya hanya berlaku untuk instance yang sedang
# melayani, dan menuliskannya ke basis data berarti setiap pindaian membayar
# satu round-trip demi angka yang basi tiga menit kemudian.
#
# 200 entri kira-kira satu jam demo pada laju tersibuk yang pernah terukur, dan
# muat di bawah 20 KB. `deque(maxlen=...)` membuang yang tertua sendiri, jadi
# tidak ada kode kebersihan yang bisa lupa dijalankan.
JEJAK_MAKS = 200
_jejak: deque = deque(maxlen=JEJAK_MAKS)
_kunci_jejak = threading.Lock()
MULAI_ISO = datetime.now(timezone.utc).isoformat()


def _catat(durasi_ms: float, sukses: bool) -> None:
    with _kunci_jejak:
        _jejak.append((durasi_ms, sukses))


def _persentil(nilai: list[float], p: float) -> float:
    return round(float(np.percentile(nilai, p)), 1)


def _galat(message: str) -> dict:
    return {"status": "error", "message": message}


def _cek_komoditas(commodity: str) -> dict | None:
    """None berarti lolos; selain itu payload galat yang siap dikembalikan."""
    if commodity not in VALID_COMMODITIES:
        return _galat(
            f"Komoditas '{commodity}' belum didukung. "
            f"Pilihan: {sorted(VALID_COMMODITIES)}."
        )
    return None


async def _baca_gambar(image: UploadFile) -> tuple[bytes | None, dict | None]:
    """Baca satu unggahan dengan batas tipe dan ukuran sebelum inferensi."""
    content_type = (image.content_type or "").lower()
    if content_type and content_type not in ALLOWED_IMAGE_TYPES:
        return None, _galat("Format gambar harus JPEG, PNG, atau WebP.")

    raw = await image.read(MAX_IMAGE_BYTES + 1)
    if not raw:
        return None, _galat("File gambar kosong.")
    if len(raw) > MAX_IMAGE_BYTES:
        return None, _galat("Ukuran tiap foto maksimal 10 MiB.")
    return raw, None


def _parse_roi(roi: str | None):
    """
    "[x, y, w, h]" -> tuple, atau (None, payload galat).

    Mengembalikan pasangan supaya pemanggil bisa membedakan "tidak ada ROI"
    (sah — foto galeri tanpa lingkaran panduan) dari "ROI tidak terbaca".
    """
    if not roi:
        return None, None
    try:
        parsed = json.loads(roi)
        if (
            not isinstance(parsed, list)
            or len(parsed) != 4
            or any(isinstance(v, bool) or not isinstance(v, (int, float)) for v in parsed)
            or any(not float(v).is_integer() for v in parsed)
        ):
            raise ValueError
        roi_tuple = tuple(int(v) for v in parsed)
        x, y, w, h = roi_tuple
        if x < 0 or y < 0 or w <= 0 or h <= 0:
            raise ValueError
        return roi_tuple, None
    except (ValueError, TypeError):
        return None, _galat("roi harus JSON [x, y, w, h].")


def _nilai(raw: bytes, commodity: str, roi_tuple) -> dict:
    """Dekode satu foto, jalankan engine, lampirkan foto beranotasi."""
    mulai = time.perf_counter()
    hasil = _nilai_tanpa_catat(raw, commodity, roi_tuple)
    _catat(
        (time.perf_counter() - mulai) * 1000,
        hasil.get("status") == "success",
    )
    return hasil


def _nilai_tanpa_catat(raw: bytes, commodity: str, roi_tuple) -> dict:
    img = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        return _galat("File yang diunggah bukan gambar valid.")

    try:
        results, annotated = model.predict(img, commodity, roi=roi_tuple)
    except FileNotFoundError as e:
        return _galat(str(e))

    # Engine menolak foto blur dengan status:"error" — teruskan apa adanya.
    if results.get("status") == "success":
        ok, buf = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 80])
        if ok:
            results["annotated_img"] = (
                "data:image/jpeg;base64," + base64.b64encode(buf).decode()
            )
    return results


@app.get("/health")
def health():
    """
    Telemetri operasional (F-92).

    Balasannya sengaja tidak pernah mengarang: bila belum ada satu pun inferensi
    sejak proses hidup, `latensi_ms` bernilai null — bukan angka contoh. Panel
    admin menampilkan "belum ada data" untuk keadaan itu, karena p95 palsu di
    layar operator lebih buruk daripada kolom kosong.
    """
    with _kunci_jejak:
        jejak = list(_jejak)

    durasi = [d for d, _ in jejak]
    sukses = sum(1 for _, ok in jejak if ok)

    return {
        "status": "ok",
        "versi": app.version,
        # Bobot yang benar-benar sudah dimuat ke memori, bukan yang ada di disk.
        # Inilah yang membedakan instance hangat dari instance yang baru bangun
        # dan masih akan membayar cold-start pada pindaian pertama.
        "model_hangat": sorted(model.yolo_models),
        "model_tersedia": sorted(VALID_COMMODITY_BASES),
        "latensi_ms": (
            {
                "p50": _persentil(durasi, 50),
                "p95": _persentil(durasi, 95),
                "maks": round(max(durasi), 1),
            }
            if durasi
            else None
        ),
        "inferensi": {
            "tercatat": len(jejak),
            "sukses": sukses,
            # Foto yang ditolak gerbang blur ikut terhitung di sini. Itu bukan
            # kegagalan layanan, tapi tetap ukuran yang dipakai operator: turun
            # drastis berarti petani sedang mengirim foto yang tidak terbaca.
            "rasio_sukses": round(sukses / len(jejak), 3) if jejak else None,
            "jendela": JEJAK_MAKS,
        },
        "sejak": MULAI_ISO,
    }


@app.post("/predict")
async def predict(
    image: UploadFile = File(...),
    commodity: str = Form(...),
    roi: str | None = Form(None),  # opsional: "[x, y, w, h]" (JSON)
):
    salah = _cek_komoditas(commodity)
    if salah:
        return salah

    roi_tuple, salah_roi = _parse_roi(roi)
    if salah_roi:
        return salah_roi

    raw, salah_gambar = await _baca_gambar(image)
    if salah_gambar:
        return salah_gambar
    return _nilai(raw, commodity, roi_tuple)


@app.post("/predict/batch")
async def predict_batch(
    images: list[UploadFile] = File(...),
    commodity: str = Form(...),
    # Satu ROI per foto, urut sama dengan `images`; `null` untuk foto tanpa
    # lingkaran panduan. Tiap foto membawa ROI koinnya sendiri (F-12) — koin
    # tidak berada di tempat yang sama pada lima sudut yang berbeda.
    rois: str | None = Form(None),
):
    salah = _cek_komoditas(commodity)
    if salah:
        return salah

    if not images:
        return _galat("Tidak ada foto yang dikirim.")
    if len(images) > MAX_FOTO_BATCH:
        return _galat(
            f"Maksimal {MAX_FOTO_BATCH} foto per pindaian batch, "
            f"dikirim {len(images)}."
        )

    daftar_roi: list = [None] * len(images)
    if rois:
        try:
            parsed = json.loads(rois)
            if not isinstance(parsed, list) or len(parsed) != len(images):
                return _galat("rois harus array JSON dengan panjang sama seperti images.")
        except (ValueError, TypeError):
            return _galat("rois harus array JSON berisi [x, y, w, h] atau null.")
        for i, item in enumerate(parsed):
            if item is None:
                continue
            roi_tuple, salah_roi = _parse_roi(json.dumps(item))
            if salah_roi:
                return _galat(f"rois[{i}] harus [x, y, w, h] atau null.")
            daftar_roi[i] = roi_tuple

    per_foto = []
    for i, berkas in enumerate(images):
        raw, salah_gambar = await _baca_gambar(berkas)
        hasil = salah_gambar or _nilai(raw, commodity, daftar_roi[i])
        per_foto.append({"indeks": i, "nama": berkas.filename, "hasil": hasil})

    # Agregat dihitung dari salinan tanpa foto beranotasi: hash gabungan harus
    # menutupi angka mutunya, bukan hasil kompresi JPEG yang bisa berbeda tiap
    # kali gambar yang sama dikodekan ulang.
    tanpa_gambar = [
        {
            "indeks": e["indeks"],
            "hasil": {k: v for k, v in e["hasil"].items() if k != "annotated_img"},
        }
        for e in per_foto
    ]

    return {
        "status": "success" if any(
            e["hasil"].get("status") == "success" for e in per_foto
        ) else "error",
        "komoditas": commodity,
        "foto": per_foto,
        "agregat": agregasi(tanpa_gambar, commodity),
    }
