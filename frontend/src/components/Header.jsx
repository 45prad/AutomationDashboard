import React from 'react';
import { Menu, Bell, Menu as MenuIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const Header = ({ setSidebarOpen }) => {
 const { user, logout } = useAuth();


  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800 ml-2 md:ml-0">
            Infrastructure Script Automation
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-1 rounded-full text-gray-500 hover:text-gray-900 focus:outline-none">
            <Bell className="h-6 w-6" />
          </button>
          
          <div className="relative inline-block text-left">
            <div className="flex items-center">
              <span className="hidden md:block mr-3 text-gray-700">
              {user?.name}
              </span>
              <button 
                onClick={logout}
                className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-sm rounded-md font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;