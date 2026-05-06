# API Documentation

## RF Spectrum Orchestration & Compliance Platform (RSOCP)

Version: 2.0
Base URL: `/api/v1`
WebSocket URL: `wss://api.rsocp.yourdomain.com/events`
Protocol: HTTPS + WebSocket (WSS)
Authentication: JWT Bearer Token (`Authorization: Bearer <token>`)
Content-Type: `application/json`

---

# 1. Overview

RSOCP API menyediakan endpoint untuk:

- Authentication & Authorization (dengan MFA TOTP)
- Inventory Management
- Real-Time Monitoring (REST polling + WebSocket push)
- RF Analytics
- Frequency Recommendation
- Safe Configuration Orchestration
- Regulatory Compliance Automation (Balmon Mode)
- Alerting
- Audit Logging
- Topology Visualization

API mengikuti prinsip:

- RESTful Design
- Stateless Authentication
- RBAC Enforcement
- Idempotent Execution
- Safe Rollback Architecture
- Topology-Aware Operations

---

# 2. Authentication

## 2.1 Login

### Endpoint

```http
POST /auth/login
```

### Request Body

```json
{
  "username": "admin",
  "password": "StrongPassword123"
}
```

### Response

```json
{
  "access_token": "jwt-token",
  "refresh_token": "refresh-token",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "username": "admin",
    "role": "SUPER_ADMIN"
  }
}
```

---

## 2.2 Refresh Token

### Endpoint

```http
POST /auth/refresh
```

### Request Body

```json
{
  "refresh_token": "refresh-token"
}
```

### Response

```json
{
  "access_token": "new-jwt-token",
  "expires_in": 3600
}
```

---

## 2.3 Logout

### Endpoint

```http
POST /auth/logout
```

### Headers

```http
Authorization: Bearer <token>
```

### Response

```json
{
  "message": "Logout successful"
}
```

---

# 3. User Management API

## 3.1 Get Users

### Endpoint

```http
GET /users
```

### Required Role

- SUPER_ADMIN

### Response

```json
[
  {
    "id": "uuid",
    "username": "engineer01",
    "role": "NETWORK_ENGINEER",
    "created_at": "2026-05-06T12:00:00Z"
  }
]
```

---

## 3.2 Create User

### Endpoint

```http
POST /users
```

### Request Body

```json
{
  "username": "noc01",
  "password": "StrongPassword123",
  "role": "NOC_OPERATOR"
}
```

### Response

```json
{
  "id": "uuid",
  "username": "noc01",
  "role": "NOC_OPERATOR"
}
```

---

# 4. Inventory Management API

## 4.1 Register Radio Device

### Endpoint

```http
POST /devices
```

### Required Role

- SUPER_ADMIN
- NETWORK_ENGINEER

### Request Body

```json
{
  "vendor": "CAMBIUM",
  "model": "ePMP 3000",
  "ip_address": "10.10.10.1",
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "firmware_version": "4.8.0",
  "country_code": "ID",
  "antenna_gain": 25,
  "frequency": 5785,
  "channel_width": 20,
  "tx_power": 11,
  "gps_sync": true,
  "credentials_id": "uuid"
}
```

### Response

```json
{
  "id": "uuid",
  "status": "REGISTERED"
}
```

---

## 4.2 Get All Devices

### Endpoint

```http
GET /devices
```

### Query Parameters

| Parameter | Type   | Description      |
| --------- | ------ | ---------------- |
| vendor    | string | Filter vendor    |
| status    | string | Device status    |
| page      | number | Pagination page  |
| limit     | number | Pagination limit |

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "vendor": "CAMBIUM",
      "model": "ePMP 3000",
      "ip_address": "10.10.10.1",
      "frequency": 5785,
      "status": "ONLINE"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 140
  }
}
```

---

## 4.3 Get Device Detail

### Endpoint

```http
GET /devices/{deviceId}
```

### Response

```json
{
  "id": "uuid",
  "vendor": "CAMBIUM",
  "model": "ePMP 3000",
  "ip_address": "10.10.10.1",
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "firmware_version": "4.8.0",
  "country_code": "ID",
  "antenna_gain": 25,
  "frequency": 5785,
  "channel_width": 20,
  "tx_power": 11,
  "gps_sync": true,
  "topology": {
    "parent_id": "uuid",
    "children": []
  }
}
```

---

## 4.4 Update Device

### Endpoint

```http
PUT /devices/{deviceId}
```

### Request Body

```json
{
  "channel_width": 40,
  "tx_power": 18
}
```

### Response

```json
{
  "message": "Device updated successfully"
}
```

---

## 4.5 Delete Device

### Endpoint

```http
DELETE /devices/{deviceId}
```

### Response

```json
{
  "message": "Device deleted successfully"
}
```

---

# 5. Device Credential API

## 5.1 Create Device Credential

### Endpoint

```http
POST /credentials
```

### Request Body

```json
{
  "username": "admin",
  "password": "encrypted-password",
  "snmp_version": "v3",
  "snmp_community": "secure-community"
}
```

### Response

```json
{
  "id": "uuid",
  "status": "CREATED"
}
```

---

# 6. Real-Time Monitoring API

## 6.1 Get Real-Time Metrics

### Endpoint

```http
GET /monitoring/{deviceId}/metrics
```

### Response

```json
{
  "device_id": "uuid",
  "rssi": -58,
  "snr": 32,
  "cinr": 28,
  "noise_floor": -92,
  "mcs_rate": "MCS15",
  "tx_throughput": 120.5,
  "rx_throughput": 118.2,
  "retry_rate": 2.3,
  "air_utilization": 45,
  "temperature": 54,
  "cpu_usage": 33,
  "ram_usage": 58,
  "timestamp": "2026-05-06T12:00:00Z"
}
```

---

## 6.2 Get Historical Metrics

### Endpoint

```http
GET /monitoring/{deviceId}/history
```

### Query Parameters

| Parameter | Type     | Description     |
| --------- | -------- | --------------- |
| from      | datetime | Start time      |
| to        | datetime | End time        |
| interval  | string   | 1m, 5m, 15m, 1h |

### Response

```json
{
  "device_id": "uuid",
  "metrics": [
    {
      "timestamp": "2026-05-06T12:00:00Z",
      "snr": 32,
      "throughput": 120.5
    }
  ]
}
```

---

## 6.3 Spectrum Scan

### Endpoint

```http
POST /monitoring/{deviceId}/spectrum-scan
```

### Response

```json
{
  "job_id": "uuid",
  "status": "QUEUED"
}
```

---

# 7. RF Analytics API

## 7.1 Get RF Analysis

### Endpoint

```http
GET /rf-analysis/{deviceId}
```

### Response

```json
{
  "device_id": "uuid",
  "rf_score": 87,
  "snr_score": 20,
  "noise_penalty": 4,
  "retry_penalty": 2,
  "historical_stability": 18,
  "adjacent_interference": 1,
  "recommendation": "OPTIMAL"
}
```

---

## 7.2 Get Interference Analysis

### Endpoint

```http
GET /rf-analysis/{deviceId}/interference
```

### Response

```json
{
  "device_id": "uuid",
  "detected_interference": true,
  "adjacent_channels": [5765, 5785],
  "severity": "MEDIUM"
}
```

---

# 8. Frequency Recommendation API

## 8.1 Get Frequency Recommendations

### Endpoint

```http
GET /frequency/recommendation/{deviceId}
```

### Response

```json
{
  "device_id": "uuid",
  "current_frequency": 5785,
  "recommended_frequency": 5805,
  "recommended_channel_width": 20,
  "rf_score": 93,
  "reason": [
    "Lower noise floor",
    "Lower adjacent interference",
    "Stable historical performance"
  ]
}
```

---

## 8.2 Validate Frequency

### Endpoint

```http
POST /frequency/validate
```

### Request Body

```json
{
  "frequency": 5795,
  "channel_width": 20
}
```

### Response

```json
{
  "valid": true,
  "compliance": "PASS"
}
```

---

# 9. Configuration Orchestration API

## 9.1 Execute Configuration Change

### Endpoint

```http
POST /orchestration/configuration
```

### Request Body

```json
{
  "device_id": "uuid",
  "configuration": {
    "frequency": 5805,
    "channel_width": 20,
    "tx_power": 11
  },
  "safe_commit": true,
  "rollback_timeout": 30
}
```

### Response

```json
{
  "job_id": "uuid",
  "status": "QUEUED"
}
```

---

## 9.2 Bulk Configuration Execution

### Endpoint

```http
POST /orchestration/bulk
```

### Request Body

```json
{
  "devices": ["uuid-1", "uuid-2"],
  "configuration": {
    "channel_width": 20
  },
  "execution_strategy": "TOPOLOGY_AWARE"
}
```

### Response

```json
{
  "job_id": "uuid",
  "devices_queued": 2,
  "status": "QUEUED"
}
```

---

## 9.3 Get Job Status

### Endpoint

```http
GET /orchestration/jobs/{jobId}
```

### Response

```json
{
  "job_id": "uuid",
  "status": "RUNNING",
  "progress": 65,
  "success_count": 18,
  "failed_count": 1,
  "rollback_triggered": false
}
```

---

## 9.4 Rollback Configuration

### Endpoint

```http
POST /orchestration/rollback/{jobId}
```

### Response

```json
{
  "rollback_job_id": "uuid",
  "status": "ROLLBACK_STARTED"
}
```

---

# 10. Compliance & Balmon Mode API

## 10.1 Activate Balmon Mode

### Endpoint

```http
POST /compliance/balmon/activate
```

### Required Role

- SUPER_ADMIN

### Request Body

```json
{
  "scope": "ALL",
  "frequency_range": {
    "start": 5725,
    "end": 5825
  },
  "channel_width": 20,
  "max_eirp": 36
}
```

### Response

```json
{
  "job_id": "uuid",
  "status": "BALMON_MODE_ACTIVATED"
}
```

---

## 10.2 Deactivate Balmon Mode

### Endpoint

```http
POST /compliance/balmon/deactivate
```

### Response

```json
{
  "job_id": "uuid",
  "status": "ROLLBACK_STARTED"
}
```

---

## 10.3 Validate EIRP

### Endpoint

```http
POST /compliance/eirp/validate
```

### Request Body

```json
{
  "tx_power": 18,
  "antenna_gain": 25,
  "cable_loss": 1
}
```

### Response

```json
{
  "eirp": 42,
  "allowed_limit": 36,
  "status": "ILLEGAL",
  "recommended_tx_power": 11
}
```

---

# 11. Frequency Exclusion API

## 11.1 Get Exclusion List

### Endpoint

```http
GET /frequency-exclusions
```

### Response

```json
[
  {
    "id": "uuid",
    "start_freq": 5600,
    "end_freq": 5650,
    "category": "DFS_RADAR",
    "description": "Weather radar"
  }
]
```

---

## 11.2 Create Exclusion Rule

### Endpoint

```http
POST /frequency-exclusions
```

### Request Body

```json
{
  "start_freq": 5600,
  "end_freq": 5650,
  "category": "AIRPORT_RADAR",
  "description": "Airport radar protection"
}
```

### Response

```json
{
  "id": "uuid",
  "status": "CREATED"
}
```

---

# 12. Topology API

## 12.1 Get Network Topology

### Endpoint

```http
GET /topology
```

### Response

```json
{
  "nodes": [
    {
      "id": "uuid",
      "name": "POP A",
      "type": "POP",
      "vendor": "CAMBIUM",
      "status": "ONLINE",
      "frequency": 5785
    }
  ],
  "edges": [
    {
      "source": "uuid-pop-a",
      "target": "uuid-relay-b",
      "link_quality": 92.5,
      "distance_km": 12.4
    }
  ]
}
```

---

## 12.2 Get Device Dependency

### Endpoint

```http
GET /topology/{deviceId}/dependencies
```

### Response

```json
{
  "device_id": "uuid",
  "parent": {
    "id": "uuid-parent",
    "name": "POP A"
  },
  "children": [
    { "id": "uuid-child-1", "name": "Client C" },
    { "id": "uuid-child-2", "name": "Client D" }
  ],
  "affected_devices_if_changed": 2
}
```

> **Catatan desain:** Field `affected_devices_if_changed` sangat penting untuk UI — engineer harus tahu berapa banyak downstream device yang akan terdampak sebelum mengeksekusi perubahan konfigurasi.

---

# 13. Alerting API

## 13.1 Get Alerts

### Endpoint

```http
GET /alerts
```

### Query Parameters

| Parameter | Type   | Description                  |
| --------- | ------ | ---------------------------- |
| severity  | string | LOW, MEDIUM, HIGH, CRITICAL  |
| status    | string | OPEN, ACKNOWLEDGED, RESOLVED |
| device_id | uuid   | Filter by device             |
| page      | number | Pagination page              |
| limit     | number | Items per page               |

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "radio_id": "uuid",
      "alert_type": "HIGH_NOISE",
      "severity": "HIGH",
      "message": "Noise floor -70 dBm exceeds threshold -80 dBm",
      "triggered_at": "2026-05-07T08:00:00Z",
      "resolved_at": null
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5 }
}
```

---

## 13.2 Acknowledge Alert

### Endpoint

```http
POST /alerts/{alertId}/acknowledge
```

### Required Role

- NETWORK_ENGINEER
- SUPER_ADMIN

### Response

```json
{
  "id": "uuid",
  "status": "ACKNOWLEDGED"
}
```

---

# 14. Audit Logging API

## 14.1 Get Audit Logs

### Endpoint

```http
GET /audit-logs
```

### Required Role

- SUPER_ADMIN
- NETWORK_ENGINEER (hanya log milik sendiri atau device yang dikelola)

### Query Parameters

| Parameter | Type     | Description              |
| --------- | -------- | ------------------------ |
| user_id   | uuid     | Filter by user           |
| device_id | uuid     | Filter by device         |
| action    | string   | Filter by action type    |
| from      | datetime | Start time (ISO 8601)    |
| to        | datetime | End time (ISO 8601)      |
| page      | number   | Pagination page          |
| limit     | number   | Items per page (max 100) |

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "action": "CONFIG_UPDATE",
      "radio_id": "uuid",
      "old_config": { "frequency": 5785, "channel_width": 40 },
      "new_config": { "frequency": 5805, "channel_width": 20 },
      "status": "SUCCESS",
      "timestamp": "2026-05-07T10:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 312 }
}
```

---

# 15. Authentication — MFA API

## 15.1 MFA Verify (Step 2 Login)

### Endpoint

```http
POST /auth/mfa/verify
```

### Request Body

```json
{
  "mfa_session_token": "short-lived-jwt",
  "totp_code": "123456"
}
```

### Response (Success)

```json
{
  "access_token": "jwt-token",
  "refresh_token": "refresh-token",
  "expires_in": 900
}
```

### Response (Failed)

```json
{
  "status_code": 401,
  "error": "Unauthorized",
  "message": "Invalid TOTP code",
  "timestamp": "2026-05-07T10:30:00Z"
}
```

---

## 15.2 MFA Setup (Enrollment)

### Endpoint

```http
POST /auth/mfa/setup
```

### Required Role

- SUPER_ADMIN (mandatory), ENGINEER (optional)

### Response

```json
{
  "otpauth_uri": "otpauth://totp/RSOCP:admin?secret=BASE32SECRET&issuer=RSOCP",
  "qr_code_base64": "data:image/png;base64,...",
  "backup_codes": ["ABC12-DE345", "FGH67-IJ890"]
}
```

> **Keamanan:** `backup_codes` hanya ditampilkan **satu kali** saat enrollment. Setelah endpoint ini dipanggil, server hanya menyimpan hash dari backup codes.

---

# 16. WebSocket Events API

## 16.1 Koneksi

```text
WSS: wss://api.rsocp.yourdomain.com/ws
Header: Authorization: Bearer <access_token>
```

## 16.2 Subscribe to Device Metrics

### Client → Server

```json
{
  "event": "subscribe",
  "data": {
    "channel": "device.metrics",
    "device_id": "uuid"
  }
}
```

### Server → Client (setiap polling interval)

```json
{
  "event": "metrics.updated",
  "data": {
    "device_id": "uuid",
    "rssi": -61,
    "snr": 29,
    "noise_floor": -91,
    "throughput_tx": 118.5,
    "throughput_rx": 115.2,
    "timestamp": "2026-05-07T10:30:15Z"
  }
}
```

## 16.3 Job Progress Events

### Server → Client (saat orchestration berjalan)

```json
{
  "event": "orchestration.progress",
  "data": {
    "job_id": "uuid",
    "status": "RUNNING",
    "progress": 65,
    "success_count": 18,
    "failed_count": 1,
    "current_device": "10.10.10.5"
  }
}
```

## 16.4 Alert Push

### Server → Client (real-time alert)

```json
{
  "event": "alert.created",
  "data": {
    "alert_id": "uuid",
    "radio_id": "uuid",
    "alert_type": "LINK_DOWN",
    "severity": "CRITICAL",
    "message": "Device 10.10.10.5 unreachable",
    "triggered_at": "2026-05-07T10:30:30Z"
  }
}
```

> **Alasan menggunakan WebSocket (bukan polling murni):** Untuk event kritis seperti LINK_DOWN, mengandalkan polling REST setiap 30 detik berarti latency notifikasi hingga 30 detik. WebSocket push meminimalkan latency notifikasi ke < 2 detik. REST polling tetap dipertahankan untuk komponen yang tidak memerlukan real-time (historical metrics, audit logs).

---

# 17. Error Response Standard

Semua error response mengikuti format RFC 7807 (Problem Details):

## Standard Error Envelope

```json
{
  "status_code": 400,
  "error": "Bad Request",
  "message": "Frequency 5600 MHz is inside restricted BMKG_RADAR spectrum (5570-5650 MHz)",
  "error_code": "FREQ_BLACKLISTED",
  "path": "/api/v1/frequency/validate",
  "timestamp": "2026-05-07T10:30:00Z",
  "request_id": "req-uuid"
}
```

## HTTP Status Code Reference

| Status | Error                 | Kondisi                                       |
| ------ | --------------------- | --------------------------------------------- |
| `400`  | Bad Request           | Input tidak valid, constraint violation       |
| `401`  | Unauthorized          | Token tidak ada, expired, atau invalid        |
| `403`  | Forbidden             | Role tidak memiliki izin untuk aksi ini       |
| `404`  | Not Found             | Device/resource tidak ditemukan               |
| `409`  | Conflict              | Duplicate IP address, duplicate job execution |
| `422`  | Unprocessable Entity  | Validasi bisnis gagal (misal: EIRP illegal)   |
| `429`  | Too Many Requests     | Rate limit terlampaui                         |
| `500`  | Internal Server Error | Unhandled exception di server                 |
| `503`  | Service Unavailable   | Worker tidak tersedia, queue overload         |

## Application Error Codes

| `error_code`         | Deskripsi                                           |
| -------------------- | --------------------------------------------------- |
| `FREQ_BLACKLISTED`   | Frekuensi masuk dalam daftar exclusion              |
| `EIRP_EXCEEDED`      | Kalkulasi EIRP melebihi 36 dBm                      |
| `DEVICE_UNREACHABLE` | SNMP/SSH timeout ke device                          |
| `ROLLBACK_TRIGGERED` | Safe commit gagal, rollback dijalankan              |
| `BALMON_ACTIVE`      | Operasi tidak bisa dilakukan saat Balmon Mode aktif |
| `JOB_DUPLICATE`      | Job dengan execution_hash yang sama sudah ada       |
| `TOPOLOGY_CONFLICT`  | Perubahan akan menyebabkan downstream outage        |
| `MFA_REQUIRED`       | Login berhasil tetapi TOTP verifikasi diperlukan    |
| `MFA_INVALID`        | TOTP code tidak valid atau expired                  |

---

# 18. Rate Limiting Headers

Setiap response API menyertakan headers rate limiting:

```http
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 197
X-RateLimit-Reset: 1746614460
Retry-After: 60          (hanya pada response 429)
```

Saat rate limit terlampaui (`429 Too Many Requests`):

```json
{
  "status_code": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "timestamp": "2026-05-07T10:30:00Z"
}
```

    }

],
"edges": [
{
"source": "uuid-1",
"target": "uuid-2"
}
]
}

````

---

## 12.2 Get Device Dependency

### Endpoint

```http
GET /topology/{deviceId}/dependencies
````

### Response

```json
{
  "parent": {
    "id": "uuid"
  },
  "children": [
    {
      "id": "uuid"
    }
  ]
}
```

---

# 13. Alerting API

## 13.1 Get Alerts

### Endpoint

```http
GET /alerts
```

### Query Parameters

| Parameter | Type   | Description                  |
| --------- | ------ | ---------------------------- |
| severity  | string | LOW, MEDIUM, HIGH, CRITICAL  |
| status    | string | OPEN, ACKNOWLEDGED, RESOLVED |

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "HIGH_NOISE",
      "severity": "HIGH",
      "message": "Noise threshold exceeded",
      "created_at": "2026-05-06T12:00:00Z"
    }
  ]
}
```

---

## 13.2 Acknowledge Alert

### Endpoint

```http
POST /alerts/{alertId}/acknowledge
```

### Response

```json
{
  "status": "ACKNOWLEDGED"
}
```

---

# 14. Audit Logging API

## 14.1 Get Audit Logs

### Endpoint

```http
GET /audit-logs
```

### Query Parameters

| Parameter | Type     | Description      |
| --------- | -------- | ---------------- |
| user_id   | uuid     | Filter by user   |
| device_id | uuid     | Filter by device |
| action    | string   | Action filter    |
| from      | datetime | Start date       |
| to        | datetime | End date         |

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "action": "CONFIG_UPDATE",
      "device_id": "uuid",
      "status": "SUCCESS",
      "timestamp": "2026-05-06T12:00:00Z"
    }
  ]
}
```

---

# 15. WebSocket Events

## WebSocket Base URL

```text
wss://domain/ws
```

## Events

| Event                  | Description                   |
| ---------------------- | ----------------------------- |
| metrics.updated        | Real-time metric update       |
| alert.created          | Alert generated               |
| orchestration.progress | Configuration progress        |
| device.status.changed  | Device online/offline         |
| compliance.violation   | Compliance violation detected |

---

# 16. Error Handling

## Standard Error Response

```json
{
  "status_code": 400,
  "error": "Bad Request",
  "message": "Frequency is inside restricted spectrum",
  "timestamp": "2026-05-06T12:00:00Z"
}
```

---

# 17. HTTP Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Resource Created      |
| 202  | Job Accepted          |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Resource Not Found    |
| 409  | Conflict              |
| 422  | Validation Error      |
| 500  | Internal Server Error |

---

# 18. RBAC Matrix

| Endpoint Group          | Super Admin | Network Engineer | NOC Operator |
| ----------------------- | ----------- | ---------------- | ------------ |
| Authentication          | Yes         | Yes              | Yes          |
| Device Monitoring       | Yes         | Yes              | Yes          |
| RF Analytics            | Yes         | Yes              | Read Only    |
| Configuration Execution | Yes         | Yes              | No           |
| Compliance Mode         | Yes         | No               | No           |
| User Management         | Yes         | No               | No           |
| Audit Logs              | Yes         | Yes              | Read Only    |

---

# 19. Rate Limiting

| Endpoint Category | Limit       |
| ----------------- | ----------- |
| Authentication    | 10 req/min  |
| Monitoring API    | 300 req/min |
| Configuration API | 30 req/min  |
| Analytics API     | 100 req/min |

---

# 20. Security Standards

## Security Features

- JWT Authentication
- AES-256-GCM Credential Encryption
- RBAC Enforcement
- MFA Support
- Session Expiration
- Immutable Audit Logs
- Input Validation
- Idempotent Job Execution
- Safe Rollback Mechanism

---

# 21. API Versioning

Versioning menggunakan URI versioning:

```text
/api/v1
```

Contoh:

```http
GET /api/v1/devices
```

---

# 22. Recommended Headers

```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
Accept: application/json
X-Request-ID: unique-request-id
```

---

# 23. Example Orchestration Flow

## Safe Frequency Change Flow

```text
1. Request frequency recommendation
2. Validate compliance
3. Create orchestration job
4. Push task to BullMQ
5. Execute configuration via SSH/API
6. Wait reconnect
7. Validate heartbeat
8. Commit configuration
9. Rollback automatically if failed
```

---

# 24. Future API Expansion

Planned future endpoints:

- AI RF Prediction API
- GIS Integration API
- Mobile Push Notification API
- SLA Analytics API
- Multi-Region Cluster API
- OSPF/BGP Visibility API

---

# 25. Conclusion

Dokumentasi API ini dirancang untuk mendukung:

- Monitoring radio multi-vendor
- RF analytics & optimization
- Safe orchestration
- Regulatory compliance automation
- Scalable distributed operations
- Secure infrastructure management

API architecture mengikuti prinsip:

- Safety First
- Compliance by Design
- High Scalability
- Rollback-First Automation
- Topology Awareness
