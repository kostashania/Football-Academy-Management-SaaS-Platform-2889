import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, isFuture, isPast, isToday } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useMatches } from '../contexts/MatchContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const { FiPlus, FiTarget, FiSearch, FiFilter, FiMapPin, FiClock, FiFlag } = FiIcons;

const MatchForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    opponent: '',
    location: '',
    home_away: 'home',
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
          Add New Match
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
            Opponent *
          </label>
          <input
            type="text"
            value={formData.opponent}
            onChange={(e) => handleChange('opponent', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Opponent team name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Match location"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Home/Away
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="home"
                checked={formData.home_away === 'home'}
                onChange={() => handleChange('home_away', 'home')}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">Home</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="away"
                checked={formData.home_away === 'away'}
                onChange={() => handleChange('home_away', 'away')}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">Away</span>
            </label>
          </div>
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
            <span>Create Match</span>
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

const Matches = () => {
  const navigate = useNavigate();
  const { matches, loading, createMatch } = useMatches();
  const { userTenant } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past', 'today'

  // Check if user has permission to create matches
  const canCreateMatches = userTenant?.role === 'tenantadmin' || userTenant?.role === 'trainer';

  const filteredMatches = matches
    .filter(match => {
      // Apply date filter
      const matchDate = new Date(match.date);
      
      switch (filter) {
        case 'upcoming':
          return isFuture(matchDate);
        case 'past':
          return isPast(matchDate) && !isToday(matchDate);
        case 'today':
          return isToday(matchDate);
        default:
          return true;
      }
    })
    .filter(match => {
      // Apply search
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        match.opponent?.toLowerCase().includes(searchLower) ||
        match.location?.toLowerCase().includes(searchLower) ||
        match.date?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleCreateMatch = async (matchData) => {
    try {
      const { error } = await createMatch(matchData);
      if (error) {
        toast.error(`Failed to create match: ${error.message}`);
      } else {
        setShowForm(false);
      }
    } catch (error) {
      console.error("Error creating match:", error);
      toast.error("An error occurred while creating the match");
    }
  };

  const handleMatchClick = (matchId) => {
    navigate(`/matches/${matchId}`);
  };

  if (showForm) {
    return (
      <MatchForm 
        onSubmit={handleCreateMatch}
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
          <h1 className="text-2xl font-bold text-gray-900">Matches</h1>
          <p className="text-gray-600 mt-1">
            Manage matches, lineups and statistics
          </p>
        </div>
        {canCreateMatches && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <SafeIcon icon={FiPlus} />
            <span>Add Match</span>
          </motion.button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <SafeIcon icon={FiSearch} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search matches..."
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
            <option value="all">All Matches</option>
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
          {filteredMatches.map((match) => {
            const matchDate = new Date(match.date);
            const isUpcoming = isFuture(matchDate);
            const isPastMatch = isPast(matchDate) && !isToday(matchDate);
            const isTodayMatch = isToday(matchDate);
            
            let statusClass = '';
            if (isUpcoming) statusClass = 'border-blue-200 bg-blue-50';
            else if (isTodayMatch) statusClass = 'border-green-200 bg-green-50';
            else if (isPastMatch) statusClass = 'border-gray-200 bg-gray-50';
            
            return (
              <motion.div
                key={match.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMatchClick(match.id)}
                className={`rounded-xl p-6 border cursor-pointer hover:shadow-md transition-shadow ${statusClass}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                      <SafeIcon icon={FiTarget} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        vs {match.opponent}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {format(new Date(match.date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    {match.home_away && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        match.home_away === 'home' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {match.home_away === 'home' ? 'Home' : 'Away'}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Match score if available */}
                {(match.score_us !== null && match.score_them !== null) && (
                  <div className="flex justify-center items-center mb-4 py-2 bg-gray-100 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">Our Team</p>
                      <p className="text-xl font-bold">{match.score_us}</p>
                    </div>
                    <div className="mx-4 text-lg font-bold text-gray-400">vs</div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">{match.opponent}</p>
                      <p className="text-xl font-bold">{match.score_them}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {match.location && (
                    <div className="flex items-center">
                      <SafeIcon icon={FiMapPin} className="mr-1 text-gray-400" />
                      <span>{match.location}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <SafeIcon icon={FiFlag} className="mr-1 text-gray-400" />
                    <span>
                      {isUpcoming ? 'Upcoming' : isTodayMatch ? 'Today' : 'Completed'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && filteredMatches.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <SafeIcon icon={FiTarget} className="text-gray-400 text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
          <p className="text-gray-600">
            {searchTerm || filter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : canCreateMatches
                ? 'Get started by adding your first match.'
                : 'No matches have been scheduled yet.'}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default Matches;