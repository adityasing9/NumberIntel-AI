# NumberIntel AI — API Specification

The NumberIntel AI platform exposes a high-performance RESTful API documented via OpenAPI 3.0 / Swagger UI (`/docs`) and ReDoc (`/redoc`).

---

## 1. Authentication (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Provisions an investigator account.
- **Payload**:
  ```json
  {
    "email": "investigator@agency.gov",
    "password": "SecurePassword123!",
    "full_name": "Special Agent Smith",
    "role_name": "investigator"
  }
  ```
- **Response**: `201 Created` with JWT access token.

### `POST /api/v1/auth/login`
Authenticates user and returns Bearer access token.
- **Payload**:
  ```json
  {
    "email": "admin@numberintel.ai",
    "password": "Admin@NumberIntel2026!"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user_id": "uuid",
    "email": "admin@numberintel.ai",
    "role": "admin",
    "full_name": "Lead Intelligence Architect"
  }
  ```

---

## 2. Ingestion & Bulk Processing (`/api/v1/bulk`)

### `POST /api/v1/bulk/preflight`
Normalizes raw input, identifies country codes, eliminates duplicates, and previews valid numbers.
- **Payload**:
  ```json
  {
    "raw_text": "+919876543210\n9876543210\n+18002738255",
    "default_country": "IN"
  }
  ```
- **Response**:
  ```json
  {
    "total_detected": 3,
    "valid_count": 2,
    "invalid_count": 0,
    "duplicate_count": 1,
    "valid_samples": [...]
  }
  ```

### `POST /api/v1/bulk/paste`
Submits multi-number raw text batches up to 10,000 numbers into asynchronous background workers.
- **Response**: `202 Accepted` with `job_id` and initial progress status.

### `POST /api/v1/bulk/upload`
Accepts `multipart/form-data` with CSV, XLSX, or TXT file attachments. Automatically discovers the phone number column.

### `GET /api/v1/bulk/jobs/{job_id}/progress`
Real-time telemetry on processed records, success count, failure count, and percentage.

---

## 3. Phone Number Intelligence (`/api/v1/numbers`)

### `POST /api/v1/numbers/single`
Synchronously/asynchronously runs a complete 12-feed intelligence lookup on a single target telephone number.

### `GET /api/v1/numbers/{task_id}/report`
Fetches the full forensic dossier:
- **Number Overview**: ITU validity, E.164, national format, carrier geocoding, line type.
- **Public Identity**: Discovered business and caller names with source citations.
- **Social Media Grid**: 9 platform statuses (WhatsApp, Telegram, Signal, Instagram, Facebook, LinkedIn, X, TikTok, Snapchat).
- **Spam Intelligence**: Aggregated community reports, fraud tags, risk level.
- **AI Synthesis**: Executive summary, verified facts, inferences with reasoning, missing attributes.

---

## 4. Analytics & Investigations (`/api/v1/analytics`, `/api/v1/investigations`)

### `GET /api/v1/analytics/dashboard`
Returns live metrics derived directly from MySQL database tables:
- Total numbers processed
- Verified matches count
- Possible matches count
- Spam detections
- 7-day rolling timeline
- Top numbering regions
- Spam category distribution

### `GET /api/v1/investigations/{id}/table`
Server-side paginated results grid with column search, status filters, and sorting.

### `GET /api/v1/reports/{investigation_id}/export?format=csv|xlsx|json`
Streams investigation findings in CSV (with UTF-8 BOM), Excel (.xlsx with styled headers), or JSON.
