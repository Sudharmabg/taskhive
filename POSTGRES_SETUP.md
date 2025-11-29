# PostgreSQL Setup for TaskHive

## 1. Install PostgreSQL
Download and install PostgreSQL from: https://www.postgresql.org/download/

## 2. Create Database
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE taskhive;

-- Exit psql
\q
```

## 3. Configuration
Backend uses default postgres user:
- Username: `postgres`
- Password: `postgres` (or your postgres password)

## 4. Start Backend
```bash
cd taskhive-backend
mvn spring-boot:run
```

## 5. Verify Setup
- Database tables will be created automatically via Flyway migrations
- Sample data will be inserted via DataInitializer
- Check logs for successful startup

## Login Credentials
- Username: `root`
- Password: `root123`