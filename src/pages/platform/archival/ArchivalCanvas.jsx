import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { DefineNode } from "./nodes/DefineNode";
import { SourceNode } from "./nodes/SourceNode";
import { TargetNode } from "./nodes/TargetNode";
import { SchedulerNode } from "./nodes/SchedulerNode";
import { DrawerContainer } from "../react-flow/drawers/DrawerContainer";
import axios from "axios";
import TableDrawer from "../react-flow/dialog/TableDrawer";
import Success from "../react-flow/dialog/success";
import { ArchivalSidebar } from "./ArchivalSidebar";

const nodeTypes = {
  define: DefineNode,
  source: SourceNode,
  target: TargetNode,
  schedule: SchedulerNode,
};

let id = 0;
const getId = () => `node_${id++}`;

const TransformationCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [payload, setPayload] = useState({});


  const handleSubmit = useCallback(async () => {
    try {
      console.log("Submitting payload:", payload);
      const response = await axios.post("/api/submit-flow", payload);
      console.log("API Response:", response.data);
    } catch (error) {
      console.error("Error submitting flow:", error);
    }
  }, [payload]);


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
      </ReactFlow>
      <DrawerContainer />
      <TableDrawer nodes={nodes} setNodes={setNodes} />
      <Success nodes={nodes} setNodes={setNodes} />
    </div>
  );
};
export default TransformationCanvas;
