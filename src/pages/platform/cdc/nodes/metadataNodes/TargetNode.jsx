import React, { useState, useCallback, useEffect, useMemo } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { Position } from "reactflow";
import { Handle } from "../../components/CustomHandle";
import { X, Search, ArrowDownUp } from "lucide-react";
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
export function TargetNode({ id, data, selected }) {
  // console.log("TARGET---DATAAA---", data);
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
    setPipelines
  } = useWorkflow();
  const [selectedConnection, setSelectedConnection] = useState("");
  const navigate = useNavigate();
const {refetch}= useMigrationData();
  const [settings, setSettings] = useState(
    data?.settings?.type || "Prefix/Suffix"
  );
  const [settingsValue, setSettingsValue] = useState(
    data?.settings?.value || ""
  );

  const [selectedSchema, setSelectedSchema] = useState(data?.schema || "");
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  let connectionsData;
  let schemadetails;
  const { data: connections, isLoading: isLoadingConnections } =
    useConnections();
  const { data: schemaCount } = useSchemaCount(selectedConnection);
  const { data: schemas, isLoading: isLoadingSchemas } =
    useSchemas(selectedConnection);
  const { data: tables, isLoading: isLoadingTables } = useTables(
    selectedConnection,
    selectedSchema
  );
  const [nodeData, setNodeData] = useState(() => ({
    connection: "",
    schema: "",
    // mode: "",
    metadata_list: [],
    // name:"",
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

  const handleSave = async () => {
    const data = pipelines?.[ID]?.data;

    try {
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

      // console.log("Metadata saved successfully:", response.data);
      toast.success("Metadata saved successfully");
      setPipelines({})
      setNodes([])
      setTimeout(() => {
                navigate(`/details?${encodeURIComponent(encrypt("componentType=migration&heading=metadata"))}`);
                refetch();
          }, 800)
    } catch (error) {
      if (error.response) {
        console.error("Error response:", error.response.data);
      } else if (error.request) {
        console.error("No response from server:", error.request);
      } else {
        console.error("Error setting up request:", error.message);
      }
    }
  };

  // Update parent when connection/schema changes
  // useEffect(() => {
  //   updateNodeData();
  // }, [selectedConnection, selectedSchema, settings, settingsValue]);

  const handleSettingsChange = (event) => {
    setSettings(event.target.value);
  };

  function generateTableMappings(tables, option = {}, mode = "none") {
    return tables.map((tableName) => {
      let newName = tableName;

      if (mode === "Prefix" && option.Prefix) {
        newName = `${option.Prefix}${tableName}`;
      } else if (mode === "Suffix" && option.Suffix) {
        newName = `${tableName}${option.Suffix}`;
      }
      setIsLoading(false)
      return { [tableName]: newName };
    });
  }
  const [bulkList, setBulkList] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading]= useState(true)
  useEffect(() => {
    const sourceData = pipelines?.[ID]?.data?.source;
    if (sourceData) {
      setSourceData(sourceData);
      setBulkList(sourceData?.bulk_list);
    }
  }, pipelines?.ID);

  const filteredTables = useMemo(() => {
    if (!Array.isArray(tables) || tables.length === 0) return [];

    return generateTableMappings(
      bulkList,
      { [settings]: settingsValue },
      settings
    );

    return processedData.filter((table) =>
      table?.target_table
        ?.toLowerCase()
        .includes(searchTerm?.toLowerCase() || "")
    );
  }, [tables, bulkList, searchTerm, selectedSchema, settingsValue]);

  useEffect(() => {
    if (selectedConnection && selectedSchema && ID) {
      const updatedNodeData = {
        connection: selectedConnection,
        schema: selectedSchema,
        metadata_list: filteredTables,
        target_conn_id: nodeData?.target_conn_id,
        target_conn_type: nodeData?.target_conn_type,
      };
      // setNodeData(updatedNodeData);

      updateData(ID, isPipelineNode, "target", updatedNodeData);
    }
  }, [selectedConnection, selectedSchema, filteredTables]);
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

        {!data?.pipelineId && (
          <div className="flex space-x-2">
            <button className="p-1">
              <Minus className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
            <button onClick={() => window.deleteNode?.(id)} className="p-1">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        )}
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
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Schema
          </label>
          <select
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            value={selectedSchema}
            onChange={(e) => {
              const schemaName = e.target.value;
              setSelectedSchema(schemaName);
            }}
            disabled={!selectedConnection || schemaLoading}
          >
            {schemaLoading ? (
              <option value="">Loading schemas...</option>
            ) : (
              <>
                <option value="">Select Schema</option>
                {schemas?.map((schema, idx) => (
                  <option key={idx} value={schema.table_schema}>
                    {schema.table_schema}
                  </option>
                ))}
              </>
            )}
          </select>
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
            <option>Prefix/Suffix</option>
            <option>Prefix</option>
            <option>Suffix</option>
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
              onChange={(e) => {
                setSettingsValue(e.target.value);
                // data.onDataChange({
                //   settings: {
                //     type: settings,
                //     value: e.target.value,
                //   },
                // });
              }}
              className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            />
          </div>
        )}

        {filteredTables.length>0 && (
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
                            onChange={(e) =>
                              handleItemSelection(e.target.checked, targetName)
                            }
                            className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <label
                            htmlFor={`table-${idx}`}
                            className="text-xs font-semibold text-black"
                          >
                            {targetName}
                          </label>
                        </div>
                        <button
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
                          {/* Icon can be added here */}
                        </button>
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
            className="bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-10 border border-gray-700 hover:border-transparent rounded"
          >
            Save
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
};
