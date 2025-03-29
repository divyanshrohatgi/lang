import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import LanguageSettings from './pages/LanguageSettings';
import NotFound from './pages/NotFound';
import VoiceRooms from './pages/VoiceRooms';
import VoiceRoom from './pages/VoiceRoom';
import Connections from './pages/Connections';
import UserRecommendations from './pages/UserRecommendations';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

const App = () => {
  const { user, loading, checkAuth } = useAuth();
  const { connect } = useSocket();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      connect();
    }
  }, [user, connect]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />

      {/* Protected routes wrapped in Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:userId" element={<Profile />} />

        {/* Chat and voice room routes */}
        <Route path="voice-rooms" element={<VoiceRooms />} />
        <Route path="voice-rooms/:roomId" element={<VoiceRoom />} />
        <Route path="chat" element={<Chat />} />
        <Route path="chat/:roomId" element={<Chat />} />

        {/* Language-related routes */}
        <Route path="languages" element={<LanguageSettings />} />

        {/* User connections and recommendations */}
        <Route path="connections" element={<Connections />} />
        <Route path="recommendations" element={<UserRecommendations />} />
      </Route>

      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
