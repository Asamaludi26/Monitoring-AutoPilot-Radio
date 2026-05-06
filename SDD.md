# Software Design Document (SDD)
**Nama Sistem:** Radio Spectrum & Traffic Optimizer (RSTO) / Centralized Radio Management System (CRMS)
**Tanggal:** 6 Mei 2026
**Target Infrastruktur:** 140+ Perangkat Radio (Cambium Networks & Mimosa by Airspan)

---

## 1. Pendahuluan
Dokumen ini mendefinisikan arsitektur sistem, desain komponen, skema basis data, dan spesifikasi teknis untuk sistem RSTO. RSTO dirancang sebagai platform sentralisasi manajemen untuk memantau, menganalisis, dan mengoptimalkan infrastruktur transmisi nirkabel *multi-vendor* (Cambium dan Mimosa). Tujuan utama mencakup maksimalisasi *bandwidth*, efisiensi spektrum, otomatisasi operasional, dan kepatuhan regulasi (Mode Balmon) secara *real-time*.

---

## 2. Arsitektur Sistem (High-Level Architecture)
Sistem menggunakan arsitektur *Client-Server* dengan pola *Feature-Driven Architecture* pada sisi *backend* untuk memastikan skalabilitas dan isolasi domain yang jelas.

### 2.1. Komponen Utama
* **Frontend Web Application:** Berbasis ReactJS (Vite) menggunakan TypeScript, Tailwind CSS, dan Shadcn UI untuk visualisasi antarmuka pengguna.
* **Backend API Services:** Berbasis NestJS (TypeScript) yang menyediakan RESTful API untuk klien dan mengelola logika bisnis.
* **Background Worker (Polling & Task Queue):** Sistem antrean menggunakan Redis (BullMQ) di dalam ekosistem NestJS untuk melakukan *polling* data metrik melalui SNMP/SSH dan mengeksekusi perubahan konfigurasi massal tanpa memblokir *thread* utama.
* **Database Engine:** PostgreSQL sebagai basis data utama relasional (dengan Prisma ORM), Redis untuk *caching* & *message queue*, serta Prometheus untuk penyimpanan data deret waktu (*time-series*) grafik metrik.

### 2.2. Pola Komunikasi (Device Integration)
* **Monitoring:** Menggunakan protokol SNMP v2c/v3 untuk *polling* metrik *read-only* (Tx/Rx Rate, Signal, MCS, dll).
* **Configuration Execution:** Menggunakan Vendor REST API (jika didukung) atau melakukan interaksi *Command Line* melalui SSH/Paramiko sebagai *fallback* mutlak untuk *write-access* ke perangkat.

---

## 3. Skema Basis Data (Database Design)
Database dikelola menggunakan Prisma ORM dengan PostgreSQL.

### 3.1. Tabel Referensi Inti (Core Entities)
| Tabel | Kolom Utama | Tipe Data | Deskripsi / Relasi |
| :--- | :--- | :--- | :--- |
| `User` | `id`, `username`, `password_hash`, `role` | UUID, String, Enum | Manajemen otorisasi (Super Admin, Network Engineer, NOC Viewer). |
| `RadioDevice` | `id`, `vendor`, `ip_address`, `mac_address`, `credentials_id`, `is_balmon_active` | UUID, Enum, IP, String, UUID, Boolean | Menyimpan data inventaris perangkat. |
| `DeviceCredentials` | `id`, `username`, `encrypted_password`, `snmp_community` | UUID, String, String, String | Disimpan terenkripsi penuh untuk menjamin keamanan. |
| `FrequencyExclusion` | `id`, `start_freq`, `end_freq`, `category`, `description` | UUID, Int, Int, Enum, String | *Blacklist DB* untuk BMKG, DFS Radar, & Satelit. |

### 3.2. Tabel Transaksional (Transactional & Logs)
| Tabel | Kolom Utama | Tipe Data | Deskripsi / Relasi |
| :--- | :--- | :--- | :--- |
| `AuditLog` | `id`, `user_id`, `action`, `radio_id`, `old_config`, `new_config`, `status`, `timestamp` | UUID, UUID, String, UUID, JSON, JSON, Enum, DateTime | Menjamin akuntabilitas aksi sistem. |
| `MetricSnapshot` | `id`, `radio_id`, `tx_rate`, `rx_rate`, `snr`, `noise`, `timestamp` | UUID, UUID, Float, Float, Float, Float, DateTime | (*Opsional*) Jika tidak menggunakan Prometheus, metrik historis disimpan di sini. |

---

## 4. Logika Bisnis & Mekanisme Kritis (Business Logic Engine)

### 4.1. Galat Balmon Mode (Regulatory Compliance Automation)
Fitur darurat ini membutuhkan tingkat ketelitian eksekusi yang tinggi agar *downtime* terminimalisir.
* **Algoritma Eksekusi:** Saat Super Admin mengaktifkan *Balmon Mode*, NestJS memproduksi modul tugas (Jobs) ke Redis (BullMQ) berdasarkan *Ring/Topology Priority* (tidak mengeksekusi 140+ perangkat secara instan bersamaan untuk mencegah RTO massal).
* **Hard Constraints Logic:**
    1.  *Channel Width:* Set ke `20 MHz`.
    2.  *Frequency Range:* Kalkulasi channel bersih hanya pada rentang `5725 - 5825 MHz`.
    3.  *EIRP Limitation:* Sistem akan mengambil nilai *Antenna Gain* perangkat.
        * Logika Perhitungan: `Tx_Power = 36 dBm - Antenna_Gain`.
        * Jika *Antenna Gain* adalah 25 dBi, maka `Tx_Power` secara otomatis dipaksa turun menjadi maksimal `11 dBm`.
* **Deaktivasi & Rollback:** Mengembalikan konfigurasi ke status sebelumnya menggunakan data `old_config` dari tabel `AuditLog`.

### 4.2. Frequency Optimization & Blacklisting
* Fungsi rekomendasi sistem mengekstrak data dari tabel `FrequencyExclusion` (Blacklist).
* Sistem secara mutlak memblokir (*API-level validation reject*) setiap upaya yang mencoba mengeksekusi pemindahan frekuensi ke pita spektrum BMKG, Penerbangan, atau Satelit.

### 4.3. Alerting System
Implementasi pola *Observer* di dalam NestJS. Saat *Background Worker* mendeteksi `Link Status == Down` atau `Noise Floor > Threshold`, *Event Emitter* akan memicu *Service Notification* untuk mengirim *payload* *webhook* ke Telegram API atau SMTP Server (Email).

---

## 5. Deployment & Operasional Infrastruktur
Infrastruktur mengedepankan isolasi keamanan dan reproduktibilitas lingkungan.

* **OS Server:** Debian 13 (Linux System).
* **Containerization:** Seluruh komponen di-*deploy* menggunakan Docker dengan pola *Blueprint* agar independen dan mencegah *file* lokal bocor ke *production*.
* **CI/CD Pipeline:** Otomatisasi pengujian dan rilis menggunakan GitHub Actions.
* **Package Manager:** Konfigurasi proyek difasilitasi menggunakan PNPM.

---

## 6. Standar Keamanan (Security Posture)
1.  **Credential Management:** Autentikasi lintas OSI Layer 7 menggunakan *JSON Web Tokens* (JWT), kredensial *Radio* (SNMP/SSH) menggunakan skema enkripsi *AES-256-GCM* sebelum disimpan ke PostgreSQL.
2.  **Input Validation:** Seluruh masuknya data divalidasi menggunakan *class-validator* di tingkat NestJS (*Pipes*) untuk menjamin *payload* sesuai konteks.
3.  **Idempotensi Eksekusi:** Logika konfigurasi bersifat idempoten; jika perintah gagal karena jaringan, *Worker* dapat mengulangi (retry) tugas tanpa merusak konfigurasi *existing*.
