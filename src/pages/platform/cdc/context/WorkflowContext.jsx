import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { createPipeline } from "../components/CreatePipeline";
import { Background, useReactFlow } from "reactflow";

import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
} from "reactflow";

const WorkflowContext = createContext();

export const WorkflowProvider = ({ children }) => {
  const [pipelines, setPipelines] = useState({});
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [pipelineMappings, setPipelineMappings] = useState({});
  const [inProgressMappings, setInProgressMappings] = useState({});
  const [bulkMappings, setBulkMappings] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [initializedPipelines, setInitializedPipelines] = useState(new Set());

  const pipelineCounterRef = useRef({ count: 0 });
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef(null);
  const { fitView } = useReactFlow();

  // Initialize workflow from nodeJson (for edit mode)
  const initializeFromNodeJson = useCallback((nodeJson) => {
    if (!nodeJson || !nodeJson.nodes || !nodeJson.edges) return;

    setEditMode(true);

    // Set nodes and edges
    setNodes(nodeJson.nodes);
    setEdges(nodeJson.edges);

    // Extract pipeline IDs and initialize pipelines state
    const pipelineData = {};
    const bulkMappingsData = {};
    const initializedIds = new Set();

    nodeJson.nodes.forEach((node) => {
      const pipelineId = node.data?.pipelineId;
      if (pipelineId && !pipelineData[pipelineId]) {
        pipelineData[pipelineId] = {
          data: {
            define: node.data?.define || null,
            source: node.data?.source || null,
            target: node.data?.target || null,
            scheduler: node.data?.scheduler || null,
          },
        };
        initializedIds.add(pipelineId);

        // Initialize bulk mappings from target.bulk_list
        if (node.data?.target?.bulk_list && Array.isArray(node.data.target.bulk_list)) {
          bulkMappingsData[pipelineId] = node.data.target.bulk_list.map((mapping) => ({
            source_table: mapping.source_table,
            target_table: mapping.target_table,
            schedule: mapping.schedule || {},
            whereCondition: mapping.whereCondition || "",
            source_columns: mapping.source_columns || [],
          }));
        }
      }
    });

    // Also check pipelineData from nodeJson if available
    if (nodeJson.pipelineData) {
      const firstPipelineId = Object.keys(pipelineData)[0];
      if (firstPipelineId) {
        pipelineData[firstPipelineId] = {
          data: {
            define: nodeJson.pipelineData.define || pipelineData[firstPipelineId]?.data?.define,
            source: nodeJson.pipelineData.source || pipelineData[firstPipelineId]?.data?.source,
            target: nodeJson.pipelineData.target || pipelineData[firstPipelineId]?.data?.target,
            scheduler: nodeJson.pipelineData.scheduler || pipelineData[firstPipelineId]?.data?.scheduler,
          },
        };

        // Initialize bulk mappings from pipelineData.target.bulk_list
        if (nodeJson.pipelineData.target?.bulk_list && Array.isArray(nodeJson.pipelineData.target.bulk_list)) {
          bulkMappingsData[firstPipelineId] = nodeJson.pipelineData.target.bulk_list.map((mapping) => ({
            source_table: mapping.source_table,
            target_table: mapping.target_table,
            schedule: mapping.schedule || {},
            whereCondition: mapping.whereCondition || "",
            source_columns: mapping.source_columns || [],
          }));
        }
      }
    }

    setPipelines(pipelineData);
    setBulkMappings(bulkMappingsData);
    setInitializedPipelines(initializedIds);

    // Update pipeline counter
    pipelineCounterRef.current.count = Object.keys(pipelineData).length;

    setTimeout(() => {
      reactFlowInstance?.fitView?.({ padding: 0.2, duration: 800 });
    }, 100);
  }, [setNodes, setEdges, reactFlowInstance]);

  // Check if a pipeline has been initialized (for edit mode)
  const isPipelineInitialized = useCallback((pipelineId) => {
    return initializedPipelines.has(pipelineId);
  }, [initializedPipelines]);

  // Mark a pipeline as initialized
  const markPipelineInitialized = useCallback((pipelineId) => {
    setInitializedPipelines((prev) => new Set([...prev, pipelineId]));
  }, []);

  const addPipeline = (category) => {
    const pipelineId = `pipeline_${Date.now()}`;
    const pipelineIndex = pipelineCounterRef.current.count++;

    const { nodes: newNodes, edges: newEdges } = createPipeline(
      category,
      pipelineId,
      pipelineIndex
    );

    setPipelines((prev) => ({
      ...prev,
      [pipelineId]: {
        data: {
          define: null,
          source: null,
          target: null,
          scheduler: null,
        },
      },
    }));

    setNodes((prev) => [...prev, ...newNodes]);
    setEdges((prev) => [...prev, ...newEdges]);

    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
    }, 100);
  };

  const updatePipelineData = (pipelineId, nodeType, nodeData) => {
    setPipelines((prevPipelines) => {

      if (!prevPipelines[pipelineId]) {
        // If pipeline doesn't exist yet, create it
        return {
          ...prevPipelines,
          [pipelineId]: {
            data: {
              define: null,
              source: null,
              target: null,
              scheduler: null,
              [nodeType]: { ...nodeData },
            },
          },
        };
      }

      // Handle table_op_types if present
      if (nodeData.table_op_types) {
        const existingTableOpTypes = prevPipelines[pipelineId]?.data?.[nodeType]?.table_op_types || {};
        nodeData = {
          ...nodeData,
          table_op_types: {
            ...existingTableOpTypes,
            ...nodeData.table_op_types
          }
        };
      }

      const updatedPipelines = {
        ...prevPipelines,
        [pipelineId]: {
          ...prevPipelines[pipelineId],
          data: {
            ...prevPipelines[pipelineId].data,
            [nodeType]: {
              ...nodeData, // Replace entirely to ensure new bulk_list is used
            },
          },
        },
      };
      return updatedPipelines;
    });
  };

  const deletePipeline = (pipelineId) => {
    setPipelines((prevPipelines) => {
      const updatedPipelines = { ...prevPipelines };
      delete updatedPipelines[pipelineId];
      return updatedPipelines;
    });

    setNodes((prevNodes) =>
      prevNodes.filter((node) => node.data.pipelineId !== pipelineId)
    );
    setEdges((prevEdges) =>
      prevEdges.filter((edge) => !edge.id.includes(pipelineId))
    );
  };

  const selectSource = (
    ID,
    source_table,
    connectedTargets,
    isPipelineMode = true
  ) => {
    setInProgressMappings((prev) => ({
      ...prev,
      [ID]: {
        source_table,
        ...(isPipelineMode
          ? {}
          : { remainingTargets: new Set(connectedTargets) }),
      },
    }));
  };

  const completeMapping = (
    ID,
    sourceID,
    target_table,
    isPipelineMode = true
  ) => {
    const sourceData = isPipelineMode
      ? inProgressMappings[ID]
      : inProgressMappings[sourceID];

    if (!sourceData || !sourceData.source_table) {
      console.warn("No source data found or source table missing!");
      return;
    }

    const mappingKey = isPipelineMode ? ID : `${sourceID}-${ID}`;

    const newMapping = {
      source_table: sourceData.source_table,
      target_table,
      schedule: {},
      whereCondition: "",
    };

    setPipelineMappings((prev) => {
      const updatedMappings = {
        ...prev,
        [mappingKey]: [...(prev[mappingKey] || []), newMapping],
      };
      return updatedMappings;
    });

    setInProgressMappings((prev) => {
      if (isPipelineMode) {
        return {};
      }

      const updated = { ...prev };

      if (!updated[sourceID].remainingTargets) {
        return updated;
      }

      updated[sourceID].remainingTargets.delete(ID);

      if (updated[sourceID].remainingTargets.size === 0) {
        delete updated[sourceID];
      }

      return updated;
    });
  };

  const deleteMapping = (sourceId, ID, idx, isPipelineMode = true) => {
    const key = isPipelineMode ? ID : `${sourceId}-${ID}`;
    setPipelineMappings((prev) => {
      if (!prev[key]) return prev;

      const updatedMappings = prev[key].filter((_, index) => index !== idx);

      const newState = { ...prev };
      if (updatedMappings.length > 0) {
        newState[key] = updatedMappings;
      } else {
        delete newState[key];
      }

      return newState;
    });
  };

  const updateMappingDetails = (
    sourceId,
    targetId,
    idx,
    newDetails,
    isPipelineMode,
    pipelineId
  ) => {
    const key = isPipelineMode ? pipelineId : `${sourceId}-${targetId}`;

    setPipelineMappings((prev) => {
      if (!prev[key] || idx >= prev[key].length) return prev;

      const updatedMappings = [...prev[key]];
      updatedMappings[idx] = { ...updatedMappings[idx], ...newDetails };

      return { ...prev, [key]: updatedMappings };
    });
  };

  const addNode = (type, category) => {
    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
    const newNode = {
      id: `${type}_${Date.now()}`,
      type: type.toLowerCase(),
      position,
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        category,
      },
    };
    setNodes((nodes) => [...nodes, newNode]);
  };

  const updateCustomNode = (nodeId, nodeType, updatedData) => {
    setNodes((prevNodes) => {
      let updatedNodes = prevNodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                [nodeType]: {
                  id: nodeId,
                  ...updatedData,
                },
              },
            }
          : node
      );

      const connectedNodes = edges
        .filter((edge) => edge.source === nodeId || edge.target === nodeId)
        .map((edge) => (edge.source === nodeId ? edge.target : edge.source));

      updatedNodes = updatedNodes.map((node) => {
        if (connectedNodes.includes(node.id)) {
          const existingData = Array.isArray(node.data[nodeType])
            ? node.data[nodeType]
            : [];
          const existingIndex = existingData.findIndex(
            (item) => item.id === nodeId
          );

          let updatedArray;
          if (existingIndex !== -1) {
            updatedArray = [...existingData];
            updatedArray[existingIndex] = { id: nodeId, ...updatedData };
          } else {
            updatedArray = [...existingData, { id: nodeId, ...updatedData }];
          }
          return {
            ...node,
            data: {
              ...node.data,
              [nodeType]: updatedArray,
            },
          };
        }
        return node;
      });

      return updatedNodes;
    });
  };

  const updateData = (ID, isPipelineNode = false, type, updatedNodeData) => {
    isPipelineNode
      ? updatePipelineData(ID, type, updatedNodeData)
      : updateCustomNode(ID, type, updatedNodeData);
  };

  const addBulkMapping = (sourceId, ID, mapping, isPipelineMode = true) => {
    const key = isPipelineMode ? ID : `${sourceId}-${ID}`;
    setBulkMappings((prev) => {
      const updated = { ...prev };
      if (!updated[key]) updated[key] = [];

      const exists = updated[key].some(
        (m) =>
          m.source_table === mapping.source_table &&
          m.target_table === mapping.target_table
      );

      if (!exists) {
        updated[key] = [
          ...updated[key],
          {
            ...mapping,
            schedule: mapping.schedule || {},
            whereCondition: mapping.whereCondition || "",
            source_columns: mapping.source_columns || [],
          },
        ];
      }

      return updated;
    });
  };

  const updateBulkMappings = (
    sourceId,
    ID,
    target_table,
    updatedData,
    source_table = null,
    isPipelineMode = true
  ) => {
    const key = isPipelineMode ? ID : `${sourceId}-${ID}`;

    const validUpdateKeys = ["schedule", "whereCondition"];
    if (!updatedData || typeof updatedData !== 'object') {
      console.warn("updateBulkMappings: updatedData is not a valid object", updatedData);
      return;
    }
    const keysToUpdate = Object.keys(updatedData);

    if (!keysToUpdate.every((key) => validUpdateKeys.includes(key))) {
      return;
    }

    setBulkMappings((prevMappings) => {
      const updatedMappings = { ...prevMappings };

      if (updatedMappings[key]) {
        updatedMappings[key] = updatedMappings[key].map((mapping) => {
          if (
            mapping.target_table === target_table &&
            (source_table ? mapping.source_table === source_table : true)
          ) {
            return { ...mapping, ...updatedData };
          }
          return mapping;
        });
      } else {
        console.error("Mapping key", key, "not found.");
      }

      return updatedMappings;
    });
  };

  const removeBulkMapping = (nodeid, target_table, source_table = null) => {
    setBulkMappings((prevMappings) => {
      const updatedMappings = { ...prevMappings };

      if (updatedMappings[nodeid]) {
        updatedMappings[nodeid] = updatedMappings[nodeid].filter((mapping) => {
          return !(
            mapping.target_table === target_table &&
            (!source_table || mapping.source_table === source_table)
          );
        });
      }

      return updatedMappings;
    });
  };

  const deselectMapping = (nodeid, mapping) => {
    removeBulkMapping(nodeid, mapping.target_table, mapping.source_table);
  };

  const setBulkMappingsForNode = (nodeid, newMappings) => {
    setBulkMappings((prevMappings) => ({
      ...prevMappings,
      [nodeid]: newMappings,
    }));
  };

  // Function to get enhanced node data for storage (includes all user inputs)
  const getEnhancedNodeData = () => {
    const enhancedNodes = nodes.map((node) => {
      const pid = node.data?.pipelineId || node.id;
      const latestData = pipelines[pid]?.data;

      return {
        ...node,
        data: {
          ...node.data,
          // Include all the user input data
          define: latestData?.define || node.data?.define,
          source: latestData?.source || node.data?.source,
          target: latestData?.target || node.data?.target,
          scheduler: latestData?.scheduler || node.data?.scheduler,
        },
      };
    });

    return {
      nodes: enhancedNodes,
      edges,
      pipelineData: {
        define: pipelines[Object.keys(pipelines)[0]]?.data?.define,
        source: pipelines[Object.keys(pipelines)[0]]?.data?.source,
        target: pipelines[Object.keys(pipelines)[0]]?.data?.target,
        scheduler: pipelines[Object.keys(pipelines)[0]]?.data?.scheduler,
      }
    };
  };

  const getUniquesource_tablesInBulk = () => {
    const source_tables = new Set();
    for (const nodeid in bulkMappings) {
      bulkMappings[nodeid].forEach((mapping) => {
        source_tables.add(mapping.source_table);
      });
    }
    return Array.from(source_tables);
  };
  return (
    <WorkflowContext.Provider
      value={{
        nodes,
        setNodes,
        edges,
        addEdge,
        setEdges,
        addNode,
        addPipeline,
        updatePipelineData,
        deletePipeline,
        reactFlowWrapper,
        reactFlowInstance,
        fitView,
        pipelines,
        setPipelines,
        onNodesChange,
        onEdgesChange,
        selectSource,
        completeMapping,
        updateMappingDetails,
        deleteMapping,
        pipelineMappings,
        inProgressMappings,
        updateCustomNode,
        updateData,
        addBulkMapping,
        updateBulkMappings,
        deselectMapping,
        bulkMappings,
        setBulkMappings,
        editMode,
        setEditMode,
        getEnhancedNodeData,
        initializeFromNodeJson,
        isPipelineInitialized,
        markPipelineInitialized,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflow must be used within a WorkflowProvider");
  }
  return context;
};
