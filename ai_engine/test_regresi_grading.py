"""Set regresi grading (F-100).

Menjalankan `PantasModel.predict` pada setiap foto di `regresi/manifest.json` dan
menegaskan komposisi grade-nya masih berada dalam toleransi terhadap label yang
tercatat. Gunanya satu: menyetel `grading_configs/*.json` — ambang area,
circularity, rentang hue, aturan cacat — tidak bisa lagi menggeser akurasi tanpa
ada yang menyadarinya.

    ai_engine/.venv/Scripts/python.exe -m pytest ai_engine/test_regresi_grading.py -rs

`-rs` penting: kekurangan set regresi (F-100 meminta 40 foto, repo baru punya 11)
dilaporkan sebagai skip beralasan, bukan disembunyikan sebagai tes yang lulus.

Bila sebuah kegagalan memang disengaja — config diubah karena ambang lamanya
salah — baseline-nya digenerate ulang secara sadar:

    ai_engine/.venv/Scripts/python.exe ai_engine/build_regresi_set.py --hanya chili
"""

from __future__ import annotations

import json
from pathlib import Path

import cv2
import pytest

ROOT = Path(__file__).resolve().parent
REGRESI = ROOT / "regresi"
MANIFEST = REGRESI / "manifest.json"

GRADE = ["A", "B", "C", "REJECT"]


def _manifest() -> dict:
    if not MANIFEST.exists():
        pytest.skip(
            f"{MANIFEST.relative_to(ROOT.parent)} belum ada — "
            "jalankan build_regresi_set.py lebih dulu."
        )
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


MF = _manifest() if MANIFEST.exists() else {"foto": [], "komoditas": {}, "toleransi": {}}
TOL = MF.get("toleransi", {})


@pytest.fixture(scope="session")
def model():
    """Satu instans untuk seluruh sesi: memuat bobot YOLO adalah bagian termahal."""
    from model import PantasModel

    return PantasModel()


def _idnya(baris: dict) -> str:
    return Path(baris["berkas"]).name


@pytest.mark.parametrize("baris", MF["foto"], ids=_idnya)
def test_komposisi_dalam_toleransi(model, baris: dict):
    berkas = REGRESI / baris["berkas"]
    if not berkas.exists():
        pytest.skip(f"Foto set regresi hilang: {berkas.name}")
    gambar = cv2.imread(str(berkas))
    if gambar is None:
        pytest.skip(f"Foto set regresi tidak dapat dibaca: {berkas.name}")
    hasil, _ = model.predict(gambar, baris["komoditas"])
    assert hasil["status"] == "success", hasil.get("message")

    # 1. Jumlah objek. Digeser oleh ambang confidence YOLO dan filter area 500 px,
    #    dan komposisi tidak ada artinya bila objek yang dinilai sudah beda.
    diharapkan_n = baris["objek_terdeteksi"]
    batas_n = max(TOL["objek_minimal"], round(diharapkan_n * TOL["objek_relatif"]))
    assert abs(hasil["objek_terdeteksi"] - diharapkan_n) <= batas_n, (
        f"objek terdeteksi {hasil['objek_terdeteksi']}, "
        f"baseline {diharapkan_n} (toleransi ±{batas_n})"
    )

    # 2. Komposisi per grade, absolut. Diperiksa per grade dan bukan hanya pada
    #    grade dominan: pergeseran A→B yang menyisakan A tetap dominan justru
    #    jenis regresi yang paling mudah lolos tanpa disadari.
    aktual = hasil["ringkasan_batch"]["komposisi"]
    diharapkan = baris["komposisi"]
    batas = TOL["komposisi_absolut"]
    selisih = {
        g: round(aktual.get(g, 0.0) - diharapkan.get(g, 0.0), 3)
        for g in GRADE
        if abs(aktual.get(g, 0.0) - diharapkan.get(g, 0.0)) > batas
    }
    assert not selisih, (
        f"komposisi bergeser di luar ±{batas}: {selisih}\n"
        f"  baseline {diharapkan}\n  sekarang {aktual}"
    )


@pytest.mark.xfail(
    reason=(
        "CACAT TERBUKA SEBAGIAN — AutoCalibrator masih tidak punya uji kelayakan "
        "koin: pada foto tanpa koin Rp500 ia tetap memilih blob bulat mana pun "
        "(ujung cabai, tepi piring) lalu melaporkan kalibrasi sah. Yang sudah ada "
        "adalah gerbang di hilirnya (plausibilitas.py): begitu skala palsu itu "
        "menghasilkan buah di luar ukuran fisik yang mungkin — chili-02.jpg: tiga "
        "cabai seluas 0,11-0,16 m² masing-masing — fotonya ditolak seluruhnya, "
        "jadi tidak ada angka karangan yang sampai ke aplikasi. Yang belum "
        "tertangkap adalah koin palsu yang kebetulan menghasilkan skala yang "
        "masih masuk akal. Perbaikan tuntasnya tetap di calibration.py."
    ),
)
@pytest.mark.parametrize("baris", MF["foto"], ids=_idnya)
def test_foto_tanpa_koin_tidak_boleh_terkalibrasi(model, baris: dict):
    """
    Aturan F-101 yang dijaga set regresi ini: tanpa koin Rp500 di bingkai, engine
    harus mengembalikan alasan, bukan angka.

    `berisi_koin` adalah fakta tentang fotonya, dicatat tangan di
    build_regresi_set.py — bukan bendera `kalibrasi.valid` dari engine. Memakai
    bendera engine untuk menguji engine akan selalu lulus, termasuk saat
    engine-nya salah.
    """
    if baris["berisi_koin"]:
        pytest.skip("Foto ini memang berisi koin; aturannya tidak berlaku.")

    berkas = REGRESI / baris["berkas"]
    if not berkas.exists():
        pytest.skip(f"Foto set regresi hilang: {berkas.name}")
    gambar = cv2.imread(str(berkas))
    if gambar is None:
        pytest.skip(f"Foto set regresi tidak dapat dibaca: {berkas.name}")
    hasil, _ = model.predict(gambar, baris["komoditas"])

    # Foto ditolak gerbang kewajaran skala memenuhi aturan yang sama lewat jalan
    # yang lebih tegas: tidak ada laporan sama sekali, jadi tidak ada `ukuran_mm2`
    # maupun estimasi berat yang bisa dibaca sebagai angka terkalibrasi.
    if hasil["status"] == "error":
        assert hasil["kalibrasi"]["valid"] is False
        assert "objek" not in hasil
        return

    assert hasil["kalibrasi"]["valid"] is False, (
        f"koin diklaim ketemu pada foto tanpa koin; px_per_mm2="
        f"{hasil['kalibrasi']['px_per_mm2']}, ukuran objek jadi "
        f"{[o['ukuran_mm2'] for o in hasil['objek'][:3]]} mm²"
    )
    assert all(o["ukuran_mm2"] is None for o in hasil["objek"])

    estimasi = hasil["ringkasan_batch"]["estimasi_berat"]
    assert estimasi["tersedia"] is False
    assert "koin" in estimasi["alasan"].lower()


@pytest.mark.parametrize("dasar", sorted(MF["komoditas"]))
def test_cakupan_set_regresi(dasar: str):
    """
    Cakupan per komoditas dasar. F-100 meminta 10 foto per komoditas; yang belum
    terpenuhi dilewatkan dengan alasan tercetak (`pytest -rs`) supaya kekurangan
    set ini terbaca dari keluaran tes, bukan hanya dari dokumen.
    """
    entri = MF["komoditas"][dasar]
    if entri["status"] != "lengkap":
        pytest.skip(
            f"{dasar}: {entri['foto_tersedia']}/{entri['target_foto']} foto — "
            + entri.get("alasan", "belum lengkap")
        )
    assert entri["foto_tersedia"] >= entri["target_foto"]
