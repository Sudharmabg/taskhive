# TaskHive - Technical Documentation

## 🏗️ Architecture Overview

TaskHive is built as a modern React-based single-page application with a focus on dark theme design and user experience. The application follows a component-based architecture with reusable UI components and consistent design patterns.

## 🎨 Design System

### **Theme Architecture**
- **Primary Color**: Golden (#ffc44d) - Used for CTAs, focus states, and accents
- **Background Hierarchy**: 
  - Main background: `bg-gray-900` (#111827)
  - Card backgrounds: `bg-gray-800` (#1f2937)
  - Input backgrounds: `bg-gray-700` (#374151)
- **Text Hierarchy**:
  - Primary text: `text-white`
  - Secondary text: `text-gray-300`
  - Muted text: `text-gray-400`

### **Component Styling Patterns**
```css
/* Standard Card Pattern */
.card {
  @apply bg-gray-800 border border-gray-700 rounded-lg shadow-sm;
}

/* Standard Input Pattern */
.input {
  @apply bg-gray-700 border border-gray-600 text-white placeholder-gray-400;
  --tw-ring-color: #ffc44d;
}

/* Standard Button Pattern */
.button-primary {
  background-color: #ffc44d;
  @apply text-black font-semibold hover:opacity-90;
}
```

## 🧩 Component Architecture

### **Modal System**
- **Base Modal**: `components/common/Modal.jsx`
  - Dark theme with `bg-gray-800` background
  - Escape key and backdrop click handling
  - Consistent sizing options (sm, md, lg, xl)

- **Specialized Modals**:
  - `LoginModal`: Authentication with demo credentials
  - `ContactModal`: Lead capture form
  - `SuccessModal`: Confirmation messages
  - `AddStoryModal`: Story creation with multiple assignees
  - `TaskDetailsModal`: Story viewing with role badges

### **Form Components**
- **Input Component**: `components/common/Input.jsx`
  - Dark theme with golden focus rings
  - Consistent error handling
  - Label and validation support

- **Button Component**: `components/common/Button.jsx`
  - Multiple variants: primary (golden), secondary, outline, danger
  - Consistent sizing and hover states

### **Chart Components**
- **Recharts Integration**: `components/charts/`
  - `PieChartInteractive`: Task distribution by priority
  - `BarChartTeams`: Team performance visualization
  - Dark theme with golden accents

## 📊 Data Management

### **State Management**
- **React Hooks**: useState, useEffect for local state
- **Local Storage**: Authentication state persistence
- **Mock Data**: Comprehensive dummy data for development

### **User Management**
```javascript
// User object structure
const user = {
  id: 1,
  name: 'John Doe',
  role: 'UI', // UI, BE, QA, DevOps
  email: 'john@company.com',
  designation: 'Software Engineer',
  team: 'Frontend Team'
};
```

### **Story Management**
```javascript
// Story object structure
const story = {
  id: 'EMP-T2001',
  title: 'Story Title',
  description: 'Story description',
  type: 'Task', // Epic, Task, Bug
  assignedTo: ['John Doe', 'Jane Smith'], // Multiple assignees
  priority: 'High', // Critical, High, Medium, Low
  status: 'In Progress', // Pending, In Progress, Completed, Overdue
  deadline: '2024-01-15',
  storyPoints: 5,
  progress: 75,
  acceptanceCriteria: 'Criteria text',
  attachments: []
};
```

## 🔐 Authentication System

### **Demo Authentication**
- **Admin Access**: `root` / `root123`
- **User Access**: `user` / `user123`
- **Session Management**: localStorage-based persistence
- **Route Protection**: Authentication guards for protected routes

### **Authentication Flow**
1. User clicks Login CTA (modal or page)
2. Credentials validated against demo accounts
3. User object stored in localStorage
4. Redirect to dashboard
5. Protected routes check authentication status

## 🎯 Key Features Implementation

### **Multiple Assignee System**
- Stories support array of assignees
- Role badges display for each assignee (UI, BE, QA, DevOps)
- Visual role identification in assignment UI
- Backward compatibility with single assignee stories

### **Dark Theme Implementation**
- Consistent color palette across all components
- Golden accent color (#ffc44d) for primary actions
- Proper contrast ratios for accessibility
- Dark variants for all UI components

### **Modal-First Approach**
- Login as modal instead of separate page
- Contact form as modal for lead capture
- Success confirmations as modals
- Consistent modal base component

### **Chart Integration**
- Recharts library for data visualization
- Custom dark theme styling
- Interactive elements with hover states
- Team performance and task distribution charts

## 🚀 Performance Considerations

### **Code Splitting**
- Component-based architecture enables easy code splitting
- Modal components loaded on demand
- Chart components separated for optimal loading

### **State Optimization**
- Local state management for form handling
- Minimal re-renders with proper dependency arrays
- Efficient data structures for large datasets

## 🔧 Development Workflow

### **Component Development**
1. Create base component with dark theme styling
2. Add proper TypeScript-like prop validation
3. Implement consistent error handling
4. Add hover and focus states
5. Test with various data scenarios

### **Styling Guidelines**
- Use Tailwind CSS utility classes
- Follow established color patterns
- Implement consistent spacing (4, 6, 8 unit scale)
- Ensure proper contrast ratios
- Test in both light and dark environments

### **Testing Approach**
- Manual testing with demo data
- Cross-browser compatibility testing
- Responsive design testing
- Accessibility testing with screen readers

## 📱 Responsive Design

### **Breakpoint Strategy**
- Mobile-first approach
- Tailwind CSS breakpoints: sm, md, lg, xl
- Flexible grid systems for different screen sizes
- Touch-friendly interface elements

### **Component Responsiveness**
- Tables with horizontal scroll on mobile
- Modal sizing adapts to screen size
- Chart components scale appropriately
- Navigation collapses on smaller screens

## 🔮 Future Enhancements

### **Technical Improvements**
- TypeScript migration for better type safety
- State management library (Redux/Zustand) for complex state
- Real-time updates with WebSocket integration
- Progressive Web App (PWA) capabilities

### **Feature Enhancements**
- Advanced filtering and search
- Drag-and-drop task management
- Real-time collaboration features
- Advanced analytics and reporting
- Custom theme configuration

## 📋 Deployment Considerations

### **Build Optimization**
- Production build with minification
- Asset optimization and compression
- Environment-specific configurations
- CDN integration for static assets

### **Environment Setup**
- Development, staging, and production environments
- Environment variable management
- API endpoint configuration
- Authentication service integration

This technical documentation provides a comprehensive overview of TaskHive's architecture, design patterns, and implementation details for developers working on the project.