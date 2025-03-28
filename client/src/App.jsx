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
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />

      <Route path="/" element={<Home />}>
        <Route index element={<Home />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:userId" element={<Profile />} />
        <Route path="chat" element={<Chat />} />
        <Route path="chat/:roomId" element={<Chat />} />
        <Route path="languages" element={<LanguageSettings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
