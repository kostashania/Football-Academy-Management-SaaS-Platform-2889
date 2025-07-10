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

// Rest of the component implementation...