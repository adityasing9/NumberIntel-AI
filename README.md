# NumberIntel AI
### AI-Powered Bulk Phone Number Intelligence & Digital Footprint Discovery Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_Vite-61DAFB.svg?style=flat&logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Language-Python_3.10-3776AB.svg?style=flat&logo=python)](https://python.org)
[![MySQL](https://img.shields.io/badge/Database-MySQL_8.0-4479A1.svg?style=flat&logo=mysql)](https://mysql.com)
[![Docker](https://img.shields.io/badge/Containers-Docker_Compose-2496ED.svg?style=flat&logo=docker)](https://docker.com)
[![Compliance](https://img.shields.io/badge/Compliance-DPDP_2023_&_GDPR-10B981.svg?style=flat)]()

---

## Executive Overview

**NumberIntel AI** is an enterprise-grade phone number intelligence and digital footprint discovery platform. It ingests single or bulk phone numbers (up to 10,000 numbers per batch) and performs multi-layer validation, telecom geocoding, spam reputation analysis, cross-platform social discovery, and forensic AI investigation report generation.

Built under strict **Privacy-by-Design** principles compliant with the **Indian Digital Personal Data Protection Act (DPDP Act 2023)** and **GDPR**, the system adheres to a strict **Zero Fabrication Policy**: every piece of intelligence is backed by an immutable citation and SHA-256 data hash. The platform explicitly distinguishes between verified official associations, possible public matches, and protected non-verifiable accounts.

---

## Core Capabilities

- **High-Throughput Bulk Ingestion**:
  - Accepts CSV, Excel (`.xlsx`, `.xls`), TXT files, and raw multiline paste text.
  - Automatic phone column discovery.
  - Offline E.164 normalization, formatting, and international region resolution via Google `libphonenumber`.
  - Ingestion deduplication and pre-flight validation previews.
- **Multi-Category Phone Intelligence Engine**:
  - ITU-T validity, country ISO-2, dialing prefix, national and international formatting.
  - Number classification: Mobile, Fixed Line, VoIP, Toll-Free, Premium Rate, UAN.
  - Network operator and carrier allocation metadata.
- **Social Media & Messaging Footprint Discovery**:
  - Modular adapters for **9 major platforms**: WhatsApp, Telegram, Signal, Instagram, Facebook, LinkedIn, X, TikTok, Snapchat.
  - Transparent verification taxonomy: `Verified Association`, `Possible Public Match`, `Not Found`, and `Not Publicly Verifiable` (protects private accounts from unauthorized enumeration).
- **Spam & Fraud Reputation Intelligence**:
  - StopForumSpam open reputation feed integration.
  - Crowdsourced abuse database with salted SHA-256 IP hashing and honeypots.
  - Classifications: Telemarketing, Suspected Fraud, Financial Scam, Robocall, Unwanted Marketing.
- **Forensic AI Intelligence Agent (OpenRouter)**:
  - Powered by configurable LLM models (e.g. Anthropic Claude 3.5 Sonnet, GPT-4o, DeepSeek V3).
  - Validated against structured Pydantic v2 schemas: synthesizes verified facts vs. inferences, highlights conflicting identities across sources, identifies missing unverified attributes, and evaluates spam risk without hallucination.
- **High-Performance Investigation Table & Exports**:
  - Server-side paginated results grid with column search, status filters, and sorting.
  - One-click multi-format exports: **CSV** (with UTF-8 BOM), **Excel** (`.xlsx` with styled headers), and **JSON**.
- **Cybersecurity Dark Theme Dashboard**:
  - Charcoal & deep slate aesthetic with Cyan/Emerald accents.
  - Real-time Recharts visualizations: Activity timeline, top numbering regions, platform footprint breakdown, spam distribution donut chart.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, React Router v6, Axios |
| **Backend** | Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Google `libphonenumber` (`phonenumbers`), openpyxl, httpx, bcrypt, PyJWT |
| **Queue & Cache** | Celery 5.7, Redis 7.0, Token-Bucket Rate Limiter |
| **Database** | MySQL 8.0+ (17 Normalized Relational Tables), with embedded SQLite fallback for local zero-config runs |
| **AI Synthesis** | OpenRouter API (Claude 3.5 Sonnet / GPT-4o / DeepSeek V3) with rule-based forensic fallback |
| **DevOps** | Docker, Docker Compose, Nginx, Google Cloud Run ready, Vercel ready |

---

## 17-Table Database Architecture

1. `roles`: RBAC permissions (`admin`, `investigator`, `analyst`, `viewer`).
2. `users`: Credentials, active status, quotas.
3. `investigations`: Investigation case dossiers.
4. `phone_numbers`: Normalized E.164 numbers, ITU validity, carrier allocation.
5. `bulk_jobs`: Batch upload progress and telemetry.
6. `lookup_tasks`: Unit tasks scheduled per phone number.
7. `intelligence_results`: Resolved caller and business identities.
8. `platform_results`: Discovery results for 9 social and messaging networks.
9. `public_profiles`: Extracted public bios, avatars, and contact handles.
10. `source_providers`: Configurable API providers, rate limits, daily quotas.
11. `evidence_records`: Immutable evidence citations with SHA-256 hashes.
12. `spam_reports`: Threat categories, incident counts, risk levels.
13. `ai_reports`: OpenRouter forensic synthesis and conflicting identity analyses.
14. `api_usage`: Quota meters, latencies, and HTTP status codes.
15. `audit_logs`: Immutable security audit trail.
16. `consent_records`: DPDP 2023 purpose and lawful consent logs.
17. `user_settings`: Regional preferences and notification flags.

---

## Quickstart Guide

### 1. Zero-Config Local Run (Development)

The application runs locally without requiring external services (SQLite fallback is enabled by default):

#### Backend:
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux/macOS

pip install -r requirements.txt
python seed.py            # Generates database schema & demo records
python run.py             # Starts backend on http://localhost:8000
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev               # Starts frontend on http://localhost:5173
```

#### Default Credentials:
- **Email**: `admin@numberintel.ai`
- **Password**: `Admin@NumberIntel2026!`

---

### 2. Full Containerized Run (Docker Compose)

To launch with MySQL 8.0, Redis, Celery, FastAPI, and Nginx:
```bash
cd docker
docker-compose up -d --build
```
- Frontend UI: `http://localhost:5173`
- Backend API Docs: `http://localhost:8000/docs`

---

## Testing

Run the automated test suite covering authentication, libphonenumber normalization, deduplication, 9-platform discovery, and exports:

```bash
python -m pytest
```

All 7 test suites pass with 100% success rate:
- Health check verification
- JWT authentication and user clearance
- libphonenumber international parsing and geocoding
- Preflight validation with duplicate detection
- Single number lookup with 9 platform discovery cards
- Real database analytics calculation
- Multi-format data exports (CSV, XLSX, JSON)

---

## Documentation

- [API Specification & Endpoints](docs/API_DOCUMENTATION.md)
- [DPDP Act 2023 & Ethical OSINT Compliance](docs/DPDP_COMPLIANCE.md)
- [Deployment & Cloud Run / Vercel Guide](docs/DEPLOYMENT_GUIDE.md)

---

## License

Proprietary enterprise intelligence software. All rights reserved.
