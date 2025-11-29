# TaskHive - Smart Task & Productivity Manager

A comprehensive React-based task management application with advanced team collaboration features, story management, and enterprise-grade functionality.

## 🚀 Key Features

### **Authentication & Security**
- **Secure Login System**: Username/password authentication with session management
- **Demo Credentials**: `root` / `root123` for testing
- **Auto-redirect**: Seamless navigation between authenticated and public areas
- **Session Persistence**: Login state maintained across browser sessions

### **Landing Page & Marketing**
- **Professional Homepage**: Modern landing page with feature highlights
- **Pricing Section**: Transparent pricing in Indian Rupees (₹299-₹1,999/month)
- **Success Stories**: Real impact metrics and customer testimonials
- **Responsive Design**: Mobile-first, fully responsive interface

### **Dashboard & Analytics**
- **Dark Theme Dashboard**: Real-time statistics with golden accent colors
- **Interactive Charts**: Pie charts for task distribution, bar charts for team performance
- **Quick Actions**: Golden CTA buttons for common tasks
- **Recent Stories Table**: Dark-themed table with priority-color-coded stories
- **Team Performance**: Visual charts showing task distribution across teams

### **Advanced Story Management**
- **Story Types**: Epic, Task, Bug with specialized management pages
- **Unique Story IDs**: Company-prefixed IDs (EMP-E1001, EMP-T2001, EMP-B3001)
- **Direct URL Access**: Shareable links to individual stories
- **Priority System**: Color-coded priorities (Critical=Red, High=Orange, Medium=Yellow, Low=Green)
- **Status Tracking**: Pending, In Progress, Completed, Overdue with visual indicators

### **Comprehensive Story Features**
- **Rich Story Details**: Title, description, acceptance criteria, attachments
- **File Management**: Multi-file upload with size display and removal
- **Story Points**: Agile estimation support
- **Progress Tracking**: Visual progress bars and completion percentages
- **Assignment System**: Team member assignment with user management

### **Team & User Management**
- **Team Creation**: Organize users into functional teams
- **Member Management**: Add team members with employee details
- **Employee Profiles**: ID, name, email, designation, team assignment
- **Team Analytics**: Performance metrics per team

### **User Experience & Interface**
- **TH Logo Branding**: Custom gradient logo throughout application
- **Priority Legend**: Visual guide for color-coded priorities
- **Modal System**: Escape key and click-outside-to-close functionality
- **Keyboard Navigation**: Full keyboard accessibility support
- **Profile Dropdown**: Clean user menu with logout functionality

## 🛠 Tech Stack

- **Frontend**: React 18, React Router v6
- **Styling**: Tailwind CSS with custom components
- **Icons**: Heroicons for consistent iconography
- **State Management**: React Hooks (useState, useEffect)
- **File Handling**: Native File API for attachments
- **Routing**: Protected routes with authentication guards

## 📁 Enhanced Project Structure

```
src/
├── components/
│   ├── common/              # Reusable UI components
│   │   ├── Button.jsx       # Multi-variant button component
│   │   ├── Input.jsx        # Form input with validation
│   │   ├── Logo.jsx         # TH branded logo component
│   │   ├── Modal.jsx        # Enhanced modal with keyboard support
│   │   ├── StatsCard.jsx    # Interactive statistics cards
│   │   ├── TaskSummaryTable.jsx # Advanced story table with actions
│   │   └── TeamCard.jsx     # Team information cards
│   ├── layout/              # Layout components
│   │   ├── Layout.jsx       # Main authenticated layout
│   │   ├── Sidebar.jsx      # Navigation with TH logo
│   │   └── Topbar.jsx       # Header with search and profile dropdown
│   └── modals/              # Modal components
│       ├── AddStoryModal.jsx     # Universal story creation/editing
│       ├── AddTeamModal.jsx      # Team management modal
│       ├── AddTeamMemberModal.jsx # Employee onboarding
│       └── TaskDetailsModal.jsx   # Comprehensive story viewer
├── pages/                   # Page components
│   ├── HomePage.jsx         # Marketing landing page
│   ├── LoginPage.jsx        # Authentication interface
│   ├── Dashboard.jsx        # Executive dashboard
│   ├── TaskManagement.jsx   # Task-specific story management
│   ├── EpicManagement.jsx   # Epic-specific story management
│   ├── BugManagement.jsx    # Bug-specific story management
│   ├── StoryManagement.jsx  # Universal story management
│   ├── StoryDetailPage.jsx  # Individual story pages
│   ├── TeamManagement.jsx   # Team and member management
│   └── Analytics.jsx        # Metrics and reporting
├── utils/                   # Utility functions
│   └── storyUtils.js        # Story ID generation and parsing
├── App.jsx                  # Main app with routing
├── index.js                 # Application entry point
└── index.css               # Global styles
```

## 🎯 Detailed Functionality

### **Story Management System**
- **Multi-Type Support**: Separate pages for Epics, Tasks, and Bugs
- **Universal Story Page**: Manage all story types in one place
- **Advanced Filtering**: Filter by type, status, priority, and search
- **Bulk Operations**: Multi-select and batch actions
- **Story Relationships**: Link related stories and dependencies

### **File & Attachment System**
- **Multi-File Upload**: Drag-and-drop or click to upload
- **File Type Validation**: Support for documents, images, and archives
- **File Size Display**: Automatic size calculation and display
- **Download Management**: Direct download links for attachments
- **File Removal**: Easy attachment management

### **Advanced UI Features**
- **Priority Color Coding**: Instant visual priority identification
- **Clickable Story Titles**: Quick access to detailed views
- **Modal Keyboard Support**: ESC to close, tab navigation
- **Responsive Tables**: Mobile-optimized data display
- **Loading States**: Smooth user experience with proper feedback

### **Navigation & Routing**
- **Protected Routes**: Authentication-based access control
- **Direct Story URLs**: Bookmarkable story links
- **Breadcrumb Navigation**: Clear location awareness
- **Back Button Support**: Proper browser history management

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm start
   ```

3. **Access Application**:
   - Open [http://localhost:3000](http://localhost:3000)
   - Use credentials: `root` / `root123`

## 📊 Usage Examples

### **Creating Stories**
1. Navigate to Tasks/Epics/Bugs or Stories page
2. Click "Add [Type] Story" button
3. Fill in story details, upload attachments
4. Set priority, status, and acceptance criteria
5. Assign to team member and set deadline

### **Managing Teams**
1. Go to Team Management page
2. Create teams with "Add Team" button
3. Add members with "Add Member" button
4. Fill employee details and assign to teams

### **Viewing Story Details**
1. Click on any story title in tables
2. View comprehensive story information
3. Edit directly from detail view
4. Download attachments as needed

## 🔧 API Integration Points

### **Ready for Backend Integration**
- **Authentication**: Login/logout with session management
- **Story CRUD**: Create, read, update, delete operations
- **File Upload**: Attachment handling and storage
- **Team Management**: User and team data operations
- **Search & Filter**: Advanced query capabilities
- **Analytics**: Metrics and reporting data

### **Data Models**
- **Stories**: ID, title, description, type, priority, status, assignee, dates
- **Users**: Employee ID, name, email, designation, team
- **Teams**: Name, description, members, statistics
- **Attachments**: File metadata, storage references

## 🎨 Design System

### **Color Palette**
- **Primary**: Golden (#ffc44d) for actions and branding
- **Background**: Dark Gray (#1f2937, #111827) for main backgrounds
- **Cards**: Medium Gray (#374151) for component backgrounds
- **Success**: Green (#22c55e) for completed items
- **Warning**: Yellow (#eab308) for pending items
- **Danger**: Red (#ef4444) for critical/overdue items
- **Text**: White and light gray for readability on dark backgrounds

### **Typography**
- **Headings**: Bold, clear hierarchy
- **Body Text**: Readable, accessible font sizes
- **Labels**: Consistent form labeling
- **Status Indicators**: Color-coded text and badges

## 🚀 Future Enhancements

### **Advanced Features**
- **Real-time Collaboration**: Live updates and notifications
- **Advanced Analytics**: Custom dashboards and reports
- **Integration APIs**: Third-party tool connections
- **Mobile App**: Native iOS/Android applications
- **Workflow Automation**: Custom business rules
- **Advanced Permissions**: Role-based access control

### **Enterprise Features**
- **SSO Integration**: Enterprise authentication
- **Audit Logging**: Complete activity tracking
- **Data Export**: Comprehensive reporting tools
- **Custom Fields**: Configurable story attributes
- **Workflow Templates**: Predefined process templates
- **Advanced Security**: Enhanced data protection

## 📞 Support & Documentation

- **Demo Environment**: Fully functional with sample data
- **User Guide**: Comprehensive feature documentation
- **API Documentation**: Backend integration guide
- **Video Tutorials**: Step-by-step feature walkthroughs
- **Support Portal**: Help desk and knowledge base