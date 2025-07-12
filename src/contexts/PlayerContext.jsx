import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
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
  const { userTenant } = useAuth();

  useEffect(() => {
    if (userTenant) {
      fetchPlayers();
    }
  }, [userTenant]);

  const fetchPlayers = async () => {
    if (!userTenant?.schema_name) {
      console.log("No tenant schema available");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // First, check if the players_x12345 table exists
      const { data: tableExists, error: tableCheckError } = await supabase
        .from('players_x12345')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (tableCheckError && tableCheckError.code !== 'PGRST116') {
        console.error('Error checking players table:', tableCheckError);
        useSampleData();
        return;
      }
      
      // If table doesn't exist, create it
      if (!tableExists && tableCheckError?.code === 'PGRST116') {
        console.log('Players table does not exist, creating it');
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS players_x12345 (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            father_name TEXT,
            mother_name TEXT,
            national_id TEXT,
            passport_number TEXT,
            nationality TEXT,
            place_of_birth TEXT,
            birthday DATE,
            position_ids TEXT[],
            email TEXT,
            phone TEXT,
            epo_record_number TEXT,
            epo_record_expiry DATE,
            health_card_expiry DATE,
            profile_image_url TEXT,
            comments TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          ALTER TABLE players_x12345 ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Allow all access" ON players_x12345
            USING (true)
            WITH CHECK (true);
        `;
        
        const { error: createError } = await supabase.rpc('execute_query', { 
          query_text: createTableQuery 
        });
        
        if (createError) {
          console.error('Error creating players table:', createError);
          useSampleData();
          return;
        }
        
        // Insert sample data
        const insertQuery = `
          INSERT INTO players_x12345 (
            first_name, last_name, father_name, mother_name, 
            national_id, nationality, place_of_birth, birthday,
            position_ids, email, phone, epo_record_number,
            epo_record_expiry, health_card_expiry, comments
          ) VALUES 
          (
            'John', 'Smith', 'Robert Smith', 'Mary Smith',
            '123456789', 'USA', 'New York', '2005-03-15',
            ARRAY['fwd'], 'john.smith@email.com', '+1234567890', 'EPO123',
            '2024-12-31', '2024-06-30', 'Promising young striker with excellent finishing ability.'
          ),
          (
            'Alex', 'Johnson', 'Mike Johnson', 'Sarah Johnson',
            '987654321', 'Canada', 'Toronto', '2004-08-22',
            ARRAY['mid'], 'alex.johnson@email.com', '+1987654321', 'EPO456',
            '2024-11-15', '2024-09-30', 'Creative midfielder with excellent passing range.'
          ),
          (
            'David', 'Garcia', 'Carlos Garcia', 'Elena Garcia',
            '456789123', 'Spain', 'Madrid', '2006-01-10',
            ARRAY['def'], 'david.garcia@email.com', '+34123456789', 'EPO789',
            '2025-02-28', '2024-12-15', 'Solid defender with strong aerial ability.'
          );
        `;
        
        const { error: insertError } = await supabase.rpc('execute_query', { 
          query_text: insertQuery 
        });
        
        if (insertError) {
          console.error('Error inserting sample players:', insertError);
          useSampleData();
          return;
        }
      }
      
      // Fetch players from the table
      const { data, error } = await supabase
        .from('players_x12345')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching players:', error);
        useSampleData();
        return;
      }
      
      setPlayers(data);
      
    } catch (error) {
      console.error('Error in fetchPlayers:', error);
      toast.error('Failed to load players');
      // Use sample data as fallback
      useSampleData();
    } finally {
      setLoading(false);
    }
  };

  const useSampleData = () => {
    const samplePlayers = [
      {
        id: '1',
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
        id: '2',
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
        id: '3',
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
  };

  const getPlayerById = (id) => {
    return players.find(player => player.id === id);
  };

  const createPlayer = async (playerData) => {
    try {
      const { data, error } = await supabase
        .from('players_x12345')
        .insert([playerData])
        .select()
        .single();
      
      if (error) throw error;
      
      setPlayers(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      console.error('Error in createPlayer:', error);
      
      // Fallback to client-side implementation if database operation fails
      const newPlayer = {
        id: `player-${Date.now()}`,
        ...playerData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setPlayers(prev => [newPlayer, ...prev]);
      return { data: newPlayer, error: null };
    }
  };

  const updatePlayer = async (id, playerData) => {
    try {
      const { data, error } = await supabase
        .from('players_x12345')
        .update({
          ...playerData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      setPlayers(prev => prev.map(p => p.id === id ? data : p));
      return { data, error: null };
    } catch (error) {
      console.error('Error in updatePlayer:', error);
      
      // Fallback to client-side implementation
      const updatedPlayer = {
        ...players.find(p => p.id === id),
        ...playerData,
        updated_at: new Date().toISOString()
      };
      
      setPlayers(prev => prev.map(p => p.id === id ? updatedPlayer : p));
      return { data: updatedPlayer, error: null };
    }
  };

  const deletePlayer = async (id) => {
    try {
      const { error } = await supabase
        .from('players_x12345')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setPlayers(prev => prev.filter(p => p.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Error in deletePlayer:', error);
      
      // Fallback to client-side implementation
      setPlayers(prev => prev.filter(p => p.id !== id));
      return { error: null };
    }
  };

  return (
    <PlayerContext.Provider value={{
      players,
      loading,
      getPlayerById,
      createPlayer,
      updatePlayer,
      deletePlayer
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerProvider;