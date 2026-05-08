def test_create_ticket(client):
    response = client.post(
        "/api/v1/tickets",
        json={"title": "First bug", "description": "Something is broken"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "First bug"
    assert data["status"] == "open"
    assert data["priority"] == "medium"
    assert data["author"]["email"] == "test@example.com"
    assert data["assignee"] is None


def test_list_tickets_empty(client):
    response = client.get("/api/v1/tickets")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []


def test_list_tickets_with_filter(client):
    client.post("/api/v1/tickets", json={"title": "A", "priority": "low"})
    client.post("/api/v1/tickets", json={"title": "B", "priority": "high"})

    response = client.get("/api/v1/tickets?priority=high")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "B"


def test_get_ticket(client):
    created = client.post("/api/v1/tickets", json={"title": "Detail"}).json()
    response = client.get(f"/api/v1/tickets/{created['id']}")
    assert response.status_code == 200
    assert response.json()["title"] == "Detail"


def test_get_ticket_not_found(client):
    response = client.get("/api/v1/tickets/9999")
    assert response.status_code == 404


def test_update_ticket_status(client):
    created = client.post("/api/v1/tickets", json={"title": "X"}).json()
    response = client.patch(
        f"/api/v1/tickets/{created['id']}",
        json={"status": "in_progress"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"


def test_update_ticket_invalid_assignee(client):
    created = client.post("/api/v1/tickets", json={"title": "X"}).json()
    response = client.patch(
        f"/api/v1/tickets/{created['id']}",
        json={"assignee_id": 9999},
    )
    assert response.status_code == 422