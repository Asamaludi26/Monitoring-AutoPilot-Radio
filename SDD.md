# Software Design Document (SDD)

**Nama Sistem:** RF Spectrum Orchestration & Compliance Platform (RSOCP)
**Tanggal:** 6 Mei 2026
**Revisi:** 2026-05-07 (v1.1 — sinkronisasi dengan PRD v2.0)
**Target Infrastruktur:** 140+ Perangkat Radio (Cambium Networks & Mimosa by Airspan)

---

## 1. Pendahuluan

Dokumen ini mendefinisikan arsitektur sistem, desain komponen, skema basis data, dan spesifikasi teknis untuk sistem RSOCP. RSOCP dirancang sebagai platform sentralisasi manajemen untuk memantau, menganalisis, dan mengoptimalkan infrastruktur transmisi nirkabel _multi-vendor_ (Cambium dan Mimosa). Tujuan utama mencakup maksimalisasi _bandwidth_, efisiensi spektrum, otomatisasi operasional, dan kepatuhan regulasi (Mode Balmon) secara _real-time_.

> **Catatan Nama Sistem:** Dokumen ini menggunakan nama kanonik **RSOCP** (RF Spectrum Orchestration & Compliance Platform) yang selaras dengan PRD v2.0. Nama "RSTO" dan "CRMS" adalah nama awal yang tidak lagi digunakan.

---

## 2. Arsitektur Sistem (High-Level Architecture)

Sistem menggunakan arsitektur _Client-Server_ dengan pola _Feature-Driven Architecture_ pada sisi _backend_ untuk memastikan skalabilitas dan isolasi domain yang jelas.

### 2.1. Komponen Utama

- **Frontend Web Application:** Berbasis ReactJS (Vite) menggunakan TypeScript, Tailwind CSS, dan Shadcn UI untuk visualisasi antarmuka pengguna.
- **Backend API Services:** Berbasis NestJS (TypeScript) yang menyediakan RESTful API + WebSocket untuk klien dan mengelola logika bisnis.
- **Background Worker — BullMQ (NestJS):** Sistem antrean menggunakan Redis (BullMQ) di dalam ekosistem NestJS untuk mengelola job lifecycle: enqueueing, prioritization, retry dengan exponential backoff, dan dead-letter queue. Bertugas mengorkestrasikan konfigurasi massal, serta meneruskan instruksi ke Go Worker melalui queue.
- **Background Worker — Go Polling Service:** Service terpisah berbasis Go yang bertanggung jawab untuk _high-frequency SNMP polling_ (15–60 detik interval) ke seluruh perangkat radio. Go dipilih karena keunggulan konkurensi goroutine untuk menangani polling ribuan perangkat secara bersamaan tanpa thread overhead. Service ini menulis hasil polling langsung ke TimescaleDB.
- **RF Analytics Microservice (Python/FastAPI):** Microservice terpisah berbasis Python yang menjalankan algoritma scoring RF (NumPy/SciPy), deteksi interferensi, dan rekomendasi frekuensi. Dipanggil oleh Backend API melalui HTTP internal.
- **Database Engine:** PostgreSQL 15 sebagai basis data utama relasional (dengan Prisma ORM), Redis 7 untuk _caching_ & _message queue_ (BullMQ), serta **TimescaleDB** (PostgreSQL extension) untuk penyimpanan data deret waktu (_time-series_) metrik RF dan telemetri perangkat.

### 2.2. Pola Komunikasi (Device Integration)

- **Monitoring:** Menggunakan protokol SNMP v2c/v3 untuk _polling_ metrik _read-only_ (Tx/Rx Rate, Signal, MCS, dll).
- **Configuration Execution:** Menggunakan Vendor REST API (jika didukung) atau melakukan interaksi _Command Line_ melalui SSH/Paramiko sebagai _fallback_ mutlak untuk _write-access_ ke perangkat.

---

## 3. Skema Basis Data (Database Design)

Database dikelola menggunakan Prisma ORM dengan PostgreSQL.

### 3.1. Tabel Referensi Inti (Core Entities)

| Tabel                | Kolom Utama                                                                       | Tipe Data                             | Deskripsi / Relasi                                               |
| :------------------- | :-------------------------------------------------------------------------------- | :------------------------------------ | :--------------------------------------------------------------- |
| `User`               | `id`, `username`, `password_hash`, `role`                                         | UUID, String, Enum                    | Manajemen otorisasi (Super Admin, Network Engineer, NOC Viewer). |
| `RadioDevice`        | `id`, `vendor`, `ip_address`, `mac_address`, `credentials_id`, `is_balmon_active` | UUID, Enum, IP, String, UUID, Boolean | Menyimpan data inventaris perangkat.                             |
| `DeviceCredentials`  | `id`, `username`, `encrypted_password`, `snmp_community`                          | UUID, String, String, String          | Disimpan terenkripsi penuh untuk menjamin keamanan.              |
| `FrequencyExclusion` | `id`, `start_freq`, `end_freq`, `category`, `description`                         | UUID, Int, Int, Enum, String          | _Blacklist DB_ untuk BMKG, DFS Radar, & Satelit.                 |

### 3.2. Tabel Transaksional (Transactional & Logs)

| Tabel            | Kolom Utama                                                                                                     | Tipe Data                                            | Deskripsi / Relasi                                                                                                                                                                                      |
| :--------------- | :-------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AuditLog`       | `id`, `user_id`, `action`, `radio_id`, `old_config`, `new_config`, `status`, `timestamp`                        | UUID, UUID, String, UUID, JSON, JSON, Enum, DateTime | Menjamin akuntabilitas aksi sistem.                                                                                                                                                                     |
| `MetricSnapshot` | `time`, `radio_id`, `rssi`, `snr`, `noise_floor`, `throughput_tx`, `throughput_rx`, `retry_rate`, `temperature` | TIMESTAMPTZ, UUID, Float×                            | **TimescaleDB Hypertable (mandatory).** Data time-series polling SNMP. Tidak disimpan di PostgreSQL biasa — menggunakan `create_hypertable('metric_snapshot','time')` untuk partisi otomatis per-waktu. |

> **Keputusan Arsitektur — Time-Series Storage:** Sistem menggunakan **TimescaleDB** sebagai penyimpanan metrik utama (_bukan_ Prometheus murni). Prometheus digunakan sebagai _scraper_ dan _alerting engine_ untuk metrik infrastruktur (CPU, RAM container). Metrik RF perangkat (RSSI, SNR, Noise, Throughput) disimpan di TimescaleDB karena: (1) SQL-compatible sehingga analitik RF kompleks dapat dilakukan tanpa query language khusus; (2) merupakan extension PostgreSQL sehingga tidak menambah database engine baru; (3) mendukung kompresi native dan retention policy otomatis.

---

## 4. Logika Bisnis & Mekanisme Kritis (Business Logic Engine)

### 4.1. Galat Balmon Mode (Regulatory Compliance Automation)

Fitur darurat ini membutuhkan tingkat ketelitian eksekusi yang tinggi agar _downtime_ terminimalisir.

- **Algoritma Eksekusi:** Saat Super Admin mengaktifkan _Balmon Mode_, NestJS memproduksi modul tugas (Jobs) ke Redis (BullMQ) berdasarkan _Ring/Topology Priority_ (tidak mengeksekusi 140+ perangkat secara instan bersamaan untuk mencegah RTO massal).
- **Hard Constraints Logic:**
  1.  _Channel Width:_ Set ke `20 MHz`.
  2.  _Frequency Range:_ Kalkulasi channel bersih hanya pada rentang `5725 - 5825 MHz`.
  3.  _EIRP Limitation:_ Sistem akan mengambil nilai _Antenna Gain_ perangkat.
      - Logika Perhitungan: `Tx_Power = 36 dBm - Antenna_Gain`.
      - Jika _Antenna Gain_ adalah 25 dBi, maka `Tx_Power` secara otomatis dipaksa turun menjadi maksimal `11 dBm`.
- **Deaktivasi & Rollback:** Mengembalikan konfigurasi ke status sebelumnya menggunakan data `old_config` dari tabel `AuditLog`.

### 4.2. Frequency Optimization & Blacklisting

- Fungsi rekomendasi sistem mengekstrak data dari tabel `FrequencyExclusion` (Blacklist).
- Sistem secara mutlak memblokir (_API-level validation reject_) setiap upaya yang mencoba mengeksekusi pemindahan frekuensi ke pita spektrum BMKG, Penerbangan, atau Satelit.

### 4.3. Alerting System

Implementasi pola _Observer_ di dalam NestJS. Saat _Background Worker_ mendeteksi `Link Status == Down` atau `Noise Floor > Threshold`, _Event Emitter_ akan memicu _Service Notification_ untuk mengirim _payload_ _webhook_ ke Telegram API atau SMTP Server (Email).

---

## 5. Deployment & Operasional Infrastruktur

Infrastruktur mengedepankan isolasi keamanan dan reproduktibilitas lingkungan.

- **OS Server:** Debian 13 (Linux System).
- **Containerization:** Seluruh komponen di-_deploy_ menggunakan Docker dengan pola _Blueprint_ agar independen dan mencegah _file_ lokal bocor ke _production_.
- **CI/CD Pipeline:** Otomatisasi pengujian dan rilis menggunakan GitHub Actions.
- **Package Manager:** Konfigurasi proyek difasilitasi menggunakan PNPM.

---

## 6. Standar Keamanan (Security Posture)

1.  **Credential Management:** Autentikasi lintas OSI Layer 7 menggunakan _JSON Web Tokens_ (JWT), kredensial _Radio_ (SNMP/SSH) menggunakan skema enkripsi _AES-256-GCM_ sebelum disimpan ke PostgreSQL.
2.  **Input Validation:** Seluruh masuknya data divalidasi menggunakan _class-validator_ di tingkat NestJS (_Pipes_) untuk menjamin _payload_ sesuai konteks.
3.  **Idempotensi Eksekusi:** Logika konfigurasi bersifat idempoten; jika perintah gagal karena jaringan, _Worker_ dapat mengulangi (retry) tugas tanpa merusak konfigurasi _existing_.
