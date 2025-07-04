import React, { useState, useEffect } from 'react';
import { Play, X, Plus, ChevronDown, CheckCircle2, XCircle, Clock, Search, Filter, Info, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate } from 'react-router-dom';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="text-center py-12">
      <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium">Something went wrong</h3>
      <pre className="text-[var(--text-secondary)] mt-1">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="btn btn-primary mt-4"
      >
        Try again
      </button>
    </div>
  );
}

const Executions = () => {
  const navigate = useNavigate();
  const backendURL = import.meta.env.VITE_Backend_URL;
  const token = localStorage.getItem('Hactify-Auth-token');

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const headers = {
    'Content-Type': 'application/json',
    'Auth-token': token
  };

  const [scripts, setScripts] = useState([]);
  const [userIpMappings, setUserIpMappings] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState({
    scripts: true,
    userIpMappings: true,
    executions: true
  });
  const [error, setError] = useState({
    scripts: null,
    userIpMappings: null,
    executions: null
  });

  // Modal states
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [selectedScript, setSelectedScript] = useState('');
  const [selectedUserIPs, setSelectedUserIPs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showOutputModal, setShowOutputModal] = useState(false);
  const [currentOutput, setCurrentOutput] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [currentError, setCurrentError] = useState('');

  // Excel modal states
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelScript, setExcelScript] = useState('');

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        // Fetch scripts
        const scriptsResponse = await fetch(`${backendURL}/api/scripts/`, {
          headers
        });
        const scriptsData = await scriptsResponse.json();
        if (scriptsData.success) {
          setScripts(scriptsData.scripts || []);
        } else {
          setError(prev => ({ ...prev, scripts: 'Failed to load scripts' }));
        }

        // Fetch user IP mappings
        const userIpResponse = await fetch(`${backendURL}/api/userIpMapping/`, {
          headers
        });
        const userIpData = await userIpResponse.json();
        setUserIpMappings(userIpData || []);

        // Fetch executions
        const executionsResponse = await fetch(`${backendURL}/api/executions/`, {
          headers
        });
        const executionsData = await executionsResponse.json();
        if (executionsData.success) {
          setExecutions(executionsData.executions || []);
        } else {
          setError(prev => ({ ...prev, executions: 'Failed to load executions' }));
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError({
          scripts: err.message,
          userIpMappings: err.message,
          executions: err.message
        });
      } finally {
        setLoading({
          scripts: false,
          userIpMappings: false,
          executions: false
        });
      }
    };

    fetchData();
  }, []);

  const handleShowError = (error) => {
    setCurrentError(error);
    setShowErrorModal(true);
  };

  const handleShowOutput = (output) => {
    setCurrentOutput(output);
    setShowOutputModal(true);
  };

  const handleAddUserIP = () => {
    setSelectedUserIPs([...selectedUserIPs, { userId: '', ips: [] }]);
  };

  const handleUserChange = (index, userId) => {
    const newSelectedUserIPs = [...selectedUserIPs];
    newSelectedUserIPs[index] = { userId, ips: [] };
    setSelectedUserIPs(newSelectedUserIPs);
  };

  const handleIPChange = (index, selectedOptions) => {
    const newSelectedUserIPs = [...selectedUserIPs];
    const selectedIPs = Array.from(selectedOptions, option => option.value);
    newSelectedUserIPs[index].ips = selectedIPs;
    setSelectedUserIPs(newSelectedUserIPs);
  };

  const handleRemoveUserIP = (index) => {
    setSelectedUserIPs(selectedUserIPs.filter((_, i) => i !== index));
  };

  const handleExecute = async () => {
    if (!selectedScript) {
      toast.error('Please select a script');
      return;
    }

    if (selectedUserIPs.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    if (selectedUserIPs.some(item => !item.userId || item.ips.length === 0)) {
      toast.error('Please fill in all user and IP selections');
      return;
    }

    const toastId = toast.loading('Starting script execution...');
    setIsExecuting(true);

    try {
      // Get the script name and user emails before execution for optimistic update
      const script = scripts.find(s => s._id === selectedScript);
      const users = selectedUserIPs.map(item => {
        const user = usersWithIPs.find(u => u._id === item.userId);
        return {
          userId: item.userId,
          email: user?.email || 'Unknown User',
          ips: item.ips,
          description: user?.ipAddresses
            ?.filter(ip => item.ips.includes(ip.ip))
            ?.map(ip => ip.description)
            ?.join(', ') || ''
        };
      });

      // Create optimistic execution data
      const optimisticExecution = {
        _id: `temp-${Date.now()}`,
        script: {
          _id: selectedScript,
          name: script?.name || 'Loading...'
        },
        status: 'running',
        createdAt: new Date().toISOString(),
        targets: users.map(user => ({
          user: {
            _id: user.userId,
            email: user.email
          },
          ips: user.ips,
          status: 'running',
          description: user.description
        }))
      };

      // Add optimistic execution to state
      setExecutions(prev => [optimisticExecution, ...prev]);

      // Prepare the actual execution data
      const executionData = {
        scriptId: selectedScript,
        targets: selectedUserIPs.map(item => {
          const user = usersWithIPs.find(u => u._id === item.userId);
          return {
            userId: item.userId,
            userEmail: user?.email || 'unknown@example.com',
            ips: item.ips,
            description: user?.ipAddresses
              ?.filter(ip => item.ips.includes(ip.ip))
              ?.map(ip => ip.description)
              ?.join(', ') || ''
          };
        })
      };

      // Call the API to execute the script
      const response = await fetch(`${backendURL}/api/executions/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Auth-token': token
        },
        body: JSON.stringify(executionData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to execute script');
      }

      // Show success message
      toast.success('Script execution started successfully', { id: toastId });

      // Close the modal immediately after successful API call
      setShowExecuteModal(false);

      // Refetch executions to get complete data
      const executionsResponse = await fetch(`${backendURL}/api/executions/`, {
        headers
      });
      const executionsData = await executionsResponse.json();

      if (executionsData.success) {
        setExecutions(executionsData.executions || []);
      }

      // Reset form
      setSelectedScript('');
      setSelectedUserIPs([]);

    } catch (error) {
      console.error('Execution error:', error);
      toast.error(error.message || 'Failed to execute script', { id: toastId });
      // Remove the optimistic update if execution failed
      setExecutions(prev => prev.filter(exec => !exec._id.startsWith('temp-')));
    } finally {
      setIsExecuting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setExcelFile(file);
      setExcelFileName(file.name);
    }
  };

  const handleExcelUpload = async () => {
    if (!excelScript) {
      toast.error('Please select a script');
      return;
    }

    if (!excelFile) {
      toast.error('Please upload an Excel file');
      return;
    }

    const toastId = toast.loading('Starting execution from Excel...');
    setIsExecuting(true);

    const formData = new FormData();
    formData.append('excelFile', excelFile);
    formData.append('scriptId', excelScript);

    try {
      const response = await fetch(`${backendURL}/api/executions/execute-from-excel`, {
        method: 'POST',
        headers: {
          'Auth-token': token
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to execute from Excel');
      }

      toast.success('Script execution started from Excel file', { id: toastId });
      setShowExcelModal(false);
      setExcelFile(null);
      setExcelFileName('');
      setExcelScript('');

      // Refresh executions
      const executionsResponse = await fetch(`${backendURL}/api/executions/`, {
        headers
      });
      const executionsData = await executionsResponse.json();
      if (executionsData.success) {
        setExecutions(executionsData.executions || []);
      }

    } catch (error) {
      console.error('Excel upload error:', error);
      toast.error(error.message || 'Failed to process Excel file', { id: toastId });
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-500';
      case 'failed':
        return 'bg-red-500/20 text-red-500';
      case 'running':
        return 'bg-blue-500/20 text-blue-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatExecutionData = (execution) => {
    if (!execution) return null;

    return {
      id: execution._id || 'unknown-id',
      scriptName: execution.script?.name || 'Unknown Script',
      status: execution.status || 'unknown',
      timestamp: execution.createdAt || new Date().toISOString(),
      duration: execution.duration || 'N/A',
      targets: (execution.targets || []).map(target => ({
        userId: target.user?._id || 'unknown-user',
        user: target.user?.email || 'Unknown User',
        ips: target.ips || [],
        status: target.status || 'unknown',
        error: target.error || 'No error',
        output: target.output || 'No output available',
        description: target.description || 'No description',
        challengeResponse: target.challengeResponse || null
      }))
    };
  };

  const usersWithIPs = (userIpMappings || []).reduce((acc, mapping) => {
    if (!mapping || !mapping.user) return acc;

    const existingUser = acc.find(user => user._id === mapping.user._id);
    const ipInfo = {
      ip: mapping.ip || '0.0.0.0',
      description: mapping.description || '',
      subnet: mapping.subnet || ''
    };

    if (existingUser) {
      existingUser.ipAddresses.push(ipInfo);
    } else {
      acc.push({
        _id: mapping.user._id,
        email: mapping.user.email || 'unknown@example.com',
        role: mapping.user.role || 'user',
        ipAddresses: [ipInfo]
      });
    }
    return acc;
  }, []);

  const filteredExecutions = (executions || [])
    .map(formatExecutionData)
    .filter(execution => execution !== null)
    .filter(execution => {
      const matchesSearch = execution.scriptName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        execution.targets.some(target =>
          target.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
          target.ips.some(ip => ip.includes(searchTerm)) ||
          target.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus = statusFilter === 'all' || execution.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (loading.scripts || loading.userIpMappings || loading.executions) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (error.scripts || error.userIpMappings || error.executions) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium">Error loading data</h3>
        <p className="text-[var(--text-secondary)] mt-1">
          {error.scripts || error.userIpMappings || error.executions}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary mt-4"
        >
          Reload
        </button>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Script Executions</h1>
        <div className="flex items-center gap-3">
          {executions.some(e => e.status === 'running') && (
            <div className="flex items-center text-sm text-blue-500">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
              {executions.filter(e => e.status === 'running').length} running
            </div>
          )}
          <button
            className="btn btn-secondary flex items-center"
            onClick={() => setShowExcelModal(true)}
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload Excel
          </button>
          <button
            className="btn btn-primary flex items-center"
            onClick={() => setShowExecuteModal(true)}
          >
            <Play className="h-5 w-5 mr-2" />
            Execute Script
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search executions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--text-secondary)]" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-[var(--text-secondary)]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input min-w-[120px]"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredExecutions.map(execution => (
          <div key={execution.id} className="card overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(execution.status)}
                  <div>
                    <h3 className="font-medium">{execution.scriptName}</h3>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {formatDate(execution.timestamp)}
                    </span>
                  </div>
                </div>
                <span className={`badge ${getStatusClass(execution.status)}`}>
                  {execution.status}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-4 mb-4">
                <div>
                  <span className="text-sm text-[var(--text-secondary)]">Duration</span>
                  <p className="font-medium">{execution.duration}</p>
                </div>
                <div>
                  <span className="text-sm text-[var(--text-secondary)]">Targets</span>
                  <div className="space-y-1">
                    {execution.targets.map((target, index) => (
                      <div key={index}>
                        <p className="font-medium">{target.user}</p>
                        <div className="pl-2">
                          {target.ips.map((ip, ipIndex) => (
                            <p key={ipIndex} className="text-sm">
                              {ip} {target.description && `(${target.description})`}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-[var(--text-secondary)]">Output</span>
                  <div className="space-y-1">
                    {execution.targets.map((target, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <p className="font-medium truncate flex-1" title={target.output}>
                          {target.output}
                        </p>
                        <button
                          onClick={() => handleShowOutput(target.output)}
                          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          aria-label="View full output"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-[var(--text-secondary)]">Error</span>
                  <div className="space-y-1">
                    {execution.targets.map((target, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <p className="font-medium truncate flex-1" title={target.error}>
                          {target.error}
                        </p>
                        {target.error && target.error !== 'No error' && (
                          <button
                            onClick={() => handleShowError(target.error)}
                            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            aria-label="View full error"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-[var(--text-secondary)]">Challenge Response</span>
                  <div className="space-y-1">
                    {execution.targets.map((target, index) => (
                      <div key={index}>
                        {target.challengeResponse ? (
                          <div className="text-sm">
                            <p className="font-medium">
                              Status: {target.challengeResponse.statusCode}
                            </p>
                            <p className="truncate" title={target.challengeResponse.message}>
                              {target.challengeResponse.message}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--text-secondary)]">No response</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredExecutions.length === 0 && (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-4" />
            <h3 className="text-lg font-medium">No executions found</h3>
            <p className="text-[var(--text-secondary)] mt-1">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Execute your first script to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Output Modal */}
      {showOutputModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--background)] rounded-lg p-6 w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Full Output</h3>
              <button
                onClick={() => setShowOutputModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-[var(--background-secondary)] p-4 rounded flex-1 overflow-auto">
              <pre className="whitespace-pre-wrap break-words text-sm">
                {currentOutput || 'No output available'}
              </pre>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowOutputModal(false)}
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--background)] rounded-lg p-6 w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Full Error Details</h3>
              <button
                onClick={() => setShowErrorModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-[var(--background-secondary)] p-4 rounded flex-1 overflow-auto">
              <pre className="whitespace-pre-wrap break-words text-sm text-red-500">
                {currentError || 'No error details available'}
              </pre>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execute Script Modal */}
      {showExecuteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--background)] rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium">Execute Script</h3>
              <button
                onClick={() => setShowExecuteModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                disabled={isExecuting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Select Script</label>
                <div className="relative">
                  <select
                    value={selectedScript}
                    onChange={(e) => setSelectedScript(e.target.value)}
                    className="input pr-10 appearance-none"
                    disabled={isExecuting}
                  >
                    <option value="">Select a script</option>
                    {scripts.map(script => (
                      <option key={script._id || script.id} value={script._id || script.id}>
                        {script.name} ({script.language})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--text-secondary)]" />
                </div>
                {selectedScript && (
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {scripts.find(s => (s._id || s.id) === selectedScript)?.description}
                  </p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Selected Users & IPs</label>
                  <button
                    className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center"
                    onClick={handleAddUserIP}
                    disabled={isExecuting}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add User
                  </button>
                </div>

                {selectedUserIPs.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)] text-center py-4">
                    No users selected
                  </p>
                ) : (
                  // Updated IP selection component in the Execute Script Modal
                  <div className="space-y-3">
                    {selectedUserIPs.map((item, index) => (
                      <div key={index} className="flex gap-4 items-start">
                        <div className="flex-1">
                          <select
                            value={item.userId}
                            onChange={(e) => handleUserChange(index, e.target.value)}
                            className="input"
                            disabled={isExecuting}
                          >
                            <option value="">Select a user</option>
                            {usersWithIPs.map(user => (
                              <option key={user._id} value={user._id}>
                                {user.email}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-1">
                          {item.userId ? (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-[var(--background-secondary)] max-h-32 overflow-y-auto">
                                {usersWithIPs.find(u => u._id === item.userId)?.ipAddresses.map((ip, i) => (
                                  <label key={i} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={item.ips?.includes(ip.ip) || false}
                                      onChange={(e) => {
                                        const newSelectedUserIPs = [...selectedUserIPs];
                                        const currentIPs = newSelectedUserIPs[index].ips || [];

                                        if (e.target.checked) {
                                          newSelectedUserIPs[index].ips = [...currentIPs, ip.ip];
                                        } else {
                                          newSelectedUserIPs[index].ips = currentIPs.filter(existingIp => existingIp !== ip.ip);
                                        }

                                        setSelectedUserIPs(newSelectedUserIPs);
                                      }}
                                      className="rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                                    />
                                    <span className="text-sm">
                                      {ip.ip} - {ip.description}
                                    </span>
                                  </label>
                                ))}
                              </div>
                              <div className="text-xs text-[var(--text-secondary)]">
                                Selected: {item.ips?.length || 0} IPs
                              </div>
                            </div>
                          ) : (
                            <div className="input text-[var(--text-secondary)] flex items-center justify-center h-full">
                              Select a user first
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemoveUserIP(index)}
                          className="text-red-500 hover:text-red-600 mt-1"
                          disabled={isExecuting}
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowExecuteModal(false)}
                  className="btn btn-secondary"
                  disabled={isExecuting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecute}
                  className="btn btn-primary flex items-center"
                  disabled={!selectedScript || selectedUserIPs.length === 0 || isExecuting}
                >
                  {isExecuting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Execute ({selectedUserIPs.reduce((total, item) => total + (item.ips?.length || 0), 0)} IPs)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Upload Modal */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--background)] rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium">Execute from Excel</h3>
              <button
                onClick={() => {
                  setShowExcelModal(false);
                  setExcelFile(null);
                  setExcelFileName('');
                }}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                disabled={isExecuting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Select Script</label>
                <div className="relative">
                  <select
                    value={excelScript}
                    onChange={(e) => setExcelScript(e.target.value)}
                    className="input pr-10 appearance-none"
                    disabled={isExecuting}
                  >
                    <option value="">Select a script</option>
                    {scripts.map(script => (
                      <option key={script._id || script.id} value={script._id || script.id}>
                        {script.name} ({script.language})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--text-secondary)]" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Upload Excel File</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1">
                    <div className={`input cursor-pointer flex items-center justify-between ${isExecuting ? 'opacity-50' : ''}`}>
                      <span className="truncate">
                        {excelFileName || 'Choose file...'}
                      </span>
                      <span className="text-[var(--text-secondary)]">Browse</span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      disabled={isExecuting}
                    />
                  </label>
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  File format: Excel with IP, UserEmail, and Description columns
                </p>
                <a
                  href="/sample-execution-template.xlsx"
                  download
                  className="text-sm text-[var(--primary)] hover:underline mt-1 inline-block"
                >
                  Download sample template
                </a>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowExcelModal(false);
                    setExcelFile(null);
                    setExcelFileName('');
                  }}
                  className="btn btn-secondary"
                  disabled={isExecuting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExcelUpload}
                  className="btn btn-primary flex items-center"
                  disabled={!excelScript || !excelFile || isExecuting}
                >
                  {isExecuting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Execute from Excel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ExecutionsWithErrorBoundary() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Executions />
    </ErrorBoundary>
  );
}