import React, { useState, useEffect } from 'react';
import { Code, Copy, Save, Check, X, Edit2, Play, Pause, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
const EditCDC = ({ connectorId }) => {
  const [sourceConfig, setSourceConfig] = useState(null);
  const [targetConfig, setTargetConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [sourceStatus, setSourceStatus] = useState(null);
  const [targetStatus, setTargetStatus] = useState(null);
  
  const [editingSource, setEditingSource] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);
  const [showJsonSource, setShowJsonSource] = useState(false);
  const [showJsonTarget, setShowJsonTarget] = useState(false);
  const [sourceCopied, setSourceCopied] = useState(false);
  const [targetCopied, setTargetCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [activeTab, setActiveTab] = useState('source');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const sampleSourceConfig = {
          "name": "cdc22222222_employee_base",
          "config": {
            "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
            "tasks.max": "1",
            "database.hostname": "postgres-host",
            "database.port": "5432",
            "database.user": "dbuser",
            "database.password": "dbpassword",
            "database.dbname": "employeedb",
            "database.server.name": "H19_POSTGRESQL_employee_base",
            "table.include.list": "employee_base",
            "database.history.kafka.topic": "cdc22222222_employee_base",
            "database.history.kafka.bootstrap.servers": "kafka:9092",
            "snapshot.mode": "Initial",
            "decimal.handling.mode": "double",
          }
        };

        const sampleTargetConfig = {
          "name": "sink_employee_base",
          "config": {
            "connector.class": "io.confluent.connect.jdbc.JdbcSinkConnector",
            "tasks.max": "3",
            "connection.url": "jdbc:postgresql://target-host:5432/employeedb",
            "connection.user": "targetuser",
            "connection.password": "targetpassword",
            "topics": "H19_POSTGRESQL_employee_base.employee_base",
            "insert.mode": "upsert",
            "pk.mode": "record_key",
            "pk.fields": "id",
            "auto.create": "true",
            "auto.evolve": "true",
          }
        };
        
        const sampleSourceStatus = {
          "name": "cdc22222222_employee_base",
          "connector": {
            "state": "RUNNING",
            "worker_id": "kafka-broker1-cdc:8083"
          },
          "tasks": [
            {
              "id": 0,
              "state": "RUNNING",
              "worker_id": "kafka-broker1-cdc:8083"
            }
          ],
          "type": "source"
        };
        
        const sampleTargetStatus = {
          "name": "sink_employee_base",
          "connector": {
            "state": "RUNNING",
            "worker_id": "kafka-broker1-cdc:8083"
          },
          "tasks": [
            {
              "id": 0,
              "state": "RUNNING",
              "worker_id": "kafka-broker1-cdc:8083"
            },
            {
              "id": 1,
              "state": "RUNNING",
              "worker_id": "kafka-broker1-cdc:8083"
            },
            {
              "id": 2,
              "state": "RUNNING",
              "worker_id": "kafka-broker2-cdc:8083"
            }
          ],
          "type": "sink"
        };
        
        setSourceConfig(sampleSourceConfig);
        setTargetConfig(sampleTargetConfig);
        setSourceStatus(sampleSourceStatus);
        setTargetStatus(sampleTargetStatus);
        setLoading(false);
      } catch (err) {
        setError("Failed to load connector configurations");
        setLoading(false);
      }
    };
    
    fetchData();
  }, [connectorId]);
  
  const handleSourceConfigChange = (e) => {
    try {
      const parsed = JSON.parse(e.target.value);
      setSourceConfig(parsed);
    } catch (error) {
      console.error("Invalid JSON", error);
    }
  };

  const handleTargetConfigChange = (e) => {
    try {
      const parsed = JSON.parse(e.target.value);
      setTargetConfig(parsed);
    } catch (error) {
      console.error("Invalid JSON", error);
    }
  };

  const copyToClipboard = (text, isSource) => {
    navigator.clipboard.writeText(JSON.stringify(text, null, 2))
      .then(() => {
        if (isSource) {
          setSourceCopied(true);
          setTimeout(() => setSourceCopied(false), 2000);
        } else {
          setTargetCopied(true);
          setTimeout(() => setTargetCopied(false), 2000);
        }
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEditingSource(false);
      setEditingTarget(false);
      setSaving(false);
      
     toast.success("Configuration saved successfully!");
    } catch (err) {
      setSaving(false);
      setError("Failed to save configuration changes");
    }
  };

  const toggleConnectorStatus = async (connectorName, isSource) => {
    try {

      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (isSource) {
        const newStatus = {...sourceStatus};
        newStatus.connector.state = newStatus.connector.state === "RUNNING" ? "STOPPED" : "RUNNING";
        setSourceStatus(newStatus);
      } else {
        const newStatus = {...targetStatus};
        newStatus.connector.state = newStatus.connector.state === "RUNNING" ? "STOPPED" : "RUNNING";
        setTargetStatus(newStatus);
      }
      
      const currentState = isSource ? 
        sourceStatus.connector.state : targetStatus.connector.state;
     toast.success(`Connector ${currentState === "RUNNING" ? 'stopped' : 'started'} successfully!`);
    } catch (err) {
      setError(`Failed to update connector status`);
    }
  };

  const updateConfigField = (isSource, key, value) => {
    if (isSource) {
      const newConfig = {...sourceConfig};
      newConfig.config[key] = value;
      setSourceConfig(newConfig);
    } else {
      const newConfig = {...targetConfig};
      newConfig.config[key] = value;
      setTargetConfig(newConfig);
    }
  };

  const renderStatusBadge = (status) => {
    if (!status) return null;
    
    const statusColors = {
      "RUNNING": {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: <CheckCircle size={14} className="mr-1" />
      },
      "STOPPED": {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: <Pause size={14} className="mr-1" />
      },
      "FAILED": {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: <XCircle size={14} className="mr-1" />
      },
      "PAUSED": {
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: <Pause size={14} className="mr-1" />
      }
    };
    
    const state = status.connector.state;
    const statusStyle = statusColors[state] || statusColors["FAILED"];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${statusStyle.bg} ${statusStyle.text}`}>
        {statusStyle.icon}
        {state}
      </span>
    );
  };

  const renderConfigFields = (config, isSource) => {
    if (!config) return null;
    
    return (
      <div className="space-y-4">
        {Object.entries(config.config).map(([key, value]) => (
          <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-b border-gray-100 pb-3">
            <label className="text-sm font-medium text-gray-700">
              {key}
            </label>
            <input
              type={key.includes('password') ? 'password' : 'text'}
              value={value}
              onChange={(e) => updateConfigField(isSource, key, e.target.value)}
              disabled={isSource ? !editingSource : !editingTarget}
              className="col-span-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm
                focus:outline-none focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        ))}
      </div>
    );
  };

  const renderTasksTable = (status) => {
    if (!status || !status.tasks || status.tasks.length === 0) return null;
    
    const getStatusClass = (state) => {
      switch (state) {
        case "RUNNING": return "text-green-600 bg-green-50";
        case "FAILED": return "text-red-600 bg-red-50";
        case "STOPPED": return "text-yellow-600 bg-yellow-50";
        default: return "text-gray-600 bg-gray-50";
      }
    };
    
    return (
      <div className="mt-6">
        <h4 className="font-medium text-gray-700 mb-3">Tasks Status</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task ID
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {status.tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {task.id}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(task.state)}`}>
                      {task.state}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {task.worker_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };


  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-600 animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-blue-600 animate-pulse delay-75"></div>
            <div className="w-4 h-4 rounded-full bg-blue-600 animate-pulse delay-150"></div>
          </div>
          <p className="mt-2 text-center text-gray-600">Loading connector configuration...</p>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
          <div className="text-red-500 flex items-center justify-center mb-4">
            <X size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 text-center">{error}</h3>
          <div className="mt-4 flex justify-center">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="bg-white rounded-lg  m-4">

        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Edit Connector Configuration</h2>
            <div className="flex items-center mt-1">
              <span className="text-sm text-gray-500 mr-2">
                ID: {sourceConfig?.name || 'Unknown'}
              </span>
              <span className="text-sm text-gray-400 mx-2">|</span>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Source:</span>
                {renderStatusBadge(sourceStatus)}
              </div>
              <span className="text-sm text-gray-400 mx-2">|</span>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Target:</span>
                {renderStatusBadge(targetStatus)}
              </div>
            </div>
          </div>
         
        </div>

        <div className="border-b border-gray-200">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('source')}
              className={`py-4 px-6 text-sm font-medium relative ${
                activeTab === 'source'
                  ? 'text-[#8e78b7] border-b-2 border-[#8e78b7]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-2 h-6 ${activeTab === 'source' ? 'bg-[#8e78b7]' : 'bg-gray-300'} rounded-sm mr-3`}></div>
                Source Connector
                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({sourceConfig?.config["connector.class"].split('.').pop()})
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('target')}
              className={`py-4 px-6 text-sm font-medium relative ${
                activeTab === 'target'
                  ? 'text-green-500 border-b-2 border-green-400'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-2 h-6 ${activeTab === 'target' ? 'bg-green-400' : 'bg-gray-300'} rounded-sm mr-3`}></div>
                Target Connector
                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({targetConfig?.config["connector.class"].split('.').pop()})
                </span>
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">

          {activeTab === 'source' && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <div className="flex items-center">
                      <h4 className="font-medium text-gray-700">Source Configuration</h4>
                      <div className="ml-3">
                        {renderStatusBadge(sourceStatus)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Topic: {sourceConfig?.config["database.history.kafka.topic"]}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleConnectorStatus(sourceConfig?.name, true)}
                      className={`p-2 rounded-md text-sm flex items-center ${
                        sourceStatus?.connector.state === "RUNNING" 
                        ? 'bg-red-50 text-red-700 hover:bg-red-100' 
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {sourceStatus?.connector.state === "RUNNING" ? (
                        <><Pause size={16} className="mr-1" /> Stop</>
                      ) : (
                        <><Play size={16} className="mr-1" /> Start</>
                      )}
                    </button>
                    <button 
                      onClick={() => setShowJsonSource(!showJsonSource)}
                      className={`p-2 rounded-md text-sm flex items-center ${
                        showJsonSource ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
                      }`}
                      title={showJsonSource ? "Form View" : "JSON View"}
                    >
                      {showJsonSource ? (
                        <><Edit2 size={16} className="mr-1" /> Form View</>
                      ) : (
                        <><Code size={16} className="mr-1" /> JSON View</>
                      )}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(sourceConfig, true)}
                      className="p-2 rounded-md hover:bg-gray-200 text-sm flex items-center"
                      title="Copy Config"
                    >
                      {sourceCopied ? (
                        <><Check size={16} className="mr-1 text-green-500" /> Copied</>
                      ) : (
                        <><Copy size={16} className="mr-1" /> Copy</>
                      )}
                    </button>
                    <button 
                      onClick={() => setEditingSource(!editingSource)}
                      className={`p-2 rounded-md text-sm flex items-center ${
                        editingSource ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
                      }`}
                      title={editingSource ? "Cancel Edit" : "Edit Config"}
                    >
                      {editingSource ? (
                        <><X size={16} className="mr-1" /> Cancel</>
                      ) : (
                        <><Edit2 size={16} className="mr-1" /> Edit</>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  {showJsonSource ? (
                    <div className="relative">
                      <textarea
                        value={JSON.stringify(sourceConfig, null, 2)}
                        onChange={handleSourceConfigChange}
                        readOnly={!editingSource}
                        className="w-full h-96 font-mono text-sm p-4 border border-gray-300 rounded-md bg-white
                          focus:outline-none focus:ring-blue-500 focus:border-blue-500
                          disabled:bg-gray-50"
                      />
                    </div>
                  ) : (
                    <div className={`${editingSource ? '' : ''}`}>
                      {renderConfigFields(sourceConfig, true)}
                    </div>
                  )}
                </div>
                

                {renderTasksTable(sourceStatus)}
              </div>
            </div>
          )}

          {activeTab === 'target' && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <div className="flex items-center">
                      <h4 className="font-medium text-gray-700">Target Configuration</h4>
                      <div className="ml-3">
                        {renderStatusBadge(targetStatus)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Topic: {targetConfig?.config["topics"]}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleConnectorStatus(targetConfig?.name, false)}
                      className={`p-2 rounded-md text-sm flex items-center ${
                        targetStatus?.connector.state === "RUNNING" 
                        ? 'bg-red-50 text-red-700 hover:bg-red-100' 
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {targetStatus?.connector.state === "RUNNING" ? (
                        <><Pause size={16} className="mr-1" /> Stop</>
                      ) : (
                        <><Play size={16} className="mr-1" /> Start</>
                      )}
                    </button>
                    <button 
                      onClick={() => setShowJsonTarget(!showJsonTarget)}
                      className={`p-2 rounded-md text-sm flex items-center ${
                        showJsonTarget ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
                      }`}
                      title={showJsonTarget ? "Form View" : "JSON View"}
                    >
                      {showJsonTarget ? (
                        <><Edit2 size={16} className="mr-1" /> Form View</>
                      ) : (
                        <><Code size={16} className="mr-1" /> JSON View</>
                      )}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(targetConfig, false)}
                      className="p-2 rounded-md hover:bg-gray-200 text-sm flex items-center"
                      title="Copy Config"
                    >
                      {targetCopied ? (
                        <><Check size={16} className="mr-1 text-green-500" /> Copied</>
                      ) : (
                        <><Copy size={16} className="mr-1" /> Copy</>
                      )}
                    </button>
                    <button 
                      onClick={() => setEditingTarget(!editingTarget)}
                      className={`p-2 rounded-md text-sm flex items-center ${
                        editingTarget ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
                      }`}
                      title={editingTarget ? "Cancel Edit" : "Edit Config"}
                    >
                      {editingTarget ? (
                        <><X size={16} className="mr-1" /> Cancel</>
                      ) : (
                        <><Edit2 size={16} className="mr-1" /> Edit</>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  {showJsonTarget ? (
                    <div className="relative">
                      <textarea
                        value={JSON.stringify(targetConfig, null, 2)}
                        onChange={handleTargetConfigChange}
                        readOnly={!editingTarget}
                        className="w-full h-96 font-mono text-sm p-4 border border-gray-300 rounded-md bg-white
                          focus:outline-none focus:ring-blue-500 focus:border-blue-500
                          disabled:bg-gray-50"
                      />
                    </div>
                  ) : (
                    <div className={`${editingTarget ? '' : ''}`}>
                      {renderConfigFields(targetConfig, false)}
                    </div>
                  )}
                </div>
                
                {renderTasksTable(targetStatus)}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex space-x-4">
            <button 
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={saveChanges}
              disabled={(!editingSource && !editingTarget) || saving}
              className={`px-6 py-2 rounded-md shadow-sm text-sm font-medium text-white flex items-center ${
                (editingSource || editingTarget) && !saving
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-blue-400 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCDC;