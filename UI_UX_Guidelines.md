# UI/UX Design Guidelines

# RF Spectrum Orchestration & Compliance Platform (RSOCP)

Version: 1.1
Status: Active
Revisi: 2026-05-07 — Penambahan Real-Time Patterns, Balmon Mode UI, Component Specs lengkap
Target Audience: Frontend Engineers, UI/UX Designers

---

## 1. Design Philosophy

Antarmuka RSOCP bukan sekadar aplikasi web biasa, melainkan alat operasional kritikal. Filosofi desain kita berpusat pada:

1. **Cognitive Load Reduction:** Insinyur jaringan berurusan dengan banyak data. UI harus bersih (_clean_), mengelompokkan informasi dengan logis, dan tidak bising secara visual.
2. **Action-Oriented:** Data yang ditampilkan harus memandu pengguna (Super Admin/Network Engineer) untuk mengambil keputusan cepat (misal: _Frequency Recommendation_ atau _Safe Commit_).
3. **High Density, High Clarity:** Mampu menampilkan banyak baris data (seperti tabel inventaris perangkat) tanpa terlihat berantakan.
4. **Resilience Awareness:** Memberikan umpan balik visual yang sangat jelas saat melakukan operasi berisiko tinggi (_mass frequency change_, _rollback_).

---

## 2. Theme & Visual Language

### 2.1. Primary Theme: Dark Mode

Platform ini menjadikan **Dark Mode sebagai default absolut**, menargetkan kenyamanan mata untuk _NOC Operator_ yang bekerja dalam shift panjang di ruangan minim cahaya.

### 2.2. Color Palette (Tailwind CSS based)

| Role                     | Color Family | Tailwind Class (Dark)           | Usage                                       |
| :----------------------- | :----------- | :------------------------------ | :------------------------------------------ |
| **Background (Base)**    | Zinc/Slate   | `bg-zinc-950`                   | Latar belakang utama aplikasi               |
| **Surface (Card/Panel)** | Zinc/Slate   | `bg-zinc-900`                   | Latar panel, _card_, _dropdown_             |
| **Primary Accent**       | Blue         | `text-blue-500` / `bg-blue-600` | Tombol utama, _active state_, link          |
| **Success (Safe)**       | Emerald      | `text-emerald-500`              | Status UP, _Safe Commit Success_            |
| **Warning (Alert)**      | Amber        | `text-amber-500`                | DFS Event, _High Retry Rate_, _Warning_     |
| **Danger (Critical)**    | Rose         | `text-rose-500`                 | Status DOWN, _Balmon Compliance Violation_  |
| **Text Primary**         | Zinc         | `text-zinc-100`                 | Teks utama, _heading_, label                |
| **Text Muted**           | Zinc         | `text-zinc-400`                 | Teks sekunder, _placeholder_, _helper text_ |

---

## 3. Layout Structure

Sistem menggunakan tata letak aplikasi _enterprise_ yang sangat terstruktur dan adaptif (_mobile-responsive_), meskipun fokus utamanya adalah penggunaan _desktop_.

### 3.1. Global Layout Grid

- **Sidebar (Left):** Navigasi vertikal yang dapat di-_collapse_. Berisi modul utama (Dashboard, Inventory, RF Analytics, Task Orchestrator, Settings).
- **Top Navbar:** Digunakan untuk _Global Search_ (MAC/IP Address), _Breadcrumbs_, _Notification Center_, dan _User Profile_.
- **Main Content Area:** Area dinamis untuk _Data Tables_, _Charts_, dan _Forms_. Dibatasi dengan _max-width_ (misal: `max-w-screen-2xl`) pada resolusi _ultrawide_ agar tetap fokus.

### 3.2. Responsive Behavior

- **Desktop ( > 1024px):** Layout penuh (Sidebar terbuka + Main Content).
- **Tablet ( 768px - 1024px):** Sidebar dalam mode _collapsed_ (hanya ikon) secara default.
- **Mobile ( < 768px):** Sidebar disembunyikan dan dipindahkan ke _Hamburger Menu_ (_Sheet/Drawer_). Tabel data kompleks diubah bentuknya menjadi _Card-based list_.

---

## 4. Component Library (Shadcn UI Standards)

Kita menggunakan **Shadcn UI** untuk konsistensi, aksesibilitas, dan penulisan kode yang DRY (_Don't Repeat Yourself_).

### 4.1. Data Display

- **Data Tables:** Gunakan `@tanstack/react-table` yang dibungkus dengan komponen _Table_ Shadcn. Wajib menyertakan fitur: _Sorting_, _Filtering_ per-kolom, dan _Pagination_ dinamis. Gunakan _sticky header_ untuk tabel dengan lebih dari 20 baris.
- **Cards:** Gunakan _Card_ untuk mengelompokkan metrik (misal: total _device down_, rata-rata _noise floor_).
- **Badges:** Gunakan _Badge_ bergradasi warna keras (Merah/Hijau/Kuning) HANYA untuk status kritis. Status netral gunakan warna abu-abu (_muted_).

---

## 5. Real-Time Data Update Patterns

Platform RSOCP memiliki dua jalur data: **WebSocket push** untuk event kritis, dan **REST polling** untuk data periodik. Frontend harus memanfaatkan keduanya dengan tepat.

### 5.1 Kapan Menggunakan WebSocket vs REST Polling

| Data Type                                   | Strategi                                 | Alasan                                                   |
| ------------------------------------------- | ---------------------------------------- | -------------------------------------------------------- |
| Live device metrics (SNR, RSSI, Throughput) | WebSocket subscribe per-device           | Latency < 2 detik, hindari HTTP overhead per-request     |
| Job orchestration progress                  | WebSocket event `orchestration.progress` | Real-time progress bar, tidak perlu polling              |
| Alert notifikasi                            | WebSocket event `alert.created`          | CRITICAL alert harus muncul < 2 detik setelah terdeteksi |
| Historical metrics chart                    | REST GET `/monitoring/{id}/history`      | Data statis, tidak butuh real-time                       |
| Inventory list                              | REST GET `/devices` + polling 60 detik   | Jarang berubah, WebSocket terlalu berat                  |
| Topology graph                              | REST GET `/topology` + polling 30 detik  | Low-frequency update cukup                               |

### 5.2 Visual Indicator untuk Live Data

Setiap komponen yang menampilkan data real-time **wajib** menampilkan:

```
[ ● LIVE ]  — indikator hijau berkedip (pulse animation)
```

Implementasi dengan Tailwind:

```tsx
// LiveIndicator component
export const LiveIndicator = () => (
  <span className="flex items-center gap-1.5 text-xs text-emerald-400">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
    LIVE
  </span>
);
```

### 5.3 Stale Data Handling

Jika WebSocket terputus (koneksi hilang > 10 detik):

1. Tampilkan banner **`⚠ Data mungkin tidak terkini — koneksi real-time terputus`** di atas panel monitoring
2. Warna metrik berubah dari normal ke `text-zinc-400` (muted) untuk menandakan data stale
3. Tampilkan timestamp terakhir yang berhasil diterima: `"Terakhir diperbarui: 14:32:05"`
4. Auto-reconnect dengan exponential backoff (1s → 2s → 4s → 8s → max 30s)
5. Saat reconnect berhasil: banner hilang, warna kembali normal, indikator LIVE muncul kembali

```tsx
// Contoh hook WebSocket dengan stale detection
const { data, isStale, lastUpdated } = useDeviceMetrics(deviceId, {
  staleThreshold: 10_000, // 10 detik
  reconnectBackoff: [1000, 2000, 4000, 8000, 30000],
});
```

---

## 6. Balmon Mode — Visual Treatment

Balmon Mode adalah operasi **regulasi kritikal** yang mengubah konfigurasi ratusan perangkat sekaligus untuk memastikan kepatuhan terhadap peraturan SDPPI/BMKG. Kesalahan eksekusi berdampak pada **outage massal**. UI harus mencerminkan beratnya operasi ini.

### 6.1 Status Indikator Balmon Mode (Global Banner)

Saat Balmon Mode **aktif**, tampilkan **persistent banner** di bagian paling atas aplikasi (di atas navbar):

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠ BALMON MODE AKTIF — Semua device sedang dalam proses compliance  │
│  Frekuensi: 5725–5825 MHz | Max EIRP: 36 dBm | Job: uuid-xxxx      │
│                                              [ Lihat Progress ] [ Batalkan ]  │
└─────────────────────────────────────────────────────────────────────┘
```

- Background: `bg-amber-900/80 border-b border-amber-500`
- Ikon: `⚠` amber, bukan merah (mode aktif tapi belum tentu ada error)
- Jika ada device yang rollback/gagal: banner berubah menjadi merah (`bg-rose-900/80 border-rose-500`)

### 6.2 Konfirmasi Dialog (Multi-Step)

Sebelum Balmon Mode diaktifkan, wajib gunakan **3-step confirmation dialog**:

**Step 1 — Review Scope:**

```
Judul: "Aktivasi Balmon Mode"
Body:
  Operasi ini akan mengubah konfigurasi [142] perangkat.
  - Frekuensi: 5725–5825 MHz
  - Channel Width: 20 MHz
  - Max Tx Power: [11 dBm] (berdasarkan Max EIRP 36 dBm - Antenna Gain rata-rata 25 dBi)
  - Execution Strategy: TOPOLOGY_AWARE

  [Batal]  [Lanjut →]
```

**Step 2 — Dampak Downstream:**

```
  Perangkat yang akan terdampak memiliki [387] client downstream.
  Client akan mengalami downtime sementara (~30–90 detik) saat proses commit.
  Pastikan maintenance window telah dikomunikasikan.

  ☐ Saya memahami dan telah berkoordinasi dengan tim NOC
  [← Kembali]  [Konfirmasi & Aktifkan →]
```

**Step 3 — PIN / MFA Verification:**

```
  Masukkan kode TOTP untuk mengkonfirmasi identitas Anda:
  [ _ _ _ _ _ _ ]

  [Batal]  [Aktifkan Balmon Mode]
```

> **Keputusan desain:** 3-step dialog dirancang untuk mencegah "fat-finger activation" (aktivasi tidak sengaja). MFA re-verification di Step 3 memastikan bahwa orang yang menekan tombol adalah pemilik akun SUPER_ADMIN yang sah — bukan sesi yang dibajak.

### 6.3 Danger Zone Styling

Semua tombol dan area yang berhubungan dengan aksi destruktif atau high-risk menggunakan **Danger Zone pattern**:

```tsx
// Danger Zone wrapper — di Settings atau konfigurasi kritis
<div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-6">
  <h3 className="text-rose-400 font-semibold flex items-center gap-2">
    <ShieldAlertIcon size={18} />
    Zona Berbahaya
  </h3>
  <p className="text-zinc-400 text-sm mt-1 mb-4">
    Tindakan berikut tidak dapat dibatalkan atau memiliki dampak operasional
    besar.
  </p>
  <Button variant="destructive" size="sm">
    Aktifkan Balmon Mode
  </Button>
</div>
```

### 6.4 Progress Visualization saat Balmon Mode Berjalan

Gunakan komponen **Multi-Device Progress Panel** yang terhubung ke WebSocket `orchestration.progress`:

```
┌────────────────────────────────────────────────────┐
│ Balmon Mode Progress                    65% (91/140)│
│ ████████████████████████░░░░░░░░░░░░░░░░            │
│                                                    │
│ ✓ Sukses:  89 device                               │
│ ✗ Gagal:    2 device  (10.10.10.5, 10.10.10.7)    │
│ ⟳ Rollback: 0 device                               │
│ ⏸ Antrian: 49 device                               │
│                                              [Stop] │
└────────────────────────────────────────────────────┘
```

- Progress bar: Gunakan Shadcn `Progress` component
- Setiap device yang gagal: dapat diklik untuk melihat error detail
- Tombol Stop: Hanya muncul jika ada device yang belum diproses, memicu rollback untuk semua device yang sudah berhasil

---

## 7. RF-Specific Component Specifications

### 7.1 Signal Strength Indicator (RSSI)

Komponen visual untuk RSSI — jangan hanya tampilkan angka mentah, gunakan visual gauge:

```tsx
type RSSILevel = "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "CRITICAL";

function getRSSILevel(rssi: number): RSSILevel {
  if (rssi >= -65) return "EXCELLENT"; // hijau
  if (rssi >= -70) return "GOOD"; // emerald
  if (rssi >= -75) return "FAIR"; // amber
  if (rssi >= -80) return "POOR"; // orange
  return "CRITICAL"; // rose
}

const RSSI_COLORS: Record<RSSILevel, string> = {
  EXCELLENT: "text-emerald-400 bg-emerald-400",
  GOOD: "text-emerald-500 bg-emerald-500",
  FAIR: "text-amber-400 bg-amber-400",
  POOR: "text-orange-400 bg-orange-400",
  CRITICAL: "text-rose-500 bg-rose-500",
};
```

Display format:

```
RSSI  ●●●●○  -68 dBm  [GOOD]
SNR   ████░  28 dB    [FAIR]
```

### 7.2 Spectrum Channel Visualizer

Untuk halaman RF Analytics, tampilkan visualisasi kanal frekuensi menggunakan Apache ECharts:

- X-Axis: Frekuensi (MHz), range 5150–5925 MHz
- Y-Axis: Signal level (dBm)
- Layer 1: Noise floor (garis abu-abu putus-putus, biasanya -90 hingga -80 dBm)
- Layer 2: Device's current channel (bar hijau/biru, lebar sesuai channel_width)
- Layer 3: Interferensi terdeteksi (overlay merah transparan)
- Layer 4: Exclusion zones (overlay abu-abu, tidak bisa dipilih)
- Layer 5: Recommended channel (bar hijau berkedip)

```tsx
// ECharts config snippet untuk spectrum visualizer
const option: EChartsOption = {
  xAxis: {
    type: "value",
    min: 5150,
    max: 5925,
    name: "Frequency (MHz)",
    axisLabel: { formatter: (v: number) => `${v}` },
  },
  yAxis: {
    type: "value",
    min: -100,
    max: -40,
    name: "Signal (dBm)",
  },
  series: [
    {
      name: "Current Channel",
      type: "bar",
      barWidth: channelWidth,
      itemStyle: { color: "#22c55e" },
    },
    {
      name: "Interference",
      type: "bar",
      barWidth: channelWidth,
      itemStyle: { color: "rgba(239,68,68,0.3)" },
    },
    {
      name: "Recommended",
      type: "bar",
      barWidth: channelWidth,
      itemStyle: { color: "#3b82f6" },
    },
  ],
};
```

### 7.3 EIRP Calculator Widget

Komponen interaktif untuk kalkulasi EIRP on-the-fly:

```
┌─────────────────────────────────┐
│  EIRP Calculator                │
│                                 │
│  Tx Power:      [11] dBm        │
│  Antenna Gain:  [25] dBi        │
│  Cable Loss:    [ 1] dB         │
│  ─────────────────────          │
│  EIRP: 35 dBm    ✓ LEGAL       │
│  Limit: 36 dBm (Balmon)        │
│                                 │
│  Max Tx Power yang diizinkan:  │
│  36 - 25 = [11] dBm            │
└─────────────────────────────────┘
```

- Jika EIRP ≤ 36 dBm: `text-emerald-400`, ikon ✓
- Jika EIRP > 36 dBm: `text-rose-500`, ikon ✗, tampilkan rekomendasi Tx Power
- Update kalkulasi secara real-time saat input berubah (`onChange`)

---

## 8. Toast & Notification Specifications

Gunakan Shadcn `Sonner` (toast) untuk feedback operasi. Spesifikasi per event:

| Event                  | Toast Type | Duration   | Pesan                                                 |
| ---------------------- | ---------- | ---------- | ----------------------------------------------------- |
| Login berhasil         | success    | 3s         | "Selamat datang, {username}"                          |
| Config update berhasil | success    | 5s         | "Konfigurasi {device} berhasil diperbarui"            |
| Balmon Mode diaktifkan | warning    | persistent | "Balmon Mode aktif — 142 device dalam proses"         |
| Rollback triggered     | error      | 10s        | "Rollback dijalankan pada {device}: {reason}"         |
| LINK_DOWN alert        | error      | 10s        | "⚠ LINK DOWN: {device_name} ({ip})"                   |
| WebSocket reconnect    | info       | 3s         | "Koneksi real-time dipulihkan"                        |
| Rate limit hit         | warning    | 5s         | "Terlalu banyak permintaan. Coba lagi dalam 60 detik" |

Aturan toast:

- Gunakan `position: 'top-right'`
- CRITICAL events (`LINK_DOWN`, `Rollback`) juga harus menampilkan notifikasi browser (`Notification API`) jika tab tidak aktif
- Jangan tumpuk lebih dari 4 toast sekaligus — queue sisanya

---

## 9. Aksesibilitas (a11y) Standards

1. **Keyboard Navigation:** Semua interactive element harus bisa diakses dengan Tab/Enter/Space/Arrow keys
2. **ARIA Labels:** Tombol ikon-only wajib memiliki `aria-label` deskriptif. Contoh: `<Button aria-label="Hapus device">` bukan `<Button><TrashIcon /></Button>`
3. **Color Contrast:** Minimum WCAG AA (4.5:1 untuk teks normal, 3:1 untuk teks besar). Cek dengan [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
4. **Status bukan hanya warna:** Jangan hanya menggunakan warna untuk menyampaikan status — selalu sertakan ikon atau teks. Contoh buruk: kotak merah saja. Contoh baik: `🔴 OFFLINE` atau `✗ OFFLINE`
5. **Focus Trap:** Semua modal dialog harus mengimplementasikan focus trap agar screen reader tidak bisa keluar dari dialog yang sedang terbuka

---

## 10. Internasionalisasi (i18n)

Platform RSOCP saat ini menargetkan **Bahasa Indonesia** sebagai bahasa utama (target pengguna: tim NOC/Engineering SDPPI dan ISP Indonesia), dengan potensi ekspansi ke English.

- Gunakan `react-i18next` untuk manajemen string
- Semua string UI harus melalui translation key, **tidak boleh hardcode** teks Bahasa Indonesia langsung dalam JSX
- Contoh: `t('device.status.online')` → `"ONLINE"` / `"Daring"`
- Format tanggal: `dd MMM yyyy HH:mm:ss WIB` (gunakan `date-fns` dengan locale `id`)
- Format angka: gunakan `Intl.NumberFormat('id-ID')` untuk angka besar (ribuan menggunakan titik, desimal koma)

---

## 11. Performance Guidelines

1. **Virtualisasi Tabel:** Untuk tabel dengan > 100 baris, gunakan `@tanstack/react-virtual` untuk virtual scrolling — jangan render semua baris sekaligus ke DOM
2. **ECharts Lazy Load:** Import Apache ECharts secara dynamic (`import('echarts')`) agar tidak masuk ke bundle awal
3. **WebSocket Throttle:** Jika server mengirim metrics update setiap 5 detik, React state update tidak perlu di-trigger setiap kali — gunakan `useDeferredValue` atau debounce untuk komponen non-kritis
4. **Image Optimization:** Logo vendor (Cambium, Mimosa) gunakan format SVG atau WebP dengan lazy loading
5. **Bundle Splitting:** Setiap halaman utama (Dashboard, Inventory, RF Analytics, Orchestrator) harus menjadi code-split chunk terpisah menggunakan React lazy + Suspense

---

### 4.2. Feedback & Interaction

- **Dialogs / Modals:** Wajib digunakan untuk aksi konfirmasi berisiko tinggi. Contoh: Saat menekan eksekusi _Frequency Recommendation_, _Modal_ harus merangkum dampak (berapa radio yang akan terputus sesaat) sebelum tombol konfirmasi aktif.
- **Toasts:** Gunakan _Sonner_ atau _Toast_ untuk notifikasi _non-blocking_ (misal: "Proses sinkronisasi SNMP dimulai...").
- **Skeleton Loaders:** Hindari penggunaan _spinner_ statis yang terlalu besar. Gunakan komponen _Skeleton_ dengan bentuk yang merepresentasikan data asli saat terjadi _fetching data_.

---

## 5. Typography & Iconography

- **Font Family:** `Inter` atau `Roboto` (standar keterbacaan tinggi untuk angka numerik dan tabel).
- **Monospace Font:** `JetBrains Mono` atau `Fira Code`. **Wajib digunakan** untuk merender MAC Address, IP Address, log _system_, atau _raw config_.
- **Icons:** Gunakan `Lucide React`. Hindari penggunaan ikon multi-warna, gunakan ikon _line-art_ solid yang warnanya diatur melalui kelas utilitas teks Tailwind.

---

## 6. System States & Edge Cases

Sebagai aplikasi _engineering_, UI harus selalu jujur tentang _state_ saat ini.

1.  **Empty States:** Jika tabel kosong (misal: tidak ada _alert_ atau _device_), tampilkan ilustrasi minimalis dan teks informatif yang jelas (misal: "Tidak ada interferensi terdeteksi di site ini.") beserta tombol aksi terkait jika memungkinkan.
2.  **Error States:** Jangan pernah memunculkan _blank white screen_. Jika _API fetching_ gagal, tangkap _error_ di tingkat komponen (menggunakan _Error Boundaries_ di React) dan tampilkan _Card Error_ dengan opsi "Retry Connection".
3.  **Real-time State:** Untuk komponen yang menggunakan data _polling_ (seperti metrik RF 30 detik), berikan indikator visual kecil (seperti _pulsing dot_ hijau di pojok _card_) untuk menandakan _WebSocket/Polling_ sedang aktif dan data valid.

---

## 7. Accessibility (A11y) & UX Engineering

- **Keyboard Navigation:** Setiap aksi utama (pencarian, navigasi tabel, pengiriman _form_) wajib mendukung navigasi tabulasi (_Tab key_).
- **Focus Management:** Elemen yang sedang difokuskan (terutama saat _modal_ konfirmasi _Rollback_ terbuka) harus memiliki `ring` yang jelas (misal: `focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`).
- **Color Contrast:** Pastikan kontras teks terhadap latar belakang lolos standar WCAG AA (rasio minimal 4.5:1), sangat penting mengingat platform berjalan di _Dark Mode_.
