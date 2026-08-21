import cv2
import numpy as np


class AutoCalibrator:
    """Mengubah luas koin Rp500 di foto menjadi rasio mm² per piksel."""

    def __init__(self, ref_area_mm2=572.5):
        # Default: Koin Rp 500 (Kuning/Baru). Diameter 27mm -> Luas = pi * (13.5)^2 = 572.55 mm2
        self.ref_area_mm2 = ref_area_mm2

    def get_pixel_ratio(self, image, roi=None):
        """
        Mencari objek koin di gambar dan mengembalikan rasio (mm2 per pixel).
        Jika 'roi' (Region of Interest) diberikan (x, y, w, h), pencarian koin
        HANYA dilakukan di dalam kotak tersebut agar tidak tertukar dengan tomat bulat.
        """
        if roi is not None:
            # Koin sering meleset dari lingkaran panduan: video dirender
            # object-cover jadi apa yang dilihat petani bukan persis apa yang
            # terekam, plus tangan bergeser.
            # Percobaan 1: tepat di dalam kotak ROI
            # Percobaan 2: perluasan ROI 2.5x
            # Percobaan 3: cari di SELURUH foto (fallback otomatis agar koin tetap ketemu walau di luar lingkaran!)
            attempts = [
                (roi, True),
                (self._grow(roi, image.shape, 2.5), True),
                (None, False),
            ]
        else:
            attempts = [(None, False)]

        for area, tight in attempts:
            found = self._detect(image, area, tight)
            if found is not None:
                coin_area_px, contour = found
                # Rasio = Luas asli koin (mm2) / Luas koin di gambar (Piksel)
                return self.ref_area_mm2 / coin_area_px, contour

        # Jika koin tidak terdeteksi (Gagal kalibrasi)
        # Fallback rasio statis sementara (asumsi jarak kamera standar)
        return 0.5, None

    # ------------------------------------------------------------------ #

    @staticmethod
    def _grow(roi, shape, factor):
        """Perbesar kotak ROI dari titik tengahnya, dipotong ke batas gambar."""
        x, y, w, h = roi
        cx, cy = x + w / 2, y + h / 2
        w, h = w * factor, h * factor
        x0, y0 = max(0, int(cx - w / 2)), max(0, int(cy - h / 2))
        x1, y1 = min(shape[1], int(cx + w / 2)), min(shape[0], int(cy + h / 2))
        return (x0, y0, x1 - x0, y1 - y0)

    def _detect(self, image, roi, tight):
        """Kembalikan (luas_px, kontur pada koordinat gambar asli) atau None."""
        if roi is not None:
            x, y, w, h = roi
            search = image[y:y + h, x:x + w]
            off_x, off_y = x, y
        else:
            search = image
            off_x, off_y = 0, 0

        if search.size == 0:
            return None

        gray = cv2.cvtColor(search, cv2.COLOR_BGR2GRAY)
        # Kernel blur ikut ukuran area. (11, 11) tetap adalah penyebab utama
        # "kalibrasi gagal": pada koin ~50 px tepinya ikut terhapus.
        k = max(3, min(int(min(search.shape[:2]) / 40) | 1, 11))
        blurred = cv2.GaussianBlur(gray, (k, k), 0)

        min_dim = min(search.shape[:2])
        if tight:
            # Di dalam kotak panduan ROI: koin berukuran logis (maksimal 28% dimensi kotak)
            # agar tidak salah mendeteksi batas kotak ROI atau pola ubin lantai
            min_r = max(8, int(min_dim * 0.04))
            max_r = max(min_r + 5, int(min_dim * 0.28))
        else:
            # Seluruh foto: koin hanya sebagian kecil bingkai (maksimal 12% dimensi foto)
            min_r = max(8, int(min_dim * 0.012))
            max_r = max(min_r + 5, int(min_dim * 0.12))

        edges = cv2.Canny(blurred, 30, 150)

        # Kontur dulu: luasnya eksak. Gunakan RETR_LIST agar koin di dalam garis
        # ubin lantai tetap ditemukan.
        found = self._contour_scan(blurred, edges, off_x, off_y, min_r, max_r)
        if found is not None:
            return found

        circle = self._hough(blurred, edges, min_r, max_r)
        if circle is not None:
            cx, cy, r = circle
            return float(np.pi * r * r), self._circle_contour(cx + off_x, cy + off_y, r)

        return None

    @staticmethod
    def _circle_edge_score(edges, cx, cy, r):
        """Menghitung persentase kelengkapan tepi (Canny edge) di sekeliling lingkaran."""
        if r <= 3 or cx - r < 0 or cy - r < 0 or cx + r >= edges.shape[1] or cy + r >= edges.shape[0]:
            return 0.0
        angles = np.linspace(0, 2 * np.pi, 36, endpoint=False)
        xs = np.round(cx + r * np.cos(angles)).astype(int)
        ys = np.round(cy + r * np.sin(angles)).astype(int)

        hits = 0
        for x, y in zip(xs, ys):
            x0, x1 = max(0, x - 2), min(edges.shape[1], x + 3)
            y0, y1 = max(0, y - 2), min(edges.shape[0], y + 3)
            if np.any(edges[y0:y1, x0:x1] > 0):
                hits += 1
        return hits / 36.0

    def _hough(self, blurred, edges, min_r, max_r):
        """Hough menangani koin yang tepinya putus karena bayangan/pantulan."""
        circles = cv2.HoughCircles(
            blurred, cv2.HOUGH_GRADIENT, dp=1.2,
            minDist=max(10, min_r * 2), param1=120, param2=20,
            minRadius=min_r, maxRadius=max_r,
        )
        if circles is None:
            return None

        best_circle = None
        best_score = 0.0
        for circle in circles[0]:
            cx, cy, r = np.round(circle).astype(int)
            score = self._circle_edge_score(edges, cx, cy, r)
            # Koin nyata memiliki tepi Canny keliling yang konsisten (>= 50%)
            if score >= 0.50 and score > best_score:
                best_circle = (cx, cy, r)
                best_score = score

        if best_circle is None:
            # Jika tidak ada yang mencapai 50%, ambil lingkaran terkecil dengan skor >= 35%
            # untuk menghindari salah memilih lingkaran raksasa dari pola ubin lantai
            valid_circles = []
            for circle in circles[0]:
                cx, cy, r = np.round(circle).astype(int)
                score = self._circle_edge_score(edges, cx, cy, r)
                if score >= 0.35:
                    valid_circles.append((r, cx, cy))
            if valid_circles:
                valid_circles.sort(key=lambda x: x[0])  # Prioritaskan radius terkecil (koin)
                return (valid_circles[0][1], valid_circles[0][2], valid_circles[0][0])
            return None

        return best_circle

    @staticmethod
    def _circle_contour(cx, cy, r, points=48):
        t = np.linspace(0, 2 * np.pi, points, endpoint=False)
        pts = np.stack([cx + r * np.cos(t), cy + r * np.sin(t)], axis=1)
        return pts.astype(np.int32).reshape((-1, 1, 2))

    def _contour_scan(self, blurred, edges, off_x, off_y, min_r, max_r):
        """Cadangan bila Hough tidak menemukan apa pun."""
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
        contours, _ = cv2.findContours(closed, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

        min_area = np.pi * min_r * min_r * 0.5
        max_area = np.pi * max_r * max_r * 1.5

        best, best_score = None, 0.0
        for c in contours:
            area = cv2.contourArea(c)
            if area < min_area or area > max_area:
                continue

            (cx, cy), radius = cv2.minEnclosingCircle(c)
            if radius <= 0:
                continue

            fill = area / (np.pi * radius * radius)
            if fill < 0.65:
                continue

            edge_score = self._circle_edge_score(edges, int(cx), int(cy), int(radius))
            # Gabungan kebulatan kontur dan kelengkapan tepi Canny
            total_score = fill * 0.5 + edge_score * 0.5
            if total_score > best_score:
                best, best_score = c, total_score

        if best is None:
            return None
        return cv2.contourArea(best), best + [off_x, off_y]
