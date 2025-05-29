import User from '../models/User.js';

// Get all users
export const getUsers = (req, res) => {
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', ipAddresses: ['192.168.1.55', '10.0.0.25'] },
    { id: 2, name: 'Alice Smith', email: 'alice@example.com', ipAddresses: ['10.0.0.12'] },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', ipAddresses: ['172.16.254.1', '192.168.0.101'] },
    { id: 4, name: 'Emma Wilson', email: 'emma@example.com', ipAddresses: ['192.168.0.24'] },
  ];
  res.json(users);
};

// Get user by ID
export const getUserById = (req, res) => {
  const { id } = req.params;
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', ipAddresses: ['192.168.1.55', '10.0.0.25'] },
    { id: 2, name: 'Alice Smith', email: 'alice@example.com', ipAddresses: ['10.0.0.12'] },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', ipAddresses: ['172.16.254.1', '192.168.0.101'] },
    { id: 4, name: 'Emma Wilson', email: 'emma@example.com', ipAddresses: ['192.168.0.24'] },
  ];
  
  const user = users.find(u => u.id === parseInt(id));
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
};

// Create new user
export const createUser = (req, res) => {
  const { name, email, ipAddresses } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Please provide name and email' });
  }
  const newUser = {
    id: Date.now(),
    name,
    email,
    ipAddresses: ipAddresses || []
  };
  res.status(201).json(newUser);
};