import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
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
  const [error, setError] = useState(null);
  const { userTenant, user } = useAuth();

  const fetchMatches = async () => {
    if (!userTenant?.schema_name) {
      console.log("No tenant schema available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`Fetching matches from ${userTenant.schema_name}.matches`);
      
      const { data, error } = await supabase
        .from(`${userTenant.schema_name}.matches`)
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error("Error fetching matches:", error);
        setError(error.message);
        toast.error(`Failed to load matches: ${error.message}`);
      } else {
        console.log("Matches loaded:", data.length);
        setMatches(data || []);
        setError(null);
      }
    } catch (err) {
      console.error("Unexpected error fetching matches:", err);
      setError(err.message);
      toast.error(`An error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userTenant?.schema_name) {
      fetchMatches();
    }
  }, [userTenant]);

  const createMatch = async (matchData) => {
    if (!userTenant?.schema_name || !user) {
      toast.error("Authentication required");
      return { error: new Error("Authentication required") };
    }

    try {
      const { data, error } = await supabase
        .from(`${userTenant.schema_name}.matches`)
        .insert({
          ...matchData,
          created_by: user.id
        })
        .select();
      
      if (error) {
        console.error("Error creating match:", error);
        toast.error(`Failed to create match: ${error.message}`);
        return { error };
      }
      
      toast.success("Match created successfully");
      fetchMatches(); // Refresh the list
      return { data };
    } catch (err) {
      console.error("Unexpected error creating match:", err);
      toast.error(`An error occurred: ${err.message}`);
      return { error: err };
    }
  };

  const updateMatch = async (matchId, updates) => {
    if (!userTenant?.schema_name) {
      toast.error("No tenant schema available");
      return { error: new Error("No tenant schema available") };
    }

    try {
      const { data, error } = await supabase
        .from(`${userTenant.schema_name}.matches`)
        .update(updates)
        .eq('id', matchId)
        .select();
      
      if (error) {
        console.error("Error updating match:", error);
        toast.error(`Failed to update match: ${error.message}`);
        return { error };
      }
      
      toast.success("Match updated successfully");
      fetchMatches(); // Refresh the list
      return { data };
    } catch (err) {
      console.error("Unexpected error updating match:", err);
      toast.error(`An error occurred: ${err.message}`);
      return { error: err };
    }
  };

  const deleteMatch = async (matchId) => {
    if (!userTenant?.schema_name) {
      toast.error("No tenant schema available");
      return { error: new Error("No tenant schema available") };
    }

    try {
      const { error } = await supabase
        .from(`${userTenant.schema_name}.matches`)
        .delete()
        .eq('id', matchId);
      
      if (error) {
        console.error("Error deleting match:", error);
        toast.error(`Failed to delete match: ${error.message}`);
        return { error };
      }
      
      toast.success("Match deleted successfully");
      setMatches(matches.filter(match => match.id !== matchId));
      return { success: true };
    } catch (err) {
      console.error("Unexpected error deleting match:", err);
      toast.error(`An error occurred: ${err.message}`);
      return { error: err };
    }
  };

  const updateMatchStats = async (matchId, playerId, statsData) => {
    if (!userTenant?.schema_name) {
      toast.error("No tenant schema available");
      return { error: new Error("No tenant schema available") };
    }

    try {
      const { data, error } = await supabase
        .from(`${userTenant.schema_name}.match_stats`)
        .upsert({
          match_id: matchId,
          player_id: playerId,
          ...statsData
        })
        .select();
      
      if (error) {
        console.error("Error updating match stats:", error);
        toast.error(`Failed to update match stats: ${error.message}`);
        return { error };
      }
      
      toast.success("Match stats updated successfully");
      return { data };
    } catch (err) {
      console.error("Unexpected error updating match stats:", err);
      toast.error(`An error occurred: ${err.message}`);
      return { error: err };
    }
  };

  const getMatchStats = async (matchId) => {
    if (!userTenant?.schema_name) {
      console.log("No tenant schema available");
      return { data: [], error: new Error("No tenant schema available") };
    }

    try {
      const { data, error } = await supabase
        .from(`${userTenant.schema_name}.match_stats`)
        .select(`
          *,
          player:player_id(id, first_name, last_name),
          position:position_id(id, name, short_code)
        `)
        .eq('match_id', matchId);
      
      if (error) {
        console.error("Error fetching match stats:", error);
        return { error };
      }
      
      return { data };
    } catch (err) {
      console.error("Unexpected error fetching match stats:", err);
      return { error: err };
    }
  };

  const value = {
    matches,
    loading,
    error,
    fetchMatches,
    createMatch,
    updateMatch,
    deleteMatch,
    updateMatchStats,
    getMatchStats
  };

  return (
    <MatchContext.Provider value={value}>
      {children}
    </MatchContext.Provider>
  );
};