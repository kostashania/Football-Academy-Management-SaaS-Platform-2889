import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const { FiMenu, FiBell, FiUser, FiLogOut } = FiIcons;

const Header = ({ onMenuToggle }) => {
  const { user, userTenant, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      console.log("Signing out...");
      const { error } = await signOut();
      if (error) {
        console.error("Sign out error:", error);
        toast.error("Failed to sign out");
      } else {
        toast.success("Signed out successfully");
        // Redirect happens automatically via protected route
      }
    } catch (error) {
      console.error("Unexpected error during sign out:", error);
      toast.error("An error occurred during sign out");
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <SafeIcon icon={FiMenu} className="h-6 w-6" />
            </button>
            <h1 className="ml-4 text-xl font-semibold text-gray-900">
              Football Management
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-gray-400 hover:text-gray-500 relative"
            >
              <SafeIcon icon={FiBell} className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </motion.button>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.email || 'User'}</p>
                <p className="text-xs text-gray-500 capitalize">{userTenant?.role || 'Loading...'}</p>
              </div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <SafeIcon icon={FiUser} className="h-4 w-4 text-gray-600" />
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-gray-500"
              >
                <SafeIcon icon={FiLogOut} className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;