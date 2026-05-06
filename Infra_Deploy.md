# Infrastructure & Deployment Playbook

**RF Spectrum Orchestration & Compliance Platform (RSOCP)**
Version: 1.1
Revisi: 2026-05-07 — Penambahan TimescaleDB, Docker Secrets, observability stack lengkap
Environment Target: Production (Distributed System)

---

# 1. Tujuan Dokumen

Dokumen ini menjadi panduan standar untuk:

- Deployment sistem berbasis **distributed worker (BullMQ + Redis)**
- Standarisasi **containerization (Docker)**
- Implementasi **CI/CD pipeline (GitHub Actions)**
- Hardening **server Linux (Debian 13)**
- Manajemen resource pada **virtualized environment (Proxmox)**
- Setup **network layer (Reverse Proxy, Load Balancer, SNMP/SSH routing)**

Dokumen ini bersifat **mandatory reference** untuk seluruh aktivitas DevOps & SRE.

---

# 2. Arsitektur Infrastruktur (Production Blueprint)

## 2.1 Logical Components

- **Frontend (React/Vite)**
- **Backend API (NestJS)**
- **Worker Cluster — BullMQ (NestJS) + Go Polling Service**
- **RF Analytics Microservice (Python/FastAPI)**
- **Redis Cluster (Queue + Cache)**
- **PostgreSQL + TimescaleDB** (transactional + time-series)
- **Prometheus + Grafana + Loki** (observability stack)
- **Reverse Proxy (Nginx / Traefik)**

## 2.2 Deployment Pattern

Menggunakan pendekatan:

> **Blueprint Deployment Pattern**

Artinya:

- Tidak ada file `.env` langsung di repo
- Semua environment di-_inject_ saat runtime
- Image Docker bersifat **immutable & reusable**

---

# 3. Standarisasi Docker Deployment

## 3.1 Struktur Repository

```
/apps
  /frontend
  /backend
  /worker
/docker
  docker-compose.yml
  docker-compose.prod.yml
  .env.example
```

---

## 3.2 Dockerfile Best Practice

### Backend / Worker

```Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

CMD ["node", "dist/main.js"]
```

### Prinsip:

- Gunakan **multi-stage build**
- Hindari `.env` di dalam image
- Gunakan `npm ci` untuk deterministic install

---

## 3.3 Environment Injection (ANTI LEAK STRATEGY)

Gunakan:

- Docker Secrets / ENV runtime
- GitHub Actions secrets
- `.env.production` hanya di server

Contoh:

```bash
docker run -e DATABASE_URL=$DATABASE_URL \
           -e REDIS_HOST=$REDIS_HOST \
           app-backend:latest
```

**Dilarang:**

- commit `.env`
- bake ENV ke image

---

## 3.4 Docker Compose Production

```yaml
# docker/docker-compose.prod.yml
# Catatan: image postgres:15 sudah include TimescaleDB jika menggunakan image
# timescale/timescaledb:latest-pg15 — ini wajib untuk metric_snapshot hypertable.

version: "3.9"

services:
  api:
    image: registry/rsocp-api:latest
    deploy:
      replicas: 2
    restart: unless-stopped
    env_file:
      - .env.production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      retries: 3

  worker-bullmq:
    image: registry/rsocp-worker:latest
    deploy:
      replicas: 4
    restart: unless-stopped
    env_file:
      - .env.production

  worker-go-poller:
    image: registry/rsocp-go-poller:latest
    deploy:
      replicas: 2
    restart: unless-stopped
    env_file:
      - .env.production

  rf-analytics:
    image: registry/rsocp-rf-analytics:latest # Python/FastAPI microservice
    restart: unless-stopped
    env_file:
      - .env.production

  redis:
    image: redis:7-alpine
    command: >
      redis-server
      --appendonly yes
      --appendfsync everysec
      --maxmemory 2gb
      --maxmemory-policy allkeys-lru
    restart: unless-stopped
    volumes:
      - redisdata:/data

  postgres:
    image: timescale/timescaledb:latest-pg15 # Wajib: TimescaleDB extension untuk metric_snapshot hypertable
    restart: unless-stopped
    environment:
      POSTGRES_DB: rsocp_db
      POSTGRES_USER: rsocp_user
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
    secrets:
      - postgres_password
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rsocp_user -d rsocp_db"]
      interval: 30s
      retries: 5

  prometheus:
    image: prom/prometheus:latest
    restart: unless-stopped
    volumes:
      - ./observability/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - promdata:/prometheus

  grafana:
    image: grafana/grafana:latest
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_PASSWORD_FILE: /run/secrets/grafana_password
    secrets:
      - grafana_password
    volumes:
      - grafanadata:/var/lib/grafana
      - ./observability/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro

  loki:
    image: grafana/loki:latest
    restart: unless-stopped
    volumes:
      - ./observability/loki-config.yml:/etc/loki/local-config.yaml:ro
      - lokidata:/loki

secrets:
  postgres_password:
    file: ./secrets/postgres_password.txt
  grafana_password:
    file: ./secrets/grafana_password.txt

volumes:
  pgdata:
  redisdata:
  promdata:
  grafanadata:
  lokidata:
```

> **Keputusan Arsitektur — TimescaleDB Image:** Menggunakan `timescale/timescaledb:latest-pg15` bukan `postgres:15` biasa. Alasan: TimescaleDB extension harus tersedia sebelum `CREATE EXTENSION timescaledb;` dan `create_hypertable()` dapat dijalankan. Menggunakan image terpisah menghindari prosedur manual install extension di dalam container.

> **Keputusan Arsitektur — Docker Secrets:** Password database dan Grafana disimpan via Docker Secrets (file), bukan ENV variable langsung di compose file. Ini mengikuti prinsip defense-in-depth — credentials tidak terekspos via `docker inspect` atau process list.

---

# 4. CI/CD Pipeline (GitHub Actions)

## 4.1 Pipeline Flow

1. **Push / PR**
2. Run **Lint + Unit Test**
3. Build Docker Image
4. Push ke Registry
5. Deploy ke Server (SSH / Runner)

---

## 4.2 Contoh Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: ["main"]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Install
        run: npm ci

      - name: Test
        run: npm run test

      - name: Build Docker
        run: docker build -t registry/rsto-api .

      - name: Push
        run: docker push registry/rsto-api

  deploy:
    needs: build
    runs-on: ubuntu-latest

    steps:
      - name: SSH Deploy
        run: |
          ssh user@server "
          docker pull registry/rsto-api &&
          docker compose up -d
          "
```

---

## 4.3 Release Strategy

- **Main branch = production**
- Gunakan:
  - Tagging: `v1.0.0`
  - Blue-Green Deployment (optional)
  - Rolling update untuk worker

---

# 5. Linux Server Hardening (Debian 13)

## 5.1 Basic Security

```bash
apt update && apt upgrade -y
apt install ufw fail2ban
```

### Firewall

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

---

## 5.2 SSH Hardening

Edit:

```
/etc/ssh/sshd_config
```

```
PermitRootLogin no
PasswordAuthentication no
Port 2222
```

---

## 5.3 Fail2Ban

```bash
systemctl enable fail2ban
```

---

## 5.4 System Limits

```
/etc/sysctl.conf
```

```
fs.file-max = 100000
net.core.somaxconn = 65535
```

---

# 6. Resource Management (Proxmox)

## 6.1 VM Allocation Strategy

| Component | CPU | RAM | Notes              |
| --------- | --- | --- | ------------------ |
| API       | 2   | 4GB | Stateless          |
| Worker    | 4   | 8GB | Heavy SNMP polling |
| Redis     | 2   | 4GB | In-memory          |
| DB        | 4   | 8GB | Critical           |

---

## 6.2 Scaling Strategy

- Horizontal scale:
  - Worker (priority)
  - API

- Vertical scale:
  - PostgreSQL
  - Redis

---

## 6.3 Worker Queue Optimization

- Gunakan concurrency:

```ts
new Worker(queueName, processor, {
  concurrency: 20,
});
```

- Pisahkan queue:
  - polling
  - config execution
  - compliance

---

# 7. Reverse Proxy & Load Balancing

## 7.1 Nginx Config

```nginx
upstream api_cluster {
    server api1:3000;
    server api2:3000;
}

server {
    listen 80;

    location / {
        proxy_pass http://api_cluster;
    }
}
```

---

## 7.2 HTTPS (TLS)

Gunakan Let's Encrypt:

```bash
certbot --nginx
```

---

## 7.3 Load Balancing Strategy

- API → Round Robin
- Worker → Queue-based (BullMQ)
- Redis → Single / Cluster (future)

---

# 8. Network & Device Communication Layer

## 8.1 SNMP Configuration

- Gunakan SNMPv3 (secure)
- Batasi access IP

```
snmp-server community secure RO
```

---

## 8.2 SSH Execution

Gunakan:

- Key-based auth
- Timeout control
- Retry mechanism

---

## 8.3 Port Management

| Protocol / Service | Port      | Eksposur                                    |
| ------------------ | --------- | ------------------------------------------- |
| SNMP (UDP)         | 161       | Internal (Worker → Device)                  |
| SSH                | 22 / 2222 | Internal (Worker → Device)                  |
| Backend API        | 3000      | Internal (via Nginx proxy)                  |
| Redis              | 6379      | Internal only — **jangan expose ke publik** |
| PostgreSQL         | 5432      | Internal only                               |
| Prometheus         | 9090      | Internal only                               |
| Grafana            | 3001      | Internal (akses via VPN/bastion)            |
| Nginx HTTP         | 80        | Public (redirect ke 443)                    |
| Nginx HTTPS        | 443       | Public                                      |

---

## 8.4 Network Isolation

- VLAN untuk device radio
- Backend server tidak expose langsung ke internet

---

# 9. Observability & Monitoring

## 9.1 Metrics (Prometheus)

Metrik yang di-scrape Prometheus:

| Metrik                               | Sumber             | Signifikansi               |
| ------------------------------------ | ------------------ | -------------------------- |
| `rsocp_worker_jobs_completed_total`  | BullMQ Worker      | Throughput job queue       |
| `rsocp_worker_jobs_failed_total`     | BullMQ Worker      | Error rate eksekusi        |
| `rsocp_snmp_poll_duration_seconds`   | Go Poller          | Latency polling per device |
| `rsocp_snmp_poll_success_rate`       | Go Poller          | % polling berhasil         |
| `rsocp_api_request_duration_seconds` | NestJS             | API P95 latency            |
| `rsocp_active_devices_total`         | Inventory Service  | Jumlah device online       |
| `rsocp_balmon_jobs_queued`           | Compliance Service | Status eksekusi Balmon     |

```yaml
# observability/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: rsocp-api
    static_configs:
      - targets: ["api:3000"]
    metrics_path: /metrics

  - job_name: rsocp-worker
    static_configs:
      - targets: ["worker-bullmq:3001"]

  - job_name: rsocp-go-poller
    static_configs:
      - targets: ["worker-go-poller:2112"]

  - job_name: postgres
    static_configs:
      - targets: ["postgres-exporter:9187"]

  - job_name: redis
    static_configs:
      - targets: ["redis-exporter:9121"]
```

## 9.2 TimescaleDB Initialization

Setelah container postgres (TimescaleDB) pertama kali berjalan, jalankan init script:

```sql
-- Aktifkan extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Buat hypertable untuk metrik RF
SELECT create_hypertable('metric_snapshot', 'time', if_not_exists => TRUE);

-- Compression policy: kompres data > 1 hari
ALTER TABLE metric_snapshot SET (timescaledb.compress, timescaledb.compress_segmentby = 'radio_id');
SELECT add_compression_policy('metric_snapshot', INTERVAL '1 day');

-- Retention policy: hapus data > 90 hari
SELECT add_retention_policy('metric_snapshot', INTERVAL '90 days');
```

> **Justifikasi Retention 90 hari:** Data metrik RF digunakan untuk analitik tren jangka menengah (interferensi musiman, degradasi hardware). 90 hari memberikan coverage 3 bulan tanpa overhead storage berlebih. Data yang lebih lama dapat di-archive ke object storage (S3) sebelum dihapus jika diperlukan untuk audit.

## 9.3 Logging (Loki + Grafana)

Semua service menggunakan structured logging format JSON:

```ts
// NestJS: contoh log entry
{
  "level": "error",
  "timestamp": "2026-05-07T10:30:00Z",
  "service": "rsocp-worker",
  "job_id": "uuid",
  "device_id": "uuid",
  "message": "SSH connection timeout",
  "retry_count": 2
}
```

Log dikirim ke Loki via Promtail atau Docker log driver langsung.

## 9.4 Grafana Dashboards (Wajib)

| Dashboard              | Konten                                    |
| ---------------------- | ----------------------------------------- |
| **RSOCP Overview**     | Active devices, queue depth, API latency  |
| **RF Metrics**         | SNR, RSSI, Noise Floor per device         |
| **Worker Performance** | Job throughput, failure rate, queue age   |
| **Compliance Tracker** | Balmon activation status, EIRP violations |
| **PostgreSQL Health**  | Connection pool, query latency, storage   |

---

# 10. Backup & Disaster Recovery

## 10.1 Database Backup

```bash
pg_dump > backup.sql
```

## 10.2 Redis Snapshot

```
save 900 1
```

---

## 10.3 Recovery Plan

- Restore DB
- Restart worker
- Rebuild queue (idempotent job design)

---

# 11. Deployment Checklist (MANDATORY)

**Pre-deployment:**

- [ ] ENV tidak hardcoded di image atau repo
- [ ] Docker image immutable (no env baked in)
- [ ] CI/CD pipeline green (semua test pass)
- [ ] Staging deployment telah diverifikasi
- [ ] `docker compose config` tidak menunjukkan error

**Security:**

- [ ] Firewall (ufw) aktif dengan rules minimal
- [ ] SSH hardened (no root, key-only, custom port)
- [ ] Fail2ban aktif
- [ ] Redis tidak expose ke publik
- [ ] PostgreSQL tidak expose ke publik
- [ ] TLS aktif (HTTPS only untuk API)
- [ ] Docker Secrets digunakan (bukan plain ENV untuk credential)

**Data & Persistence:**

- [ ] Redis AOF aktif (`appendonly yes`)
- [ ] PostgreSQL WAL archiving aktif
- [ ] TimescaleDB hypertable + compression policy aktif
- [ ] Retention policy TimescaleDB dikonfigurasi
- [ ] Backup otomatis dikonfigurasi dan ditest

**Observability:**

- [ ] Prometheus scraping semua service
- [ ] Grafana dashboard tersedia
- [ ] Loki menerima log dari semua container
- [ ] Alertmanager rules dikonfigurasi

**Operational:**

- [ ] Worker scaling tested (scale up/down via `docker compose up --scale`)
- [ ] SNMP connectivity ke seluruh device verified
- [ ] Health check endpoint API berjalan
- [ ] Rollback procedure telah ditest di staging

---

# 12. Penutup

Playbook ini dirancang untuk memastikan:

- **Zero human error deployment**
- **Scalable distributed processing**
- **Secure device orchestration**
- **High availability RF management system**

Dokumen ini harus menjadi referensi utama sebelum deployment ke production.
