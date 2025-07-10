import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useMatches } from '../contexts/MatchContext';
import { usePlayers } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const { 
  FiCalendar, FiMapPin, FiFlag, FiTarget, FiUsers,
  FiEdit, FiTrash2, FiArrowLeft, FiSave, FiX
} = FiIcons;

const MatchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { matches, getMatchStats, updateMatch, deleteMatch } = useMatches();
  const { players } = usePlayers();
  const { userTenant } = useAuth();
  
  const [match, setMatch] = useState(null);
  const [matchStats, setMatchStats] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMatch, setEditedMatch] = useState({
    date: '',
    opponent: '',
    location: '',
    score_us: '',
    score_them: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  
  // Find if the user has permission to edit/delete
  const canEditMatch = userTenant?.role === 'tenantadmin' || 
                       userTenant?.role === 'trainer' || 
                       userTenant?.role === 'match_supervisor';
  
  useEffect(() => {
    const selectedMatch = matches.find(m => m.id === id);
    if (selectedMatch) {
      setMatch(selectedMatch);
      setEditedMatch({
        date: selectedMatch.date,
        opponent: selectedMatch.opponent,
        location: selectedMatch.location || '',
        score_us: selectedMatch.score_us || '',
        score_them: selectedMatch.score_them || '',
        notes: selectedMatch.notes || ''
      });
      fetchMatchStats(selectedMatch.id);
    } else {
      setLoading(false);
    }
  }, [id, matches]);
  
  const fetchMatchStats = async (matchId) => {
    setLoading(true);
    try {
      const { data, error } = await getMatchStats(matchId);
      
      if (error) {
        toast.error(`Error loading match stats: ${error.message}`);
      } else {
        setMatchStats(data || []);
      }
    } catch (error) {
      console.error("Error fetching match details:", error);
      toast.error("Failed to load match details");
    } finally {
      setLoading(false);
    }
  };
  
  const handleMatchUpdate = async () => {
    try {
      const { error } = await updateMatch(match.id, editedMatch);
      if (error) {
        toast.error(`Failed to update match: ${error.message}`);
      } else {
        toast.success("Match updated successfully");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating match:", error);
      toast.error("Failed to update match");
    }
  };
  
  const handleMatchDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this match? This action cannot be undone.")) {
      return;
    }
    
    try {
      const { error } = await deleteMatch(match.id);
      if (error) {
        toast.error(`Failed to delete match: ${error.message}`);
      } else {
        toast.success("Match deleted successfully");
        navigate('/matches');
      }
    } catch (error) {
      console.error("Error deleting match:", error);
      toast.error("Failed to delete match");
    }
  };
  
  if (loading || !match) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/matches')} 
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <SafeIcon icon={FiArrowLeft} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Match' : `vs ${match.opponent}`}
            </h1>
            {!isEditing && (
              <div className="flex items-center space-x-2 text-gray-600">
                <SafeIcon icon={FiCalendar} className="text-gray-400" />
                <span>{format(new Date(match.date), 'MMMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </div>
        
        {!isEditing && canEditMatch && (
          <div className="flex space-x-2">
            <button 
              onClick={() => setIsEditing(true)} 
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <SafeIcon icon={FiEdit} className="h-5 w-5" />
            </button>
            <button 
              onClick={handleMatchDelete} 
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <SafeIcon icon={FiTrash2} className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      
      {isEditing ? (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={editedMatch.date}
                onChange={(e) => setEditedMatch({...editedMatch, date: e.target.value})}
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
                value={editedMatch.opponent}
                onChange={(e) => setEditedMatch({...editedMatch, opponent: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={editedMatch.location}
                onChange={(e) => setEditedMatch({...editedMatch, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Score
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    value={editedMatch.score_us}
                    onChange={(e) => setEditedMatch({...editedMatch, score_us: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Our score"
                  />
                </div>
                <span className="text-gray-500">vs</span>
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    value={editedMatch.score_them}
                    onChange={(e) => setEditedMatch({...editedMatch, score_them: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Their score"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={editedMatch.notes}
              onChange={(e) => setEditedMatch({...editedMatch, notes: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add notes about this match..."
            />
          </div>
          
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleMatchUpdate}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <SafeIcon icon={FiSave} />
              <span>Save Changes</span>
            </motion.button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-blue-500">
                      <SafeIcon icon={FiCalendar} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="text-sm font-medium">
                        {format(new Date(match.date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  {match.location && (
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-500">
                        <SafeIcon icon={FiMapPin} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="text-sm font-medium">{match.location}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-blue-500">
                      <SafeIcon icon={FiFlag} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="text-sm font-medium">
                        {new Date(match.date) > new Date() ? 'Upcoming' : 'Completed'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {(match.score_us !== null && match.score_them !== null) && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Final Score</h4>
                    <div className="flex justify-center items-center py-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Our Team</p>
                        <p className="text-2xl font-bold text-blue-600">{match.score_us}</p>
                      </div>
                      <div className="mx-6 text-gray-400">vs</div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">{match.opponent}</p>
                        <p className="text-2xl font-bold text-red-600">{match.score_them}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Player Statistics</h3>
                  {canEditMatch && (
                    <button
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => {/* Open player stats editor */}}
                    >
                      Edit Player Stats
                    </button>
                  )}
                </div>
                
                {matchStats.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <SafeIcon icon={FiUsers} className="text-gray-400 text-2xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No player statistics</h3>
                    <p className="text-gray-600">
                      {canEditMatch 
                        ? 'Add player statistics to track individual performance in this match.' 
                        : 'No player statistics have been recorded for this match yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Player
                          </th>
                          <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Position
                          </th>
                          <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Minutes
                          </th>
                          <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Goals
                          </th>
                          <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Assists
                          </th>
                          <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Cards
                          </th>
                          <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Rating
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {matchStats.map((stat) => (
                          <tr key={stat.id} className="hover:bg-gray-50">
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {stat.player?.first_name} {stat.player?.last_name}
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-center">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {stat.position?.short_code || '-'}
                              </span>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                              {stat.minutes || 0}'
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                              {stat.goals || 0}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                              {stat.assists || 0}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-center text-sm">
                              {stat.yellow_cards > 0 && (
                                <span className="inline-block w-4 h-5 bg-yellow-400 mx-1"></span>
                              )}
                              {stat.red_cards > 0 && (
                                <span className="inline-block w-4 h-5 bg-red-600 mx-1"></span>
                              )}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-center">
                              {stat.score ? (
                                <span className={`px-2 py-1 text-xs font-medium rounded-full 
                                  ${stat.score >= 8 ? 'bg-green-100 text-green-800' : 
                                    stat.score >= 6 ? 'bg-blue-100 text-blue-800' : 
                                    'bg-gray-100 text-gray-800'}`}>
                                  {stat.score}/10
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              {match.notes && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Notes</h3>
                  <p className="text-gray-700 whitespace-pre-line">{match.notes}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default MatchDetails;