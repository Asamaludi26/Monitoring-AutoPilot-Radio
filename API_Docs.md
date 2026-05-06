# API Documentation

## RF Spectrum Orchestration & Compliance Platform (RSOCP)

Version: 1.0
Base URL: `/api/v1`
Protocol: HTTPS
Authentication: JWT Bearer Token
Content-Type: `application/json`

---

# 1. Overview

RSOCP API menyediakan endpoint untuk:

* Authentication & Authorization
* Inventory Management
* Real-Time Monitoring
* RF Analytics
* Frequency Recommendation
* Safe Configuration Orchestration
* Regulatory Compliance Automation
* Alerting
* Audit Logging
* Topology Visualization

API mengikuti prinsip:

* RESTful Design
* Stateless Authentication
* RBAC Enforcement
* Idempotent Execution
* Safe Rollback Architecture
* Topology-Aware Operations

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

* SUPER_ADMIN

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

* SUPER_ADMIN
* NETWORK_ENGINEER

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
  "adjacent_channels": [
    5765,
    5785
  ],
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
  "devices": [
    "uuid-1",
    "uuid-2"
  ],
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

* SUPER_ADMIN

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
      "type": "POP"
    }
  ],
  "edges": [
    {
      "source": "uuid-1",
      "target": "uuid-2"
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

* JWT Authentication
* AES-256-GCM Credential Encryption
* RBAC Enforcement
* MFA Support
* Session Expiration
* Immutable Audit Logs
* Input Validation
* Idempotent Job Execution
* Safe Rollback Mechanism

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

* AI RF Prediction API
* GIS Integration API
* Mobile Push Notification API
* SLA Analytics API
* Multi-Region Cluster API
* OSPF/BGP Visibility API

---

# 25. Conclusion

Dokumentasi API ini dirancang untuk mendukung:

* Monitoring radio multi-vendor
* RF analytics & optimization
* Safe orchestration
* Regulatory compliance automation
* Scalable distributed operations
* Secure infrastructure management

API architecture mengikuti prinsip:

* Safety First
* Compliance by Design
* High Scalability
* Rollback-First Automation
* Topology Awareness
