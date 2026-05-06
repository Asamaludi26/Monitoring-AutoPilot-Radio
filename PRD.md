# Product Requirement Document (PRD): Centralized Radio Management System (CRMS)

**Project Name:** Radio Spectrum & Traffic Optimizer (RSTO)
**Author:** Senior Developer & Network Engineer
**Status:** Draft / Foundation
**Date:** 2026-05-06
**Target Devices:** 140+ Units (Cambium Networks & Mimosa by Airspan)

---

## 1. Executive Summary
Membangun platform manajemen terpusat untuk memantau, menganalisis, dan mengoptimalkan infrastruktur transmisi wireless. Fokus utama adalah efisiensi spektrum, maksimalisasi bandwidth melalui pemilihan frekuensi otomatis/terarah, kepatuhan terhadap regulasi pemerintah (Balmon), dan visualisasi trafik real-time dari 140+ perangkat multi-vendor.

## 2. Tujuan & Objektif
1.  **Sentralisasi:** Satu dashboard untuk semua perangkat Cambium dan Mimosa.
2.  **Visibilitas:** Monitoring real-time metrik radio (RSSI, SNR, MCS, Noise Floor, Throughput).
3.  **Optimalisasi:** Fitur rekomendasi dan eksekusi frekuensi terbaik untuk mengatasi interferensi.
4.  **Kepatuhan Regulasi (Compliance):** Memastikan operasional radio mematuhi aturan Balai Monitor (Balmon) secara cepat saat terjadi inspeksi, dan mengamankan frekuensi kritis secara permanen.
5.  **Otomatisasi:** Mengurangi beban kerja manual engineer dalam pengecekan satu-per-satu ke UI perangkat.

## 3. User Personas & Roles
* **Super Admin:** Akses penuh (Manajemen user, integrasi API/SNMP, eksekusi frekuensi, aktivasi Balmon Mode).
* **Network Engineer:** Monitoring dan eksekusi optimasi frekuensi (Write access to Radio).
* **NOC Viewer:** Monitoring dashboard dan log (Read-only).

## 4. Alur Bisnis (Business Logic Flow)

### A. Discovery & Inventory Flow
1. User memasukkan IP, Kredensial, dan Vendor (Cambium/Mimosa).
2. Sistem melakukan *validation handshake* via SNMP/API.
3. Data disimpan ke database PostgreSQL menggunakan Prisma ORM.

### B. Monitoring Flow (Polling)
1. **Background Worker (Python/NestJS)** melakukan polling berkala.
2. Mengambil data metrik: Tx/Rx Rate, Frequency, Signal Strength, Channel Width, EIRP, dan Spectrum Data.
3. Data disimpan ke database (PostgreSQL untuk status, Prometheus untuk Time-series trafik).

### C. Frequency Optimization Flow (Normal Mode)
1. **Analisis:** Sistem membandingkan Noise Floor dan Interference pada spektrum saat ini.
2. **Rekomendasi:** Sistem memberikan saran frekuensi terbaik untuk maksimalisasi bandwidth.
3. **Validasi Blacklist:** Sistem memastikan frekuensi yang disarankan **TIDAK** berada di frekuensi kritis/terlarang (BMKG, Radar Cuaca, Satelit, Penerbangan).
4. **Execution:** Engineer mengeksekusi rekomendasi.

### D. Regulatory Compliance Flow (Galat Balmon Mode)
1. **Activation:** Super Admin mengaktifkan "Balmon Mode" di Dashboard (Single-click / Bulk Action).
2. **Hard Constraints Application:** Sistem secara paksa mengubah konfigurasi 140+ perangkat secara paralel/terstruktur ke batasan regulasi:
    *   **Range Frekuensi:** Dipaksa masuk ke rentang **5725 - 5825 MHz**.
    *   **Channel Width:** Dipaksa menjadi **20 MHz**.
    *   **EIRP (Transmit Power + Antenna Gain):** Dibatasi maksimum **36 dBm (4 Watt)**.
3. **Bandwidth Maximization inside Balmon Mode:** Karena dibatasi di 20MHz, sistem akan mencari channel paling bersih *hanya* di dalam rentang 5725-5825 MHz untuk mempertahankan Modulasi (MCS) tertinggi agar throughput pelanggan tetap optimal.
4. **Deactivation (Post-Inspection):** Super Admin mematikan "Balmon Mode". Sistem akan menyarankan *roll-back* ke profil frekuensi "Max Bandwidth" sebelumnya, dengan tetap menerapkan aturan *Blacklist Frequency* yang ketat (menghindari frekuensi BMKG/Satelit).

## 5. Fitur Fungsional (Functional Requirements)

| ID | Fitur | Deskripsi |
| :--- | :--- | :--- |
| **FR-01** | Multi-Vendor Dashboard | View terpadu untuk perangkat Cambium (ePTP/TDD) dan Mimosa. |
| **FR-02** | Real-time Traffic Graph | Grafik Tx/Rx menggunakan Recharts/D3.js di frontend. |
| **FR-03** | Spectrum Analyzer | Visualisasi noise floor spektrum radio dalam bentuk heatmap/graph. |
| **FR-04** | Remote Config Execution | Kemampuan mengubah frekuensi, width, dan tx-power tanpa buka UI radio. |
| **FR-05** | Bulk Action | Eksekusi perubahan ke banyak perangkat sekaligus. |
| **FR-06** | Alerting System | Notifikasi via Telegram/Email jika link down atau interferensi tinggi. |
| **FR-07** | **Galat Balmon Mode** | Mode darurat compliance. Otomatis set Freq: 5725-5825MHz, Width: 20MHz, EIRP: Max 36dBm massal. |
| **FR-08** | **Frequency Blacklist** | Database internal untuk memblokir radio menggunakan frekuensi BMKG, DFS Radar, & Satelit selamanya. |

## 6. Spesifikasi Teknis & Arsitektur
Sesuai dengan *Workspace Standards* dan *Tech Stack* yang telah ditetapkan:

* **Frontend:** ReactJS (Vite), TypeScript, Tailwind CSS, Shadcn UI.
* **Backend:** NestJS (TypeScript) dengan Feature-Driven Architecture.
* **Database:** PostgreSQL (Primary), Prisma (ORM), Redis (Caching/Queue).
* **Protocol:** SNMP v2c/v3 (Primary), SSH/Paramiko (Fallback), Vendor REST API (jika tersedia).
* **Infrastructure:** Docker (Blueprint Pattern), Debian 13, GitHub Actions CI/CD.

## 7. Struktur Data (High-Level Schema)
* **Radios:** ID, Vendor, Model, IP, MAC, Credentials, Role, Frequency_ID, Is_Balmon_Active.
* **Metrics:** Radio_ID, Tx_Rate, Rx_Rate, Signal, SNR, Noise, Timestamp.
* **Audit_Logs:** User_ID, Action, Radio_ID, Old_Config, New_Config, Status, Timestamp.
* **Freq_Exclusions:** ID, Start_Freq, End_Freq, Category (BMKG/Satellite/Radar), Description.

## 8. Poin Penting & Mitigasi Risiko (Crucial Points)
1.  **Validasi EIRP:** EIRP dihitung dari `Tx Power + Antenna Gain`. Sistem harus membaca parameter antena (misal: antena 25 dBi di Mimosa) dan memastikan sistem menurunkan `Tx Power` maksimal ke 11 dBm saat Balmon Mode agar total tidak lebih dari 36 dBm.
2.  **Mitigasi BMKG & Satelit:** Pada saat normal (Non-Balmon), integrasikan fitur *Manual Exclusion* (seperti pada Mimosa) secara terpusat untuk memblokir rentang seperti 5600-5650 MHz (Radar Cuaca) di level API aplikasi, sehingga engineer tidak bisa tidak sengaja memilihnya.
3.  **Downtime saat Balmon Mode:** Perubahan frekuensi massal akan menyebabkan RTO. Sistem queue Redis/BullMQ harus mengeksekusi ini berdasarkan prioritas area atau topologi ring agar jaringan tidak mati total secara bersamaan.

## 9. Roadmap Pengembangan
* **Phase 1 (MVP):** Dashboard monitoring read-only & Inventory management.
* **Phase 2:** Integrasi grafik trafik, Alerting system, & Frequency Blacklist DB.
* **Phase 3:** Modul Optimasi & Eksekusi Konfigurasi (Normal Mode).
* **Phase 4:** Eksekusi Bulk Action & **Galat Balmon Mode (Compliance Automation)**.

---
*Dokumen ini bersifat dinamis dan akan diperbarui seiring dengan perkembangan teknis di lapangan.*
