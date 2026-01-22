import { useState, useCallback, useRef, useEffect } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import PurgeSidebar from './PurgeSidebar';
import Define from './purge-nodes/Define';
import Source from './purge-nodes/Source';
import Target from './purge-nodes/Target';
import { PurgeContextProvider, usePurgeContext} from './PurgeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import PurgeFilterDrawer from './drawer/PurgeFilterDrawer';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { useModal } from '../cdc/context/ModalProvider';
import axios from 'axios';

const purgeNodeTypes = {
  define: Define,
  source: Source,
  target: Target,
};

const purgeInitialNodes = [
  { id: 'define', type: 'define', position: { x: 0, y: -400 }, data: { label: 'Define', isConnectable: true } },
  { id: 'source', type: 'source', position: { x: 400, y: -400 }, data: { label: 'Source', isConnectable: true } },
  { id: 'target', type: 'target', position: { x: 800, y: -400 }, data: { label: 'Target', isConnectable: true } }
];

const purgeInitialEdges = [
  { id: 'e-define-source', source: 'define', target: 'source' },
  { id: 'e-source-target', source: 'source', target: 'target' }
];


export default function PurgeCanvas() {
  return (
    <PurgeContextProvider>
      <PurgeCanvasInner />
    </PurgeContextProvider>
  );
}

function PurgeCanvasInner() {
  const [nodes, setNodes] = useState(purgeInitialNodes);
  const [edges, setEdges] = useState(purgeInitialEdges);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const reactFlowWrapper = useRef(null);
  const navigate = useNavigate();
  const { purgeData, setPurgeData } = usePurgeContext();
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const { openModal, closeModal } = useModal();
  const [isEditMode, setIsEditMode] = useState(false);

  const location = useLocation();
  
  const presentNodeTypes = nodes.reduce((acc, node) => {
    acc[node.type] = true;
    return acc;
  }, {});

  const { decodedToken, token, hostnameV1, hostnameV2, project } = useAuth();

  useEffect(() => {
    const state = location.state;

    if (state?.ui_json && state?.purge_id) {
      setPurgeData({...state.ui_json, isEditMode: true});
      setIsEditMode(true);
    }
  }, [location.state]);

  // Node deletion logic
  const deleteNode = useCallback((id) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setPurgeData((prev) => {
      const newData = { ...prev };
      delete newData[id];
      return newData;
    });
  }, [setPurgeData]);

  // Expose deleteNode globally for node components
  useEffect(() => {
    window.deleteNode = deleteNode;
    return () => { window.deleteNode = undefined; };
  }, [deleteNode]);

  // Expose openDrawer globally for node components
  useEffect(() => {
    window.openDrawer = (table) => {
      setSelectedTable(table);
      setDrawerOpen(true);
    };
    return () => { window.openDrawer = undefined; };
  }, []);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [],
  );

  // Drag and drop support
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!reactFlowInstance) return;
      const data = JSON.parse(event.dataTransfer.getData('application/reactflow'));
      if (!data?.type) return;

      // Prevent adding more than one node of each type
      if (presentNodeTypes[data.type]) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${data.type}`,
        type: data.type,
        position,
        data: { label: data.type.charAt(0).toUpperCase() + data.type.slice(1), isConnectable: true },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [presentNodeTypes, reactFlowInstance],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  function parseWhereCondition(whereCondition) {
    const regex = /where\s+([\w\s.\(\)]+?)\s+(=|!=|<>|>=|<=|<|>|LIKE|IN)\s+(.+)/i;

    const match = whereCondition.trim().match(regex);

    if (match) {
      const columnName = match[1].trim();
      const operator = match[2].trim().toUpperCase();
      const value = match[3].trim();

      const condition = `${columnName} ${operator} ${value}`;

      return {
        condition,
        column_name: columnName,
        is_complex: "Yes",
      };
    }

    return null;
  }

  function getComplexConditionColumnName(complexQuery) {
    const regex = /where\s+([\w\s.\(\)]+?)\s+(=|!=|<>|>=|<=|<|>|LIKE|IN)\s+(.+)/i;

    const match = complexQuery.trim().match(regex);

    if (match) {
      const columnName = match[1].trim();
      return columnName;
    }
    return null;
  }

  const buildWhereCondition = (currentTableFilter) => {
    if (!currentTableFilter?.whereCondition?.length) return "";

    const complexFilter = currentTableFilter.whereCondition.find(
      f => f?.type === "complex"
    );

    if (complexFilter) {
      return complexFilter.query ? `where ${complexFilter.query}` : "";
    }

    const whereClauses = currentTableFilter.whereCondition.map(
      wc => `${wc.columnName} ${wc.filterOperator} ${wc.value}`
    );
    return "where " + whereClauses.join(" and ");
  };

  const findTableFilter = (filters, sourceTable, targetTable) => {
    return filters.find(
      f => f?.sourceTable === sourceTable &&
        f?.targetTable === targetTable &&
        f?.whereCondition?.length > 0
    );
  };

  const findPartitionDetails = (dropPartitions, sourceTable, targetTable) => {
    return dropPartitions.find(
      f => f?.sourceTable === sourceTable && f?.targetTable === targetTable
    ) || {};
  };

  const buildWhereConditionPayload = (whereConditions) => {
    const complexFilter = whereConditions.find(f => f?.type === "complex");

    if (complexFilter) {
      return {
        iscomplexwherecondition: "Yes",
        wherecondition: complexFilter?.query,
        complex_where_column: getComplexConditionColumnName(`where ${complexFilter?.query}`)
      };
    }

    return {
      iscomplexwherecondition: "No",
      wherecondition: whereConditions.map(wc => ({
        wherecolumn: wc.columnName,
        whereoperator: wc.filterOperator,
        wherevalues: wc.value
      }))
    };
  };

const isPurgePayloadValid = (payload) => {
  const showError = (message) => {
    toast.error(message);
    return false;
  };

  const scope = purgeData?.source?.scope;
  if (!scope) return showError("Select scope before proceeding!");

  if (scope === "bulk") {
    if (!payload.source_schema) return showError("Source schema can't be empty!");
    if (!payload.target_schema) return showError("Target schema can't be empty!");
    if (!payload?.purge_list?.length) return showError("Select atleast one source and target table!");

    const invalidItems = payload.purge_list.filter(item => !item?.source_table || !item?.target_table);
    if (invalidItems.length > 0) return showError("Select source and target tables for each purge item");
  }

  if (scope === "subset") {
    const validations = [
      [payload.source_table, "Source table can't be empty!"],
      [payload.target_table, "Target table can't be empty!"],
      [payload.source_purge_info?.sourceConnName, "Source connection can't be empty!"],
      [payload.source_purge_info?.sourceSchemaName, "Source schema can't be empty!"],
      [payload.source_purge_info?.sourceObjectName, "Source table can't be empty!"],
      [payload.target_purge_info?.targetConnName, "Target connection can't be empty!"],
      [payload.target_purge_info?.targetSchemaName, "Target schema can't be empty!"],
      [payload.target_purge_info?.targetObjectName, "Target table can't be empty!"]
    ];

    for (const [value, message] of validations) {
      if (!value) return showError(message);
    }
  }

  if (!payload.source_conn_id) return showError("Source connection can't be empty!");
  if (!payload.target_conn_id) return showError("Target connection can't be empty!");
  if (!payload.purge_auto_name && !payload.purge_name) return showError("Purge name can't be empty!");

  return true;
};
  const handleSave = () => {
    const payload = {
      created_by: decodedToken?.preferred_username,
      description: purgeData["define"]?.desc || "",
      project: project ?? "default",
      purge_auto_name: purgeData["define"]?.name || "",
      purge_name: purgeData["define"]?.name || "",
      ui_json: purgeData
    };

    const scope = purgeData?.["source"]?.scope || null;

    if (scope === "bulk") {
      payload.source_conn_id = purgeData?.source?.connection_id;
      payload.target_conn_id = purgeData?.target?.connection_id;
      payload.source_schema = purgeData?.source?.schema;
      payload.target_schema = purgeData?.target?.schema;

      const targetToSourceMappings = purgeData?.target?.targetToSourceMapping || [];
      
      if (!targetToSourceMappings.length) {
        toast.error("Select atleast one source and one target table.");
        return;
      }

      const filters = purgeData?.source?.filters || [];
      const dropPartitions = purgeData?.source?.dropPartitions || [];

      payload.purge_list = targetToSourceMappings.map(d => {
        const { sourceTable, targetTable } = d;

        const currentTableFilter = findTableFilter(filters, sourceTable, targetTable);

        const { sourcePartition, targetPartition } = findPartitionDetails(
          dropPartitions,
          sourceTable,
          targetTable
        );

        return {
          source_table: sourceTable,
          target_table: targetTable,
          schedule: {},
          whereCondition: buildWhereCondition(currentTableFilter),
          target_partition: targetPartition ?? {},
          source_partition: sourcePartition ?? {}
        };
      });

    } else if (scope === "subset") {
      const sourceTable = purgeData?.source?.sourceTable;
      const targetTable = purgeData?.target?.targetTable;
      const filters = purgeData?.source?.filters || [];
      const dropPartitions = purgeData?.source?.dropPartitions || [];

      const currentTableWhereConditions = findTableFilter(
        filters,
        sourceTable,
        targetTable
      )?.whereCondition || [];

      const { sourcePartition, targetPartition } = findPartitionDetails(
        dropPartitions,
        sourceTable,
        targetTable
      );

      const whereConditionPayload = buildWhereConditionPayload(currentTableWhereConditions);

      payload.source_purge_info = {
        sourceConnName: purgeData?.source?.connection,
        sourceObjectName: sourceTable,
        sourcePath: "",
        sourceSchemaName: purgeData?.source?.schema,
        sourceType: purgeData?.source?.connection_type,
        partition_details: sourcePartition ?? {},
        ...whereConditionPayload
      };

      payload.target_purge_info = {
        loadParams: {
          changeCondition: "",
          changeType: "",
          checksumColumns: "",
          loadType: "FULL",
          surrogateKey: "",
          targetPk: ""
        },
        targetConnName: purgeData?.target?.connection,
        targetObjectName: targetTable,
        targetPath: "",
        targetType: purgeData?.target?.connection_type,
        targetSchemaName: purgeData?.target?.schema,
        partition_details: targetPartition ?? {},
      };

      Object.assign(payload, {
        extra_info: {},
        gather_stats: false,
        is_paused: false,
        scheduler: {
          endLoadDate: "",
          scheduleinterval: {},
          schedulerColumn: null,
          startLoadDate: "",
          startdatetime: ""
        },
        source_conn_id: purgeData["source"]?.connection_id,
        source_conn_name: purgeData["source"]?.connection,
        source_conn_type: purgeData["source"]?.connection_type,
        target_conn_id: purgeData["target"]?.connection_id,
        target_conn_name: purgeData["target"]?.connection,
        target_conn_type: purgeData["target"]?.connection_type,
        source_table: sourceTable,
        target_table: targetTable,
        status: "Pending"
      });
    }
    
    if(!isPurgePayloadValid(payload))
      return;

    // Confirmation Modal
    openModal({
      title: "Purge Confirmation",
      message: `Do you want to proceed with ${isEditMode ? "updating" : "creating"} Purge?`,
      type: "question",
      confirmText: "Yes",
      loadingText: "Saving",
      onConfirm: async () => {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
      };
        try {
          let request;
          
          if (purgeData?.source?.scope === "bulk") {
            request = !isEditMode ? axios.post(`${hostnameV2}/create-purge`, payload, config) : axios.put(`${hostnameV2}/update-purge`, payload, config);
          } else if (purgeData?.source?.scope === "subset") {
            request = !isEditMode ? axios.post(`${hostnameV1}/purges`, payload, config) : axios.put(`${hostnameV1}/edit-purges`, payload, config);
          }

          await request;

          setTimeout(() => {
            openModal({
              title: "Success!",
              message: `Your Purge has been ${isEditMode ? "updated" : "created"} successfully.`,
              type: "success",
              onClose: () => {
                closeModal();
                navigate("/purge");
              },
            });
            setNodes([]);
          }, 800);
        } catch (e) {
          toast.error(`Error saving purge: ${e.message}`);
        }
      },
    });
  };


  return (
    <div>
      <div style={{ width: '100vw', height: '90vh' }} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          nodeTypes={purgeNodeTypes}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onInit={setReactFlowInstance}
          className="bg-gray-50"
          style={{ width: "100%", height: "100%" }}
        >
          <PurgeSidebar presentNodeTypes={presentNodeTypes} />
          <Controls className="fill-white stroke-black" />
        </ReactFlow>
      </div>
      <div className="fixed bottom-8 right-8 flex space-x-4">
        <button
          className="bg-white rounded-md border-2 border-[#8E77BB] shadow-md px-6 py-2 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          onClick={() => navigate("/purge")}
        >
          Cancel
        </button>
        <button
          className="bg-[#8E77BB] rounded-md border-2 border-[#8E77BB] shadow-md px-6 py-2 text-white font-medium hover:bg-[#7d68a5] transition-colors"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
      {drawerOpen && <PurgeFilterDrawer table={selectedTable} onClose={() => setDrawerOpen(false)} />}
    </div>
  );
}