import React, { useCallback, useState, useRef, useEffect } from "react";
import ReactFlow, { Background, Controls, useReactFlow } from "reactflow";
import { useLocation } from "react-router-dom";
import { useWorkflow } from "./context/WorkflowContext";
import "reactflow/dist/style.css";
import { DefineNode } from "./nodes/DefineNode";
import { SourceNode } from "./nodes/SourceNode";
import { TargetNode } from "./nodes/TargetNode";
import { SchedulerNode } from "./nodes/SchedulerNode";
import { DefineNode as MetadataDefineNode } from "./nodes/metadataNodes/DefineNode";
import { SourceNode as MetadataSourceNode } from "./nodes/metadataNodes/SourceNode";
import { TargetNode as MetadataTargetNode } from "./nodes/metadataNodes/TargetNode";
import { DefineNode as MigrationDefineNode } from "./nodes/migrationNodes/DefineNode";
import { SourceNode as MigrationSourceNode } from "./nodes/migrationNodes/SourceNode";
import { TargetNode as MigrationTargetNode } from "./nodes/migrationNodes/TargetNode";
import { SchedulerNode as MigrationSchedulerNode } from "./nodes/migrationNodes/SchedulerNode";
import { DefineNode as PurgeDefineNode } from "./nodes/purgeNodes/DefineNode";
import { SourceNode as PurgeSourceNode } from "./nodes/purgeNodes/SourceNode";
import { TargetNode as PurgeTargetNode } from "./nodes/purgeNodes/TargetNode";
import { SchedulerNode as PurgeSchedulerNode } from "./nodes/purgeNodes/SchedulerNode";
const nodeTypes = {
  define: DefineNode,
  source: SourceNode,
  target: TargetNode,
  schedule: SchedulerNode,
  metadataDefine: MetadataDefineNode,
  metadataSource: MetadataSourceNode,
  metadataTarget: MetadataTargetNode,
  migrationDefine: MigrationDefineNode,
  migrationSource: MigrationSourceNode,
  migrationTarget: MigrationTargetNode,
  migrationSchedule: MigrationSchedulerNode,
  purgeDefine: PurgeDefineNode,
  purgeSource: PurgeSourceNode,
  purgeTarget: PurgeTargetNode,
  purgeSchedule: PurgeSchedulerNode,
};

const Canvas = () => {
  const [isSelectable, setIsSelectable] = useState(true);
  const location = useLocation();
  const nodeJson = location.state?.nodeJson;
  
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
    editMode,
    setEditMode,
  } = useWorkflow();

  // Initialize canvas with nodeJson data when in edit mode
  useEffect(() => {
    if (nodeJson) {
      setEditMode(true);
      try {
        const parsed = typeof nodeJson === "string" ? JSON.parse(nodeJson) : nodeJson;
        
        // If nodeJson contains both nodes and edges
        if (parsed.nodes && parsed.edges) {
          
          // If there's pipelineData, use it to enhance the node data
          if (parsed.pipelineData) {
            const enhancedNodes = parsed.nodes.map(node => ({
              ...node,
              data: {
                ...node.data,
                // Merge the pipeline data into each node for better pre-population
                define: parsed.pipelineData.define || node.data?.define,
                source: parsed.pipelineData.source || node.data?.source,
                target: parsed.pipelineData.target || node.data?.target,
                scheduler: parsed.pipelineData.scheduler || node.data?.scheduler,
              }
            }));
            setNodes(enhancedNodes);
          } else {
            setNodes(parsed.nodes);
          }
          
          setEdges(parsed.edges);
        } else if (parsed.nodes) {
          setNodes(parsed.nodes);
        } else {
          setNodes(parsed);
        }
        
        // Fit view after nodes are loaded
        setTimeout(() => {
          fitView({ padding: 0.2, duration: 800 });
        }, 100);
      } catch (error) {
        console.error("Error parsing nodeJson:", error);
      }
    }
  }, [nodeJson, setNodes, setEdges, fitView, setEditMode]);

  const onDrop = useCallback(
    (event) => {
      if (editMode) return; // Disable dropping in edit mode
      
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
    [addPipeline, fitView, reactFlowInstance, reactFlowWrapper, setNodes, editMode]
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
        return prevNodes;
      }

      const sourceType = sourceNode.type;
      const targetType = targetNode.type;
      const sourceData = sourceNode.data[sourceType]|| sourceNode;
      const targetData =  targetNode.data[targetType]|| targetNode;


      if (!sourceData || !targetData) {
        return prevNodes;
      }

      const updatedNodes = prevNodes.map((node) => {
        if (node.id === connection.target) {
          return {
            ...node,
            data: {
              ...node.data,
              [sourceType]: [...(node.data[sourceType] || []), sourceData],
            },
          };
        }

        if (node.id === connection.source) {
          return {
            ...node,
            data: {
              ...node.data,
              [targetType]: [...(node.data[targetType] || []), targetData],
            },
          };
        }

        return node;
      });

      return updatedNodes;
    });
  },
  [setNodes, setEdges]
);

  
  
  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      {editMode && (
        <div className="absolute top-4 left-4 z-10 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded-md shadow-md">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Edit Mode - Migration Data Loaded</span>
          </div>
        </div>
      )}
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
        // nodeDragThreshold={10}

        className="bg-gray-50"
      >
        <Controls className="fill-white stroke-black" />
      </ReactFlow>
    </div>
  );
};

export default Canvas;
