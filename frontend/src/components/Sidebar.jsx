import React from 'react';
import { NavLink } from 'react-router-dom';
import { X, LayoutDashboard, Users, FileCode, Play, Terminal } from 'lucide-react';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Scripts', href: '/scripts', icon: FileCode },
    { name: 'Executions', href: '/executions', icon: Terminal },
  ];

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Sidebar panel */}
        <div className="fixed inset-y-0 left-0 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800 shadow-xl">
          <div className="h-0 flex-1 flex flex-col overflow-y-auto">
            <div className="px-4 h-16 flex items-center justify-between">
              <span className="text-xl font-semibold text-gray-800 dark:text-white">
                Script Dashboard
              </span>
              <button
                className="p-1 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-4 h-6 w-6 flex-shrink-0" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex flex-col overflow-y-auto">
              <div className="px-4 h-16 flex items-center">
                <span className="text-xl font-semibold text-gray-800 dark:text-white">
                  Script Dashboard
                </span>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white dark:bg-gray-800 space-y-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`
                    }
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;