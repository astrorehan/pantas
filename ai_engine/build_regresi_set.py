"""Susun set regresi grading dan catat baseline komposisinya (F-100).

F-100 meminta 40 foto berlabel (10 per komoditas dasar) dengan komposisi grade
yang diharapkan, lalu `pytest` menegaskan komposisi berada dalam toleransi —
supaya penyetelan `grading_configs/*.json` tidak bisa diam-diam merusak akurasi.

Skrip ini menyiapkan dua hal:

1. **Fotonya** — disalin ke `regresi/foto/<komoditas>/` dari bahan yang sudah
   ada di repo, bukan diunduh ulang, supaya set regresi ikut ter-version.
2. **Labelnya** — `regresi/manifest.json`, memuat komposisi per foto beserta
   `sumber_label` yang menyatakan asal angkanya.

Soal `sumber_label`. Idealnya komposisi harapan datang dari penilaian manusia
("manual"). Yang bisa dijamin skrip ini hanyalah `"baseline"`: keluaran engine
pada commit tempat foto itu didaftarkan, dikunci sebagai pembanding. Itu tetap
menjawab pertanyaan yang diajukan F-100 — apakah config berubah tanpa sengaja —
tetapi ia tidak membuktikan engine-nya benar, dan manifest menyatakannya apa
adanya alih-alih menyebut angka mesin sebagai kebenaran lapangan.

Cakupan foto yang tersedia di repo ini jauh dari 40 (lihat `KOMODITAS` di bawah);
tes regresi melewatkan komoditas yang belum punya foto dengan alasan tercetak,
sehingga kekurangannya terlihat di keluaran pytest, bukan tersembunyi.

Jalankan ulang sesudah menambah foto atau ketika perubahan config memang
disengaja (baseline lama akan tertimpa — itu keputusan sadar, bukan efek
samping):

    ai_engine/.venv/Scripts/python.exe ai_engine/build_regresi_set.py
    ai_engine/.venv/Scripts/python.exe ai_engine/build_regresi_set.py --hanya chili
"""

from __future__ import annotations

import argparse
import json
import shutil
import zipfile
from datetime import date
from pathlib import Path

import cv2

ROOT = Path(__file__).resolve().parent
DATASETS = ROOT / "datasets"
REGRESI = ROOT / "regresi"
FOTO_DIR = REGRESI / "foto"
MANIFEST = REGRESI / "manifest.json"

TARGET_PER_KOMODITAS = 10

# Toleransi yang dipakai tes. Komposisi dibandingkan per grade secara absolut;
# 0,10 berarti porsi grade A boleh bergeser 10 poin persen sebelum tes gagal.
# Angka ini bukan selera: `komposisi` dibulatkan ke 2 desimal dan satu objek
# pada foto berisi 10 objek sudah bernilai 0,10, jadi toleransi yang lebih ketat
# akan menyalakan alarm hanya karena satu objek pindah kelas di batas ambang.
TOLERANSI = {
    "komposisi_absolut": 0.10,
    # Jumlah objek bergeser bila ambang confidence YOLO atau filter area 500 px
    # diubah. Relatif 20% dengan lantai 1 objek: foto berisi 2 objek tidak boleh
    # gagal hanya karena 20% dari 2 adalah 0,4.
    "objek_relatif": 0.20,
    "objek_minimal": 1,
}

# Tidak ada satu pun bahan foto di repo ini yang diambil dengan koin Rp500 di
# dalam bingkai — dataset latih maupun foto uji integrasi. Fakta itu dicatat per
# baris manifest supaya tes bisa menegaskan aturan F-101 (tanpa koin, tidak ada
# estimasi berat) alih-alih memercayai bendera `kalibrasi.valid` dari engine.
BERISI_KOIN = False

CHILI_ZIP = (
    DATASETS
    / "raw_new_zips_yolo1"
    / "chili"
    / "chili-classify-segmentation.v1-segmentation-classification.yolov11.zip"
)

# Sumber foto per komoditas dasar. `varian` adalah id config yang dipakai tes;
# satu varian cukup — yang diuji regresi adalah pipeline dan ambangnya, dan
# varian lain memakai berkas config bersaudara di folder yang sama.
KOMODITAS: dict[str, dict] = {
    "chili": {
        "varian": "chili_hijau_besar",
        # Split test YOLO-1: 10 frame lapangan yang tidak pernah dilatih. Persis
        # sebanyak yang diminta F-100, dan justru bagian dataset yang paling
        # layak dipakai regresi karena model belum pernah melihatnya.
        "sumber": "datasets/raw_new_zips_yolo1/chili/…yolov11.zip (split test)",
        "asal": "zip_test",
    },
    "tomato": {
        "varian": "tomato_merah",
        # Satu foto adegan: bahan uji integrasi engine. Bukan split test yang
        # bersih — provenansnya tidak tercatat, jadi ia mungkin pernah dilatih.
        "sumber": "outputs/image.jpg (foto uji integrasi engine)",
        "asal": "outputs",
    },
    "carrot": {
        "varian": "carrot",
        "sumber": None,
        "asal": None,
        "alasan": (
            "Repo hanya menyimpan potongan klasifikasi 224x224 (satu objek per "
            "berkas, dibidik ketat). Potongan begitu tidak bisa menyamar jadi "
            "foto panen: komposisi grade dari satu objek bukan komposisi batch. "
            "Butuh 10 foto panen wortel berkoin Rp500 dari lapangan."
        ),
    },
    "cucumber": {
        "varian": "cucumber_lokal",
        "sumber": None,
        "asal": None,
        "alasan": (
            "Sama seperti wortel: yang ada hanya potongan klasifikasi 224x224, "
            "bukan foto adegan. Butuh 10 foto panen timun berkoin Rp500."
        ),
    },
}


def _frame_zip_cabai() -> list[tuple[str, bytes]]:
    """Seluruh gambar split test dari zip cabai, urut nama supaya stabil."""
    with zipfile.ZipFile(CHILI_ZIP) as z:
        nama = sorted(
            n for n in z.namelist() if n.startswith("test/images/") and n.endswith(".jpg")
        )
        return [(n, z.read(n)) for n in nama]


def siapkan_foto(dasar: str) -> list[dict]:
    """Salin foto sumber ke `regresi/foto/<dasar>/` dan kembalikan daftarnya."""
    info = KOMODITAS[dasar]
    tujuan = FOTO_DIR / dasar
    tujuan.mkdir(parents=True, exist_ok=True)

    daftar: list[dict] = []
    if info["asal"] == "zip_test":
        for i, (nama_asal, data) in enumerate(_frame_zip_cabai(), start=1):
            berkas = tujuan / f"{dasar}-{i:02d}.jpg"
            berkas.write_bytes(data)
            daftar.append({"berkas": berkas, "asal_nama": Path(nama_asal).name})
    elif info["asal"] == "outputs":
        # Pita anotasi di sudut kiri atas dipangkas: label probabilitas dari
        # jalan uji lama adalah piksel asing yang tidak boleh ikut dinilai.
        sumber = ROOT / "outputs" / "image.jpg"
        gambar = cv2.imread(str(sumber))
        if gambar is None:
            raise SystemExit(f"Tidak bisa membaca {sumber}")
        berkas = tujuan / f"{dasar}-01.jpg"
        cv2.imwrite(str(berkas), gambar[52:, :])
        daftar.append({"berkas": berkas, "asal_nama": sumber.name})

    return daftar


def catat_baseline(daftar: list[dict], varian: str) -> list[dict]:
    """Jalankan engine sekali per foto dan catat komposisi yang keluar."""
    from model import PantasModel  # diimpor di dalam: memuat ultralytics lambat

    model = PantasModel()
    baris: list[dict] = []
    for entri in daftar:
        berkas: Path = entri["berkas"]
        gambar = cv2.imread(str(berkas))
        if gambar is None:
            raise SystemExit(f"Tidak bisa membaca {berkas}")
        hasil, _ = model.predict(gambar, varian)
        if hasil.get("status") != "success":
            # Foto yang ditolak engine tidak boleh masuk set regresi: yang
            # terkunci nanti hanya pesan galatnya, bukan komposisi apa pun.
            print(f"  ! dilewati {berkas.name}: {hasil.get('message')}")
            berkas.unlink()
            continue
        komposisi = hasil["ringkasan_batch"]["komposisi"]
        baris.append(
            {
                "berkas": str(berkas.relative_to(REGRESI)).replace("\\", "/"),
                "asal_nama": entri["asal_nama"],
                "komoditas": varian,
                "objek_terdeteksi": hasil["objek_terdeteksi"],
                "komposisi": komposisi,
                # Fakta tentang fotonya, dicatat tangan lewat BERISI_KOIN: tidak
                # satu pun bahan di repo ini difoto dengan koin Rp500 di bingkai.
                "berisi_koin": BERISI_KOIN,
                # Apa yang engine *klaim* soal kalibrasi pada foto itu. Dicatat
                # terpisah dari fakta di atas justru karena keduanya berbeda:
                # lihat test_regresi_grading.py.
                "kalibrasi_diklaim": hasil["kalibrasi"]["valid"],
                "sumber_label": "baseline",
                "dicatat": date.today().isoformat(),
            }
        )
        print(
            f"  {berkas.name}  {hasil['objek_terdeteksi']} objek  "
            f"{ {k: v for k, v in komposisi.items() if v} }"
        )
    return baris


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--hanya",
        choices=sorted(KOMODITAS),
        help="Perbarui satu komoditas saja; sisanya dipertahankan dari manifest lama.",
    )
    args = ap.parse_args()

    REGRESI.mkdir(parents=True, exist_ok=True)
    lama = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    foto_lama: dict[str, list] = {}
    for baris in lama.get("foto", []):
        foto_lama.setdefault(baris["berkas"].split("/")[1], []).append(baris)

    komoditas_out: dict[str, dict] = {}
    foto_out: list[dict] = []

    for dasar, info in KOMODITAS.items():
        pertahankan = args.hanya is not None and args.hanya != dasar
        if pertahankan:
            baris = foto_lama.get(dasar, [])
        elif info["asal"] is None:
            baris = []
        else:
            print(f"{dasar}:")
            baris = catat_baseline(siapkan_foto(dasar), info["varian"])

        entri: dict = {
            "varian_diuji": info["varian"],
            "target_foto": TARGET_PER_KOMODITAS,
            "foto_tersedia": len(baris),
        }
        if len(baris) >= TARGET_PER_KOMODITAS:
            entri["status"] = "lengkap"
        elif baris:
            entri["status"] = "kurang"
        else:
            entri["status"] = "kosong"
        if info["sumber"]:
            entri["sumber"] = info["sumber"]
        if info.get("alasan"):
            entri["alasan"] = info["alasan"]
        komoditas_out[dasar] = entri
        foto_out.extend(baris)

    MANIFEST.write_text(
        json.dumps(
            {
                "versi": 1,
                "catatan": (
                    "Digenerate build_regresi_set.py (F-100). `sumber_label: baseline` "
                    "berarti angkanya keluaran engine yang dikunci, bukan penilaian "
                    "manusia — set ini mendeteksi perubahan, bukan membuktikan akurasi."
                ),
                "toleransi": TOLERANSI,
                "komoditas": komoditas_out,
                "foto": foto_out,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    total = len(foto_out)
    target = TARGET_PER_KOMODITAS * len(KOMODITAS)
    print(f"\n{MANIFEST.relative_to(ROOT.parent)}  {total}/{target} foto")
    for dasar, e in komoditas_out.items():
        print(f"  {dasar:9s} {e['foto_tersedia']:2d}/{e['target_foto']}  {e['status']}")


if __name__ == "__main__":
    main()
