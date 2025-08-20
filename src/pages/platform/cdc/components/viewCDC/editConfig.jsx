import React, { useState, useEffect } from 'react';
import { Code, Copy, Save, Check, X, Edit2, Play, Pause, AlertCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../../../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';
const ConfigEditorModal = ({
  isOpen,
  onClose,
  configType,
  configData,
  statusData,
  topicName,
//   onSave,
//   onToggleStatus
}) => {
  const [config, setConfig] = useState(null);
  const [originalConfig, setOriginalConfig] = useState(null); // Store original config for comparison
  const [status, setStatus] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rawJsonText, setRawJsonText] = useState('');
  const [jsonError, setJsonError] = useState(null);
  const { cdcId } = useParams();
  const {token, hostnameV2, project}= useAuth()

  // Initialize config when modal opens or configData changes while not editing
  useEffect(() => {
    if (configData && !editing) {
      setConfig(configData?.config);
      setOriginalConfig(configData?.config); // Store original for reset functionality
      setStatus(statusData);
    }
  }, [configData, statusData, editing]);

  // Handle initial load of configData
  useEffect(() => {
    if (configData && config === null) {
      setConfig(configData?.config);
      setOriginalConfig(configData?.config);
      setStatus(statusData);
    }
  }, [configData, statusData, config]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Reset editing state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditing(false);
      setShowJson(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (config && showJson) {
      setRawJsonText(JSON.stringify(config, null, 2));
    }
  }, [showJson, config]);

  const handleConfigChange = (e) => {
    const jsonText = e.target.value;
    setRawJsonText(jsonText);

    try {
      const parsed = JSON.parse(jsonText);
      setConfig(parsed);
      setJsonError(null);
    } catch (error) {
      setJsonError(`Invalid JSON: ${error.message}`);
    }
  };

  const updateConfigField = (key, value) => {
    const newConfig = {...config};
    newConfig[key] = value;
    setConfig(newConfig);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  const updateConnectorConfig = async () => {
    try {
      const connector_name = configData?.name;
      console.log("connector_name:", connector_name);
      console.log("configType:", configType);
      const response = await axios.patch(
        `${hostnameV2}/cdc/${cdcId}/update-connector`,
        {
          type: configType,
          config: config,
          connector_name
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      toast.success("Connector updated successfully!");
      console.log("Response:", response.data);
      return response.data;
    } catch (error) {
      toast.error("Error updating connector!");
      if (error.response && error.response.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Network error or server not reachable');
      }
    }
  };

  const handleSave = async () => {
    try {
      if (showJson && jsonError) {
        toast.error("Cannot save invalid JSON. Please fix errors first.");
        return;
      }

      setSaving(true);
      await updateConnectorConfig();
      setEditing(false);
      setSaving(false);
      // Update the original config after successful save
      setOriginalConfig({...config});
    } catch (err) {
      setSaving(false);
      console.error("Error saving config:", err);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original config and exit edit mode
    setConfig({...originalConfig});
    setRawJsonText(JSON.stringify(originalConfig, null, 2));
    setJsonError(null);
    setEditing(false);
  };

  const NON_EDITABLE_FIELDS = {
    source: new Set([
      'connector.class',
      'tasks.max',
      'schema.history.internal.kafka.bootstrap.servers',
      'topic.prefix',
      'schema.history.internal.kafka.topic',
      'decimal.handling.mode'
    ]),
    target: new Set([
      'connector.class',
      'bootstrap.servers',
      'topics',
      'schema.evolution'
    ])
  };

  const renderConfigFields = () => {
    if (!config) return null;
    const nonEditableSet = configType === 'source'
      ? NON_EDITABLE_FIELDS.source
      : NON_EDITABLE_FIELDS.target;

    return (
      <div className="space-y-4">
        {Object.entries(config).map(([key, value]) => {
          const locked = nonEditableSet.has(key);
          return (
            <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-b border-gray-100 pb-3">
              <label className="text-sm font-medium text-gray-700">
                {key}
              </label>
              <input
                type={key.includes('password') ? 'password' : 'text'}
                value={value}
                onChange={(e) => updateConfigField(key, e.target.value)}
                disabled={!editing || locked}
                title={locked ? 'This field cannot be edited' : ''}
                className={`col-span-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500
                  disabled:bg-gray-50 disabled:text-gray-500 ${locked ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderJsonEditor = () => {
    return (
      <div className="relative">
        <textarea
          value={rawJsonText}
          onChange={handleConfigChange}
          readOnly={!editing}
          className={`w-full h-96 font-mono text-sm p-4 border rounded-md bg-white
            focus:outline-none focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 ${jsonError ? 'border-red-500' : 'border-gray-300'}`}
        />
        {editing && jsonError && (
          <div className="mt-2 text-red-600 text-sm flex items-start">
            <AlertCircle size={16} className="mr-1 mt-0.5" />
            <span>{jsonError}</span>
          </div>
        )}
        {editing && !jsonError && (
          <div className="mt-2 text-green-600 text-sm flex items-center">
            <Check size={16} className="mr-1" />
            <span>Valid JSON format</span>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-screen overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Edit {configType === 'source' ? 'Source' : 'Target'} Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="flex items-center">
                    <h4 className="font-medium text-gray-700">
                      {configType === 'source' ? 'Source' : 'Target'} Configuration
                    </h4>
                  </div>
                  {topicName && (
                    <p className="text-sm text-gray-500 mt-1">
                      Topic: {topicName}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowJson(!showJson)}
                    className={`p-2 rounded-md text-sm flex items-center ${
                      showJson ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
                    }`}
                    title={showJson ? "Form View" : "JSON View"}
                  >
                    {showJson ? (
                      <><Edit2 size={16} className="mr-1" /> Form View</>
                    ) : (
                      <><Code size={16} className="mr-1" /> JSON View</>
                    )}
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 rounded-md hover:bg-gray-200 text-sm flex items-center"
                    title="Copy Config"
                  >
                    {copied ? (
                      <><Check size={16} className="mr-1 text-green-500" /> Copied</>
                    ) : (
                      <><Copy size={16} className="mr-1" /> Copy</>
                    )}
                  </button>
                  <button
                    onClick={() => editing ? handleCancelEdit() : setEditing(true)}
                    className={`p-2 rounded-md text-sm flex items-center ${
                      editing ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
                    }`}
                    title={editing ? "Cancel Edit" : "Edit Config"}
                  >
                    {editing ? (
                      <><X size={16} className="mr-1" /> Cancel</>
                    ) : (
                      <><Edit2 size={16} className="mr-1" /> Edit</>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4">
                {showJson ? (
                  renderJsonEditor()
                ) : (
                  <div>
                    {renderConfigFields()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editing || saving || (showJson && jsonError)}
              className={`px-6 py-2 rounded-md shadow-sm text-sm font-medium text-white flex items-center ${
                editing && !saving && !(showJson && jsonError)
                ? 'bg-[#8e78b7] hover:bg-gray-400'
                : 'bg-[#8e78b7] cursor-not-allowed opacity-60'
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

export default ConfigEditorModal;