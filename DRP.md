# Disaster Recovery Plan (DRP) & Queue Management

## RF Spectrum Orchestration & Compliance Platform (RSOCP / RSTO)

**Version:** 1.1
**Environment Target:** Production (Distributed System)
**Architecture Pattern:** Distributed Worker + Queue-Based Orchestration (BullMQ)
**Data Layer:** PostgreSQL + TimescaleDB
**Execution Layer:** Worker Node (Go / NestJS)

---

## 1. Tujuan Dokumen

Dokumen ini mendefinisikan prosedur Disaster Recovery (DRP) untuk:

- Menjamin **konsistensi konfigurasi RF** saat terjadi kegagalan sistem
- Menangani kegagalan pada **Worker Node saat bulk configuration**
- Memastikan **queue (Redis + BullMQ) tetap reliable dan recoverable**
- Mengendalikan **lonjakan beban metrics (TimescaleDB)**
- Menyediakan **fallback manual saat API orchestration tidak tersedia**
- Menetapkan **strategi backup & restore PostgreSQL (PITR-ready)**

Dokumen ini bersifat **mandatory reference** untuk tim **DevOps, SRE, dan Network Operations**.

---

## 2. Arsitektur Sistem Terkait

### 2.1 Logical Components

- **Backend API (NestJS)** → orchestration & control plane
- **Worker Cluster (BullMQ Workers)** → eksekusi konfigurasi RF
- **Redis Cluster** → queue broker & job state
- **PostgreSQL** → konfigurasi, audit, state tracking
- **TimescaleDB** → metrics ingestion (SNMP, telemetry)

---

### 2.2 Critical Data Flow

1. API menerima request bulk configuration
2. Job dimasukkan ke Redis (BullMQ queue)
3. Worker mengambil job → eksekusi ke device
4. Hasil dicatat ke PostgreSQL
5. Metrics masuk ke TimescaleDB

---

## 3. Failure Scenario & Dampak

### 3.1 Worker Node Failure (Mid Execution)

**Kondisi:**

- Worker crash saat menjalankan job
- Timeout saat SSH/API ke device
- Container restart saat proses berjalan

**Dampak:**

- Partial configuration (state tidak konsisten)
- Job stuck di status `active`
- Retry storm jika tidak dikontrol

---

### 3.2 Queue Failure (Redis / BullMQ)

**Kondisi:**

- Redis restart / crash
- Memory penuh
- Job lost / corrupted state

**Dampak:**

- Job tidak diproses
- Duplicate execution
- Backlog menumpuk

---

### 3.3 TimescaleDB Overload

**Kondisi:**

- Metrics spike (polling tinggi)
- Disk I/O saturation
- Query lambat

**Dampak:**

- Monitoring delay
- Storage penuh
- System degradation

---

### 3.4 API Orchestration Down

**Kondisi:**

- Backend tidak tersedia
- Endpoint error

**Dampak:**

- Tidak bisa trigger rollback
- Tidak bisa kontrol queue

---

## 4. Worker Node Recovery

### 4.1 Restart & Auto-Recovery

```
docker restart rsto-worker
```

atau

```
pm2 restart worker
```

Jika menggunakan orchestrator:

```
kubectl rollout restart deployment worker
```

---

### 4.2 Job State Reconciliation

Identifikasi job:

```
node scripts/queue-inspect.js
```

Klasifikasi:

- active → kemungkinan stuck
- failed → perlu retry
- waiting → backlog

---

### 4.3 Stuck Job Recovery

```
node scripts/move-stuck-jobs.js
```

Atau manual via BullMQ:

```
queue.getActive()
```

---

### 4.4 Retry Strategy

- Max retry: 3–5 kali
- Backoff: exponential
- Delay: 5s → 30s → 2m

  node scripts/retry-job.js <job_id>

---

### 4.5 Idempotency Enforcement

Setiap job wajib memiliki:

- `job_id` unik
- `execution_hash`
- state tracking di DB

Validasi sebelum eksekusi ulang:

```
SELECT status FROM config_history WHERE job_id = '<job_id>';
```

---

### 4.6 Device State Validation

Langkah:

1. Ambil konfigurasi terakhir:

   SELECT \* FROM config_history ORDER BY executed_at DESC;

2. Bandingkan dengan kondisi real device

3. Jika mismatch:
   - Reapply config
   - Atau rollback

---

## 5. Queue Recovery (Redis + BullMQ)

### 5.1 Redis Restart

```
docker restart redis
```

---

### 5.2 Queue Integrity Check

```
redis-cli
keys bull:*
```

Periksa:

- wait
- active
- delayed
- failed

---

### 5.3 Requeue Job

```
node scripts/requeue-batch.js
```

---

### 5.4 Dead Letter Queue (DLQ)

Job gagal > retry limit:

```
node scripts/move-to-dlq.js
```

---

### 5.5 Backlog Mitigation

Pause queue:

```
node scripts/pause-queue.js
```

Resume:

```
node scripts/resume-queue.js
```

Scale worker:

```
docker scale rsto-worker=5
```

---

### 5.6 Redis Hardening

- maxmemory-policy: allkeys-lru
- persistence: AOF enabled
- snapshot interval: 5–15 menit

---

## 6. TimescaleDB Recovery & Load Control

### 6.1 Resource Monitoring

```
df -h
top
```

---

### 6.2 Stop Metrics Ingestion

```
systemctl stop metrics-collector
```

---

### 6.3 Retention Policy

```
SELECT drop_chunks(interval '7 days', 'metrics_table');
```

---

### 6.4 Compression

```
ALTER TABLE metrics_table SET (timescaledb.compress);
SELECT add_compression_policy('metrics_table', INTERVAL '1 day');
```

---

### 6.5 Rate Limiting

- Kurangi SNMP polling interval
- Disable non-critical metrics

---

## 7. Manual Fallback (CLI / SSH)

### 7.1 Akses Node

```
ssh admin@orchestrator-node
```

---

### 7.2 Manual Execution

```
./scripts/push-config.sh --device-id=123 --freq=5800
```

---

### 7.3 Manual Rollback

```
./scripts/rollback-config.sh --device-id=123
```

---

### 7.4 Log Monitoring

```
tail -f logs/worker.log
```

---

## 8. PostgreSQL Backup & Restore

### 8.1 Backup Strategy

Full backup:

```
pg_dump -U postgres -F c db_rsto > backup.dump
```

---

### 8.2 WAL Archiving

```
archive_mode = on
archive_command = 'cp %p /archive/%f'
```

---

### 8.3 Restore

```
pg_restore -U postgres -d db_rsto backup.dump
```

---

### 8.4 Point-in-Time Recovery

```
recovery_target_time = 'YYYY-MM-DD HH:MM:SS'
```

---

### 8.5 Backup Policy

- Full backup: harian
- WAL: real-time
- Retention: 7–30 hari
- Storage: offsite (object storage)

---

## 9. Consistency & Safety Rules

- Semua job harus **idempotent**
- Semua perubahan dicatat di `config_history`
- Gunakan retry dengan backoff
- Validasi sebelum re-execution
- Hindari duplicate push ke device

---

## 10. Incident Response Checklist

| Kondisi          | Aksi                     |
| ---------------- | ------------------------ |
| Worker crash     | Restart + reconcile job  |
| Job stuck        | Move & retry             |
| Redis crash      | Restart + requeue        |
| Backlog tinggi   | Pause + scale worker     |
| Metrics overload | Stop ingestion + cleanup |
| API down         | Gunakan CLI fallback     |
| DB corrupt       | Restore backup           |

---

## 11. Penutup

DRP ini memastikan:

- Sistem tetap recoverable dalam kondisi failure kritikal
- Konsistensi konfigurasi RF tetap terjaga
- Operasional tetap berjalan meskipun API tidak tersedia

Dokumen ini wajib diuji secara berkala melalui **failure simulation & chaos testing**.
