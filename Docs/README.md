# RF Spectrum Orchestration & Compliance Platform (RSOCP)

> **Monitoring · AutoPilot · Radio** — Platform orkestrasi spektrum RF terpusat untuk infrastruktur ISP/WISP multi-vendor.

---

## Ringkasan Eksekutif

RSOCP adalah platform manajemen terpusat generasi berikutnya yang dirancang untuk mengotomatisasi pemantauan, analitik, orkestrasi konfigurasi, optimasi spektrum, dan penegakan kepatuhan regulasi pada infrastruktur radio wireless ISP/WISP. Platform ini mendukung perangkat multi-vendor (Cambium Networks, Mimosa by Airspan) dan dirancang untuk skala hingga 5.000+ node.

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Technology Stack](#technology-stack)
- [Struktur Dokumentasi](#struktur-dokumentasi)
- [Cara Memulai](#cara-memulai)
- [Deployment](#deployment)
- [Keamanan](#keamanan)
- [Kontribusi](#kontribusi)

---

## Fitur Utama

| Fitur                         | Deskripsi                                                     | Status    |
| ----------------------------- | ------------------------------------------------------------- | --------- |
| **Multi-Vendor Monitoring**   | Real-time monitoring Cambium & Mimosa via SNMP v2c/v3         | Phase 1   |
| **RF Analytics Engine**       | Scoring spektrum, deteksi interferensi, analisis kanal        | Phase 2   |
| **Frequency Recommendation**  | Rekomendasi frekuensi berbasis weighted scoring               | Phase 2   |
| **Safe Configuration Engine** | Remote config dengan rollback otomatis (30 detik timeout)     | Phase 3   |
| **Bulk Orchestration**        | Eksekusi massal topology-aware via BullMQ job queue           | Phase 3   |
| **Balmon Compliance Mode**    | Penegakan regulasi massal: 5725–5825 MHz, 20 MHz, 36 dBm EIRP | Phase 4   |
| **EIRP Auto-Calculation**     | `Max_Tx = Allowed_EIRP (36 dBm) − Antenna_Gain`               | Phase 4   |
| **Frequency Blacklist**       | Proteksi DFS Radar, BMKG, Satelit, Airport Radar              | Phase 1–4 |
| **Immutable Audit Log**       | Append-only log untuk semua aksi sistem                       | Phase 1   |
| **Topology Visualization**    | Graf parent–child untuk dependency-aware orchestration        | Phase 2   |
| **Alerting (Telegram/Email)** | Alert Link Down, High Noise, DFS Event, Compliance Violation  | Phase 1   |
| **AI Optimization**           | Predictive RF analytics & autonomous optimization             | Phase 5   |

---

## Arsitektur Sistem

```text
┌─────────────────────────────────────────────────────┐
│              Frontend (React + TypeScript)           │
│         TailwindCSS · Shadcn UI · Apache ECharts     │
└─────────────────────┬───────────────────────────────┘
                      │ HTTPS / WebSocket
┌─────────────────────▼───────────────────────────────┐
│            API Gateway (NestJS)                      │
│   Auth · Inventory · RF Analytics · Orchestration    │
│   Compliance · Alerting · Audit · Topology           │
└──────┬──────────────────────────────────┬───────────┘
       │ BullMQ Jobs                      │ Prisma ORM
┌──────▼──────────┐              ┌────────▼──────────┐
│  Worker Cluster │              │    PostgreSQL      │
│  (BullMQ/Redis) │              │  + TimescaleDB     │
│  NestJS + Go    │              │  (Metrics/Audit)   │
└──────┬──────────┘              └────────────────────┘
       │ SNMP v3 / REST API / SSH
┌──────▼──────────────────────────────────────────────┐
│           Wireless Radio Devices                     │
│   Cambium ePMP / PMP / cnWave  │  Mimosa B/A/C-Series│
└─────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer            | Teknologi                          | Alasan Pemilihan                                                       |
| ---------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| Frontend         | React 18 + TypeScript              | Type safety, ekosistem matang                                          |
| UI Framework     | TailwindCSS + Shadcn UI            | Komponen aksesibel, DRY                                                |
| Visualisasi      | Apache ECharts                     | Performa tinggi untuk time-series                                      |
| Backend API      | NestJS (Node.js)                   | Modular, TypeScript-native, DI                                         |
| Worker Engine    | BullMQ (Redis) + Go                | BullMQ untuk queue orchestration, Go untuk high-frequency SNMP polling |
| RF Analytics     | Python (FastAPI microservice)      | Library RF/DSP tersedia (NumPy, SciPy)                                 |
| Message Queue    | BullMQ (Redis-backed)              | Redis sudah ada di stack, tanpa dependency tambahan                    |
| Database         | PostgreSQL + Prisma ORM            | ACID, mature, Prisma untuk type-safe queries                           |
| Time-Series      | TimescaleDB (PostgreSQL extension) | Native hypertable, SQL-compatible                                      |
| Cache            | Redis                              | In-memory, digunakan bersama BullMQ                                    |
| Observability    | Prometheus + Grafana + Loki        | Stack observability standar industri                                   |
| Containerization | Docker + Docker Compose            | Reproduktibilitas lingkungan                                           |
| Orchestration    | Kubernetes (production)            | Auto-scaling worker, HA                                                |
| CI/CD            | GitHub Actions                     | Native GitHub integration                                              |
| OS Server        | Debian 13                          | Stabilitas LTS untuk produksi                                          |

---

## Struktur Dokumentasi

| Dokumen                                    | Deskripsi                                                                                       |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| [PRD.md](PRD.md)                           | Product Requirements Document — business goals, scope, functional & non-functional requirements |
| [SDD.md](SDD.md)                           | Software Design Document — arsitektur sistem, database design, business logic                   |
| [ERD.md](ERD.md)                           | Entity-Relationship Diagram — schema database lengkap dengan SQL DDL                            |
| [API_Docs.md](API_Docs.md)                 | API Documentation — semua endpoint REST + WebSocket                                             |
| [TDD.md](TDD.md)                           | Test Driven Development — strategi testing, test cases, coverage targets                        |
| [DRP.md](DRP.md)                           | Disaster Recovery Plan — prosedur recovery, RTO/RPO, queue management                           |
| [Security.md](Security.md)                 | Security Standards — kriptografi, RBAC, network segmentation                                    |
| [Infra_Deploy.md](Infra_Deploy.md)         | Infrastructure & Deployment — Docker, CI/CD, Linux hardening                                    |
| [UI_UX_Guidelines.md](UI_UX_Guidelines.md) | UI/UX Guidelines — design system, component standards                                           |

---

## Cara Memulai

### Prerequisites

- Node.js ≥ 20.x
- PNPM ≥ 9.x
- Docker ≥ 25.x + Docker Compose ≥ 2.x
- PostgreSQL 15 + TimescaleDB extension
- Redis 7.x

### Development Setup

```bash
# Clone repository
git clone https://github.com/Asamaludi26/Monitoring-AutoPilot-Radio.git
cd Monitoring-AutoPilot-Radio

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env sesuai konfigurasi lokal

# Jalankan database migration
pnpm prisma migrate dev

# Start development server
pnpm dev
```

### Docker (Recommended)

```bash
# Start seluruh stack
docker compose -f docker/docker-compose.yml up -d

# Lihat log
docker compose logs -f api worker
```

---

## Deployment

Lihat [Infra_Deploy.md](Infra_Deploy.md) untuk panduan lengkap deployment production, termasuk:

- Docker multi-stage build
- GitHub Actions CI/CD pipeline
- Linux server hardening (Debian 13)
- Kubernetes deployment
- Nginx reverse proxy + TLS

---

## Keamanan

Lihat [Security.md](Security.md) untuk detail standar keamanan:

- AES-256-GCM untuk enkripsi credential perangkat
- JWT + RBAC untuk autentikasi API
- SNMPv3 dengan auth SHA + enkripsi AES
- VLAN isolation per network segment
- Immutable audit log

---

## Kontribusi

1. Fork repository
2. Buat branch: `git checkout -b feature/nama-fitur`
3. Commit: `git commit -m 'feat: deskripsi singkat'`
4. Push: `git push origin feature/nama-fitur`
5. Buat Pull Request ke branch `main`

Pastikan semua unit test lulus (`pnpm test`) sebelum membuat PR.

---

## Lisensi

Lihat file [LICENSE](LICENSE).

---

_RSOCP — RF Spectrum Orchestration & Compliance Platform_  
_Version: 2.0 | Status: Active Development | Tanggal: 2026-05-07_
