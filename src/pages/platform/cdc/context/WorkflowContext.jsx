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

  const pipelineCounterRef = useRef({ count: 0 });
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef(null);
  const { fitView } = useReactFlow();

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
        return prevPipelines;
      }
      return {
        ...prevPipelines,
        [pipelineId]: {
          ...prevPipelines[pipelineId],
          data: {
            ...prevPipelines[pipelineId].data,
            [nodeType]: {
              ...prevPipelines[pipelineId].data[nodeType],
              ...nodeData,
            },
          },
        },
      };
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

  const selectSource = (ID, sourceTable, connectedTargets, isPipelineMode = true) => {  
    setInProgressMappings((prev) => ({
      ...prev,
      [ID]: {
        sourceTable,
        ...(isPipelineMode ? {} : { remainingTargets: new Set(connectedTargets) }),
      },
    }));
  };
  

  const completeMapping = (ID, sourceID, targetTable, isPipelineMode = true) => {

    const sourceData = isPipelineMode? inProgressMappings[ID] : inProgressMappings[sourceID];

    if (!sourceData || !sourceData.sourceTable) {
        console.warn("No source data found or source table missing!");
        return;
    }

    const mappingKey = isPipelineMode ? ID : `${sourceID}-${ID}`;

    const newMapping = {
        sourceTable: sourceData.sourceTable,
        targetTable,
        schedule: {},
        scope:{},
        whereCondition: {},
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


  const deleteMapping = (sourceId, ID, idx, isPipelineMode=true) => {
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
  

  const updateMappingDetails = (sourceId, targetId, idx, newDetails, isPipelineMode, pipelineId) => {
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
  
          const existingData = Array.isArray(node.data[nodeType]) ? node.data[nodeType] : [];
          const existingIndex = existingData.findIndex((item) => item.id === nodeId);
  
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
