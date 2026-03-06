import { useState, useCallback, useRef, useEffect } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import MigrationSidebar from './MigrationSidebar';
import Define from './nodes/Define';
import Source from './nodes/Source';
import Target from './nodes/Target';
import Scheduler from './nodes/Scheduler';
import DefineMeta from './nodes/metadata/Define';
import SourceMeta from './nodes/metadata/Source';
import TargetMeta from './nodes/metadata/Target';
import { MigrationContextProvider } from './MigrationContext';
import { MetadataProvider } from './MetadataContext';
import { useMigrationContext } from './MigrationContext';
import { useMetadata } from './MetadataContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useModal } from '../../cdc/context/ModalProvider';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import FilterDrawer from './drawer/FilterDrawer';
import { encrypt } from '../../../../utils/Crypto';

const migrationNodeTypes = {
  define: Define,
  source: Source,
  target: Target,
  scheduler: Scheduler,
};

const metadataNodeTypes = {
  define: DefineMeta,
  source: SourceMeta,
  target: TargetMeta,
};

const migrationInitialNodes = [
  { id: 'define', type: 'define', position: { x: 0, y: -400 }, data: { label: 'Define' } },
  { id: 'source', type: 'source', position: { x: 400, y: -400 }, data: { label: 'Source' } },
  { id: 'target', type: 'target', position: { x: 800, y: -400 }, data: { label: 'Target' } },
  { id: 'scheduler', type: 'scheduler', position: { x: 1250, y: -400 }, data: { label: 'Scheduler' } }
];

const migrationInitialEdges = [
  { id: 'e-define-source', source: 'define', target: 'source' },
  { id: 'e-source-target', source: 'source', target: 'target' },
  { id: 'e-target-scheduler', source: 'target', target: 'scheduler' }
];

const metadataInitialNodes = [
  { id: 'define', type: 'define', position: { x: 0, y: -400 }, data: { label: 'Define' } },
  { id: 'source', type: 'source', position: { x: 350, y: -400 }, data: { label: 'Source' } },
  { id: 'target', type: 'target', position: { x: 750, y: -400 }, data: { label: 'Target' } }
];

const metadataInitialEdges = [
  { id: 'e-define-source', source: 'define', target: 'source' },
  { id: 'e-source-target', source: 'source', target: 'target' }
];

export default function MigrationCanvas() {
  return (
    <MigrationContextProvider>
      <MetadataProvider>
        <MigrationCanvasInner />
      </MetadataProvider>
    </MigrationContextProvider>
  );
}

function MigrationCanvasInner() {
  const location = useLocation();
  const [mode, setMode] = useState("migration");
  const [nodes, setNodes] = useState(migrationInitialNodes);
  const [edges, setEdges] = useState(migrationInitialEdges);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const reactFlowWrapper = useRef(null);
  const navigate = useNavigate();
  const { migrationData, setMigrationData } = useMigrationContext();
  const { metadataData, setMetadataData } = useMetadata();
  const { token, decodedToken, project, hostnameV1, hostnameV2 } = useAuth();
  const { openModal, closeModal } = useModal();

  const [isEditMode, setIsEditMode] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  useEffect(() => {
    const state = location.state;
    // console.log("Navigation State:", state);
    if (state?.isEditMode && state?.nodeJson) {
      setMigrationData(state.nodeJson);
      setIsEditMode(true);
      // console.log("Prefilled Migration Data:", state.nodeJson);
    }
  }, [location.state, setMigrationData]);

  const nodeTypes = mode === "migration" ? migrationNodeTypes : metadataNodeTypes;

  const presentNodeTypes = nodes.reduce((acc, node) => {
    acc[node.type] = true;
    return acc;
  }, {});

  // Node deletion logic
  const deleteNode = useCallback((id) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    if (mode === "metadata") {
      setMetadataData((prev) => {
        const newData = { ...prev };
        delete newData[id];
        return newData;
      });
    }
  }, [mode, setMetadataData]);

  // Expose deleteNode globally for node components
  useEffect(() => {
    window.deleteNode = deleteNode;
    return () => { window.deleteNode = undefined; };
  }, [deleteNode]);

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
    (params) => setEdges((eds) => addEdge(params, eds)),
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
        data: { label: data.type.charAt(0).toUpperCase() + data.type.slice(1) },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [presentNodeTypes, reactFlowInstance],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    setMigrationData({});
    setMetadataData({});
    if (newMode === "migration") {
      setNodes(migrationInitialNodes);
      setEdges(migrationInitialEdges);
    } else {
      setNodes(metadataInitialNodes);
      setEdges(metadataInitialEdges);
    }
  }, []);

  const metaDataSave = async () => {
    const data = {
      metadata_name: metadataData.define?.name ?? "",
      metadata_auto_name: metadataData.define?.name ?? "",
      description: metadataData.define?.description ?? "",
      project: project ?? "default",
      created_by: decodedToken?.preferred_username ?? "",
      conn_type: metadataData.source?.source_conn_type ?? "",
      source_conn_id: metadataData.source?.source_conn_id ?? "",
      target_conn_id: metadataData.target?.target_conn_id ?? "",
      table_list:
        metadataData.target?.transformedTables?.map(t => ({ [t.source]: t.target })) ?? [],
    };

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      const { data: validation } = await axios.post(`${hostnameV1}/validate-ddl`, data, config);

      if (!validation.success) {
        return toast.error(`Validation failed: ${validation.detail}`);
      }

      openModal({
        title: "Validation Successful",
        message: "The metadata has been validated successfully. Do you want to proceed with saving?",
        type: "question",
        confirmText: "Yes",
        loadingText: "Saving",
        onConfirm: async () => {
          try {
            await axios.post(`${hostnameV1}/ddl-migration`, data, config);
            setTimeout(() => {
              openModal({
                title: "Success!",
                message: "Your Metadata has been saved successfully.",
                type: "success",
                onClose: handleCloseModal,
              });
              setNodes([]);
            }, 800);
          } catch (e) {
            toast.error(`Error saving metadata: ${e.message}`);
          }
        },
      });
    } catch (e) {
      const msg =
        e.response?.data?.detail ??
        (e.request ? "Network Error: No response from server." : e.message);
      toast.error(`Validation Error: ${msg}`);
    }
  };

  const buildWhereCondition = (currentTableFilter) => {
    if (!currentTableFilter?.whereCondition?.length) return "";

    const complexFilter = currentTableFilter.whereCondition.find(
      f => f?.type === "complex"
    );

    if (complexFilter) {
      return complexFilter.query ? `where ${complexFilter.query}` : "";
    }

    return currentTableFilter.whereCondition.map(wc => ({
      wherecolumn: wc.columnName,
      whereoperator: wc.filterOperator,
      wherevalues: wc.value,
    }));
  };

  const isMigrationPayloadValid = (payload) => {

    if (!payload?.source_conn_name || !payload?.source_conn_id) {
      toast.error("Source connection can't be empty!");
      return false;
    }

    if (!payload?.source_schema) {
      toast.error("Source schema can't be empty!");
      return false;
    }

    if (!payload?.target_conn_name || !payload?.target_conn_id) {
      toast.error("Target connection can't be empty!");
      return false;
    }

    if (!payload?.target_schema) {
      toast.error("Target schema can't be empty!");
      return false;
    }

    if (!payload?.migration_list || payload?.migration_list?.length === 0) {
      toast.error("Source and target table(s) can't be empty!");
      return false;
    }

    if (!payload?.migration_auto_name) {
      toast.error("Migration name can't be empty!");
      return false;
    };

    const migrationList = payload?.migration_list || [];
    const invalidMigrations = migrationList.some(m => !m?.source_table || !m?.target_table);
    if (invalidMigrations) {
      toast.error("Either source or target table is missing!");
      return false;
    }

    return true;
  }

  const migrationSave = async () => {
    const scope = migrationData?.source?.scope;
    const filters = migrationData?.source?.filters || [];

    let migrationList = [];

    if (scope === "bulk") {
      const targetToSourceMappings =
        migrationData?.target?.targetToSourceMapping || [];

      if (!targetToSourceMappings.length) {
        toast.error("Select atleast one source and one target table.");
        return;
      }

      migrationList = targetToSourceMappings.map(d => {
        const { sourceTable, targetTable } = d;

        const currentTableFilter = filters.find(
          f =>
            f?.sourceTable === sourceTable &&
            f?.targetTable === targetTable &&
            f?.whereCondition?.length > 0
        );

        return {
          source_table: sourceTable,
          target_table: targetTable,
          whereCondition: buildWhereCondition(currentTableFilter),
          source_columns: [],
          schedule: {},
        };
      });

    } else if (scope === "subset") {
      const sourceTable = migrationData?.source?.sourceTable;
      const targetTable = migrationData?.target?.targetTable;

      const currentTableFilter = filters.find(
        f =>
          f?.sourceTable === sourceTable &&
          f?.targetTable === targetTable &&
          f?.whereCondition?.length > 0
      );

      migrationList = [
        {
          source_table: sourceTable,
          target_table: targetTable,
          whereCondition: buildWhereCondition(currentTableFilter),
          schedule: {},
        },
      ];
    }

    const payload = {
      project,
      created_by: decodedToken?.preferred_username,
      migration_name: migrationData?.define?.name,
      migration_auto_name: migrationData?.define?.name,
      description: migrationData?.define?.description || "",
      source_conn_id: migrationData?.source?.connection_id,
      target_conn_id: migrationData?.target?.connection_id,
      source_conn_name: migrationData?.source?.connection,
      target_conn_name: migrationData?.target?.connection,
      source_schema: migrationData?.source?.schema,
      target_schema: migrationData?.target?.schema,
      source_conn_type: migrationData?.source?.connection_type,
      target_conn_type: migrationData?.target?.connection_type,
      migration_list: migrationList,
      op_types: {
        datafederation: false,
      },
      scheduler: (() => {
        const sched = migrationData?.scheduler;
        if (!sched || sched.mode !== 'scheduled') return sched;
        // Refresh startDateTime to current IST time at the moment of save
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);
        const startDateTime = istTime.toISOString().slice(0, 16);
        return {
          ...sched,
          scheduled: {
            ...sched.scheduled,
            startDateTime,
          },
        };
      })(),
      ui_json: migrationData
    };

    if (!isMigrationPayloadValid(payload))
      return;

    // console.log("Payload ==> ", payload);

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    openModal({
      title: "Migration Confirmation",
      message: `Do you want to proceed with ${isEditMode ? "updating" : "creating"} Migration?`,
      type: "question",
      confirmText: "Yes",
      loadingText: "Saving",
      onConfirm: async () => {
        try {
          let request;

          if (isEditMode) {
            const migrationId = location.state?.migration_id;

            if (!migrationId) {
              return toast.error("Migration ID not available. Can't update migration.");
            }

            request = axios.put(
              `${hostnameV2}/update-migration/${migrationId}`,
              payload,
              config
            );
          } else {
            request = axios.post(
              `${hostnameV2}/create-migration`,
              payload,
              config
            );
          }

          await request;

          setTimeout(() => {
            openModal({
              title: "Success!",
              message: `Your Migration has been ${isEditMode ? "updated" : "created"} successfully.`,
              type: "success",
              onClose: handleCloseModal,
            });
            setNodes([]);
          }, 800);
        } catch (e) {
          toast.error(`Error saving migration: ${e.message}`);
        }
      },
    });
  };


  const handleSave = () => {
    if (mode === "migration") {
      migrationSave();
    } else {
      const defineNode = nodes.find((node) => node.id === "define");
      const sourceNode = nodes.find((node) => node.id === "source");
      const targetNode = nodes.find((node) => node.id === "target");

      if (!defineNode || !sourceNode || !targetNode) {
        toast.error("Define, Source, and Target nodes must be present.");
        return;
      }

      const defineToSourceEdge = edges.find((edge) => edge.source === "define" && edge.target === "source");
      const sourceToTargetEdge = edges.find((edge) => edge.source === "source" && edge.target === "target");

      if (!metadataData.define?.name || metadataData.define.name.trim() === "") {
        toast.error("Metadata name is required.");
        return;
      }

      if (!defineToSourceEdge || !sourceToTargetEdge) {
        toast.error("Define must be connected to Source, and Source must be connected to Target.");
        return;
      }

      if (!metadataData.source?.connection || !metadataData.source?.schema) {
        toast.error("Source node must have a connection and schema selected.");
        return;
      }

      if (!metadataData.source?.bulk_list || metadataData.source?.bulk_list.length === 0) {
        toast.error("Source node must have at least one table selected.");
        return;
      }

      if (!metadataData.target?.connection || !metadataData.target?.schema) {
        toast.error("Target node must have a connection and schema selected.");
        return;
      }
      metaDataSave();
    }
  };

  const handleCloseModal = () => {
    if (mode === "metadata") {
      setTimeout(() => {
        navigate(
          `/details?${encodeURIComponent(
            encrypt("componentType=metadata&heading=metadata")
          )}`
        );
      }, 500);
      closeModal();
    } else if (mode === "migration") {
      setTimeout(() => { navigate("/migration"); }, 500);
      closeModal();
    }
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
          nodeTypes={nodeTypes}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onInit={setReactFlowInstance}
          className="bg-gray-50"
          style={{ width: "100%", height: "100%" }}
        >
          <MigrationSidebar presentNodeTypes={presentNodeTypes} onModeChange={handleModeChange} isEditMode={isEditMode} />
          <Controls className="fill-white stroke-black" />
        </ReactFlow>
      </div>
      <div className="fixed bottom-8 right-8 flex space-x-4">
        <button
          className="bg-white rounded-md border-2 border-[#8E77BB] shadow-md px-6 py-2 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          onClick={(e) => navigate("/migration")}
        >
          Cancel
        </button>
        <button
          className="bg-[#8E77BB] rounded-md border-2 border-[#8E77BB] shadow-md px-6 py-2 text-white font-medium hover:bg-[#7d68a5] transition-colors flex items-center"
          onClick={handleSave}
        >
          {mode === "migration" && isEditMode ? "Update" : "Save"}
        </button>
      </div>
      {drawerOpen && <FilterDrawer table={selectedTable} onClose={() => setDrawerOpen(false)} />}
    </div>
  );
}