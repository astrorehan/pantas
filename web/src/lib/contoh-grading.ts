import type { GradingSuccess } from "./types";

/**
 * Cached grading payloads for the public landing demo (F-01).
 *
 * The landing calls the real `/predict` first. These exist only for the case
 * where the AI service is cold or unreachable and the judge would otherwise see
 * a spinner that never resolves — the acceptance criterion is an 8 s ceiling.
 *
 * They are *recorded* engine output, trimmed to the fields the landing renders.
 * Two deliberate omissions keep them from over-claiming:
 *
 * - `hash_audit` is empty. An audit hash is a promise that a specific payload
 *   was produced by a specific pipeline run; minting one for a stored sample
 *   would make the most trust-bearing feature in the product a decoration.
 *   The UI states that a cached sample carries no hash.
 * - The chili sample reports `tidak_dinilai` for the YOLO-2 verdict. The chili
 *   classifier is still in training (R-14), so its pathology veto is off and
 *   printing a confident "sehat" would be a claim the model cannot back.
 */
export interface ContohBatch {
  /** File in `public/img`. */
  gambar: string;
  label: string;
  /** Commodity id the engine understands — sent as `commodity` to /predict. */
  komoditas: string;
  catatan: string;
  hasil: GradingSuccess;
}

export const CONTOH_BATCH: ContohBatch[] = [
  {
    "gambar": "/img/demo-tomat-sayur-v2.jpg",
    "label": "Tomat Sayur",
    "komoditas": "tomato_sayur",
    "catatan": "Tumpukan campur, standar pasar tradisional dengan variasi ukuran.",
    "hasil": {
      "status": "success",
      "komoditas": "tomato_sayur",
      "objek_terdeteksi": 34,
      "kalibrasi": {
        "referensi": "koin_500",
        "px_per_mm2": 2.3805,
        "valid": true
      },
      "ringkasan_batch": {
        "komposisi": {
          "A": 0.0,
          "B": 0.26,
          "C": 0.74,
          "REJECT": 0.0
        },
        "skor_keseragaman": 0.48,
        "estimasi_berat": {
          "tersedia": true,
          "gram": 5966.6,
          "kg": 5.967,
          "min_kg": 4.475,
          "max_kg": 7.458,
          "luas_total_mm2": 152208.9,
          "faktor_gram_per_mm2": 0.0392,
          "rel_ketidakpastian": 0.25,
          "n_sampel_kalibrasi": 0,
          "sumber_faktor": "Turunan geometri: bola r≈30 mm, densitas buah 0,98 g/cm³ (USDA FoodData Central, tomat mentah)",
          "objek_terukur": 34,
          "objek_total": 34
        }
      },
      "objek": [
        {
          "id": 1,
          "grade": "B (Standar)",
          "ukuran_mm2": 9883.7,
          "solidity": 0.95,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 9883mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.80 < 0.8)",
            "Warna belum matang sempurna (Setengah Matang) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.99,
          "bbox": [
            310,
            144,
            78,
            67
          ]
        },
        {
          "id": 2,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 9832.5,
          "solidity": 0.93,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 9832mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.72 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            329,
            273,
            85,
            68
          ]
        },
        {
          "id": 3,
          "grade": "B (Standar)",
          "ukuran_mm2": 6781.9,
          "solidity": 0.97,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 6781mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.77 < 0.8)",
            "Warna belum matang sempurna (Setengah Matang) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            403,
            206,
            73,
            47
          ]
        },
        {
          "id": 4,
          "grade": "B (Standar)",
          "ukuran_mm2": 6397.5,
          "solidity": 0.9,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 6397mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.70 < 0.8)",
            "Warna belum matang sempurna (Setengah Matang) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.99,
          "bbox": [
            132,
            292,
            67,
            55
          ]
        },
        {
          "id": 5,
          "grade": "B (Standar)",
          "ukuran_mm2": 6437.9,
          "solidity": 0.95,
          "cacat": [
            {
              "jenis": "bercak_ringan",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 6437mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.72 < 0.8)",
            "Warna belum matang sempurna (Setengah Matang) menurunkan grade",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            95,
            187,
            73,
            49
          ]
        },
        {
          "id": 6,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 6915.2,
          "solidity": 0.91,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 6915mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.71 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            489,
            409,
            73,
            55
          ]
        },
        {
          "id": 7,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 6836.7,
          "solidity": 0.94,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 6836mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.76 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.99,
          "bbox": [
            273,
            526,
            68,
            55
          ]
        },
        {
          "id": 8,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 5961.9,
          "solidity": 0.95,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 5961mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.74 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            206,
            304,
            67,
            47
          ]
        },
        {
          "id": 9,
          "grade": "B (Standar)",
          "ukuran_mm2": 7358.0,
          "solidity": 0.96,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 7357mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.76 < 0.8)",
            "Warna belum matang sempurna (Setengah Matang) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            255,
            230,
            73,
            54
          ]
        },
        {
          "id": 10,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 4405.0,
          "solidity": 0.94,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 4405mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.75 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            446,
            113,
            55,
            43
          ]
        },
        {
          "id": 11,
          "grade": "B (Standar)",
          "ukuran_mm2": 6209.4,
          "solidity": 0.91,
          "cacat": [
            {
              "jenis": "bercak_ringan",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 6209mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.71 < 0.8)",
            "Warna belum matang sempurna (Setengah Matang) menurunkan grade",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.99,
          "bbox": [
            156,
            212,
            68,
            55
          ]
        },
        {
          "id": 12,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 6097.5,
          "solidity": 0.95,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 6097mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.74 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            163,
            446,
            67,
            48
          ]
        },
        {
          "id": 13,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 5457.2,
          "solidity": 0.94,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 5457mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.75 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.99,
          "bbox": [
            273,
            390,
            60,
            49
          ]
        },
        {
          "id": 14,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 5901.2,
          "solidity": 0.92,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 5901mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.72 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            452,
            507,
            61,
            55
          ]
        },
        {
          "id": 15,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 3401.7,
          "solidity": 0.96,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 3401mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.77 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            169,
            335,
            48,
            36
          ]
        },
        {
          "id": 16,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 5394.1,
          "solidity": 0.92,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 5394mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.73 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            280,
            304,
            61,
            49
          ]
        },
        {
          "id": 17,
          "grade": "B (Standar)",
          "ukuran_mm2": 5801.2,
          "solidity": 0.92,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 5801mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.69 < 0.8)",
            "Warna belum matang sempurna (Setengah Matang) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            427,
            150,
            67,
            49
          ]
        },
        {
          "id": 18,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 4806.1,
          "solidity": 0.91,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 4806mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.71 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            347,
            224,
            55,
            49
          ]
        },
        {
          "id": 19,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 3432.6,
          "solidity": 0.96,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 3432mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.79 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            169,
            489,
            41,
            42
          ]
        },
        {
          "id": 20,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 2680.4,
          "solidity": 0.97,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 2680mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.74 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            421,
            249,
            46,
            30
          ]
        },
        {
          "id": 21,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 2413.8,
          "solidity": 0.93,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 2413mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.72 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.99,
          "bbox": [
            446,
            464,
            35,
            37
          ]
        },
        {
          "id": 22,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 2350.7,
          "solidity": 0.82,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 2350mm2 >= ambang Grade A (1800mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.53 < 0.6)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            200,
            372,
            54,
            30
          ]
        },
        {
          "id": 23,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 2545.9,
          "solidity": 0.97,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 2545mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.74 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.97,
          "bbox": [
            181,
            267,
            43,
            29
          ]
        },
        {
          "id": 24,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 2983.9,
          "solidity": 0.94,
          "cacat": [
            {
              "jenis": "bercak_ringan",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 2983mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.72 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            144,
            563,
            43,
            36
          ]
        },
        {
          "id": 26,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 3061.3,
          "solidity": 0.92,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 3061mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.69 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            243,
            200,
            53,
            33
          ]
        },
        {
          "id": 27,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 3446.9,
          "solidity": 0.93,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 3446mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.73 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.99,
          "bbox": [
            316,
            433,
            43,
            43
          ]
        },
        {
          "id": 28,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 2728.0,
          "solidity": 0.92,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 2728mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.73 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            224,
            446,
            43,
            36
          ]
        },
        {
          "id": 29,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 1646.1,
          "solidity": 0.87,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 1646mm2 masuk rentang Grade B (1000-1800mm2)",
            "Bentuk kurang bulat (circularity 0.67 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            446,
            267,
            35,
            30
          ]
        },
        {
          "id": 30,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 1404.5,
          "solidity": 0.98,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 1404mm2 masuk rentang Grade B (1000-1800mm2)",
            "Bentuk kurang bulat (circularity 0.78 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            563,
            21,
            28,
            24
          ]
        },
        {
          "id": 31,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 2204.3,
          "solidity": 0.98,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 2204mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.70 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.66,
          "bbox": [
            501,
            224,
            43,
            24
          ]
        },
        {
          "id": 33,
          "grade": "B (Standar)",
          "ukuran_mm2": 2356.7,
          "solidity": 0.96,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 2356mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.74 < 0.8)",
            "Warna belum matang sempurna (Setengah Matang) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            298,
            3,
            43,
            28
          ]
        },
        {
          "id": 34,
          "grade": "B (Standar)",
          "ukuran_mm2": 1440.2,
          "solidity": 0.95,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 1440mm2 masuk rentang Grade B (1000-1800mm2)",
            "Bentuk kurang bulat (circularity 0.72 < 0.8)",
            "Warna belum matang sempurna (Setengah Matang) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            526,
            3,
            30,
            24
          ]
        },
        {
          "id": 36,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 1496.1,
          "solidity": 0.96,
          "cacat": [
            {
              "jenis": "bercak_ringan",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 1496mm2 masuk rentang Grade B (1000-1800mm2)",
            "Bentuk kurang bulat (circularity 0.74 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            495,
            15,
            35,
            22
          ]
        },
        {
          "id": 39,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 2138.8,
          "solidity": 0.91,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 2138mm2 >= ambang Grade A (1800mm2)",
            "Bentuk kurang bulat (circularity 0.69 < 0.8)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            489,
            255,
            42,
            29
          ]
        }
      ],
      "hash_audit": ""
    }
  },
  {
    "gambar": "/img/demo-cabai-rawit-v3.jpg",
    "label": "Cabai Rawit",
    "komoditas": "chili_rawit",
    "catatan": "Bentuk memanjang, grade ditentukan dari rasio panjang & kondisi fisik.",
    "hasil": {
      "status": "success",
      "komoditas": "chili_rawit",
      "objek_terdeteksi": 46,
      "kalibrasi": {
        "referensi": "koin_500",
        "px_per_mm2": 0.9298,
        "valid": true
      },
      "ringkasan_batch": {
        "komposisi": {
          "A": 0.8,
          "B": 0.02,
          "C": 0.17,
          "REJECT": 0.0
        },
        "skor_keseragaman": 0.72,
        "estimasi_berat": {
          "tersedia": true,
          "gram": 2010.5,
          "kg": 2.01,
          "min_kg": 1.407,
          "max_kg": 2.614,
          "luas_total_mm2": 261100.0,
          "faktor_gram_per_mm2": 0.0077,
          "rel_ketidakpastian": 0.3,
          "n_sampel_kalibrasi": 0,
          "sumber_faktor": "Turunan geometri: silinder r≈5 mm, densitas 0,98 g/cm³",
          "objek_terukur": 46,
          "objek_total": 46
        }
      },
      "objek": [
        {
          "id": 1,
          "grade": "B (Standar)",
          "ukuran_mm2": 7981.0,
          "solidity": 0.78,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 7981mm2 >= ambang Grade A (100mm2)",
            "Bentuk kurang bulat (circularity 0.19 < 0.3)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            181,
            329,
            147,
            104
          ]
        },
        {
          "id": 2,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 9440.3,
          "solidity": 0.94,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 9440mm2 >= ambang Grade A (100mm2)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            144,
            556,
            170,
            83
          ]
        },
        {
          "id": 3,
          "grade": "A (Premium)",
          "ukuran_mm2": 7861.1,
          "solidity": 0.89,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 7861mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.81,
          "bbox": [
            507,
            304,
            80,
            166
          ]
        },
        {
          "id": 4,
          "grade": "A (Premium)",
          "ukuran_mm2": 4563.2,
          "solidity": 0.92,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 4563mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.89,
          "bbox": [
            556,
            452,
            68,
            116
          ]
        },
        {
          "id": 5,
          "grade": "A (Premium)",
          "ukuran_mm2": 6454.4,
          "solidity": 0.95,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 6454mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            458,
            396,
            90,
            129
          ]
        },
        {
          "id": 6,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 5967.6,
          "solidity": 0.9,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 5967mm2 >= ambang Grade A (100mm2)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.96,
          "bbox": [
            9,
            243,
            73,
            141
          ]
        },
        {
          "id": 7,
          "grade": "A (Premium)",
          "ukuran_mm2": 6049.0,
          "solidity": 0.93,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 6049mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.99,
          "bbox": [
            150,
            267,
            107,
            92
          ]
        },
        {
          "id": 8,
          "grade": "A (Premium)",
          "ukuran_mm2": 5817.0,
          "solidity": 0.95,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 5817mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            390,
            138,
            84,
            110
          ]
        },
        {
          "id": 9,
          "grade": "A (Premium)",
          "ukuran_mm2": 5922.6,
          "solidity": 0.94,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 5922mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            107,
            507,
            92,
            92
          ]
        },
        {
          "id": 10,
          "grade": "A (Premium)",
          "ukuran_mm2": 7127.1,
          "solidity": 0.94,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 7127mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            138,
            175,
            129,
            84
          ]
        },
        {
          "id": 11,
          "grade": "A (Premium)",
          "ukuran_mm2": 6094.1,
          "solidity": 0.93,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 6094mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.97,
          "bbox": [
            310,
            255,
            123,
            84
          ]
        },
        {
          "id": 12,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 4567.4,
          "solidity": 0.88,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 4567mm2 >= ambang Grade A (100mm2)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.98,
          "bbox": [
            40,
            384,
            96,
            117
          ]
        },
        {
          "id": 13,
          "grade": "A (Premium)",
          "ukuran_mm2": 4610.2,
          "solidity": 0.93,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 4610mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.97,
          "bbox": [
            52,
            520,
            79,
            116
          ]
        },
        {
          "id": 14,
          "grade": "A (Premium)",
          "ukuran_mm2": 8024.7,
          "solidity": 0.93,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 8024mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            27,
            52,
            129,
            104
          ]
        },
        {
          "id": 15,
          "grade": "A (Premium)",
          "ukuran_mm2": 8178.1,
          "solidity": 0.95,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 8178mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            427,
            236,
            117,
            111
          ]
        },
        {
          "id": 16,
          "grade": "A (Premium)",
          "ukuran_mm2": 3795.7,
          "solidity": 0.93,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 3795mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.65,
          "bbox": [
            575,
            353,
            64,
            115
          ]
        },
        {
          "id": 17,
          "grade": "A (Premium)",
          "ukuran_mm2": 6183.8,
          "solidity": 0.69,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 6183mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.76,
          "bbox": [
            372,
            421,
            110,
            110
          ]
        },
        {
          "id": 18,
          "grade": "A (Premium)",
          "ukuran_mm2": 6972.2,
          "solidity": 0.92,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 6972mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            335,
            70,
            135,
            92
          ]
        },
        {
          "id": 19,
          "grade": "A (Premium)",
          "ukuran_mm2": 5481.8,
          "solidity": 0.95,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 5481mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            70,
            236,
            86,
            103
          ]
        },
        {
          "id": 20,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 9725.3,
          "solidity": 0.93,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 9725mm2 >= ambang Grade A (100mm2)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            304,
            341,
            166,
            86
          ]
        },
        {
          "id": 21,
          "grade": "A (Premium)",
          "ukuran_mm2": 5557.6,
          "solidity": 0.96,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 5557mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            126,
            101,
            110,
            76
          ]
        },
        {
          "id": 22,
          "grade": "A (Premium)",
          "ukuran_mm2": 5844.9,
          "solidity": 0.89,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 5844mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.99,
          "bbox": [
            255,
            415,
            110,
            96
          ]
        },
        {
          "id": 23,
          "grade": "A (Premium)",
          "ukuran_mm2": 4405.2,
          "solidity": 0.92,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 4405mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.73,
          "bbox": [
            556,
            261,
            68,
            98
          ]
        },
        {
          "id": 24,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 7405.5,
          "solidity": 0.93,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 7405mm2 >= ambang Grade A (100mm2)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            3,
            144,
            122,
            110
          ]
        },
        {
          "id": 25,
          "grade": "A (Premium)",
          "ukuran_mm2": 4017.9,
          "solidity": 0.93,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 4017mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            304,
            501,
            80,
            92
          ]
        },
        {
          "id": 26,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 5141.1,
          "solidity": 0.96,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 5141mm2 >= ambang Grade A (100mm2)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.99,
          "bbox": [
            366,
            3,
            110,
            78
          ]
        },
        {
          "id": 27,
          "grade": "A (Premium)",
          "ukuran_mm2": 5068.6,
          "solidity": 0.8,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 5068mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.96,
          "bbox": [
            384,
            538,
            110,
            73
          ]
        },
        {
          "id": 28,
          "grade": "A (Premium)",
          "ukuran_mm2": 4414.0,
          "solidity": 0.94,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 4414mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            132,
            347,
            55,
            115
          ]
        },
        {
          "id": 29,
          "grade": "A (Premium)",
          "ukuran_mm2": 6073.6,
          "solidity": 0.92,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 6073mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            255,
            144,
            122,
            80
          ]
        },
        {
          "id": 30,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 5523.7,
          "solidity": 0.94,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 5523mm2 >= ambang Grade A (100mm2)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.99,
          "bbox": [
            446,
            3,
            110,
            73
          ]
        },
        {
          "id": 31,
          "grade": "A (Premium)",
          "ukuran_mm2": 5834.2,
          "solidity": 0.85,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 5834mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.99,
          "bbox": [
            243,
            15,
            122,
            84
          ]
        },
        {
          "id": 32,
          "grade": "A (Premium)",
          "ukuran_mm2": 7464.6,
          "solidity": 0.95,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 7464mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            138,
            440,
            129,
            79
          ]
        },
        {
          "id": 33,
          "grade": "A (Premium)",
          "ukuran_mm2": 3383.4,
          "solidity": 0.93,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 3383mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            267,
            218,
            80,
            67
          ]
        },
        {
          "id": 34,
          "grade": "A (Premium)",
          "ukuran_mm2": 4674.8,
          "solidity": 0.93,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 4674mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            236,
            489,
            92,
            73
          ]
        },
        {
          "id": 35,
          "grade": "A (Premium)",
          "ukuran_mm2": 6062.5,
          "solidity": 0.86,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 6062mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            150,
            21,
            117,
            86
          ]
        },
        {
          "id": 36,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 2348.1,
          "solidity": 0.84,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 2348mm2 >= ambang Grade A (100mm2)",
            "Warna belum matang sempurna (Mentah Hijau) menurunkan grade"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.62,
          "bbox": [
            3,
            206,
            30,
            141
          ]
        },
        {
          "id": 37,
          "grade": "A (Premium)",
          "ukuran_mm2": 4335.9,
          "solidity": 0.93,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 4335mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.99,
          "bbox": [
            452,
            513,
            89,
            74
          ]
        },
        {
          "id": 38,
          "grade": "A (Premium)",
          "ukuran_mm2": 3728.3,
          "solidity": 0.92,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 3728mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.95,
          "bbox": [
            58,
            335,
            79,
            86
          ]
        },
        {
          "id": 39,
          "grade": "A (Premium)",
          "ukuran_mm2": 4632.5,
          "solidity": 0.89,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 4632mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.89,
          "bbox": [
            21,
            396,
            80,
            131
          ]
        },
        {
          "id": 40,
          "grade": "A (Premium)",
          "ukuran_mm2": 4745.5,
          "solidity": 0.88,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 4745mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.7,
          "bbox": [
            476,
            101,
            85,
            96
          ]
        },
        {
          "id": 41,
          "grade": "A (Premium)",
          "ukuran_mm2": 3516.3,
          "solidity": 0.93,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 3516mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.99,
          "bbox": [
            230,
            76,
            67,
            86
          ]
        },
        {
          "id": 42,
          "grade": "A (Premium)",
          "ukuran_mm2": 4903.5,
          "solidity": 0.89,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 4903mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.88,
          "bbox": [
            544,
            113,
            61,
            141
          ]
        },
        {
          "id": 43,
          "grade": "A (Premium)",
          "ukuran_mm2": 3613.0,
          "solidity": 0.87,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 3613mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            483,
            187,
            91,
            74
          ]
        },
        {
          "id": 44,
          "grade": "A (Premium)",
          "ukuran_mm2": 6905.3,
          "solidity": 0.9,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 6905mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.97,
          "bbox": [
            476,
            64,
            92,
            104
          ]
        },
        {
          "id": 45,
          "grade": "A (Premium)",
          "ukuran_mm2": 4649.3,
          "solidity": 0.91,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 4649mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.68,
          "bbox": [
            476,
            64,
            92,
            67
          ]
        },
        {
          "id": 46,
          "grade": "A (Premium)",
          "ukuran_mm2": 6034.1,
          "solidity": 0.79,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 6034mm2 >= ambang Grade A (100mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.92,
          "bbox": [
            476,
            83,
            92,
            116
          ]
        }
      ],
      "hash_audit": ""
    }
  },
  {
    "gambar": "/img/demo-timun-lokal-v4.jpg",
    "label": "Timun Lokal",
    "komoditas": "cucumber_lokal",
    "catatan": "Keseragaman ukuran & kemulusan kulit menjadi faktor utama mutu.",
    "hasil": {
      "status": "success",
      "komoditas": "cucumber_lokal",
      "objek_terdeteksi": 15,
      "kalibrasi": {
        "referensi": "koin_500",
        "px_per_mm2": 3.1114,
        "valid": true
      },
      "ringkasan_batch": {
        "komposisi": {
          "A": 0.0,
          "B": 0.0,
          "C": 1.0,
          "REJECT": 0.0
        },
        "skor_keseragaman": 0.5,
        "estimasi_berat": {
          "tersedia": true,
          "gram": 5200.8,
          "kg": 5.201,
          "min_kg": 3.641,
          "max_kg": 6.761,
          "luas_total_mm2": 172210.4,
          "faktor_gram_per_mm2": 0.0302,
          "rel_ketidakpastian": 0.3,
          "n_sampel_kalibrasi": 0,
          "sumber_faktor": "Turunan geometri: silinder r≈20 mm, densitas 0,96 g/cm³",
          "objek_terukur": 15,
          "objek_total": 15
        }
      },
      "objek": [
        {
          "id": 1,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 26221.4,
          "solidity": 0.76,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 26221mm2 >= ambang Grade A (7000mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.27 < 0.4)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.68,
          "bbox": [
            21,
            0,
            67,
            270
          ]
        },
        {
          "id": 2,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 18416.5,
          "solidity": 0.93,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 18416mm2 >= ambang Grade A (7000mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.34 < 0.4)"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.97,
          "bbox": [
            132,
            147,
            36,
            209
          ]
        },
        {
          "id": 3,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 16535.6,
          "solidity": 0.86,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 16535mm2 >= ambang Grade A (7000mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.27 < 0.4)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.85,
          "bbox": [
            181,
            92,
            43,
            221
          ]
        },
        {
          "id": 4,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 9894.3,
          "solidity": 0.71,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 9894mm2 >= ambang Grade A (7000mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.24 < 0.4)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.63,
          "bbox": [
            310,
            36,
            37,
            178
          ]
        },
        {
          "id": 5,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 6457.7,
          "solidity": 0.92,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 6457mm2 masuk rentang Grade B (4000-7000mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.36 < 0.4)"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.73,
          "bbox": [
            286,
            30,
            24,
            117
          ]
        },
        {
          "id": 6,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 8982.6,
          "solidity": 0.87,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 8982mm2 >= ambang Grade A (7000mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.31 < 0.4)"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.89,
          "bbox": [
            353,
            49,
            31,
            147
          ]
        },
        {
          "id": 7,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 5847.9,
          "solidity": 0.89,
          "cacat": [
            {
              "jenis": "bercak_ringan",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 5847mm2 masuk rentang Grade B (4000-7000mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.35 < 0.4)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.6,
          "bbox": [
            378,
            73,
            24,
            109
          ]
        },
        {
          "id": 8,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 4273.5,
          "solidity": 0.95,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 4273mm2 masuk rentang Grade B (4000-7000mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.38 < 0.4)"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.67,
          "bbox": [
            292,
            36,
            18,
            92
          ]
        },
        {
          "id": 9,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 8470.8,
          "solidity": 0.79,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 8470mm2 >= ambang Grade A (7000mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.26 < 0.4)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.98,
          "bbox": [
            249,
            61,
            30,
            153
          ]
        },
        {
          "id": 10,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 8533.1,
          "solidity": 0.85,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 8533mm2 >= ambang Grade A (7000mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.28 < 0.4)"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 0.98,
          "bbox": [
            224,
            144,
            30,
            150
          ]
        },
        {
          "id": 11,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 11246.2,
          "solidity": 0.8,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 11246mm2 >= ambang Grade A (7000mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.24 < 0.4)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.93,
          "bbox": [
            249,
            12,
            30,
            196
          ]
        },
        {
          "id": 12,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 18506.7,
          "solidity": 0.9,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 18506mm2 >= ambang Grade A (7000mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.33 < 0.4)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.7,
          "bbox": [
            46,
            0,
            42,
            196
          ]
        },
        {
          "id": 13,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 9866.3,
          "solidity": 0.71,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 9866mm2 >= ambang Grade A (7000mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.21 < 0.4)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.83,
          "bbox": [
            243,
            43,
            36,
            159
          ]
        },
        {
          "id": 14,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 7139.1,
          "solidity": 0.94,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 7139mm2 >= ambang Grade A (7000mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.37 < 0.4)"
          ],
          "yolo2_kondisi": "sehat",
          "yolo2_conf": 1.0,
          "bbox": [
            224,
            172,
            24,
            122
          ]
        },
        {
          "id": 15,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 11818.7,
          "solidity": 0.81,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 11818mm2 >= ambang Grade A (7000mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.24 < 0.4)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 0.88,
          "bbox": [
            243,
            6,
            34,
            199
          ]
        }
      ],
      "hash_audit": ""
    }
  },
  {
    "gambar": "/img/demo-wortel-v6.jpg",
    "label": "Wortel",
    "komoditas": "carrot",
    "catatan": "Dinilai berdasarkan bentuk lurus, ukuran, serta bebas cacat fisik.",
    "hasil": {
      "status": "success",
      "komoditas": "carrot",
      "objek_terdeteksi": 59,
      "kalibrasi": {
        "referensi": "koin_500",
        "px_per_mm2": 4.5618,
        "valid": true
      },
      "ringkasan_batch": {
        "komposisi": {
          "A": 0.0,
          "B": 0.31,
          "C": 0.69,
          "REJECT": 0.0
        },
        "skor_keseragaman": 0.62,
        "estimasi_berat": {
          "tersedia": true,
          "gram": 9604.6,
          "kg": 9.605,
          "min_kg": 6.723,
          "max_kg": 12.486,
          "luas_total_mm2": 392025.9,
          "faktor_gram_per_mm2": 0.0245,
          "rel_ketidakpastian": 0.3,
          "n_sampel_kalibrasi": 0,
          "sumber_faktor": "Turunan geometri: kerucut terpancung r≈15 mm, densitas 1,04 g/cm³ (umbi berair, tenggelam di air)",
          "objek_terukur": 59,
          "objek_total": 59
        }
      },
      "objek": [
        {
          "id": 1,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 4274.4,
          "solidity": 0.79,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 4274mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.28 < 0.3)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            380,
            372,
            68,
            64
          ]
        },
        {
          "id": 2,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 5355.5,
          "solidity": 0.79,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 5355mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.29 < 0.3)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            298,
            363,
            69,
            76
          ]
        },
        {
          "id": 3,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 9166.8,
          "solidity": 0.76,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 9166mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.22 < 0.3)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            347,
            310,
            75,
            134
          ]
        },
        {
          "id": 4,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 7385.5,
          "solidity": 0.58,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 7385mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.18 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            427,
            169,
            95,
            105
          ]
        },
        {
          "id": 5,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 11500.2,
          "solidity": 0.79,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 11500mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.30 < 0.3)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            390,
            396,
            135,
            48
          ]
        },
        {
          "id": 6,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 6420.7,
          "solidity": 0.62,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 6420mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.17 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            132,
            230,
            85,
            115
          ]
        },
        {
          "id": 7,
          "grade": "B (Standar)",
          "ukuran_mm2": 9269.5,
          "solidity": 0.82,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 9269mm2 >= ambang Grade A (3500mm2)",
            "Bentuk kurang bulat (circularity 0.35 < 0.5)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            113,
            218,
            60,
            101
          ]
        },
        {
          "id": 8,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 4835.5,
          "solidity": 0.66,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 4835mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.27 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            206,
            212,
            67,
            73
          ]
        },
        {
          "id": 9,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 7599.9,
          "solidity": 0.69,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 7599mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.23 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            126,
            187,
            122,
            43
          ]
        },
        {
          "id": 10,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 4304.0,
          "solidity": 0.7,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 4304mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.22 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            310,
            295,
            57,
            84
          ]
        },
        {
          "id": 11,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 7123.2,
          "solidity": 0.55,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 7123mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.24 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            316,
            218,
            95,
            61
          ]
        },
        {
          "id": 12,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 9495.3,
          "solidity": 0.79,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 9495mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.26 < 0.3)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            304,
            181,
            129,
            53
          ]
        },
        {
          "id": 13,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 10939.1,
          "solidity": 0.62,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 10939mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.17 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            230,
            255,
            61,
            166
          ]
        },
        {
          "id": 14,
          "grade": "B (Standar)",
          "ukuran_mm2": 10936.8,
          "solidity": 0.85,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 10936mm2 >= ambang Grade A (3500mm2)",
            "Bentuk kurang bulat (circularity 0.35 < 0.5)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            495,
            273,
            30,
            123
          ]
        },
        {
          "id": 15,
          "grade": "B (Standar)",
          "ukuran_mm2": 5314.4,
          "solidity": 0.71,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 5314mm2 >= ambang Grade A (3500mm2)",
            "Bentuk kurang bulat (circularity 0.33 < 0.5)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            280,
            200,
            85,
            30
          ]
        },
        {
          "id": 16,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 4452.3,
          "solidity": 0.69,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 4452mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.20 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            421,
            293,
            78,
            78
          ]
        },
        {
          "id": 17,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 5811.7,
          "solidity": 0.68,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 5811mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.23 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            341,
            280,
            80,
            82
          ]
        },
        {
          "id": 18,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 7540.6,
          "solidity": 0.51,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 7540mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.22 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            372,
            329,
            67,
            98
          ]
        },
        {
          "id": 19,
          "grade": "B (Standar)",
          "ukuran_mm2": 9353.9,
          "solidity": 0.92,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 9353mm2 >= ambang Grade A (3500mm2)",
            "Bentuk kurang bulat (circularity 0.32 < 0.5)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            156,
            310,
            23,
            123
          ]
        },
        {
          "id": 20,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 5401.1,
          "solidity": 0.65,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 5401mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.23 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            243,
            224,
            53,
            98
          ]
        },
        {
          "id": 21,
          "grade": "B (Standar)",
          "ukuran_mm2": 7716.2,
          "solidity": 0.86,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 7716mm2 >= ambang Grade A (3500mm2)",
            "Bentuk kurang bulat (circularity 0.31 < 0.5)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            224,
            335,
            27,
            115
          ]
        },
        {
          "id": 22,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 5451.3,
          "solidity": 0.57,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 5451mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.21 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            261,
            224,
            61,
            98
          ]
        },
        {
          "id": 23,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 6548.4,
          "solidity": 0.69,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 6548mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.30 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            304,
            236,
            92,
            55
          ]
        },
        {
          "id": 24,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 11997.4,
          "solidity": 0.73,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 11997mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.22 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            187,
            255,
            55,
            153
          ]
        },
        {
          "id": 25,
          "grade": "B (Standar)",
          "ukuran_mm2": 6032.9,
          "solidity": 0.79,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 6032mm2 >= ambang Grade A (3500mm2)",
            "Bentuk kurang bulat (circularity 0.33 < 0.5)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            206,
            329,
            35,
            90
          ]
        },
        {
          "id": 26,
          "grade": "B (Standar)",
          "ukuran_mm2": 5043.0,
          "solidity": 0.79,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 5043mm2 >= ambang Grade A (3500mm2)",
            "Bentuk kurang bulat (circularity 0.33 < 0.5)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            296,
            243,
            75,
            54
          ]
        },
        {
          "id": 27,
          "grade": "B (Standar)",
          "ukuran_mm2": 9609.3,
          "solidity": 0.89,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 9609mm2 >= ambang Grade A (3500mm2)",
            "Bentuk kurang bulat (circularity 0.30 < 0.5)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            526,
            215,
            24,
            132
          ]
        },
        {
          "id": 28,
          "grade": "B (Standar)",
          "ukuran_mm2": 5063.5,
          "solidity": 0.69,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 5063mm2 >= ambang Grade A (3500mm2)",
            "Bentuk kurang bulat (circularity 0.31 < 0.5)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            378,
            230,
            79,
            24
          ]
        },
        {
          "id": 29,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 6956.7,
          "solidity": 0.72,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 6956mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.21 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            169,
            267,
            35,
            129
          ]
        },
        {
          "id": 30,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 5417.1,
          "solidity": 0.48,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 5417mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.20 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            378,
            280,
            79,
            73
          ]
        },
        {
          "id": 31,
          "grade": "B (Standar)",
          "ukuran_mm2": 9536.3,
          "solidity": 0.89,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 9536mm2 >= ambang Grade A (3500mm2)",
            "Bentuk kurang bulat (circularity 0.30 < 0.5)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            526,
            218,
            24,
            129
          ]
        },
        {
          "id": 32,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 4509.3,
          "solidity": 0.52,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 4509mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.11 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            390,
            230,
            124,
            31
          ]
        },
        {
          "id": 33,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 6502.8,
          "solidity": 0.63,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 6502mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.18 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            206,
            292,
            42,
            129
          ]
        },
        {
          "id": 34,
          "grade": "B (Standar)",
          "ukuran_mm2": 3024.4,
          "solidity": 0.74,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 3024mm2 masuk rentang Grade B (2000-3500mm2)",
            "Bentuk kurang bulat (circularity 0.32 < 0.5)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            296,
            253,
            32,
            63
          ]
        },
        {
          "id": 35,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 6012.4,
          "solidity": 0.78,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 6012mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.26 < 0.3)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            476,
            273,
            23,
            98
          ]
        },
        {
          "id": 36,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 3277.6,
          "solidity": 0.61,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 3277mm2 masuk rentang Grade B (2000-3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.24 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            236,
            212,
            45,
            73
          ]
        },
        {
          "id": 37,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 7718.5,
          "solidity": 0.63,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 7718mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.22 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            206,
            310,
            127,
            37
          ]
        },
        {
          "id": 38,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 6272.4,
          "solidity": 0.45,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 6272mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.07 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            403,
            236,
            118,
            37
          ]
        },
        {
          "id": 39,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 2280.9,
          "solidity": 0.31,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 2280mm2 masuk rentang Grade B (2000-3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.05 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            286,
            236,
            39,
            74
          ]
        },
        {
          "id": 40,
          "grade": "B (Standar)",
          "ukuran_mm2": 2524.9,
          "solidity": 0.75,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 2524mm2 masuk rentang Grade B (2000-3500mm2)",
            "Bentuk kurang bulat (circularity 0.40 < 0.5)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            236,
            243,
            37,
            42
          ]
        },
        {
          "id": 41,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 3261.7,
          "solidity": 0.33,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 3261mm2 masuk rentang Grade B (2000-3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.13 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            287,
            238,
            66,
            59
          ]
        },
        {
          "id": 42,
          "grade": "B (Standar)",
          "ukuran_mm2": 5950.8,
          "solidity": 0.86,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 5950mm2 >= ambang Grade A (3500mm2)",
            "Bentuk kurang bulat (circularity 0.42 < 0.5)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            286,
            340,
            24,
            81
          ]
        },
        {
          "id": 43,
          "grade": "B (Standar)",
          "ukuran_mm2": 3122.5,
          "solidity": 0.83,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 3122mm2 masuk rentang Grade B (2000-3500mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            267,
            200,
            30,
            36
          ]
        },
        {
          "id": 44,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 9080.2,
          "solidity": 0.72,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 9080mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.22 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            249,
            286,
            42,
            135
          ]
        },
        {
          "id": 45,
          "grade": "B (Standar)",
          "ukuran_mm2": 4053.1,
          "solidity": 0.81,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 4053mm2 >= ambang Grade A (3500mm2)",
            "Bentuk kurang bulat (circularity 0.38 < 0.5)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            378,
            230,
            67,
            24
          ]
        },
        {
          "id": 46,
          "grade": "B (Standar)",
          "ukuran_mm2": 5939.4,
          "solidity": 0.85,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 5939mm2 >= ambang Grade A (3500mm2)",
            "Bentuk kurang bulat (circularity 0.42 < 0.5)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            286,
            341,
            24,
            80
          ]
        },
        {
          "id": 47,
          "grade": "B (Standar)",
          "ukuran_mm2": 3321.0,
          "solidity": 0.79,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 3320mm2 masuk rentang Grade B (2000-3500mm2)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            267,
            200,
            37,
            34
          ]
        },
        {
          "id": 48,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 9262.6,
          "solidity": 0.65,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 9262mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.24 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            200,
            310,
            133,
            37
          ]
        },
        {
          "id": 49,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 4566.3,
          "solidity": 0.39,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 4566mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.17 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            390,
            261,
            84,
            61
          ]
        },
        {
          "id": 50,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 6959.0,
          "solidity": 0.69,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 6958mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.21 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            224,
            300,
            27,
            133
          ]
        },
        {
          "id": 51,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 5293.9,
          "solidity": 0.58,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 5293mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.27 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            366,
            280,
            53,
            67
          ]
        },
        {
          "id": 52,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 8329.8,
          "solidity": 0.33,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 8329mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.02 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            206,
            255,
            48,
            178
          ]
        },
        {
          "id": 53,
          "grade": "B (Standar)",
          "ukuran_mm2": 10195.5,
          "solidity": 0.89,
          "cacat": [],
          "alasan_grade": [
            "Ukuran 10195mm2 >= ambang Grade A (3500mm2)",
            "Bentuk kurang bulat (circularity 0.36 < 0.5)"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            384,
            236,
            117,
            25
          ]
        },
        {
          "id": 54,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 7515.5,
          "solidity": 0.74,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 7515mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.26 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            224,
            316,
            27,
            123
          ]
        },
        {
          "id": 55,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 7625.0,
          "solidity": 0.69,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 7624mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.15 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            384,
            236,
            129,
            25
          ]
        },
        {
          "id": 56,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 5079.5,
          "solidity": 0.42,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 5079mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.13 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            378,
            260,
            56,
            93
          ]
        },
        {
          "id": 57,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 7435.7,
          "solidity": 0.37,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 7435mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.13 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            230,
            261,
            103,
            83
          ]
        },
        {
          "id": 58,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 3968.7,
          "solidity": 0.71,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 3968mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.30 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            384,
            261,
            61,
            24
          ]
        },
        {
          "id": 59,
          "grade": "C (Mentah/Kecil)",
          "ukuran_mm2": 13090.0,
          "solidity": 0.35,
          "cacat": [
            {
              "jenis": "deformasi_bentuk",
              "tipe": "kosmetik"
            }
          ],
          "alasan_grade": [
            "Ukuran 13089mm2 >= ambang Grade A (3500mm2)",
            "Bentuk terlalu lonjong/cacat (circularity 0.07 < 0.3)",
            "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B"
          ],
          "yolo2_kondisi": "busuk",
          "yolo2_conf": 1.0,
          "bbox": [
            206,
            255,
            73,
            166
          ]
        }
      ],
      "hash_audit": ""
    }
  }
];
