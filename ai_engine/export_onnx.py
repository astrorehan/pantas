"""
Script utilitas untuk mengonversi model PyTorch YOLOv11 (.pt) di folder export_models/
menjadi format ONNX (.onnx) untuk inferensi ultra-cepat di lingkungan CPU.

Penggunaan:
    python export_onnx.py
"""

from pathlib import Path
from ultralytics import YOLO

ROOT_DIR = Path(__file__).parent / "export_models"


def ekspor_semua_onnx(imgsz: int = 640) -> list[Path]:
    """Ekspor seluruh berkas .pt yang ada di export_models ke .onnx."""
    berkas_terekspor = []
    if not ROOT_DIR.exists():
        print(f"Folder {ROOT_DIR} tidak ditemukan.")
        return berkas_terekspor

    for pt_file in ROOT_DIR.glob("*.pt"):
        onnx_file = pt_file.with_suffix(".onnx")
        if not onnx_file.exists():
            print(f"Mengonversi {pt_file.name} ke format ONNX...")
            try:
                model = YOLO(str(pt_file))
                model.export(format="onnx", imgsz=imgsz, dynamic=True)
                print(f"Berhasil diekspor: {onnx_file.name}")
                berkas_terekspor.append(onnx_file)
            except Exception as e:
                print(f"Gagal mengonversi {pt_file.name}: {e}")
        else:
            print(f"Sudah ada: {onnx_file.name}")
            berkas_terekspor.append(onnx_file)

    return berkas_terekspor


if __name__ == "__main__":
    ekspor_semua_onnx()
