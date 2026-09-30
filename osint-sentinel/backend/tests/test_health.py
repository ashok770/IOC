from unittest.mock import patch
from fastapi.testclient import TestClient


def test_health_endpoint_structure(client: TestClient):
    """
    Ensure GET /api/health returns 200 with the required contract keys and authorized mode flag.
    """
    response = client.get("/api/health")
    assert response.status_code == 200

    data = response.json()
    assert "status" in data
    assert data["project"] == "OSINT Sentinel"
    assert "version" in data
    assert "environment" in data
    assert "timestamp" in data
    assert "database" in data
    assert isinstance(data["database"], dict)
    assert "connected" in data["database"]
    assert "details" in data["database"]
    assert data["mode"] == "authorized_assessment_only"


def test_health_endpoint_db_connected(client: TestClient):
    """
    Ensure health reports 'ok' when database is reachable.
    """
    with patch("app.api.v1.health.check_db_connection") as mock_check:
        mock_check.return_value = (True, "Database connected successfully")

        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "ok"
        assert data["database"]["connected"] is True
        assert data["database"]["details"] == "Database connected successfully"


def test_health_endpoint_db_offline_graceful(client: TestClient):
    """
    Ensure health gracefully reports 'degraded' when database is offline,
    while still returning HTTP 200 so monitoring checks do not crash.
    """
    with patch("app.api.v1.health.check_db_connection") as mock_check:
        mock_check.return_value = (False, "Database offline or unreachable")

        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "degraded"
        assert data["database"]["connected"] is False
        assert data["database"]["details"] == "Database offline or unreachable"


def test_openapi_documentation_accessible(client: TestClient):
    """
    Ensure OpenAPI schema and docs endpoints are accessible.
    """
    openapi_res = client.get("/openapi.json")
    assert openapi_res.status_code == 200
    schema = openapi_res.json()
    assert schema["info"]["title"] == "OSINT Sentinel"

    docs_res = client.get("/docs")
    assert docs_res.status_code == 200
