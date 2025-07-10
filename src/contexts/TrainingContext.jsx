import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const TrainingContext = createContext({});

export const useTrainings = () => {
  const context = useContext(TrainingContext);
  if (!context) {
    throw new Error('useTrainings must be used within a TrainingProvider');
  }
  return context;
};

export const TrainingProvider = ({ children }) => {
  const [trainings, setTrainings] = useState([]);
  const [characteristics, setCharacteristics] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userTenant } = useAuth();

  useEffect(() => {
    if (userTenant) {
      fetchTrainings();
      fetchCharacteristics();
    }
  }, [userTenant]);

  const fetchTrainings = async () => {
    if (!userTenant?.schema_name) {
      console.log("No tenant schema available");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Use sample data for now
      const sampleTrainings = [
        {
          id: '1',
          date: '2023-12-15',
          notes: 'Technical skills training focusing on passing and ball control',
          created_at: '2023-12-10T10:00:00Z',
          updated_at: '2023-12-10T10:00:00Z'
        },
        {
          id: '2',
          date: '2023-12-20',
          notes: 'Tactical session with emphasis on defensive positioning',
          created_at: '2023-12-15T10:00:00Z',
          updated_at: '2023-12-15T10:00:00Z'
        },
        {
          id: '3',
          date: '2023-12-22',
          notes: 'Physical conditioning and speed drills',
          created_at: '2023-12-18T10:00:00Z',
          updated_at: '2023-12-18T10:00:00Z'
        }
      ];
      
      setTrainings(sampleTrainings);
    } catch (error) {
      console.error('Error fetching trainings:', error);
      toast.error('Failed to load trainings');
    } finally {
      setLoading(false);
    }
  };

  const fetchCharacteristics = async () => {
    if (!userTenant?.schema_name) return;

    try {
      // Sample characteristics
      const sampleCharacteristics = [
        { id: '1', name: 'Passing', description: 'Ability to pass accurately' },
        { id: '2', name: 'Shooting', description: 'Shooting technique and accuracy' },
        { id: '3', name: 'Dribbling', description: 'Ball control while dribbling' },
        { id: '4', name: 'Positioning', description: 'Tactical awareness and positioning' },
        { id: '5', name: 'Physical', description: 'Strength, speed, and stamina' }
      ];
      
      setCharacteristics(sampleCharacteristics);
    } catch (error) {
      console.error('Error fetching characteristics:', error);
    }
  };

  // Other functions for training management

  return (
    <TrainingContext.Provider value={{
      trainings,
      characteristics,
      loading,
      fetchTrainings,
      fetchCharacteristics
      // Add other functions here
    }}>
      {children}
    </TrainingContext.Provider>
  );
};

export default TrainingProvider;