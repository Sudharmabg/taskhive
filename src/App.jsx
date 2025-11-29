import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/auth/HomePage';
import LoginPage from './pages/auth/LoginPage';
import PasswordSetupPage from './pages/auth/PasswordSetupPage';
import Dashboard from './pages/dashboard/Dashboard';
import TaskManagement from './pages/stories/TaskManagement';
import StoryManagement from './pages/stories/StoryManagement';
import EpicManagement from './pages/stories/EpicManagement';
import BugManagement from './pages/stories/BugManagement';
import StoryDetailPage from './pages/stories/StoryDetailPage';
import TeamManagement from './pages/teams/TeamManagement';
import SprintManagement from './pages/sprints/SprintManagement';
import SprintDetailPage from './pages/sprints/SprintDetailPage';
import Analytics from './pages/analytics/Analytics';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';

// Admin route checker
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role === 'admin' ? children : <Navigate to="/app/dashboard" />;
};

/**
 * Main App component with routing configuration
 * Handles authentication state and route protection
 */
function App() {
  // TODO: Replace with actual auth state management
  const [isAuthenticated, setIsAuthenticated] = React.useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });



  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={<HomePage />} 
          />
          <Route 
            path="/login" 
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/app/dashboard" />} 
          />
          <Route 
            path="/setup-password" 
            element={<PasswordSetupPage />} 
          />
          <Route 
            path="/dashboard" 
            element={<Navigate to="/app/dashboard" />} 
          />
          <Route 
            path="/app" 
            element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
          >
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tasks" element={<TaskManagement />} />
            <Route path="tasks/:storyId" element={<StoryDetailPage />} />
            <Route path="stories" element={<StoryManagement />} />
            <Route path="stories/:storyId" element={<StoryDetailPage />} />
            <Route path="epics" element={<EpicManagement />} />
            <Route path="epics/:storyId" element={<StoryDetailPage />} />
            <Route path="bugs" element={<BugManagement />} />
            <Route path="bugs/:storyId" element={<StoryDetailPage />} />
            <Route path="teams" element={<AdminRoute><TeamManagement /></AdminRoute>} />
            <Route path="current-sprint" element={<SprintDetailPage />} />
            <Route path="sprints" element={<AdminRoute><SprintManagement /></AdminRoute>} />
            <Route path="sprints/:sprintId" element={<AdminRoute><SprintDetailPage /></AdminRoute>} />
            <Route path="analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
          </Route>
        </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;