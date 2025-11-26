import React, { useState, useCallback, useEffect, useMemo } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { Position } from "reactflow";
import { Handle } from "../../components/CustomHandle";
import { X, Search, ArrowDownUp, Minus, Download } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../../../context/AuthContext";
import {
  useConnections,
  useDDL,
  useSchemaCount,
  useSchemas,
  useTables,
} from "../../hooks/DataFetch";
import { useWorkflow } from "../../context/WorkflowContext";
import { SkeletonLoader } from "../../components/skeltonLoader";
import { useNavigate } from "react-router-dom";
import { useMigrationData } from "../../../../../hooks/platform/migration";
import { encrypt } from "../../../../../utils/Crypto";
import { useModal } from "../../context/ModalProvider";
import * as XLSX from "xlsx";

export function TargetNode({ id, data, selected }) {
  const { token, decodedToken, hostnameV1, project } = useAuth();
  const pipelineId = data?.pipelineId;
  const isPipelineNode = pipelineId !== undefined;
  const ID = isPipelineNode ? pipelineId : id;
  const {
    pipelines,
    completeMapping,
    pipelineMappings,
    inProgressMappings,
    updateData,
    deleteMapping,
    addBulkMapping,
    updateBulkMappings,
    deselectMapping,
    bulkMappings,
    setNodes,
    setPipelines,
    deletePipeline
  } = useWorkflow();
  const { openModal, closeModal } = useModal();
  const [selectedConnection, setSelectedConnection] = useState("");
  const navigate = useNavigate();
  const { refetch } = useMigrationData();
  const [settings, setSettings] = useState(
    data?.settings?.type || "Prefix/Suffix"
  );
  const [settingsValue, setSettingsValue] = useState(
    data?.settings?.value || ""
  );

  const [selectedSchema, setSelectedSchema] = useState(data?.schema || "");



  const [validationInProgress, setValidationInProgress] = useState(false);

  const { data: connections, isLoading: isLoadingConnections } =
    useConnections('target');
  const { data: schemaCount } = useSchemaCount(selectedConnection);
  const { data: schemas, isLoading: isLoadingSchemas } =
    useSchemas(selectedConnection);
  // const { data: tables, isLoading: isLoadingTables } = useTables(
  //   selectedConnection,
  //   selectedSchema
  // );
  const [nodeData, setNodeData] = useState(() => ({
    connection: "",
    schema: "",
    metadata_list: [],
    target_conn_id: "",
    target_conn_type: "",
  }));
  const [selectedConnectionObj, setSelectedConnectionObj] = useState(null);

  const handleSelectConnection = (selectedConnection) => {
    setSelectedConnectionObj(selectedConnection);
    setSelectedConnection(selectedConnection.connection_name);
    setSelectedSchema("");
    setBulkList([]);
    setNodeData((prevData) => ({
      ...prevData,
      target_conn_id: selectedConnection.connection_id,
      target_conn_type: selectedConnection.connection_type,
    }));
  };

  const handleCancel = () => {
    setSelectedConnection(data?.connection || "");
    setSelectedSchema(data?.schema || "");
    setSettings(data?.settings?.type || "Prefix/Suffix");
    setSettingsValue(data?.settings?.value || "");
  };

  const validateDdlMigration = async (ddlMigrationData) => {
    try {
      const response = await axios.post(
        `${hostnameV1}/validate-ddl`,
        ddlMigrationData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error during DDL validation:", error);

      if (error.response) {
        return error.response.data;
      } else if (error.request) {
        return { success: false, detail: "Network Error: No response from server." };
      } else {
        return { success: false, detail: `Request Error: ${error.message}` };
      }
    }
  };





  const handleDDLValidation = async () => {
    try {
      const data = pipelines?.[ID]?.data;

      if (!data) {
        toast.error("No pipeline data found");
        setValidationInProgress(false);
        return;
      }

      const payload = {
        metadata_name: data?.define?.name,
        metadata_auto_name: data?.define?.autoName,
        description: data?.define?.description,
        project: project,
        created_by: decodedToken?.preferred_username,
        conn_type: data?.source?.source_conn_type,
        source_conn_id: data?.source?.source_conn_id,
        target_conn_id: data?.target?.target_conn_id,
        table_list: data?.target?.metadata_list,
      };
      const validationResponse = await validateDdlMigration(payload);
      if (validationResponse.success === true) {
        openModal({
          title: "Save Confirmation",
          message: "Are you sure you want to save this Metadata?",
          type: "question",
          confirmText: "Yes",
          loadingText: "Saving",
          onConfirm: () => handleSaveMetadata(payload),
          onClose: () => closeModal(),
        });
      } else {

        openModal({
          title: "Validation Errors",
          type: "question",
          confirmText: "Proceed Anyway",
          cancelText: "Back",
          onConfirm: () => handleSaveMetadata(payload),
          onClose: () => closeModal(),
          customContent: <ValidationModalContent errorTables={validationResponse.error_tables} />,

        });
      }
    } catch (error) {
      toast.error(`Validation failed: ${error.message}`);
      console.error("Validation error:", error);
    } finally {
      setValidationInProgress(false);
    }
  };

  const handleClose = () => {
    closeModal();
    setTimeout(() => {
      navigate(
        `/details?${encodeURIComponent(
          encrypt("componentType=metadata&heading=metadata")
        )}`
      );
      refetch();
    }, 800);
  };
  const handleSaveMetadata = async (payload) => {
    try {
      const response = await axios.post(
        `${hostnameV1}/ddl-migration`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setTimeout(() => {
        openModal({
          title: "Success!",
          message: "Your Metadata has been saved successfully.",
          type: "success",
          loadingText: "Saving",
          onClose: () => handleClose(),
        });
        setPipelines({});
        setNodes([]);
        ({});
      }, 800);
    } catch (error) {
      toast.error(`Error saving metadata: ${error.message}`);
      console.error("Error saving metadata:", error);
    }
  };

  const handleProceedAnyway = async () => {
    const data = pipelines?.[ID]?.data;
    if (!data) {
      toast.error("No pipeline data found");
      return;
    }
  };

  const handleSettingsChange = (event) => {
    setSettings(event.target.value);
  };

  const handleSettingsValueChange = (e) => {
    const value = e.target.value;
    if (settings === "Prefix" && /^\d/.test(value)) {
      toast.error("Prefix cannot start with a number. Changed first character to 'T'.");
      setSettingsValue("T" + value.slice(1));
    } else {
      setSettingsValue(value);
    }
  };

  function generateTableMappings(tables, option = {}, mode = "none", schemaName = "") {
    return tables.map((tableName) => {
      let newName = tableName;
      if (mode === "Prefix" && option.Prefix) {
        let prefix = option.Prefix;
        if (/^\d/.test(prefix)) {
          prefix = "T" + prefix.slice(1);
        }
        newName = `${prefix}${tableName}`;
      } else if (mode === "Suffix" && option.Suffix) {
        newName = `${tableName}${option.Suffix}`;
      }
      setIsLoading(false);
      const targetTableName = schemaName ? `${schemaName}.${newName}` : newName;
      return { [tableName]: targetTableName };
    });
  }

  const [bulkList, setBulkList] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sourceData = pipelines?.[ID]?.data?.source;
    if (sourceData) {
      setSourceData(sourceData);
      setBulkList(sourceData?.bulk_list);
    }
  }, [pipelines?.[ID]]);
  const filteredTables = useMemo(() => {
    if (!selectedConnection || !selectedSchema) return [];

    if (!Array.isArray(bulkList) || bulkList.length === 0) return [];

    return generateTableMappings(
      bulkList,
      { [settings]: settingsValue },
      settings,
      selectedSchema
    );
  }, [bulkList, selectedConnection, selectedSchema, settings, settingsValue]);

  useEffect(() => {
    if (selectedConnection && selectedSchema && ID) {
      const updatedNodeData = {
        connection: selectedConnection,
        schema: selectedSchema,
        metadata_list: filteredTables,
        target_conn_id: nodeData?.target_conn_id,
        target_conn_type: nodeData?.target_conn_type,
      };

      updateData(ID, isPipelineNode, "target", updatedNodeData);
    }
  }, [selectedConnection, selectedSchema, filteredTables, bulkList]);

  const handleSave = () => {
    handleDDLValidation();
  };

  const exportToExcel = () => {
    const rows = [];

    for (const [table, issues] of Object.entries(errorTables)) {
      issues.forEach((issue) => {
        rows.push({ Table: table, Issue: issue });
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Validation Issues");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/T/, "_")
      .replace(/:/g, "-")
      .replace(/\..+/, "");
    const fileName = `validation_issues_${timestamp}.xlsx`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };


  const ValidationModalContent = ({ errorTables }) => {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg ">
        <div className="px-3 py-2 border-b-2 border-gray-200">
          <div className="flex items-center w-full">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600 mr-4">
              <iconify-icon
                icon="material-symbols:warning-outline"
                width="24"
                height="24"
                className="mr-2 text-amber-400"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Validation Issues Detected
              </h3>
            </div>

            <button
              className="ml-auto p-2 rounded-full bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-700 shadow-sm hover:shadow-md transition-transform duration-150 ease-in-out active:scale-90"
              title="Download Report"
              onClick={() => exportToExcel(errorTables)}
            >
              <Download className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="border border-gray-200 rounded-lg shadow-sm mb-4">
            <div className="max-h-[350px] overflow-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-[#29304a] text-white sticky top-0 z-10">
                    <th className="w-1/3 text-left p-3 font-semibold text-sm">
                      <div className="flex items-center">
                        <iconify-icon
                          icon="material-symbols:table"
                          width="18"
                          height="18"
                          className="mr-2"
                        />
                        Table Name
                      </div>
                    </th>
                    <th className="w-2/3 text-left p-3 font-semibold text-sm">
                      <div className="flex items-center">
                        <iconify-icon
                          icon="material-symbols:info-outline"
                          width="18"
                          height="18"
                          className="mr-2"
                        />
                        Error Description
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.keys(errorTables).length > 0 ? (
                    Object.keys(errorTables).map((table, index) => (
                      <tr
                        key={index}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-gray-100 transition-colors`}
                      >
                        <td className="p-3 text-gray-800">
                          <div className="flex items-center">
                            <iconify-icon
                              icon="material-symbols:table-rows-narrow-outline"
                              width="18"
                              height="18"
                              className="text-gray-500 mr-2 flex-shrink-0"
                            />
                            <span className="font-medium truncate" title={table}>
                              {table}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-gray-700 text-sm">
                            {Array.isArray(errorTables[table]) ? (
                              <ul className="list-disc ml-4 space-y-1">
                                {errorTables[table].map((error, errorIndex) => (
                                  <li key={errorIndex} className="text-red-600">
                                    {error}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-red-600">
                                {errorTables[table]}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="p-6 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <iconify-icon
                            icon="material-symbols:check-circle-outline"
                            width="36"
                            height="36"
                            className="text-green-500 mb-2"
                          />
                          No validation errors found
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="px-3 py-2 bg-gray-50 rounded-b-lg border-l-4 border-l-yellow-500 border-gray-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <iconify-icon
                icon="material-symbols:warning-outline"
                width="20"
                height="20"
                style={{ color: "#facc15" }}
                className="mr-3 flex-shrink-0 mt-0.5"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Important Warning
              </h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>
                  Please resolve the validation errors to ensure all partitions
                  and constraints are applied correctly; otherwise, the table may
                  be created without partitions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div
      className={`bg-white rounded-lg p-3 pt-2 shadow-md border-2 ${
        selected ? "border-[#8E77BB]" : "border-gray-300"
      } w-fit min-w-[14vw] max-w-[90vw] relative group grid grid-cols-[repeat(auto-fit,minmax(min-content,1fr))]`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1">
          <iconify-icon
            icon="material-symbols-light:ads-click"
            style={{ color: "#8e78b7" }}
            width="24"
            height="24"
          ></iconify-icon>
          <h3 className="text-black font-medium">Target</h3>
        </div>
 <div className="flex space-x-2">
        <button className="p-1">
          <Minus className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </button>
        <button onClick={() => isPipelineNode ? deletePipeline(pipelineId) : window.deleteNode?.(id)} className="p-1">
          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </button>
      </div>
        {/* {!data?.pipelineId && (
          <div className="flex space-x-2">
            <button className="p-1">
              <Minus className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
            <button onClick={() => window.deleteNode?.(id)} className="p-1">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        )} */}
      </div>

      <Handle type="target" position={Position.Left} />

      <div className="space-y-1.5">
        <div>
          <label
            htmlFor="connection-select"
            className="text-xs font-medium text-black mb-0.5 block"
          >
            Connection
          </label>
          <div className="w-full">
            <select
              id="connection-select"
              className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              value={
                selectedConnectionObj
                  ? JSON.stringify(selectedConnectionObj)
                  : ""
              }
              onChange={(e) => {
                const selectedConnection = JSON.parse(e.target.value);
                handleSelectConnection(selectedConnection);
              }}
            >
              <option value="">Select Connection</option>
              {connections?.length > 0 ? (
                connections.map((connection, idx) => (
                  <option key={idx} value={JSON.stringify(connection)}>
                    {connection.connection_name}
                  </option>
                ))
              ) : (
                <option disabled>No connections available</option>
              )}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="schema-select"
            className="text-xs font-medium text-black mb-0.5 block"
          >
            Schema
          </label>
          <div className="relative w-full flex items-center gap-2">
            <div className="w-full relative">
              <select
                id="schema-select"
                className="w-full min-w-0 p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                value={selectedSchema}
                onChange={(e) => {
                  const schemaName = e.target.value;
                  setSelectedSchema(schemaName);
                }}
                disabled={!selectedConnection || isLoadingSchemas}
              >
                {isLoadingSchemas ? (
                  <option value="">Loading schemas...</option>
                ) : (
                  <>
                    <option value="">Select Schema</option>
                    {schemas?.map((schema) => (
                      <option
                        key={schema.table_schema}
                        value={schema.table_schema}
                      >
                        {schema.table_schema}
                      </option>
                    ))}
                  </>
                )}
              </select>

              {isLoadingSchemas && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>

            {schemaCount?.schema_count && (
              <span className="text-black font-bold">
                {schemaCount.schema_count}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Settings
          </label>
          <select
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            value={settings}
            onChange={handleSettingsChange}
          >
            <option>As is</option>
            <option>Prefix</option>
            <option>Suffix</option>
            {/* <option>Custom</option> */}
          </select>
        </div>
        {settings !== "Prefix/Suffix" && (
          <div>
            <label className="text-xs font-semibold text-black mb-0.5 block">
              Value
            </label>
            <input
              type="text"
              value={settingsValue}
              onChange={handleSettingsValueChange}
              className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            />
          </div>
        )}

        {filteredTables.length > 0 && (
          <>
            <div>
              <div className="flex items-center justify-between my-3">
                <div className="text-sm font-medium text-black">Data Set</div>

                <input
                  type="search"
                  placeholder="Search datasets..."
                  className="p-0.5 text-sm text-black border border-gray-300 rounded-lg focus:outline-none focus:border-[#8e78b7]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div
                className="space-y-2 max-h-40 overflow-y-auto mb-2"
                onWheelCapture={(e) => {
                  e.stopPropagation();
                }}
              >
                {isLoading ? (
                  <>
                    <SkeletonLoader />
                    <SkeletonLoader />
                    <SkeletonLoader />
                  </>
                ) : (
                  filteredTables
                    ?.filter((table) => table !== null)
                    .map((tableObj, idx) => {
                      const [originalName, targetName] =
                        Object.entries(tableObj)[0];
                      return (
                        <div
                          key={`table-row-${idx}`}
                          className="flex items-center justify-between mt-4"
                        >
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`table-${idx}`}
                              checked={true}
                              // onChange={(e) =>
                              //   handleItemSelection(
                              //     e.target.checked,
                              //     targetName
                              //   )
                              // }
                              className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <label
                              htmlFor={`table-${idx}`}
                              className="text-xs font-semibold text-black"
                            >
                              {targetName}
                            </label>
                          </div>
                          {/* <button
                            onClick={() =>
                              openDrawer(
                                data.category || "source",
                                "editTable",
                                id,
                                data.pipelineId,
                                {
                                  source_table: originalName,
                                  target_table: targetName,
                                }
                              )
                            }
                            className="text-purple-600 hover:text-purple-700"
                            aria-label={`Edit ${targetName}`}
                          >
                          </button> */}
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <button
                onClick={handleCancel}
                className="bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-10 border border-gray-700 hover:border-transparent rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={validationInProgress}
                className={`bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-10 border border-gray-700 hover:border-transparent rounded ${
                  validationInProgress ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {validationInProgress ? "Validating..." : "Save"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

TargetNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  selected: PropTypes.bool,
};
