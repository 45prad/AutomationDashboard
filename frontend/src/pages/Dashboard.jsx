import React, { useEffect, useState } from 'react';
import { Users, FileCode, Terminal, Check, AlertCircle, Clock } from 'lucide-react';
import axios from 'axios';

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
  const [stats, setStats] = useState([
    { title: 'Total Users', value: '0', icon: Users, color: 'bg-blue-500' },
    { title: 'Scripts Uploaded', value: '0', icon: FileCode, color: 'bg-purple-500' },
    { title: 'Executions', value: '0', icon: Terminal, color: 'bg-indigo-500' },
  ]);
  const [recentExecutions, setRecentExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [usersRes, scriptsRes, executionsRes, ipMappingsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_Backend_URL}/api/auth/getallusers`),
          axios.get(`${import.meta.env.VITE_Backend_URL}/api/scripts`),
          axios.get(`${import.meta.env.VITE_Backend_URL}/api/executions`),
          axios.get(`${import.meta.env.VITE_Backend_URL}/api/userIpMapping`)
        ]);

        // Update stats
        setStats([
          { title: 'Total Users', value: usersRes.data.length.toString(), icon: Users, color: 'bg-blue-500' },
          { title: 'Scripts Uploaded', value: scriptsRes.data.scripts.length.toString(), icon: FileCode, color: 'bg-purple-500' },
          { title: 'Executions', value: executionsRes.data.executions.length.toString(), icon: Terminal, color: 'bg-indigo-500' },
        ]);

        // Format and set recent executions (last 4)
        const formattedExecutions = executionsRes.data.executions
          .slice(0, 4)
          .map(exec => ({
            id: exec._id,
            scriptName: exec.scriptName,
            user: exec.targets[0]?.user?.email || 'Unknown',
            ip: exec.targets[0]?.ip || 'N/A',
            status: exec.status,
            timestamp: new Date(exec.startedAt).toLocaleString()
          }));
        
        setRecentExecutions(formattedExecutions);

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-4 text-red-500">
        {error}
      </div>
    );
  }

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
      
     
    </div>
  );
};

export default Dashboard;