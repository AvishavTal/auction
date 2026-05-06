### Start / Update

Run this whenever you change Java code to rebuild the app:
```bash
docker compose up --build -d
```

### Stop
Stop containers but keep database data:
```bash
docker compose stop
```

### Full Reset (Wipe DB)
Use this if your JPA mappings changed and you need a fresh schema:
```bash
docker compose down -v
docker compose up --build -d
```

### Logs
Monitor Spring Boot startup or errors:
```bash
docker compose logs -f app
```

```