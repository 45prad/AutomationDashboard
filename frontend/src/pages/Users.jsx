
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, User, Server } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

  const backendUrl = import.meta.env.VITE_Backend_URL;

  const api = axios.create({
  baseURL: backendUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to inject token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('Hactify-Auth-token');
  if (token) {
    config.headers['Auth-token'] = token;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized error
      localStorage.removeItem('Hactify-Auth-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const Users = () => {
  const [existingUsers, setExistingUsers] = useState([]);
  const [userMappings, setUserMappings] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddIPModal, setShowAddIPModal] = useState(false);
  const [newUserMapping, setNewUserMapping] = useState({
    user: '',
    ip: '',
    subnet: '',
    description: ''
  });
  const [newIP, setNewIP] = useState({
    ip: '',
    subnet: '',
    description: ''
  });


  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
       const token = localStorage.getItem('Hactify-Auth-token');
    if (!token) {
      // Redirect to login or handle missing token
      return;
    }
      try {
        const response = await api.get(`${backendUrl}/api/auth/getallusers`);
        setExistingUsers(response.data);
      } catch (error) {
        toast.error('Failed to fetch users');
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [backendUrl]);

  // Fetch all user IP mappings
  useEffect(() => {
    const fetchUserMappings = async () => {
       const token = localStorage.getItem('Hactify-Auth-token');
    if (!token) {
      // Redirect to login or handle missing token
      return;
    }
      try {
        const response = await api.get(`${backendUrl}/api/userIpMapping`);
        setUserMappings(response.data);
      } catch (error) {
        toast.error('Failed to fetch user IP mappings');
        console.error('Error fetching user mappings:', error);
      }
    };

    fetchUserMappings();
  }, [backendUrl]);

  const handleUserSelect = async (user) => {
    try {
      const response = await api.get(`${backendUrl}/api/userIpMapping/user/${user._id}`);
      setSelectedUser({
        ...user,
        ipAddresses: response.data
      });
    } catch (error) {
      // If no IPs found, set empty array
      setSelectedUser({
        ...user,
        ipAddresses: []
      });
    }
  };

  const handleAddUser = async () => {
    if (!newUserMapping.user || !newUserMapping.ip) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await api.post(`${backendUrl}/api/userIpMapping`, {
        user: newUserMapping.user,
        ip: newUserMapping.ip,
        subnet: newUserMapping.subnet || '',
        description: newUserMapping.description || ''
      });

      setUserMappings([...userMappings, response.data]);
      
      // Update the selected user if it's the one we just added
      if (selectedUser && selectedUser._id === newUserMapping.user) {
        setSelectedUser({
          ...selectedUser,
          ipAddresses: [...selectedUser.ipAddresses, response.data]
        });
      }

      setShowAddUserModal(false);
      setNewUserMapping({ user: '', ip: '', subnet: '', description: '' });
      toast.success('User IP mapping added successfully');
    } catch (error) {
      toast.error('Failed to add user IP mapping');
      console.error('Error adding user mapping:', error);
    }
  };

  const handleAddIP = async () => {
    if (!newIP.ip  || !selectedUser) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await api.post(`${backendUrl}/api/userIpMapping`, {
        user: selectedUser._id,
        ip: newIP.ip,
        subnet: newIP.subnet || '',
        description: newIP.description || ''
      });

      setUserMappings([...userMappings, response.data]);
      setSelectedUser({
        ...selectedUser,
        ipAddresses: [...selectedUser.ipAddresses, response.data]
      });

      toast.success('IP address added successfully');
      setShowAddIPModal(false);
      setNewIP({ ip: '', subnet: '', description: '' });
    } catch (error) {
      toast.error('Failed to add IP address');
      console.error('Error adding IP address:', error);
    }
  };

  const handleDeleteIP = async (ipToDelete) => {
    try {
      await api.delete(`${backendUrl}/api/userIpMapping/${ipToDelete._id}`);
      
      setUserMappings(userMappings.filter(mapping => mapping._id !== ipToDelete._id));
      
      if (selectedUser) {
        setSelectedUser({
          ...selectedUser,
          ipAddresses: selectedUser.ipAddresses.filter(ip => ip._id !== ipToDelete._id)
        });
      }

      toast.success('IP address deleted successfully');
    } catch (error) {
      toast.error('Failed to delete IP address');
      console.error('Error deleting IP address:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      // First delete all IP mappings for this user
      const mappingsToDelete = userMappings.filter(mapping => mapping.user === userId);
      await Promise.all(mappingsToDelete.map(mapping => 
        api.delete(`${backendUrl}/api/userIpMapping/${mapping._id}`)
      ));
      
      setUserMappings(userMappings.filter(mapping => mapping.user !== userId));
      setSelectedUser(null);
      toast.success('User and all associated IP mappings deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user mappings');
      console.error('Error deleting user mappings:', error);
    }
  };

  const availableUsers = existingUsers.filter(
    user => !userMappings.some(mapping => mapping.user === user._id)
  );

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users & IP Management</h1>
        <button 
          className="btn btn-primary flex items-center"
          onClick={() => setShowAddUserModal(true)}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add User
        </button>
      </div>

  <div className="flex gap-6 h-[calc(100vh-12rem)]">
        {/* User List Panel */}
        <div className="w-1/3">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>

          <div className="space-y-2 overflow-y-auto h-full pr-2">
            {existingUsers.map(user => {
              const hasMappings = userMappings.some(mapping => mapping.user === user._id);
              const isSelected = selectedUser?._id === user._id;
              
              return (
                <div
                  key={user._id}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200
                    ${isSelected 
                      ? 'bg-primary/10 border-l-4 border-primary' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                  `}
                  onClick={() => handleUserSelect(user)}
                >
                  <div className={`p-2 rounded-full mr-3 ${
                    isSelected ? 'bg-primary/20 text-primary' : 'bg-gray-200 dark:bg-gray-600'
                  }`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium truncate ${
                        isSelected ? 'text-primary' : 'text-gray-900 dark:text-white'
                      }`}>
                        {user.username}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {user.role}
                        </span>
                        {hasMappings && (
                          <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
                            Has IPs
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={`text-sm truncate ${
                      isSelected ? 'text-primary/80' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {user.email}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Details Panel */}
        <div className="flex-1">
          {selectedUser ? (
            <div className="space-y-6">
              <div className="flex justify-between items-start bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <div>
                  <h2 className="text-xl font-semibold flex items-center">
                    <span className="bg-primary/10 text-primary p-2 rounded-full mr-3">
                      <User className="h-5 w-5" />
                    </span>
                    {selectedUser.username}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 ml-10">{selectedUser.email}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                    onClick={() => handleDeleteUser(selectedUser._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="ml-1">Delete User</span>
                  </button>
                </div>
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div className="card p-4">
                  <span className="text-sm text-[var(--text-secondary)]">Role</span>
                  <p className="font-medium">{selectedUser.role}</p>
                </div>
                <div className="card p-4">
                  <span className="text-sm text-[var(--text-secondary)]">Created</span>
                  <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">IP Addresses</h3>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowAddIPModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add IP
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedUser.ipAddresses.map((ip, index) => (
                    <div key={index} className="card p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <Server className="h-5 w-5 mr-3 text-[var(--text-secondary)]" />
                          <div>
                            <p className="font-medium">{ip.ip}</p>
                            <p className="text-sm text-[var(--text-secondary)]">
                              {ip.subnet}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)]">
                              {ip.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            className="p-1 hover:text-red-500"
                            onClick={() => handleDeleteIP(ip)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <User className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg">Select a user to view details</p>
              <p className="text-sm mt-1">Click on any user from the left panel</p>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-[var(--background)] rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add User IP Mapping</h3>
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select User</label>
                <select
                  value={newUserMapping.user}
                  onChange={(e) => setNewUserMapping({ ...newUserMapping, user: e.target.value })}
                  className="input"
                >
                  <option value="">Select a user</option>
                  {availableUsers.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">IP Address*</label>
                <input
                  type="text"
                  value={newUserMapping.ip}
                  onChange={(e) => setNewUserMapping({ ...newUserMapping, ip: e.target.value })}
                  placeholder="192.168.1.1"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Subnet Mask</label>
                <input
                  type="text"
                  value={newUserMapping.subnet}
                  onChange={(e) => setNewUserMapping({ ...newUserMapping, subnet: e.target.value })}
                  placeholder="255.255.255.0"
                  className="input"
                  
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={newUserMapping.description}
                  onChange={(e) => setNewUserMapping({ ...newUserMapping, description: e.target.value })}
                  placeholder="Development Server"
                  className="input"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => setShowAddUserModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddUser}
                  className="btn btn-primary"
                >
                  Add Mapping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add IP Modal */}
      {showAddIPModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-[var(--background)] rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add IP Address</h3>
              <button 
                onClick={() => setShowAddIPModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">IP Address*</label>
                <input
                  type="text"
                  value={newIP.ip}
                  onChange={(e) => setNewIP({ ...newIP, ip: e.target.value })}
                  placeholder="192.168.1.1"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Subnet Mask</label>
                <input
                  type="text"
                  value={newIP.subnet}
                  onChange={(e) => setNewIP({ ...newIP, subnet: e.target.value })}
                  placeholder="255.255.255.0"
                  className="input"
                  
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={newIP.description}
                  onChange={(e) => setNewIP({ ...newIP, description: e.target.value })}
                  placeholder="Development Server"
                  className="input"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => setShowAddIPModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddIP}
                  className="btn btn-primary"
                >
                  Add IP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;