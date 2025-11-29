# TaskHive - Enterprise Task Management Platform

> A full-stack enterprise task management solution built with React and Spring Boot, featuring advanced team collaboration, sprint management, and real-time analytics.

## 🚀 Live Demo
**Demo Credentials:** `root` / `root123`

## 🎯 Project Overview

TaskHive is a comprehensive project management platform designed to streamline team collaboration and task tracking. Built with modern technologies and enterprise-grade architecture, it demonstrates proficiency in full-stack development, database design, and scalable system architecture.

## 🛠️ Technical Stack

### Frontend
- **React 18** - Modern component-based architecture
- **React Router v6** - Client-side routing with protected routes
- **Tailwind CSS** - Utility-first styling with custom design system
- **Heroicons** - Consistent iconography
- **Custom Hooks** - Reusable state management logic

### Backend
- **Spring Boot 3** - Enterprise Java framework
- **Spring Security** - Authentication and authorization
- **Spring Data JPA** - Database abstraction layer
- **PostgreSQL** - Relational database with complex relationships
- **Flyway** - Database migration management
- **BCrypt** - Password hashing and security

### Architecture & Patterns
- **RESTful API Design** - Clean, resource-based endpoints
- **Repository Pattern** - Data access abstraction
- **Service Layer Architecture** - Business logic separation
- **DTO Pattern** - Data transfer optimization
- **Role-Based Access Control** - Security implementation

## 🏗️ Key Features Implemented

### 🔐 Authentication & Security
- JWT-based authentication system
- Role-based access control (Admin/User)
- Secure password hashing with BCrypt
- Protected routes and API endpoints

### 📊 Dashboard & Analytics
- Real-time metrics and KPI tracking
- Interactive charts (Pie, Bar, Line)
- Team performance analytics
- Export functionality for reports

### 📋 Advanced Story Management
- Multi-type stories (Epic, Task, Bug)
- Unique ID generation with company prefixes
- Priority and status-based color coding
- File attachment system
- Progress tracking with visual indicators

### 🏃‍♂️ Sprint Management
- Sprint creation and lifecycle management
- Story assignment to sprints
- Sprint analytics and reporting
- Current sprint tracking

### 👥 Team & User Management
- Team creation and member assignment
- Employee profile management
- Team-based analytics
- Multi-assignee support

### 🎨 UI/UX Excellence
- Dark theme with golden accent colors
- Responsive design (mobile-first)
- Modal-based interactions
- Status-based visual indicators
- Keyboard navigation support

## 🏛️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React SPA     │    │  Spring Boot    │    │   PostgreSQL    │
│                 │    │     API         │    │    Database     │
│ • Components    │◄──►│ • Controllers   │◄──►│ • Tables        │
│ • Custom Hooks  │    │ • Services      │    │ • Relationships │
│ • State Mgmt    │    │ • Repositories  │    │ • Constraints   │
│ • Routing       │    │ • Security      │    │ • Indexes       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
taskhive/
├── src/                          # React Frontend
│   ├── components/
│   │   ├── common/              # Reusable UI components
│   │   ├── layout/              # Layout components
│   │   └── modals/              # Modal components
│   ├── pages/                   # Page components
│   ├── hooks/                   # Custom React hooks
│   ├── services/                # API integration
│   └── utils/                   # Utility functions
└── taskhive-backend/            # Spring Boot Backend
    ├── src/main/java/com/taskhive/
    │   ├── controller/          # REST Controllers
    │   ├── service/             # Business Logic
    │   ├── repository/          # Data Access Layer
    │   ├── model/               # JPA Entities
    │   ├── dto/                 # Data Transfer Objects
    │   └── config/              # Configuration Classes
    └── src/main/resources/
        ├── application.properties
        └── db/migration/        # Flyway migrations
```

## 🔧 Technical Highlights

### Database Design
- **Complex Relationships**: One-to-Many, Many-to-Many associations
- **Referential Integrity**: Foreign key constraints and cascading
- **Optimized Queries**: JPA queries with proper indexing
- **Migration Management**: Flyway for version-controlled schema changes

### API Design
- **RESTful Endpoints**: Resource-based URL structure
- **HTTP Status Codes**: Proper response code implementation
- **Error Handling**: Comprehensive exception management
- **CORS Configuration**: Cross-origin resource sharing setup

### Frontend Architecture
- **Component Composition**: Reusable, modular components
- **State Management**: Custom hooks for data fetching
- **Performance Optimization**: Lazy loading and memoization
- **Accessibility**: WCAG compliant interface design

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- Java 17+
- PostgreSQL 12+
- Maven 3.6+

### Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/Sudharmabg/taskhive.git
   cd taskhive
   ```

2. **Setup Database**
   ```sql
   CREATE DATABASE taskhive;
   ```

3. **Backend Setup**
   ```bash
   cd taskhive-backend
   mvn spring-boot:run
   ```

4. **Frontend Setup**
   ```bash
   npm install
   npm start
   ```

5. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Login: `root` / `root123`

## 📈 Performance & Scalability

- **Database Optimization**: Indexed queries and connection pooling
- **Caching Strategy**: Service-level caching for frequent operations
- **Lazy Loading**: Component and data lazy loading
- **Pagination**: Server-side pagination for large datasets
- **Error Boundaries**: Graceful error handling and recovery

## 🔒 Security Implementation

- **Authentication**: JWT token-based authentication
- **Authorization**: Role-based access control
- **Input Validation**: Server-side validation and sanitization
- **SQL Injection Prevention**: Parameterized queries with JPA
- **XSS Protection**: Content Security Policy implementation

## 🧪 Testing & Quality

- **Component Testing**: React Testing Library
- **API Testing**: Postman collection for endpoint testing
- **Code Quality**: ESLint and Prettier configuration
- **Error Handling**: Comprehensive error boundaries

## 🚀 Deployment Ready

- **Environment Configuration**: Separate configs for dev/prod
- **Docker Support**: Containerization ready
- **CI/CD Pipeline**: GitHub Actions workflow
- **Production Optimization**: Build optimization and minification

## 📊 Key Metrics

- **100+ Components**: Modular, reusable React components
- **15+ API Endpoints**: Comprehensive REST API coverage
- **5+ Database Tables**: Normalized relational database design
- **Role-Based Security**: Admin and User role implementation
- **Real-time Analytics**: Live dashboard with interactive charts

## 🎯 Professional Skills Demonstrated

- **Full-Stack Development**: End-to-end application development
- **Database Design**: Complex relational database modeling
- **API Development**: RESTful service architecture
- **Security Implementation**: Authentication and authorization
- **UI/UX Design**: Modern, responsive interface design
- **Code Organization**: Clean architecture and design patterns
- **Version Control**: Git workflow and repository management

---

**Built by:** Sudharma BG  
**License:** MIT