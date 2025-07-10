import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PlayerProvider from './contexts/PlayerContext';
import TrainingProvider from './contexts/TrainingContext';
import MatchProvider from './contexts/MatchContext';
import MainLayout from './components/Layout/MainLayout';
import LoginForm from './components/Auth/LoginForm';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import Users from './pages/Users';
import Trainings from './pages/Trainings';
import Matches from './pages/Matches';
import TrainingDetails from './pages/TrainingDetails';
import MatchDetails from './pages/MatchDetails';
import PlayerProfile from './pages/PlayerProfile';
import './App.css';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="spinner"></div>
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <PlayerProvider>
          <TrainingProvider>
            <MatchProvider>
              <Toaster position="top-right" />
              <Routes>
                <Route path="/login" element={<LoginForm />} />
                
                <Route path="/" element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="players" element={<Players />} />
                  <Route path="players/:id" element={<PlayerProfile />} />
                  <Route path="trainings" element={<Trainings />} />
                  <Route path="trainings/:id" element={<TrainingDetails />} />
                  <Route path="matches" element={<Matches />} />
                  <Route path="matches/:id" element={<MatchDetails />} />
                  <Route path="users" element={<Users />} />
                </Route>
                
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </MatchProvider>
          </TrainingProvider>
        </PlayerProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;