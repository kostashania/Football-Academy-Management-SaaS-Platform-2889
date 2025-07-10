import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const MatchContext = createContext({});

export const useMatches = () => {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatches must be used within a MatchProvider');
  }
  return context;
};

export const MatchProvider = ({ children }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userTenant } = useAuth();

  useEffect(() => {
    if (userTenant) {
      fetchMatches();
    }
  }, [userTenant]);

  const fetchMatches = async () => {
    if (!userTenant?.schema_name) {
      console.log("No tenant schema available");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Use sample data for now
      const sampleMatches = [
        {
          id: '1',
          date: '2023-12-18',
          opponent: 'City FC',
          location: 'Home Stadium',
          score_us: 3,
          score_them: 1,
          notes: 'Great team performance with excellent defensive work',
          created_at: '2023-12-10T10:00:00Z',
          updated_at: '2023-12-19T10:00:00Z'
        },
        {
          id: '2',
          date: '2023-12-25',
          opponent: 'United SC',
          location: 'Away Stadium',
          score_us: 2,
          score_them: 2,
          notes: 'Tough match with a late equalizer',
          created_at: '2023-12-20T10:00:00Z',
          updated_at: '2023-12-26T10:00:00Z'
        },
        {
          id: '3',
          date: '2024-01-05',
          opponent: 'Athletic Club',
          location: 'Home Stadium',
          created_at: '2023-12-28T10:00:00Z',
          updated_at: '2023-12-28T10:00:00Z'
        }
      ];
      
      setMatches(sampleMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  // Other functions for match management

  return (
    <MatchContext.Provider value={{
      matches,
      loading,
      fetchMatches
      // Add other functions here
    }}>
      {children}
    </MatchContext.Provider>
  );
};

export default MatchProvider;