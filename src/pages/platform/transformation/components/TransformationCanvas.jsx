import React, { useCallback, useEffect, useState, useRef } from "react";
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Panel,
  isNode,
} from "reactflow";
import "reactflow/dist/style.css";
import { DefineNode } from "./nodes/DefineNode";
import { SourceNode } from "./nodes/SourceNode";
import { TransformationNode } from "./nodes/TransformationNode";
import { TargetNode } from "./nodes/TargetNode";
import { TransformationSidebar } from "./TransformationSidebar";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { TransformationProvider, useTransformation, useTrackConnections } from "./TransformationContext";

const nodeTypes = {
  define: DefineNode,
  source: SourceNode,
  transformation: TransformationNode,
  target: TargetNode,
};

const hostname = import.meta.env.VITE_FAST_API;

let id = 0;
const getId = () => `node_${id++}`;

const initialNodes = [
  {
    id: "node_0",
    type: "define",
    position: { x: 100, y: 200 },
    data: {
      name: "",
      description: "",
      onDataChange: () => {},
    },
    deletable: false,
  },
];

const initialEdges = [];

function TransformationCanvasContent() {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const nodeIdRef = useRef(1);
  const { generateTransformationJson } = useTransformation();

  useTrackConnections(nodes, edges);

  useEffect(() => {
    id = nodeIdRef.current;
  }, []);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onDataChange: (newData) => {
            setNodes((prevNodes) =>
              prevNodes.map((n) =>
                n.id === node.id
                  ? { ...n, data: { ...n.data, ...newData } }
                  : n
              )
            );
          },
        },
      }))
    );
  }, [setNodes]);

  useEffect(() => {
    const hasDefineNode = nodes.some((node) => node.type === "define");

    if (!hasDefineNode) {
      const defineNode = {
        id: "node_0",
        type: "define",
        position: { x: 100, y: 200 },
        data: {
          name: "",
          description: "",
          onDataChange: (newData) => {
            setNodes((prevNodes) =>
              prevNodes.map((n) =>
                n.id === "node_0"
                  ? { ...n, data: { ...n.data, ...newData } }
                  : n
              )
            );
          },
        },
        deletable: false,
      };

      setNodes((currentNodes) => [defineNode, ...currentNodes]);
    }
  }, [nodes, setNodes]);

  const customOnNodesChange = useCallback(
    (changes) => {
      const safeChanges = changes.filter((change) => {
        if (change.type === "remove") {
          const nodeToRemove = nodes.find((n) => n.id === change.id);
          return nodeToRemove?.type !== "define";
        }
        return true;
      });

      onNodesChange(safeChanges);
    },
    [nodes, onNodesChange]
  );

  const isValidConnection = useCallback(
    (connection) => {
      const { source, target } = connection;

      const sourceNode = nodes.find((n) => n.id === source);
      const targetNode = nodes.find((n) => n.id === target);

      if (!sourceNode || !targetNode) return false;

      if (sourceNode.type === "define" && targetNode.type !== "source") {
        return false;
      }

      if (sourceNode.type === "source" && targetNode.type !== "transformation") {
        return false;
      }

      if (
        sourceNode.type === "transformation" &&
        targetNode.type !== "transformation" &&
        targetNode.type !== "target"
      ) {
        return false;
      }

      if (sourceNode.type === "target") {
        return false;
      }

      return true;
    },
    [nodes]
  );

  const onConnect = useCallback(
    (params) => {
      if (isValidConnection(params)) {
        setEdges((eds) => addEdge(params, eds));
      } else {
        toast.error("Invalid connection pattern", {
          duration: 2000,
          position: "top-right",
        });
      }
    },
    [setEdges, isValidConnection]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      if (type === "define") {
        toast.error("Only one Define node is allowed", {
          duration: 2000,
          position: "top-right",
        });
        return;
      }

      const position = {
        x: event.clientX - 500,
        y: event.clientY - 80,
      };

      const baseData = {
        onDataChange: (newData) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === newNodeId
                ? { ...node, data: { ...node.data, ...newData } }
                : node
            )
          );
        },
      };

      const typeSpecificData = {
        source: { connection: "", schema: "", tables: [] },
        target: { connection: "", schema: "" },
        transformation: { type: "", function: "" },
      };

      const newNodeId = `node_${id++}`;
      nodeIdRef.current = id;

      const newNode = {
        id: newNodeId,
        type,
        position,
        data: {
          ...baseData,
          ...typeSpecificData[type],
          label: type,
        },
      };

      setNodes((currentNodes) => [...currentNodes, newNode]);
    },
    [setNodes]
  );

  const onNodeDelete = useCallback(
    (nodeId) => {
      const nodeToDelete = nodes.find((n) => n.id === nodeId);
      if (nodeToDelete && nodeToDelete.type === "define") {
        toast.error("Cannot delete the Define node", {
          duration: 2000,
          position: "top-right",
        });
        return;
      }

      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
    },
    [nodes, setNodes, setEdges]
  );

  const handleSave = useCallback(() => {
    try {
      const transformationData = generateTransformationJson();
      console.log("Transformation JSON:", transformationData);

      toast.success(
        <div>
          <p>Transformation data generated:</p>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(transformationData, null, 2)}
          </pre>
        </div>,
        {
          duration: 5000,
          position: "top-center",
          style: { maxWidth: 'none', width: 'auto' },
        }
      );


    } catch (error) {
      console.error("Error generating transformation data:", error);
      toast.error("Failed to generate transformation data");
    }
  }, [generateTransformationJson]);

  const handleCancel = useCallback(() => {
    navigate("/transformation");
  }, [navigate]);

  useEffect(() => {
    window.deleteNode = onNodeDelete;
    return () => {
      window.deleteNode = undefined;
    };
  }, [onNodeDelete]);

  return (
    <div style={{ width: "100%", height: "100vh" }} className="relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={customOnNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodesDraggable={true}
        elementsSelectable={true}
        deleteKeyCode={['Backspace', 'Delete']}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
        style={{ width: "100%", height: "100%" }}
      >
        <Controls className="fill-white stroke-black" />
        <Panel position="top-left">
          <div className="mb-4">
            <TransformationSidebar />
          </div>
        </Panel>
      </ReactFlow>

      <div className="fixed bottom-8 right-8 flex space-x-4">
        <button
          onClick={handleCancel}
          className="bg-white rounded-md border-2 border-[#8E77BB] shadow-md px-6 py-2 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="bg-[#8E77BB] rounded-md border-2 border-[#8E77BB] shadow-md px-6 py-2 text-white font-medium hover:bg-[#7d68a5] transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

const TransformationCanvas = () => {
  return (
    <TransformationProvider>
      <TransformationCanvasContent />
    </TransformationProvider>
  );
};

export default TransformationCanvas;
