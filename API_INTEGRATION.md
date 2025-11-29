# TaskHive API Integration Guide

## Overview
TaskHive frontend is now integrated with backend APIs for complete data management. The application uses a centralized API service with custom React hooks for state management.

## API Configuration

### Environment Variables
```bash
REACT_APP_API_URL=http://localhost:8080/api
```

### API Service (`src/services/api.js`)
Centralized service handling all HTTP requests with:
- Automatic token management
- Error handling
- Request/response interceptors

## API Endpoints

### Authentication
- `POST /auth/login` - User authentication

### Users
- `GET /users` - Get all users
- `POST /users` - Create new user

### Stories
- `GET /stories` - Get all stories
- `GET /stories/:id` - Get specific story
- `POST /stories` - Create new story
- `PUT /stories/:id` - Update story
- `DELETE /stories/:id` - Delete story

### Sprints
- `GET /sprints` - Get all sprints
- `GET /sprints/:id` - Get specific sprint
- `GET /sprints/current` - Get current active sprint
- `POST /sprints` - Create new sprint
- `PUT /sprints/:id` - Update sprint
- `POST /sprints/:id/close` - Close sprint
- `POST /sprints/:id/stories` - Add story to sprint
- `DELETE /sprints/:id/stories/:storyId` - Remove story from sprint

### Teams
- `GET /teams` - Get all teams
- `POST /teams` - Create new team

### Analytics
- `GET /analytics/dashboard` - Get dashboard statistics

## Custom Hooks

### `useStories(type)`
Manages story data with CRUD operations:
```javascript
const { stories, loading, error, createStory, updateStory, deleteStory } = useStories('Task');
```

### `useSprints()`
Manages sprint collection:
```javascript
const { sprints, loading, error, createSprint, updateSprint, closeSprint } = useSprints();
```

### `useSprint(sprintId)`
Manages individual sprint with stories:
```javascript
const { 
  sprint, 
  stories, 
  availableStories, 
  loading, 
  error, 
  addStoryToSprint, 
  removeStoryFromSprint 
} = useSprint(sprintId);
```

## Updated Components

### SprintDetailPage
- Integrated with `useSprint` hook
- Real-time story management
- API-based CRUD operations
- Proper loading and error states

### TaskManagement
- Integrated with `useStories` hook
- API-based task operations
- Loading and error handling

## Error Handling

### ErrorBoundary Component
Catches and displays React errors gracefully:
```jsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### API Error Handling
- Automatic token refresh
- User-friendly error messages
- Retry mechanisms for failed requests

## Loading States

### LoadingSpinner Component
Reusable loading indicator:
```jsx
<LoadingSpinner size="lg" />
```

## Backend Requirements

### Expected Data Formats

#### Story Object
```json
{
  "id": "EMP-T2001",
  "title": "Story title",
  "description": "Story description",
  "type": "Task|Epic|Bug",
  "status": "Pending|In Progress|Completed|Overdue",
  "priority": "Critical|High|Medium|Low",
  "assignee": "User name",
  "progress": 75,
  "storyPoints": 5,
  "deadline": "2024-01-15",
  "createdDate": "2024-01-08",
  "acceptanceCriteria": "Criteria text",
  "attachments": []
}
```

#### Sprint Object
```json
{
  "id": "SPR-001",
  "name": "Sprint 1 - Q1 2024",
  "description": "Sprint description",
  "startDate": "2024-01-15",
  "endDate": "2024-01-29",
  "status": "Active|Planning|Completed",
  "stories": ["EMP-T2001", "EMP-E1001"],
  "progress": 65
}
```

## Authentication

### Token Management
- JWT tokens stored in localStorage
- Automatic inclusion in API requests
- Token refresh on expiration

### User Session
```json
{
  "id": "user123",
  "username": "john.doe",
  "role": "admin|user",
  "name": "John Doe",
  "email": "john@example.com"
}
```

## Development Setup

1. **Start Backend Server**
   ```bash
   # Backend should run on http://localhost:8080
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Update REACT_APP_API_URL if needed
   ```

3. **Start Frontend**
   ```bash
   npm start
   ```

## Testing API Integration

### Mock Data Fallback
Components gracefully handle API failures with mock data for development.

### Error Scenarios
- Network failures
- Authentication errors
- Validation errors
- Server errors

## Performance Optimizations

### Data Caching
- React Query integration ready
- Local state management
- Optimistic updates

### Lazy Loading
- Component-level code splitting
- Route-based lazy loading
- Image lazy loading

## Security Considerations

### API Security
- HTTPS in production
- CORS configuration
- Rate limiting
- Input validation

### Frontend Security
- XSS protection
- CSRF tokens
- Secure token storage
- Input sanitization

## Deployment

### Environment Configuration
```bash
# Production
REACT_APP_API_URL=https://api.taskhive.com

# Staging  
REACT_APP_API_URL=https://staging-api.taskhive.com

# Development
REACT_APP_API_URL=http://localhost:8080/api
```

### Build Process
```bash
npm run build
# Outputs to build/ directory
```

## Monitoring and Logging

### Error Tracking
- Frontend error boundary
- API error logging
- User action tracking

### Performance Monitoring
- API response times
- Component render times
- Bundle size optimization

## Future Enhancements

### Real-time Features
- WebSocket integration
- Live notifications
- Collaborative editing

### Offline Support
- Service worker integration
- Offline data sync
- Progressive Web App features

### Advanced Features
- File upload with progress
- Bulk operations
- Advanced filtering and search
- Data export capabilities