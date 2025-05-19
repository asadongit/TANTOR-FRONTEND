import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "../../../../context/AuthContext";
import { X, ChevronDown, Search} from "lucide-react";
import toast from "react-hot-toast";
import { connectorConfig } from "./connectorConfig"; 
import Modal from "../../cdc/components/Modal";
import { useAllConnectionData } from "../../../../hooks/platform/connection";

const ConnectionWizard = ({editConnectionData , closeLocalModal}) => {
/*
 * Create or Edit a connection.
 */
  const isEditMode = !!editConnectionData;
  const { data: connections = [], isLoading: isConnectionsLoading, error: connectionsError, refetch: refetchConnections} = useAllConnectionData();
  const connectionNames = useMemo(() => {
    return connections.map(connection => connection.connection_name.toLowerCase());
  }, [connections]);
  const { token, hostnameV1, decodedToken, project } = useAuth();
  const [activeModal, setActiveModal] = useState(isEditMode ? 'details' : 'selection');
  const [selectedConnector, setSelectedConnector] = useState(isEditMode ? editConnectionData?.connection_type : null);
  const [searchQuery, setSearchQuery] = useState("");
  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  const defaultFormData = {
    created_by: decodedToken.preferred_username,
    connection_type: "",
    connection_name: "",
    description: "",
    host_address: "",
    username: "",
    port_number: 0, 
    database_name: "",
    password: "",
    pool_type: "",
    project: project,
    status: "fetching",
    source_schema: "",
    service_principal: "",
    client_principal: "",
    role: "",
    warehouse: "",
    aws_access_key_password: "",
    aws_secret_key_password: "",
    object_store_endpoint: "",
    region_name: "",
    url: "",
    extra_info: {
      role: "",       
      warehouse: "",  
    }
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (isEditMode && editConnectionData) {
      const extra_info = editConnectionData.extra_info || {};
      
      setFormData({
        ...defaultFormData,
        ...editConnectionData,
        extra_info: {
          ...defaultFormData.extra_info,
          ...extra_info
        }
      });
      
      setSelectedConnector(editConnectionData.connection_type);
    }
  }, [isEditMode, editConnectionData]);



  const connectorCards = Object.keys(connectorConfig).map(connectorName => ({
    title: connectorName,
    icon: connectorConfig[connectorName].icon
  }));


  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));

    if (name.startsWith("extra_info.")) {
      const key = name.split(".")[1]; 
      setFormData(prev => ({
        ...prev,
        extra_info: {
          ...prev.extra_info,
          [key]: value,
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    validateField(name, value);
  };

  const [isTestSuccessful, setIsTestSuccessful] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const regexValidName = /^(?!_)(?!.*_$)[A-Za-z][A-Za-z0-9]*(_[A-Za-z0-9]+)*$/i;

  const validateField = (name, value) => {
    let newErrors = { ...errors };
    
    if (name === "connection_name") {
      if (!value) {
        newErrors[name] = "Connection name is required";
      }else if (!regexValidName.test(value)) {
        newErrors.connection_name = 'Connection names must start with a letter, end with a letter or digit, and contain only letters, numbers, and underscores. No leading or trailing underscores allowed.';
      }
       else if (!isEditMode && connectionNames.includes(value.toLowerCase())) {
        newErrors[name] = "Connection name already exists";
      } else if (isEditMode && 
                value.toLowerCase() !== editConnectionData.connection_name.toLowerCase() && 
                connectionNames.includes(value.toLowerCase())) {
        newErrors[name] = "Connection name already exists";
      } else {
        delete newErrors[name];
      }
    } 
    else if (name.startsWith("extra_info.")) {
      const key = name.split(".")[1];
      const field = getConnectorFields(selectedConnector).find(f => f.name === name);
      
      if (field && field.required && !value) {
        newErrors[name] = `${field.label} is required`;
      } else {
        delete newErrors[name];
      }
    } 
    else if (name === "description" && !value) {
      newErrors[name] = "Description is required";
    } else if (name === "pool_type" && !value) {
      newErrors[name] = "Behaviour is required";
    } 
    else {
      const field = getConnectorFields(selectedConnector).find(f => f.name === name);
      
      if (field && field.required && !value) {
        newErrors[name] = `${field.label} is required`;
      } else {
        delete newErrors[name];
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    let newErrors = {};
    let allTouched = {};
    
    if (!formData.connection_name) {
      newErrors.connection_name = "Connection name is required";
    } else if (!isEditMode && connectionNames.includes(formData.connection_name.toLowerCase())) {
      newErrors.connection_name = "Connection name already exists";
    } else if (isEditMode && 
              formData.connection_name.toLowerCase() !== editConnectionData.connection_name.toLowerCase() && 
              connectionNames.includes(formData.connection_name.toLowerCase())) {
      newErrors.connection_name = "Connection name already exists";
    }
    
    allTouched.connection_name = true;
    
    if (!formData.description) {
      newErrors.description = "Description is required";
      allTouched.description = true;
    }
    
    if (!formData.pool_type) {
      newErrors.pool_type = "Behaviour is required";
      allTouched.pool_type = true;
    }
    
    const connectorFields = getConnectorFields(selectedConnector);
    
    connectorFields.forEach(field => {
      if (field.required) {
        let value;
        
        if (field.name.startsWith("extra_info.")) {
          const key = field.name.split(".")[1];
          value = formData.extra_info[key];
        } else {
          value = formData[field.name];
        }
        
        if (!value) {
          newErrors[field.name] = `${field.label} is required`;
          allTouched[field.name] = true;
        }
      }
    });
    
    setErrors(newErrors);
    setTouchedFields(prev => ({...prev, ...allTouched}));
    
    return Object.keys(newErrors).length === 0;
  };

  const filteredConnectors = connectorCards.filter(card => 
    card.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = (modalName, data = null) => {
    setActiveModal(modalName);
    if (data) {
      setSelectedConnector(data);
    }
    
    if (modalName === "details" && selectedConnector) {
      setFormData(prev => ({
        ...prev,
        connection_type: selectedConnector
      }));
    }
  };

  const closeInternalModal = () => {
    setActiveModal(null);
    setErrors({});
    setTouchedFields({});
  };
  
  const handleCompleteClose = () => {
    closeInternalModal();
    
    if (closeLocalModal) {
      closeLocalModal("modal1");
      
      if (isEditMode) {
        closeLocalModal("modal2");
      }
    }
    
  };

  const getConnectorFields = (connectorType) => {
    if (!connectorType || !connectorConfig[connectorType]) {
      return [];
    }
    
    return connectorConfig[connectorType].fields;
  };
  const testConnection = async () => {
    const isValid = validateForm();
    
    if (!isValid) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    const filteredFormData = Object.fromEntries(
      Object.entries(formData).filter(
        ([key, value]) => 
          !["created_by", "pool_type", "status", "project","created_at","updated_at","is_deleted","table_count","connection_id"].includes(key) && value !== null
      )
    );
    setIsTesting(true);

    try {
      const response = await fetch(`${hostnameV1}/test-connection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(filteredFormData),
      });

      if (response.ok) {
        setIsTestSuccessful(true);
        toast.success("Connection test successful");
      } else {
        const errorData = await response.json();
        toast.error(`Connection test failed: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const saveConnection = async () => {
    const isValid = validateForm();
  
    if (!isValid) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    if (!isTestSuccessful) {
      toast.warning("Please run a successful test first");
      return;
    }

    const isDuplicate = !isEditMode && connectionNames.includes(formData.connection_name.toLowerCase());
    const isNameChanged = isEditMode && formData.connection_name.toLowerCase() !== editConnectionData.connection_name.toLowerCase();
    const isDuplicateOnEdit = isNameChanged && connectionNames.includes(formData.connection_name.toLowerCase());

    if (isDuplicate || isDuplicateOnEdit) {
      setErrors(prev => ({
        ...prev,
        connection_name: "Connection name already exists"
      }));
      setTouchedFields(prev => ({
        ...prev,
        connection_name: true
      }));
      toast.error("Connection name already exists");
      return;
    }

    const filteredFormData = Object.fromEntries(
      Object.entries(formData).filter(
        ([key, value]) => 
          !["created_at", "updated_at", "is_deleted", "table_count", "connection_id"].includes(key) && value !== null
      )
    );

    setIsLoading(true);

    try {
      const endpoint = isEditMode 
        ? `${hostnameV1}/connection-saves/${editConnectionData.connection_id}`
        : `${hostnameV1}/create-connection`;
      
      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(filteredFormData),
      });

      if (response.ok) {
        toast.success(isEditMode 
          ? "Connection updated successfully" 
          : "Connection created successfully"
        );
        
        if (!isEditMode) {
          setFormData(defaultFormData);
          setIsTestSuccessful(false);
          setErrors({});
          setTouchedFields({});
        }
        openModal("success");
        refetchConnections();
      } else {
        const errorData = await response.json();
        
        if (errorData.message?.toLowerCase().includes("already exists") || 
            errorData.message?.toLowerCase().includes("duplicate")) {
          setErrors(prev => ({
            ...prev,
            connection_name: "Connection name already exists"
          }));
          setTouchedFields(prev => ({
            ...prev,
            connection_name: true
          }));
          toast.error("Connection name already exists");
        } else {
          toast.error(`Save failed: ${errorData.message || "Unknown error"}`);
        }
      }
    } catch (error) {
      toast.error(`Save failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderConnectorSelectionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-5xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Icon
              className="h-5 w-5 text-[#8e78b7]"
              icon="material-symbols-light:cable-rounded"
            />
            <h2 className="text-xl font-bold text-[#8e78b7]">
              {isEditMode ? "Edit Connector" : "Add Connector"}
            </h2>
          </div>
          <button
            onClick={handleCompleteClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <label className="block text-lg font-semibold text-gray-800 mb-2">
          Connect your data
        </label>
        
        <div className="relative max-w-md mb-4">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-500" />
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full p-2.5 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] transition-all"
            placeholder="Search Connector"
          />
        </div>

        <label className="block text-sm text-gray-500 mb-3">
          {filteredConnectors.length} Connector
          {filteredConnectors.length !== 1 ? "s" : ""} Available
        </label>

        <div
          className="overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#8e78b7] scrollbar-track-gray-100 p-2 mb-6"
          style={{ maxHeight: "calc(3 * (90px + 24px))" }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {filteredConnectors.map((card) => (
              <div
                key={card.title}
                className={`p-4 rounded-lg shadow-sm border flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out transform
                    ${selectedConnector === card.title 
                      ? "border-2 border-[#8e78b7] scale-105 bg-[#f3f0fa] shadow-md" 
                      : "border-gray-200 hover:shadow-md hover:scale-105"
                    }`}
                onClick={() => setSelectedConnector(card.title)}
              >
                <img
                  src={card.icon}
                  alt={`${card.title} icon`}
                  className="w-full h-full object-contain p-2"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={()=>{
                closeLocalModal('modal1');
                isEditMode && closeLocalModal('modal2');
            }} 
           className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-[#8e78b7] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedConnector) {
                setFormData(prev => ({
                  ...prev,
                  connection_type: selectedConnector
                }));
                openModal("details");
              } else {
                toast.error('Please select a connector first');
                  }
            }}
            className="px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-gray-400 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );

  const renderConnectionDetailsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-5xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Icon
              className="h-5 w-5 text-[#8e78b7]"
              icon="material-symbols-light:cable-rounded"
            />
            <h2 className="text-xl font-bold text-[#8e78b7]">
              {isEditMode ? "Edit Connection" : "Add Connection"}
            </h2>
          </div>
          <button
            onClick={handleCompleteClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <label className="block text-md text-[#8e78b7] mb-1.5 font-bold">
          Connector
        </label>

        <div
          onClick={() => !isEditMode && openModal("selection")}
          title={isEditMode ? "Connector cannot be changed" : "Click to change"}
          className={`bg-white rounded-lg shadow-sm border-gray-200 border 
              w-[196px] h-[46px] flex items-center overflow-hidden ${
                isEditMode 
                  ? "cursor-not-allowed" 
                  : "hover:shadow-md transition-all cursor-pointer"
              }`}
        >
          <img
            src={connectorCards.find(card => card.title === selectedConnector)?.icon}
            className="w-[90%] h-[80%] object-contain mx-auto p-1"
            alt={`${selectedConnector} logo`}
          />
        </div>

        <label className="block text-md text-[#8e78b7] mb-1.5 font-bold mt-5">
          Details
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
              <span className="text-red-500">*</span>
            </label>
            <input
              name="connection_name"
              value={formData.connection_name || ""}
              onChange={handleInputChange}
              type="text"
              placeholder="Connection name"
              className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 ${
                touchedFields.connection_name && errors.connection_name
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-[#8e78b7] focus:ring-[#8e78b7]"
              }`}
            />
            {touchedFields.connection_name && errors.connection_name && (
              <p className="text-red-500 text-xs mt-1">{errors.connection_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
              <span className="text-red-500">*</span>
            </label>
            <input
              name="description"
              value={formData.description || ""}
              onChange={handleInputChange}
              type="text"
              placeholder="Short description"
              className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 ${
                touchedFields.description && errors.description
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-[#8e78b7] focus:ring-[#8e78b7]"
              }`}
            />
            {touchedFields.description && errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>
          <div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Behaviour
                <span className="text-red-500">*</span>
              </label>
              <select
                name="pool_type"
                value={formData.pool_type || ""}
                onChange={handleInputChange}
                className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 appearance-none bg-white ${
                  touchedFields.pool_type && errors.pool_type
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-[#8e78b7] focus:ring-[#8e78b7]"
                }`}
              >
                <option value="">Select behaviour</option>
                <option value="source">Source</option>
                <option value="target">Target</option>
                <option value="both">Both</option>
              </select>
              <ChevronDown
                className="absolute right-3 top-10 pointer-events-none text-gray-500"
                size={18}
              />
              {touchedFields.pool_type && errors.pool_type && (
                <p className="text-red-500 text-xs mt-1">{errors.pool_type}</p>
              )}
            </div>
          </div>
        </div>

        <label className="block text-md text-[#8e78b7] mb-1.5 font-bold mt-5">
          Credentials
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {getConnectorFields(selectedConnector).map((field) => {
            const fieldName = field.name;
            const fieldValue = fieldName.includes("extra_info.") 
              ? formData.extra_info?.[fieldName.split(".")[1]] || ""
              : formData[fieldName] || "";
            const hasError = touchedFields[fieldName] && errors[fieldName];
            
            return (
              <div key={fieldName}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type={field.type || "text"}
                  name={fieldName}
                  value={fieldValue}
                  onChange={handleInputChange}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 ${
                    hasError
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-[#8e78b7] focus:ring-[#8e78b7]"
                  }`}
                  required={field.required}
                />
                {hasError && (
                  <p className="text-red-500 text-xs mt-1">{errors[fieldName]}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-start gap-4 mt-8">
            <button
                onClick={testConnection}
                disabled={isTesting}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                  isTesting
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-100 hover:bg-[#8e78b7] hover:text-white text-gray-800"
                }`}
              >
                {isTesting ? (
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
                    Testing...
                  </div>
                ) : (
                  "Test Connection"
                )}
          </button>

          <button
  onClick={saveConnection}
  disabled={isLoading}
  className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
    !isTestSuccessful
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-[#8e78b7] hover:bg-gray-400 text-white"
  }`}
>
  {isLoading ? (
    <span className="flex items-center gap-2">
      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      Saving...
    </span>
  ) : (
    isEditMode ? "Update Connection" : "Create and Save"
  )}
</button>

        </div>
      </div>
    </div>
  );

return (
    <>
      {activeModal === "selection" && renderConnectorSelectionModal()}
      {activeModal === "details"  && renderConnectionDetailsModal()}
       <Modal  isOpen={activeModal === "success"}  onClose={handleCompleteClose}  type={"success"} title={"Congratulations!"} message={"You have successfully created a connection."} confirmText={"Alright"} onConfirm={handleCompleteClose} />
    </>
  );
};

export default ConnectionWizard;