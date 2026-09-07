"""
Tes unit terisolasi dengan Mock YOLO:
Menguji Pre-Flight Quality Gate (Blur, Gelap, Silau, Tilt) dan pemrosesan paralel batch.
"""

from unittest.mock import MagicMock, patch
import sys
import numpy as np
import cv2
import pytest
from fastapi.testclient import TestClient

# Mock modul ultralytics sebelum api dan model diimpor
mock_ultralytics = MagicMock()
sys.modules["ultralytics"] = mock_ultralytics

from api import app
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
    if gelap:
        img = np.full((height, width, 3), 10, dtype=np.uint8) # kecerahan ~10 (< 20)
    elif silau:
        img = np.full((height, width, 3), 200, dtype=np.uint8)
        img[0:int(height * 0.45), 0:int(width * 0.45)] = 255 # silau > 15%
    else:
        img = np.full((height, width, 3), color, dtype=np.uint8)

    if blur and not gelap and not silau:
        pass
    elif not blur and not gelap:
        noise = np.random.randint(0, 50, (height, width, 3), dtype=np.uint8)
        img = cv2.add(img, noise)

    if dengan_koin:
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


def test_gerbang_menolak_foto_blur():
    m = PantasModel()
    img_blur = _buat_gambar_dummy(blur=True)
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
    img_miring = _buat_gambar_dummy(dengan_koin=True, koin_tilt=0.50)
    dict_res, _ = m.predict(img_miring, "tomato_sayur")
    
    assert dict_res["status"] == "error"
    assert "miring" in dict_res["message"].lower()
    assert dict_res["kalibrasi"]["valid"] is False


@patch.object(PantasModel, "_get_yolo_model")
@patch.object(PantasModel, "_get_yolo2_model")
def test_gerbang_meloloskan_foto_koin_tegak_lurus(mock_yolo2, mock_yolo1):
    mock_m1 = MagicMock()
    mock_m1.predict.return_value = []
    mock_yolo1.return_value = mock_m1
    mock_yolo2.return_value = MagicMock()

    m = PantasModel()
    img_normal = _buat_gambar_dummy(dengan_koin=True, koin_tilt=0.95)
    dict_res, _ = m.predict(img_normal, "tomato_sayur")
    
    assert dict_res["status"] == "success"
    assert dict_res["kalibrasi"]["valid"] is True


@patch.object(PantasModel, "_get_yolo_model")
@patch.object(PantasModel, "_get_yolo2_model")
def test_predict_batch_paralel_fastapi(mock_yolo2, mock_yolo1):
    mock_m1 = MagicMock()
    mock_m1.predict.return_value = []
    mock_yolo1.return_value = mock_m1
    mock_yolo2.return_value = MagicMock()

    client = TestClient(app)
    
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
    assert [f["indeks"] for f in json_resp["foto"]] == [0, 1, 2]
    assert [f["nama"] for f in json_resp["foto"]] == ["foto1.jpg", "foto2.jpg", "foto3.jpg"]
    assert "agregat" in json_resp
    assert json_resp["agregat"]["foto_terproses"] == 3
