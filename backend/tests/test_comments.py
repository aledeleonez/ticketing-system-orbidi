def test_create_and_list_comment(client):
    ticket = client.post("/api/v1/tickets", json={"title": "T"}).json()
    tid = ticket["id"]

    r = client.post(
        f"/api/v1/tickets/{tid}/comments",
        json={"body": "First comment"},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["body"] == "First comment"
    assert data["author"]["email"] == "test@example.com"

    r = client.get(f"/api/v1/tickets/{tid}/comments")
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_comments_on_missing_ticket(client):
    r = client.get("/api/v1/tickets/9999/comments")
    assert r.status_code == 404

    r = client.post("/api/v1/tickets/9999/comments", json={"body": "x"})
    assert r.status_code == 404