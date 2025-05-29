import Execution from '../models/Execution.js';

// Get all executions
export const getExecutions = (req, res) => {
  const executions = [
    { 
      id: 1, 
      scriptId: 1, 
      userId: 1, 
      ip: '192.168.1.55', 
      status: 'completed', 
      timestamp: '2023-11-15T14:24:35Z', 
      duration: '2m 15s',
      output: 'Scan completed successfully. Found 12 devices.'
    },
    { 
      id: 2, 
      scriptId: 2, 
      userId: 2, 
      ip: '10.0.0.12', 
      status: 'failed', 
      timestamp: '2023-11-15T13:12:22Z', 
      duration: '0m 47s',
      output: 'Error: Connection timeout after 45 seconds.'
    },
    { 
      id: 3, 
      scriptId: 3, 
      userId: 3, 
      ip: '172.16.254.1', 
      status: 'pending', 
      timestamp: '2023-11-15T14:50:11Z', 
      duration: 'N/A',
      output: 'Waiting for execution to complete...'
    }
  ];
  res.json(executions);
};

// Get execution by ID
export const getExecutionById = (req, res) => {
  const { id } = req.params;
  const executions = [
    { 
      id: 1, 
      scriptId: 1, 
      userId: 1, 
      ip: '192.168.1.55', 
      status: 'completed', 
      timestamp: '2023-11-15T14:24:35Z', 
      duration: '2m 15s',
      output: 'Scan completed successfully. Found 12 devices.'
    },
    { 
      id: 2, 
      scriptId: 2, 
      userId: 2, 
      ip: '10.0.0.12', 
      status: 'failed', 
      timestamp: '2023-11-15T13:12:22Z', 
      duration: '0m 47s',
      output: 'Error: Connection timeout after 45 seconds.'
    },
    { 
      id: 3, 
      scriptId: 3, 
      userId: 3, 
      ip: '172.16.254.1', 
      status: 'pending', 
      timestamp: '2023-11-15T14:50:11Z', 
      duration: 'N/A',
      output: 'Waiting for execution to complete...'
    }
  ];
  
  const execution = executions.find(e => e.id === parseInt(id));
  if (!execution) {
    return res.status(404).json({ message: 'Execution not found' });
  }
  res.json(execution);
};

// Create new execution
export const createExecution = (req, res) => {
  const { scriptId, userId, ip } = req.body;
  if (!scriptId || !userId || !ip) {
    return res.status(400).json({ message: 'Please provide scriptId, userId, and ip' });
  }
  
  const newExecution = {
    id: Date.now(),
    scriptId: parseInt(scriptId),
    userId: parseInt(userId),
    ip,
    status: 'pending',
    timestamp: new Date().toISOString(),
    duration: 'N/A',
    output: 'Execution initiated...'
  };
  
  res.status(201).json(newExecution);
};