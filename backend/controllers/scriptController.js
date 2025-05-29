import Script from '../models/Script.js';

// Get all scripts
export const getScripts = (req, res) => {
  const scripts = [
    { 
      id: 1, 
      name: 'network_scanner.py',
      description: 'Scan network for active devices',
      challengeId: 1,
      size: '4.2 KB',
      uploaded: '2023-06-15',
      language: 'Python'
    },
    { 
      id: 2, 
      name: 'security_check.py',
      description: 'Check common security vulnerabilities',
      challengeId: 2,
      size: '6.8 KB',
      uploaded: '2023-07-22',
      language: 'Python'
    },
    { 
      id: 3, 
      name: 'performance_test.py',
      description: 'Test CPU and memory performance',
      challengeId: 3,
      size: '3.1 KB',
      uploaded: '2023-08-05',
      language: 'Python'
    },
  ];
  res.json(scripts);
};

// Get script by ID
export const getScriptById = (req, res) => {
  const { id } = req.params;
  const scripts = [
    { 
      id: 1, 
      name: 'network_scanner.py',
      description: 'Scan network for active devices',
      challengeId: 1,
      size: '4.2 KB',
      uploaded: '2023-06-15',
      language: 'Python'
    },
    { 
      id: 2, 
      name: 'security_check.py',
      description: 'Check common security vulnerabilities',
      challengeId: 2,
      size: '6.8 KB',
      uploaded: '2023-07-22',
      language: 'Python'
    },
    { 
      id: 3, 
      name: 'performance_test.py',
      description: 'Test CPU and memory performance',
      challengeId: 3,
      size: '3.1 KB',
      uploaded: '2023-08-05',
      language: 'Python'
    },
  ];
  
  const script = scripts.find(s => s.id === parseInt(id));
  if (!script) {
    return res.status(404).json({ message: 'Script not found' });
  }
  res.json(script);
};

// Upload new script
export const uploadScript = (req, res) => {
  if (!req.files || !req.files.script) {
    return res.status(400).json({ message: 'No script file uploaded' });
  }
  
  const { name, description, challengeId } = req.body;
  if (!name || !description || !challengeId) {
    return res.status(400).json({ message: 'Please provide name, description, and challengeId' });
  }
  
  const scriptFile = req.files.script;
  if (!scriptFile.name.endsWith('.py')) {
    return res.status(400).json({ message: 'Only Python scripts (.py) are allowed' });
  }
  
  const newScript = {
    id: Date.now(),
    name,
    description,
    challengeId: parseInt(challengeId),
    size: `${(scriptFile.size / 1024).toFixed(1)} KB`,
    uploaded: new Date().toISOString().split('T')[0],
    language: 'Python'
  };
  
  res.status(201).json(newScript);
};