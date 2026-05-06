# Security & Cryptography Standards

**RF Spectrum Orchestration & Compliance Platform (RSOCP)**
Priority: 3
Version: 1.1
Revisi: 2026-05-07 — Penambahan MFA (TOTP), CORS policy, JWT key rotation, session policy

---

## 1. Security Principles

- Zero Trust Architecture
- Least Privilege Access
- Defense in Depth
- Encryption by Default
- Immutable Auditability
- Compliance by Design

Fokus perlindungan:

- Device Credentials (SNMP / SSH / API)
- Control orchestration konfigurasi
- Enforcement regulasi (Balmon Mode)
- Worker execution terdistribusi

---

## 2. Cryptography Standards

### 2.1 Encryption Algorithm

- Algorithm: AES-256-GCM
- Mode: AEAD (Authenticated Encryption)
- Key Size: 256-bit
- IV: 96-bit random per encryption
- Auth Tag: 128-bit

---

### 2.2 Key Management Strategy

- Master Key (KMS / Vault)
- Data Encryption Key (DEK)
- Envelope Encryption digunakan

---

## 3. Device Credential Encryption Lifecycle

### 3.1 Creation

- Generate IV
- Encrypt dengan AES-256-GCM
- Simpan ciphertext + IV + tag + key_id

### 3.2 Storage

- Disimpan di database (device_credentials)
- Tidak ada plaintext

### 3.3 Access

- Validasi RBAC
- Ambil DEK
- Decrypt di memory
- Tidak boleh logging

### 3.4 Usage

- Digunakan untuk SNMP / SSH / API
- Ephemeral (hapus setelah pakai)

### 3.5 Destruction

- Soft delete + audit log
- Key revoke jika tidak digunakan

---

## 4. Key Rotation

### 4.1 Policy

- Rotation: 30–90 hari
- Emergency rotation saat breach

### 4.2 Mechanism

- Generate DEK baru
- Update key_id
- Re-encrypt (lazy / batch)
- Deprecate key lama

### 4.3 Compatibility

- Multi-key support
- Versioned key_id

---

## 5. OSI Layer Security

### Layer 1 – Physical

- Secure data center
- Restricted access

### Layer 2 – Data Link

- VLAN isolation (radio vs backend)

### Layer 3 – Network

- Private IP only
- Firewall whitelist

### Layer 4 – Transport

- TLS 1.2 / 1.3
- Secure ports

### Layer 5 – Session

- JWT + expiry (Access Token: 15 menit, Refresh Token: 7 hari)
- Refresh token rotation: setiap refresh, token lama direvoke
- Session binding: IP + User-Agent hash untuk deteksi session hijacking

### Layer 6 – Presentation

- Input validation
- Data sanitization
- Response tidak mengandung data sensitif (password_hash, encrypted_password, mfa_secret tidak pernah di-serialize ke JSON response)

### Layer 7 – Application

- RBAC
- MFA (TOTP — RFC 6238)
- Audit log immutable
- Idempotent execution
- CORS policy (lihat Bagian 8a)

---

## 6a. MFA Implementation (TOTP — RFC 6238)

> MFA adalah **mandatory** untuk role `SUPER_ADMIN` dan **opsional** (dianjurkan) untuk `ENGINEER`. `NOC` dikecualikan mengingat akses hanya read-only.

### 6a.1 Standar MFA

- **Protokol:** TOTP (Time-based One-Time Password) sesuai RFC 6238
- **Algoritma:** HMAC-SHA1 (kompatibel standar TOTP)
- **Kode:** 6 digit, periode 30 detik
- **Tolerance window:** ±1 periode (maksimal 90 detik drift NTP)
- **Library (Node.js):** `otpauth` atau `speakeasy`
- **QR Code provisioning:** `qrcode` library untuk display ke authenticator app (Google Authenticator, Authy, dll)

### 6a.2 MFA Enrollment Flow

```text
1. SUPER_ADMIN login dengan username + password
2. Server generate TOTP secret (32-byte random Base32)
3. Secret di-encrypt dengan AES-256-GCM sebelum disimpan ke kolom mfa_secret di tabel user_account
4. Server return QR Code URI (otpauth://) ke frontend
5. User scan QR Code di authenticator app
6. User input kode TOTP pertama untuk verifikasi
7. Server validasi kode; jika valid → set mfa_enabled = true
```

### 6a.3 MFA Login Flow

```text
1. POST /auth/login → username + password
2. Jika valid DAN mfa_enabled = true → return { mfa_required: true, mfa_session_token: "<short-lived JWT>" }
3. POST /auth/mfa/verify → { mfa_session_token, totp_code }
4. Server validasi TOTP; jika valid → return access_token + refresh_token
```

> **Alasan menggunakan TOTP vs SMS OTP:** TOTP berbasis waktu dan tidak memerlukan infrastruktur telekomunikasi (SMS gateway), lebih tahan terhadap SIM-swapping attack, dan bekerja offline. Untuk sistem critical infrastructure seperti RSOCP, TOTP adalah pilihan lebih aman.

### 6a.4 Backup Codes

- Generate 10 backup codes saat enrollment (setiap code: 10 karakter random alphanumeric)
- Disimpan sebagai bcrypt hash di database (bukan plaintext)
- Hanya tampilkan sekali saat enrollment
- Setiap backup code hanya bisa digunakan satu kali (invalidate setelah pakai)

---

## 6. Network Segmentation

- VLAN 10: Radio Management
- VLAN 20: Backend API
- VLAN 30: Monitoring
- VLAN 40: Public/API Gateway

Rules:

- Device hanya bisa diakses worker
- API tidak direct ke device
- Zero Trust enforced

---

## 7. Device Protocol Security

### SNMP

- Wajib SNMPv3
- Auth: SHA / SHA-256
- Encryption: AES
- Disable SNMPv2c

### SSH

- Key-based auth only
- Disable password login
- Timeout control

### Device API

- HTTPS only
- Token-based auth

### Legacy Device

- Isolated VLAN
- Restricted access
- Deprecation plan

---

## 8. API Security

- JWT authentication (Access Token: 15 menit, Refresh Token: 7 hari dengan rotation)
- Short-lived token
- Input validation (NestJS class-validator Pipes)
- Rate limiting (lihat di bawah)
- Idempotent API

### 8a. CORS Policy

```ts
// NestJS main.ts
app.enableCors({
  origin: [
    "https://rsocp.yourdomain.com", // Production frontend
    "https://staging.rsocp.yourdomain.com", // Staging
    // 'http://localhost:5173' hanya untuk development, dikontrol via ENV
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400, // Pre-flight cache 24 jam
});
```

> **Keputusan CORS:** Whitelist eksplisit (bukan `origin: '*'`) karena API menggunakan `credentials: true` (JWT via cookie atau header). Browser akan memblokir `credentials: true` + wildcard origin. Daftar origin dikontrol via ENV variable untuk portabilitas.

### 8b. Rate Limiting

```ts
// NestJS: @nestjs/throttler
ThrottlerModule.forRoot([
  {
    name: "short",
    ttl: 1000, // 1 detik
    limit: 10, // max 10 req/detik per IP
  },
  {
    name: "long",
    ttl: 60000, // 1 menit
    limit: 200, // max 200 req/menit per IP
  },
]);
```

**Endpoint kritis dengan rate limit lebih ketat:**

| Endpoint                           | Limit                   |
| ---------------------------------- | ----------------------- |
| `POST /auth/login`                 | 5 req/menit per IP      |
| `POST /auth/mfa/verify`            | 5 req/menit per session |
| `POST /compliance/balmon/activate` | 1 req/5 menit per user  |
| `POST /orchestration/bulk`         | 10 req/menit per user   |

### 8c. JWT Signing Key Rotation

- Signing algorithm: **RS256** (asymmetric) — bukan HS256
- Key format: RSA 4096-bit
- Rotation interval: setiap **90 hari**
- Selama rotation: mendukung 2 public key aktif bersamaan (current + previous) untuk grace period validasi token lama
- Emergency rotation: segera rotasi jika ada indikasi private key compromise

```bash
# Generate key pair baru
openssl genrsa -out jwt-private-new.pem 4096
openssl rsa -in jwt-private-new.pem -pubout -out jwt-public-new.pem
```

> **Alasan RS256 vs HS256:** RS256 memisahkan kemampuan signing (private key, hanya di server) dan verifikasi (public key, bisa di-share). Ini penting jika ke depan RF Analytics microservice (Python) perlu memverifikasi token secara mandiri tanpa memiliki signing secret.

---

## 9. Audit Security

- Immutable (append-only)
- Tidak boleh dihapus / update
- Tidak menyimpan data sensitif

---

## 10. Worker Security

- Worker tidak expose ke publik
- Consume queue only
- Job wajib unique + idempotent

---

## 11. Compliance Security (Balmon)

- Hanya Super Admin
- Semua action tercatat
- Wajib rollback tersedia
- Validasi:
  - Frequency range
  - EIRP limit
  - Blacklist enforcement

---

## 12. Threat Mitigation

Risiko:

- Credential leakage
- Unauthorized access
- Mass misconfiguration
- Queue attack

Mitigasi:

- AES-256-GCM
- RBAC + MFA
- VLAN isolation
- Audit logging
- Rate limiting

---

## 13. Security Checklist

**Kriptografi:**

- [ ] AES-256-GCM aktif untuk credential encryption
- [ ] Key rotation aktif (30–90 hari)
- [ ] JWT RS256 (bukan HS256)
- [ ] JWT Access Token: 15 menit, Refresh Token: 7 hari dengan rotation
- [ ] Password hashed dengan Argon2id (bukan MD5/SHA1)

**Network & Transport:**

- [ ] SNMPv3 enforced (disable SNMPv2c)
- [ ] VLAN isolation aktif
- [ ] TLS 1.3 untuk semua koneksi API
- [ ] HTTPS enforced (HTTP redirect ke HTTPS)
- [ ] CORS whitelist dikonfigurasi (bukan wildcard)

**Authentication & Authorization:**

- [ ] JWT aktif
- [ ] MFA (TOTP) aktif untuk SUPER_ADMIN
- [ ] RBAC enforced di setiap endpoint
- [ ] Rate limiting dikonfigurasi
- [ ] Session binding (IP + User-Agent)

**Data:**

- [ ] Audit log immutable (no update/delete)
- [ ] No plaintext credential di database
- [ ] No credential di response API / log
- [ ] mfa_secret tidak pernah di-serialize ke JSON

**Infrastructure:**

- [ ] SSH hardened (key-only, no root)
- [ ] Fail2ban aktif
- [ ] Redis tidak expose ke publik
- [ ] PostgreSQL tidak expose ke publik

---

## 14. Conclusion

Standar ini menjamin:

- Keamanan credential perangkat
- Orchestration aman dan terkontrol
- Compliance berjalan tanpa risiko tinggi
- Sistem siap skala besar dengan keamanan tinggi
