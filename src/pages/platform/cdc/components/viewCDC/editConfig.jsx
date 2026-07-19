import React, { useState, useEffect, useRef } from 'react';
import { Code, Copy, Save, Check, X, Edit2, Play, Pause, AlertCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../../../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const PASSWORD_MASK = '••••••••';

const ConfigEditorModal = ({
  isOpen,
  onClose,
  configType,
  configData,
  statusData,
  topicName,
}) => {
  const [config, setConfig] = useState(null);
  const [originalConfig, setOriginalConfig] = useState(null);
  const [status, setStatus] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rawJsonText, setRawJsonText] = useState('');
  const [jsonError, setJsonError] = useState(null);
  const { cdcId } = useParams();
  const { token, hostnameV2, project } = useAuth();

  // Track which password fields have been modified by the user
  const [modifiedPasswordFields, setModifiedPasswordFields] = useState(new Set());

  const isPasswordField = (key) => {
    return key.toLowerCase().includes('password');
  };

  // Get all password field keys from config
  const getPasswordFields = (configObj) => {
    if (!configObj) return [];
    return Object.keys(configObj).filter(isPasswordField);
  };

  // Create a display version of config where unmodified passwords are masked
  const getDisplayConfig = (configObj) => {
    if (!configObj) return null;
    const displayConfig = { ...configObj };
    Object.keys(displayConfig).forEach((key) => {
      if (isPasswordField(key) && !modifiedPasswordFields.has(key)) {
        displayConfig[key] = PASSWORD_MASK;
      }
    });
    return displayConfig;
  };

  // Initialize config when modal opens or configData changes while not editing
  useEffect(() => {
    if (configData && !editing) {
      setConfig(configData?.config);
      setOriginalConfig(configData?.config);
      setStatus(statusData);
      setModifiedPasswordFields(new Set());
    }
  }, [configData, statusData, editing]);

  // Handle initial load of configData
  useEffect(() => {
    if (configData && config === null) {
      setConfig(configData?.config);
      setOriginalConfig(configData?.config);
      setStatus(statusData);
      setModifiedPasswordFields(new Set());
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
      setModifiedPasswordFields(new Set());
    }
  }, [isOpen]);

  // Update rawJsonText when switching to JSON view — show masked version
  useEffect(() => {
    if (config && showJson) {
      const displayConfig = getDisplayConfig(config);
      setRawJsonText(JSON.stringify(displayConfig, null, 2));
    }
  }, [showJson]);

  const handleConfigChange = (e) => {
    const jsonText = e.target.value;
    setRawJsonText(jsonText);

    try {
      const parsed = JSON.parse(jsonText);
      setJsonError(null);

      const passwordFields = getPasswordFields(parsed);
      const newModified = new Set(modifiedPasswordFields);

      passwordFields.forEach((key) => {
        const currentValue = parsed[key];
        if (currentValue !== PASSWORD_MASK) {
          newModified.add(key);
        } else {
          newModified.delete(key);
        }
      });

      setModifiedPasswordFields(newModified);

      const realConfig = { ...parsed };
      passwordFields.forEach((key) => {
        if (!newModified.has(key)) {
          if (config && config[key] !== undefined) {
            realConfig[key] = config[key];
          } else if (originalConfig && originalConfig[key] !== undefined) {
            realConfig[key] = originalConfig[key];
          }
        }
      });

      setConfig(realConfig);
    } catch (error) {
      setJsonError(`Invalid JSON: ${error.message}`);
    }
  };

  const updateConfigField = (key, value) => {
    const newConfig = { ...config };
    newConfig[key] = value;
    setConfig(newConfig);

    if (isPasswordField(key)) {
      const newModified = new Set(modifiedPasswordFields);
      if (value !== originalConfig?.[key]) {
        newModified.add(key);
      } else {
        newModified.delete(key);
      }
      setModifiedPasswordFields(newModified);
    }
  };

  const copyToClipboard = () => {
    const displayConfig = getDisplayConfig(config);
    navigator.clipboard
      .writeText(JSON.stringify(displayConfig, null, 2))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  };

  const updateConnectorConfig = async () => {
    try {
      const connector_name = configData?.name;
      const response = await axios.patch(
        `${hostnameV2}/cdc/${cdcId}/update-connector`,
        {
          type: configType,
          config: config,
          connector_name,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Connector updated successfully!");
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
      setOriginalConfig({ ...config });
      setModifiedPasswordFields(new Set());

      if (showJson) {
        const displayConfig = getDisplayConfig(config);
        setRawJsonText(JSON.stringify(displayConfig, null, 2));
      }
    } catch (err) {
      setSaving(false);
      console.error("Error saving config:", err);
    }
  };

  const handleCancelEdit = () => {
    setConfig({ ...originalConfig });
    setModifiedPasswordFields(new Set());
    setJsonError(null);
    setEditing(false);

    if (showJson) {
      const displayConfig = getDisplayConfig(originalConfig);
      setRawJsonText(JSON.stringify(displayConfig, null, 2));
    }
  };

  const handleToggleView = () => {
    if (!showJson) {
      const displayConfig = getDisplayConfig(config);
      setRawJsonText(JSON.stringify(displayConfig, null, 2));
    }
    setShowJson(!showJson);
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
    ]),
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
                type={isPasswordField(key) ? 'password' : 'text'}
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
                    onClick={handleToggleView}
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
                {showJson ? renderJsonEditor() : <div>{renderConfigFields()}</div>}
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