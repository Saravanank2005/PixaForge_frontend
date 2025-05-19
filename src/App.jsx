import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import Toast from './components/common/Toast';
import ScrollProgress from './components/common/ScrollProgress';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/auth/PrivateRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import MessageList from './components/messages/MessageList';
import Conversation from './components/messages/Conversation';
import Profile from './components/profile/Profile';
import ProfileSettings from './components/profile/ProfileSettings';
import ProjectList from './components/projects/ProjectList';
import ProjectDetails from './components/projects/ProjectDetails';
import CreateProject from './components/projects/CreateProject';
import DesignerList from './components/designers/DesignerList';
import DesignerProfile from './components/designers/DesignerProfile';
import NotFound from './components/common/NotFound';
import LandingPage from './components/landing/LandingPage';
import Help from './components/help/Help';
import NotificationList from './components/notifications/NotificationList';

// Import CSS
import './styles/animations.css';
import './styles/fileComponents.css';
import './styles/sidebar.css';
import './styles/navbar.css';
import './styles/theme.css';
import './styles/enhanced-ui.css';
import './styles/landing.css';
import './App.css';

// Create router with future flags
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

function App() {
  return (
    <Router {...router}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <SocketProvider>
              <NotificationProvider>
                <ScrollProgress />
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
                    <Route index element={<Dashboard />} />
                    <Route path="messages" element={<MessageList />} />
                    <Route path="messages/:userId" element={<Conversation />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="profilesettings" element={<ProfileSettings />} />
                    <Route path="projects/create" element={<CreateProject />} />
                    <Route path="projects/:projectId" element={<ProjectDetails />} />
                    <Route path="projects" element={<ProjectList />} />
                    <Route path="designers/:designerId" element={<DesignerProfile />} />
                    <Route path="designers" element={<DesignerList />} />
                    <Route path="help" element={<Help />} />
                    <Route path="notifications" element={<NotificationList />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </NotificationProvider>
            </SocketProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
