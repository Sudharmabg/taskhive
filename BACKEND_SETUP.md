# TaskHive Backend Setup Guide

## Prerequisites
- Java 17 or higher
- Maven 3.6+
- PostgreSQL 12+

## Database Setup

1. **Create Database**
```sql
CREATE DATABASE taskhive;
CREATE USER taskhive_user WITH PASSWORD 'taskhive_password';
GRANT ALL PRIVILEGES ON DATABASE taskhive TO taskhive_user;
```

2. **Update application.properties**
```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/taskhive
spring.datasource.username=taskhive_user
spring.datasource.password=taskhive_password
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Flyway Configuration
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
spring.flyway.baseline-on-migrate=true

# Server Configuration
server.port=8080
server.servlet.context-path=/api

# CORS Configuration
cors.allowed-origins=http://localhost:3000
```

## Running the Backend

1. **Navigate to backend directory**
```bash
cd taskhive-backend
```

2. **Install dependencies**
```bash
mvn clean install
```

3. **Run the application**
```bash
mvn spring-boot:run
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/validate-token` - Token validation
- `POST /api/auth/setup-password` - Password setup

### Users
- `GET /api/users?companyId={id}` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Stories
- `GET /api/stories?companyId={id}` - Get all stories
- `GET /api/stories?companyId={id}&type={type}` - Get stories by type
- `GET /api/stories/{id}` - Get story by ID
- `POST /api/stories` - Create story
- `PUT /api/stories/{id}` - Update story
- `DELETE /api/stories/{id}` - Delete story

### Sprints
- `GET /api/sprints?companyId={id}` - Get all sprints
- `GET /api/sprints/{id}` - Get sprint with stories
- `GET /api/sprints/current?companyId={id}` - Get current active sprint
- `POST /api/sprints` - Create sprint
- `PUT /api/sprints/{id}` - Update sprint
- `POST /api/sprints/{id}/close` - Close sprint
- `POST /api/sprints/{sprintId}/stories` - Add story to sprint
- `DELETE /api/sprints/{sprintId}/stories/{storyId}` - Remove story from sprint

### Teams
- `GET /api/teams?companyId={id}` - Get all teams
- `POST /api/teams` - Create team

## Database Schema

### Tables Created
- `companies` - Company information
- `users` - User accounts and profiles
- `teams` - Team organization
- `sprints` - Sprint management
- `stories` - Story/task management

### Sample Data Included
- Default company (ID: 1)
- Sample teams (Frontend, Backend, QA)
- Sample sprints with stories
- Various story types (Epic, Task, Bug)

## Testing the API

1. **Start the backend server**
2. **Test with curl or Postman**

```bash
# Get all stories
curl "http://localhost:8080/api/stories?companyId=1"

# Get current sprint
curl "http://localhost:8080/api/sprints/current?companyId=1"
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials
   - Ensure database exists

2. **Port Already in Use**
   - Change server.port in application.properties
   - Kill existing process on port 8080

3. **Flyway Migration Error**
   - Check database permissions
   - Verify migration scripts syntax
   - Clear flyway_schema_history table if needed

### Logs Location
- Application logs: Console output
- Database logs: PostgreSQL logs directory

## Development Notes

### Adding New Endpoints
1. Create model in `model/` package
2. Create repository in `repository/` package  
3. Create service interface and implementation
4. Create controller with REST endpoints
5. Add database migration if needed

### Security Configuration
- CORS enabled for localhost:3000
- JWT token authentication ready
- Role-based access control implemented

### Performance Considerations
- Database indexes on frequently queried columns
- Lazy loading for entity relationships
- Connection pooling configured