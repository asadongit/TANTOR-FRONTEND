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
import Success from "../react-flow/dialog/success";
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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [payload, setPayload] = useState({});

  const navigate = useNavigate();


  // Add this validation function in ArchivalCanvas.jsx
const validatePayload = (nodes, edges, payload) => {
  // Check node presence
  const nodeTypesPresent = nodes.map(n => n.type);
  const requiredTypes = ['define', 'source', 'target', 'schedule'];
  if (!requiredTypes.every(type => nodeTypesPresent.includes(type))) {
    toast.error('Missing required nodes!');
    return false;
  }

  // Validate connections
  const expectedConnections = [
    ['define', 'source'],
    ['source', 'target'],
    ['target', 'schedule']
  ];

  const actualConnections = edges.map(edge => {
    const sourceType = nodes.find(n => n.id === edge.source)?.type;
    const targetType = nodes.find(n => n.id === edge.target)?.type;
    return [sourceType, targetType];
  });

  if (!expectedConnections.every(conn => 
    actualConnections.some(([src, tgt]) => src === conn[0] && tgt === conn[1])
  )) {
    toast.error('Nodes must be connected in sequence: Define → Source → Target → Scheduler');
    return false;
  }

  // Validate individual node data
  return nodes.every(node => {
    const nodeData = payload[node.id];
    switch (node.type) {
      case 'define':
        if (!nodeData?.name || !nodeData?.description) {
          toast.error('Define node requires both name and description');
          return false;
        }
        break;
      case 'source':
      case 'target':
        if (!nodeData?.connection || !nodeData?.schema || nodeData?.selectedTables?.length === 0) {
          toast.error(`${node.type} node requires connection, schema, and tables selection`);
          return false;
        }
        break;
      case 'schedule':
        if (nodeData?.scheduleType === 'manual' && (!nodeData?.startLoadDate || !nodeData?.endLoadDate)) {
          toast.error('Manual schedule requires both start and end dates');
          return false;
        }
        break;
    }
    return true;
  });
};





// Update handleSubmit in ArchivalCanvas.jsx
const handleSubmit = useCallback(async () => {
  try {
    // Validate before submission
    if (!validatePayload(nodes, edges, payload)) {
      return;
    }

    // Transform payload to API format
    const apiPayload = {
      definition: payload[nodes.find(n => n.type === 'define').id],
      source: payload[nodes.find(n => n.type === 'source').id],
      target: payload[nodes.find(n => n.type === 'target').id],
      schedule: payload[nodes.find(n => n.type === 'schedule').id]
    };

    console.log("Submitting payload:", apiPayload);
    const response = await axios.post("/api/submit-flow", apiPayload);
    console.log("API Response:", response.data);
    toast.success('Flow submitted successfully!');
  } catch (error) {
    console.error("Error submitting flow:", error);
    toast.error('Submission failed: ' + error.message);
  }
}, [payload, nodes, edges]);


  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeDataChange = useCallback((nodeId, data) => {
    console.log(`onNodeDataChange called for nodeId: ${nodeId}, data:`, data);
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
