import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { TrainingProvider } from './contexts/TrainingContext';
import { MatchProvider } from './contexts/MatchContext';

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

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" /> : <LoginForm />} 
      />
      
      <Route path="/*" element={
        <ProtectedRoute>
          <PlayerProvider>
            <TrainingProvider>
              <MatchProvider>
                <MainLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/players" element={<Players />} />
                    <Route path="/players/:id" element={<PlayerProfile />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/trainings" element={<Trainings />} />
                    <Route path="/trainings/:id" element={<TrainingDetails />} />
                    <Route path="/matches" element={<Matches />} />
                    <Route path="/matches/:id" element={<MatchDetails />} />
                    {/* Add more routes as needed */}
                  </Routes>
                </MainLayout>
              </MatchProvider>
            </TrainingProvider>
          </PlayerProvider>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <Toaster 
            position="top-right" 
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }} 
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;