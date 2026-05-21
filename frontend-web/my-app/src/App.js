import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './components/contexts/AuthContext';
import { UserProvider } from './components/contexts/UserContext';
import { GroupProvider } from './components/contexts/GroupsContext';
import { PostsProvider } from './components/contexts/PostsContext';
import { ChatProvider } from './components/contexts/ChatContext'
import Navbar from './components/Layout/Navbar';
import HomePage from './components/pages/HomePage';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import DashboardPage from './components/pages/DashboardPage';
import GroupDashboardPage from './components/Groups/GroupDashboardPage';
import GroupsPage from './components/pages/GroupsPage';
import UserProfilePage from './components/pages/UserProfilePage';
import GroupDetails from './components/Groups/GroupDetails';
import JoinRequestsPage from './components/Groups/JoinRequestsPage';
import GroupAdminSettings from './components/Groups/GroupAdminSettings';
import PostDetails from './components/Posts/PostDetails';
import ChatPage from './components/pages/ChatPage';
import ChangePasswordPage from './components/pages/ChangePasswordPage';
import SettingsPage from './components/pages/SettingsPage';
import VerifyEmail from './components/Auth/VerifyEmail';
import ForgotPasswordPage from './components/pages/ForgotPasswordPage';
import ResetPasswordPage from './components/pages/ResetPasswordPage';
import EditPost from './components/Posts/EditPost';
import CreatePostPage from './components/Posts/CreatePostForm';

import AdminUsersPage from './components/Users/AdminUsersPage';

import StudyRoomPage from './components/pages/StudyRoomPage';
import 'react-toastify/dist/ReactToastify.css';

import { useTranslation } from 'react-i18next';
import './i18n';
import React, { useEffect } from 'react';

function AppContent() {
    const { loading, isAuthenticated, user } = useAuth();

    const { i18n } = useTranslation();
    const currentLang = i18n.language;

    useEffect(() => {
        document.body.dir = currentLang === 'he' ? 'rtl' : 'ltr';
    }, [currentLang]);

    const ProtectedRoute = ({ children, roles }) => {
        if (loading) {
            return <p>Loading authentication...</p>;
        }
        if (!isAuthenticated) {
            return <Navigate to="/login" replace />;
        }
        if (roles && roles.length > 0 && (!user || !user.role || !roles.includes(user.role))) {
            return <Navigate to="/dashboard" replace />;
        }

        return children;
    };

    return (
        <>
            <Navbar />
            <div className="main-content">
                {loading ? (
                    <p>Loading application...</p>
                ) : (
                    <Routes>
                         {/* Public Routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/verify-email/:token" element={<VerifyEmail />} />

                        {/* Public Profile & Posts*/}
                        <Route path="/profile/:userId" element={<UserProfilePage />} />
                        <Route path="/posts/:postId" element={<PostDetails />} />

                        {/* Protected Routes */}
                        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                        <Route path="/settings/password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
                        <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
                        <Route path="/groups/:groupId/dashboard" element={<ProtectedRoute><GroupDashboardPage /></ProtectedRoute>} />
                        <Route path="/groups/:groupId" element={<ProtectedRoute><GroupDetails /></ProtectedRoute>} />
                        <Route path="/groups/:groupId/create-post" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
                        <Route path="/edit-post/:postId" element={<ProtectedRoute><EditPost /></ProtectedRoute>} />
                        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

                        {/* Group Admin Specific Routes */}
                        <Route path="/groups/:groupId/requests" element={<ProtectedRoute><JoinRequestsPage /></ProtectedRoute>} />
                        <Route
                            path="/groups/:groupId/settings"
                            element={<ProtectedRoute><GroupAdminSettings /></ProtectedRoute>}
                        />

                        {/* Admin-Specific Protected Route */}
                        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>}/>

                        <Route 
                            path="/study-room/:roomName" 
                            element={isAuthenticated ? <StudyRoomPage /> : <Navigate to="/login" />} 
                            />
                    </Routes>
                )}
            </div>
            <ToastContainer />
        </>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <UserProvider>
                    <GroupProvider>
                        <PostsProvider>
                            <ChatProvider>
                                <AppContent />
                            </ChatProvider>
                        </PostsProvider>
                    </GroupProvider>
                </UserProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;