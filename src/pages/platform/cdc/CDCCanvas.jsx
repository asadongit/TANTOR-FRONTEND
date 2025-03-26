import React, { useCallback, useState, useRef, useEffect } from "react";
import ReactFlow, { Background, Controls, useReactFlow } from "reactflow";
import { useWorkflow } from "./context/WorkflowContext";
import "reactflow/dist/style.css";
import { DefineNode } from "./nodes/DefineNode";
import { SourceNode } from "./nodes/SourceNode";
import { TargetNode } from "./nodes/TargetNode";
import { SchedulerNode } from "./nodes/SchedulerNode";

const nodeTypes = {
  define: DefineNode,
  source: SourceNode,
  target: TargetNode,
  schedule: SchedulerNode,
};

const Canvas = () => {
  const [isSelectable, setIsSelectable] = useState(true);
  const {
    nodes,
    setNodes,
    edges,
    setEdges,
    addEdge,
    addPipeline,
    onNodesChange,
    onEdgesChange,
    reactFlowWrapper,
    addNode,
    reactFlowInstance,
    fitView,
  } = useWorkflow();

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const nodeData = event.dataTransfer.getData("application/reactflow");
      if (!nodeData) return;

      try {
        const data = JSON.parse(nodeData);
        const { category, type, isPipeline } = data;
        isPipeline
          ? addPipeline(category)
          : addNode(type.toLowerCase(), category);

        setTimeout(() => {
          fitView({ padding: 0.2, duration: 800 });
        }, 100);
      } catch (error) {
        console.error("Error parsing dropped node data:", error);
      }
    },
    [addPipeline, fitView, reactFlowInstance, reactFlowWrapper, setNodes]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

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

  const onConnect = useCallback(
    (connection) => {
      setEdges((prevEdges) => addEdge(connection, prevEdges));
  
      setNodes((prevNodes) => {
        const sourceNode = prevNodes.find((n) => n.id === connection.source);
        const targetNode = prevNodes.find((n) => n.id === connection.target);
  
        if (!sourceNode || !targetNode) {
          console.log(
            `Node not found: ${!sourceNode ? `Source (ID: ${connection.source})` : ''} ${!targetNode ? `Target (ID: ${connection.target})` : ''}`
          );
          return prevNodes;
        }
  
        return prevNodes.map((node) => {
          if (node.id === connection.target) {
            const updatedSourceData = Array.isArray(node.data?.[sourceNode.type])
              ? node.data[sourceNode.type].filter((s) => s.id !== sourceNode.id)
              : [];
  
            return {
              ...node,
              data: {
                ...node.data,
                [sourceNode.type]: 
                // [
                  // ...updatedSourceData,
                  {
                    id: sourceNode.id,
                    ...sourceNode.data[sourceNode.type],
                  },
                // ],
              },
            };
          }
  
          if (node.id === connection.source) {
            const updatedTargetData = Array.isArray(node.data?.[targetNode.type])
              ? node.data[targetNode.type].filter((t) => t.id !== targetNode.id)
              : [];
  
            return {
              ...node,
              data: {
                ...node.data,
                [targetNode.type]: [
                  ...updatedTargetData,
                  {
                    id: targetNode.id,
                    ...targetNode.data[targetNode.type],
                  },
                ],
              },
            };
          }
  
          return node;
        });
      });
    },
    [setNodes, setEdges]
  );
  

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        // onEdgeDoubleClick={handleEdgeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        selectionOnDrag
        // isValidConnection={isValidConnection}
        elementsSelectable={isSelectable}
        className="bg-gray-50"
      >
        <Controls className="fill-white stroke-black" />
      </ReactFlow>
    </div>
  );
};

export default Canvas;
