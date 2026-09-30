from fastapi.testclient import TestClient


def test_create_target_success(client: TestClient):
    response = client.post(
        "/api/v1/targets",
        json={"primary_domain": "Acme-Corp.org", "organization_name": "Acme Corporation"},
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["primary_domain"] == "acme-corp.org"
    assert data["name"] == "Acme Corporation"
    assert data["assessment_status"] == "pending"


def test_create_duplicate_target_conflict(client: TestClient):
    client.post(
        "/api/v1/targets",
        json={"primary_domain": "unique-target.org"},
    )
    # Attempting to register the same normalized domain again
    dup_res = client.post(
        "/api/v1/targets",
        json={"primary_domain": "UNIQUE-TARGET.ORG"},
    )
    assert dup_res.status_code == 409
    assert "already registered" in dup_res.json()["detail"]


def test_create_invalid_domain_rejected(client: TestClient):
    # Reject URL
    res_url = client.post(
        "/api/v1/targets",
        json={"primary_domain": "https://example.com/login"},
    )
    assert res_url.status_code == 422

    # Reject IP address
    res_ip = client.post(
        "/api/v1/targets",
        json={"primary_domain": "192.168.1.50"},
    )
    assert res_ip.status_code == 422


def test_list_and_get_targets(client: TestClient):
    # Create two targets
    t1 = client.post("/api/v1/targets", json={"primary_domain": "target-alpha.com"}).json()
    t2 = client.post("/api/v1/targets", json={"primary_domain": "target-beta.com"}).json()

    # List targets
    list_res = client.get("/api/v1/targets")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 2
    domains = [t["primary_domain"] for t in list_data["items"]]
    assert "target-alpha.com" in domains
    assert "target-beta.com" in domains

    # Get single target by ID
    get_res = client.get(f"/api/v1/targets/{t1['id']}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == t1["id"]
    assert get_res.json()["primary_domain"] == "target-alpha.com"


def test_get_target_not_found(client: TestClient):
    res = client.get("/api/v1/targets/non-existent-uuid")
    assert res.status_code == 404
