import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useTrainings } from '../contexts/TrainingContext';
import { usePlayers } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const { 
  FiCalendar, FiUsers, FiCheck, FiX, FiAlertTriangle, 
  FiEdit, FiTrash2, FiArrowLeft, FiSave 
} = FiIcons;

const TrainingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trainings, characteristics, markAttendance, getAttendanceForTraining, evaluatePlayer, getPlayerEvaluations, updateTraining, deleteTraining } = useTrainings();
  const { players } = usePlayers();
  const { userTenant } = useAuth();
  
  const [training, setTraining] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editedTraining, setEditedTraining] = useState({ date: '', notes: '' });
  const [loading, setLoading] = useState(true);
  
  // Find if the user has permission to edit/delete
  const isTrainerOrAdmin = userTenant?.role === 'tenantadmin' || userTenant?.role === 'trainer';
  const isTrainingSupervisor = userTenant?.role === 'training_supervisor';
  const canEditAttendance = isTrainerOrAdmin || isTrainingSupervisor;
  const canEditEvaluations = isTrainerOrAdmin;
  
  useEffect(() => {
    const selectedTraining = trainings.find(t => t.id === id);
    if (selectedTraining) {
      setTraining(selectedTraining);
      setEditedTraining({
        date: selectedTraining.date,
        notes: selectedTraining.notes || ''
      });
      fetchAttendanceData(selectedTraining.id);
    }
  }, [id, trainings]);
  
  const fetchAttendanceData = async (trainingId) => {
    setLoading(true);
    try {
      const { data: attendanceData, error: attendanceError } = await getAttendanceForTraining(trainingId);
      
      if (attendanceError) {
        toast.error(`Error loading attendance: ${attendanceError.message}`);
      } else {
        // Create a map of player_id to attendance status
        const attendanceMap = {};
        attendanceData.forEach(item => {
          attendanceMap[item.player_id] = item.status;
        });
        setAttendance(attendanceMap);
        
        // Fetch evaluations for all players who attended
        const evaluationsMap = {};
        for (const playerId of Object.keys(attendanceMap)) {
          if (attendanceMap[playerId] === 'present') {
            const { data: evalData } = await getPlayerEvaluations(trainingId, playerId);
            if (evalData) {
              const playerEvals = {};
              evalData.forEach(evaluation => {
                playerEvals[evaluation.characteristic_id] = evaluation.score;
              });
              evaluationsMap[playerId] = playerEvals;
            }
          }
        }
        setEvaluations(evaluationsMap);
      }
    } catch (error) {
      console.error("Error fetching training details:", error);
      toast.error("Failed to load training details");
    } finally {
      setLoading(false);
    }
  };
  
  const handleAttendanceChange = async (playerId, status) => {
    if (!canEditAttendance) {
      toast.error("You don't have permission to mark attendance");
      return;
    }
    
    try {
      const { error } = await markAttendance(training.id, playerId, status);
      if (error) {
        toast.error(`Failed to mark attendance: ${error.message}`);
      } else {
        // Update local state
        setAttendance(prev => ({
          ...prev,
          [playerId]: status
        }));
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("Failed to mark attendance");
    }
  };
  
  const handleEvaluationChange = async (playerId, characteristicId, score) => {
    if (!canEditEvaluations) {
      toast.error("You don't have permission to evaluate players");
      return;
    }
    
    if (attendance[playerId] !== 'present') {
      toast.error("Can only evaluate players who are present");
      return;
    }
    
    try {
      const { error } = await evaluatePlayer(training.id, playerId, characteristicId, score);
      if (error) {
        toast.error(`Failed to save evaluation: ${error.message}`);
      } else {
        // Update local state
        setEvaluations(prev => ({
          ...prev,
          [playerId]: {
            ...(prev[playerId] || {}),
            [characteristicId]: score
          }
        }));
      }
    } catch (error) {
      console.error("Error saving evaluation:", error);
      toast.error("Failed to save evaluation");
    }
  };
  
  const handleTrainingUpdate = async () => {
    try {
      const { error } = await updateTraining(training.id, editedTraining);
      if (error) {
        toast.error(`Failed to update training: ${error.message}`);
      } else {
        setIsEditing(false);
        // Training list will be refreshed by the context
      }
    } catch (error) {
      console.error("Error updating training:", error);
      toast.error("Failed to update training");
    }
  };
  
  const handleTrainingDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this training? This action cannot be undone.")) {
      return;
    }
    
    try {
      const { error } = await deleteTraining(training.id);
      if (error) {
        toast.error(`Failed to delete training: ${error.message}`);
      } else {
        navigate('/trainings');
      }
    } catch (error) {
      console.error("Error deleting training:", error);
      toast.error("Failed to delete training");
    }
  };
  
  if (loading || !training) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Rest of the component JSX remains the same */}
    </motion.div>
  );
};

export default TrainingDetails;