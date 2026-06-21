# Auction System

An electronic auction platform built with Spring Boot, PostgreSQL, ActiveMQ, and Vanilla JS.

---

## Running Locally (recommended for development)

Start infrastructure (DB + ActiveMQ + MailHog), run Spring Boot locally:

```bash
docker compose up db activemq mailhog -d
./mvnw spring-boot:run
```

Open the app at: http://localhost:8080

### Seed 50 sample items

```bash
docker exec -it auction-db-1 psql -U appuser -d appdb -c "TRUNCATE item_images, items RESTART IDENTITY CASCADE;"
uv run seed.py
```

---

## Running with Docker (full stack)

```bash
docker compose up --build -d
```

---

## Useful URLs

| Service | URL |
|---|---|
| App | http://localhost:8080 |
| MailHog (view emails) | http://localhost:8025 |
| ActiveMQ console | http://localhost:8161 (admin / admin) |

---

## Common Commands

### Stop (keep data)
```bash
docker compose stop
```

### Full reset (wipe DB)
```bash
docker compose down -v
docker compose up --build -d
```

### Logs
```bash
docker compose logs -f app
```

---

## Architecture

- **Backend** — Spring Boot, JPA/Hibernate, PostgreSQL
- **Messaging** — ActiveMQ JMS for async auction-close notifications
- **Email** — JavaMailSender → MailHog (dev) / SMTP (prod)
- **Scheduler** — `@Scheduled` runs every 60s to close expired auctions
- **Frontend** — Vanilla JS (ES6 modules), RTL Hebrew UI

## Key Features

- Auction gallery with live countdown timers
- Search and filter by keyword, category, price
- Manual and proxy (automatic) bidding
- Soft close — bid in last 5 minutes extends auction by 5 minutes
- Automatic auction closing with winner detection
- Email notifications to winner and all participants via JMS
- User registration and login with BCrypt password hashing

---

## Development Workflow

### 1. Register a user
Go to http://localhost:8080/features/auth/ and register. You need **email** to receive auction-close notifications.

### 2. Seed sample data
```bash
# First wipe existing items (keeps users)
docker exec -it auction-db-1 psql -U appuser -d appdb -c "TRUNCATE item_images, items RESTART IDENTITY CASCADE;"

# Then seed 50 Hebrew items
uv run seed.py
```

> `uv` handles Python deps automatically — no pip/venv needed.

### 3. Test auction closing without waiting
Use the dev endpoint to fast-forward any item's end time to 10 seconds from now:

```bash
# Find the item ID from the URL: ?id=X
curl -X POST http://localhost:8080/api/items/{id}/expire-now
```

The scheduler runs every 60 seconds, so the auction will close within 1 minute.

### 4. Check emails
Open Mailpit at http://localhost:8025 — all outgoing emails appear here (winner notification + participant emails).

### 5. Fix NULL item status (if items can't be bid on)
If items were created before the `status` column was added, run:
```bash
docker exec -it auction-db-1 psql -U appuser -d appdb -c "UPDATE items SET status='ACTIVE' WHERE status IS NULL;"
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/items | List/search items (`?keyword=&categoryId=&minPrice=&maxPrice=`) |
| GET | /api/items/{id} | Item detail with last 5 bids |
| POST | /api/items | Create item |
| POST | /api/items/{id}/expire-now | **DEV** — fast-forward auction end to 10s |
| POST | /api/media/upload | Upload image |
| GET | /api/media/{filename} | Serve image |
| GET | /api/categories | List all categories |
| POST | /api/bids | Place a bid `{itemId, userId, amount, maxProxyAmount}` |
| POST | /api/auth/register | Register `{fullName, username, email, password}` |
| POST | /api/auth/login | Login `{username, password}` |
