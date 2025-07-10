import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, isFuture, isPast, isToday } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useTrainings } from '../contexts/TrainingContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const { FiPlus, FiCalendar, FiSearch, FiFilter, FiUsers, FiClock } = FiIcons;

const TrainingForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Add New Training Session
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <SafeIcon icon={FiIcons.FiX} className="text-xl" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add notes about this training session..."
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <SafeIcon icon={FiIcons.FiSave} />
            <span>Create Training</span>
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

const Trainings = () => {
  const navigate = useNavigate();
  const { trainings, loading, createTraining } = useTrainings();
  const { userTenant } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past', 'today'

  // Check if user has permission to create trainings
  const canCreateTrainings = userTenant?.role === 'tenantadmin' || userTenant?.role === 'trainer';

  const filteredTrainings = trainings
    .filter(training => {
      // Apply date filter
      const trainingDate = new Date(training.date);
      
      switch (filter) {
        case 'upcoming':
          return isFuture(trainingDate);
        case 'past':
          return isPast(trainingDate) && !isToday(trainingDate);
        case 'today':
          return isToday(trainingDate);
        default:
          return true;
      }
    })
    .filter(training => {
      // Apply search
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        training.notes?.toLowerCase().includes(searchLower) ||
        training.date?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleCreateTraining = async (trainingData) => {
    try {
      const { error } = await createTraining(trainingData);
      if (error) {
        toast.error(`Failed to create training: ${error.message}`);
      } else {
        setShowForm(false);
      }
    } catch (error) {
      console.error("Error creating training:", error);
      toast.error("An error occurred while creating the training");
    }
  };

  const handleTrainingClick = (trainingId) => {
    navigate(`/trainings/${trainingId}`);
  };

  if (showForm) {
    return (
      <TrainingForm 
        onSubmit={handleCreateTraining}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Sessions</h1>
          <p className="text-gray-600 mt-1">
            Manage training sessions and player attendance
          </p>
        </div>
        {canCreateTrainings && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <SafeIcon icon={FiPlus} />
            <span>Add Training</span>
          </motion.button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <SafeIcon icon={FiSearch} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search trainings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <SafeIcon icon={FiFilter} className="absolute left-3 top-3 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Trainings</option>
            <option value="upcoming">Upcoming</option>
            <option value="today">Today</option>
            <option value="past">Past</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrainings.map((training) => {
            const trainingDate = new Date(training.date);
            const isUpcoming = isFuture(trainingDate);
            const isPastSession = isPast(trainingDate) && !isToday(trainingDate);
            const isTodaySession = isToday(trainingDate);
            
            let statusClass = '';
            if (isUpcoming) statusClass = 'border-blue-200 bg-blue-50';
            else if (isTodaySession) statusClass = 'border-green-200 bg-green-50';
            else if (isPastSession) statusClass = 'border-gray-200 bg-gray-50';
            
            return (
              <motion.div
                key={training.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTrainingClick(training.id)}
                className={`rounded-xl p-6 border cursor-pointer hover:shadow-md transition-shadow ${statusClass}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                      <SafeIcon icon={FiCalendar} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {format(new Date(training.date), 'MMMM d, yyyy')}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {isUpcoming ? 'Upcoming' : isTodaySession ? 'Today' : 'Past training'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    {isUpcoming && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Upcoming
                      </span>
                    )}
                    {isTodaySession && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Today
                      </span>
                    )}
                    {isPastSession && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                </div>
                
                {training.notes && (
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">{training.notes}</p>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <SafeIcon icon={FiUsers} className="mr-1 text-gray-400" />
                    <span>Players: 0</span>
                  </div>
                  <div className="flex items-center">
                    <SafeIcon icon={FiClock} className="mr-1 text-gray-400" />
                    <span>{format(new Date(training.created_at), 'MMM d')}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && filteredTrainings.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <SafeIcon icon={FiCalendar} className="text-gray-400 text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trainings found</h3>
          <p className="text-gray-600">
            {searchTerm || filter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : canCreateTrainings
                ? 'Get started by adding your first training session.'
                : 'No training sessions have been scheduled yet.'}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default Trainings;