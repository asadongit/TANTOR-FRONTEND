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
      console.log(" Previous Pipelines:", prevPipelines);

      if (!prevPipelines[pipelineId]) {
        console.error(` Pipeline ${pipelineId} not found!`, prevPipelines);
        return prevPipelines;
      }

      console.log(` Updating pipeline: ${pipelineId}, nodeType: ${nodeType}`);
      console.log(
        " Previous Node Data:",
        prevPipelines[pipelineId].data[nodeType]
      );
      console.log(" New Node Data:", nodeData);

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

    console.log(`Pipeline ${pipelineId} deleted successfully.`);
  };



  const selectSource = (pipelineId, sourceTable) => {
    setInProgressMappings((prev) => ({
      ...prev,
      [pipelineId]: { ...prev[pipelineId], sourceTable },
    }));
  };

  const completeMapping = (ID, targetTable) => {
    const sourceTable = inProgressMappings[ID]?.sourceTable;
    if (!sourceTable) return;

    const newMapping = {
      sourceTable,
      targetTable,
      schedule: {},
      wherecondition: {},
    };

    setPipelineMappings((prev) => ({
      ...prev,
      [ID]: [...(prev[ID] || []), newMapping],
    }));

    setInProgressMappings((prev) => {
      const result = { ...prev };
      delete result[ID].sourceTable;
      return result;
    });
  };

  const deleteMapping = (pipelineId, idx) => {
    setPipelineMappings((prev) => {
      if (!prev[pipelineId]) return prev;

      const updatedMappings = prev[pipelineId].filter(
        (_, index) => index !== idx
      );

      const newState = { ...prev };
      if (updatedMappings.length > 0) {
        newState[pipelineId] = updatedMappings;
      } else {
        delete newState[pipelineId];
      }

      return newState;
    });
  };

  const updateMappingDetails = (pipelineId, idx, newDetails) => {
    setPipelineMappings((prev) => {
      if (!prev[pipelineId] || idx >= prev[pipelineId].length) return prev;

      const updatedMappings = [...prev[pipelineId]];
      updatedMappings[idx] = { ...updatedMappings[idx], ...newDetails };

      return { ...prev, [pipelineId]: updatedMappings };
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
    console.log("nodededede------------", newNode);
    setNodes((nodes) => [...nodes, newNode]);
  };

  const updateCustomNode = (nodeId, nodeType, updatedData) => {
    console.log("called for node",nodeId,nodeType,updatedData)
    setNodes((prevNodes) => {
      let updatedNodes = prevNodes.map((node) =>
        node.id === nodeId
          ? {
            ...node,
            data: {
              ...node.data,
              [nodeType]: updatedData,
            },
          }
          : node
      );

      const connectedTargets = edges
        .filter((edge) => edge.source === nodeId)
        .map((edge) => edge.target);

      updatedNodes = updatedNodes.map((node) =>
        connectedTargets.includes(node.id)
          ? {
            ...node,
            data: {
              ...node.data,
              [nodeType]: updatedData,
            },
          }
          : node
      );

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

export const useWorkflow = () => useContext(WorkflowContext);
