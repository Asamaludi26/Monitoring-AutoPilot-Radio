# Infrastructure & Deployment Playbook

**RF Spectrum Orchestration & Compliance Platform (RSOCP / RSTO)**
Version: 1.0
Environment Target: Production (Distributed System)

---

# 1. Tujuan Dokumen

Dokumen ini menjadi panduan standar untuk:

* Deployment sistem berbasis **distributed worker (BullMQ + Redis)**
* Standarisasi **containerization (Docker)**
* Implementasi **CI/CD pipeline (GitHub Actions)**
* Hardening **server Linux (Debian 13)**
* Manajemen resource pada **virtualized environment (Proxmox)**
* Setup **network layer (Reverse Proxy, Load Balancer, SNMP/SSH routing)**

Dokumen ini bersifat **mandatory reference** untuk seluruh aktivitas DevOps & SRE.

---

# 2. Arsitektur Infrastruktur (Production Blueprint)

## 2.1 Logical Components

* **Frontend (React/Vite)**
* **Backend API (NestJS)**
* **Worker Cluster (BullMQ)**
* **Redis Cluster (Queue + Cache)**
* **PostgreSQL**
* **Prometheus (Time-Series Metrics)**
* **Reverse Proxy (Nginx / Traefik)**

## 2.2 Deployment Pattern

Menggunakan pendekatan:

> **Blueprint Deployment Pattern**

Artinya:

* Tidak ada file `.env` langsung di repo
* Semua environment di-*inject* saat runtime
* Image Docker bersifat **immutable & reusable**

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

* Gunakan **multi-stage build**
* Hindari `.env` di dalam image
* Gunakan `npm ci` untuk deterministic install

---

## 3.3 Environment Injection (ANTI LEAK STRATEGY)

Gunakan:

* Docker Secrets / ENV runtime
* GitHub Actions secrets
* `.env.production` hanya di server

Contoh:

```bash
docker run -e DATABASE_URL=$DATABASE_URL \
           -e REDIS_HOST=$REDIS_HOST \
           app-backend:latest
```

**Dilarang:**

* commit `.env`
* bake ENV ke image

---

## 3.4 Docker Compose Production

```yaml
version: '3.9'

services:
  api:
    image: registry/rsto-api:latest
    deploy:
      replicas: 2
    env_file:
      - .env.production

  worker:
    image: registry/rsto-worker:latest
    deploy:
      replicas: 4

  redis:
    image: redis:7
    command: redis-server --appendonly yes

  postgres:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

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
    branches: [ "main" ]

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

* **Main branch = production**
* Gunakan:

  * Tagging: `v1.0.0`
  * Blue-Green Deployment (optional)
  * Rolling update untuk worker

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

* Horizontal scale:

  * Worker (priority)
  * API
* Vertical scale:

  * PostgreSQL
  * Redis

---

## 6.3 Worker Queue Optimization

* Gunakan concurrency:

```ts
new Worker(queueName, processor, {
  concurrency: 20
})
```

* Pisahkan queue:

  * polling
  * config execution
  * compliance

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

* API → Round Robin
* Worker → Queue-based (BullMQ)
* Redis → Single / Cluster (future)

---

# 8. Network & Device Communication Layer

## 8.1 SNMP Configuration

* Gunakan SNMPv3 (secure)
* Batasi access IP

```
snmp-server community secure RO
```

---

## 8.2 SSH Execution

Gunakan:

* Key-based auth
* Timeout control
* Retry mechanism

---

## 8.3 Port Management

| Protocol | Port |
| -------- | ---- |
| SNMP     | 161  |
| SSH      | 22   |
| API      | 3000 |
| Redis    | 6379 |

---

## 8.4 Network Isolation

* VLAN untuk device radio
* Backend server tidak expose langsung ke internet

---

# 9. Observability & Monitoring

## 9.1 Metrics

* Prometheus:

  * Worker throughput
  * Queue latency
  * SNMP success rate

## 9.2 Logging

Gunakan:

* Winston / Pino
* Centralized logging (ELK optional)

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

* Restore DB
* Restart worker
* Rebuild queue (idempotent job design)

---

# 11. Deployment Checklist (MANDATORY)

* [ ] ENV tidak hardcoded
* [ ] Docker image immutable
* [ ] CI/CD pipeline green
* [ ] Firewall aktif
* [ ] SSH secured
* [ ] Redis persistence aktif
* [ ] DB backup aktif
* [ ] Worker scaling tested
* [ ] SNMP connectivity verified

---

# 12. Penutup

Playbook ini dirancang untuk memastikan:

* **Zero human error deployment**
* **Scalable distributed processing**
* **Secure device orchestration**
* **High availability RF management system**

Dokumen ini harus menjadi referensi utama sebelum deployment ke production.
