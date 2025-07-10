import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
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
  const [error, setError] = useState(null);
  const { userTenant, user } = useAuth();

  const fetchTrainings = async () => {
    if (!userTenant?.schema_name) {
      console.log("No tenant schema available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`Fetching trainings from ${userTenant.schema_name}.trainings`);
      
      const { data, error } = await supabase
        .from(`${userTenant.schema_name}.trainings`)
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error("Error fetching trainings:", error);
        setError(error.message);
        toast.error(`Failed to load trainings: ${error.message}`);
      } else {
        console.log("Trainings loaded:", data.length);
        setTrainings(data || []);
        setError(null);
      }
    } catch (err) {
      console.error("Unexpected error fetching trainings:", err);
      setError(err.message);
      toast.error(`An error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCharacteristics = async () => {
    if (!userTenant?.schema_name) {
      console.log("No tenant schema available");
      return;
    }

    try {
      console.log(`Fetching characteristics from ${userTenant.schema_name}.training_characteristics`);
      
      const { data, error } = await supabase
        .from(`${userTenant.schema_name}.training_characteristics`)
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error("Error fetching characteristics:", error);
        toast.error(`Failed to load characteristics: ${error.message}`);
      } else {
        console.log("Characteristics loaded:", data.length);
        setCharacteristics(data || []);
      }
    } catch (err) {
      console.error("Unexpected error fetching characteristics:", err);
      toast.error(`An error occurred: ${err.message}`);
    }
  };

  useEffect(() => {
    if (userTenant?.schema_name) {
      fetchTrainings();
      fetchCharacteristics();
    }
  }, [userTenant]);

  const createTraining = async (trainingData) => {
    if (!userTenant?.schema_name || !user) {
      toast.error("Authentication required");
      return { error: new Error("Authentication required") };
    }

    try {
      const { data, error } = await supabase
        .from(`${userTenant.schema_name}.trainings`)
        .insert({
          ...trainingData,
          created_by: user.id
        })
        .select();
      
      if (error) {
        console.error("Error creating training:", error);
        toast.error(`Failed to create training: ${error.message}`);
        return { error };
      }
      
      toast.success("Training created successfully");
      fetchTrainings(); // Refresh the list
      return { data };
    } catch (err) {
      console.error("Unexpected error creating training:", err);
      toast.error(`An error occurred: ${err.message}`);
      return { error: err };
    }
  };

  const updateTraining = async (trainingId, updates) => {
    if (!userTenant?.schema_name) {
      toast.error("No tenant schema available");
      return { error: new Error("No tenant schema available") };
    }

    try {
      const { data, error } = await supabase
        .from(`${userTenant.schema_name}.trainings`)
        .update(updates)
        .eq('id', trainingId)
        .select();
      
      if (error) {
        console.error("Error updating training:", error);
        toast.error(`Failed to update training: ${error.message}`);
        return { error };
      }
      
      toast.success("Training updated successfully");
      fetchTrainings(); // Refresh the list
      return { data };
    } catch (err) {
      console.error("Unexpected error updating training:", err);
      toast.error(`An error occurred: ${err.message}`);
      return { error: err };
    }
  };

  const deleteTraining = async (trainingId) => {
    if (!userTenant?.schema_name) {
      toast.error("No tenant schema available");
      return { error: new Error("No tenant schema available") };
    }

    try {
      const { error } = await supabase
        .from(`${userTenant.schema_name}.trainings`)
        .delete()
        .eq('id', trainingId);
      
      if (error) {
        console.error("Error deleting training:", error);
        toast.error(`Failed to delete training: ${error.message}`);
        return { error };
      }
      
      toast.success("Training deleted successfully");
      setTrainings(trainings.filter(training => training.id !== trainingId));
      return { success: true };
    } catch (err) {
      console.error("Unexpected error deleting training:", err);
      toast.error(`An error occurred: ${err.message}`);
      return { error: err };
    }
  };

  const markAttendance = async (trainingId, playerId, status, notes = '') => {
    if (!userTenant?.schema_name || !user) {
      toast.error("Authentication required");
      return { error: new Error("Authentication required") };
    }

    try {
      const { data, error } = await supabase
        .from(`${userTenant.schema_name}.attendance`)
        .upsert({
          training_id: trainingId,
          player_id: playerId,
          status,
          notes,
          marked_by: user.id
        })
        .select();
      
      if (error) {
        console.error("Error marking attendance:", error);
        toast.error(`Failed to mark attendance: ${error.message}`);
        return { error };
      }
      
      toast.success("Attendance marked successfully");
      return { data };
    } catch (err) {
      console.error("Unexpected error marking attendance:", err);
      toast.error(`An error occurred: ${err.message}`);
      return { error: err };
    }
  };

  const getAttendanceForTraining = async (trainingId) => {
    if (!userTenant?.schema_name) {
      console.log("No tenant schema available");
      return { data: [], error: new Error("No tenant schema available") };
    }

    try {
      const { data, error } = await supabase
        .from(`${userTenant.schema_name}.attendance`)
        .select('*')
        .eq('training_id', trainingId);
      
      if (error) {
        console.error("Error fetching attendance:", error);
        return { error };
      }
      
      return { data };
    } catch (err) {
      console.error("Unexpected error fetching attendance:", err);
      return { error: err };
    }
  };

  const evaluatePlayer = async (trainingId, playerId, characteristicId, score, notes = '') => {
    if (!userTenant?.schema_name) {
      toast.error("No tenant schema available");
      return { error: new Error("No tenant schema available") };
    }

    try {
      const { data, error } = await supabase
        .from(`${userTenant.schema_name}.player_evaluations`)
        .upsert({
          training_id: trainingId,
          player_id: playerId,
          characteristic_id: characteristicId,
          score,
          notes
        })
        .select();
      
      if (error) {
        console.error("Error evaluating player:", error);
        toast.error(`Failed to evaluate player: ${error.message}`);
        return { error };
      }
      
      toast.success("Player evaluated successfully");
      return { data };
    } catch (err) {
      console.error("Unexpected error evaluating player:", err);
      toast.error(`An error occurred: ${err.message}`);
      return { error: err };
    }
  };

  const getPlayerEvaluations = async (trainingId, playerId) => {
    if (!userTenant?.schema_name) {
      console.log("No tenant schema available");
      return { data: [], error: new Error("No tenant schema available") };
    }

    try {
      const { data, error } = await supabase
        .from(`${userTenant.schema_name}.player_evaluations`)
        .select(`
          *,
          characteristics:characteristic_id(id, name)
        `)
        .eq('training_id', trainingId)
        .eq('player_id', playerId);
      
      if (error) {
        console.error("Error fetching player evaluations:", error);
        return { error };
      }
      
      return { data };
    } catch (err) {
      console.error("Unexpected error fetching player evaluations:", err);
      return { error: err };
    }
  };

  const value = {
    trainings,
    characteristics,
    loading,
    error,
    fetchTrainings,
    createTraining,
    updateTraining,
    deleteTraining,
    markAttendance,
    getAttendanceForTraining,
    evaluatePlayer,
    getPlayerEvaluations
  };

  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  );
};