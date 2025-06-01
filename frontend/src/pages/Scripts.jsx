import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Link2, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'Auth-token': localStorage.getItem('Hactify-Auth-token') || '' // Get token from localStorage
  }
});

const Scripts = () => {
  const [challenges, setChallenges] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    challenge: '',
    language: 'Python',
    file: null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Fetch challenges and scripts on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [challengesRes, scriptsRes] = await Promise.all([
          api.get(`${import.meta.env.VITE_Backend_URL}/api/challenges/all`),
          api.get(`${import.meta.env.VITE_Backend_URL}/api/scripts`)
        ]);
        
        if (challengesRes.data && Array.isArray(challengesRes.data)) {
          setChallenges(challengesRes.data);
        } else {
          console.error('Unexpected challenges response:', challengesRes.data);
          toast.error('Failed to load challenges data');
        }

        if (scriptsRes.data?.scripts && Array.isArray(scriptsRes.data.scripts)) {
          setScripts(scriptsRes.data.scripts);
        } else {
          console.error('Unexpected scripts response:', scriptsRes.data);
          toast.error('Failed to load scripts data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        let errorMessage = 'Failed to load data';
        
        if (error.response) {
          // The request was made and the server responded with a status code
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
          errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
          errorMessage = 'No response from server';
        } else {
          // Something happened in setting up the request
          console.error('Request setup error:', error.message);
        }
        
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpload = async () => {
    if (!uploadForm.name || !uploadForm.challenge || !uploadForm.description || !uploadForm.file) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', uploadForm.name);
      formData.append('description', uploadForm.description);
      formData.append('challenge', uploadForm.challenge);
      formData.append('language', uploadForm.language);
      formData.append('file', uploadForm.file);

      setIsUploading(true); // Show loading state during upload
      
      const response = await api.post(
        `${import.meta.env.VITE_Backend_URL}/api/scripts`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data?.success && response.data.script) {
        setScripts([response.data.script, ...scripts]);
        setUploadForm({
          name: '',
          description: '',
          challenge: '',
          language: 'Python',
          file: null
        });
        toast.success('Script uploaded successfully');
      } else {
        console.error('Unexpected response format:', response.data);
        toast.error('Received unexpected response from server');
      }
    } catch (error) {
      console.error('Error uploading script:', error);
      let errorMessage = 'Failed to upload script';
      
      if (error.response) {
        console.error('Upload error response:', error.response.data);
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      errorMessage;
        
        // Handle specific error cases
        if (error.response.status === 400) {
          errorMessage = errorMessage || 'Invalid data submitted';
        } else if (error.response.status === 413) {
          errorMessage = 'File too large';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    try {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        // Validate file type
        const validExtensions = ['py', 'js', 'java', 'c', 'cpp', 'rb', 'go', 'rs', 'php'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (!validExtensions.includes(fileExtension)) {
          toast.error(`Invalid file type. Allowed: ${validExtensions.join(', ')}`);
          return;
        }

        // Extract name without extension
        const fileName = file.name.split('.').slice(0, -1).join('.');
        setUploadForm({
          ...uploadForm,
          name: fileName,
          file,
          language: getLanguageFromExtension(fileExtension)
        });
      }
    } catch (error) {
      console.error('Error handling file selection:', error);
      toast.error('Failed to process selected file');
    }
  };

  const getLanguageFromExtension = (ext) => {
    const extensionMap = {
      'py': 'Python',
      'js': 'JavaScript',
      'java': 'Java',
      'c': 'C',
      'cpp': 'C++',
      'rb': 'Ruby',
      'go': 'Go',
      'rs': 'Rust',
      'php': 'PHP'
    };
    return extensionMap[ext] || 'Python';
  };

  const handleDeleteScript = async (id) => {
    try {
      const response = await api.delete(`${import.meta.env.VITE_Backend_URL}/api/scripts/delete-script/${id}`);
      
      if (response.data?.success) {
        setScripts(scripts.filter(script => script.id !== id));
        
        toast.success('Script deleted successfully');
        
      } else {
        console.error('Unexpected delete response:', response.data);
        toast.error('Failed to delete script');
      }
    } catch (error) {
      console.error('Error deleting script:', error);
      let errorMessage = 'Failed to delete script';
      
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      }
      
      toast.error(errorMessage);
    }
  };

  // Filter scripts based on search term and active tab
  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         script.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    
    const challenge = challenges.find(c => c._id === script.challenge);
    return matchesSearch && challenge && challenge.name.toLowerCase().includes(activeTab.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3">Loading scripts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scripts</h1>
        <button
          onClick={() => setIsUploading(true)}
          className="btn btn-primary flex items-center"
        >
          <Upload className="h-5 w-5 mr-1" />
          Upload Script
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Search scripts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        <div className="flex space-x-1 overflow-x-auto pb-2">
          <button
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'all' 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          {challenges.map(challenge => (
            <button
              key={challenge._id}
              className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === challenge.name.toLowerCase() 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab(challenge.name.toLowerCase())}
            >
              {challenge.name}
            </button>
          ))}
        </div>
      </div>

      {isUploading && (
        <div className="card p-4 mb-6 border-l-4 border-blue-500 animate-fadeIn">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Upload New Script</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Script File
            </label>
            <div className="flex items-center">
              <label className="cursor-pointer bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <span>Select file</span>
                <input
                  type="file"
                  accept=".py,.js,.java,.c,.cpp,.rb,.go,.rs,.php"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                {uploadForm.file ? uploadForm.file.name : 'No file selected'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                className="input"
                placeholder="Script name (e.g., network_scan)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Challenge
              </label>
              <select
                value={uploadForm.challenge}
                onChange={(e) => setUploadForm({ ...uploadForm, challenge: e.target.value })}
                className="input"
              >
                <option value="">Select a challenge</option>
                {challenges.map(challenge => (
                  <option key={challenge._id} value={challenge._id}>
                    {challenge.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Language
              </label>
              <select
                value={uploadForm.language}
                onChange={(e) => setUploadForm({ ...uploadForm, language: e.target.value })}
                className="input"
              >
                <option value="Python">Python</option>
                <option value="JavaScript">JavaScript</option>
                <option value="Java">Java</option>
                <option value="C">C</option>
                <option value="C++">C++</option>
                <option value="Ruby">Ruby</option>
                <option value="Go">Go</option>
                <option value="Rust">Rust</option>
                <option value="PHP">PHP</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Brief description of what the script does"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsUploading(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              className="btn btn-primary"
            >
              Upload
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredScripts.map(script => {
          const challenge = challenges.find(c => c._id === script.challenge);
          const uploadedDate = new Date(script.createdAt).toLocaleDateString();
          
          return (
            <div key={script._id} className="card overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">{script.name}</h3>
                <div className="flex space-x-1">
                  <button
                    className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    title="View details"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-300"
                    title="Delete script"
                    onClick={() => handleDeleteScript(script.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {script.description}
                </p>
                <div className="flex items-center mt-2 text-xs">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 mr-2">
                    {script.language}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 mr-2">
                    {script.filePath?.split('/').pop()}
                  </span>
                </div>
                {challenge && (
                  <div className="flex items-center mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <Link2 className="h-3 w-3 mr-1" />
                    Linked to: <span className="font-medium ml-1 text-blue-600 dark:text-blue-400">{challenge.name}</span>
                  </div>
                )}
              </div>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400">
                Uploaded on {uploadedDate}
              </div>
            </div>
          );
        })}
        
        {filteredScripts.length === 0 && (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No scripts found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {searchTerm 
                  ? `No scripts matching "${searchTerm}"` 
                  : "Upload your first script to get started"}
              </p>
              {!isUploading && (
                <button
                  onClick={() => setIsUploading(true)}
                  className="mt-4 btn btn-primary"
                >
                  Upload Script
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scripts;