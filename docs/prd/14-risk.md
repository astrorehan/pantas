<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 1817–1838.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — Risk register (R-*)  
> Sumber: `docs/PRD.md` §baris 1817–1838
>
> [← Deliverable lomba — checklist, peta proposal, pitch deck](./13-deliverable.md) · [Indeks](./00-INDEX.md) · [Backlog](../BACKLOG.md) · [Roadmap & milestone per fase →](./15-roadmap.md)

<!-- PRD-SLICE-BEGIN -->
## 20. Risk Register

| ID | Risiko | Dampak | Peluang | Mitigasi | Pemilik |
| :--- | :--- | :--- | :--- | :--- | :--- |
| R-01 | **Layanan AI di HF Spaces tidur** saat juri menilai; permintaan pertama gagal atau butuh 60 s | Kritis | Tinggi | Cron warm-keeper tiap 5 menit (NFR-11); klien mencoba ulang dengan backoff; landing memakai hasil ter-cache bila API lambat > 8 s; status layanan jujur di UI | Backend |
| R-02 | **Kamera tidak tersedia di laptop juri** | Tinggi | Tinggi | Jalur unggah setara kelas satu (F-10); 4 foto contoh siap pakai di landing & layar pindai | Frontend |
| R-03 | **Akun demo kosong atau dirusak juri lain** | Tinggi | Sedang | Cron reset tiap 6 jam (F-03); tiga akun terpisah | Backend |
| R-04 | **Proyek Supabase free tier di-pause** karena idle | Kritis | Rendah | Cron harian menyentuh DB (NFR-13); pemantauan uptime | Backend |
| R-05 | **Revamp desktop menimbulkan regresi mobile** | Tinggi | Sedang | Playwright berjalan di viewport mobile & desktop; tangkapan layar visual; lint melarang `max-w-[430px]` | Frontend |
| R-06 | **Scope creep** — fitur baru menggeser P0 | Tinggi | Tinggi | Aturan keras: tidak ada P1 sebelum semua P0 lulus acceptance; tinjauan prioritas tiap 2 hari | Lead |
| R-07 | **Bobot model besar di Git** memperlambat clone juri | Sedang | Sedang | Git LFS atau tautan rilis; README menjelaskan cara mendapatkannya | Backend |
| R-08 | **Kualitas grading buruk pada kondisi cahaya asli panggung** | Tinggi | Sedang | Uji lapangan 3 kondisi cahaya (§17.4); lampu LED di kit demo; zona peringatan blur (F-102) | AI |
| R-09 | **Jaringan venue mati** saat demo final | Kritis | Sedang | Hotspot 2 operator; PWA ter-cache; video cadangan 90 detik | Semua |
| R-10 | **Kebocoran service role key** ke bundle klien | Kritis | Rendah | Pemeriksaan grep di CI (§16.2); tinjauan kode wajib untuk perubahan env | Lead |
| R-11 | **Kuota Vercel/HF free tier terlampaui** saat penjurian | Tinggi | Rendah | Pantau penggunaan harian selama penjurian; siapkan akun cadangan | DevOps |
| R-12 | **Data demo tercampur ke angka dampak nyata**, merusak kredibilitas | Sedang | Sedang | Flag `is_demo` dan view agregat yang mengecualikannya (§11.4) | Backend |
| R-13 | **Anggota tim tidak tersedia** menjelang tenggat | Tinggi | Sedang | Semua pekerjaan terlacak di issue publik; tanpa pengetahuan yang hanya ada di satu kepala; dokumentasi arsitektur di repositori | Lead |
| R-14 | ~~`chili_cls.pt` masih dalam pelatihan~~ **Ditutup.** Bobotnya ada, `model.py` memuatnya tanpa pengecualian komoditas, dan vetonya berjalan. Risiko sisa berpindah bentuk: set validasi cabai hanya 16 potongan (81,3%), jadi angkanya tidak boleh dikutip sebagai akurasi lapangan | Sedang | Sedang | Klaim cabai selalu disertai ukuran splitnya. Perbesar set validasi cabai untuk v1.1; set regresi (F-100) sudah mencakup cabai | AI |
| R-15 | **Akurasi validasi wortel 100,0%** terbukti optimistis: split dibagi per potongan objek, bukan per gambar sumber, sehingga 73 dari 85 sumber validasi juga ada di sisi latih (F-107). Risiko sekarang bukan lagi angkanya, melainkan mengutipnya tanpa peringatan itu | Tinggi | Rendah | Angka, ukuran split, dan peringatan kebocoran selalu tampil bersama-sama di kartu model dan `/tentang/model`. Split ulang per gambar sumber masuk v1.1 | AI |

---

