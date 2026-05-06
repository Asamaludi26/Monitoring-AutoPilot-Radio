# Product Requirements Document (PRD)

# RF Spectrum Orchestration & Compliance Platform (RSOCP)

Version: 2.0
Status: Revised Draft
Author: System Architecture Review
Date: 2026-05-06

---

# 1. Executive Summary

RF Spectrum Orchestration & Compliance Platform (RSOCP) adalah platform terpusat untuk monitoring, analitik, orkestrasi konfigurasi radio wireless, optimasi spektrum, dan otomatisasi kepatuhan regulasi pada infrastruktur radio ISP/WISP.

Platform ini dirancang untuk mengelola perangkat multi-vendor seperti:

- Cambium Networks
- Mimosa by Airspan
- Vendor lain berbasis SNMP/API di masa depan

Target utama sistem:

1. Monitoring real-time seluruh radio
2. Analitik kualitas RF secara terpusat
3. Optimasi spektrum berbasis scoring engine
4. Orkestrasi perubahan konfigurasi secara aman
5. Regulatory compliance automation
6. Minimasi interferensi dan downtime
7. Skalabilitas hingga ribuan perangkat

Platform ini bukan sekadar dashboard monitoring, tetapi bertindak sebagai:

# RF Orchestration & Compliance Platform

---

# 2. Problem Statement

Saat ini engineer melakukan:

- pengecekan radio satu per satu
- login manual ke device
- monitoring terpisah
- perubahan frekuensi secara manual
- pengecekan regulasi secara manual

Masalah yang muncul:

- Human error tinggi
- Sulit melakukan compliance massal
- Sulit mendeteksi interferensi
- Tidak ada centralized RF intelligence
- Downtime saat perubahan frekuensi
- Tidak ada rollback otomatis
- Sulit melakukan audit

---

# 3. Business Goals

| Goal                   | Description                                       |
| ---------------------- | ------------------------------------------------- |
| Centralized Management | Seluruh radio dapat dimonitor dari satu platform  |
| RF Optimization        | Maksimalisasi kualitas link dan throughput        |
| Compliance Automation  | Kepatuhan regulasi dapat dilakukan massal         |
| Operational Efficiency | Mengurangi pekerjaan manual engineer              |
| Reliability            | Mengurangi outage akibat perubahan konfigurasi    |
| Scalability            | Mendukung pertumbuhan perangkat hingga >5000 node |

---

# 4. User Roles

## 4.1 Super Admin

Hak akses:

- Full access
- Global orchestration
- Regulatory mode activation
- User management
- System settings
- Rollback approval

## 4.2 Network Engineer

Hak akses:

- Monitoring
- RF analysis
- Frequency recommendation execution
- Single/bulk configuration
- View audit logs

## 4.3 NOC Operator

Hak akses:

- Read-only monitoring
- Alarm acknowledgement
- Dashboard access
- Incident visibility

---

# 5. System Scope

## In Scope

- Multi-vendor radio monitoring
- RF analytics
- Traffic analytics
- Frequency recommendation
- Safe remote configuration
- Bulk orchestration
- Regulatory compliance mode
- Audit logging
- Alerting
- Topology visualization
- Rollback engine

## Out of Scope (Phase Awal)

- AI autonomous optimization penuh
- Routing protocol management
- MPLS orchestration
- Automatic tower alignment
- SD-WAN management

---

# 6. High Level Architecture

```text
Frontend Dashboard
        |
API Gateway
        |
-------------------------------------------------
|               |               |                |
Inventory    RF Analytics   Compliance      Alerting
Service      Service        Service         Service
|               |               |                |
-------------------------------------------------
        |
Task Orchestrator
(RabbitMQ / BullMQ)
        |
Device Workers
        |
SNMP / REST API / SSH
        |
Wireless Radios
```

---

# 7. Recommended Technology Stack

| Layer                | Technology                         | Catatan                                                                                      |
| -------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------- |
| Frontend             | React 18 + TypeScript              | Vite build                                                                                   |
| UI Framework         | TailwindCSS + Shadcn UI            | Komponen aksesibel                                                                           |
| Visualization        | Apache ECharts                     | Time-series performa tinggi                                                                  |
| Backend API          | NestJS (Node.js)                   | Modular, DI, TypeScript-native                                                               |
| Worker Engine        | BullMQ (NestJS) + Go               | BullMQ untuk orchestration queue; Go untuk high-frequency SNMP polling                       |
| RF Analytics         | Python (FastAPI microservice)      | NumPy/SciPy untuk DSP & scoring                                                              |
| **Queue System**     | **BullMQ (Redis-backed)**          | **Berjalan di atas Redis yang sudah ada di stack; tidak memerlukan message broker terpisah** |
| Relational Database  | PostgreSQL 15 + Prisma ORM         | ACID, type-safe queries                                                                      |
| Time-Series Database | TimescaleDB (PostgreSQL extension) | Hypertable native, SQL-compatible                                                            |
| Cache                | Redis 7                            | In-memory, digunakan bersama BullMQ                                                          |
| Monitoring           | Grafana                            | Dashboard observability                                                                      |
| Metrics              | Prometheus                         | Scraping + alerting rules                                                                    |
| Logs                 | Loki                               | Log aggregation                                                                              |
| Containerization     | Docker + Docker Compose            | Reproduktibilitas lingkungan                                                                 |
| Orchestration        | Kubernetes                         | Auto-scaling, HA production                                                                  |
| CI/CD                | GitHub Actions                     | Native GitHub integration                                                                    |
| OS                   | Debian 13                          | Stabilitas LTS                                                                               |

> **Keputusan Arsitektur — Queue System:** Platform ini menggunakan **BullMQ (Redis-backed)** sebagai queue engine, bukan RabbitMQ. Alasan: (1) Redis sudah menjadi dependency wajib untuk caching; menambah RabbitMQ akan menambah operational overhead tanpa manfaat signifikan pada skala target. (2) BullMQ menyediakan fitur job prioritization, delay, retry dengan exponential backoff, dan dead-letter queue yang cukup untuk kebutuhan orchestration platform ini. (3) BullMQ terintegrasi native dengan ekosistem NestJS via `@nestjs/bull`. (4) Jika di masa depan diperlukan multi-broker atau event streaming, migrasi ke Kafka dapat dilakukan secara bertahap tanpa mengubah business logic.

---

# 8. Core System Modules

# 8.1 Inventory Management Module

Fungsi:

- Menyimpan seluruh data radio
- Device discovery
- Vendor classification
- Credential management
- Firmware inventory
- Antenna profile inventory

Data yang disimpan:

- IP Address
- MAC Address
- Vendor
- Model
- Firmware Version
- Country Code
- Antenna Gain
- GPS Sync Status
- Link Role
- Topology Relationship

---

# 8.2 Real-Time Monitoring Module

Metrik utama:

| Metric           | Description                |
| ---------------- | -------------------------- |
| RSSI             | Signal strength            |
| SNR              | Signal-to-noise ratio      |
| CINR             | Carrier interference ratio |
| MCS Rate         | Modulation coding scheme   |
| Tx/Rx Throughput | Traffic rate               |
| Retry Rate       | Retransmission percentage  |
| Noise Floor      | RF interference baseline   |
| Air Utilization  | Channel congestion         |
| DFS Events       | Radar detection events     |
| Temperature      | Device thermal state       |
| CPU/RAM          | Device health              |

Polling interval:

| Metric Type   | Interval     |
| ------------- | ------------ |
| Traffic       | 15 seconds   |
| RF Metrics    | 30 seconds   |
| Device Health | 60 seconds   |
| Spectrum Scan | 5-15 minutes |

---

# 8.3 RF Analytics Engine

RF Analytics Engine bertanggung jawab untuk:

- Analisis kualitas spektrum
- Deteksi interferensi
- Channel scoring
- Adjacent channel detection
- Historical RF correlation
- Frequency recommendation

Sistem tidak hanya menentukan frekuensi berdasarkan noise floor.

Parameter analisis:

| Parameter             | Weight |
| --------------------- | ------ |
| SNR                   | High   |
| Noise Floor           | High   |
| MCS Stability         | High   |
| Retry Rate            | High   |
| DFS Event             | Medium |
| Air Utilization       | Medium |
| Historical Stability  | High   |
| Adjacent Interference | High   |

Contoh RF Scoring Formula:

```text
RF_SCORE =
(SNR * Weight)
+ (MCS Stability)
- (Noise Penalty)
- (Retry Penalty)
- (DFS Penalty)
- (Adjacent Channel Interference)
+ (Historical Stability)
```

---

# 8.4 Frequency Recommendation Engine

Mode operasi:

## Advisory Mode

Sistem:

- hanya memberikan rekomendasi
- engineer melakukan approval manual

## Assisted Automation Mode

Sistem:

- melakukan perubahan otomatis
- per-link execution
- rollback otomatis jika gagal

## Autonomous Mode (Future)

Sistem:

- melakukan RF optimization otomatis penuh
- berbasis AI prediction

Catatan:

Mode autonomous tidak diimplementasikan pada fase awal.

---

# 8.5 Safe Configuration Engine

Fungsi:

- Remote configuration
- Safe commit
- Validation
- Rollback otomatis
- Dependency awareness

Safe Commit Flow:

```text
Apply Config
      ↓
Wait Reconnect
      ↓
Heartbeat Validation
      ↓
Success → Commit
Failure → Rollback
```

Rollback rule:

- Jika radio tidak reconnect dalam 30 detik
- Sistem otomatis revert ke konfigurasi sebelumnya

---

# 8.6 Topology Awareness Engine

Sistem harus memahami hubungan parent-child antar radio.

Contoh:

```text
POP A
 ├── Relay B
 │     ├── Client C
 │     └── Client D
```

Tujuan:

- Mencegah mass outage
- Menghindari perubahan parent terlebih dahulu
- Menentukan execution order
- Menjaga stabilitas network topology

---

# 8.7 Regulatory Compliance Engine

## Regulatory Compliance Mode (Balmon Mode)

Mode darurat untuk kepatuhan regulasi.

Saat mode diaktifkan:

| Parameter       | Value           |
| --------------- | --------------- |
| Frequency Range | 5725 - 5825 MHz |
| Channel Width   | 20 MHz          |
| Max EIRP        | 36 dBm          |

Sistem melakukan:

- Bulk configuration execution
- RF recalculation
- Safe orchestration
- Compliance validation

---

# 9. EIRP Validation Logic

Sistem wajib menghitung EIRP real.

Rumus:

```text
EIRP = Tx Power + Antenna Gain - Cable Loss
```

Contoh:

| Parameter    | Value  |
| ------------ | ------ |
| Tx Power     | 18 dBm |
| Antenna Gain | 25 dBi |
| Cable Loss   | 1 dB   |
| Result EIRP  | 42 dBm |

Status:

- ILLEGAL
- Melebihi batas 36 dBm

Sistem harus otomatis menghitung:

```text
Max Tx Power = Allowed EIRP - Antenna Gain
```

Contoh:

```text
Allowed EIRP = 36 dBm
Antenna Gain = 25 dBi
Max TX Power = 11 dBm
```

---

# 10. Frequency Exclusion Engine

Sistem harus memiliki database exclusion internal.

Kategori:

| Category          | Description             |
| ----------------- | ----------------------- |
| DFS Radar         | Radar weather detection |
| BMKG Radar        | Radar cuaca nasional    |
| Satellite         | Satelit komunikasi      |
| Airport Radar     | Radar penerbangan       |
| Military Reserved | Frekuensi khusus        |

Fungsi:

- Mencegah engineer memilih frekuensi terlarang
- Regulatory enforcement
- Compliance validation

---

# 11. Functional Requirements

| ID    | Feature                  | Description                    |
| ----- | ------------------------ | ------------------------------ |
| FR-01 | Multi-Vendor Monitoring  | Monitoring Cambium dan Mimosa  |
| FR-02 | Real-Time Traffic Graph  | Grafik traffic real-time       |
| FR-03 | RF Analytics             | Analitik RF dan scoring        |
| FR-04 | Spectrum Visualization   | Heatmap dan spectrum graph     |
| FR-05 | Frequency Recommendation | Rekomendasi frekuensi terbaik  |
| FR-06 | Remote Configuration     | Remote configuration execution |
| FR-07 | Bulk Configuration       | Eksekusi massal                |
| FR-08 | Safe Commit              | Safe apply dan rollback        |
| FR-09 | Compliance Mode          | Regulatory automation          |
| FR-10 | Frequency Blacklist      | Frequency exclusion database   |
| FR-11 | Topology Visualization   | Dependency awareness           |
| FR-12 | Alerting System          | Telegram/email alert           |
| FR-13 | Audit Logging            | Immutable activity log         |
| FR-14 | Device Health Monitoring | CPU, RAM, Temperature          |
| FR-15 | Firmware Compliance      | Firmware validation            |

---

# 12. Non-Functional Requirements

| Requirement           | Target      |
| --------------------- | ----------- |
| Max Devices           | 5000+       |
| Dashboard Latency     | < 2 seconds |
| Polling Success Rate  | > 99%       |
| Config Success Rate   | > 99%       |
| Rollback Success Rate | 100%        |
| API Availability      | 99.9%       |
| Audit Log Retention   | 2 years     |
| Metrics Retention     | 12 months   |
| Concurrent Workers    | 1000+       |

---

# 13. Database Design (High-Level)

## Radios

| Field            | Type    |
| ---------------- | ------- |
| ID               | UUID    |
| Vendor           | String  |
| Model            | String  |
| IP Address       | String  |
| MAC Address      | String  |
| Firmware Version | String  |
| Antenna Gain     | Integer |
| Frequency        | Integer |
| Channel Width    | Integer |
| Tx Power         | Integer |
| Country Code     | String  |
| GPS Sync         | Boolean |
| Parent Radio ID  | UUID    |

## Metrics

| Field       | Type      |
| ----------- | --------- |
| Radio ID    | UUID      |
| RSSI        | Float     |
| SNR         | Float     |
| CINR        | Float     |
| Noise Floor | Float     |
| Throughput  | Float     |
| Retry Rate  | Float     |
| Timestamp   | Timestamp |

## Audit Logs

| Field      | Type      |
| ---------- | --------- |
| User ID    | UUID      |
| Action     | String    |
| Device ID  | UUID      |
| Old Config | JSONB     |
| New Config | JSONB     |
| Status     | String    |
| Timestamp  | Timestamp |

---

# 14. Alerting System

Jenis alert:

| Alert Type           | Trigger                  |
| -------------------- | ------------------------ |
| Link Down            | Device unreachable       |
| High Noise           | Noise threshold exceeded |
| DFS Event            | Radar detection          |
| High Retry Rate      | Retry anomaly            |
| High Temperature     | Overheat                 |
| Compliance Violation | EIRP violation           |
| Firmware Outdated    | Unsupported firmware     |

Notification channels:

- Telegram
- Email
- Webhook
- Slack (future)

---

# 15. Security Requirements

| Requirement           | Description                 |
| --------------------- | --------------------------- |
| RBAC                  | Role-based access control   |
| SNMPv3                | Secure SNMP preferred       |
| Encrypted Credentials | AES encrypted secrets       |
| Audit Logging         | Immutable logs              |
| MFA                   | Multi-factor authentication |
| API Authentication    | JWT/OAuth2                  |
| Session Expiry        | Automatic timeout           |

---

# 16. Risks & Mitigation

| Risk                  | Impact                  | Mitigation                   |
| --------------------- | ----------------------- | ---------------------------- |
| Mass Frequency Change | Network outage          | Topology-aware orchestration |
| Invalid Config        | Device isolation        | Rollback engine              |
| RF Interference       | Throughput degradation  | RF scoring engine            |
| Compliance Failure    | Regulatory issue        | Compliance engine            |
| Firmware Bug          | Device instability      | Firmware validation          |
| Queue Failure         | Execution inconsistency | Persistent queue system      |

---

# 17. Development Roadmap

# Phase 1 — Monitoring Foundation

Features:

- Inventory management
- Device discovery
- Real-time monitoring
- Traffic graph
- Alerting

# Phase 2 — RF Intelligence

Features:

- RF analytics
- Spectrum visualization
- Frequency scoring
- Historical analytics

# Phase 3 — Safe Orchestration

Features:

- Remote configuration
- Bulk actions
- Safe commit
- Rollback engine
- Topology awareness

# Phase 4 — Compliance Automation

Features:

- Balmon mode
- EIRP calculation
- Frequency exclusion
- Compliance enforcement

# Phase 5 — AI Optimization

Features:

- Predictive RF analytics
- AI recommendation
- Autonomous optimization
- Interference prediction

---

# 18. Future Enhancements

Planned future features:

- AI-based interference prediction
- RF heatmap visualization
- Mobile application
- Multi-region clustering
- GIS integration
- Fiber + wireless topology mapping
- OSPF/BGP visibility
- SLA analytics

---

# 19. Final Engineering Principles

Platform ini wajib mengikuti prinsip berikut:

1. Safety over automation
2. Compliance by design
3. Rollback first architecture
4. Topology-aware orchestration
5. RF engineering driven decisions
6. Immutable auditability
7. High scalability
8. Vendor abstraction architecture

---

# 20. Conclusion

RSOCP dirancang sebagai platform orkestrasi RF modern untuk kebutuhan ISP/WISP yang membutuhkan:

- centralized monitoring
- RF intelligence
- regulatory compliance
- scalable orchestration
- safe automation

Platform ini ditujukan menjadi fondasi sistem manajemen radio generasi berikutnya yang dapat berkembang dari monitoring platform menjadi autonomous RF optimization system.
