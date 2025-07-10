import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PlayerCard from '../components/Players/PlayerCard';
import PlayerForm from '../components/Players/PlayerForm';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiSearch, FiFilter } = FiIcons;

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('all');

  // Sample players data
  useEffect(() => {
    const samplePlayers = [
      {
        id: 1,
        first_name: 'John',
        last_name: 'Smith',
        father_name: 'Robert Smith',
        mother_name: 'Mary Smith',
        national_id: '123456789',
        nationality: 'USA',
        place_of_birth: 'New York',
        birthday: '2005-03-15',
        position_ids: ['fwd'],
        email: 'john.smith@email.com',
        phone: '+1234567890',
        epo_record_number: 'EPO123',
        epo_record_expiry: '2024-12-31',
        health_card_expiry: '2024-06-30',
        comments: 'Promising young striker with excellent finishing ability.'
      },
      {
        id: 2,
        first_name: 'Alex',
        last_name: 'Johnson',
        father_name: 'Mike Johnson',
        mother_name: 'Sarah Johnson',
        national_id: '987654321',
        nationality: 'Canada',
        place_of_birth: 'Toronto',
        birthday: '2004-08-22',
        position_ids: ['mid'],
        email: 'alex.johnson@email.com',
        phone: '+1987654321',
        epo_record_number: 'EPO456',
        epo_record_expiry: '2024-11-15',
        health_card_expiry: '2024-09-30',
        comments: 'Creative midfielder with excellent passing range.'
      },
      {
        id: 3,
        first_name: 'David',
        last_name: 'Garcia',
        father_name: 'Carlos Garcia',
        mother_name: 'Elena Garcia',
        national_id: '456789123',
        nationality: 'Spain',
        place_of_birth: 'Madrid',
        birthday: '2006-01-10',
        position_ids: ['def'],
        email: 'david.garcia@email.com',
        phone: '+34123456789',
        epo_record_number: 'EPO789',
        epo_record_expiry: '2025-02-28',
        health_card_expiry: '2024-12-15',
        comments: 'Solid defender with strong aerial ability.'
      }
    ];
    setPlayers(samplePlayers);
  }, []);

  const filteredPlayers = players.filter(player => {
    const matchesSearch = `${player.first_name} ${player.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesPosition = filterPosition === 'all' || 
      player.position_ids?.includes(filterPosition);
    
    return matchesSearch && matchesPosition;
  });

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
    setShowForm(true);
  };

  const handleSavePlayer = async (playerData) => {
    if (selectedPlayer) {
      // Update existing player
      setPlayers(prev => 
        prev.map(p => p.id === selectedPlayer.id ? { ...p, ...playerData } : p)
      );
    } else {
      // Add new player
      const newPlayer = {
        id: Date.now(),
        ...playerData
      };
      setPlayers(prev => [...prev, newPlayer]);
    }
    
    setShowForm(false);
    setSelectedPlayer(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedPlayer(null);
  };

  if (showForm) {
    return (
      <PlayerForm
        player={selectedPlayer}
        onSave={handleSavePlayer}
        onCancel={handleCancel}
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
          <h1 className="text-2xl font-bold text-gray-900">Players</h1>
          <p className="text-gray-600 mt-1">
            Manage your team's player roster and information.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <SafeIcon icon={FiPlus} />
          <span>Add Player</span>
        </motion.button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <SafeIcon icon={FiSearch} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <SafeIcon icon={FiFilter} className="absolute left-3 top-3 text-gray-400" />
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Positions</option>
            <option value="gk">Goalkeeper</option>
            <option value="def">Defender</option>
            <option value="mid">Midfielder</option>
            <option value="fwd">Forward</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlayers.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onClick={handlePlayerClick}
          />
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <SafeIcon icon={FiSearch} className="text-gray-400 text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No players found</h3>
          <p className="text-gray-600">
            {searchTerm || filterPosition !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first player.'}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default Players;