import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { usePlayers } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const { 
  FiUser, FiCalendar, FiMapPin, FiMail, FiPhone, FiFlag, FiFileText, 
  FiAlertTriangle, FiArrowLeft, FiEdit, FiTrash2, FiSave
} = FiIcons;

const PlayerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { players, getPlayerById, updatePlayer, deletePlayer } = usePlayers();
  const { userTenant } = useAuth();
  
  const [player, setPlayer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Check if user has permission to edit/delete
  const canEditPlayer = userTenant?.role === 'tenantadmin' || userTenant?.role === 'trainer';
  
  useEffect(() => {
    const fetchPlayer = () => {
      const playerData = getPlayerById(id);
      if (playerData) {
        setPlayer(playerData);
        setEditForm({
          first_name: playerData.first_name || '',
          last_name: playerData.last_name || '',
          father_name: playerData.father_name || '',
          mother_name: playerData.mother_name || '',
          national_id: playerData.national_id || '',
          passport_number: playerData.passport_number || '',
          nationality: playerData.nationality || '',
          place_of_birth: playerData.place_of_birth || '',
          birthday: playerData.birthday || '',
          email: playerData.email || '',
          phone: playerData.phone || '',
          epo_record_number: playerData.epo_record_number || '',
          epo_record_expiry: playerData.epo_record_expiry || '',
          health_card_expiry: playerData.health_card_expiry || '',
          comments: playerData.comments || ''
        });
      } else {
        toast.error("Player not found");
        navigate('/players');
      }
      setLoading(false);
    };
    
    fetchPlayer();
  }, [id, players, getPlayerById, navigate]);
  
  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleUpdatePlayer = async () => {
    try {
      const { error } = await updatePlayer(id, editForm);
      if (error) {
        toast.error(`Failed to update player: ${error.message}`);
      } else {
        setIsEditing(false);
        // Player list will be refreshed by the context
      }
    } catch (error) {
      console.error("Error updating player:", error);
      toast.error("Failed to update player");
    }
  };
  
  const handleDeletePlayer = async () => {
    if (!confirm("Are you sure you want to delete this player? This action cannot be undone.")) {
      return;
    }
    
    try {
      const { error } = await deletePlayer(id);
      if (error) {
        toast.error(`Failed to delete player: ${error.message}`);
      } else {
        navigate('/players');
      }
    } catch (error) {
      console.error("Error deleting player:", error);
      toast.error("Failed to delete player");
    }
  };
  
  if (loading || !player) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }
  
  // Check for expiring documents
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  
  const epoExpiry = player.epo_record_expiry ? new Date(player.epo_record_expiry) : null;
  const healthCardExpiry = player.health_card_expiry ? new Date(player.health_card_expiry) : null;
  
  const isEpoExpiring = epoExpiry && epoExpiry <= thirtyDaysFromNow && epoExpiry >= now;
  const isHealthCardExpiring = healthCardExpiry && healthCardExpiry <= thirtyDaysFromNow && healthCardExpiry >= now;
  
  const getPositionNames = (positionIds) => {
    // This would normally fetch from positions table
    const positions = {
      'gk': 'Goalkeeper',
      'def': 'Defender',
      'mid': 'Midfielder',
      'fwd': 'Forward'
    };
    return positionIds?.map(id => positions[id] || 'Unknown').join(', ') || 'Not specified';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/players')}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <SafeIcon icon={FiArrowLeft} className="text-gray-600" />
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Player' : `${player.first_name} ${player.last_name}`}
            </h1>
            {!isEditing && (
              <div className="flex items-center space-x-2 text-gray-600">
                <span>{getPositionNames(player.position_ids)}</span>
                {player.nationality && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span>{player.nationality}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        {!isEditing && canEditPlayer && (
          <div className="flex space-x-2">
            <button 
              onClick={() => setIsEditing(true)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <SafeIcon icon={FiEdit} className="h-5 w-5" />
            </button>
            <button 
              onClick={handleDeletePlayer}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <SafeIcon icon={FiTrash2} className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      
      {/* Expiring documents warning */}
      {(isEpoExpiring || isHealthCardExpiring) && !isEditing && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <SafeIcon icon={FiAlertTriangle} className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Document expiration warning</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  {isEpoExpiring && (
                    <li>
                      EPO record expires on {format(epoExpiry, 'MMMM d, yyyy')}
                    </li>
                  )}
                  {isHealthCardExpiring && (
                    <li>
                      Health card expires on {format(healthCardExpiry, 'MMMM d, yyyy')}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {isEditing ? (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={editForm.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={editForm.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Father's Name
              </label>
              <input
                type="text"
                value={editForm.father_name}
                onChange={(e) => handleInputChange('father_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mother's Name
              </label>
              <input
                type="text"
                value={editForm.mother_name}
                onChange={(e) => handleInputChange('mother_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                National ID
              </label>
              <input
                type="text"
                value={editForm.national_id}
                onChange={(e) => handleInputChange('national_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passport Number
              </label>
              <input
                type="text"
                value={editForm.passport_number}
                onChange={(e) => handleInputChange('passport_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nationality
              </label>
              <input
                type="text"
                value={editForm.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Place of Birth
              </label>
              <input
                type="text"
                value={editForm.place_of_birth}
                onChange={(e) => handleInputChange('place_of_birth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Birthday
              </label>
              <input
                type="date"
                value={editForm.birthday}
                onChange={(e) => handleInputChange('birthday', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                EPO Record Number
              </label>
              <input
                type="text"
                value={editForm.epo_record_number}
                onChange={(e) => handleInputChange('epo_record_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                EPO Record Expiry
              </label>
              <input
                type="date"
                value={editForm.epo_record_expiry}
                onChange={(e) => handleInputChange('epo_record_expiry', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Health Card Expiry
              </label>
              <input
                type="date"
                value={editForm.health_card_expiry}
                onChange={(e) => handleInputChange('health_card_expiry', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments
            </label>
            <textarea
              value={editForm.comments}
              onChange={(e) => handleInputChange('comments', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes about the player..."
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
              onClick={handleUpdatePlayer}
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
                <div className="flex justify-center mb-6">
                  <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {player.profile_image_url ? (
                      <img 
                        src={player.profile_image_url} 
                        alt={`${player.first_name} ${player.last_name}`}
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <SafeIcon icon={FiUser} className="text-gray-400 text-5xl" />
                    )}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
                  {player.first_name} {player.last_name}
                </h3>
                
                <div className="space-y-3">
                  {player.birthday && (
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-500">
                        <SafeIcon icon={FiCalendar} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Birthday</p>
                        <p className="text-sm font-medium">
                          {format(new Date(player.birthday), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {player.place_of_birth && (
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-500">
                        <SafeIcon icon={FiMapPin} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Place of Birth</p>
                        <p className="text-sm font-medium">{player.place_of_birth}</p>
                      </div>
                    </div>
                  )}
                  
                  {player.nationality && (
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-500">
                        <SafeIcon icon={FiFlag} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Nationality</p>
                        <p className="text-sm font-medium">{player.nationality}</p>
                      </div>
                    </div>
                  )}
                  
                  {player.email && (
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-500">
                        <SafeIcon icon={FiMail} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-sm font-medium">{player.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {player.phone && (
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-500">
                        <SafeIcon icon={FiPhone} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-sm font-medium">{player.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents & IDs</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">National ID</p>
                      <p className="text-sm text-gray-500">
                        {player.national_id || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Passport Number</p>
                      <p className="text-sm text-gray-500">
                        {player.passport_number || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">EPO Record</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-500">
                          {player.epo_record_number || 'Not provided'}
                        </p>
                        {player.epo_record_expiry && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isEpoExpiring 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : epoExpiry < now 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                          }`}>
                            {isEpoExpiring 
                              ? 'Expiring soon' 
                              : epoExpiry < now 
                                ? 'Expired' 
                                : 'Valid'}
                          </span>
                        )}
                      </div>
                      {player.epo_record_expiry && (
                        <p className="text-xs text-gray-500 mt-1">
                          Expires: {format(new Date(player.epo_record_expiry), 'MMMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Health Card</p>
                      {player.health_card_expiry && (
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isHealthCardExpiring 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : healthCardExpiry < now 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                          }`}>
                            {isHealthCardExpiring 
                              ? 'Expiring soon' 
                              : healthCardExpiry < now 
                                ? 'Expired' 
                                : 'Valid'}
                          </span>
                        </div>
                      )}
                      {player.health_card_expiry && (
                        <p className="text-xs text-gray-500 mt-1">
                          Expires: {format(new Date(player.health_card_expiry), 'MMMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {player.comments && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center mb-4">
                    <SafeIcon icon={FiFileText} className="text-blue-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line">{player.comments}</p>
                </div>
              )}
              
              {/* Stats section - would be populated from actual data */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Player Statistics</h3>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-600 text-sm">Trainings</p>
                    <p className="text-2xl font-bold text-blue-600">0</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-600 text-sm">Matches</p>
                    <p className="text-2xl font-bold text-purple-600">0</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-600 text-sm">Goals</p>
                    <p className="text-2xl font-bold text-green-600">0</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-600 text-sm">Assists</p>
                    <p className="text-2xl font-bold text-orange-600">0</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default PlayerProfile;