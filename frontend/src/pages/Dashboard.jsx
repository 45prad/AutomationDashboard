import React from 'react';
import { Users, FileCode, Terminal, Check, AlertCircle, Clock } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="card p-6 flex items-center">
    <div className={`p-3 rounded-full ${color} mr-4`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

const ExecutionCard = ({ execution }) => {
  const statusColors = {
    completed: 'bg-green-500',
    failed: 'bg-red-500',
    pending: 'bg-yellow-500',
  };

  const statusIcons = {
    completed: Check,
    failed: AlertCircle,
    pending: Clock,
  };

  const StatusIcon = statusIcons[execution.status];

  return (
    <div className="card overflow-hidden transition-transform duration-300 transform hover:scale-[1.02]">
      <div className={`h-2 ${statusColors[execution.status]}`}></div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-gray-900 dark:text-white">{execution.scriptName}</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            execution.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
            execution.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
          }`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {execution.status}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">User: {execution.user}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">IP: {execution.ip}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{execution.timestamp}</p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  // Dummy data
  const stats = [
    { title: 'Total Users', value: '24', icon: Users, color: 'bg-blue-500' },
    { title: 'Scripts Uploaded', value: '48', icon: FileCode, color: 'bg-purple-500' },
    { title: 'Executions', value: '186', icon: Terminal, color: 'bg-indigo-500' },
  ];

  const recentExecutions = [
    { id: 1, scriptName: 'Network Scanner', user: 'John Doe', ip: '192.168.1.55', status: 'completed', timestamp: '2 minutes ago' },
    { id: 2, scriptName: 'Security Audit', user: 'Alice Smith', ip: '10.0.0.12', status: 'failed', timestamp: '15 minutes ago' },
    { id: 3, scriptName: 'Database Backup', user: 'Bob Johnson', ip: '172.16.254.1', status: 'pending', timestamp: '32 minutes ago' },
    { id: 4, scriptName: 'Log Analyzer', user: 'Emma Wilson', ip: '192.168.0.24', status: 'completed', timestamp: '1 hour ago' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
      
      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Executions</h2>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentExecutions.map((execution) => (
            <ExecutionCard key={execution.id} execution={execution} />
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Users by IP Allocation</h2>
          </div>
          <div className="p-4 h-64 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Chart placeholder - User/IP distribution</p>
          </div>
        </div>
        
        <div className="card">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Execution Success Rate</h2>
          </div>
          <div className="p-4 h-64 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Chart placeholder - Success/failure rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;