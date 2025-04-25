import React, { useState, useCallback, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Position } from "reactflow";
import { useDrawerContext } from "../../context/DrawerContext";
import { Handle } from "../../components/CustomHandle";
import { useWorkflow } from "../../context/WorkflowContext";
import {
  Minus,
  X,
  Search,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast as hotToast } from "react-hot-toast";
import { SkeletonLoader } from "../../components/skeltonLoader";
import { useAuth } from "../../../../../context/AuthContext";
import {
  useConnections,
  useSchemaCount,
  useSchemas,
  useTables,
  useBulkTables,
} from "../../hooks/DataFetch";

export function TargetNode({ id, data, selected }) {
  // console.log("TARGET DATA",data)
  const [loading, setLoading] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [selectedSchema, setSelectedSchema] = useState("");
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { openDrawer } = useDrawerContext();
  const [sourceConnection, setSourceConnection] = useState("");
  const [sourceSchema, setSourceSchema] = useState("");

  const [bulkList, setBulkList] = useState([]);
  const [selectedConnectionObj, setSelectedConnectionObj] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const [nodeData, setNodeData] = useState(() => ({
    connection: "",
    schema: "",
    mode: "",
    bulk_list: [],
    subset_list: [],
    target_conn_id: "",
  }));
  const { data: connections, isLoading: isLoadingConnections } =
    useConnections();
  const { data: schemaCount } = useSchemaCount(selectedConnection);
  const { data: schemas, isLoading: isLoadingSchemas } =
    useSchemas(selectedConnection);
  const { data: tables } = useTables(
    selectedConnection,
    selectedSchema,
    selectedMode
  );
  const { data: bulkTables=[] } = useBulkTables(
    sourceConnection,
    selectedConnection,
    sourceSchema
  );

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
  } = useWorkflow();

  useEffect(() => {
    let sourceArray = isPipelineNode
      ? pipelines?.[ID]?.data?.source
      : data?.source;
    const firstSource = isPipelineNode
      ? sourceArray
      : Array.isArray(sourceArray)
      ? sourceArray[0]
      : undefined;
    if (firstSource) {
      setSourceConnection(firstSource?.connection || "");
      setSourceSchema(firstSource?.schema);
      setBulkList(firstSource?.bulk_list || []);
      setSelectedMode(firstSource?.mode || "bulk");
    }
  }, [pipelines, pipelineId, data?.source, isPipelineNode]);

  


  const filteredTables = useMemo(() => {
    if (selectedMode == "bulk")
      return bulkTables?.filter((item) =>
        bulkList?.includes(item.source_table)
      );

    if (!Array.isArray(tables) || tables.length === 0) return [];

    let dataSource = tables;

    const processedData =
      selectedMode === "subset"
        ? dataSource.map((item) => ({
            target_table: item.source_table,
            connection_name: item.connection_name,
            connection_id: item.connection_id,
            source_schema: item.source_schema,
          }))
        : [];

    return processedData.filter((table) =>
      table?.target_table
        ?.toLowerCase()
        .includes(searchTerm?.toLowerCase() || "")
    );
  }, [selectedMode, tables, bulkList, searchTerm, selectedSchema]);

  useEffect(() => {
    if (filteredTables) {
      setLoading(false);
    }
  }, [filteredTables]);


  const handleOkClick = () => {
    if (selectedConnection && selectedSchema && selectedMode) {
      const updatedNodeData = {
        connection: selectedConnection,
        schema: selectedSchema,
        mode: selectedMode,
        bulk_list: selectedItems.map((item) => item.metadata_id),
      };
      updateData(ID, isPipelineNode, "target", updatedNodeData);
    }
  };
  const firstSource = Array.isArray(data?.source) ? data.source[0] : undefined;

  const constructedKey = `${firstSource?.id}-${ID}`;
  const pipelineData = isPipelineNode
    ? pipelineMappings[pipelineId] || []
    : pipelineMappings[constructedKey] || [];

  const targetTables = pipelineData.map((mapping) => mapping.target_table);
  const sourceTables = pipelineData.map((mapping) => mapping.source_table);

  const sourceTable = isPipelineNode
    ? inProgressMappings[pipelineId]?.source_table
    : inProgressMappings[firstSource?.id]?.source_table;


  const showTablesList = Boolean(
    selectedMode === "bulk"
      ? !loading || filteredTables?.length > 0 
      : (pipelineMappings[pipelineId]?.length ?? 0) > 0 ||
          (pipelineMappings[constructedKey]?.length ?? 0) > 0
  );
  const handleAddTable = () => {
    if (sourceTable) {
      const tableData = {
        table_name: sourceTable,
        Data: isPipelineNode
          ? pipelines[ID]?.data
          : Array.isArray(data?.source)
          ? data.source[0]
          : undefined,
        pipelineId: data?.pipelineId,
      };

      openDrawer(data?.category, "addtable", id, data?.pipelineId, tableData);
    } else {
      hotToast.error("No source table selected");
    }
  };

  useEffect(() => {
    if (selectedConnection && selectedSchema && ID) {
      const key = isPipelineNode ? ID : constructedKey;
      const updatedNodeData = {
        connection: selectedConnection,
        schema: selectedSchema,
        mode: selectedMode,
        bulk_list:
          selectedMode === "bulk" ? bulkMappings[key] : pipelineMappings[key],
        target_conn_id: nodeData?.target_conn_id,
        source: data?.source?.[0],
        define: data?.source?.[0]?.define,
      };
      setNodeData(updatedNodeData);

      updateData(ID, isPipelineNode, "target", updatedNodeData);
    }
  }, [
    selectedConnection,
    selectedSchema,
    selectedItems,
    bulkMappings,
    pipelineMappings,
  ]);

  const [openSections, setOpenSections] = useState({});

  const toggleSection = (sourceIdx) => {
    setOpenSections((prev) => ({
      ...prev,
      [sourceIdx]: !prev[sourceIdx],
    }));
  };

  useEffect(() => {
    if (filteredTables?.length > 0 && Object.keys(openSections).length === 0) {
      const initialState = {};
      filteredTables.forEach((_, idx) => {
        initialState[idx] = true;
      });
      setOpenSections(initialState);
    }
  }, [filteredTables]);

  return (
    <div
      className={`bg-white rounded-lg p-3 pt-2 shadow-md border-2 ${
        selected ? "border-[#8E77BB]" : "border-gray-300"
      } w-fit min-w-[18vw] max-w-[90vw] relative group grid grid-cols-[repeat(auto-fit,minmax(min-content,1fr))]`}
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
      {/* <Handle type="source" position={Position.Right} /> */}

      <div className="space-y-1.5">
        <div>
          <label className="text-xs font-medium text-black mb-0.5 block">
            Connection
          </label>
          <div className="w-full">
            <select
              className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              value={
                selectedConnectionObj
                  ? JSON.stringify(selectedConnectionObj)
                  : ""
              }
              onChange={(e) => {
                const selectedConnection = JSON.parse(e.target.value);
                setSelectedConnectionObj(selectedConnection);
                setSelectedConnection(selectedConnection.connection_name);
                setSelectedSchema("");
                setNodeData((prevData) => ({
                  ...prevData,
                  target_conn_id: selectedConnection.connection_id,
                }));
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
          <label className="text-xs font-medium text-black mb-0.5 block">
            Schema
          </label>
          <div className="relative w-full flex items-center gap-2">
            <div className="w-full relative">
              <select
                className="w-full min-w-0 p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                value={selectedSchema}
                onChange={(e) => {
                  const schemaName = e.target.value;
                  setSelectedSchema(schemaName);
                  setLoading(true);
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

              {schemaLoading && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>

            <span className="text-black font-bold">
              {schemaCount?.schema_count}
            </span>
          </div>
        </div>
      </div>

      {showSearch && tables?.length > 0 && (
        <input
          type="search"
          placeholder="Search datasets..."
          className="w-full p-2 mb-2 text-xs text-black border border-gray-300 rounded-lg focus:outline-none focus:border-[#8e78b7]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      )}

      {filteredTables &&
        filteredTables.length > 0 &&
        selectedMode === "subset" && (
          <div>
            <div className="flex items-center space-x-2 my-2">
              <span className="text-sm font-semibold text-black">Map for:</span>
              <span className="text-sm text-gray-700">
                {sourceTable || "No source selected"}
              </span>
            </div>
            <select
              id="connection-select"
              className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              // value={selectedConnection}
              onChange={(e) =>
                completeMapping(
                  ID,
                  firstSource?.id,
                  e.target.value,
                  isPipelineNode
                )
              }
            >
              <option value="">Select Table</option>
              {filteredTables.map((table, idx) => (
                <option
                  key={idx}
                  // value={table.connection_name}
                >
                  {table.target_table}
                </option>
              ))}
            </select>
          </div>
        )}

      {showTablesList &&selectedConnection &&selectedSchema && (
        <div className="my-3">
          <div className="flex items-center justify-between mb-2">
            <div
              className="flex items-center gap-1 cursor-pointer"
              onClick={() => setShowSearch(!showSearch)}
            >
              <label className="text-sm font-medium text-black">Data Set</label>
              {showSearch && <Search size={16} className="text-gray-500" />}
            </div>
          </div>

          <div
            className="space-y-2 max-h-60 overflow-y-auto mt-2"
            onWheelCapture={(e) => e.stopPropagation()}
          >

            {loading ? (
              <>
                <SkeletonLoader />
                <SkeletonLoader />
                <SkeletonLoader />
              </>
            ) : filteredTables.length === 0 ? (
              <div className="text-sm text-gray-500 py-2">No tables found</div>
            ) : (
              <div>
                {selectedMode == "bulk" ? (
                  filteredTables.map((sourceGroup, sourceIdx) => {
                    const isOpen = openSections[sourceIdx] ?? true;
                    const allTargetsSelected = sourceGroup.target_tables.every(
                      (targetTable) =>
                        bulkMappings[
                          isPipelineNode ? ID : constructedKey
                        ]?.some(
                          (item) =>
                            item.source_table === sourceGroup.source_table &&
                            item.target_table === targetTable
                        )
                    );

                    return (
                      <div
                        key={sourceIdx}
                        className="border rounded-md p-2 m-2"
                      >
                        <div className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            id={`source-${sourceIdx}`}
                            checked={
                              allTargetsSelected &&
                              sourceGroup.target_tables.length > 0
                            }
                            onChange={(e) => {
                              const checked = e.target.checked;

                              if (checked) {
                                sourceGroup.target_tables.forEach(
                                  (targetTable) => {
                                    addBulkMapping(
                                      firstSource?.id,
                                      ID,
                                      {
                                        source_table: sourceGroup.source_table,
                                        target_table: targetTable,
                                      },
                                      isPipelineNode
                                    );
                                  }
                                );
                              } else {
                                sourceGroup.target_tables.forEach(
                                  (targetTable) => {
                                    deselectMapping(
                                      ID,
                                      {
                                        source_table: sourceGroup.source_table,
                                        target_table: targetTable,
                                      },
                                      isPipelineNode
                                    );
                                  }
                                );
                              }
                            }}
                            className="h-4 w-4 mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />

                          <button
                            onClick={() => toggleSection(sourceIdx)}
                            className="text-sm font-bold text-black hover:text-purple-600 focus:outline-none"
                          >
                            {sourceGroup.source_table}
                          </button>
                        </div>

                        {isOpen && (
                          <div className="ml-6 space-y-2">
                            {sourceGroup.target_tables.map(
                              (targetTable, targetIdx) => {
                                const isTargetSelected = bulkMappings[
                                  isPipelineNode ? ID : constructedKey
                                ]?.some(
                                  (item) =>
                                    item.source_table ===
                                      sourceGroup.source_table &&
                                    item.target_table === targetTable
                                );

                                return (
                                  <div
                                    key={targetIdx}
                                    className="flex items-center justify-between"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id={`target-${sourceIdx}-${targetIdx}`}
                                        checked={isTargetSelected}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          if (checked) {
                                            addBulkMapping(
                                              firstSource?.id,
                                              ID,
                                              {
                                                source_table:
                                                  sourceGroup.source_table,
                                                target_table: targetTable,
                                              },
                                              isPipelineNode
                                            );
                                          } else {
                                            deselectMapping(
                                              ID,
                                              {
                                                target_table: target_table,
                                                source_table:
                                                  sourceGroup.source_table,
                                              },
                                              isPipelineNode
                                            );
                                          }
                                        }}
                                        className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                      />
                                      <label
                                        htmlFor={`target-${sourceIdx}-${targetIdx}`}
                                        className="text-xs font-semibold text-black"
                                      >
                                        {targetTable}
                                      </label>
                                    </div>

                                    <button
                                      onClick={() =>
                                        openDrawer(
                                          data?.category,
                                          "condition",
                                          id,
                                          data?.pipelineId,
                                          {
                                            source_table:
                                              sourceGroup.source_table,
                                            target_table: targetTable,
                                            metadata_id:
                                              sourceGroup.metadata_id,
                                          }
                                        )
                                      }
                                      className="text-purple-600 hover:text-purple-700"
                                    >
                                      <Pencil className="w-4 h-4 ml-8" />
                                    </button>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="max-w-sm mx-auto">
                      <div>
                        {targetTables.map((targetTable, idx) => (
                          <div
                            key={`target-table-${idx}`}
                            className="flex items-center justify-between mt-4"
                          >
                            <div className="flex items-center space-x-2 ">
                              <input
                                type="checkbox"
                                id={`target-${idx}`}
                                checked={true}
                                onChange={(e) =>
                                  handleItemSelection(e.target.checked, {
                                    source_table: sourceTables[idx],
                                    target_table: targetTable,
                                  })
                                }
                                className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                              <label
                                htmlFor={`target-${idx}`}
                                className="text-xs font-semibold text-black"
                              >
                                {targetTable}
                              </label>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  openDrawer(
                                    data.category,
                                    "editTable",
                                    id,
                                    data.pipelineId,
                                    sourceTable
                                  )
                                }
                                className="text-purple-600 hover:text-purple-700"
                                aria-label={`Edit ${sourceTable}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  deleteMapping(
                                    data?.source?.id,
                                    ID,
                                    idx,
                                    isPipelineNode
                                  )
                                }
                                className="text-red-600 hover:text-red-700"
                                aria-label={`Delete ${sourceTable}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {selectedMode == "subset" && selectedSchema && (
        <button
          className="w-full py-1 px-4 flex items-center justify-center border border-dashed border-[#8e78b7]  text-[#8e78b7] rounded-md  bg-transparent transition-all duration-200 ease-in-out
                                                          hover:bg-[#8e78b7] hover:text-white mt-2"
          onClick={handleAddTable}
        >
          + Add table
        </button>
      )}
      <div className="flex space-x-2 mt-4">
        <button className="bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-10 border border-[#8e78b7] hover:border-transparent rounded"
        onClick={
          ()=>{
            setSelectedConnection("");
            setSelectedSchema("");
          }
          }
        
        >
          Cancel
        </button>
        <button 
          onClick={handleOkClick}
          className="bg-[#8e78b7] text-white hover:bg-gray-400 text-xs text-gray-700 font-semibold hover:text-white py-2 px-10 border border-[#8e78b7] hover:border-transparent rounded">
          Save
        </button>
      </div>
    </div>
  );
}

TargetNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  selected: PropTypes.bool,
};
