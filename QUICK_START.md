# TaskHive Quick Start Guide

## 🚀 No Database Setup Required!

TaskHive now uses **H2 in-memory database** for instant local testing - no PostgreSQL installation needed!

## Start the Application

### 1. Start Backend (Terminal 1)
```bash
cd taskhive-backend
mvn spring-boot:run
```
**OR** double-click `start-backend.bat`

### 2. Start Frontend (Terminal 2)
```bash
npm start
```

## 🔑 Login Credentials

**Demo Login:**
- Username: `root`
- Password: `root123`

## 🎯 What Works Now

### ✅ Authentication
- Login with demo credentials
- Token-based authentication
- User session management

### ✅ Sprint Management
- View current active sprint
- Add/remove stories from sprints
- Sprint progress tracking
- Role-based permissions (admin vs user)

### ✅ Story Management
- Create/edit/delete stories (Tasks, Epics, Bugs)
- Story assignment and progress tracking
- Priority and status management

### ✅ Database
- H2 in-memory database (auto-created)
- Sample data pre-loaded
- No manual database setup required

## 🔍 API Testing

Backend runs on: `http://localhost:8080`

### Test Endpoints:
```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"root","password":"root123"}'

# Get Stories
curl "http://localhost:8080/api/stories?companyId=1"

# Get Current Sprint
curl "http://localhost:8080/api/sprints/current?companyId=1"
```

## 🗄️ Database Console (Optional)

Access H2 database console at: `http://localhost:8080/h2-console`

**Connection Details:**
- JDBC URL: `jdbc:h2:mem:taskhive`
- Username: `sa`
- Password: (leave empty)

## 📊 Sample Data Included

- **Company:** TaskHive Demo (ID: 1)
- **Users:** Admin User, John Doe
- **Teams:** Frontend Team, Backend Team
- **Sprint:** Active sprint with sample stories
- **Stories:** Epic, Task, and Bug examples

## 🔧 Troubleshooting

### Backend Won't Start
1. Ensure Java 17+ is installed
2. Check if port 8080 is available
3. Run `mvn clean install` first

### Frontend Issues
1. Run `npm install` if dependencies missing
2. Check if port 3000 is available
3. Ensure backend is running first

### Login Issues
- Use exact credentials: `root` / `root123`
- Check browser console for errors
- Verify backend is responding at localhost:8080

## 🎉 Success!

Once both servers are running:
1. Open `http://localhost:3000`
2. Login with demo credentials
3. Navigate to "Current Sprint" to see sprint management
4. Try adding/removing stories from the sprint
5. Create new stories in Task/Epic/Bug management pages

## 🔄 Data Persistence

**Note:** H2 is in-memory, so data resets on backend restart. This is perfect for testing and development!

For production, switch to PostgreSQL by updating `application.properties`.