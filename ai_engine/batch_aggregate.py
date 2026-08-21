"""
Penggabungan hasil pindai multi-foto (F-12).

Petani dengan tumpukan besar memotret 3–5 sudut dan berhak atas satu laporan,
bukan lima. Modul ini menggabungkan beberapa keluaran `PantasModel.predict`
menjadi satu ringkasan agregat.

Tiga aturan penggabungan datang langsung dari spek F-12:

1. **Komposisi = rata-rata tertimbang jumlah objek.** Menjumlahkan objek lintas
   foto, bukan merata-ratakan persentase per foto — foto berisi 20 objek tidak
   boleh punya suara sama besar dengan foto berisi 2.
2. **Skor keseragaman dihitung ulang lintas seluruh objek.** Bukan rata-rata
   skor per foto: keseragaman antar-sudut justru bagian yang ingin diukur.
3. **`hash_audit` menutupi payload gabungan**, sehingga yang bisa dibuktikan
   adalah laporan yang benar-benar dibaca petani.

Foto yang ditolak engine (blur, bukan gambar) tidak dibuang diam-diam: ia
tercatat di `foto_gagal` beserta alasannya.
"""

import hashlib
import json

URUT_GRADE = ["A", "B", "C", "REJECT"]


def _kunci_grade(grade: str) -> str:
    """"B - Standar" -> "B"; "REJECT (bercak)" -> "REJECT". Sama dengan model.py."""
    return "REJECT" if "REJECT" in grade else grade[0]


def _skor_keseragaman(objek: list) -> float:
    """
    Koefisien variasi ukuran, dibalik jadi skor 0..1.

    Memakai `ukuran_mm2` bila ada dan jatuh ke luas bounding box bila tidak —
    aturan yang sama dengan model.py, supaya angka satu foto dan angka agregat
    tidak dihitung dengan dua definisi berbeda.
    """
    if len(objek) <= 1:
        return 1.0
    ukuran = []
    for o in objek:
        if o.get("ukuran_mm2"):
            ukuran.append(float(o["ukuran_mm2"]))
        else:
            bbox = o.get("bbox") or [0, 0, 0, 0]
            ukuran.append(float(bbox[2] * bbox[3]))
    rata = sum(ukuran) / len(ukuran)
    if rata <= 0:
        return 0.0
    varians = sum((u - rata) ** 2 for u in ukuran) / len(ukuran)
    cv = (varians**0.5) / rata
    return round(max(0.0, 1 - cv), 2)


def _gabung_estimasi_berat(hasil_sukses: list) -> dict:
    """
    Jumlahkan estimasi berat foto-foto yang punya kalibrasi sah.

    Batas rentangnya ikut dijumlahkan, bukan dihitung ulang dari faktor: itu
    asumsi konservatif (galat tiap foto dianggap searah) dan tidak pernah
    membuat rentang gabungan lebih sempit daripada penyusunnya.
    """
    tersedia = [
        h["ringkasan_batch"]["estimasi_berat"]
        for h in hasil_sukses
        if h.get("ringkasan_batch", {}).get("estimasi_berat", {}).get("tersedia")
    ]
    if not tersedia:
        return {
            "tersedia": False,
            "alasan": (
                "Tidak ada foto dengan kalibrasi koin yang sah, sehingga berat "
                "tidak dapat diestimasi dari luas."
            ),
        }

    gram = sum(e["gram"] for e in tersedia)
    return {
        "tersedia": True,
        "gram": round(gram, 1),
        "kg": round(gram / 1000.0, 3),
        "min_kg": round(sum(e["min_kg"] for e in tersedia), 3),
        "max_kg": round(sum(e["max_kg"] for e in tersedia), 3),
        "luas_total_mm2": round(sum(e["luas_total_mm2"] for e in tersedia), 1),
        "faktor_gram_per_mm2": tersedia[0]["faktor_gram_per_mm2"],
        "rel_ketidakpastian": max(e["rel_ketidakpastian"] for e in tersedia),
        "n_sampel_kalibrasi": tersedia[0]["n_sampel_kalibrasi"],
        "sumber_faktor": tersedia[0]["sumber_faktor"],
        "objek_terukur": sum(e["objek_terukur"] for e in tersedia),
        "objek_total": sum(e["objek_total"] for e in tersedia),
        # Berapa foto benar-benar ikut menyumbang angka ini. Kalau lebih kecil
        # dari jumlah foto terproses, estimasinya hanya mencakup sebagian batch.
        "foto_terhitung": len(tersedia),
    }


def agregasi(per_foto: list, commodity_specific: str) -> dict:
    """
    Args:
        per_foto: daftar entri `{"indeks": int, "hasil": dict}` — `hasil` adalah
            keluaran `PantasModel.predict` apa adanya, termasuk yang berstatus
            "error".
        commodity_specific: komoditas yang dipilih petani, sama untuk semua foto.

    Returns:
        Ringkasan agregat lengkap dengan `hash_audit` sendiri.
    """
    sukses = [e for e in per_foto if e["hasil"].get("status") == "success"]
    gagal = [
        {"indeks": e["indeks"], "message": e["hasil"].get("message", "Gagal diproses.")}
        for e in per_foto
        if e["hasil"].get("status") != "success"
    ]

    objek_semua = []
    for e in sukses:
        for o in e["hasil"].get("objek", []):
            # Nomor foto ikut menempel supaya layar hasil bisa memulangkan tiap
            # objek ke foto asalnya, bukan menyajikan daftar tanpa asal-usul.
            objek_semua.append({**o, "foto": e["indeks"]})

    total = len(objek_semua)
    jumlah = {g: 0 for g in URUT_GRADE}
    for o in objek_semua:
        kunci = _kunci_grade(o["grade"])
        if kunci in jumlah:
            jumlah[kunci] += 1
    # Rata-rata tertimbang jumlah objek: pembaginya total objek seluruh foto.
    komposisi = (
        {g: round(n / total, 2) for g, n in jumlah.items()} if total > 0 else {}
    )

    foto_terkalibrasi = sum(
        1 for e in sukses if e["hasil"].get("kalibrasi", {}).get("valid")
    )

    agregat = {
        "status": "success" if sukses else "error",
        "komoditas": commodity_specific,
        "foto_terproses": len(sukses),
        "foto_gagal": gagal,
        "objek_terdeteksi": total,
        "kalibrasi": {
            "referensi": "koin_500",
            # Agregat hanya menyebut dirinya terkalibrasi bila setiap foto yang
            # berhasil memang punya koin — separuh terkalibrasi berarti ukuran
            # gabungan tidak bisa dipercaya sebagai satu kesatuan.
            "valid": bool(sukses) and foto_terkalibrasi == len(sukses),
            "foto_terkalibrasi": foto_terkalibrasi,
        },
        "ringkasan_batch": {
            "komposisi": komposisi,
            "skor_keseragaman": _skor_keseragaman(objek_semua),
            "estimasi_berat": _gabung_estimasi_berat([e["hasil"] for e in sukses]),
        },
        "objek": objek_semua,
    }

    if not sukses:
        agregat["message"] = (
            "Tidak ada foto yang berhasil dinilai. " + gagal[0]["message"]
            if gagal
            else "Tidak ada foto yang dikirim."
        )
        return agregat

    # Hash menutupi payload gabungan yang persis inilah yang dibaca petani.
    agregat["hash_audit"] = (
        "sha256:" + hashlib.sha256(json.dumps(agregat, sort_keys=True).encode()).hexdigest()
    )
    return agregat
