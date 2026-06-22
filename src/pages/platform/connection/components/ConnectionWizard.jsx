import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "../../../../context/AuthContext";
import { X, ChevronDown, Search } from "lucide-react";
import toast from "react-hot-toast";
import { connectorConfig } from "./connectorConfig";
import Modal from "../../cdc/components/Modal";
import { useAllConnectionData } from "../../../../hooks/platform/connection";
import KafkaTopicManager from "./KafkaTopicManager";
import KafkaTopicSelector from "./KafkaTopicSelector";
import ClouderaHiveTableSelector from "./ClouderaHiveTableSelector";
import JSZip from "jszip";

const ConnectionWizard = ({ editConnectionData, closeLocalModal }) => {
  /*
   * Create or Edit a connection.
   */
  const isEditMode = !!editConnectionData;
  const {
    data: connections = [],
    isLoading: isConnectionsLoading,
    error: connectionsError,
    refetch: refetchConnections,
  } = useAllConnectionData();

  const connectionNames = useMemo(() => {
    return connections.map((connection) =>
      connection.connection_name.toLowerCase()
    );
  }, [connections]);

  const { token, hostnameV1, decodedToken, project, hostnameV2 } = useAuth();
  const [activeModal, setActiveModal] = useState(
    isEditMode ? "details" : "selection"
  );
  const [selectedConnector, setSelectedConnector] = useState(
    isEditMode ? editConnectionData?.connection_type : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [fileObjects, setFileObjects] = useState({});
  const [customFiles, setCustomFiles] = useState([]);
  const [removedTopics, setRemovedTopics] = useState([]);
  const [selectedKafkaTopics, setSelectedKafkaTopics] = useState([]);
  const [clouderaHiveTables, setClouderaHiveTables] = useState([]);
  const [selectedClouderaHiveTables, setSelectedClouderaHiveTables] = useState([]);

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
    },
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [isTestSuccessful, setIsTestSuccessful] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const regexValidName =
    /^(?!_)(?!.*_$)[A-Za-z][A-Za-z0-9]*(_[A-Za-z0-9]+)*$/i;

  const kafkaType = formData.extra_info?.type;
  const isKafkaRawOrAvro =
    selectedConnector === "kafka" &&
    (kafkaType === "raw" || kafkaType === "avro");
  const isClouderaHive = selectedConnector === "clouderahive";
  const isHiveConnector = isClouderaHive;

  useEffect(() => {
    if (isEditMode && editConnectionData) {
      const extra_info = editConnectionData.extra_info || {};
      setFormData({
        ...defaultFormData,
        ...editConnectionData,
        extra_info: {
          ...defaultFormData.extra_info,
          ...extra_info,
        },
      });
      setSelectedConnector(editConnectionData.connection_type);
      setErrors({});
      setTouchedFields({});

      if (
        extra_info.topics &&
        Array.isArray(extra_info.topics) &&
        extra_info.topics.length > 0
      ) {
        setSelectedKafkaTopics(extra_info.topics);
      }

      if (
        extra_info.tables &&
        Array.isArray(extra_info.tables) &&
        extra_info.tables.length > 0
      ) {
        setSelectedClouderaHiveTables(extra_info.tables);
      }
    }
  }, [isEditMode, editConnectionData]);

  const connectorCards = Object.keys(connectorConfig).map((connectorName) => ({
    title: connectorName,
    icon: connectorConfig[connectorName].icon,
  }));

  const getConnectorFields = (connectorType) => {
    if (!connectorType || !connectorConfig[connectorType]) return [];
    return connectorConfig[connectorType].fields;
  };

  const isFieldVisible = (field) => {
    if (!field.conditionalOn) return true;
    const { field: condField, value: condValue, values: condValues } =
      field.conditionalOn;

    const currentValue = condField.startsWith("extra_info.")
      ? formData.extra_info?.[condField.split(".")[1]]
      : formData[condField];

    if (condValues) return condValues.includes(currentValue);
    return currentValue === condValue;
  };

  const isFieldRequired = (field) => {
    if (field.required) return true;
    if (!field.requiredOn) return false;
    const { field: condField, value: condValue } = field.requiredOn;
    const currentValue = condField.startsWith("extra_info.")
      ? formData.extra_info?.[condField.split(".")[1]]
      : formData[condField];
    return currentValue === condValue;
  };

  const originalKafkaType = isEditMode
    ? editConnectionData?.extra_info?.type
    : null;

  const isKafkaCustomOriginal =
    selectedConnector === "kafka" &&
    isEditMode &&
    originalKafkaType === "custom" &&
    formData.extra_info?.type === "custom";

  const isKafkaCustomNew =
    selectedConnector === "kafka" &&
    isEditMode &&
    originalKafkaType !== "custom" &&
    formData.extra_info?.type === "custom";

  const isKafkaCustom =
    selectedConnector === "kafka" &&
    !isEditMode &&
    formData.extra_info?.type === "custom";

  const getTruststoreFile = () => fileObjects["truststore_location"] || null;
  const getKeytabFile = () => fileObjects["keytab_location"] || null;
  const getCoreSiteFile = () => fileObjects["core_site_location"] || null;
  const getHdfsSiteFile = () => fileObjects["hdfs_site_location"] || null;

  const buildTestPayload = async (data) => {
    const excludedKeys = [
      "created_by",
      "pool_type",
      "status",
      "project",
      "created_at",
      "updated_at",
      "is_deleted",
      "table_count",
      "connection_id",
    ];
    if (isEditMode) excludedKeys.push("is_viewed");

    const filteredData = Object.fromEntries(
      Object.entries(data).filter(
        ([key, value]) =>
          !excludedKeys.includes(key) && value !== null && value !== undefined
      )
    );

    const truststoreFile = getTruststoreFile();
    if (truststoreFile && filteredData.extra_info) {
      filteredData.extra_info = {
        ...filteredData.extra_info,
        truststore_location: `${data.connection_name}_${truststoreFile.name}`,
      };
    }

    const keytabFile = getKeytabFile();
    if (keytabFile && filteredData.extra_info) {
      filteredData.extra_info = {
        ...filteredData.extra_info,
        keytab_location: `${data.connection_name}_${keytabFile.name}`,
      };
    }
    const coreSiteFile = getCoreSiteFile();
    if (coreSiteFile && filteredData.extra_info) {
      filteredData.extra_info = {
        ...filteredData.extra_info,
        core_site_location: `${data.connection_name}_${coreSiteFile.name}`,
      };
    }
    const hdfsSiteFile = getHdfsSiteFile();
    if (hdfsSiteFile && filteredData.extra_info) {
      filteredData.extra_info = {
        ...filteredData.extra_info,
        hdfs_site_location: `${data.connection_name}_${hdfsSiteFile.name}`,
      };
    }

    const payload = new FormData();
    payload.append("connection_info", JSON.stringify(filteredData));
    if (truststoreFile) {
      payload.append("truststore_file", truststoreFile);
    }

    const hiveFiles = [keytabFile, coreSiteFile, hdfsSiteFile].filter(Boolean);
    if (hiveFiles.length > 0) {
      const zip = new JSZip();
      if (keytabFile) zip.file(keytabFile.name, keytabFile);
      if (coreSiteFile) zip.file("core-site.xml", coreSiteFile);
      if (hdfsSiteFile) zip.file("hdfs-site.xml", hdfsSiteFile);
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 1 },
      });
      payload.append("hive_files_zip", zipBlob, "hive_files.zip");
    }

    return payload;
  };

  const buildSavePayload = async (data) => {
    const excludedKeys = [
      "created_at",
      "updated_at",
      "is_deleted",
      "table_count",
      "connection_id",
    ];
    if (isEditMode) excludedKeys.push("is_viewed");

    let filteredData = Object.fromEntries(
      Object.entries(data).filter(
        ([key, value]) => !excludedKeys.includes(key) && value !== null
      )
    );

    const truststoreFile = getTruststoreFile();
    if (truststoreFile && filteredData.extra_info) {
      filteredData = {
        ...filteredData,
        extra_info: {
          ...filteredData.extra_info,
          truststore_location: `${data.connection_name}_${truststoreFile.name}`,
        },
      };
    }

    const keytabFile = getKeytabFile();
    if (keytabFile && filteredData.extra_info) {
      filteredData = {
        ...filteredData,
        extra_info: {
          ...filteredData.extra_info,
          keytab_location: `${data.connection_name}_${keytabFile.name}`,
        },
      };
    }
    const coreSiteFile = getCoreSiteFile();
    if (coreSiteFile && filteredData.extra_info) {
      filteredData = {
        ...filteredData,
        extra_info: {
          ...filteredData.extra_info,
          core_site_location: `${data.connection_name}_${coreSiteFile.name}`,
        },
      };
    }
    const hdfsSiteFile = getHdfsSiteFile();
    if (hdfsSiteFile && filteredData.extra_info) {
      filteredData = {
        ...filteredData,
        extra_info: {
          ...filteredData.extra_info,
          hdfs_site_location: `${data.connection_name}_${hdfsSiteFile.name}`,
        },
      };
    }

    if (isKafkaRawOrAvro && selectedKafkaTopics.length > 0) {
      filteredData = {
        ...filteredData,
        extra_info: {
          ...filteredData.extra_info,
          topics: selectedKafkaTopics,
        },
      };
    }

    if (isHiveConnector && selectedClouderaHiveTables.length > 0) {
      filteredData = {
        ...filteredData,
        extra_info: {
          ...filteredData.extra_info,
          tables: selectedClouderaHiveTables,
        },
      };
    }

    if (isEditMode && removedTopics.length > 0) {
      filteredData = {
        ...filteredData,
        extra_info: {
          ...filteredData.extra_info,
          remove_files: removedTopics,
        },
      };
    }

    const payload = new FormData();
    payload.append("connection_json", JSON.stringify(filteredData));
    if (truststoreFile) {
      payload.append("truststore_file", truststoreFile);
    }

    const hiveFiles = [keytabFile, coreSiteFile, hdfsSiteFile].filter(Boolean);
    if (hiveFiles.length > 0) {
      const zip = new JSZip();
      if (keytabFile) zip.file(keytabFile.name, keytabFile);
      if (coreSiteFile) zip.file("core-site.xml", coreSiteFile);
      if (hdfsSiteFile) zip.file("hdfs-site.xml", hdfsSiteFile);
      let zipBlob;
      try {
        zipBlob = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 1 },
        });
      } catch (err) {
        throw new Error(
          "One or more files could not be read. Please re-select them and try again."
        );
      }
      payload.append("hive_files_zip", zipBlob, "hive_files.zip");
    }

    if (customFiles.length > 0) {
      const zip = new JSZip();
      customFiles.forEach((f) => zip.file(f.name, f));
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 1 },
      });
      payload.append("custom_files_zip", zipBlob, "topics.zip");
    }

    return payload;
  };


  const validateField = (name, value) => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      if (name === "connection_name") {
        if (!value) {
          newErrors.connection_name = "Connection name is required";
        } else if (!regexValidName.test(value)) {
          newErrors.connection_name =
            "Connection names must start with a letter, end with a letter or digit, and contain only letters, numbers, and underscores. No leading or trailing underscores allowed.";
        } else if (
          !isEditMode &&
          connectionNames.includes(value.toLowerCase())
        ) {
          newErrors.connection_name = "Connection name already exists";
        } else if (
          isEditMode &&
          value.toLowerCase() !==
            editConnectionData.connection_name.toLowerCase() &&
          connectionNames.includes(value.toLowerCase())
        ) {
          newErrors.connection_name = "Connection name already exists";
        } else {
          delete newErrors.connection_name;
        }
      } else if (name === "description") {
        if (!value?.trim()) {
          newErrors.description = "Description is required";
        } else {
          delete newErrors.description;
        }
      } else if (name === "pool_type") {
        if (!value) {
          newErrors.pool_type = "Behaviour is required";
        } else {
          delete newErrors.pool_type;
        }
      } else {
        const field = getConnectorFields(selectedConnector).find(
          (f) => f.name === name
        );

        if (field) {
          if (field.type === "file") {
            const key = name.split(".")[1];
            const existingValue = formData.extra_info?.[key];

            if (
              isFieldRequired(field) &&
              isFieldVisible(field) &&
              !fileObjects[key] &&
              !existingValue
            ) {
              newErrors[name] = `${field.label} is required`;
            } else {
              delete newErrors[name];
            }
          } else if (isFieldRequired(field) && isFieldVisible(field) && !value) {
            newErrors[name] = `${field.label} is required`;
          } else {
            delete newErrors[name];
          }
        }
      }

      return newErrors;
    });
  };

  const validateForm = () => {
    let newErrors = {};
    let allTouched = {};

    // connection_name
    if (!formData.connection_name) {
      newErrors.connection_name = "Connection name is required";
    } else if (!regexValidName.test(formData.connection_name)) {
      newErrors.connection_name =
        "Connection names must start with a letter, end with a letter or digit, and contain only letters, numbers, and underscores. No leading or trailing underscores allowed.";
    } else if (
      !isEditMode &&
      connectionNames.includes(formData.connection_name.toLowerCase())
    ) {
      newErrors.connection_name = "Connection name already exists";
    } else if (
      isEditMode &&
      formData.connection_name.toLowerCase() !==
        editConnectionData.connection_name.toLowerCase() &&
      connectionNames.includes(formData.connection_name.toLowerCase())
    ) {
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

    // Connector-specific fields — skip hidden conditional fields
    const connectorFields = getConnectorFields(selectedConnector);
    connectorFields.forEach((field) => {
      if (field.type === "file") {
        if (isFieldRequired(field) && isFieldVisible(field)) {
          const key = field.name.split(".")[1];
          const existingValue = formData.extra_info?.[key];
          if (!fileObjects[key] && !existingValue) {
            newErrors[field.name] = `${field.label} is required`;
            allTouched[field.name] = true;
          }
        }
        return;
      }

      if (isFieldRequired(field) && isFieldVisible(field)) {
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

    if (isKafkaCustom && customFiles.length === 0) {
      newErrors["custom_files"] = "At least one topic JSON file is required";
      allTouched["custom_files"] = true;
    }

    if (isKafkaCustomOriginal && customFiles.length === 0 && removedTopics.length > 0) {
      newErrors["custom_files"] = "At least one topic JSON file is required";
      allTouched["custom_files"] = true;
    }



    setErrors(newErrors);
    setTouchedFields((prev) => ({ ...prev, ...allTouched }));
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setIsTestSuccessful(false);

    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
    }));

    if (name.startsWith("extra_info.")) {
      const key = name.split(".")[1];

      setFormData((prev) => {
        const updatedExtraInfo = {
          ...prev.extra_info,
          [key]: value,
        };

        if (key === "type" && value === "raw") {
          delete updatedExtraInfo.schema_registery_url;

          setErrors((prevErrors) => {
            const {
              "extra_info.schema_registery_url": _url,
              ...rest
            } = prevErrors;
            return rest;
          });

          setTouchedFields((prevTouched) => {
            const {
              "extra_info.schema_registery_url": _url,
              ...rest
            } = prevTouched;
            return rest;
          });
        }

        if (key === "type" && value !== "raw" && value !== "avro") {
          setSelectedKafkaTopics([]);
          setErrors((prevErrors) => {
            const { kafka_topics: _kt, ...rest } = prevErrors;
            return rest;
          });
        }

        if (key === "type" && value !== "custom") {
          setCustomFiles([]);

          setErrors((prevErrors) => {
            const { custom_files: _cf, ...rest } = prevErrors;
            return rest;
          });
        }

        if (
          key === "security_protocol" &&
          !["SSL", "SASL_SSL"].includes(value)
        ) {
          delete updatedExtraInfo.truststore_location;
          delete updatedExtraInfo.truststore_password;
          delete updatedExtraInfo.truststore_type;

          setFileObjects((prev) => {
            const { truststore_location, ...rest } = prev;
            return rest;
          });

          setErrors((prevErrors) => {
            const {
              "extra_info.truststore_location": _l,
              "extra_info.truststore_password": _tp,
              "extra_info.truststore_type": _tt,
              ...rest
            } = prevErrors;
            return rest;
          });

          setTouchedFields((prevTouched) => {
            const {
              "extra_info.truststore_location": _l,
              "extra_info.truststore_password": _tp,
              "extra_info.truststore_type": _tt,
              ...rest
            } = prevTouched;
            return rest;
          });
        }

        if (
          key === "security_protocol" &&
          ["PLAINTEXT", "SSL"].includes(value)
        ) {
          delete updatedExtraInfo.sasl_mechanism;

          setErrors((prevErrors) => {
            const {
              "extra_info.sasl_mechanism": _m,
              username: _u,
              password: _p,
              ...rest
            } = prevErrors;
            return rest;
          });

          setTouchedFields((prevTouched) => {
            const {
              "extra_info.sasl_mechanism": _m,
              username: _u,
              password: _p,
              ...rest
            } = prevTouched;
            return rest;
          });

          return {
            ...prev,
            extra_info: updatedExtraInfo,
            username: "",
            password: "",
          };
        }

        return {
          ...prev,
          extra_info: updatedExtraInfo,
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };

        if (name === "description") {
          if (value.trim()) {
            delete newErrors.description;
          }
        }

        if (name === "pool_type") {
          if (value) {
            delete newErrors.pool_type;
          }
        }

        if (name === "connection_name") {
          delete newErrors.connection_name;
        }

        return newErrors;
      });
    }

    validateField(name, value);
  };

  // ─── Modal navigation ────────────────────────────────────────────────────────

  const filteredConnectors = connectorCards.filter((card) =>
    card.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = (modalName, data = null) => {
    setActiveModal(modalName);
    if (data) setSelectedConnector(data);
    if (modalName === "details" && selectedConnector) {
      setFormData((prev) => ({ ...prev, connection_type: selectedConnector }));
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
      if (isEditMode) closeLocalModal("modal2");
    }
  };

  // ─── API calls ───────────────────────────────────────────────────────────────

  const testConnection = async () => {
    const isValid = validateForm();
    if (!isValid) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    const payload = await buildTestPayload(formData);

    setIsTesting(true);
    if (isHiveConnector) {
      setClouderaHiveTables([]);
    }
    try {
      const response = await fetch(`${hostnameV1}/test-connection`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      if (response.ok) {
        const responseData = await response.json();
        setIsTestSuccessful(true);
        toast.success("Connection test successful");

        if (isHiveConnector) {
          const tableList = Array.isArray(responseData.tables)
            ? responseData.tables
            : [];
          setClouderaHiveTables(tableList);
        }
      } else {
        const errorData = await response.json();
        const errorMsg =
          errorData.detail || errorData.message || "Unknown error";
        toast.error(errorMsg, {
          duration: 6000,
          style: {
            maxWidth: "480px",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
          },
        });
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

    if (isKafkaRawOrAvro && selectedKafkaTopics.length === 0) {
      setErrors((prev) => ({
        ...prev,
        kafka_topics: "At least one topic must be selected",
      }));
      setTouchedFields((prev) => ({ ...prev, kafka_topics: true }));
      toast.error("Please select at least one Kafka topic");
      return;
    }

    if (isHiveConnector && selectedClouderaHiveTables.length === 0) {
      setErrors((prev) => ({
        ...prev,
        cloudera_tables: "At least one table must be selected",
      }));
      setTouchedFields((prev) => ({ ...prev, cloudera_tables: true }));
      toast.error("Please select at least one Hive table");
      return;
    }

    const isDuplicate =
      !isEditMode &&
      connectionNames.includes(formData.connection_name.toLowerCase());
    const isNameChanged =
      isEditMode &&
      formData.connection_name.toLowerCase() !==
        editConnectionData.connection_name.toLowerCase();
    const isDuplicateOnEdit =
      isNameChanged &&
      connectionNames.includes(formData.connection_name.toLowerCase());

    if (isDuplicate || isDuplicateOnEdit) {
      setErrors((prev) => ({
        ...prev,
        connection_name: "Connection name already exists",
      }));
      setTouchedFields((prev) => ({ ...prev, connection_name: true }));
      toast.error("Connection name already exists");
      return;
    }

    setIsLoading(true);
    try {
      const payload = await buildSavePayload(formData);

      const endpoint = isEditMode
        ? `${hostnameV1}/connection-saves/${editConnectionData.connection_id}`
        : `${hostnameV1}/create-connection`;
      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      if (response.ok) {
        toast.success(
          isEditMode
            ? "Connection updated successfully"
            : "Connection created successfully"
        );
        if (!isEditMode) {
          setFormData(defaultFormData);
          setFileObjects({});
          setIsTestSuccessful(false);
          setErrors({});
          setTouchedFields({});
          setSelectedKafkaTopics([]);
        }
        setCustomFiles([]);
        setRemovedTopics([]);
        openModal("success");
        refetchConnections();
      } else {
        const errorData = await response.json();
        const errorMsg =
          errorData.detail ||
          errorData.message ||
          "Failed to create connection";
        toast.error(`${errorMsg}`, {
          duration: 6000,
          style: {
            maxWidth: "480px",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
          },
        });
      }
    } catch (error) {
      toast.error(`Save failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render: Connector selection modal ──────────────────────────────────────

  const renderConnectorSelectionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-5xl p-8">
        {/* Header */}
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

        {/* Search */}
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

        {/* Grid */}
        <div
          className="overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#8e78b7] scrollbar-track-gray-100 p-2 mb-6"
          style={{ maxHeight: "calc(3 * (90px + 24px))" }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {filteredConnectors.map((card) => (
              <div
                key={card.title}
                className={`p-4 rounded-lg shadow-sm border flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out transform
                  ${
                    selectedConnector === card.title
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

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={() => {
              closeLocalModal("modal1");
              isEditMode && closeLocalModal("modal2");
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-[#8e78b7] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedConnector) {
                setFormData((prev) => ({
                  ...prev,
                  connection_type: selectedConnector,
                }));
                openModal("details");
              } else {
                toast.error("Please select a connector first");
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

  // ─── Render: Field input ─────────────────────────────────────────────────────

  const renderField = (field) => {
    const fieldName = field.name;
    const fieldValue = fieldName.startsWith("extra_info.")
      ? formData.extra_info?.[fieldName.split(".")[1]] || ""
      : formData[fieldName] || "";
    const hasError = touchedFields[fieldName] && errors[fieldName];

    const baseInputClass = `w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 ${
      hasError
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:border-[#8e78b7] focus:ring-[#8e78b7]"
    }`;

    return (
      <div key={fieldName}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {isFieldRequired(field) && <span className="text-red-500">*</span>}
        </label>

        {/* ── File field ── */}
        {field.type === "file" ? (
          <div>
            {(() => {
              const key = fieldName.split(".")[1];
              const hasNewFile = !!fileObjects[key];
              const existingValue = formData.extra_info?.[key];
              const prefix = `${formData.connection_name}_`;
              const displayName = existingValue?.startsWith(prefix)
                ? existingValue.slice(prefix.length)
                : existingValue;

              const shownName = hasNewFile
                ? fileObjects[key].name
                : isEditMode && displayName
                ? displayName
                : "No file chosen";

              return (
                <label
                  className={`flex items-center w-full border rounded-lg overflow-hidden cursor-pointer h-[46px]
                    ${
                      hasError
                        ? "border-red-500 focus-within:ring-1 focus-within:ring-red-500"
                        : "border-gray-300 focus-within:ring-1 focus-within:ring-[#8e78b7] focus-within:border-[#8e78b7]"
                    }`}
                >
                  <span className="h-full flex items-center px-3 bg-[#f3f0fa] text-[#8e78b7] text-sm font-medium border-r border-gray-300 whitespace-nowrap hover:bg-[#8e78b7] hover:text-white transition-colors">
                    Choose File
                  </span>
                  <span
                    className={`h-full flex items-center px-3 text-sm truncate ${
                      shownName === "No file chosen"
                        ? "text-gray-400"
                        : "text-gray-700"
                    }`}
                  >
                    {shownName}
                  </span>
                  <input
                    type="file"
                    name={fieldName}
                    accept={field.accept || ".p12"}
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      const key = fieldName.split(".")[1];

                      setIsTestSuccessful(false);

                      if (file && field.accept) {
                        const allowedExts = field.accept
                          .split(",")
                          .map((ext) => ext.trim().toLowerCase());
                        const fileExt = `.${file.name.split(".").pop().toLowerCase()}`;
                        if (!allowedExts.includes(fileExt)) {
                          toast.error(
                            `Only ${allowedExts.join(", ")} format${allowedExts.length > 1 ? "s are" : " is"} allowed`
                          );
                          e.target.value = "";
                          setFileObjects((prev) => {
                            const updated = { ...prev };
                            delete updated[key];
                            return updated;
                          });
                          setFormData((prev) => ({
                            ...prev,
                            extra_info: { ...prev.extra_info, [key]: "" },
                          }));
                          setTouchedFields((prev) => ({
                            ...prev,
                            [fieldName]: true,
                          }));
                          setErrors((prev) => ({
                            ...prev,
                            [fieldName]: isFieldRequired(field)
                              ? `${field.label} is required`
                              : undefined,
                          }));
                          return;
                        }
                      }

                      if (file) {
                        setFileObjects((prev) => ({ ...prev, [key]: file }));
                        const displayName = `${formData.connection_name}_${file.name}`;
                        setFormData((prev) => ({
                          ...prev,
                          extra_info: {
                            ...prev.extra_info,
                            [key]: displayName,
                          },
                        }));
                        setErrors((prev) => {
                          const updated = { ...prev };
                          delete updated[fieldName];
                          return updated;
                        });
                      } else {
                        setFileObjects((prev) => {
                          const updated = { ...prev };
                          delete updated[key];
                          return updated;
                        });
                        setFormData((prev) => ({
                          ...prev,
                          extra_info: { ...prev.extra_info, [key]: "" },
                        }));
                        if (isFieldRequired(field)) {
                          setErrors((prev) => ({
                            ...prev,
                            [fieldName]: `${field.label} is required`,
                          }));
                        }
                      }

                      setTouchedFields((prev) => ({
                        ...prev,
                        [fieldName]: true,
                      }));
                      if (!file) validateField(fieldName, "");
                    }}
                  />
                </label>
              );
            })()}
          </div>
        ) : field.type === "select" ? (
          /* ── Select field ── */
          <div className="relative">
            <select
              name={fieldName}
              value={fieldValue}
              onChange={handleInputChange}
              className={`${baseInputClass} appearance-none bg-white`}
            >
              <option value="">Select {field.label}</option>
              {field.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-3 pointer-events-none text-gray-500"
              size={18}
            />
          </div>
        ) : (
          /* ── Text / number / password field ── */
          <input
            type={field.type || "text"}
            name={fieldName}
            value={fieldValue}
            onChange={handleInputChange}
            placeholder={
              field.placeholder || `Enter ${field.label.toLowerCase()}`
            }
            className={baseInputClass}
          />
        )}

        {hasError && (
          <p className="text-red-500 text-xs mt-1">{errors[fieldName]}</p>
        )}
      </div>
    );
  };

  // ─── Render: Connection details modal ───────────────────────────────────────

  const renderConnectionDetailsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-5xl p-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
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

        {/* Connector icon */}
        <label className="block text-md text-[#8e78b7] mb-1.5 font-bold">
          Connector
        </label>
        <div
          onClick={() => !isEditMode && openModal("selection")}
          title={
            isEditMode ? "Connector cannot be changed" : "Click to change"
          }
          className={`bg-white rounded-lg shadow-sm border-gray-200 border w-[196px] h-[46px] flex items-center overflow-hidden ${
            isEditMode
              ? "cursor-not-allowed"
              : "hover:shadow-md transition-all cursor-pointer"
          }`}
        >
          <img
            src={
              connectorCards.find((card) => card.title === selectedConnector)
                ?.icon
            }
            className="w-[90%] h-[80%] object-contain mx-auto p-1"
            alt={`${selectedConnector} logo`}
          />
        </div>

        {/* Details section */}
        <label className="block text-md text-[#8e78b7] mb-1.5 font-bold mt-5">
          Details
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {/* Connection Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              name="connection_name"
              value={formData.connection_name || ""}
              onChange={handleInputChange}
              type="text"
              placeholder="Connection name"
              readOnly={isEditMode}
              title={
                isEditMode ? "Connection name cannot be changed" : undefined
              }
              className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 ${
                isEditMode
                  ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200"
                  : touchedFields.connection_name && errors.connection_name
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-[#8e78b7] focus:ring-[#8e78b7]"
              }`}
            />
            {touchedFields.connection_name && errors.connection_name && (
              <p className="text-red-500 text-xs mt-1">
                {errors.connection_name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
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

          {/* Behaviour */}
          <div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Behaviour <span className="text-red-500">*</span>
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
                  {selectedConnector === "kafka" ? (
                    <option value="source">Source</option>
                  ) : (
                    <>
                      <option value="source">Source</option>
                      <option value="target">Target</option>
                      <option value="both">Both</option>
                    </>
                  )}
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

        {/* Credentials section */}
        <label className="block text-md text-[#8e78b7] mb-1.5 font-bold mt-5">
          Credentials
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {getConnectorFields(selectedConnector)
            .filter((field) => isFieldVisible(field))
            .map((field) => renderField(field))}

          {/* ── Custom type: new connection or switching to custom ── */}
          {(isKafkaCustom || isKafkaCustomNew) && (
            <KafkaTopicManager
              isEditMode={false}
              customFiles={customFiles}
              onCustomFilesChange={(files) => {
                setCustomFiles(files);
                setIsTestSuccessful(false);
                if (files.length > 0) {
                  setErrors((prev) => {
                    const { custom_files: _cf, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              customFilesError={
                touchedFields.custom_files && !!errors.custom_files
              }
            />
          )}

          {isKafkaRawOrAvro && (
            <KafkaTopicSelector
              formData={formData}
              hostnameV1={hostnameV1}
              token={token}
              isTestSuccessful={isTestSuccessful}
              selectedTopics={selectedKafkaTopics}
              onSelectedTopicsChange={(topics) => {
                setSelectedKafkaTopics(topics);
                if (topics.length > 0) {
                  setErrors((prev) => {
                    const { kafka_topics: _kt, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              hasError={
                touchedFields.kafka_topics && !!errors.kafka_topics
              }
              isEditMode={isEditMode}
            />
          )}

          {isHiveConnector && (
            <ClouderaHiveTableSelector
              isTestSuccessful={isTestSuccessful}
              tables={clouderaHiveTables}
              isLoadingTables={isTesting}
              selectedTables={selectedClouderaHiveTables}
              onSelectedTablesChange={(tables) => {
                setSelectedClouderaHiveTables(tables);
                if (tables.length > 0) {
                  setErrors((prev) => {
                    const { cloudera_tables: _ct, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              hasError={
                touchedFields.cloudera_tables && !!errors.cloudera_tables
              }
            />
          )}
        </div>

        {isKafkaCustomOriginal && (
          <KafkaTopicManager
            isEditMode={true}
            connectionName={formData.connection_name}
            hostnameV1={hostnameV1}
            token={token}
            customFiles={customFiles}
            onCustomFilesChange={(files) => {
              setCustomFiles(files);
              setIsTestSuccessful(false);
              if (files.length > 0) {
                setErrors((prev) => {
                  const { custom_files: _cf, ...rest } = prev;
                  return rest;
                });
              }
            }}
            removedTopics={removedTopics}
            onRemovedTopicsChange={(topics) => {
              setRemovedTopics(topics);
              if (customFiles.length > 0 || topics.length === 0) {
                setErrors((prev) => {
                  const { custom_files: _cf, ...rest } = prev;
                  return rest;
                });
              }
            }}
            customFilesError={
              touchedFields.custom_files && !!errors.custom_files
            }
            customFilesErrorMessage={errors.custom_files}
          />
        )}

        {/* Action buttons */}
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
                <span className="h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
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
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : isEditMode ? (
              "Update Connection"
            ) : (
              "Create and Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Root render ─────────────────────────────────────────────────────────────

  return (
    <>
      {activeModal === "selection" && renderConnectorSelectionModal()}
      {activeModal === "details" && renderConnectionDetailsModal()}
      <Modal
        isOpen={activeModal === "success"}
        onClose={handleCompleteClose}
        type={"success"}
        title={"Congratulations!"}
        message={"You have successfully created a connection."}
        confirmText={"Alright"}
        onConfirm={handleCompleteClose}
      />
    </>
  );
};

export default ConnectionWizard;