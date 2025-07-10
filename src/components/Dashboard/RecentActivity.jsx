import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format } from 'date-fns';

const { FiCalendar, FiTarget, FiUser, FiFileText } = FiIcons;

const RecentActivity = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'training':
        return FiCalendar;
      case 'match':
        return FiTarget;
      case 'player':
        return FiUser;
      case 'document':
        return FiFileText;
      default:
        return FiCalendar;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'training':
        return 'bg-blue-100 text-blue-600';
      case 'match':
        return 'bg-green-100 text-green-600';
      case 'player':
        return 'bg-purple-100 text-purple-600';
      case 'document':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Sample activities if none provided
  const sampleActivities = [
    {
      id: 1,
      type: 'training',
      title: 'New training session scheduled',
      description: 'Technical skills training for U18 team',
      timestamp: new Date(),
      user: 'Coach Martinez'
    },
    {
      id: 2,
      type: 'match',
      title: 'Match result updated',
      description: 'Victory against City FC 3-1',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      user: 'Match Supervisor'
    },
    {
      id: 3,
      type: 'player',
      title: 'New player registered',
      description: 'John Smith added to U16 squad',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      user: 'Admin'
    },
    {
      id: 4,
      type: 'document',
      title: 'Document uploaded',
      description: 'Medical certificate for player #23',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
      user: 'Medical Staff'
    }
  ];

  const displayActivities = activities.length > 0 ? activities : sampleActivities;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
      
      <div className="space-y-4">
        {displayActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-start space-x-3"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActivityColor(activity.type)}`}>
              <SafeIcon icon={getActivityIcon(activity.type)} className="text-sm" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs text-gray-500">by {activity.user}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  {format(activity.timestamp, 'MMM d, h:mm a')}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default RecentActivity;