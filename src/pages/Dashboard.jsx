import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardStats from '../components/Dashboard/DashboardStats';
import RecentActivity from '../components/Dashboard/RecentActivity';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { userTenant } = useAuth();
  const [stats, setStats] = useState({
    players: 45,
    trainings: 12,
    matches: 8,
    performance: 87
  });

  useEffect(() => {
    // Fetch dashboard data based on user role and tenant
    // This would be replaced with actual API calls
    const fetchDashboardData = async () => {
      // Implementation would depend on the user's role and tenant
      console.log('Fetching dashboard data for', userTenant);
    };

    if (userTenant) {
      fetchDashboardData();
    }
  }, [userTenant]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with your team.
          </p>
        </div>
      </div>

      <DashboardStats stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Upcoming Events</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Training Session</h4>
                <p className="text-sm text-gray-600">Technical skills - U18 Team</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-blue-600">Today</p>
                <p className="text-sm text-gray-500">4:00 PM</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Match vs City FC</h4>
                <p className="text-sm text-gray-600">Home game - League match</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">Tomorrow</p>
                <p className="text-sm text-gray-500">7:00 PM</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Medical Check-ups</h4>
                <p className="text-sm text-gray-600">Annual health assessments</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-orange-600">Next Week</p>
                <p className="text-sm text-gray-500">9:00 AM</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;