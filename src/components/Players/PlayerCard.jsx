import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format } from 'date-fns';

const { FiUser, FiCalendar, FiMapPin, FiMail, FiPhone } = FiIcons;

const PlayerCard = ({ player, onClick }) => {
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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(player)}
      className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
          {player.profile_image_url ? (
            <img
              src={player.profile_image_url}
              alt={`${player.first_name} ${player.last_name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <SafeIcon icon={FiUser} className="text-gray-400 text-xl" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {player.first_name} {player.last_name}
          </h3>
          <p className="text-sm text-gray-600">{getPositionNames(player.position_ids)}</p>
          <p className="text-sm text-gray-500">{player.nationality}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <SafeIcon icon={FiCalendar} className="text-gray-400" />
          <span className="text-gray-600">
            {player.birthday ? format(new Date(player.birthday), 'MMM d, yyyy') : 'N/A'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <SafeIcon icon={FiMapPin} className="text-gray-400" />
          <span className="text-gray-600">{player.place_of_birth || 'N/A'}</span>
        </div>
        {player.email && (
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiMail} className="text-gray-400" />
            <span className="text-gray-600 truncate">{player.email}</span>
          </div>
        )}
        {player.phone && (
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiPhone} className="text-gray-400" />
            <span className="text-gray-600">{player.phone}</span>
          </div>
        )}
      </div>

      {player.comments && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{player.comments}</p>
        </div>
      )}
    </motion.div>
  );
};

export default PlayerCard;