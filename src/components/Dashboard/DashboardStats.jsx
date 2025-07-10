import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUsers, FiCalendar, FiTarget, FiTrendingUp } = FiIcons;

const DashboardStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Players',
      value: stats?.players || 0,
      icon: FiUsers,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Trainings This Month',
      value: stats?.trainings || 0,
      icon: FiCalendar,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Matches Played',
      value: stats?.matches || 0,
      icon: FiTarget,
      color: 'bg-purple-500',
      change: '+15%'
    },
    {
      title: 'Performance Score',
      value: `${stats?.performance || 0}%`,
      icon: FiTrendingUp,
      color: 'bg-orange-500',
      change: '+3%'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              <p className="text-sm text-green-600 mt-1">{card.change}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
              <SafeIcon icon={card.icon} className="text-white text-xl" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default DashboardStats;