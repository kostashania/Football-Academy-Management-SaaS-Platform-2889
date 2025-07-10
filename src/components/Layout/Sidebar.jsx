import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../config/supabase';

const { 
  FiUsers, FiCalendar, FiTrendingUp, FiFileText, 
  FiTarget, FiSettings, FiHome, FiMessageSquare,
  FiAward, FiClock, FiBarChart2, FiUser
} = FiIcons;

const Sidebar = ({ isOpen, onClose }) => {
  const { userTenant } = useAuth();
  
  const getMenuItems = () => {
    if (!userTenant) return [];
    
    const role = userTenant.role;
    const baseItems = [
      { icon: FiHome, label: 'Dashboard', path: '/dashboard' },
    ];

    const roleBasedItems = {
      [ROLES.SUPERADMIN]: [
        { icon: FiUsers, label: 'Tenants', path: '/tenants' },
        { icon: FiMessageSquare, label: 'Global Ads', path: '/global-ads' },
        { icon: FiBarChart2, label: 'Subscriptions', path: '/subscriptions' },
      ],
      [ROLES.TENANTADMIN]: [
        { icon: FiUsers, label: 'Players', path: '/players' },
        { icon: FiUser, label: 'Users', path: '/users' },
        { icon: FiCalendar, label: 'Trainings', path: '/trainings' },
        { icon: FiTarget, label: 'Matches', path: '/matches' },
        { icon: FiFileText, label: 'Documents', path: '/documents' },
        { icon: FiMessageSquare, label: 'Advertisements', path: '/ads' },
        { icon: FiTrendingUp, label: 'Reports', path: '/reports' },
        { icon: FiSettings, label: 'Settings', path: '/settings' },
      ],
      [ROLES.TRAINER]: [
        { icon: FiUsers, label: 'Players', path: '/players' },
        { icon: FiCalendar, label: 'Trainings', path: '/trainings' },
        { icon: FiTarget, label: 'Matches', path: '/matches' },
        { icon: FiAward, label: 'Evaluations', path: '/evaluations' },
        { icon: FiTrendingUp, label: 'Reports', path: '/reports' },
      ],
      [ROLES.TRAINING_SUPERVISOR]: [
        { icon: FiUsers, label: 'Players', path: '/players' },
        { icon: FiCalendar, label: 'Trainings', path: '/trainings' },
        { icon: FiClock, label: 'Attendance', path: '/attendance' },
      ],
      [ROLES.MATCH_SUPERVISOR]: [
        { icon: FiUsers, label: 'Players', path: '/players' },
        { icon: FiTarget, label: 'Matches', path: '/matches' },
        { icon: FiBarChart2, label: 'Match Stats', path: '/match-stats' },
      ],
      [ROLES.USER]: [
        { icon: FiTrendingUp, label: 'Reports', path: '/reports' },
        { icon: FiUsers, label: 'Players', path: '/players' },
      ],
      [ROLES.PLAYER]: [
        { icon: FiUser, label: 'My Profile', path: '/profile' },
        { icon: FiCalendar, label: 'My Schedule', path: '/schedule' },
        { icon: FiFileText, label: 'My Documents', path: '/my-documents' },
      ]
    };

    return [...baseItems, ...(roleBasedItems[role] || [])];
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 lg:relative lg:translate-x-0 lg:shadow-none"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiTarget} className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Football SaaS</h1>
              <p className="text-sm text-gray-500">{userTenant?.schema_name}</p>
            </div>
          </div>
        </div>

        <nav className="p-4">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <SafeIcon icon={item.icon} className="text-lg" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </motion.div>
    </>
  );
};

export default Sidebar;