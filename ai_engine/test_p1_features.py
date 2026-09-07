"""
Tes unit & integrasi untuk fitur-fitur P1:
1. Koordinat Poligon Murni (poligon: [[x1, y1], [x2, y2], ...]) untuk SVG rendering.
2. Deteksi Otomatis Mismatch Komoditas (peringatan_komoditas).
3. ONNX Model Loader Fallback & Script Ekspor export_onnx.py.
"""

from unittest.mock import MagicMock, patch
import sys
import numpy as np
import cv2
import pytest
from pathlib import Path

# Mock ultralytics jika belum di-import
mock_ultralytics = MagicMock()
sys.modules["ultralytics"] = mock_ultralytics

from model import PantasModel
from export_onnx import ekspor_semua_onnx


# -------------------------------------------------------- 1. Deteksi Mismatch Komoditas

def test_evaluasi_mismatch_tomat_diunggah_sebagai_cabai():
    m = PantasModel()
    # Simulasi hasil deteksi objek simetris bulat (tomat) saat komoditas dipilih adalah cabai
    fake_results = [
        {"circularity": 0.88, "bbox": [10, 10, 50, 52]},
        {"circularity": 0.90, "bbox": [70, 70, 48, 50]}
    ]
    warning = m._evaluasi_mismatch_komoditas(fake_results, "chili_merah_besar")
    
    assert warning["mismatch"] is True
    assert warning["saran_komoditas"] == "tomato_sayur"
    assert "Tomat" in warning["pesan"]


def test_evaluasi_mismatch_cabai_diunggah_sebagai_tomat():
    m = PantasModel()
    # Simulasi hasil deteksi objek lonjong (cabai) saat komoditas dipilih adalah tomat
    fake_results = [
        {"circularity": 0.40, "bbox": [10, 10, 150, 40]},
        {"circularity": 0.42, "bbox": [70, 70, 160, 42]}
    ]
    warning = m._evaluasi_mismatch_komoditas(fake_results, "tomato_sayur")
    
    assert warning["mismatch"] is True
    assert warning["saran_komoditas"] in ("chili_merah_besar", "cucumber_lokal")
    assert "Cabai/Timun" in warning["pesan"]


def test_evaluasi_komoditas_cocok_tidak_menampilkan_mismatch():
    m = PantasModel()
    # Tomat bulat diunggah sebagai tomat
    fake_results = [
        {"circularity": 0.85, "bbox": [10, 10, 50, 50]}
    ]
    warning = m._evaluasi_mismatch_komoditas(fake_results, "tomato_sayur")
    
    assert warning["mismatch"] is False
    assert warning["saran_komoditas"] is None
    assert warning["pesan"] is None


# ---------------------------------------------------- 2. Koordinat Poligon SVG Array

@patch.object(PantasModel, "_get_yolo_model")
@patch.object(PantasModel, "_get_yolo2_model")
def test_pengembalian_koordinat_poligon(mock_yolo2, mock_yolo1):
    # Mock kontur mask YOLO
    mock_mask = MagicMock()
    # Buat poligon persegi 40x40
    mock_mask.xy = [np.array([[20, 20], [60, 20], [60, 60], [20, 60]], dtype=np.float32)]
    
    mock_res = MagicMock()
    mock_res.masks = mock_mask
    
    mock_m1 = MagicMock()
    mock_m1.predict.return_value = [mock_res]
    mock_yolo1.return_value = mock_m1

    mock_cls_res = MagicMock()
    mock_cls_res.probs.top1 = 0
    mock_cls_res.probs.top1conf = 0.95
    mock_cls_res.names = {0: "sehat"}
    
    mock_m2 = MagicMock()
    mock_m2.predict.return_value = [mock_cls_res]
    mock_yolo2.return_value = mock_m2
    
    m = PantasModel()
    img_dummy = np.full((200, 200, 3), 128, dtype=np.uint8)
    noise = np.random.randint(0, 50, (200, 200, 3), dtype=np.uint8)
    img_dummy = cv2.add(img_dummy, noise)
    
    dict_res, _ = m.predict(img_dummy, "tomato_sayur")
    
    assert dict_res["status"] == "success"
    assert len(dict_res["objek"]) == 1
    obj = dict_res["objek"][0]
    assert "poligon" in obj
    assert isinstance(obj["poligon"], list)
    # Harus berisi koordinat pasangan [x, y]
    assert len(obj["poligon"]) >= 3
    assert len(obj["poligon"][0]) == 2


# --------------------------------------------------------- 3. ONNX Loader Fallback

def test_onnx_loader_fallback_mechanism(tmp_path):
    m = PantasModel()
    with patch("model.ROOT_DIR", tmp_path):
        export_dir = tmp_path / "export_models"
        export_dir.mkdir()
        
        # Skenario 1: Hanya .pt ada
        pt_file = export_dir / "tomato_seg.pt"
        pt_file.touch()
        
        with patch("model.YOLO") as mock_yolo_cls:
            model = m._get_yolo_model("tomato")
            mock_yolo_cls.assert_called_with(str(pt_file))
            
        m.yolo_models.clear()
        
        # Skenario 2: Berkas .onnx ada
        onnx_file = export_dir / "tomato_seg.onnx"
        onnx_file.touch()
        
        with patch("model.YOLO") as mock_yolo_cls:
            model = m._get_yolo_model("tomato")
            mock_yolo_cls.assert_called_with(str(onnx_file))


def test_export_onnx_utility(tmp_path):
    with patch("export_onnx.ROOT_DIR", tmp_path):
        pt_file = tmp_path / "test_seg.pt"
        pt_file.touch()
        
        with patch("export_onnx.YOLO") as mock_yolo:
            mock_inst = MagicMock()
            mock_yolo.return_value = mock_inst
            
            hasil = ekspor_semua_onnx()
            mock_yolo.assert_called_with(str(pt_file))
            mock_inst.export.assert_called_with(format="onnx", imgsz=640, dynamic=True)
            assert len(hasil) == 1
