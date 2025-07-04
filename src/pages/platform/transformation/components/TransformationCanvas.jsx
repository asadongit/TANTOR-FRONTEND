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
import { TransformationDrawer } from "./drawer/transformationDrawer";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { TransformationProvider, useTransformation, useTrackConnections } from "./TransformationContext";
import { X } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import  TargetMappingDrawer  from "./TargetDrawer/TargetMappingDrawer"
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
  const { generateTransformationJson, dispatch, ACTION_TYPES } = useTransformation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTransformationNodeId, setActiveTransformationNodeId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { token, decodedToken, project } = useAuth();
  const [arthDrawerOpen, setArthDrawerOpen] = useState(false);
  const [arthDrawerNodeId, setArthDrawerNodeId] = useState(null);

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
        setEdges((eds) => {
          const newEdges = addEdge(params, eds);
          return newEdges;
        });
      } else {
        toast.error("Invalid connection pattern", {
          duration: 2000,
          position: "top-right",
        });
      }
    },
    [setEdges, isValidConnection, nodes]
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

  const handleSave = useCallback(async () => {
    try {
      const disconnectedNodes = nodes.filter(node => {
        const hasIncomingEdge = edges.some(edge => edge.target === node.id);
        const hasOutgoingEdge = edges.some(edge => edge.source === node.id);

        return !(hasIncomingEdge || hasOutgoingEdge);
      });

      if (disconnectedNodes.length > 0) {
        const nodeTypes = disconnectedNodes.map(node => node.type).join(', ');
        toast.error(`Please connect all nodes: ${nodeTypes} ${disconnectedNodes.length > 1 ? 'nodes are' : 'node is'} disconnected`, {
          duration: 3000,
          position: "top-center",
        });
        return;
      }

      const defineNode = nodes.find(node => node.type === "define");
      if (!defineNode) {
        toast.error("Define node is missing", {
          duration: 3000,
          position: "top-center",
        });
        return;
      }

      if (!defineNode.data.name || defineNode.data.name.trim() === "") {
        toast.error("Please provide a name for your transformation", {
          duration: 3000,
          position: "top-center",
        });
        return;
      }


      setIsSaving(true);
      const nameCheckResponse = await fetch(`${hostname}/etl/check-transformation-name?name=${encodeURIComponent(defineNode.data.name)}`, {
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!nameCheckResponse.ok) {
        throw new Error("Failed to check transformation name");
      }

      const nameCheckResult = await nameCheckResponse.json();
      if (nameCheckResult.exists) {
        toast.error("Transformation name already exists. Please choose another name.", {
          duration: 3000,
          position: "top-center",
        });
        setIsSaving(false);
        return;
      }

      const transformationData = generateTransformationJson();

      if (Object.keys(transformationData.source).length === 0) {
        toast.error("Source data is empty. Make sure your source nodes are properly connected.");
        setIsSaving(false);
        return;
      }

      if (Object.keys(transformationData.target).length === 0) {
        toast.error("Target data is empty. Make sure your target nodes are properly connected.");
        setIsSaving(false);
        return;
      }

      const targetNodes = nodes.filter(n => n.type === 'target');
      for (const targetNode of targetNodes) {
        if (!targetNode.data?.connectedSources) continue;

        const mapping = targetNode.data?.targetMapping || {};
        const hasAnyMapping = Object.values(mapping).some(val => val && val.trim() !== "");
        if (!hasAnyMapping) {
          const confirmed = window.localStorage.getItem(`targetMappingConfirmed_${targetNode.id}`) === "true";
          if (!confirmed) {
            toast.error(`Please confirm target mapping for '${targetNode.data.alias || 'target node'}' before saving.`, {
              duration: 3000,
              position: "top-center",
            });
            setIsSaving(false);
            return;
          }
        }
      }

      const sourceConnectionIds = [];
      const sourceTables = [];
      Object.values(transformationData.source).forEach(source => {
        const sourceNode = nodes.find(n =>
          n.type === 'source' &&
          n.data.connection === source.sourceConnName
        );
        if (sourceNode && sourceNode.data.connectionId) {
          sourceConnectionIds.push(sourceNode.data.connectionId);
        }
        if (source.ConnectionParameters.sourceSchema && source.ConnectionParameters.sourceTable) {
          sourceTables.push(`${source.ConnectionParameters.sourceSchema}.${source.ConnectionParameters.sourceTable}`);
        }
      });

      const targetConnectionIds = [];
      const targetTables = [];
      Object.values(transformationData.target).forEach(target => {
        const targetNode = nodes.find(n =>
          n.type === 'target' &&
          n.data.connection === target.targetConnName
        );
        if (targetNode && targetNode.data.connectionId) {
          targetConnectionIds.push(targetNode.data.connectionId);
        }
        if (target.LoadingParams.targetschema && target.LoadingParams.targetTable) {
          targetTables.push(`${target.LoadingParams.targetschema}.${target.LoadingParams.targetTable}`);
        }
      });

      const payload = {
        transformation_name: defineNode.data.name,
        description: defineNode.data.description || "No description provided",
        source_connection_ids: sourceConnectionIds,
        source_tables: sourceTables,
        target_connection_ids: targetConnectionIds,
        target_tables: targetTables,
        transformation_json: transformationData,
        status: "creating",
        created_by: decodedToken?.preferred_username || "unknown",
        project: project || "default",
        extra_info: {}
      };

      console.log(payload);
      const response = await fetch(`${hostname}/etl/transformation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save transformation");
      }

      // const savedData = await response.json();

      toast.success("Transformation saved successfully!", {
        duration: 3000,
        position: "top-center",
      });

      setTimeout(() => {
        navigate("/transformation");
      }, 1500);

    } catch (error) {
      console.error("Error saving transformation:", error);
      toast.error(`Failed to save transformation: ${error.message}`, {
        duration: 5000,
        position: "top-center",
      });
    } finally {
      setIsSaving(false);
    }
  }, [generateTransformationJson, nodes, edges, navigate, hostname, token, decodedToken, project]);

 const handleNewFlow = useCallback(() => {
  dispatch({ type: ACTION_TYPES.RESET });
  setNodes(initialNodes);
  setEdges(initialEdges);
  nodeIdRef.current = 1;
}, [dispatch, setNodes, setEdges]);

const handleCancel = useCallback(() => {
  handleNewFlow();
  navigate("/transformation");
}, [navigate, handleNewFlow]);


  const openTransformationDrawer = useCallback((nodeId) => {
    setActiveTransformationNodeId(nodeId);
    setDrawerOpen(true);

    window.allNodes = nodes;
    window.allEdges = edges;
  }, [nodes, edges]);

  const closeTransformationDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  useEffect(() => {
    window.deleteNode = onNodeDelete;
    window.openTransformationDrawer = openTransformationDrawer;
    window.allNodes = nodes;
    window.allEdges = edges;

    return () => {
      window.deleteNode = undefined;
      window.openTransformationDrawer = undefined;
      window.allNodes = undefined;
      window.allEdges = undefined;
    };
  }, [onNodeDelete, openTransformationDrawer, nodes, edges]);

  const [arthDrawerProps, setArthDrawerProps] = useState({});

  useEffect(() => {
    window.openTargetMappingDrawer = (nodeId, props = {}) => {
      setArthDrawerNodeId(nodeId);
      // Always use the latest props passed from the target node
      setArthDrawerProps({...props});
      setArthDrawerOpen(true);
    };

    window.closeTargetMappingDrawer = () => {
      setArthDrawerOpen(false);
      setArthDrawerNodeId(null);
      setArthDrawerProps({});
    };

    return () => {
      window.openTargetMappingDrawer = null;
      window.closeTargetMappingDrawer = null;
    };
  }, []);

  const getActiveTransformationNode = useCallback(() => {
    if (!activeTransformationNodeId) return null;
    return nodes.find(node => node.id === activeTransformationNodeId);
  }, [activeTransformationNodeId, nodes]);

  const activeNode = getActiveTransformationNode();

  const updateTransformationNodesData = useCallback(() => {
    setNodes(prevNodes => {
      // Build id->alias map for sources and targets
      const sourceIdToAlias = {};
      const targetIdToAlias = {};
      prevNodes.forEach(node => {
        if (node.type === 'source') {
          sourceIdToAlias[node.id] = node.data.alias || `unnamed_source_${node.id}`;
        }
        if (node.type === 'target') {
          targetIdToAlias[node.id] = node.data.alias || `unnamed_target_${node.id}`;
        }
      });

      return prevNodes.map(node => {
        if (node.type === 'transformation') {
          const incomingEdges = edges.filter(edge => edge.target === node.id);
          const outgoingEdges = edges.filter(edge => edge.source === node.id);

          const sourceNodes = incomingEdges
            .map(edge => prevNodes.find(n => n.id === edge.source))
            .filter(Boolean)
            .map((srcNode) => ({
              ...srcNode,
              dfId: sourceIdToAlias[srcNode.id] || srcNode.id
            }));

          const targetNodes = outgoingEdges
            .map(edge => prevNodes.find(n => n.id === edge.target))
            .filter(Boolean)
            .map((tgtNode) => ({
              ...tgtNode,
              dfId: targetIdToAlias[tgtNode.id] || tgtNode.id
            }));

          const nodeToDataframeMap = {};
          sourceNodes.forEach(node => {
            nodeToDataframeMap[node.id] = node.dfId;
          });
          targetNodes.forEach(node => {
            nodeToDataframeMap[node.id] = node.dfId;
          });

          window.nodeToDataframeMap = nodeToDataframeMap;

          return {
            ...node,
            data: {
              ...node.data,
              sourceNodes,
              targetNodes,
              connectedSources: sourceNodes.length,
              connectedTargets: targetNodes.length,
              isFullyConnected: sourceNodes.length > 0 && targetNodes.length > 0,
              onDataChange: node.data.onDataChange
            }
          };
        }

        if (node.type === 'target') {
          const incomingEdges = edges.filter(edge => edge.target === node.id);
          const connectedSources = incomingEdges
            .map(edge => prevNodes.find(n => n.id === edge.source && n.type === 'transformation'))
            .filter(Boolean).length;

          return {
            ...node,
            data: {
              ...node.data,
              connectedSources,
              onDataChange: node.data.onDataChange
            }
          };
        }

        return node;
      });
    });
  }, [edges, setNodes]);

  useEffect(() => {
    updateTransformationNodesData();
  }, [edges, updateTransformationNodesData]);

  useEffect(() => {
    updateTransformationNodesData();
  }, [nodes.length, updateTransformationNodesData]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onDataChange: (newData) => {
            setNodes((prevNodes) => {
              const updatedNodes = prevNodes.map((n) =>
                n.id === node.id
                  ? { ...n, data: { ...n.data, ...newData } }
                  : n
              );

              return updatedNodes;
            });
          },
        },
      }))
    );
  }, [setNodes]);

  useEffect(() => {
    const defineNode = nodes.find(node => node.type === "define");
    if (!defineNode) return;

    const sourceNodes = nodes.filter(node => node.type === "source");
    const targetNodes = nodes.filter(node => node.type === "target");

    const connectedSource = sourceNodes.find(src =>
      edges.some(edge => edge.source === src.id || edge.target === src.id)
    );
    const connectedTarget = targetNodes.find(tgt =>
      edges.some(edge => edge.source === tgt.id || edge.target === tgt.id)
    );

    if (
      connectedSource &&
      connectedTarget &&
      (!defineNode.data.name || defineNode.data.name.startsWith("etl_"))
    ) {
      const srcName = connectedSource.data.connection || "src";
      const tgtName = connectedTarget.data.connection || "tgt";
      const autoName = `etl_${srcName}_src_${tgtName}`.toLowerCase();

      const generateAndSetUniqueName = async () => {
        if (defineNode.data.generateUniqueName) {
          try {
            const uniqueName = await defineNode.data.generateUniqueName(autoName);
            if (defineNode.data.name !== uniqueName) {
              setNodes(nds =>
                nds.map(n =>
                  n.id === defineNode.id
                    ? { ...n, data: { ...n.data, name: uniqueName } }
                    : n
                )
              );
            }
          } catch (error) {
            console.error("Error generating unique name:", error);
            if (defineNode.data.name !== autoName) {
              setNodes(nds =>
                nds.map(n =>
                  n.id === defineNode.id
                    ? { ...n, data: { ...n.data, name: autoName } }
                    : n
                )
              );
            }
          }
        } else {
          if (defineNode.data.name !== autoName) {
            setNodes(nds =>
              nds.map(n =>
                n.id === defineNode.id
                  ? { ...n, data: { ...n.data, name: autoName } }
                  : n
              )
            );
          }
        }
      };

      generateAndSetUniqueName();
    }
  }, [nodes, edges, setNodes]);

  const handleAddNewTargetColumn = useCallback((columnName) => {
    setNodes(prevNodes => {
      if (!activeTransformationNodeId) return prevNodes;
      const outgoingEdges = edges.filter(edge => edge.source === activeTransformationNodeId);
      const targetNodeIds = outgoingEdges
        .map(edge => {
          const tgtNode = prevNodes.find(n => n.id === edge.target && n.type === 'target');
          return tgtNode ? tgtNode.id : null;
        })
        .filter(Boolean);

      return prevNodes.map(node => {
        if (targetNodeIds.includes(node.id)) {
          let columns = Array.isArray(node.data.columns) ? [...node.data.columns] : [];
          if (!columns.includes(columnName)) {
            columns.push(columnName);
          }
          let columnMapping = { ...(node.data.columnMapping || {}) };
          if (!(columnName in columnMapping)) {
            columnMapping[columnName] = "";
          }
          return {
            ...node,
            data: {
              ...node.data,
              columns,
              columnMapping,
            }
          };
        }
        return node;
      });
    });
  }, [edges, activeTransformationNodeId, setNodes]);

  const handleTransformationApply = useCallback((transformationNodeId, transformations) => {
    setNodes(prevNodes => {
      const outgoingEdges = edges.filter(edge => edge.source === transformationNodeId);
      const targetNodeIds = outgoingEdges
        .map(edge => {
          const tgtNode = prevNodes.find(n => n.id === edge.target && n.type === 'target');
          return tgtNode ? tgtNode.id : null;
        })
        .filter(Boolean);

      const processedTransformations = transformations.map(t => {
        if (t.transformation_operation === 'filter' && !t.transformation_operator) {
          return { ...t, transformation_operator: "==" };
        }
        return t;
      });

      return prevNodes.map(node => {
        if (node.id === transformationNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              transformations: processedTransformations,
              transformationConfig: {
                ...node.data.transformationConfig,
                operations: processedTransformations
              }
            }
          };
        }
        if (targetNodeIds.includes(node.id)) {
          return {
            ...node,
            data: {
              ...node.data,
              transformations: processedTransformations,
            }
          };
        }
        return node;
      });
    });
  }, [edges, setNodes]);



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
        {/* <button
          onClick={handleNewFlow}
          className="bg-white rounded-md border-2 border-[#8E77BB] shadow-md px-6 py-2 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          New Flow
        </button> */}
        <button
          onClick={handleCancel}
          className="bg-white rounded-md border-2 border-[#8E77BB] shadow-md px-6 py-2 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="bg-[#8E77BB] rounded-md border-2 border-[#8E77BB] shadow-md px-6 py-2 text-white font-medium hover:bg-[#7d68a5] transition-colors flex items-center"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : "Save"}
        </button>
      </div>

      <TransformationDrawer
        isOpen={drawerOpen}
        onClose={closeTransformationDrawer}
        activeNode={activeNode}
        activeNodeId={activeTransformationNodeId}
        onAddNewTargetColumn={handleAddNewTargetColumn}
        onApplyTransformations={handleTransformationApply}
      />
      {arthDrawerOpen && (
        <TargetMappingDrawer
          nodeId={arthDrawerNodeId}
          onClose={() => setArthDrawerOpen(false)}
          {...arthDrawerProps}
        />
      )}
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
