import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const PlayerContext = createContext({});

export const usePlayers = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayers must be used within a PlayerProvider');
  }
  return context;
};

export const PlayerProvider = ({ children }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userTenant } = useAuth();

  const fetchPlayers = async () => {
    if (!userTenant?.schema_name) {
      console.log("No tenant schema available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`Fetching players from ${userTenant.schema_name}.players`);
      
      const { data, error } = await supabase
        .from(`${userTenant.schema_name}.players`)
        .select('*')
        .order('last_name', { ascending: true });
      
      if (error) {
        console.error("Error fetching players:", error);
        setError(error.message);
        toast.error(`Failed to load players: ${error.message}`);
      } else {
        console.log("Players loaded:", data.length);
        setPlayers(data || []);
        setError(null);
      }
    } catch (err) {
      console.error("Unexpected error fetching players:", err);
      setError(err.message);
      toast.error(`An error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userTenant?.schema_name) {
      fetchPlayers();
    }
  }, [userTenant]);

  const createPlayer = async (playerData) => {
    if (!userTenant?.schema_name) {
      toast.error("No tenant schema available");
      return { error: new Error("No tenant schema available") };
    }

    try {
      const { data, error } = await supabase
        .from(`${userTenant.schema_name}.players`)
        .insert(playerData)
        .select();
      
      if (error) {
        console.error("Error creating player:", error);
        toast.error(`Failed to create player: ${error.message}`);
        return { error };
      }
      
      toast.success("Player created successfully");
      fetchPlayers(); // Refresh the list
      return { data };
    } catch (err) {
      console.error("Unexpected error creating player:", err);
      toast.error(`An error occurred: ${err.message}`);
      return { error: err };
    }
  };

  const updatePlayer = async (playerId, updates) => {
    if (!userTenant?.schema_name) {
      toast.error("No tenant schema available");
      return { error: new Error("No tenant schema available") };
    }

    try {
      const { data, error } = await supabase
        .from(`${userTenant.schema_name}.players`)
        .update(updates)
        .eq('id', playerId)
        .select();
      
      if (error) {
        console.error("Error updating player:", error);
        toast.error(`Failed to update player: ${error.message}`);
        return { error };
      }
      
      toast.success("Player updated successfully");
      fetchPlayers(); // Refresh the list
      return { data };
    } catch (err) {
      console.error("Unexpected error updating player:", err);
      toast.error(`An error occurred: ${err.message}`);
      return { error: err };
    }
  };

  const deletePlayer = async (playerId) => {
    if (!userTenant?.schema_name) {
      toast.error("No tenant schema available");
      return { error: new Error("No tenant schema available") };
    }

    try {
      const { error } = await supabase
        .from(`${userTenant.schema_name}.players`)
        .delete()
        .eq('id', playerId);
      
      if (error) {
        console.error("Error deleting player:", error);
        toast.error(`Failed to delete player: ${error.message}`);
        return { error };
      }
      
      toast.success("Player deleted successfully");
      setPlayers(players.filter(player => player.id !== playerId));
      return { success: true };
    } catch (err) {
      console.error("Unexpected error deleting player:", err);
      toast.error(`An error occurred: ${err.message}`);
      return { error: err };
    }
  };

  const getPlayerById = (playerId) => {
    return players.find(player => player.id === playerId) || null;
  };

  const value = {
    players,
    loading,
    error,
    fetchPlayers,
    createPlayer,
    updatePlayer,
    deletePlayer,
    getPlayerById,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};