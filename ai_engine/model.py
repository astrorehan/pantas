import sys
from pathlib import Path
import cv2
import numpy as np

# Tambahkan path ai_engine agar bisa membaca modul lain di folder ini
ROOT_DIR = Path(__file__).parent
sys.path.append(str(ROOT_DIR))

from grading_engine import GradingEngine
from calibration import AutoCalibrator
from weight_estimator import estimasi_berat
from plausibilitas import periksa_skala
from ultralytics import YOLO
import threading
from pathlib import Path
import cv2
import numpy as np

# Tambahkan path ai_engine agar bisa membaca modul lain di folder ini
ROOT_DIR = Path(__file__).parent
sys.path.append(str(ROOT_DIR))

from grading_engine import GradingEngine
from calibration import AutoCalibrator
from weight_estimator import estimasi_berat
from plausibilitas import periksa_skala
from ultralytics import YOLO

class PantasModel:
    def __init__(self):
        """
        Sang Mandor AI (PantasModel).
        Bertugas memuat model YOLO ke dalam memori secara efisien dan
        mengorkestrasi GradingEngine serta AutoCalibrator.
        """
        self.yolo_models = {}
        self.yolo2_models = {}
        self.calibrator = AutoCalibrator()
        self._lock = threading.Lock()

    def _get_yolo_model(self, commodity: str):
        """Mekanisme Caching Thread-Safe: Load model ONNX atau PyTorch jika belum ada di memori."""
        if commodity not in self.yolo_models:
            with self._lock:
                if commodity not in self.yolo_models:
                    onnx_path = ROOT_DIR / "export_models" / f"{commodity}_seg.onnx"
                    pt_path = ROOT_DIR / "export_models" / f"{commodity}_seg.pt"
                    model_path = onnx_path if onnx_path.exists() else pt_path
                    if not model_path.exists():
                        raise FileNotFoundError(f"Model YOLO untuk '{commodity}' tidak ditemukan di {pt_path}")
                    self.yolo_models[commodity] = YOLO(str(model_path))
        return self.yolo_models[commodity]

    def _get_yolo2_model(self, commodity: str):
        """Mekanisme Caching Thread-Safe: Load model YOLO 2 Klasifikasi ONNX atau PyTorch jika belum ada di memori."""
        if commodity not in self.yolo2_models:
            with self._lock:
                if commodity not in self.yolo2_models:
                    onnx_path = ROOT_DIR / "export_models" / f"{commodity}_cls.onnx"
                    pt_path = ROOT_DIR / "export_models" / f"{commodity}_cls.pt"
                    model_path = onnx_path if onnx_path.exists() else pt_path
                    if not model_path.exists():
                        raise FileNotFoundError(f"Model YOLO 2 (Klasifikasi) untuk '{commodity}' tidak ditemukan di {pt_path}")
                    self.yolo2_models[commodity] = YOLO(str(model_path))
        return self.yolo2_models[commodity]

    def predict(self, img_array, commodity_specific: str, roi=None):
        """
        Fungsi Utama Inference AI.
        
        Args:
            img_array: numpy array dari OpenCV image (BGR).
            commodity_specific: Jenis komoditas spesifik (misal: "tomato_ceri", "chili_rawit").
            roi: Tuple (x, y, w, h) untuk kotak pencarian koin.
            
        Returns:
            dict_results: Dictionary berisi data analitik lengkap.
            annotated_img: Gambar OpenCV yang sudah digambar Bounding Box & Grade.
        """
        import hashlib
        import json
        
        # 0. Gerbang Kualitas Foto (Cek Kecerahan/Terlalu Gelap, Silau/Pantulan Cahaya, & Blur)
        gray_img = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
        
        mean_brightness = float(np.mean(gray_img))
        if mean_brightness < 20.0:
            return {
                "status": "error",
                "message": f"Foto ditolak (terlalu gelap). Kecerahan {int(mean_brightness)} di bawah standar (minimal 20). Mohon beri pencahayaan cukup."
            }, img_array

        glare_ratio = float(np.sum(gray_img >= 250)) / float(gray_img.size)
        if glare_ratio > 0.15:
            return {
                "status": "error",
                "message": f"Foto ditolak (terlalu silau/pantulan cahaya). Area silau {glare_ratio * 100:.1f}% melebihi batas 15%. Mohon atur pencahayaan agar tidak silau."
            }, img_array

        blur_score = cv2.Laplacian(gray_img, cv2.CV_64F).var()
        if blur_score < 10:
            return {
                "status": "error", 
                "message": f"Foto ditolak (terlalu blur). Skor ketajaman {int(blur_score)} di bawah standar."
            }, img_array

        commodity_base = commodity_specific.split("_")[0]
        model = self._get_yolo_model(commodity_base)
        model_cls = self._get_yolo2_model(commodity_base)
        grader = GradingEngine(commodity_specific)
        
        # 1. Kalibrasi Kamera dengan Koin
        pixel_ratio, coin_contour = self.calibrator.get_pixel_ratio(img_array, roi=roi)
        is_calibrated = coin_contour is not None
        
        # 1b. Gerbang Kualitas Foto (Cek Sudut Kemiringan Koin)
        if is_calibrated and coin_contour is not None:
            try:
                if len(coin_contour) >= 5:
                    ellipse = cv2.fitEllipse(coin_contour)
                    d1, d2 = ellipse[1]
                    minor_axis = min(d1, d2)
                    major_axis = max(d1, d2)
                else:
                    x_c, y_c, w_c, h_c = cv2.boundingRect(coin_contour)
                    minor_axis = min(w_c, h_c)
                    major_axis = max(w_c, h_c)
                
                tilt_ratio = (minor_axis / major_axis) if major_axis > 0 else 1.0
            except Exception:
                tilt_ratio = 1.0

            if tilt_ratio < 0.70:
                return {
                    "status": "error",
                    "message": f"Foto ditolak (sudut pengambilan miring). Koin terdeteksi memiliki rasio kebundaran {tilt_ratio:.2f} (< 0.70), menunjukkan kamera terlalu miring (>45°). Mohon posisikan kamera tegak lurus tepat di atas tumpukan panen.",
                    "kalibrasi": {
                        "referensi": "koin_500",
                        "valid": False,
                        "tilt_ratio": round(tilt_ratio, 2),
                        "catatan": "Koin terdeteksi terlalu miring (>45°)"
                    }
                }, img_array

        annotated_img = img_array.copy()
        
        # Gambar panduan koin
        if is_calibrated:
            cv2.drawContours(annotated_img, [coin_contour], -1, (255, 0, 0), 2)
            cv2.putText(annotated_img, "KOIN", (coin_contour[0][0][0], coin_contour[0][0][1] - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

        # 2. Prediksi AI (YOLO Segmentasi)
        results = model.predict(source=img_array, save=False, verbose=False)
        grading_results = []
        
        # 3. Ekstraksi Fakta & Rule Engine
        for r in results:
            if r.masks is not None:
                for i, mask_xy in enumerate(r.masks.xy):
                    contour = np.array(mask_xy, dtype=np.int32).reshape((-1, 1, 2))
                    
                    if cv2.contourArea(contour) < 500:
                        continue 

                    # OpenCV Rule Engine Berjalan
                    grade_result = grader.evaluate(img_array, contour, pixel_ratio)
                    grade = grade_result['grade']
                    
                    # Konversi bounding box untuk cacat (simplified)
                    x, y, w, h = cv2.boundingRect(contour)
                    
                    # --- INTERVENSI YOLO 2 (AHLI PATOLOGI) ---
                    # Buat mask dari contour
                    mask_img = np.zeros(img_array.shape[:2], dtype=np.uint8)
                    cv2.drawContours(mask_img, [contour], -1, 255, -1)
                    
                    # Trik Cerdas: Ubah latar belakang menjadi PUTIH (Bukan Hitam)
                    # Karena YOLO 2 dilatih dengan gambar Google (latar putih = sehat)
                    tomato_only_img = np.full_like(img_array, (255, 255, 255))
                    cv2.copyTo(src=img_array, mask=mask_img, dst=tomato_only_img)
                    
                    # Tambahkan padding 10% agar buah tidak terpotong ketat
                    pad_x = int(w * 0.1)
                    pad_y = int(h * 0.1)
                    img_h, img_w = tomato_only_img.shape[:2]
                    
                    crop_x1 = max(0, x - pad_x)
                    crop_y1 = max(0, y - pad_y)
                    crop_x2 = min(img_w, x + w + pad_x)
                    crop_y2 = min(img_h, y + h + pad_y)
                    
                    # Crop dari gambar yang sudah bersih dari latar belakang
                    crop_img = tomato_only_img[crop_y1:crop_y2, crop_x1:crop_x2]
                    
                    # Prediksi kesehatan menggunakan YOLO 2
                    if crop_img.shape[0] > 0 and crop_img.shape[1] > 0:
                        yolo2_res = model_cls.predict(source=crop_img, save=False, verbose=False)[0]
                        top_class_idx = yolo2_res.probs.top1
                        top_class_name = yolo2_res.names[top_class_idx]
                        top_class_conf = float(yolo2_res.probs.top1conf)
                        
                        # Terapkan Logika VETO (Saksi Konfirmasi, bukan Hakim Mutlak)
                        VETO_CONF_MIN = 0.85
                        has_bercak = any(
                            c["jenis"] in ("bercak_busuk", "bercak_ringan")
                            for c in grade_result["cacat"]
                        )
                        
                        if (top_class_name == "busuk" 
                                and top_class_conf >= VETO_CONF_MIN 
                                and has_bercak):
                            if "REJECT" not in grade:
                                grade = "REJECT"
                                grade_result['grade'] = "REJECT"
                                grade_result['alasan_grade'].append(f"VETO YOLO 2: Terdeteksi penyakit/busuk ({top_class_conf*100:.1f}%)")
                    else:
                        top_class_name = "unknown"
                        top_class_conf = 0.0
                    # ----------------------------------------
                    
                    # Sederhanakan koordinat poligon untuk rendering SVG interaktif di frontend
                    perimeter = cv2.arcLength(contour, True)
                    approx_poly = cv2.approxPolyDP(contour, 0.005 * perimeter if perimeter > 0 else 0.01, True)
                    polygon_pts = approx_poly.reshape(-1, 2).tolist()

                    grading_results.append({
                        "id": i + 1,
                        "grade": grade,
                        "ukuran_mm2": round(grade_result['area_mm2'], 1) if is_calibrated else None,
                        "solidity": round(grade_result['solidity'], 2),
                        "circularity": round(grade_result['circularity'], 2),
                        "color_status": grade_result['color_status'],
                        "color_score": grade_result.get('color_score', 0),
                        "cacat": grade_result['cacat'],
                        "alasan_grade": grade_result['alasan_grade'],
                        "yolo2_kondisi": top_class_name,
                        "yolo2_conf": round(top_class_conf, 2),
                        "poligon": polygon_pts,
                        "bbox": [x, y, w, h]
                    })

                    # Visualisasi Bounding Box & Grade
                    if "A" in grade: color = (0, 255, 0)
                    elif "B" in grade: color = (0, 255, 255)
                    elif "C" in grade: color = (0, 0, 255)
                    else: color = (0, 0, 255) # REJECT = Merah terang

                    cv2.drawContours(annotated_img, [contour], -1, color, 2)
                    
                    M = cv2.moments(contour)
                    if M["m00"] != 0:
                        cX = int(M["m10"] / M["m00"])
                        cY = int(M["m01"] / M["m00"])
                    else:
                        cX, cY = contour[0][0][0], contour[0][0][1]

                    txt = f"{grade[:1]}" if "REJECT" not in grade else "X"
                    cv2.putText(annotated_img, txt, (cX - 15, cY), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

        # 3b. Gerbang Kewajaran Skala
        # Kalibrasi yang "berhasil" hanya berarti ada benda bulat yang terbaca.
        # Kalau skalanya menghasilkan buah sebesar nampan, penggarisnya salah —
        # dan karena ambang grade dibaca dari `area_mm2`, gradenya ikut salah.
        # Foto ditolak seluruhnya, bukan sekadar beratnya dikosongkan.
        skala = (
            periksa_skala(
                [r["ukuran_mm2"] for r in grading_results], commodity_specific
            )
            if is_calibrated
            else {"diperiksa": False, "masuk_akal": True, "alasan": None}
        )

        if not skala["masuk_akal"]:
            return {
                "status": "error",
                "message": skala["alasan"],
                # Ikut dikembalikan supaya kegagalan ini bisa ditelusuri tanpa
                # menjalankan ulang pipeline atas foto yang sudah tidak ada.
                "kalibrasi": {
                    "referensi": "koin_500",
                    "px_per_mm2": round(pixel_ratio, 4),
                    "valid": False,
                    "plausibilitas": skala,
                },
            }, annotated_img

        # Hitung Ringkasan Batch
        total_obj = len(grading_results)
        grade_counts = {"A": 0, "B": 0, "C": 0, "REJECT": 0}
        for res in grading_results:
            g = res["grade"][0] if "REJECT" not in res["grade"] else "REJECT"
            if g in grade_counts: grade_counts[g] += 1
            
        komposisi = {k: round(v/total_obj, 2) for k, v in grade_counts.items()} if total_obj > 0 else {}

        # Hitung Skor Keseragaman dari std dev ukuran
        if total_obj > 1:
            sizes = [r['ukuran_mm2'] if r['ukuran_mm2'] else r['bbox'][2] * r['bbox'][3] for r in grading_results]
            mean_size = np.mean(sizes)
            std_size = np.std(sizes)
            cv_coeff = std_size / mean_size if mean_size > 0 else 0
            skor_keseragaman = round(max(0, 1 - cv_coeff), 2)
        else:
            skor_keseragaman = 1.0

        # Struktur Output Final (Sesuai Proposal)
        dict_results = {
            "status": "success",
            "komoditas": commodity_specific,
            "peringatan_komoditas": self._evaluasi_mismatch_komoditas(grading_results, commodity_specific),
            "objek_terdeteksi": total_obj,
            "kalibrasi": {
                "referensi": "koin_500",
                "px_per_mm2": round(pixel_ratio, 4),
                "valid": is_calibrated,
                # Ikut di jalur sukses juga: laporan yang lolos harus bisa
                # menunjukkan bahwa pemeriksaannya memang dijalankan, bukan
                # hanya diam saat gagal.
                "plausibilitas": skala,
            },
            "ringkasan_batch": {
                "komposisi": komposisi,
                "skor_keseragaman": skor_keseragaman,
                # F-101 — selalu rentang, tidak pernah satu angka telanjang.
                # `tersedia: False` saat kalibrasi gagal atau komoditasnya
                # belum punya faktor; layar hasil menampilkan alasannya.
                "estimasi_berat": estimasi_berat(
                    grading_results, commodity_specific, is_calibrated
                )
            },
            "objek": grading_results
        }
        
        # Buat Hash Audit (SHA256 dari JSON string)
        json_str = json.dumps(dict_results, sort_keys=True)
        dict_results["hash_audit"] = "sha256:" + hashlib.sha256(json_str.encode()).hexdigest()
        
        return dict_results, annotated_img

    @staticmethod
    def _evaluasi_mismatch_komoditas(grading_results: list, commodity_specific: str) -> dict:
        """
        Deteksi otomatis ketidakcocokan komoditas pilihan pengguna dengan fitur fisik objek.
        Misal: Memilih 'tomato_sayur' tetapi objek terdeteksi lonjong (Cabai / Timun).
        """
        dasar = commodity_specific.split("_")[0]
        if not grading_results:
            return {
                "mismatch": False,
                "komoditas_dipilih": commodity_specific,
                "saran_komoditas": None,
                "pesan": None
            }

        circularities = [r["circularity"] for r in grading_results if r.get("circularity") is not None]
        aspect_ratios = []
        for r in grading_results:
            bbox = r.get("bbox") or [0, 0, 1, 1]
            w, h = bbox[2], bbox[3]
            if w > 0 and h > 0:
                aspect_ratios.append(max(w, h) / min(w, h))

        med_circ = float(np.median(circularities)) if circularities else 0.8
        med_ar = float(np.median(aspect_ratios)) if aspect_ratios else 1.0

        saran = None
        pesan = None
        mismatch = False

        if dasar == "tomato":
            if med_ar > 2.2 and med_circ < 0.55:
                mismatch = True
                saran = "chili_merah_besar" if med_ar > 3.0 else "cucumber_lokal"
                pesan = (
                    f"Objek terdeteksi memiliki bentuk lonjong (rasio aspek {med_ar:.1f}), "
                    f"yang lebih mirip dengan karakter Cabai/Timun ketimbang Tomat. "
                    f"Apakah Anda bermaksud memilih komoditas '{saran}'?"
                )
        elif dasar in ("chili", "cucumber", "carrot"):
            if med_ar < 1.3 and med_circ > 0.75:
                mismatch = True
                saran = "tomato_sayur"
                pesan = (
                    f"Objek terdeteksi memiliki bentuk simetris bulat (kebundaran {med_circ:.2f}), "
                    f"yang lebih mirip dengan Tomat ketimbang '{dasar.capitalize()}'. "
                    f"Apakah Anda bermaksud memilih komoditas Tomat?"
                )

        return {
            "mismatch": mismatch,
            "komoditas_dipilih": commodity_specific,
            "saran_komoditas": saran,
            "pesan": pesan
        }
