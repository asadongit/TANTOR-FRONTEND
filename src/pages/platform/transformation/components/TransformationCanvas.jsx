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
import {
  TransformationProvider,
  useTransformation,
  useTrackConnections,
} from "./TransformationContext";
import { X } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import TargetMappingDrawer from "./TargetDrawer/TargetMappingDrawer";
import {
  prepareEditFlowData,
  validateEditFlowData,
  restoreNodesAndEdgesFromEditData,
} from "../utils/editFlowUtils";
import UnStructureDataPrep from "./nodes/components/UnstructuredDataPrepModal"; // <-- add

const nodeTypes = {
  define: DefineNode,
  source: SourceNode,
  transformation: TransformationNode,
  target: TargetNode,
};

const hostname = window._env_?.VITE_FAST_API;

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
  {
    id: "node_1",
    type: "source",
    position: { x: 400, y: 200 },
    data: {
      connection: "",
      schema: "",
      tables: [],
      onDataChange: () => {},
    },
  },
  {
    id: "node_2",
    type: "transformation",
    position: { x: 800, y: 200 },
    data: {
      type: "",
      function: "",
      onDataChange: () => {},
    },
  },
  {
    id: "node_3",
    type: "target",
    position: { x: 1200, y: 200 },
    data: {
      connection: "",
      schema: "",
      onDataChange: () => {},
    },
  },
];

const initialEdges = [
  {
    id: "edge_0",
    source: "node_0",
    target: "node_1",
  },
  {
    id: "edge_1",
    source: "node_1",
    target: "node_2",
  },
  {
    id: "edge_2",
    source: "node_2",
    target: "node_3",
  },
];

function TransformationCanvasContent() {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const nodeIdRef = useRef(4);
  const { generateTransformationJson, dispatch, ACTION_TYPES } =
    useTransformation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTransformationNodeId, setActiveTransformationNodeId] =
    useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { token, decodedToken, project } = useAuth();
  const [arthDrawerOpen, setArthDrawerOpen] = useState(false);
  const [arthDrawerNodeId, setArthDrawerNodeId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTransformationId, setEditTransformationId] = useState(null);
  const [isRestorationComplete, setIsRestorationComplete] = useState(false);

  const [nlpModalOpen, setNlpModalOpen] = useState(false);
  const [nlpTxtFile, setNlpTxtFile] = useState(null);

  useEffect(() => {
    window.openUnstructuredDataPrepModal = ({ file } = {}) => {
      setNlpTxtFile(file || null);
      setNlpModalOpen(true);
    };

    window.closeUnstructuredDataPrepModal = () => {
      setNlpModalOpen(false);
      setNlpTxtFile(null);
    };

    return () => {
      window.openUnstructuredDataPrepModal = undefined;
      window.closeUnstructuredDataPrepModal = undefined;
    };
  }, []);

  useTrackConnections(nodes, edges);

  // Check for edit mode and restore data on component mount - IMPROVED
  useEffect(() => {
    const editMode = sessionStorage.getItem("editMode");
    const editFlowDataStr = sessionStorage.getItem("editFlowData");
    const transformationId = sessionStorage.getItem("editTransformationId");

    if (editMode === "true" && editFlowDataStr && transformationId) {
      try {
        const editFlowData = JSON.parse(editFlowDataStr);

        setIsEditMode(true);
        setEditTransformationId(transformationId);

        const restoredData = restoreNodesAndEdgesFromEditData(
          editFlowData,
          setNodes,
          setEdges,
          nodeIdRef
        );

        // Restore nodes and edges
        setNodes(restoredData.nodes);
        setEdges(restoredData.edges);

        //  Immediately re-attach onDataChange for all restored nodes
        setNodes((prevNodes) =>
          prevNodes.map((n) => {
            if (n.type === "define") {
              return {
                ...n,
                data: {
                  ...n.data,
                  // Adding the name and desc here
                  name:
                    editFlowData?.properties?.transformation_name ||
                    n.data.name ||
                    "",
                  description:
                    editFlowData?.properties?.description ||
                    n.data.description ||
                    "",

                  isEditMode: true,
                  onDataChange: (newData) => {
                    // Update this node’s data live as user types
                    setNodes((prev) =>
                      prev.map((node) =>
                        node.id === n.id
                          ? { ...node, data: { ...node.data, ...newData } }
                          : node
                      )
                    );
                  },
                },
              };
            } else {
              // generic live updater for all other nodes too
              return {
                ...n,
                data: {
                  ...n.data,
                  onDataChange: (newData) => {
                    setNodes((prev) =>
                      prev.map((node) =>
                        node.id === n.id
                          ? { ...node, data: { ...node.data, ...newData } }
                          : node
                      )
                    );
                  },
                },
              };
            }
          })
        );

        /*==============================================================================================*/

        if (editFlowData.properties) {
          dispatch({
            type: ACTION_TYPES.UPDATE_GLOBAL_PROPERTIES,
            payload: editFlowData.properties,
          });
        } else {
          const sourceAndTargetNodes = restoredData.nodes.filter(
            (node) => node.type === "source" || node.type === "target"
          );

          const allNodesWithCountLogging = sourceAndTargetNodes.every(
            (node) => node.data && node.data.enableCountLogging === true
          );

          dispatch({
            type: ACTION_TYPES.UPDATE_GLOBAL_PROPERTIES,
            payload: {
              logging: {
                isLoggingEnabled: true,
                isLoggingEnabledForEachDataset: allNodesWithCountLogging,
              },
              email: {
                isEmailEnabled: false, // Default value
              },
            },
          });
        }

        // Clear session storage after restoring
        sessionStorage.removeItem("editMode");
        sessionStorage.removeItem("editFlowData");
        sessionStorage.removeItem("editTransformationId");

        // Mark restoration complete after a short delay
        setTimeout(() => {
          setIsRestorationComplete(true);
          setNodes((prevNodes) =>
            prevNodes.map((node) => ({
              ...node,
              data: {
                ...node.data,
                _isRestoring: false,
              },
            }))
          );
        }, 500);

        toast.success("Transformation loaded for editing", {
          duration: 2000,
          position: "top-center",
        });
      } catch (error) {
        console.error("Error restoring edit flow data:", error);
        toast.error("Failed to load transformation for editing", {
          duration: 3000,
          position: "top-center",
        });
        setIsRestorationComplete(true);
      }
    } else {
      setIsRestorationComplete(true);
    }
  }, []); // Empty dependency array to run only once

  // Immediate onDataChange function without debouncing for better drawer performance
  const onDataChangeImmediate = useCallback(
    (nodeId, newData) => {
      setNodes((prevNodes) =>
        prevNodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n
        )
      );
    },
    [setNodes]
  );

  useEffect(() => {
    if (!isRestorationComplete) return;

    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const currentData = node.data || {};

        // Stable, node-specific onDataChange
        const onDataChange = (newData) => {
          // Skip while restoring
          if (currentData._isRestoring) return;

          setNodes((prevNodes) =>
            prevNodes.map((n) =>
              n.id === node.id ? { ...n, data: { ...n.data, ...newData } } : n
            )
          );
        };

        return {
          ...node,
          data: {
            ...currentData,
            onDataChange,
          },
        };
      })
    );
  }, [setNodes, isRestorationComplete]);

  useEffect(() => {
    id = nodeIdRef.current;
  }, []);

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

      if (
        sourceNode.type === "source" &&
        targetNode.type !== "transformation"
      ) {
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
    const targetNodes = nodes.filter((n) => n.type === "target");
    for (const targetNode of targetNodes) {
      if (!targetNode.data?.connectedSources) continue;
      const confirmed =
        window.localStorage.getItem(
          `targetMappingConfirmed_${targetNode.id}`
        ) === "true";
      if (!confirmed) {
        toast.error(
          `Please confirm target mapping for '${
            targetNode.data.alias || "target node"
          }' before saving.`,
          {
            duration: 3000,
            position: "top-center",
          }
        );
        return;
      }
    }

    try {
      const disconnectedNodes = nodes.filter((node) => {
        const hasIncomingEdge = edges.some((edge) => edge.target === node.id);
        const hasOutgoingEdge = edges.some((edge) => edge.source === node.id);

        return !(hasIncomingEdge || hasOutgoingEdge);
      });

      if (disconnectedNodes.length > 0) {
        const nodeTypes = disconnectedNodes.map((node) => node.type).join(", ");
        toast.error(
          `Please connect all nodes: ${nodeTypes} ${
            disconnectedNodes.length > 1 ? "nodes are" : "node is"
          } disconnected`,
          {
            duration: 3000,
            position: "top-center",
          }
        );
        return;
      }

      const defineNodeIndex = nodes.findIndex((node) => node.type === "define");
      if (defineNodeIndex !== -1 && window.allNodes) {
        const liveDefine = window.allNodes.find((n) => n.type === "define");
        if (liveDefine && liveDefine.data) {
          nodes[defineNodeIndex].data = { ...liveDefine.data };
        }
      }

      const defineNode = nodes.find((node) => node.type === "define");
      try {
        const nameInput = document.querySelector(
          'input[placeholder="Enter transformation name"]'
        );
        const descTextarea = document.querySelector(
          'textarea[placeholder="Enter description"]'
        );

        if (defineNode && defineNode.data) {
          defineNode.data.name =
            nameInput?.value?.trim() || defineNode.data.name || "";
          defineNode.data.description =
            descTextarea?.value?.trim() || defineNode.data.description || "";
        }
      } catch (e) {
        console.warn("DefineNode DOM sync skipped:", e);
      }

      // console.log("Define node data before save:", defineNode?.data);
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

      nodes.forEach((node) => {
        if (
          node.type === "source" &&
          typeof node.data.enableCountLogging === "boolean"
        ) {
          dispatch({
            type: ACTION_TYPES.UPDATE_SOURCE,
            payload: {
              id: node.id,
              data: {
                enableCountLogging: node.data.enableCountLogging,
                customQuery: node.data.customQuery,
                fileColumns: node.data.fileColumns,
              },
            },
          });
        } else if (
          node.type === "target" &&
          typeof node.data.enableCountLogging === "boolean"
        ) {
          dispatch({
            type: ACTION_TYPES.UPDATE_TARGET,
            payload: {
              id: node.id,
              data: { enableCountLogging: node.data.enableCountLogging },
            },
          });
        } else {
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      setIsSaving(true);

      dispatch({
        type: ACTION_TYPES.UPDATE_DEFINE,
        payload: {
          name: defineNode.data.name,
          description: defineNode.data.description || "",
        },
      });

      const transformationData = generateTransformationJson({
        name: defineNode.data.name,
        description: defineNode.data.description || "",
      });

      if (Object.keys(transformationData.source).length === 0) {
        toast.error(
          "Source data is empty. Make sure your source nodes are properly connected."
        );
        setIsSaving(false);
        return;
      }

      if (Object.keys(transformationData.target).length === 0) {
        toast.error(
          "Target data is empty. Make sure your target nodes are properly connected."
        );
        setIsSaving(false);
        return;
      }

      const consolidatedProcedureExecution = {};
      let globalProcCounter = 1;

      Object.entries(transformationData.procedureExecution).forEach(
        ([nodeId, procedureArray]) => {
          const node = nodes.find((n) => n.id === nodeId);
          if (
            node &&
            node.type === "source" &&
            node.data.alias &&
            Array.isArray(procedureArray)
          ) {
            const beforeSourceReadProcs = [];
            const afterSourceReadProcs = [];
            procedureArray.forEach((procedureData) => {
              const procData = {
                EventType: procedureData.EventType,
                Dataset: node.data.alias,
                ProcName: procedureData.ProcName,
                ProcParams: procedureData.ProcParams,
                ProcOrder: procedureData.ProcOrder,
              };
              if (procedureData.EventType === "BeforeSourceRead") {
                beforeSourceReadProcs.push(procData);
              } else if (procedureData.EventType === "AfterSourceRead") {
                afterSourceReadProcs.push(procData);
              }
            });
            beforeSourceReadProcs.sort((a, b) => a.ProcOrder - b.ProcOrder);
            afterSourceReadProcs.sort((a, b) => a.ProcOrder - b.ProcOrder);
            [...beforeSourceReadProcs, ...afterSourceReadProcs].forEach(
              (procData) => {
                const uniqueKey = `Proc${globalProcCounter}`;
                consolidatedProcedureExecution[uniqueKey] = procData;
                globalProcCounter++;
              }
            );
          }
        }
      );

      Object.entries(transformationData.procedureExecution).forEach(
        ([nodeId, procedureArray]) => {
          const node = nodes.find((n) => n.id === nodeId);
          if (
            node &&
            node.type === "target" &&
            node.data.alias &&
            Array.isArray(procedureArray)
          ) {
            const beforeTargetWriteProcs = [];
            const afterTargetWriteProcs = [];
            procedureArray.forEach((procedureData) => {
              const procData = {
                EventType: procedureData.EventType,
                Dataset: node.data.alias,
                ProcName: procedureData.ProcName,
                ProcParams: procedureData.ProcParams,
                ProcOrder: procedureData.ProcOrder,
              };
              if (procedureData.EventType === "BeforeTargetWrite") {
                beforeTargetWriteProcs.push(procData);
              } else if (procedureData.EventType === "AfterTargetWrite") {
                afterTargetWriteProcs.push(procData);
              }
            });
            beforeTargetWriteProcs.sort((a, b) => a.ProcOrder - b.ProcOrder);
            afterTargetWriteProcs.sort((a, b) => a.ProcOrder - b.ProcOrder);
            [...beforeTargetWriteProcs, ...afterTargetWriteProcs].forEach(
              (procData) => {
                const uniqueKey = `Proc${globalProcCounter}`;
                consolidatedProcedureExecution[uniqueKey] = procData;
                globalProcCounter++;
              }
            );
          }
        }
      );

      transformationData.procedureExecution = consolidatedProcedureExecution;

      const targetNodes = nodes.filter((n) => n.type === "target");
      for (const targetNode of targetNodes) {
        if (!targetNode.data?.connectedSources) continue;

        const confirmed =
          window.localStorage.getItem(
            `targetMappingConfirmed_${targetNode.id}`
          ) === "true";
        if (!confirmed) {
          toast.error(
            `Please confirm target mapping for '${
              targetNode.data.alias || "target node"
            }' before saving.`,
            {
              duration: 3000,
              position: "top-center",
            }
          );
          setIsSaving(false);
          return;
        }
      }

      const sourceConnectionIds = [];
      const sourceTables = [];
      Object.values(transformationData.source).forEach((source) => {
        const sourceNode = nodes.find(
          (n) =>
            n.type === "source" && n.data.connection === source.sourceConnName
        );
        if (sourceNode && sourceNode.data.connectionId) {
          sourceConnectionIds.push(sourceNode.data.connectionId);
        }
        if (
          source.ConnectionParameters.sourceSchema &&
          source.ConnectionParameters.sourceTable
        ) {
          sourceTables.push(
            `${source.ConnectionParameters.sourceSchema}.${source.ConnectionParameters.sourceTable}`
          );
        }
      });

      const targetConnectionIds = [];
      const targetTables = [];
      Object.values(transformationData.target).forEach((target) => {
        const targetNode = nodes.find(
          (n) =>
            n.type === "target" && n.data.connection === target.targetConnName
        );
        if (targetNode && targetNode.data.connectionId) {
          targetConnectionIds.push(targetNode.data.connectionId);
        }
        if (
          target.LoadingParams.targetschema &&
          target.LoadingParams.targetTable
        ) {
          targetTables.push(
            `${target.LoadingParams.targetschema}.${target.LoadingParams.targetTable}`
          );
        }
      });

      const editFlowData = prepareEditFlowData(nodes, edges, nodeIdRef.current);
      // console.log("Define node data before save:", defineNode.data);

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
        extra_info: {
          edit_flow: editFlowData,
        },
      };

      // console.log(payload)
      const isUpdate = isEditMode && editTransformationId;
      const url = isUpdate
        ? `${hostname}/etl/transformation/edit/update?transformation_id=${editTransformationId}`
        : `${hostname}/etl/transformation`;
      const method = isUpdate ? "PATCH" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail ||
            `Failed to ${isUpdate ? "update" : "save"} transformation`
        );
      }

      if (
        transformationData.properties &&
        transformationData.properties.logging
      ) {
        try {
          localStorage.setItem(
            `countLogging_${defineNode.data.name}`,
            JSON.stringify(transformationData.properties.logging)
          );
        } catch (e) {
          console.warn("Failed to store count logging settings:", e);
        }
      }

      toast.success(
        `Transformation ${isUpdate ? "updated" : "saved"} successfully!`,
        {
          duration: 3000,
          position: "top-center",
        }
      );

      setTimeout(() => {
        navigate("/transformation");
      }, 1500);
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "saving"} transformation:`,
        error
      );
      toast.error(
        `Failed to ${isEditMode ? "update" : "save"} transformation: ${
          error.message
        }`,
        {
          duration: 5000,
          position: "top-center",
        }
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    generateTransformationJson,
    nodes,
    edges,
    navigate,
    hostname,
    token,
    decodedToken,
    project,
    nodeIdRef,
    isEditMode,
    editTransformationId,
    dispatch,
    ACTION_TYPES,
  ]);

  const handleNewFlow = useCallback(() => {
    // Reset the context state
    dispatch({ type: ACTION_TYPES.RESET });

    // Reset nodes and edges
    setNodes(initialNodes);
    setEdges(initialEdges);
    nodeIdRef.current = 1;

    // Clear all localStorage mappings related to target mappings
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("targetMapping_") ||
          key.startsWith("targetMappingConfirmed_") ||
          key.startsWith("targetMapping_") ||
          key.includes("_draft") ||
          key.includes("_backup"))
      ) {
        keysToRemove.push(key);
      }
    }

    // Remove all identified keys
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Also clear debug variables if they exist
    if (window.targetMappingsDebug) window.targetMappingsDebug = {};
    if (window.preservedTargetMappingsDebug)
      window.preservedTargetMappingsDebug = {};
  }, [dispatch, setNodes, setEdges]);

  const handleCancel = useCallback(() => {
    // Perform complete reset
    handleNewFlow();
    navigate("/transformation");
  }, [navigate, handleNewFlow]);

  const openTransformationDrawer = useCallback(
    (nodeId) => {
      setActiveTransformationNodeId(nodeId);
      setDrawerOpen(true);

      window.allNodes = nodes;
      window.allEdges = edges;
    },
    [nodes, edges]
  );

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
      // Before opening the drawer, refresh all source columns
      if (window.allNodes && window.allEdges) {
        // Find the target node
        const targetNode = window.allNodes.find(
          (n) => n.id === nodeId && n.type === "target"
        );
        if (targetNode) {
          // Find all transformation nodes connected to this target
          const incomingEdges = window.allEdges.filter(
            (e) => e.target === nodeId
          );
          const transformationNodeIds = incomingEdges
            .map((e) => e.source)
            .filter((srcId) => {
              const n = window.allNodes.find((n) => n.id === srcId);
              return n && n.type === "transformation";
            });

          // Trigger a global refresh event for all components to update their columns
          window.dispatchEvent(
            new CustomEvent("tantor-refresh-all-columns", {
              detail: { targetNodeId: nodeId },
            })
          );

          // Short delay to let columns update before opening the drawer
          setTimeout(() => {
            setArthDrawerNodeId(nodeId);
            setArthDrawerProps({ ...props });
            setArthDrawerOpen(true);
          }, 50);
        } else {
          // If no extra processing needed, open drawer immediately
          setArthDrawerNodeId(nodeId);
          setArthDrawerProps({ ...props });
          setArthDrawerOpen(true);
        }
      } else {
        // Fallback to opening drawer directly
        setArthDrawerNodeId(nodeId);
        setArthDrawerProps({ ...props });
        setArthDrawerOpen(true);
      }
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
    return nodes.find((node) => node.id === activeTransformationNodeId);
  }, [activeTransformationNodeId, nodes]);

  const activeNode = getActiveTransformationNode();

  const updateTransformationNodesData = useCallback(() => {
    setNodes((prevNodes) => {
      const sourceIdToAlias = {};
      const targetIdToAlias = {};
      prevNodes.forEach((node) => {
        if (node.type === "source") {
          sourceIdToAlias[node.id] =
            node.data.alias || `unnamed_source_${node.id}`;
        }
        if (node.type === "target") {
          targetIdToAlias[node.id] =
            node.data.alias || `unnamed_target_${node.id}`;
        }
      });

      return prevNodes.map((node) => {
        if (node.type === "transformation") {
          const incomingEdges = edges.filter((edge) => edge.target === node.id);
          const outgoingEdges = edges.filter((edge) => edge.source === node.id);

          const sourceNodes = incomingEdges
            .map((edge) => prevNodes.find((n) => n.id === edge.source))
            .filter(Boolean)
            .map((srcNode) => ({
              ...srcNode,
              dfId: sourceIdToAlias[srcNode.id] || srcNode.id,
            }));

          const targetNodes = outgoingEdges
            .map((edge) => prevNodes.find((n) => n.id === edge.target))
            .filter(Boolean)
            .map((tgtNode) => ({
              ...tgtNode,
              dfId: targetIdToAlias[tgtNode.id] || tgtNode.id,
            }));

          const nodeToDataframeMap = {};
          sourceNodes.forEach((node) => {
            nodeToDataframeMap[node.id] = node.dfId;
          });
          targetNodes.forEach((node) => {
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
              isFullyConnected:
                sourceNodes.length > 0 && targetNodes.length > 0,
              onDataChange: node.data.onDataChange,
            },
          };
        }

        if (node.type === "target") {
          const incomingEdges = edges.filter((edge) => edge.target === node.id);
          const connectedSources = incomingEdges
            .map((edge) =>
              prevNodes.find(
                (n) => n.id === edge.source && n.type === "transformation"
              )
            )
            .filter(Boolean).length;

          return {
            ...node,
            data: {
              ...node.data,
              connectedSources,
              onDataChange: node.data.onDataChange,
            },
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
    const defineNode = nodes.find((node) => node.type === "define");
    if (!defineNode) return;

    const sourceNodes = nodes.filter((node) => node.type === "source");
    const targetNodes = nodes.filter((node) => node.type === "target");

    const connectedSource = sourceNodes.find((src) =>
      edges.some((edge) => edge.source === src.id || edge.target === src.id)
    );
    const connectedTarget = targetNodes.find((tgt) =>
      edges.some((edge) => edge.source === tgt.id || edge.target === tgt.id)
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
            const uniqueName = await defineNode.data.generateUniqueName(
              autoName
            );
            if (defineNode.data.name !== uniqueName) {
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === defineNode.id
                    ? { ...n, data: { ...n.data, name: uniqueName } }
                    : n
                )
              );
            }
          } catch (error) {
            console.error("Error generating unique name:", error);
            if (defineNode.data.name !== autoName) {
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === defineNode.id
                    ? { ...n, data: { ...n.data, name: autoName } }
                    : n
                )
              );
            }
          }
        } else {
          if (defineNode.data.name !== autoName) {
            setNodes((nds) =>
              nds.map((n) =>
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

  const handleAddNewTargetColumn = useCallback(
    (columnName) => {
      setNodes((prevNodes) => {
        if (!activeTransformationNodeId) return prevNodes;
        const outgoingEdges = edges.filter(
          (edge) => edge.source === activeTransformationNodeId
        );
        const targetNodeIds = outgoingEdges
          .map((edge) => {
            const tgtNode = prevNodes.find(
              (n) => n.id === edge.target && n.type === "target"
            );
            return tgtNode ? tgtNode.id : null;
          })
          .filter(Boolean);

        return prevNodes.map((node) => {
          if (targetNodeIds.includes(node.id)) {
            let columns = Array.isArray(node.data.columns)
              ? [...node.data.columns]
              : [];
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
              },
            };
          }
          return node;
        });
      });
    },
    [edges, activeTransformationNodeId, setNodes]
  );

  const handleTransformationApply = useCallback(
    (transformationNodeId, transformations) => {
      setNodes((prevNodes) => {
        const outgoingEdges = edges.filter(
          (edge) => edge.source === transformationNodeId
        );
        const targetNodeIds = outgoingEdges
          .map((edge) => {
            const tgtNode = prevNodes.find(
              (n) => n.id === edge.target && n.type === "target"
            );
            return tgtNode ? tgtNode.id : null;
          })
          .filter(Boolean);

        const processedTransformations = transformations.map((t) => {
          if (
            t.transformation_operation === "filter" &&
            !t.transformation_operator
          ) {
            return { ...t, transformation_operator: "==" };
          }
          return t;
        });

        return prevNodes.map((node) => {
          if (node.id === transformationNodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                transformations: processedTransformations,
                transformationConfig: {
                  ...node.data.transformationConfig,
                  operations: processedTransformations,
                },
              },
            };
          }
          if (targetNodeIds.includes(node.id)) {
            return {
              ...node,
              data: {
                ...node.data,
                transformations: processedTransformations,
              },
            };
          }
          return node;
        });
      });
    },
    [edges, setNodes]
  );

  return (
    <div style={{ width: "100%", height: "90vh" }} className="relative">
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
        deleteKeyCode={["Backspace", "Delete"]}
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
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {isEditMode ? "Updating..." : "Saving..."}
            </>
          ) : isEditMode ? (
            "Update"
          ) : (
            "Save"
          )}
        </button>
      </div>

      {/* Only render drawer after restoration is complete */}
      {isRestorationComplete && (
        <TransformationDrawer
          isOpen={drawerOpen}
          onClose={closeTransformationDrawer}
          activeNode={activeNode}
          activeNodeId={activeTransformationNodeId}
          onAddNewTargetColumn={handleAddNewTargetColumn}
          onApplyTransformations={handleTransformationApply}
        />
      )}

      {arthDrawerOpen && (
        <TargetMappingDrawer
          nodeId={arthDrawerNodeId}
          onClose={() => setArthDrawerOpen(false)}
          {...arthDrawerProps}
        />
      )}

      <UnStructureDataPrep
        open={nlpModalOpen}
        onClose={() => window.closeUnstructuredDataPrepModal?.()}
        txtFile={nlpTxtFile}
      />
    </div>
  );
}

const TransformationCanvas = () => {
  return (
    <TransformationProvider>
      {" "}
      <TransformationCanvasContent />
    </TransformationProvider>
  );
};

export default TransformationCanvas;
