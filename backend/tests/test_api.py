import pytest
from fastapi.testclient import TestClient
from app.main import app


def test_health_check():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "NumberIntel AI"


def test_auth_flow():
    with TestClient(app) as client:
        # Login as admin
        login_resp = client.post("/api/v1/auth/login", json={
            "email": "admin@numberintel.ai",
            "password": "Admin@NumberIntel2026!"
        })
        assert login_resp.status_code == 200
        token_data = login_resp.json()
        assert "access_token" in token_data
        token = token_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Get /me
        me_resp = client.get("/api/v1/auth/me", headers=headers)
        assert me_resp.status_code == 200
        assert me_resp.json()["email"] == "admin@numberintel.ai"

        # Preflight check
        preflight_resp = client.post("/api/v1/bulk/preflight", headers=headers, json={
            "raw_text": "+919876543210\n+18002738255\ninvalid",
            "default_country": "IN"
        })
        assert preflight_resp.status_code == 200
        pf = preflight_resp.json()
        assert pf["valid_count"] == 2
        assert pf["invalid_count"] == 1

        # Single lookup
        single_resp = client.post("/api/v1/numbers/single", headers=headers, json={
            "phone_number": "+919876543210",
            "default_country": "IN",
            "investigation_title": "Automated Test Inspection"
        })
        assert single_resp.status_code == 200
        single_data = single_resp.json()
        assert single_data["e164_format"] == "+919876543210"
        assert single_data["is_valid"] is True
        assert len(single_data["platforms"]) == 9 # 9 platforms represented

        # Analytics dashboard
        dash_resp = client.get("/api/v1/analytics/dashboard", headers=headers)
        assert dash_resp.status_code == 200
        dash = dash_resp.json()
        assert "metrics" in dash
        assert dash["metrics"]["total_numbers_processed"] >= 1

        # List investigations
        inv_resp = client.get("/api/v1/investigations", headers=headers)
        assert inv_resp.status_code == 200
        invs = inv_resp.json()
        assert len(invs) >= 1
        first_inv = invs[0]

        # Paginated table
        table_resp = client.get(f"/api/v1/investigations/{first_inv['id']}/table?page=1&page_size=10", headers=headers)
        assert table_resp.status_code == 200
        tbl = table_resp.json()
        assert "items" in tbl

        # Export investigation CSV
        export_resp = client.get(f"/api/v1/reports/{first_inv['id']}/export?format=csv", headers=headers)
        assert export_resp.status_code == 200
        assert "text/csv" in export_resp.headers["content-type"]

        # Export investigation Excel
        export_xlsx = client.get(f"/api/v1/reports/{first_inv['id']}/export?format=xlsx", headers=headers)
        assert export_xlsx.status_code == 200
