import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { toast } from "react-hot-toast";
import { useNavigate } from 'react-router-dom';
import { DefineNode } from "./nodes/DefineNode";
import { SourceNode } from "./nodes/SourceNode";
import { TargetNode } from "./nodes/TargetNode";
import { SchedulerNode } from "./nodes/SchedulerNode";
import { DrawerContainer } from "../react-flow/drawers/DrawerContainer";
import axios from "axios";
import TableDrawer from "../react-flow/dialog/TableDrawer";
import Success from "../react-flow/dialog/Success";
import { ArchivalSidebar } from "./ArchivalSidebar";
import { createPipeline } from "../cdc/components/CreatePipeline";
import { DefineNode as MetadataDefineNode } from "../metadata/nodes/DefineNode";
import { SourceNode as MetadataSourceNode } from "../metadata/nodes/SourceNode";
import { TargetNode as MetadataTargetNode } from "../metadata/nodes/TargetNode";

const nodeTypes = {
  define: DefineNode,
  source: SourceNode,
  target: TargetNode,
  schedule: SchedulerNode,
  metadataDefine: MetadataDefineNode,
  metadataSource: MetadataSourceNode,
  metadataTarget: MetadataTargetNode,

};

let id = 0;
const getId = () => `node_${id++}`;

const ArchivalCanvas = () => {
  const hostnameV1 = window._env_?.VITE_FAST_API;
  const hostnameV2 = window._env_?.VITE_FAST_API_V2;
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [payload, setPayload] = useState({});

  const navigate = useNavigate();


  const API_ENDPOINTS = {
    bulk: `${hostnameV1}/metadata-archivals`,
    subset: `${hostnameV2}/migrations`
  };


  // Add connection type mapping utility
const getConnectionType = (connectionName, connections) => {
  const conn = connections.find(c => c.connection_name === connectionName);
  return conn?.connection_type?.toLowerCase() || 'unknown';
};

// Enhanced validation
const migrationValidators = {
  common: (source, target) => {
    const errors = [];
    if (!source?.connection || !target?.connection) {
      errors.push("Both source and target connections are required");
    }
    if (source?.migrationScope !== target?.migrationScope) {
      errors.push("Source and target must have matching migration scopes");
    }
    return errors;
  },
  
  // bulk: (source, target) => {
  //   const errors = [];
  //   const missingFilters = source.selectedTables.some(table => 
  //     !table.filters?.length
  //   );
  //   if (missingFilters) {
  //     errors.push("All tables in bulk migration require filters");
  //   }
  //   return errors;
  // },
  
  // subset: (source, target) => {
  //   const errors = [];
  //   if (!source.filters?.length) {
  //     errors.push("Subset migration requires where conditions");
  //   }
  //   return errors;
  // }
};




// Enhanced payload builders with dynamic connection types
const payloadBuilders = {
  bulk: (data, connections) => {
    // const sourceType = getConnectionType(data.source.connection, connections);
    // const targetType = getConnectionType(data.target.connection, connections);
    
  
    
    return {
      project: "default",
      created_by: "to_be_fetched_from_token",
      migration_name: data.definition.name,
      migration_description: data.definition.description,
      migrations: data.source.selectedTables.map(table => ({
        metadata_id: table.metadataId,
        schedule: data.schedule.startLoadDate,
        wherecondition: data.source.filters?.map(filter => ({
          wherecolumn: filter.columnName,
          whereoperator: filter.filterOperator,
          wherevalues: filter.value
        })) || []
      })),
      source_conn_name: data.source.connection,
      target_conn_name: data.target.connection,
      source_conn_type: sourceType,
      target_conn_type: targetType,
      scheduler: {
        startdatetime: data.schedule.startLoadDate,
        endLoadDate: data.schedule.endLoadDate
      }
    };
  },

  subset: (data, connections) => {
    const sourceType = getConnectionType(data.source.connection, connections);
    const targetType = getConnectionType(data.target.connection, connections);

    return {
      workflow_name: data.definition.name,
      migration_auto_name: data.definition.name,
      description: data.definition.description,
      source_conn_id: data.source.connectionId,
      target_conn_id: data.target.connectionId,
      source_migr_info: {
        sourceType,
        sourceConnName: data.source.connection,
        sourceObjectName: data.source.selectedTables[0],
        sourceSchemaName: data.source.schema,
        wherecondition: data.source.filters?.map(filter => ({
          wherecolumn: filter.columnName,
          whereoperator: filter.filterOperator,
          wherevalues: filter.value
        })) || []
      },
      target_migr_info: {
        targetType,
        targetConnName: data.target.connection,
        targetObjectName: data.target.selectedTables[0]
      },
      scheduler: {
        startLoadDate: data.schedule.startLoadDate,
        endLoadDate: data.schedule.endLoadDate
      }
    };
  }
};




  const validatePayload = (nodes, edges, payload) => {
    // Node presence and connection validation
    const requiredNodes = ['define', 'source', 'target', 'schedule'];
    if (!requiredNodes.every(type => nodes.some(n => n.type === type))) {
      toast.error('Missing required nodes!');
      return false;
    }

    // Get node data
    const sourceData = payload[nodes.find(n => n.type === 'source').id];
    const targetData = payload[nodes.find(n => n.type === 'target').id];

    // Validate scope match
    const scopeErrors = migrationValidators.common(sourceData, targetData);
    if (scopeErrors.length > 0) {
      scopeErrors.forEach(e => toast.error(e));
      return false;
    }

    // // Validate scope-specific rules
    // const scope = sourceData?.migrationScope;
    // const scopeValidationErrors = migrationValidators[scope](sourceData, targetData);
    // if (scopeValidationErrors.length > 0) {
    //   scopeValidationErrors.forEach(e => toast.error(e));
    //   return false;
    // }

    return true;
  };

// Enhanced handleSubmit with connection data
const handleSubmit = useCallback(async () => {
  try {
    if (!validatePayload(nodes, edges, payload)) return;

    // Fetch connections data
    // const connectionsResponse = await axios.get(`${hostnameV1}/connections`);
    // const connections = connectionsResponse.data;

    const collectedData = {
      definition: payload[nodes.find(n => n.type === 'define').id],
      source: payload[nodes.find(n => n.type === 'source').id],
      target: payload[nodes.find(n => n.type === 'target').id],
      schedule: payload[nodes.find(n => n.type === 'schedule').id]
    };

    const migrationScope = collectedData.source.migrationScope;
    const apiPayload = payloadBuilders[migrationScope](collectedData, connections);
    
    // Get correct API endpoint
    const endpoint = migrationScope === 'bulk' 
      ? `${hostnameV1}/metadata-archivals`
      : `${hostnameV2}/migrations`;

    const response = await axios.post(endpoint, apiPayload, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("Submission successful:", response.data);
    toast.success(`Migration (${migrationScope}) submitted successfully!`);
    
  } catch (error) {
    console.error("Submission error:", error);
    toast.error(`Submission failed: ${error.response?.data?.message || error.message}`);
  }
}, [payload, nodes, edges]);


  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeDataChange = useCallback((nodeId, data) => {
    setPayload((prev) => {
      if (JSON.stringify(prev[nodeId]) !== JSON.stringify(data)) {
        return { ...prev, [nodeId]: data };
      }
      return prev;
    });
  }, []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = {
        x: event.clientX - 500,
        y: event.clientY - 80,
      };
      if (type === 'pipeline') {
        let { nodes: pipelineNodes, edges: pipelineEdges } = createPipeline(
          'metadata',
          `pipeline_${getId()}`, 
        );

        pipelineNodes = pipelineNodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            tables: [],
            onDataChange: onNodeDataChange,
            onSubmit: handleSubmit,
            payload: payload,
          },
        }));
        setNodes((prevNodes) => [...prevNodes, ...pipelineNodes]);
        setEdges((prevEdges) => [...prevEdges, ...pipelineEdges]);
        return;
      }
      const newNode = {
        id: getId(),
        type,
        position,
        data: {
          label: type,
          tables: [],
          onDataChange: onNodeDataChange, // Pass dynamic props here
          onSubmit: handleSubmit, // Pass dynamic props here
          payload: payload,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, onNodeDataChange, handleSubmit, payload]
  );

  const onNodeDelete = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
    },
    [setNodes, setEdges]
  );

  useEffect(() => {
    window.deleteNode = onNodeDelete;
    return () => {
      window.deleteNode = undefined;
    };
  }, [onNodeDelete]);



  const handleCancel = useCallback(() => {
    navigate('/migration'); 
  }, [payload]);

  const handleMetadata = useCallback(() => {
    navigate('/Metadatacanvas'); 
  }, [payload]);


  return (
    <div className="h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Controls className="fill-white stroke-black" />
        <Panel position="top-left">
          <ArchivalSidebar />
        </Panel>
        {/* Add bottom button panel */}
        <Panel position="bottom-center">
          <div className="flex gap-4 p-4 bg-white/90 shadow-lg rounded-lg m-4">
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMetadata}
              className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
            >
              Create Metadata
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Save Migration
            </button>
          </div>
        </Panel>
      </ReactFlow>
      <DrawerContainer />
      <TableDrawer nodes={nodes} setNodes={setNodes} />
      <Success nodes={nodes} setNodes={setNodes} />
    </div>
  );
};
export default ArchivalCanvas;
