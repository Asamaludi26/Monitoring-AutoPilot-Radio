# Security & Cryptography Standards
RF Spectrum Orchestration & Compliance Platform (RSOCP)
Priority: 3
Version: 1.0

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
- JWT + expiry
- Refresh token

### Layer 6 – Presentation
- Input validation
- Data sanitization

### Layer 7 – Application
- RBAC
- MFA
- Audit log immutable
- Idempotent execution

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

- JWT authentication
- Short-lived token
- Input validation
- Rate limiting
- Idempotent API

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

- AES-256-GCM aktif
- Key rotation aktif
- SNMPv3 enforced
- VLAN isolation aktif
- JWT aktif
- Audit immutable
- No plaintext credential
- SSH hardened
- HTTPS enforced

---

## 14. Conclusion

Standar ini menjamin:
- Keamanan credential perangkat
- Orchestration aman dan terkontrol
- Compliance berjalan tanpa risiko tinggi
- Sistem siap skala besar dengan keamanan tinggi
