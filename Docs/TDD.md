# 📘 Test Driven Development (TDD) Documentation

## RF Spectrum Orchestration & Compliance Platform (RSOCP)

**Version:** 1.1
**Date:** 2026-05-07
**Approach:** Test Driven Development (TDD)
**Architecture:** Microservices + Event-Driven + Worker-Based

---

# 1. 🎯 Objective

Dokumen ini mendefinisikan strategi dan implementasi **Test Driven Development (TDD)** untuk memastikan:

- Reliability tinggi pada orchestration system
- Zero-downtime configuration change
- Compliance enforcement yang akurat
- RF analytics yang valid
- Auditability dan rollback yang konsisten

---

# 2. 🧪 TDD Philosophy

RSOCP menggunakan pendekatan:

### 🔁 Red → Green → Refactor

1. **Red**
   - Menulis test terlebih dahulu
   - Test gagal (expected failure)

2. **Green**
   - Implementasi minimal code agar test pass

3. **Refactor**
   - Optimasi code tanpa merusak behavior

---

# 3. 🏗️ Testing Layers

## 3.1 Unit Testing

- Fokus: business logic
- Tools: Jest
- Coverage target: **≥ 90%**

## 3.2 Integration Testing

- Fokus: antar module/service
- DB: PostgreSQL (test container)
- Queue: Redis mock / test instance

## 3.3 End-to-End Testing (E2E)

- Fokus: API behavior
- Tools: Supertest

## 3.4 Contract Testing

- Fokus: API contract stability
- Format: OpenAPI validation

## 3.5 Performance Testing

- Fokus: scalability (5000+ devices)

---

# 4. 📦 Test Structure

```
src/
 ├── modules/
 │   ├── auth/
 │   │   ├── auth.service.ts
 │   │   ├── auth.service.spec.ts
 │   ├── device/
 │   ├── monitoring/
 │   ├── orchestration/
 │   ├── compliance/
 │   └── rf-analysis/
 ├── test/
 │   ├── e2e/
 │   ├── integration/
 │   └── fixtures/
```

---

# 5. 🔐 Authentication Testing

## 5.1 Test Cases

### ✅ Login Success

```ts
it("should login successfully with valid credentials", async () => {
  const result = await authService.login({
    username: "admin",
    password: "StrongPassword123",
  });

  expect(result.access_token).toBeDefined();
});
```

### ❌ Login Failed

```ts
it("should reject invalid credentials", async () => {
  await expect(
    authService.login({ username: "admin", password: "wrong" }),
  ).rejects.toThrow("Unauthorized");
});
```

---

# 6. 📡 Device Module Testing

## 6.1 Register Device

### Test Scenario:

- Valid device registration
- Duplicate IP rejection
- Invalid payload rejection

```ts
it("should register new device", async () => {
  const device = await deviceService.create(validDeviceDto);
  expect(device.status).toBe("REGISTERED");
});
```

---

# 7. 📊 Monitoring Module Testing

## 7.1 Metrics Processing

### Test:

- Parsing SNMP data
- Store ke timeseries

```ts
it("should store metric snapshot", async () => {
  await monitoringService.saveMetrics(mockMetrics);

  const data = await repo.find();
  expect(data.length).toBeGreaterThan(0);
});
```

---

# 8. 🧠 RF Analytics Testing

## 8.1 RF Score Calculation

### Scenario:

- Valid calculation
- Edge case: noise tinggi

```ts
it("should calculate RF score correctly", () => {
  const score = rfService.calculateScore({
    snr: 30,
    noise: -90,
    retry: 2,
  });

  expect(score).toBeGreaterThan(0);
});
```

---

# 9. ⚙️ Orchestration Testing

## 9.1 Safe Configuration Flow

### Critical Flow:

- Apply config
- Wait reconnect
- Validate heartbeat
- Commit / rollback

```ts
it("should rollback if device not reconnect", async () => {
  const result = await orchestration.execute(config);

  expect(result.rollback_triggered).toBe(true);
});
```

---

## 9.2 Idempotency Test

```ts
it("should not duplicate execution", async () => {
  await orchestration.execute(config);
  await orchestration.execute(config);

  expect(jobQueue.count()).toBe(1);
});
```

---

# 10. 🛡️ Compliance Testing (Balmon Mode)

## 10.1 EIRP Validation

```ts
it("should reject illegal EIRP", () => {
  const result = compliance.validateEIRP({
    tx_power: 18,
    antenna_gain: 25,
    cable_loss: 1,
  });

  expect(result.status).toBe("ILLEGAL");
});
```

---

## 10.2 Balmon Activation

```ts
it("should enforce regulatory config", async () => {
  const result = await compliance.activateBalmon();

  expect(result.status).toBe("BALMON_MODE_ACTIVATED");
});
```

---

# 11. 🚨 Alerting Testing

## 11.1 Alert Trigger

```ts
it("should trigger alert on high noise", async () => {
  await monitoringService.process({
    noise_floor: -70,
  });

  const alerts = await alertRepo.find();
  expect(alerts.length).toBeGreaterThan(0);
});
```

---

# 12. 📜 Audit Log Testing

```ts
it("should create immutable audit log", async () => {
  await configService.update(deviceId, newConfig);

  const logs = await auditRepo.find();
  expect(logs[0].action).toBe("CONFIG_UPDATE");
});
```

---

# 13. 🔄 Integration Testing

## Scenario: Full Orchestration Flow

1. Login
2. Get recommendation
3. Validate frequency
4. Execute config
5. Validate result

```ts
it("should complete full orchestration flow", async () => {
  const token = await login();

  const rec = await getRecommendation(token);
  const valid = await validate(rec);

  expect(valid.valid).toBe(true);
});
```

---

# 14. 🌐 E2E Testing

```ts
describe("POST /devices", () => {
  it("should create device via API", async () => {
    return request(app.getHttpServer())
      .post("/devices")
      .send(validPayload)
      .expect(201);
  });
});
```

---

# 15. 📈 Performance Testing

## 15.1 Target SLA

| Metric                    | Target              |
| ------------------------- | ------------------- |
| Max concurrent devices    | 5.000               |
| SNMP polling success rate | ≥ 99%               |
| API response time (P95)   | < 500 ms            |
| Bulk config throughput    | ≥ 100 jobs/menit    |
| TimescaleDB ingest rate   | ≥ 10.000 rows/detik |

## 15.2 Bulk Configuration Load Test

**Tool:** k6

```js
// k6: bulk_config_load_test.js
import http from "k6/http";
import { check } from "k6";

export const options = {
  scenarios: {
    bulk_config: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "1m", target: 50 },
        { duration: "3m", target: 200 },
        { duration: "1m", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const res = http.post(
    "https://api.rsocp.internal/api/v1/orchestration/bulk",
    JSON.stringify({
      devices: Array.from({ length: 50 }, (_, i) => `device-uuid-${i}`),
      configuration: { channel_width: 20 },
      execution_strategy: "TOPOLOGY_AWARE",
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${__ENV.TOKEN}`,
      },
    },
  );

  check(res, { "status is 202": (r) => r.status === 202 });
}
```

## 15.3 Metrics Ingestion Stress Test

**Tool:** Artillery

```yaml
# artillery: metrics_ingest.yml
config:
  target: "https://api.rsocp.internal"
  phases:
    - duration: 120
      arrivalRate: 500
      name: Sustained high ingest

scenarios:
  - name: Simulate SNMP polling ingest
    flow:
      - post:
          url: "/api/v1/monitoring/ingest"
          json:
            radio_id: "{{ $randomString() }}"
            rssi: -65
            snr: 28
            noise_floor: -92
            throughput_tx: 120
            throughput_rx: 95
```

---

# 16. 🔁 CI/CD Testing Pipeline

## Flow:

```text
Commit → Run Unit Test → Integration Test → Build → Deploy
```

## GitHub Actions:

```yaml
- run: npm test
- run: npm run test:e2e
- run: npm run build
```

---

# 17. 📊 Coverage Target

| Module        | Target |
| ------------- | ------ |
| Auth          | 95%    |
| Device        | 90%    |
| Monitoring    | 90%    |
| Orchestration | 95%    |
| Compliance    | 100%   |
| RF Analytics  | 90%    |

---

# 18. ⚠️ Critical Test Scenarios

- Rollback failure
- Queue crash recovery
- Device unreachable
- Invalid frequency execution
- Compliance violation

---

# 19. 🧩 Mocking Strategy

- SNMP → mocked
- SSH → mocked
- Redis Queue → test instance
- External API → stubbed

---

# 20. 🏁 Conclusion

Dengan pendekatan TDD:

- Sistem menjadi **lebih stabil**
- Risiko outage **berkurang drastis**
- Compliance menjadi **terjamin**
- Codebase lebih **maintainable & scalable**

TDD adalah fondasi utama untuk memastikan bahwa sistem RF orchestration ini dapat berjalan pada skala besar dengan **high reliability dan zero-failure tolerance**.

---

# 21. 💥 Chaos Engineering Tests

Chaos testing wajib dilakukan di environment staging sebelum production release major.

## 21.1 Skenario Chaos: Redis Crash Mid-Execution

```bash
# Simulasi Redis crash saat bulk job sedang berjalan
docker stop rsocp-redis
# Expected: BullMQ job persist karena AOF; setelah Redis restart, job dilanjutkan
# Assertion: tidak ada duplicate execution, state konsisten
```

**Acceptance Criteria:**

- Tidak ada partial config yang terjebak di perangkat
- Semua job yang aktif saat crash di-retry setelah Redis kembali online
- `config_history` tidak memiliki entri `status=COMPLETED` untuk job yang belum selesai

## 21.2 Skenario Chaos: Worker Node Kill Mid-Job

```bash
# Kill worker container saat sedang mengeksekusi SSH ke 30 perangkat
docker kill rsocp-worker-1
# Expected: job kembali ke queue (karena job lock akan expired)
# Assertion: tidak ada perangkat yang tertinggal dalam kondisi partial config
```

## 21.3 Skenario Chaos: Network Partition (Device Unreachable)

```ts
it("should handle network partition gracefully", async () => {
  // Mock: device tidak bisa dijangkau setelah config dikirim
  snmpMock.simulateTimeout("192.168.10.5");

  const result = await orchestration.execute({
    device_id: "uuid-target",
    configuration: { frequency: 5795 },
    safe_commit: true,
    rollback_timeout: 30,
  });

  // Harus rollback, bukan stuck
  expect(result.rollback_triggered).toBe(true);
  expect(result.status).toBe("ROLLED_BACK");
});
```

## 21.4 Skenario Chaos: PostgreSQL Read Replica Lag

```ts
it("should not serve stale data from lagged replica", async () => {
  // Simulasi replica lag 10 detik
  await dbMock.simulateReplicaLag(10_000);

  // Audit log harus selalu dibaca dari primary
  const auditLog = await auditService.getLatest(deviceId);
  expect(auditLog.timestamp).toBeCloseTo(Date.now(), -3);
});
```

## 21.5 Jadwal Chaos Testing

| Frekuensi            | Skenario                                    |
| -------------------- | ------------------------------------------- |
| Setiap release major | Redis crash, Worker kill, Network partition |
| Monthly              | DB replica lag, Balmon Mode full activation |
| Quarterly            | Full stack failure drill (game day)         |

---
