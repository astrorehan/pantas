"use client";

import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Fuel, Leaf, Navigation, ListOrdered, Save, AlertTriangle, Check, Clock } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { simpanRute } from "@/lib/data";
import { faktorSolar, formatFaktor } from "@/lib/emisi";
import { haversineKmPresisi } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Pengiriman, Rute } from "@/lib/types";
import { useTranslations } from "@/lib/i18n";

// Fix Leaflet default icon issue in Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const depotIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/**
 * Konsumsi armada — spesifikasi kendaraan, bukan faktor emisi, jadi tetap di
 * sisi kode bersama definisi ARMADA. Konversi liter → kg CO₂e datang dari
 * tabel `emisi_faktor` (F-106).
 */
const KM_PER_LITER_L300 = 9;

/** Armada koperasi. Kapasitas ditegakkan sebelum simpan, bukan sekadar dicetak. */
const ARMADA = { nama: "Pickup L300 (1.5 Ton)", kapasitasKg: 1500 };

/** Asumsi jadwal: armada berangkat 07.00, jalan desa ±30 km/jam, muat 15 menit. */
const JAM_BERANGKAT = 7;
const KECEPATAN_KM_PER_JAM = 30;
const MENIT_MUAT_PER_TITIK = 15;

const DEPOT = { lat: -7.783, lng: 110.375, name: "Pusat Konsolidasi PANTAS (Depot)" };

function jamLokal(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

/** Satu perhentian hasil pengurutan, lengkap dengan perkiraan tiba armada. */
interface Perhentian {
  pengiriman: Pengiriman;
  urutan: number;
  perkiraanTiba: string; // ISO
}

export default function RoutePlanner({ pengirimanList }: { pengirimanList: Pengiriman[] }) {
  const store = useStore();
  const t = useTranslations("admin_rute");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(pengirimanList.map(p => p.id)));
  const [menyimpan, setMenyimpan] = useState(false);
  const [tersimpan, setTersimpan] = useState<Rute | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  // Heuristic Nearest-Neighbour
  const { route, jarakKonsolidasi, jarakIndividual, totalBerat } = useMemo(() => {
    const selected = pengirimanList.filter(p => selectedIds.has(p.id));
    const totalBerat = selected.reduce((sum, p) => sum + (p.berat_kg ?? 0), 0);

    // Calculate Individual Distance (Depot -> Point -> Depot) for each point
    let jarakIndividual = 0;
    for (const p of selected) {
      const d = haversineKmPresisi(DEPOT.lat, DEPOT.lng, p.lat, p.lng);
      jarakIndividual += (d * 2);
    }

    // Calculate Route (Nearest Neighbour)
    let currentPoint = { id: "DEPOT", lat: DEPOT.lat, lng: DEPOT.lng };
    const unvisited = [...selected];
    const route: Perhentian[] = [];
    let jarakKonsolidasi = 0;

    // Jam berangkat armada dari depot — dasar seluruh perkiraan tiba.
    const jam = new Date();
    jam.setHours(JAM_BERANGKAT, 0, 0, 0);
    let menitBerjalan = 0;

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;
      for (let i = 0; i < unvisited.length; i++) {
        const d = haversineKmPresisi(currentPoint.lat, currentPoint.lng, unvisited[i].lat, unvisited[i].lng);
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = i;
        }
      }
      const nextPoint = unvisited[nearestIdx];
      jarakKonsolidasi += minDistance;

      // Waktu tempuh ke titik ini, lalu waktu muat sebelum berangkat lagi.
      menitBerjalan += (minDistance / KECEPATAN_KM_PER_JAM) * 60;
      route.push({
        pengiriman: nextPoint,
        urutan: route.length + 1,
        perkiraanTiba: new Date(jam.getTime() + menitBerjalan * 60000).toISOString(),
      });
      menitBerjalan += MENIT_MUAT_PER_TITIK;

      currentPoint = nextPoint;
      unvisited.splice(nearestIdx, 1);
    }

    // Return to Depot
    if (route.length > 0) {
      jarakKonsolidasi += haversineKmPresisi(currentPoint.lat, currentPoint.lng, DEPOT.lat, DEPOT.lng);
    }

    return {
      route,
      jarakKonsolidasi: Math.round(jarakKonsolidasi * 10) / 10,
      jarakIndividual: Math.round(jarakIndividual * 10) / 10,
      totalBerat
    };
  }, [pengirimanList, selectedIds]);

  const polylinePositions = useMemo(() => {
    const positions: [number, number][] = [[DEPOT.lat, DEPOT.lng]];
    route.forEach(p => positions.push([p.pengiriman.lat, p.pengiriman.lng]));
    if (route.length > 0) positions.push([DEPOT.lat, DEPOT.lng]);
    return positions;
  }, [route]);

  const solar = faktorSolar(store.faktorEmisi);
  const jarakPenghematan = Math.round((jarakIndividual - jarakKonsolidasi) * 10) / 10;
  const bbmDihematLiter = Math.round((jarakPenghematan / KM_PER_LITER_L300) * 10) / 10;
  const co2eDihematKg = Math.round(bbmDihematLiter * solar.faktor * 10) / 10;

  const kelebihanKg = totalBerat - ARMADA.kapasitasKg;
  const lewatKapasitas = kelebihanKg > 0;
  const bisaSimpan = route.length > 0 && !lewatKapasitas && !menyimpan;

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Pilihan berubah berarti rencana berubah — jangan biarkan nomor rute lama
    // menempel di layar seakan-akan rencana baru ini sudah tersimpan.
    setTersimpan(null);
    setGalat(null);
  };

  const handleSimpan = async () => {
    setMenyimpan(true);
    setGalat(null);
    try {
      const rute = await simpanRute({
        kendaraan: ARMADA.nama,
        kapasitas_kg: ARMADA.kapasitasKg,
        jarak_km: jarakKonsolidasi,
        jarak_individual_km: jarakIndividual,
        perhentian: route.map(p => ({
          pengiriman_id: p.pengiriman.id,
          urutan: p.urutan,
          perkiraan_tiba: p.perkiraanTiba,
        })),
      });
      setTersimpan(rute);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Rute gagal disimpan.");
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Kartu Penghematan Dinamis */}
      <Card variant="raised" className="grid gap-6 p-6 md:grid-cols-3 bg-surface border-brand/30 transition-all duration-300">
        <div className="flex flex-col gap-1">
          <span className="type-label text-label flex items-center gap-1.5">
            <Navigation className="size-4 text-brand" /> {t("stat_distance_title")}
          </span>
          <span className="type-display-md text-ink">{jarakKonsolidasi > 0 ? jarakKonsolidasi : 0} km</span>
          <span className="type-body-sm text-brand font-bold flex items-center gap-1">
            {t("stat_distance_vs", { val: jarakIndividual, saved: jarakPenghematan > 0 ? jarakPenghematan : 0 })}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="type-label text-label flex items-center gap-1.5">
            <Fuel className="size-4 text-brand" /> {t("stat_bbm_title")}
          </span>
          <span className="type-display-md text-ink">{t("liter_val", { val: bbmDihematLiter > 0 ? bbmDihematLiter : 0 })}</span>
          <span className="type-body-sm text-muted">{t("bbm_hint", { val: KM_PER_LITER_L300 })}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="type-label text-label flex items-center gap-1.5">
            <Leaf className="size-4 text-brand" /> {t("stat_co2_title")}
          </span>
          <span className="type-display-md text-brand">{co2eDihematKg > 0 ? co2eDihematKg : 0} kg CO₂e</span>
          <span className="type-body-sm text-muted" title={solar.sumber}>
            {t("co2_hint", { val: formatFaktor(solar.faktor) })} {solar.satuan},{" "}
            {solar.sumber.split(" (")[0]}
          </span>
        </div>
      </Card>

      {/* Tinggi tetap hanya masuk akal saat peta dan daftar berdampingan. Di
          satu kolom, `h-[600px]` dibagi dua baris dan peta — yang tingginya
          `h-full` dari baris auto — menciut jadi bilah pipih. Di bawah lg peta
          memakai tinggi sendiri dan daftar tumbuh sepanjang isinya. */}
      <div className="grid gap-6 lg:h-[600px] lg:grid-cols-[1.5fr_1fr]">
        {/* Interactive Map */}
        {/* `min-w-0`: jalur grid `auto` mengambil min-content butir terlebarnya,
            dan daftar perhentian di sebelahnya membawa alamat ber-`truncate`
            sepanjang 477px. Tanpa ini peta ikut melebar ke lebar itu di ponsel
            dan sisi kanannya terpotong `overflow-x: clip` milik cangkang. */}
        <Card variant="raised" className="relative z-0 h-[60vh] min-h-72 min-w-0 overflow-hidden border-line lg:h-full">
          <MapContainer center={[-7.68, 110.35]} zoom={11} className="w-full h-full" scrollWheelZoom={true}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            />
            {/* Depot Marker */}
            <Marker position={[DEPOT.lat, DEPOT.lng]} icon={depotIcon}>
              <Popup>
                <strong>{t("depot_name")}</strong><br/>
                {t("depot_popup")}
              </Popup>
            </Marker>

            {/* Shipment Markers */}
            {pengirimanList.map(p => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={customIcon}
                opacity={selectedIds.has(p.id) ? 1 : 0.4}
              >
                <Popup>
                  <strong>{p.petani}</strong><br/>
                  {p.komoditas} ({p.berat_kg} kg)<br/>
                  <div className="mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelection(p.id)}
                        className="accent-brand size-4"
                      />
                      {t("include_route")}
                    </label>
                  </div>
                </Popup>
              </Marker>
            ))}

            <Polyline positions={polylinePositions} color="#15803D" weight={4} dashArray="8, 8" />
          </MapContainer>
        </Card>

        {/* Urutan Rute Penjemputan */}
        <Card variant="raised" className="flex min-w-0 flex-col gap-5 p-5 sm:p-6 lg:h-full lg:overflow-y-auto">
          <div className="flex items-center justify-between flex-wrap gap-2 sticky top-0 bg-surface z-10 pb-2 border-b border-line">
            <h2 className="type-heading-md text-ink flex items-center gap-2">
              <ListOrdered className="size-5 text-brand" /> {t("tsp_title")}
            </h2>
            <Badge tone={lewatKapasitas ? "danger" : "brand"}>
              {t("load_val", { total: totalBerat.toLocaleString("id-ID"), max: ARMADA.kapasitasKg.toLocaleString("id-ID") })}
            </Badge>
          </div>

          {/* Guard kapasitas: satu pickup tidak bisa mengangkut lebih dari muatannya. */}
          {lewatKapasitas && (
            <div
              role="alert"
              className="rounded-md border border-danger bg-danger-tint p-3 flex items-start gap-2"
            >
              <AlertTriangle className="size-5 text-danger shrink-0 mt-0.5" aria-hidden />
              <p className="type-body-sm text-ink">
                {t("capacity_alert", { car: ARMADA.nama, val: kelebihanKg.toLocaleString("id-ID") })}
              </p>
            </div>
          )}

          <ol className="flex flex-col divide-y divide-line">
            {route.length === 0 ? (
              <p className="type-body-sm text-muted text-center py-4">{t("empty_route_hint")}</p>
            ) : (
              route.map((p) => (
                <li key={p.pengiriman.id} className="py-4 flex items-start gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-white font-bold type-mono-sm">
                    {p.urutan}
                  </span>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="type-heading-sm text-ink truncate">{p.pengiriman.petani}</span>
                      <span className="type-mono-sm font-bold text-ink shrink-0">{p.pengiriman.berat_kg} kg</span>
                    </div>
                    <p className="type-body-sm text-muted truncate">{p.pengiriman.alamat_jemput}</p>
                    <span className="type-mono-sm text-brand flex items-center gap-1">
                      <Clock className="size-3.5" aria-hidden /> {t("eta_val", { time: jamLokal(p.perkiraanTiba) })}
                    </span>
                  </div>
                </li>
              ))
            )}
          </ol>

          {/* Simpan rencana — tanpa ini hasil perencana hilang saat halaman dimuat ulang. */}
          <div className="mt-auto flex flex-col gap-2 sticky bottom-0 bg-surface pt-3 border-t border-line">
            <Button variant="primary" onClick={handleSimpan} disabled={!bisaSimpan}>
              <Save className="size-4" aria-hidden />
              {menyimpan ? t("saving_btn") : t("save_btn")}
            </Button>

            {tersimpan && (
              <p role="status" className="type-body-sm text-brand flex items-start gap-1.5">
                <Check className="size-4 shrink-0 mt-0.5" aria-hidden />
                <span>
                  {t("saved_status", { no: tersimpan.nomor, count: tersimpan.item.length })}
                </span>
              </p>
            )}

            {galat && (
              <p role="alert" className="type-body-sm text-danger flex items-start gap-1.5">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" aria-hidden />
                {galat}
              </p>
            )}

            {!tersimpan && !galat && (
              <span className="type-body-sm text-muted">
                {t("draft_hint")}
              </span>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
