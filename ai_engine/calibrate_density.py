"""
Kalibrasi ulang faktor densitas dari serah terima nyata (F-101).

Sumbernya `public.densitas_kalibrasi_view` (supabase/migrations/0010): satu
baris per pesanan selesai yang punya luas terkalibrasi *dan* berat timbangan.
Skrip ini merangkumnya menjadi satu faktor gram/mm² per komoditas, lalu
menuliskannya kembali ke `densitas_faktor.json`.

Yang dipakai median, bukan rata-rata: satu foto dengan sebagian tumpukan di
luar bingkai menghasilkan gram/mm² raksasa, dan rata-rata akan mengikutinya.
Ketidakpastian dihitung dari sebaran contoh itu sendiri, bukan ditebak.

Pemakaian:

    # langsung dari Supabase (butuh service role: view-nya security_invoker)
    SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \\
        python calibrate_density.py

    # dari ekspor CSV view yang sama
    python calibrate_density.py --csv kalibrasi.csv

    # lihat hasilnya tanpa menulis berkas
    python calibrate_density.py --dry-run

Komoditas dengan contoh di bawah --min-sampel tidak disentuh: faktor bawaannya
tetap dipakai, dan `n_sampel` tetap 0 supaya UI terus menyatakan angka itu
belum tervalidasi lapangan.
"""

import argparse
import csv
import json
import os
import statistics
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

FAKTOR_PATH = Path(__file__).parent / "densitas_faktor.json"
VIEW = "densitas_kalibrasi_view"

# Di bawah ini sebaran mediannya belum berarti apa-apa; satu pesanan tidak
# mengkalibrasi apa pun.
MIN_SAMPEL_BAWAAN = 8

# Batas ketidakpastian yang dilaporkan. Bawah: bahkan timbangan yang cocok
# sempurna tidak membuat estimasi luas jadi presisi 2%. Atas: kalau sebarannya
# lebih lebar dari ini, angkanya tidak layak dipakai sama sekali.
REL_MIN = 0.08
REL_MAX = 0.60


def ambil_dari_supabase() -> list:
    """Baca view lewat PostgREST. Service role karena view-nya security_invoker."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        sys.exit(
            "SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY belum diisi. "
            "Pakai --csv bila datanya sudah diekspor."
        )

    endpoint = (
        url.rstrip("/")
        + f"/rest/v1/{VIEW}?"
        + urllib.parse.urlencode({"select": "komoditas_dasar,gram_per_mm2"})
    )
    req = urllib.request.Request(
        endpoint,
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.URLError as e:
        sys.exit(f"Gagal membaca {VIEW}: {e}")


def ambil_dari_csv(path: str) -> list:
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def kelompokkan(baris: list) -> dict:
    """{'tomato': [0.0391, 0.0402, ...]} — baris tanpa angka valid dibuang."""
    per_komoditas: dict = {}
    for r in baris:
        dasar = (r.get("komoditas_dasar") or "").strip()
        try:
            nilai = float(r.get("gram_per_mm2"))
        except (TypeError, ValueError):
            continue
        if not dasar or nilai <= 0:
            continue
        per_komoditas.setdefault(dasar, []).append(nilai)
    return per_komoditas


def rangkum(nilai: list) -> tuple:
    """(faktor, rel_ketidakpastian) dari median dan sebaran relatifnya."""
    median = statistics.median(nilai)
    if len(nilai) >= 2 and median > 0:
        # Deviasi absolut median: tahan terhadap satu foto yang salah bingkai,
        # tidak seperti simpangan baku.
        mad = statistics.median([abs(v - median) for v in nilai])
        # 1,4826 menyetarakan MAD dengan simpangan baku pada sebaran normal.
        rel = (1.4826 * mad) / median
    else:
        rel = REL_MAX
    return round(median, 6), round(min(REL_MAX, max(REL_MIN, rel)), 3)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--csv", help="Ekspor CSV densitas_kalibrasi_view")
    ap.add_argument("--min-sampel", type=int, default=MIN_SAMPEL_BAWAAN)
    ap.add_argument("--dry-run", action="store_true", help="Tampilkan saja, jangan tulis")
    args = ap.parse_args()

    baris = ambil_dari_csv(args.csv) if args.csv else ambil_dari_supabase()
    per_komoditas = kelompokkan(baris)
    if not per_komoditas:
        sys.exit("Tidak ada baris kalibrasi yang bisa dipakai.")

    with open(FAKTOR_PATH, "r", encoding="utf-8") as f:
        berkas = json.load(f)
    faktor = berkas.setdefault("faktor", {})

    diperbarui, dilewati = [], []
    for dasar, nilai in sorted(per_komoditas.items()):
        if dasar not in faktor:
            dilewati.append(f"{dasar}: bukan komoditas yang dikenal engine")
            continue
        if len(nilai) < args.min_sampel:
            dilewati.append(
                f"{dasar}: {len(nilai)} contoh, di bawah minimum {args.min_sampel}"
            )
            continue

        gram_per_mm2, rel = rangkum(nilai)
        entri = faktor[dasar]
        lama = entri.get("gram_per_mm2")
        entri.update(
            {
                "gram_per_mm2": gram_per_mm2,
                "rel_ketidakpastian": rel,
                "n_sampel": len(nilai),
                "sumber": (
                    f"Kalibrasi lapangan PANTAS: median {len(nilai)} serah terima "
                    f"(public.{VIEW}), {date.today().isoformat()}"
                ),
                "catatan": (
                    "Median gram/mm² dari pasangan luas terkalibrasi dan berat "
                    "timbangan; ketidakpastian dari deviasi absolut median."
                ),
            }
        )
        diperbarui.append(f"{dasar}: {lama} -> {gram_per_mm2} (±{rel:.0%}, n={len(nilai)})")

    for garis in diperbarui:
        print("perbarui  " + garis)
    for garis in dilewati:
        print("lewati    " + garis)

    if args.dry_run:
        print("\n--dry-run: densitas_faktor.json tidak diubah.")
        return
    if not diperbarui:
        print("\nTidak ada yang memenuhi syarat; berkas dibiarkan apa adanya.")
        return

    berkas["_diperbarui"] = date.today().isoformat()
    berkas["_versi"] = int(berkas.get("_versi", 1)) + 1
    with open(FAKTOR_PATH, "w", encoding="utf-8") as f:
        json.dump(berkas, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"\n{FAKTOR_PATH.name} ditulis ulang ({len(diperbarui)} komoditas).")


if __name__ == "__main__":
    main()
