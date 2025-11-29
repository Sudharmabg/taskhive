# TaskHive API Endpoints

## Authentication
- ✅ `POST /api/auth/login` - Login with username/password
- ✅ `GET /api/auth/validate-token` - Validate JWT token

## Stories
- ✅ `GET /api/stories?companyId={id}` - Get all stories
- ✅ `GET /api/stories?companyId={id}&type={type}` - Get stories by type
- ✅ `GET /api/stories/{id}` - Get story by ID
- ✅ `POST /api/stories` - Create new story
- ✅ `PUT /api/stories/{id}` - Update story
- ✅ `DELETE /api/stories/{id}` - Delete story

## Sprints
- ✅ `GET /api/sprints?companyId={id}` - Get all sprints
- ✅ `GET /api/sprints/{id}` - Get sprint with stories
- ✅ `GET /api/sprints/current?companyId={id}` - Get current active sprint
- ✅ `POST /api/sprints` - Create new sprint
- ✅ `PUT /api/sprints/{id}` - Update sprint
- ✅ `POST /api/sprints/{id}/close` - Close sprint
- ✅ `POST /api/sprints/{sprintId}/stories` - Add story to sprint
- ✅ `DELETE /api/sprints/{sprintId}/stories/{storyId}` - Remove story from sprint

## Teams
- ✅ `GET /api/teams?companyId={id}` - Get all teams
- ✅ `POST /api/teams` - Create new team

## Users
- ✅ `GET /api/users?companyId={id}` - Get all users
- ✅ `POST /api/users` - Create new user
- ✅ `PUT /api/users/{id}` - Update user
- ✅ `DELETE /api/users/{id}` - Delete user

## Analytics/Dashboard
- ✅ `GET /api/analytics/dashboard?companyId={id}` - Get dashboard statistics

## UI Functionality Coverage

### Dashboard Page
- ✅ Story statistics (total, completed, in progress, pending)
- ✅ Recent stories display
- ✅ Quick actions (add story)

### Story Management
- ✅ Task Management - CRUD operations for Task stories
- ✅ Epic Management - CRUD operations for Epic stories  
- ✅ Bug Management - CRUD operations for Bug stories
- ✅ Story Management - Universal story management

### Sprint Management
- ✅ Sprint listing and creation
- ✅ Sprint detail view with story management
- ✅ Add/remove stories from sprints
- ✅ Current sprint access
- ✅ Sprint progress tracking

### Team Management
- ✅ Team listing and creation
- ✅ Team member management

### Authentication
- ✅ Login functionality
- ✅ Session management
- ✅ Role-based access (admin/user)

## Logging Added
- ✅ Request/response logging in all controllers
- ✅ Error logging with stack traces
- ✅ SQL query logging
- ✅ Performance logging

## Test Endpoints
```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"root","password":"root123"}'

# Get Stories
curl "http://localhost:8080/api/stories?companyId=1"

# Get Current Sprint
curl "http://localhost:8080/api/sprints/current?companyId=1"

# Get Dashboard Stats
curl "http://localhost:8080/api/analytics/dashboard?companyId=1"
```