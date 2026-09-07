"""
Tes unit & integrasi untuk:
1. Gerbang Kualitas Foto (Pre-Flight Quality Gate): Blur, Terlalu Gelap, Terlalu Silau, dan Sudut Kemiringan Koin.
2. Pemrosesan Paralel Endpoint /predict/batch.
"""

import asyncio
import io
import json
import numpy as np
import cv2
import pytest
from fastapi.testclient import TestClient

from api import app, model
from model import PantasModel


def _buat_gambar_dummy(
    width=300,
    height=300,
    color=(128, 128, 128),
    dengan_koin=False,
    koin_tilt=1.0,
    silau=False,
    gelap=False,
    blur=False,
):
    """Membuat gambar sintetis NumPy BGR untuk menguji gerbang kualitas."""
    if gelap:
        img = np.full((height, width, 3), 10, dtype=np.uint8) # mean brightness ~10 (< 20)
    elif silau:
        img = np.full((height, width, 3), 200, dtype=np.uint8)
        # Buat 20% piksel bernilai 255 murni (glare > 15%)
        img[0:int(height * 0.45), 0:int(width * 0.45)] = 255
    else:
        img = np.full((height, width, 3), color, dtype=np.uint8)

    if blur and not gelap and not silau:
        # Gambar polos tanpa tepi menghasilkan skor Laplacian ~0 (< 10)
        pass
    elif not blur:
        # Tambahkan tekstur/kebisingan agar skor Laplacian tinggi (> 10)
        noise = np.random.randint(0, 50, (height, width, 3), dtype=np.uint8)
        img = cv2.add(img, noise)

    if dengan_koin:
        # Gambar koin sintetis (lingkaran atau elips miring) di tengah
        cx, cy = width // 2, height // 2
        r_major = 40
        r_minor = int(r_major * koin_tilt)
        cv2.ellipse(img, (cx, cy), (r_major, r_minor), 0, 0, 360, (255, 255, 255), -1)
        cv2.ellipse(img, (cx, cy), (r_major, r_minor), 0, 0, 360, (0, 0, 0), 2)

    return img


def _gambar_ke_bytes(img):
    ok, buf = cv2.imencode(".jpg", img)
    assert ok
    return buf.tobytes()


# ---------------------------------------------------------------- Gerbang Kualitas Foto

def test_gerbang_menolak_foto_blur():
    m = PantasModel()
    img_blur = _buat_gambar_dummy(blur=True) # foto polos tanpa tekstur
    dict_res, _ = m.predict(img_blur, "tomato_sayur")
    
    assert dict_res["status"] == "error"
    assert "blur" in dict_res["message"].lower()


def test_gerbang_menolak_foto_terlalu_gelap():
    m = PantasModel()
    img_gelap = _buat_gambar_dummy(gelap=True)
    dict_res, _ = m.predict(img_gelap, "tomato_sayur")
    
    assert dict_res["status"] == "error"
    assert "terlalu gelap" in dict_res["message"].lower()


def test_gerbang_menolak_foto_terlalu_silau():
    m = PantasModel()
    img_silau = _buat_gambar_dummy(silau=True)
    dict_res, _ = m.predict(img_silau, "tomato_sayur")
    
    assert dict_res["status"] == "error"
    assert "terlalu silau" in dict_res["message"].lower()


def test_gerbang_menolak_foto_koin_terlalu_miring():
    m = PantasModel()
    # Koin dengan tilt ratio 0.50 (kamera miring ~60 derajat)
    img_miring = _buat_gambar_dummy(dengan_koin=True, koin_tilt=0.50)
    dict_res, _ = m.predict(img_miring, "tomato_sayur")
    
    assert dict_res["status"] == "error"
    assert "miring" in dict_res["message"].lower()
    assert dict_res["kalibrasi"]["valid"] is False


def test_gerbang_meloloskan_foto_koin_tegak_lurus():
    m = PantasModel()
    # Koin dengan tilt ratio 0.95 (tegak lurus dari atas)
    img_normal = _buat_gambar_dummy(dengan_koin=True, koin_tilt=0.95)
    dict_res, _ = m.predict(img_normal, "tomato_sayur")
    
    # Foto lolos gerbang kualitas (walau mungkin tidak ada tomat terdeteksi)
    assert dict_res["status"] == "success"
    assert dict_res["kalibrasi"]["valid"] is True


# ------------------------------------------------------------ Parallel Batch Processing

def test_predict_batch_paralel_fastapi():
    client = TestClient(app)
    
    # Siapkan 3 foto sintetis
    img1 = _gambar_ke_bytes(_buat_gambar_dummy(dengan_koin=True, koin_tilt=0.95))
    img2 = _gambar_ke_bytes(_buat_gambar_dummy(dengan_koin=True, koin_tilt=0.90))
    img3 = _gambar_ke_bytes(_buat_gambar_dummy(dengan_koin=True, koin_tilt=0.88))
    
    files = [
        ("images", ("foto1.jpg", img1, "image/jpeg")),
        ("images", ("foto2.jpg", img2, "image/jpeg")),
        ("images", ("foto3.jpg", img3, "image/jpeg")),
    ]
    data = {
        "commodity": "tomato_sayur"
    }
    
    res = client.post("/predict/batch", files=files, data=data)
    assert res.status_code == 200
    json_resp = res.json()
    
    assert json_resp["status"] == "success"
    assert json_resp["komoditas"] == "tomato_sayur"
    assert len(json_resp["foto"]) == 3
    # Urutan indeks harus konsisten (0, 1, 2)
    assert [f["indeks"] for f in json_resp["foto"]] == [0, 1, 2]
    assert [f["nama"] for f in json_resp["foto"]] == ["foto1.jpg", "foto2.jpg", "foto3.jpg"]
    assert "agregat" in json_resp
    assert json_resp["agregat"]["foto_terproses"] == 3
