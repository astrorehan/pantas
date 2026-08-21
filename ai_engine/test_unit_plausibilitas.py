"""
Tes gerbang kewajaran skala kalibrasi.

Murni Python: tidak memuat bobot YOLO, tidak menyentuh disk. Yang diuji adalah
keputusan lolos/tolaknya, bukan pipeline-nya.
"""

import pytest

from plausibilitas import RENTANG_LUAS_MM2, periksa_skala


# --------------------------------------------------------------- kasus nyata

def test_menolak_pindaian_produksi_yang_meleset():
    """
    Baris nyata dari produksi: dua butir tomat, luas total 302.591 mm², berat
    11,86 kg, komposisi A 100%, dan `valid: true` di sampingnya. Inilah pindaian
    yang membuat gerbang ini ada; kalau ia lolos, gerbangnya tidak bekerja.
    """
    hasil = periksa_skala([151295.6, 151295.6], "tomato_sayur")

    assert hasil["diperiksa"] is True
    assert hasil["masuk_akal"] is False
    assert hasil["faktor_meleset"] > 10
    assert "koin" in hasil["alasan"].lower()


def test_meloloskan_tomat_berukuran_wajar():
    # Ø60 mm -> pi*30^2 = 2.827 mm², tomat pasar biasa.
    hasil = periksa_skala([2827.0, 2650.0, 3010.0], "tomato_sayur")

    assert hasil["diperiksa"] is True
    assert hasil["masuk_akal"] is True
    assert hasil["alasan"] is None


def test_meloloskan_tomat_ceri_dan_beef_dengan_rentang_yang_sama():
    """Varian dinilai per kata dasar, jadi satu rentang harus memuat keduanya."""
    ceri = periksa_skala([180.0, 200.0, 230.0], "tomato_ceri")
    beef = periksa_skala([7500.0, 7800.0], "tomato_beef")

    assert ceri["masuk_akal"] is True
    assert beef["masuk_akal"] is True


@pytest.mark.parametrize(
    "komoditas,luas",
    [
        ("chili_rawit", [150.0, 165.0, 140.0]),
        ("chili_keriting", [2100.0, 1950.0]),
        ("carrot", [3600.0, 4100.0]),
        ("cucumber", [7200.0, 6800.0]),
    ],
)
def test_meloloskan_ukuran_pasar_tiap_komoditas(komoditas, luas):
    assert periksa_skala(luas, komoditas)["masuk_akal"] is True


# ------------------------------------------------------------- arah kegagalan

def test_menolak_skala_yang_terlalu_kecil():
    """Benda bulat besar terbaca sebagai koin -> semua buah menyusut."""
    hasil = periksa_skala([12.0, 14.0, 11.0], "tomato_sayur")

    assert hasil["masuk_akal"] is False
    assert hasil["faktor_meleset"] > 1
    assert "lebih kecil" in hasil["alasan"]


def test_alasan_menyebut_arah_yang_benar_saat_terlalu_besar():
    hasil = periksa_skala([90000.0], "tomato_sayur")
    assert "lebih besar" in hasil["alasan"]


# ----------------------------------------------------------------- ketahanan

def test_satu_pencilan_tidak_menjatuhkan_foto_yang_selebihnya_benar():
    """
    Median, bukan rata-rata. Satu segmentasi yang menyatukan dua buah tidak
    boleh menolak foto yang sembilan objek lainnya berukuran wajar.
    """
    luas = [2800.0] * 9 + [400000.0]
    assert periksa_skala(luas, "tomato_sayur")["masuk_akal"] is True


def test_tanpa_objek_terukur_tidak_menghakimi():
    hasil = periksa_skala([], "tomato_sayur")

    assert hasil["diperiksa"] is False
    assert hasil["masuk_akal"] is True


def test_nilai_none_dan_nol_diabaikan_bukan_dihitung():
    """`ukuran_mm2` bernilai None saat kalibrasi gagal; itu bukan luas 0 mm²."""
    hasil = periksa_skala([None, 0.0, 2800.0], "tomato_sayur")

    assert hasil["diperiksa"] is True
    assert hasil["masuk_akal"] is True
    assert hasil["median_luas_mm2"] == 2800.0


def test_komoditas_tanpa_rentang_tidak_pernah_menolak():
    """
    Komoditas baru masuk lebih dulu ke model daripada ke tabel ini. Sampai
    rentangnya ditulis, gerbang harus diam — bukan menolak semua fotonya.
    """
    hasil = periksa_skala([999999.0], "kangkung")

    assert hasil["diperiksa"] is False
    assert hasil["masuk_akal"] is True


# -------------------------------------------------------------------- tabel

def test_setiap_rentang_naik_dan_cukup_lebar():
    """
    Batas atas harus jauh di atas batas bawah. Rentang yang sempit akan menolak
    panen yang sah — kesalahan yang jauh lebih mahal daripada meloloskan satu
    foto meragukan.
    """
    for dasar, (minimum, maksimum) in RENTANG_LUAS_MM2.items():
        assert minimum > 0, dasar
        assert maksimum / minimum >= 20, dasar
