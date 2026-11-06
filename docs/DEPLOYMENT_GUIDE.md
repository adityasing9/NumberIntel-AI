# NumberIntel AI — Deployment & Infrastructure Guide

This guide details the deployment of NumberIntel AI in local development, containerized environments (Docker Compose), and production cloud services (Google Cloud Run + Vercel + Managed MySQL).

---

## 1. Quick Local Development (Zero Configuration)

NumberIntel AI automatically defaults to an embedded SQLite database if MySQL is not detected, enabling immediate zero-friction local execution.

### Backend Setup:
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python seed.py        # Populates schema & demo investigations
python run.py         # Launches FastAPI on http://localhost:8000
```

### Frontend Setup:
```bash
cd frontend
npm install
npm run dev           # Launches Vite on http://localhost:5173
```

---

## 2. Containerized Deployment (Docker Compose)

For production parity with MySQL 8.0, Redis 7.0, and Celery Workers:

```bash
cd docker
docker-compose up -d --build
```

### Services Started:
- **MySQL 8.0**: `localhost:3306` (Persistent volume `mysql_data`, automated schema init)
- **Redis 7.0**: `localhost:6379` (Task broker and token-bucket rate limiter)
- **FastAPI Gateway**: `localhost:8000`
- **Celery Worker**: 4 concurrent worker threads consuming the `numberintel_tasks` queue
- **React Frontend**: `localhost:5173` (Served via Alpine Nginx reverse proxy)

---

## 3. Production Cloud Deployment

### Backend: Google Cloud Run
1. Build and push the container image:
   ```bash
   gcloud builds submit --tag gcr.io/[PROJECT-ID]/numberintel-backend ./backend
   ```
2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy numberintel-backend \
     --image gcr.io/[PROJECT-ID]/numberintel-backend \
     --platform managed \
     --region asia-south1 \
     --allow-unauthenticated \
     --set-env-vars DATABASE_URL="mysql+pymysql://[USER]:[PASS]@[CLOUD_SQL_IP]:3306/numberintel",REDIS_URL="redis://[REDIS_IP]:6379/0",SECRET_KEY="[SECURE_JWT_SECRET]"
   ```

### Frontend: Vercel
1. Set the root directory to `frontend`.
2. Configure build settings:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Set environment variable:
   - `VITE_API_URL`: URL of the deployed Google Cloud Run backend (e.g. `https://numberintel-backend-xyz.a.run.app`).

### Database: Google Cloud SQL (MySQL 8.0)
- Character Set: `utf8mb4`
- Collation: `utf8mb4_unicode_ci`
- Run initial migration: `docker/mysql-init/01-schema.sql`
