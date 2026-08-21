"""
Gerbang kewajaran skala kalibrasi.

`AutoCalibrator` menjawab satu pertanyaan saja: "adakah sesuatu yang berbentuk
lingkaran di foto ini?" Kalau ada, hasilnya dipakai sebagai skala piksel-ke-
milimeter dan `kalibrasi.valid` berbunyi `true`. Tidak ada satu pun langkah yang
menanyakan apakah skala itu masuk akal — sehingga tutup botol, uang logam
pecahan lain, atau tomat bulat yang kebetulan tersorot bisa lolos sebagai "koin
Rp500" dan seluruh laporan dibangun di atas penggaris yang salah panjang.

Akibatnya bukan sekadar berat yang meleset. `grading_engine` mengambil keputusan
grade dari `area_mm2` (ambang `min_area_A` / `min_area_B`), jadi skala yang
melar 12x membuat setiap objek melampaui ambang Grade A. Satu pindaian nyata di
produksi menghasilkan dua butir tomat seluas 151.000 mm² masing-masing, 11,86 kg
berdua, komposisi A 100% — dan `valid: true` di sampingnya.

Karena itu gerbang ini menolak fotonya, bukan sekadar mengosongkan berat: bila
penggarisnya salah, gradenya ikut salah, dan laporan yang salah lebih berbahaya
daripada laporan yang tidak jadi.

Rentangnya sengaja longgar — dua sampai tiga kali lebih lebar dari ukuran pasar
yang wajar di tiap sisi. Yang ingin ditangkap adalah kesalahan berlipat ganda
(skala meleset 5x, 10x, 100x), bukan panen yang kebetulan besar.
"""

# Luas terproyeksi satu buah, mm². Batasnya diturunkan dari dimensi pasar lalu
# dilonggarkan; angka dalam kurung adalah perhitungan sebelum pelonggaran.
#
#   tomato    ceri Ø15 mm -> pi*7,5^2 = 177 ; beef Ø100 mm -> pi*50^2 = 7.854
#   chili     rawit 25x6 mm = 150       ; keriting 140x15 mm = 2.100
#   carrot    120x30 mm = 3.600         ; besar 250x50 mm = 12.500
#   cucumber  180x40 mm = 7.200         ; besar 350x60 mm = 21.000
#
# Kuncinya kata dasar komoditas, sama seperti `densitas_faktor.json`, supaya
# "tomato_ceri" dan "tomato_beef" dinilai dengan rentang yang sama — keduanya
# ada di dalam satu rentang itu.
RENTANG_LUAS_MM2 = {
    "tomato": (100.0, 12000.0),
    "chili": (30.0, 5000.0),
    "carrot": (500.0, 20000.0),
    "cucumber": (800.0, 30000.0),
}


def _ribuan(n: float) -> str:
    """1234567 -> "1.234.567". Pemisah ribuan Indonesia, bukan koma Inggris."""
    return f"{int(n):,}".replace(",", ".")


def _desimal(n: float) -> str:
    """12.6 -> "12,6". Koma desimal, sesuai kalimat yang dibaca petani."""
    return f"{n:.1f}".replace(".", ",")


def _median(nilai: list[float]) -> float:
    urut = sorted(nilai)
    n = len(urut)
    tengah = n // 2
    if n % 2:
        return urut[tengah]
    return (urut[tengah - 1] + urut[tengah]) / 2.0


def periksa_skala(luas_mm2: list[float], commodity_specific: str) -> dict:
    """
    Nilai apakah skala kalibrasi menghasilkan ukuran buah yang mungkin secara
    fisik.

    Args:
        luas_mm2: luas terkalibrasi tiap objek terdeteksi (mm²).
        commodity_specific: mis. "tomato_ceri"; rentangnya dicari per kata dasar.

    Returns:
        dict dengan `diperiksa` dan `masuk_akal`. `diperiksa: False` berarti
        tidak ada dasar untuk menilai — komoditas tanpa rentang, atau tidak ada
        objek terukur — dan `masuk_akal` ikut True supaya ketiadaan data tidak
        pernah menjadi alasan menolak foto. Saat gagal, `alasan` sudah berupa
        kalimat yang bisa langsung dibaca petani.
    """
    dasar = commodity_specific.split("_")[0]
    rentang = RENTANG_LUAS_MM2.get(dasar)

    terukur = [float(a) for a in luas_mm2 if a is not None and float(a) > 0]

    if rentang is None or not terukur:
        return {
            "diperiksa": False,
            "masuk_akal": True,
            "komoditas": dasar,
            "alasan": None,
        }

    minimum, maksimum = rentang
    # Median, bukan rata-rata: satu bercak salah segmentasi tidak boleh
    # menjatuhkan foto yang selebihnya benar.
    tengah = _median(terukur)

    hasil = {
        "diperiksa": True,
        "masuk_akal": True,
        "komoditas": dasar,
        "median_luas_mm2": round(tengah, 1),
        "rentang_wajar_mm2": [minimum, maksimum],
        "alasan": None,
    }

    if tengah > maksimum:
        hasil["masuk_akal"] = False
        hasil["faktor_meleset"] = round(tengah / maksimum, 1)
        hasil["alasan"] = (
            f"Kalibrasi tidak wajar: hasilnya membuat satu buah seluas "
            f"{_ribuan(tengah)} mm², sekitar {_desimal(hasil['faktor_meleset'])}x "
            f"lebih besar daripada buah terbesar yang mungkin. Kemungkinan besar "
            f"yang terbaca sebagai koin Rp500 bukan koin, atau fotonya terlalu "
            f"dekat. Letakkan koin Rp500 rata di samping panen lalu foto ulang "
            f"dari jarak yang memuat seluruh tumpukan."
        )
    elif tengah < minimum:
        hasil["masuk_akal"] = False
        hasil["faktor_meleset"] = round(minimum / tengah, 1)
        hasil["alasan"] = (
            f"Kalibrasi tidak wajar: hasilnya membuat satu buah seluas "
            f"{_ribuan(tengah)} mm², sekitar {_desimal(hasil['faktor_meleset'])}x "
            f"lebih kecil daripada buah terkecil yang mungkin. Kemungkinan besar "
            f"ada benda bulat lain yang terbaca sebagai koin. Pastikan hanya koin "
            f"Rp500 yang ada di dalam bingkai, lalu foto ulang."
        )

    return hasil
