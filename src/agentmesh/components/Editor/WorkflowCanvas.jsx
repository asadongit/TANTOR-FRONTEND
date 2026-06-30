import React, { useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useWorkflowStore, useUIStore, useVariablesStore } from "../../store";
import AgentNode from "./Nodes/AgentNode";
import CardboardNode from "./Nodes/CardboardNode";
import NodePalette from "./NodePalette";
import PropertiesPanel from "./PropertiesPanel";
import {
  FiPlus,
  FiPlay,
  FiGitBranch,
  FiArrowLeftCircle,
  FiDatabase,
  FiSliders,
  FiCompass,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import ContextMenu from "./ContextMenu";
import VariableExplorer from "./VariableExplorer";
import NodeSearch from "./NodeSearch";
import PilotPanel from "./PilotPanel";

const NON_DIRTY_CHANGE_TYPES = new Set(["select", "dimensions", "reset"]);

// Helper to calculate distance from point p to line segment ab
const getDistanceToSegment = (p, a, b) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) {
    return { distance: Math.hypot(p.x - a.x, p.y - a.y), t: 0 };
  }

  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));

  const closestX = a.x + t * dx;
  const closestY = a.y + t * dy;

  return {
    distance: Math.hypot(p.x - closestX, p.y - closestY),
    t,
  };
};

const findClosestEdge = (
  p,
  currentNodes,
  currentEdges,
  draggedNodeId = null,
) => {
  let closestEdgeId = null;
  let minDistance = Infinity;

  // Filter out edges connected to the node being dragged
  const candidateEdges = currentEdges.filter(
    (e) => e.source !== draggedNodeId && e.target !== draggedNodeId,
  );

  for (const edge of candidateEdges) {
    const sourceNode = currentNodes.find((n) => n.id === edge.source);
    const targetNode = currentNodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) continue;

    if (
      sourceNode.type === "cardboardNode" ||
      targetNode.type === "cardboardNode"
    )
      continue;

    const widthA = sourceNode.measured?.width || 180;
    const heightA = sourceNode.measured?.height || 80;
    const widthB = targetNode.measured?.width || 180;
    const heightB = targetNode.measured?.height || 80;

    const a = {
      x: sourceNode.position.x + widthA / 2,
      y: sourceNode.position.y + heightA / 2,
    };
    const b = {
      x: targetNode.position.x + widthB / 2,
      y: targetNode.position.y + heightB / 2,
    };

    const { distance, t } = getDistanceToSegment(p, a, b);

    // Limit detection to 60px proximity and ensure projection point is well inside the segment (t between 0.05 and 0.95)
    if (distance < 60 && t > 0.05 && t < 0.95) {
      if (distance < minDistance) {
        minDistance = distance;
        closestEdgeId = edge.id;
      }
    }
  }

  return closestEdgeId;
};

const instantiateGroupTemplate = (config, newPosition) => {
  const originalPos = config.position || { x: 0, y: 0 };
  const dx = newPosition.x - originalPos.x;
  const dy = newPosition.y - originalPos.y;

  const idMap = {};
  const internalNodes = (config.internal_nodes || []).map(n => {
    const oldId = n.id;
    const type = n.data?.type || 'node';
    const newId = `${type}_${Math.random().toString(36).substring(2, 7)}`;
    idMap[oldId] = newId;

    return {
      ...n,
      id: newId,
      position: {
        x: (n.position?.x ?? 0) + dx,
        y: (n.position?.y ?? 0) + dy
      },
      data: {
        ...n.data,
        id: newId
      }
    };
  });

  const mapEdges = (edges) => (edges || []).map(e => ({
    ...e,
    id: `e_${idMap[e.source] || e.source}_to_${idMap[e.target] || e.target}_${Math.random().toString(36).substring(2, 7)}`,
    source: idMap[e.source] || e.source,
    target: idMap[e.target] || e.target
  }));

  const internalEdges = mapEdges(config.internal_edges);
  const originalEdges = mapEdges(config.original_edges);

  return {
    ...config,
    internal_nodes: internalNodes,
    internal_edges: internalEdges,
    original_edges: originalEdges
  };
};

export default function WorkflowCanvas() {
  const nodeTypes = React.useMemo(
    () => ({
      agentNode: AgentNode,
      cardboardNode: CardboardNode,
    }),
    [],
  );
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    setNodesDirty,
    setEdgesDirty,
    addNode,
    setNodeData,
    workflowName,
    undo,
    redo,
    previewingGroupId,
    exitGroupPreview,
    previewGroupOriginalNode,
    groupNodes,
    ungroupNode,
  } = useWorkflowStore();
  const {
    selectedNodeId,
    selectedEdgeId,
    setSelectedNode,
    setSelectedEdge,
    canvasWireStyle,
    canvasBackgroundStyle,
    isDarkCanvas,
    searchOpen,
    setSearchOpen,
    suggestionSource,
    setSuggestionSource,
    canvasDotSize,
    canvasEdgeWidth,
    canvasConnectionRadius,
    canvasSnapGrid,
  } = useUIStore();

  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const { setRunOpen } = useUIStore();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menu, setMenu] = useState(null);
  const [showPilotPanel, setShowPilotPanel] = useState(false);

  // Poll for active background runs (e.g. Cron/Webhook) to show live status
  React.useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(
          "http://localhost:8000/api/v1/agentmesh/active-runs",
        );
        const data = await res.json();
        if (data.status === "success") {
          const currentWfId = useWorkflowStore.getState().workflowId;
          const activeNodeIds = new Set();

          Object.values(data.active_runs).forEach((run) => {
            if (run.workflow_id === currentWfId) {
              run.active_nodes.forEach((id) => activeNodeIds.add(id));
            }
          });

          // Check if anything actually changed to avoid unnecessary re-renders
          const anyChange = nodes.some(
            (n) => !!n.data.isRunning !== activeNodeIds.has(n.id),
          );
          if (anyChange) {
            setNodes(
              nodes.map((n) => ({
                ...n,
                data: { ...n.data, isRunning: activeNodeIds.has(n.id) },
              })),
            );
          }
        }
      } catch {
        // Silently fail polling
      }
    };
    const interval = setInterval(poll, 2500);
    return () => clearInterval(interval);
  }, [nodes, setNodes]);
  // Variable/Data Explorer resizing state and mouse drag handlers
  const [explorerWidth, setExplorerWidth] = useState(320);
  const [isResizingExplorer, setIsResizingExplorer] = useState(false);

  const startResizingExplorer = useCallback(
    (mouseDownEvent) => {
      setIsResizingExplorer(true);
      const startX = mouseDownEvent.clientX;
      const startWidth = explorerWidth;

      const doDrag = (mouseMoveEvent) => {
        const deltaX = startX - mouseMoveEvent.clientX;
        const newWidth = Math.max(280, Math.min(600, startWidth + deltaX));
        setExplorerWidth(newWidth);
      };

      const stopDrag = () => {
        setIsResizingExplorer(false);
        document.removeEventListener("mousemove", doDrag);
        document.removeEventListener("mouseup", stopDrag);
      };

      document.addEventListener("mousemove", doDrag);
      document.addEventListener("mouseup", stopDrag);
    },
    [explorerWidth],
  );

  // Properties Panel resizing state and mouse drag handlers
  const [propertiesWidth, setPropertiesWidth] = useState(320);
  const [isResizingProperties, setIsResizingProperties] = useState(false);

  const startResizingProperties = useCallback(
    (mouseDownEvent) => {
      setIsResizingProperties(true);
      const startX = mouseDownEvent.clientX;
      const startWidth = propertiesWidth;

      const doDrag = (mouseMoveEvent) => {
        const deltaX = startX - mouseMoveEvent.clientX;
        const newWidth = Math.max(280, Math.min(800, startWidth + deltaX)); // Max width extended to 800 for prompts/SOP edits
        setPropertiesWidth(newWidth);
      };

      const stopDrag = () => {
        setIsResizingProperties(false);
        document.removeEventListener("mousemove", doDrag);
        document.removeEventListener("mouseup", stopDrag);
      };

      document.addEventListener("mousemove", doDrag);
      document.addEventListener("mouseup", stopDrag);
    },
    [propertiesWidth],
  );

  const hasNodes = nodes.some(
    (n) => n.id !== "__start__" && n.id !== "__end__",
  );

  const [hoveredEdgeId, setHoveredEdgeId] = useState(null);
  const [isDraggingSoloNode, setIsDraggingSoloNode] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState(null);

  const onConnect = useCallback(
    (params) => {
      // Take snapshot before connection modifications
      useWorkflowStore.getState().takeHistorySnapshot();
      // Take snapshot before connection modifications
      useWorkflowStore.getState().takeHistorySnapshot();
      const { source, target } = params;
      const sourceNode = nodes.find((n) => n.id === source);
      const targetNode = nodes.find((n) => n.id === target);

      // 🔄 SMART SYNC & IMPLICIT LOOP SUPPORT
      if (sourceNode && targetNode) {
        const isAgent = [
          "llm_agent",
          "deep_agent",
          "supervisor",
          "swarm",
        ].includes(sourceNode.data?.type);
        const isToolNode = targetNode.data?.type === "tool_node";

        if (isAgent && isToolNode) {
          const agentTools = sourceNode.data.tools || [];
          const toolNodeTools = targetNode.data.tools || [];
          const mergedTools = Array.from(
            new Set([...agentTools, ...toolNodeTools]),
          );
          const mergedConfigs = {
            ...(sourceNode.data.tool_configs || {}),
            ...(targetNode.data.tool_configs || {}),
          };

          if (
            mergedTools.length > agentTools.length ||
            mergedTools.length > toolNodeTools.length
          ) {
            setNodeData(source, {
              tools: mergedTools,
              tool_configs: mergedConfigs,
            });
            setNodeData(target, {
              tools: mergedTools,
              tool_configs: mergedConfigs,
            });
          }
          // Note: We no longer draw a manual return edge here because
          // GraphCompiler.py handles tool-return routing implicitly in the runtime.
        }
      }

      const edgeType = canvasWireStyle === "curve" ? "default" : "smoothstep";
      setEdgesDirty(
        addEdge(
          {
            ...params,
            animated: false,
            type: edgeType,
            style: { stroke: "#CBD5E1", strokeWidth: canvasEdgeWidth },
          },
          edges,
        ),
      );
    },
    [
      nodes,
      edges,
      setEdgesDirty,
      setNodeData,
      canvasWireStyle,
      canvasEdgeWidth,
    ],
  );

  const edgeType = canvasWireStyle === "curve" ? "default" : "smoothstep";
  const renderedEdges = React.useMemo(() => {
    const baseEdges = edges.map((edge) => {
      const isHovered = edge.id === hoveredEdgeId;
      let edgeStyle = edge.style || {
        stroke: "#CBD5E1",
        strokeWidth: canvasEdgeWidth,
      };
      if (isHovered) {
        if (draggedNodeId) {
          edgeStyle = {
            stroke: "#EF4444",
            strokeWidth: canvasEdgeWidth + 0.5,
            strokeDasharray: "3,3",
            opacity: 0.6,
          };
        } else {
          edgeStyle = {
            stroke: "var(--theme-primary, #8e77bb)",
            strokeWidth: canvasEdgeWidth + 1.5,
            strokeDasharray: "5,5",
          };
        }
      } else {
        edgeStyle = { ...edgeStyle, strokeWidth: canvasEdgeWidth };
      }

      return {
        ...edge,
        type: edgeType,
        animated: isHovered ? true : edge.animated,
        style: edgeStyle,
      };
    });

    if (hoveredEdgeId && draggedNodeId) {
      const edgeToSplit = edges.find((e) => e.id === hoveredEdgeId);
      if (edgeToSplit) {
        const previewEdges = [
          {
            id: `preview-edge-1-${edgeToSplit.source}-${draggedNodeId}`,
            source: edgeToSplit.source,
            target: draggedNodeId,
            sourceHandle: edgeToSplit.sourceHandle,
            targetHandle: null,
            type: edgeType,
            animated: true,
            style: {
              stroke: "var(--theme-primary, #8e77bb)",
              strokeWidth: canvasEdgeWidth + 0.5,
              strokeDasharray: "5,5",
            },
          },
          {
            id: `preview-edge-2-${draggedNodeId}-${edgeToSplit.target}`,
            source: draggedNodeId,
            target: edgeToSplit.target,
            sourceHandle: null,
            targetHandle: edgeToSplit.targetHandle,
            type: edgeType,
            animated: true,
            style: {
              stroke: "var(--theme-primary, #8e77bb)",
              strokeWidth: canvasEdgeWidth + 0.5,
              strokeDasharray: "5,5",
            },
          },
        ];
        return [...baseEdges, ...previewEdges];
      }
    }

    return baseEdges;
  }, [edges, edgeType, hoveredEdgeId, draggedNodeId]);

  const onNodeDragStart = useCallback(
    (event, node) => {
      // Take snapshot before dragging moves the node
      useWorkflowStore.getState().takeHistorySnapshot();

      // Take snapshot before dragging moves the node
      useWorkflowStore.getState().takeHistorySnapshot();

      const hasIncoming = edges.some((e) => e.target === node.id);
      const hasOutgoing = edges.some((e) => e.source === node.id);
      const isSolo = !hasIncoming && !hasOutgoing;
      const isCardboard =
        node.type === "cardboardNode" || node.data?.type === "cardboard";

      if (isSolo && !isCardboard) {
        setIsDraggingSoloNode(true);
        setDraggedNodeId(node.id);
      }
    },
    [edges],
  );

  const onNodeDrag = useCallback(
    (event, node) => {
      if (!isDraggingSoloNode) return;
      const width = node.measured?.width || 180;
      const height = node.measured?.height || 80;
      const p = {
        x: node.position.x + width / 2,
        y: node.position.y + height / 2,
      };
      const closestEdgeId = findClosestEdge(p, nodes, edges, node.id);
      setHoveredEdgeId(closestEdgeId);
    },
    [isDraggingSoloNode, nodes, edges],
  );

  const onNodeDragStop = useCallback(
    (event, node) => {
      if (isDraggingSoloNode && hoveredEdgeId) {
        const edgeToSplit = edges.find((e) => e.id === hoveredEdgeId);
        if (edgeToSplit) {
          // Take snapshot before edge split modification
          useWorkflowStore.getState().takeHistorySnapshot();
          // Take snapshot before edge split modification
          useWorkflowStore.getState().takeHistorySnapshot();
          const { source, target, sourceHandle, targetHandle } = edgeToSplit;
          const nextEdges = edges.filter((e) => e.id !== hoveredEdgeId);
          const edgeType =
            canvasWireStyle === "curve" ? "default" : "smoothstep";
          const newEdges = [
            ...nextEdges,
            {
              id: `e_${source}_to_${node.id}_${Date.now()}`,
              source,
              target: node.id,
              sourceHandle,
              targetHandle: null,
              type: edgeType,
              style: { stroke: "#CBD5E1", strokeWidth: 1.5 },
            },
            {
              id: `e_${node.id}_to_${target}_${Date.now()}`,
              source: node.id,
              target,
              sourceHandle: null,
              targetHandle,
              type: edgeType,
              style: { stroke: "#CBD5E1", strokeWidth: 1.5 },
            },
          ];
          setEdgesDirty(newEdges);
        }
      }
      setHoveredEdgeId(null);
      setIsDraggingSoloNode(false);
      setDraggedNodeId(null);
    },
    [isDraggingSoloNode, hoveredEdgeId, edges, setEdgesDirty, canvasWireStyle],
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/agentmesh-node");
      if (!type || !reactFlowInstance) {
        setHoveredEdgeId(null);
        return;
      }
      const position = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const id = addNode(type, position);

      // Support dropping pre-configured templates
      const configStr = e.dataTransfer.getData("application/agentmesh-config");
      if (configStr && id) {
        try {
          let config = JSON.parse(configStr);
          if (type === 'group') {
            config = instantiateGroupTemplate(config, position);
          }
          setNodeData(id, config);
        } catch (err) {
          console.error("Failed to parse dropped template config:", err);
        }
      }

      if (hoveredEdgeId && id) {
        const edgeToSplit = edges.find((e) => e.id === hoveredEdgeId);
        if (edgeToSplit) {
          // Take snapshot before edge split drop modification
          useWorkflowStore.getState().takeHistorySnapshot();
          // Take snapshot before edge split drop modification
          useWorkflowStore.getState().takeHistorySnapshot();
          const { source, target, sourceHandle, targetHandle } = edgeToSplit;
          const nextEdges = edges.filter((e) => e.id !== hoveredEdgeId);
          const edgeType =
            canvasWireStyle === "curve" ? "default" : "smoothstep";
          const newEdges = [
            ...nextEdges,
            {
              id: `e_${source}_to_${id}_${Date.now()}`,
              source,
              target: id,
              sourceHandle,
              targetHandle: null,
              type: edgeType,
              style: { stroke: "#CBD5E1", strokeWidth: 1.5 },
            },
            {
              id: `e_${id}_to_${target}_${Date.now()}`,
              source: id,
              target,
              sourceHandle: null,
              targetHandle,
              type: edgeType,
              style: { stroke: "#CBD5E1", strokeWidth: 1.5 },
            },
          ];
          setEdgesDirty(newEdges);
        }
      }
      setHoveredEdgeId(null);
    },
    [
      reactFlowInstance,
      addNode,
      setNodeData,
      hoveredEdgeId,
      edges,
      setEdgesDirty,
      canvasWireStyle,
    ],
  );

  const onDragOver = useCallback(
    (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (!reactFlowInstance) return;
      const flowPosition = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      const closestEdgeId = findClosestEdge(flowPosition, nodes, edges);
      setHoveredEdgeId(closestEdgeId);
    },
    [reactFlowInstance, nodes, edges],
  );

  const onDragLeave = useCallback(() => {
    setHoveredEdgeId(null);
  }, []);

  const onNodeClick = useCallback(
    (_, node) => {
      setSelectedNode(node.id);
      setPaletteOpen(false);
    },
    [setSelectedNode],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [setSelectedNode, setSelectedEdge]);

  const onEdgeClick = useCallback(
    (_, edge) => {
      setSelectedEdge(edge.id);
    },
    [setSelectedEdge],
  );

  const isValidConnection = useCallback(
    (connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return false;

      // Additional generic connection validation logic can be added here if needed
      // e.g. preventing self-connections
      if (connection.source === connection.target) return false;

      // 🛡️ Strict Tool Node Validation
      const isSourceTool = sourceNode.data?.type === "tool_node";
      const isTargetTool = targetNode.data?.type === "tool_node";
      const agentTypes = new Set([
        "llm_agent",
        "deep_agent",
        "supervisor",
        "swarm",
      ]);

      if (isSourceTool) {
        if (!agentTypes.has(targetNode.data?.type)) return false;
      }
      if (isTargetTool) {
        if (!agentTypes.has(sourceNode.data?.type)) return false;
      }

      return true;
    },
    [nodes],
  );

  const onNodesDelete = useCallback(
    (deleted) => {
      // Clear selection if deleted node was selected
      if (deleted.some((n) => n.id === selectedNodeId)) {
        setSelectedNode(null);
      }
    },
    [selectedNodeId, setSelectedNode],
  );

  const onNodeContextMenu = useCallback(
    (event, node) => {
      console.log('[onNodeContextMenu] FIRED for node:', node?.id, 'selected:', node?.selected);
      event.preventDefault();

      const { nodes: allNodes } = useWorkflowStore.getState();
      const selectedNodeIds = allNodes.filter(n => n.selected).map(n => n.id);
      const targetIds = selectedNodeIds.includes(node.id)
        ? selectedNodeIds
        : [node.id];

      console.log('[onNodeContextMenu] selectedNodeIds:', selectedNodeIds, 'targetIds:', targetIds);

      const menuWidth = 200;
      const menuHeight = targetIds.length > 1 ? 260 : 240;
      const { clientX, clientY } = event;

      setMenu({
        ids: targetIds,
        top: clientY < window.innerHeight - menuHeight ? clientY : undefined,
        left: clientX < window.innerWidth - menuWidth ? clientX : undefined,
        right:
          clientX >= window.innerWidth - menuWidth
            ? window.innerWidth - clientX
            : undefined,
        bottom:
          clientY >= window.innerHeight - menuHeight
            ? window.innerHeight - clientY
            : undefined,
      });
    },
    [setMenu],
  );

  const onPaneContextMenu = useCallback(
    (event) => {
      console.log('[onPaneContextMenu] FIRED');
      event.preventDefault();
      setMenu(null);
    },
    [setMenu],
  );

  const onPaneClickCloseMenu = useCallback(() => {
    console.log('[onPaneClickCloseMenu] closing menu');
    setMenu(null);
  }, [setMenu]);

  React.useEffect(() => {
    const wrapper = reactFlowWrapper.current;
    if (!wrapper) return;

    const handleContextMenu = (e) => {
      let nodeElement = e.target.closest('.react-flow__node');
      if (!nodeElement) {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        nodeElement = elements.find(el => el.classList?.contains('react-flow__node')) || null;
      }
      console.log('[capture-contextmenu] fired, target:', e.target.tagName, 'className:', e.target.className, 'id:', e.target.id);
      console.log('[capture-contextmenu] nodeElement found:', !!nodeElement);

      if (nodeElement) {
        e.preventDefault();

        const nodeId = nodeElement.getAttribute('data-id') || nodeElement.getAttribute('data-testid');

        if (nodeId) {
          const { nodes: allNodes } = useWorkflowStore.getState();
          const selectedNodeIds = allNodes.filter(n => n.selected).map(n => n.id);
          const targetIds = selectedNodeIds.includes(nodeId)
            ? selectedNodeIds
            : [nodeId];

          console.log('[capture-contextmenu] selectedNodeIds:', selectedNodeIds, 'targetIds:', targetIds);

          const menuWidth = 200;
          const menuHeight = targetIds.length > 1 ? 260 : 240;
          const { clientX, clientY } = e;
          setMenu({
            ids: targetIds,
            top: clientY < window.innerHeight - menuHeight ? clientY : undefined,
            left: clientX < window.innerWidth - menuWidth ? clientX : undefined,
            right: clientX >= window.innerWidth - menuWidth ? window.innerWidth - clientX : undefined,
            bottom: clientY >= window.innerHeight - menuHeight ? window.innerHeight - clientY : undefined,
          });
        }
      }
    };

    wrapper.addEventListener('contextmenu', handleContextMenu, true);
    return () => wrapper.removeEventListener('contextmenu', handleContextMenu, true);
  }, [setMenu]);

  // 🔍 KEYBOARD SHORTCUTS: "S" to open search, "N" to insert a sticky note (cardboard) when no node is selected
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      const storeState = useWorkflowStore.getState();
      const uiState = useUIStore.getState();
      const currentNodes = storeState.nodes;
      const currentSelectedNodeId = uiState.selectedNodeId;
      const currentSearchOpen = uiState.searchOpen;

      // Undo/Redo Shortcuts
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl) {
        if (e.key === "z" || e.key === "Z") {
          e.preventDefault();
          if (e.shiftKey) {
            storeState.redo();
          } else {
            storeState.undo();
          }
          return;
        } else if (e.key === "y" || e.key === "Y") {
          e.preventDefault();
          storeState.redo();
          return;
        } else if (e.key === "g" || e.key === "G") {
          e.preventDefault();
          if (e.shiftKey) {
            const selectedGroupNode = currentNodes.find(n => n.id === currentSelectedNodeId && n.data?.type === 'group');
            if (selectedGroupNode) {
              storeState.ungroupNode(selectedGroupNode.id);
            }
          } else {
            const selectedNodeIds = currentNodes.filter(n => n.selected).map(n => n.id);
            if (selectedNodeIds.length >= 2) {
              storeState.groupNodes(selectedNodeIds);
            }
          }
          return;
        }
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        const currentEdges = storeState.edges;
        const selectedNodes = currentNodes.filter(n => n.selected);
        const selectedEdges = currentEdges.filter(e => e.selected);

        const hasSelectedNodes = selectedNodes.length > 0;
        const hasSelectedEdges = selectedEdges.length > 0;

        if (hasSelectedNodes || hasSelectedEdges) {
          e.preventDefault();
          storeState.takeHistorySnapshot();

          let nextNodes = currentNodes;
          let nextEdges = currentEdges;

          if (hasSelectedNodes) {
            const nodeIdsToDelete = selectedNodes
              .filter(n => n.id !== '__start__' && n.id !== '__end__')
              .map(n => n.id);

            if (nodeIdsToDelete.length > 0) {
              nextNodes = currentNodes.filter(n => !nodeIdsToDelete.includes(n.id));
              nextEdges = nextEdges.filter(edge => !nodeIdsToDelete.includes(edge.source) && !nodeIdsToDelete.includes(edge.target));
              
              if (nodeIdsToDelete.includes(currentSelectedNodeId)) {
                uiState.setSelectedNode(null);
              }
            }
          }

          if (hasSelectedEdges) {
            const edgeIdsToDelete = selectedEdges.map(edge => edge.id);
            nextEdges = nextEdges.filter(edge => !edgeIdsToDelete.includes(edge.id));
            
            if (edgeIdsToDelete.includes(uiState.selectedEdgeId)) {
              uiState.setSelectedEdge(null);
            }
          }

          storeState.setNodesDirty(nextNodes);
          storeState.setEdgesDirty(nextEdges);
        }
      }

      if ((e.key === "s" || e.key === "S") && !currentSelectedNodeId && !currentSearchOpen) {
        e.preventDefault();
        uiState.setSearchOpen(true);
      }

      if ((e.key === "n" || e.key === "N") && !currentSelectedNodeId) {
        e.preventDefault();
        // Calculate center of canvas viewport
        let position;
        if (reactFlowInstance && reactFlowWrapper.current) {
          const bounds = reactFlowWrapper.current.getBoundingClientRect();
          position = reactFlowInstance.screenToFlowPosition({
            x: bounds.left + bounds.width / 2,
            y: bounds.top + bounds.height / 2,
          });
        } else {
          position = {
            x: 200 + Math.random() * 300,
            y: 100 + Math.random() * 200,
          };
        }
        storeState.addNode("cardboard", position);
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [reactFlowInstance]);

  const handleSearchSelectNode = useCallback(
    (type) => {
      setSearchOpen(false);

      let position;
      let connected = false;

      if (suggestionSource) {
        const sourceNode = nodes.find((n) => n.id === suggestionSource.nodeId);
        if (sourceNode) {
          // Spawn offset to the right of the source node
          position = {
            x: sourceNode.position.x + 240,
            y: sourceNode.position.y,
          };

          const newNodeId = addNode(type, position);
          if (newNodeId) {
            const edgeType =
              canvasWireStyle === "curve" ? "default" : "smoothstep";
            setEdgesDirty(
              addEdge(
                {
                  source: suggestionSource.nodeId,
                  target: newNodeId,
                  sourceHandle: suggestionSource.handleId,
                  targetHandle: null,
                  animated: false,
                  type: edgeType,
                  style: { stroke: "#CBD5E1", strokeWidth: 1.5 },
                },
                edges,
              ),
            );
          }
          connected = true;
        }
      }

      if (!connected) {
        // Calculate center of canvas viewport
        if (reactFlowInstance && reactFlowWrapper.current) {
          const bounds = reactFlowWrapper.current.getBoundingClientRect();
          position = reactFlowInstance.screenToFlowPosition({
            x: bounds.left + bounds.width / 2,
            y: bounds.top + bounds.height / 2,
          });
        } else {
          position = {
            x: 200 + Math.random() * 300,
            y: 100 + Math.random() * 200,
          };
        }
        addNode(type, position);
      }

      setSuggestionSource(null);
    },
    [
      reactFlowInstance,
      addNode,
      suggestionSource,
      nodes,
      edges,
      setEdgesDirty,
      canvasWireStyle,
      setSuggestionSource,
      setSearchOpen,
    ],
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        overflow: "hidden",
        background: "var(--bg-canvas)",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
      }}
    >
      {/* ── Left Palette Panel (Now on the left) ── */}
      {paletteOpen && !selectedNodeId && (
        <div
          style={{
            width: 260,
            borderRight: "1px solid var(--border)",
            background: "white",
            flexShrink: 0,
            overflow: "hidden",
            animation: "paletteIn 0.2s ease-out",
          }}
        >
          <NodePalette onClose={() => setPaletteOpen(false)} />
        </div>
      )}

      {/* ── Canvas ── */}
      <div ref={reactFlowWrapper} style={{ flex: 1, position: "relative" }}>
        {previewingGroupId && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1.5px solid var(--theme-primary, #8e77bb)',
            borderRadius: '12px',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 10px 30px rgba(142, 119, 187, 0.15)',
            fontFamily: "'Inter', sans-serif"
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--theme-primary, #8e77bb)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Preview Mode
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                Editing "{previewGroupOriginalNode?.data?.label || 'Group'}" internal nodes
              </span>
            </div>
            <button
              onClick={() => exitGroupPreview(true)}
              style={{
                padding: '6px 14px',
                background: 'var(--theme-primary, #8e77bb)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(142, 119, 187, 0.2)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--theme-primary-hover, #7961a8)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--theme-primary, #8e77bb)'}
            >
              Regroup Node
            </button>
          </div>
        )}
        {/* Top-left: Add node toggle */}
        <div style={{ position: "absolute", top: 16, left: 16, zIndex: 10 }}>
          <button
            onClick={() => {
              setPaletteOpen((v) => !v);
              setSelectedNode(null);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px",
              background: paletteOpen
                ? "var(--theme-primary-glow)"
                : "var(--bg-secondary, white)",
              border: paletteOpen
                ? "1px solid var(--theme-primary)"
                : "1px solid var(--border)",
              borderRadius: 12,
              color: paletteOpen
                ? "var(--theme-primary)"
                : "var(--text-primary)",
              cursor: "pointer",
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              width: 44,
              height: 44,
            }}
            title={paletteOpen ? "Close Library" : "Add node"}
          >
            {paletteOpen ? (
              <FiArrowLeftCircle size={22} />
            ) : (
              <FiPlus size={22} />
            )}
          </button>
        </div>

        {/* Top-right: Run toggle */}
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 10,
            display: "flex",
            gap: 10,
          }}
        >
          <button
            onClick={() => setShowPilotPanel(!showPilotPanel)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px",
              background: showPilotPanel
                ? "var(--theme-primary-glow)"
                : "var(--bg-secondary, white)",
              border: showPilotPanel
                ? "1px solid var(--theme-primary)"
                : "1px solid var(--border)",
              borderRadius: 12,
              color: showPilotPanel
                ? "var(--theme-primary)"
                : "var(--text-primary)",
              cursor: "pointer",
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.15s",
              width: 44,
              height: 44,
            }}
            title="Pilot Console"
          >
            <FiCompass size={20} />
          </button>

          <button
            onClick={() =>
              useVariablesStore
                .getState()
                .setShowVariablesPanel(
                  !useVariablesStore.getState().showVariablesPanel,
                )
            }
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px",
              background: useVariablesStore((s) => s.showVariablesPanel)
                ? "var(--theme-primary-glow)"
                : "var(--bg-secondary, white)",
              border: useVariablesStore((s) => s.showVariablesPanel)
                ? "1px solid var(--theme-primary)"
                : "1px solid var(--border)",
              borderRadius: 12,
              color: useVariablesStore((s) => s.showVariablesPanel)
                ? "var(--theme-primary)"
                : "var(--text-primary)",
              cursor: "pointer",
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.15s",
              width: 44,
              height: 44,
            }}
            title="Workflow Variables"
          >
            <FiSliders size={20} />
          </button>

          <button
            onClick={() =>
              useUIStore
                .getState()
                .setShowVariableExplorer(
                  !useUIStore.getState().showVariableExplorer,
                )
            }
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px",
              background: useUIStore((s) => s.showVariableExplorer)
                ? "var(--theme-primary-glow)"
                : "var(--bg-secondary, white)",
              border: useUIStore((s) => s.showVariableExplorer)
                ? "1px solid var(--theme-primary)"
                : "1px solid var(--border)",
              borderRadius: 12,
              color: useUIStore((s) => s.showVariableExplorer)
                ? "var(--theme-primary)"
                : "var(--text-primary)",
              cursor: "pointer",
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.15s",
              width: 44,
              height: 44,
            }}
            title="Data Explorer"
          >
            <FiDatabase size={20} />
          </button>

          <button
            onClick={() => hasNodes && setRunOpen(true)}
            disabled={!hasNodes}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px",
              background: hasNodes
                ? "var(--theme-primary-glow)"
                : "var(--border-light, #E5E7EB)",
              border: hasNodes
                ? "1px solid var(--theme-primary-glow)"
                : "1px solid var(--border-light, #E5E7EB)",
              borderRadius: 12,
              color: hasNodes
                ? "var(--theme-primary)"
                : "var(--text-muted, #9CA3AF)",
              cursor: hasNodes ? "pointer" : "not-allowed",
              boxShadow: hasNodes
                ? "0 2px 8px rgba(142, 119, 187, 0.1)"
                : "none",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              width: 44,
              height: 44,
              opacity: hasNodes ? 1 : 0.7,
            }}
            title="Run Workflow"
            onMouseEnter={(e) => {
              if (hasNodes) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.background = "var(--theme-primary)";
                e.currentTarget.style.color = "white";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(142, 119, 187, 0.25)";
              }
            }}
            onMouseLeave={(e) => {
              if (hasNodes) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.background = "var(--theme-primary-glow)";
                e.currentTarget.style.color = "var(--theme-primary)";
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(142, 119, 187, 0.1)";
              }
            }}
          >
            <FiPlay size={20} fill="currentColor" />
          </button>
        </div>

        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={renderedEdges}
            selectionKeyCode="Control"
            onNodesChange={(changes) => {
              // Prevent start and end nodes from being deleted
              const filteredChanges = changes.filter(
                (c) =>
                  !(
                    c.type === "remove" &&
                    (c.id === "__start__" || c.id === "__end__")
                  ),
              );
              const isDelete = filteredChanges.some((c) => c.type === "remove");
              if (isDelete) {
                useWorkflowStore.getState().takeHistorySnapshot();
              }
              let hasDirtyChange = false;
              let hasDimensionsChange = false;

              // Check changes to see if a cardboard node is being manually resized
              filteredChanges.forEach((change) => {
                if (change.type === "dimensions" && change.dimensions) {
                  const node = nodes.find((n) => n.id === change.id);
                  if (
                    node &&
                    (node.type === "cardboardNode" ||
                      node.data?.type === "cardboard")
                  ) {
                    const currentWidth = node.style?.width;
                    const currentHeight = node.style?.height;
                    const newWidth = change.dimensions.width;
                    const newHeight = change.dimensions.height;

                    if (
                      newWidth !== undefined &&
                      newHeight !== undefined &&
                      (newWidth !== currentWidth || newHeight !== currentHeight)
                    ) {
                      hasDirtyChange = true;
                      hasDimensionsChange = true;
                    }
                  }
                } else if (!NON_DIRTY_CHANGE_TYPES.has(change.type)) {
                  hasDirtyChange = true;
                }
              });

              let updated = applyNodeChanges(filteredChanges, nodes);

              if (hasDimensionsChange) {
                // Sync cardboard node dimensions to style width/height so it's persisted correctly
                updated = updated.map((node) => {
                  if (
                    node.type === "cardboardNode" ||
                    node.data?.type === "cardboard"
                  ) {
                    const width = node.width ?? node.measured?.width;
                    const height = node.height ?? node.measured?.height;
                    if (width !== undefined && height !== undefined) {
                      return {
                        ...node,
                        style: {
                          ...node.style,
                          width,
                          height,
                        },
                      };
                    }
                  }
                  return node;
                });
              }

              if (hasDirtyChange) {
                setNodesDirty(updated);
              } else {
                setNodes(updated);
              }
            }}
            onEdgesChange={(changes) => {
              const isDelete = changes.some((c) => c.type === "remove");
              if (isDelete) {
                useWorkflowStore.getState().takeHistorySnapshot();
              }
              const updated = applyEdgeChanges(changes, edges);
              const hasDirtyChange = changes.some((c) => c.type !== "select");
              if (hasDirtyChange) {
                setEdgesDirty(updated);
              } else {
                setEdges(updated);
              }
            }}
            onConnect={onConnect}
            onNodesDelete={onNodesDelete}
            isValidConnection={isValidConnection}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onNodeDragStart={onNodeDragStart}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={onNodeClick}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeClick={onEdgeClick}
            onPaneClick={() => {
              onPaneClick();
              onPaneClickCloseMenu();
            }}
            onPaneContextMenu={onPaneContextMenu}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{
              type: canvasWireStyle === "curve" ? "default" : "smoothstep",
              animated: false,
              style: { stroke: "#CBD5E1", strokeWidth: canvasEdgeWidth },
            }}
            fitView
            fitViewOptions={{ padding: 0.4 }}
            snapToGrid={canvasSnapGrid > 0}
            snapGrid={canvasSnapGrid > 0 ? [canvasSnapGrid, canvasSnapGrid] : [20, 20]}
            connectionRadius={canvasConnectionRadius}
            deleteKeyCode={["Backspace", "Delete"]}
            className={isDarkCanvas ? "is-dark-theme" : ""}
            style={{ background: isDarkCanvas ? "#1D1D1F" : "#F8F9FB" }}
          >
            {canvasBackgroundStyle !== "clean" && (
              <Background
                key={`${canvasBackgroundStyle}-${canvasDotSize}`}
                variant={canvasBackgroundStyle}
                gap={20}
                size={
                  canvasBackgroundStyle === "cross"
                    ? canvasDotSize * 4
                    : canvasBackgroundStyle === "dots"
                      ? canvasDotSize
                      : undefined
                }
                lineWidth={
                  canvasBackgroundStyle === "lines" ? canvasDotSize : undefined
                }
                color={isDarkCanvas ? "#4C4B53" : "#CBD5E1"}
              />
            )}
            <Controls />
            <MiniMap
              nodeColor={(n) => {
                const colors = {
                  llm_agent: "#C9DEFF",
                  tool_node: "#FFE4B8",
                  router: "#E5D9FF",
                  supervisor: "#C9F5E0",
                  swarm: "#FFD9EE",
                  rag_node: "#FFF3B8",
                  subgraph: "#C9F5F5",
                  textToAudio: "#FFE4E1",
                  api_node: "#E0F2FE",
                  cardboard: "#CBD5E1",
                };
                return colors[n.data?.type] || "#E8E8E5";
              }}
              maskColor={
                isDarkCanvas
                  ? "rgba(15, 23, 42, 0.7)"
                  : "rgba(248, 249, 251, 0.7)"
              }
              style={{
                borderRadius: 10,
                border: isDarkCanvas
                  ? "1px solid #334155"
                  : "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
                background: isDarkCanvas ? "#1E293B" : "white",
              }}
            />
          </ReactFlow>

          {menu && (
            <ContextMenu
              onClick={onPaneClickCloseMenu}
              onMouseLeave={onPaneClickCloseMenu}
              {...menu}
            />
          )}

          {searchOpen && (
            <NodeSearch
              onClose={() => setSearchOpen(false)}
              onSelect={handleSearchSelectNode}
            />
          )}

          {/* Empty state */}
          {nodes.length === 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "white",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "var(--shadow-sm)",
                  color: "#9898A6",
                }}
              >
                <FiGitBranch size={24} strokeWidth={1.5} />
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                {workflowName}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  maxWidth: 320,
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                Click the{" "}
                <strong style={{ color: "var(--text-primary)" }}>+ icon</strong>{" "}
                on the top left to start building your AI system.
              </div>
            </div>
          )}
        </ReactFlowProvider>
      </div>

      {/* ── Right side panels ── */}
      <AnimatePresence>
        {(selectedNodeId || selectedEdgeId) && (
          <motion.div
            key="properties-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: propertiesWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={
              isResizingProperties
                ? { duration: 0 }
                : { duration: 0.2, ease: "easeOut" }
            }
            style={{
              borderLeft: "1px solid var(--border)",
              background: "white",
              flexShrink: 0,
              overflow: "hidden",
              height: "100%",
              position: "relative",
            }}
          >
            {/* Resizable drag handle on the left edge */}
            <div
              onMouseDown={startResizingProperties}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "6px",
                cursor: "col-resize",
                zIndex: 100,
                background: isResizingProperties
                  ? "var(--theme-primary, #4285F4)"
                  : "transparent",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isResizingProperties)
                  e.currentTarget.style.background = "rgba(66, 133, 244, 0.3)";
              }}
              onMouseLeave={(e) => {
                if (!isResizingProperties)
                  e.currentTarget.style.background = "transparent";
              }}
            />
            <PropertiesPanel />
          </motion.div>
        )}

        {useUIStore((s) => s.showVariableExplorer) && (
          <motion.div
            key="variable-explorer"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: explorerWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={
              isResizingExplorer
                ? { duration: 0 }
                : { duration: 0.2, ease: "easeOut" }
            }
            style={{
              borderLeft: "1px solid var(--border)",
              background: "white",
              flexShrink: 0,
              overflow: "hidden",
              height: "100%",
              position: "relative",
            }}
          >
            {/* Resizable drag handle on the left edge */}
            <div
              onMouseDown={startResizingExplorer}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "6px",
                cursor: "col-resize",
                zIndex: 100,
                background: isResizingExplorer
                  ? "var(--theme-primary, #4285F4)"
                  : "transparent",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isResizingExplorer)
                  e.currentTarget.style.background = "rgba(66, 133, 244, 0.3)";
              }}
              onMouseLeave={(e) => {
                if (!isResizingExplorer)
                  e.currentTarget.style.background = "transparent";
              }}
            />
            <VariableExplorer
              onClose={() =>
                useUIStore.getState().setShowVariableExplorer(false)
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {showPilotPanel && (
        <PilotPanel onClose={() => setShowPilotPanel(false)} />
      )}

      <style>{`
        .react-flow__selection {
          background: rgba(142, 119, 187, 0.06) !important;
          border: 1.5px dashed var(--theme-primary, #8e77bb) !important;
          border-radius: 6px !important;
          box-shadow: 0 0 10px rgba(142, 119, 187, 0.15) !important;
        }
        @keyframes paletteIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(30px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
