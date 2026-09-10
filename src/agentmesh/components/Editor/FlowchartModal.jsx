import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiX, FiPlus, FiMinus, FiRotateCcw, FiRotateCw, FiDownload, FiUpload,
  FiTrash2, FiSave, FiGrid, FiMousePointer, FiType, FiArrowRight,
  FiMaximize2, FiMinimize2, FiCheck, FiSquare, FiCircle, FiCopy,
  FiCornerDownRight, FiSliders, FiLayout, FiEdit3, FiFileText, FiLayers,
  FiCpu, FiZap, FiLoader, FiChevronDown, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { HugeiconsIcon } from '@hugeicons/react';
import { AiMagicIcon } from '@hugeicons/core-free-icons';
import { useUIStore, useWorkflowStore } from '../../store';
import { chatArchitect } from '../../api/agentmesh';
import { getArchitectSecret } from '../../utils/architectSecretStore';

// Shape Types definition with Heading and Text Block
const SHAPE_TYPES = [
  { type: 'process', label: 'Process', icon: '▭', desc: 'Action or step', width: 140, height: 70, shapeStyle: 'rect' },
  { type: 'decision', label: 'Decision', icon: '◇', desc: 'Conditional branch', width: 140, height: 80, shapeStyle: 'diamond' },
  { type: 'startEnd', label: 'Start / End', icon: '⬏', desc: 'Entry or termination', width: 130, height: 60, shapeStyle: 'capsule' },
  { type: 'inputOutput', label: 'Input / Output', icon: '▰', desc: 'Data input/output', width: 140, height: 65, shapeStyle: 'parallelogram' },
  { type: 'database', label: 'Database', icon: '⬟', desc: 'Data storage', width: 130, height: 80, shapeStyle: 'cylinder' },
  { type: 'document', label: 'Document', icon: '📄', desc: 'File or report', width: 140, height: 75, shapeStyle: 'document' },
  { type: 'connector', label: 'Connector', icon: '○', desc: 'Jump point', width: 60, height: 60, shapeStyle: 'circle' },
  { type: 'sticky', label: 'Sticky Note', icon: '📝', desc: 'Annotation note', width: 150, height: 100, shapeStyle: 'sticky' },
  { type: 'heading', label: 'Heading', icon: 'H1', desc: 'Section Heading', width: 220, height: 48, shapeStyle: 'heading' },
  { type: 'text', label: 'Text Block', icon: '¶', desc: 'Freeform text', width: 180, height: 40, shapeStyle: 'text' }
];

// Modern Theme Preset Colors
const COLOR_PRESETS = [
  { fill: '#EFF6FF', stroke: '#3B82F6', text: '#1E3A8A', name: 'Blue' },
  { fill: '#ECFDF5', stroke: '#10B981', text: '#064E3B', name: 'Emerald' },
  { fill: '#FEF3C7', stroke: '#F59E0B', text: '#78350F', name: 'Amber' },
  { fill: '#FEE2E2', stroke: '#EF4444', text: '#7F1D1D', name: 'Red' },
  { fill: '#F3E8FF', stroke: '#A855F7', text: '#581C87', name: 'Purple' },
  { fill: '#F8FAFC', stroke: '#64748B', text: '#0F172A', name: 'Slate' },
  { fill: '#FEF9C3', stroke: '#EAB308', text: '#713F12', name: 'Sticky Yellow' },
  { fill: 'transparent', stroke: 'transparent', text: '#0F172A', name: 'Transparent' }
];

// Helper: Calculate Port Anchor Coordinates
const getPortCoordinates = (node, port) => {
  if (!node) return { x: 0, y: 0 };
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  switch (port) {
    case 'top': return { x: cx, y: node.y };
    case 'right': return { x: node.x + node.width, y: cy };
    case 'bottom': return { x: cx, y: node.y + node.height };
    case 'left': return { x: node.x, y: cy };
    default: return { x: cx, y: cy };
  }
};

// Helper: Auto-Fit Node Size based on text length and font size
const getAutoFitSize = (label, fontSize = 13, minW = 120, minH = 50, currentW = 140, currentH = 70) => {
  const lines = (label || '').split('\n');
  const maxLineChars = Math.max(...lines.map(l => l.length), 1);
  const charWidth = fontSize * 0.65;
  const calculatedW = Math.max(minW, Math.ceil(maxLineChars * charWidth + 32));
  const calculatedH = Math.max(minH, Math.ceil(lines.length * fontSize * 1.5 + 24));

  return {
    width: Math.max(currentW, calculatedW),
    height: Math.max(currentH, calculatedH)
  };
};

// Helper: Build Path String for Connection Lines
const buildPathString = (conn, nodesList) => {
  const fromNode = nodesList.find(n => n.id === conn.from);
  const toNode = nodesList.find(n => n.id === conn.to);
  if (!fromNode || !toNode) return '';

  const start = getPortCoordinates(fromNode, conn.fromPort);
  const end = getPortCoordinates(toNode, conn.toPort);

  if (conn.type === 'straight') {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  } else if (conn.type === 'curved') {
    const dx = Math.abs(end.x - start.x) / 2;
    return `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;
  } else {
    // Orthogonal Step
    const midY = (start.y + end.y) / 2;
    const midX = (start.x + end.x) / 2;
    if (conn.fromPort === 'bottom' && conn.toPort === 'top') {
      return `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
    } else if (conn.fromPort === 'right' && conn.toPort === 'left') {
      return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
    } else {
      return `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
    }
  }
};

export default function FlowchartModal() {
  const { showFlowchart, toggleFlowchart } = useUIStore();
  const currentWorkflow = useWorkflowStore(s => s.currentWorkflow);
  const workflowId = currentWorkflow?.id || 'default_workflow';

  // Core Flowchart State
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [selectedConnId, setSelectedConnId] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editingConnId, setEditingConnId] = useState(null);

  // Inspector Panel Collapse & Actions Menu State
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showArchitectDrawer, setShowArchitectDrawer] = useState(false);
  const [architectTab, setArchitectTab] = useState('meshCanvas');
  const [promptInput, setPromptInput] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);

  // Tool Mode & Quick Modifier Override State ('select' | 'connect' | 'pan')
  const [activeTool, setActiveTool] = useState('select');
  const previousToolRef = useRef('select');

  // Keep track of user's explicitly selected tool mode
  const setBaseActiveTool = (tool) => {
    previousToolRef.current = tool;
    setActiveTool(tool);
  };

  // History Stack for Undo/Redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Canvas Viewport State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dragging / Resizing Node state
  const [connectingStart, setConnectingStart] = useState(null);
  const [tempConnectionEnd, setTempConnectionEnd] = useState(null);
  const [draggingNodes, setDraggingNodes] = useState(null);
  const [resizingNode, setResizingNode] = useState(null);

  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // Save state snapshot to History Stack
  const pushState = useCallback((newNodes, newConnections) => {
    const newState = { nodes: newNodes, connections: newConnections };
    setHistory(prev => {
      const updated = prev.slice(0, historyIndex + 1);
      return [...updated, newState];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Clear Entire Canvas Handler
  const handleClearCanvas = () => {
    if (window.confirm("Are you sure you want to clear all elements from the flowchart canvas?")) {
      setNodes([]);
      setConnections([]);
      setSelectedNodeIds([]);
      setSelectedConnId(null);
      pushState([], []);
    }
  };

  // Initial Load from LocalStorage or default starter graph
  useEffect(() => {
    if (showFlowchart) {
      const saved = localStorage.getItem(`agentmesh_flowchart_${workflowId}`);
      if (saved !== null) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.nodes) && Array.isArray(parsed.connections)) {
            setNodes(parsed.nodes);
            setConnections(parsed.connections);
            setHistory([{ nodes: parsed.nodes, connections: parsed.connections }]);
            setHistoryIndex(0);
            return;
          }
        } catch (e) {
          console.error("Failed to parse saved flowchart:", e);
        }
      }
      // Default Starter Flowchart
      const starterNodes = [
        { id: 'node_head', type: 'heading', label: 'Workflow Architecture', x: 210, y: 20, width: 240, height: 40, fill: 'transparent', stroke: 'transparent', textColor: '#0F172A', fontSize: 20, fontWeight: 700 },
        { id: 'node_start', type: 'startEnd', label: 'Start Process', x: 250, y: 80, width: 140, height: 60, fill: '#ECFDF5', stroke: '#10B981', textColor: '#064E3B', fontSize: 13, fontWeight: 600 },
        { id: 'node_proc1', type: 'process', label: 'Validate Input Data', x: 250, y: 200, width: 160, height: 70, fill: '#EFF6FF', stroke: '#3B82F6', textColor: '#1E3A8A', fontSize: 13, fontWeight: 600 },
        { id: 'node_dec1', type: 'decision', label: 'Is Input Valid?', x: 250, y: 330, width: 160, height: 90, fill: '#FEF3C7', stroke: '#F59E0B', textColor: '#78350F', fontSize: 13, fontWeight: 600 },
        { id: 'node_end', type: 'startEnd', label: 'End Process', x: 250, y: 490, width: 140, height: 60, fill: '#FEE2E2', stroke: '#EF4444', textColor: '#7F1D1D', fontSize: 13, fontWeight: 600 }
      ];
      const starterConns = [
        { id: 'conn_1', from: 'node_start', fromPort: 'bottom', to: 'node_proc1', toPort: 'top', label: 'Trigger Event', type: 'orthogonal', color: '#64748B' },
        { id: 'conn_2', from: 'node_proc1', fromPort: 'bottom', to: 'node_dec1', toPort: 'top', label: 'Payload Passed', type: 'orthogonal', color: '#64748B' },
        { id: 'conn_3', from: 'node_dec1', fromPort: 'bottom', to: 'node_end', toPort: 'top', label: 'Yes (Valid)', type: 'orthogonal', color: '#10B981' }
      ];
      setNodes(starterNodes);
      setConnections(starterConns);
      setHistory([{ nodes: starterNodes, connections: starterConns }]);
      setHistoryIndex(0);
    }
  }, [showFlowchart, workflowId]);

  // Auto-Save when nodes or connections change (Always persists canvas edits, deletions, and clear state)
  useEffect(() => {
    if (showFlowchart) {
      localStorage.setItem(`agentmesh_flowchart_${workflowId}`, JSON.stringify({ nodes, connections }));
    }
  }, [nodes, connections, workflowId, showFlowchart]);

  // Option 1: Generate Flowchart from AgentMesh Canvas Flow
  const handleGenerateFromMeshCanvas = () => {
    const meshNodes = useWorkflowStore.getState().nodes || [];
    const meshEdges = useWorkflowStore.getState().edges || [];

    if (!meshNodes.length) {
      alert("No nodes found in your current AgentMesh workflow canvas.");
      return;
    }

    const generatedNodes = [];
    const generatedConns = [];

    const startY = 80;
    const spacingY = 120;
    const startX = 250;

    meshNodes.forEach((mn, idx) => {
      const fcId = `fc_${mn.id}`;
      const isNote = mn.type === 'note' || mn.type === 'sticky' || mn.data?.type === 'note' || mn.data?.type === 'sticky' || (mn.data?.label || mn.data?.name || '').toLowerCase().includes('note') || (mn.data?.label || mn.data?.name || '').toLowerCase().includes('sticky');
      
      let label = mn.data?.label || mn.data?.name || mn.data?.text || mn.data?.notes || mn.data?.content || mn.data?.description || mn.type || `Node ${idx + 1}`;
      if (isNote) {
        label = mn.data?.text || mn.data?.notes || mn.data?.content || mn.data?.description || mn.data?.label || mn.data?.name || 'Sticky Note';
      }

      let shapeType = 'process';
      let fill = '#EFF6FF';
      let stroke = '#3B82F6';
      let textColor = '#1E3A8A';

      if (mn.id === '__start__' || mn.data?.type === 'start' || idx === 0) {
        shapeType = 'startEnd';
        fill = '#ECFDF5';
        stroke = '#10B981';
        textColor = '#064E3B';
      } else if (mn.id === '__end__' || mn.data?.type === 'end' || idx === meshNodes.length - 1) {
        shapeType = 'startEnd';
        fill = '#FEE2E2';
        stroke = '#EF4444';
        textColor = '#7F1D1D';
      } else if (mn.type === 'router' || mn.type === 'evaluator' || mn.type === 'decision' || mn.data?.type === 'router') {
        shapeType = 'decision';
        fill = '#FEF3C7';
        stroke = '#F59E0B';
        textColor = '#78350F';
      } else if (mn.type === 'rag' || mn.type === 'database') {
        shapeType = 'database';
        fill = '#F3E8FF';
        stroke = '#A855F7';
        textColor = '#581C87';
      } else if (isNote) {
        shapeType = 'sticky';
        fill = '#FEF9C3';
        stroke = '#EAB308';
        textColor = '#713F12';
      }

      const shapeDef = SHAPE_TYPES.find(s => s.type === shapeType) || SHAPE_TYPES[0];
      const autoSize = getAutoFitSize(label, 13, shapeDef.width, shapeDef.height, shapeDef.width, shapeDef.height);

      generatedNodes.push({
        id: fcId,
        type: shapeType,
        label,
        x: mn.position?.x ? Math.round(mn.position.x * 0.8) + 100 : startX,
        y: mn.position?.y ? Math.round(mn.position.y * 0.8) + 80 : startY + (idx * spacingY),
        width: autoSize.width,
        height: autoSize.height,
        fill,
        stroke,
        textColor,
        fontSize: 13,
        fontWeight: 600
      });
    });

    // Map mesh edges to Flowchart connections with Smart Directional Anchor Ports
    meshEdges.forEach((e, idx) => {
      const srcNode = generatedNodes.find(n => n.id === `fc_${e.source}`);
      const tgtNode = generatedNodes.find(n => n.id === `fc_${e.target}`);

      let fromPort = 'bottom';
      let toPort = 'top';

      if (srcNode && tgtNode) {
        const srcCX = srcNode.x + srcNode.width / 2;
        const srcCY = srcNode.y + srcNode.height / 2;
        const tgtCX = tgtNode.x + tgtNode.width / 2;
        const tgtCY = tgtNode.y + tgtNode.height / 2;

        const dx = tgtCX - srcCX;
        const dy = tgtCY - srcCY;

        if (Math.abs(dx) > Math.abs(dy)) {
          fromPort = dx > 0 ? 'right' : 'left';
          toPort = dx > 0 ? 'left' : 'right';
        } else {
          fromPort = dy > 0 ? 'bottom' : 'top';
          toPort = dy > 0 ? 'top' : 'bottom';
        }
      }

      generatedConns.push({
        id: `conn_mesh_${idx}_${Date.now()}`,
        from: `fc_${e.source}`,
        fromPort,
        to: `fc_${e.target}`,
        toPort,
        label: e.label || e.data?.condition || e.data?.label || '',
        type: 'orthogonal',
        color: '#64748B'
      });
    });

    setNodes(generatedNodes);
    setConnections(generatedConns);
    pushState(generatedNodes, generatedConns);
    setShowArchitectDrawer(false);
  };

  // Option 2: Smart Context-Aware AI Architect
  const handleGenerateFromPrompt = async () => {
    if (!promptInput.trim()) return;

    // Check for off-topic non-workflow prompts
    const lowerInput = promptInput.trim().toLowerCase();
    const workflowKeywords = [
      'flow', 'process', 'step', 'workflow', 'pipeline', 'verification',
      'system', 'architecture', 'logic', 'diagram', 'action', 'task',
      'user', 'data', 'check', 'validate', 'order', 'login', 'signup',
      'auth', 'payment', 'api', 'event', 'trigger', 'request', 'approval',
      'decision', 'branch', 'loop', 'status', 'start', 'end', 'connect',
      '->', '-->', '=>', 'then', 'after', 'next', 'first', 'finally'
    ];
    const isOffTopic = (
      /^what(?:'s|\s+is)\s+(?:the\s+)?color/i.test(lowerInput) ||
      /^what(?:'s|\s+is)\s+(?:the\s+)?capital/i.test(lowerInput) ||
      /^who\s+(?:is|was)/i.test(lowerInput) ||
      /^tell\s+me\s+a\s+joke/i.test(lowerInput) ||
      /^(?:hi|hello|hey|greetings|howdy|sup)\b/i.test(lowerInput) ||
      /^how\s+are\s+you/i.test(lowerInput) ||
      (/^what|^why|^who|^how/i.test(lowerInput) && !workflowKeywords.some(kw => lowerInput.includes(kw)) && !promptInput.includes('\n') && !promptInput.includes('->'))
    );

    if (isOffTopic) {
      alert("⚠️ Off-Topic Prompt Detected:\n\nThe AI Architect requires a workflow or process description to generate a flowchart diagram (e.g. 'User Login & OTP Verification Flow', 'Order Fulfillment Pipeline', 'KYC Document Approval Process').\n\nPlease enter a process topic instead of general trivia or Q&A.");
      return;
    }

    setGeneratingAi(true);

    try {
      const cachedProvider = localStorage.getItem("architect_provider") || "groq";
      const cachedModel = localStorage.getItem("architect_model") || "llama-3.3-70b-versatile";
      const cachedTemp = localStorage.getItem("architect_temperature") || "0.2";
      const cachedKey = getArchitectSecret();

      const activeLlm = {
        provider: cachedProvider,
        model: cachedModel,
        temperature: Number.parseFloat(cachedTemp),
        api_key_override: cachedKey,
      };

      const currentFlowchartContext = nodes.length > 0 ? {
        existing_flowchart_nodes: nodes.map(n => ({ id: n.id, type: n.type, label: n.label })),
        existing_flowchart_connections: connections.map(c => ({ from: c.from, to: c.to, label: c.label }))
      } : null;

      const meshNodes = useWorkflowStore.getState().nodes || [];
      const meshEdges = useWorkflowStore.getState().edges || [];
      const currentMeshContext = meshNodes.length > 0 ? {
        mesh_workspace_nodes: meshNodes.map(n => ({ id: n.id, type: n.type, label: n.data?.label || n.data?.name })),
        mesh_workspace_edges: meshEdges.map(e => ({ source: e.source, target: e.target, label: e.label }))
      } : null;

      let contextDescription = "";
      if (currentFlowchartContext) {
        contextDescription += `\n[ACTIVE FLOWCHART DIAGRAM CONTEXT]: ${JSON.stringify(currentFlowchartContext)}`;
      }
      if (currentMeshContext) {
        contextDescription += `\n[ACTIVE AGENTMESH CANVASES WORKFLOW CONTEXT]: ${JSON.stringify(currentMeshContext)}`;
      }

      const systemInstruction = `You are the Flowchart Architect AI Agent.
Analyze the user's prompt instruction: "${promptInput}".
If the prompt is an off-topic general question or trivia not related to a workflow, reply strictly with JSON: {"off_topic": true}.

${contextDescription ? contextDescription + '\nIntelligently integrate, extend, or modify the active diagram and mesh context to produce the updated flow.' : 'If no active diagram exists, construct a brand new logical flowchart diagram.'}

Return strictly a JSON array of sequential step strings for the flowchart (e.g. ["Start Process", "Validate ID Document", "Is Document Valid?", "Approve User", "End Process"]). Do NOT include markdown codeblocks or extra text, just valid JSON array format.`;

      const messages = [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: `Generate flowchart step sequence for: ${promptInput}` }
      ];

      let steps = [];
      try {
        const res = await chatArchitect({ id: workflowId, name: currentWorkflow?.name }, {}, messages, activeLlm);
        if (res && res.status === 'success' && res.reply) {
          if (res.reply.includes('"off_topic": true')) {
            alert("⚠️ Off-Topic Question Detected:\n\nPlease ask the AI Architect to generate or modify a workflow process rather than general trivia.");
            setGeneratingAi(false);
            return;
          }
          const jsonMatch = res.reply.match(/\[.*\]/s);
          if (jsonMatch) {
            steps = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (e) {
        console.warn("Architect AI fallback to smart text parsing:", e);
      }

      if (!Array.isArray(steps) || !steps.length) {
        steps = promptInput.split(/(?:\n|->|;|\.)+/).map(l => l.trim().replace(/^[-*0-9.]+\s*/, '')).filter(l => l.length > 2);
      }

      const generatedNodes = [];
      const generatedConns = [];
      const startX = 250;
      let currY = 80;

      steps.forEach((stepText, idx) => {
        const id = `node_ai_${idx}_${Date.now()}`;
        const isFirst = idx === 0;
        const isLast = idx === steps.length - 1;
        const isDecision = stepText.toLowerCase().includes('if') || stepText.toLowerCase().includes('check') || stepText.toLowerCase().includes('decision') || stepText.endsWith('?');

        let type = isFirst || isLast ? 'startEnd' : isDecision ? 'decision' : 'process';
        let fill = isFirst ? '#ECFDF5' : isLast ? '#FEE2E2' : isDecision ? '#FEF3C7' : '#EFF6FF';
        let stroke = isFirst ? '#10B981' : isLast ? '#EF4444' : isDecision ? '#F59E0B' : '#3B82F6';
        let textColor = isFirst ? '#064E3B' : isLast ? '#7F1D1D' : isDecision ? '#78350F' : '#1E3A8A';

        const shapeDef = SHAPE_TYPES.find(s => s.type === type) || SHAPE_TYPES[0];
        const autoSize = getAutoFitSize(stepText, 13, shapeDef.width, shapeDef.height, shapeDef.width, shapeDef.height);

        generatedNodes.push({
          id,
          type,
          label: stepText,
          x: startX,
          y: currY,
          width: autoSize.width,
          height: autoSize.height,
          fill,
          stroke,
          textColor,
          fontSize: 13,
          fontWeight: 600
        });

        if (idx > 0) {
          const prevId = generatedNodes[idx - 1].id;
          generatedConns.push({
            id: `conn_ai_${idx}_${Date.now()}`,
            from: prevId,
            fromPort: 'bottom',
            to: id,
            toPort: 'top',
            label: isDecision ? 'Condition' : '',
            type: 'orthogonal',
            color: '#64748B'
          });
        }

        currY += autoSize.height + 50;
      });

      setNodes(generatedNodes);
      setConnections(generatedConns);
      pushState(generatedNodes, generatedConns);
      setShowArchitectDrawer(false);
      setPromptInput('');
    } catch (err) {
      alert("AI Architect Error: " + err.message);
    } finally {
      setGeneratingAi(false);
    }
  };

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setNodes(prev.nodes);
      setConnections(prev.connections);
      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex, history]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setNodes(next.nodes);
      setConnections(next.connections);
      setHistoryIndex(historyIndex + 1);
    }
  }, [historyIndex, history]);

  // Add Node from Shape library
  const handleAddNode = useCallback((shapeDef) => {
    const id = `node_${Date.now()}`;
    const isHeading = shapeDef.type === 'heading';
    const isText = shapeDef.type === 'text';
    const isSticky = shapeDef.type === 'sticky';

    const newNode = {
      id,
      type: shapeDef.type,
      label: isHeading ? 'Section Heading' : isText ? 'Add text annotation...' : isSticky ? 'Sticky Note:\nAdd notes here...' : shapeDef.label,
      x: 300 - pan.x + (Math.random() * 40 - 20),
      y: 200 - pan.y + (Math.random() * 40 - 20),
      width: shapeDef.width,
      height: shapeDef.height,
      fill: isHeading || isText ? 'transparent' : isSticky ? '#FEF9C3' : '#EFF6FF',
      stroke: isHeading || isText ? 'transparent' : isSticky ? '#EAB308' : '#3B82F6',
      textColor: isHeading ? '#0F172A' : isSticky ? '#713F12' : '#1E3A8A',
      fontSize: isHeading ? 20 : isText ? 14 : 13,
      fontWeight: 700
    };
    setNodes(prev => {
      const nextNodes = [...prev, newNode];
      pushState(nextNodes, connections);
      return nextNodes;
    });
    setSelectedNodeIds([id]);
    setSelectedConnId(null);
  }, [pan, connections, pushState]);

  // Delete Selected Elements
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeIds.length > 0) {
      setNodes(prevNodes => {
        const nextNodes = prevNodes.filter(n => !selectedNodeIds.includes(n.id));
        setConnections(prevConns => {
          const nextConns = prevConns.filter(c => !selectedNodeIds.includes(c.from) && !selectedNodeIds.includes(c.to));
          pushState(nextNodes, nextConns);
          return nextConns;
        });
        return nextNodes;
      });
      setSelectedNodeIds([]);
    } else if (selectedConnId) {
      setConnections(prevConns => {
        const nextConns = prevConns.filter(c => c.id !== selectedConnId);
        pushState(nodes, nextConns);
        return nextConns;
      });
      setSelectedConnId(null);
    }
  }, [selectedNodeIds, selectedConnId, nodes, pushState]);

  // Update Node Text with Auto-Fit Resizing
  const handleUpdateNodeText = (nodeId, text) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const shapeDef = SHAPE_TYPES.find(s => s.type === n.type) || SHAPE_TYPES[0];
        const newSize = getAutoFitSize(text, n.fontSize || 13, shapeDef.width, shapeDef.height, n.width, n.height);
        return {
          ...n,
          label: text,
          width: newSize.width,
          height: newSize.height
        };
      }
      return n;
    }));
  };

  // Keyboard Shortcuts (Tab, +, -, Delete, Escape, Undo/Redo) & Instant Modifier Overrides (Ctrl ➔ Select, Shift ➔ Pan)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showFlowchart) return;
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;

      // Modifier Key Overrides: Ctrl ➔ Select Tool, Shift ➔ Pan Tool
      if (e.key === 'Control' || e.key === 'Meta') {
        setActiveTool('select');
        return;
      }
      if (e.key === 'Shift') {
        setActiveTool('pan');
        return;
      }

      if (e.key === 'Tab' && !isInput) {
        e.preventDefault();
        const nextTool = previousToolRef.current === 'select' ? 'connect' : previousToolRef.current === 'connect' ? 'pan' : 'select';
        setBaseActiveTool(nextTool);
        return;
      }

      if ((e.key === '+' || e.key === '=') && !isInput) {
        e.preventDefault();
        setZoom(z => Math.min(2.5, Number((z + 0.1).toFixed(2))));
        return;
      }

      if ((e.key === '-' || e.key === '_') && !isInput) {
        e.preventDefault();
        setZoom(z => Math.max(0.3, Number((z - 0.1).toFixed(2))));
        return;
      }

      if (isInput) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if (e.key === 'Escape') {
        setSelectedNodeIds([]);
        setSelectedConnId(null);
        setEditingNodeId(null);
        setEditingConnId(null);
        setShowArchitectDrawer(false);
        setShowActionsMenu(false);
        setConnectingStart(null);
        setTempConnectionEnd(null);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };

    const handleKeyUp = (e) => {
      if (!showFlowchart) return;
      if (e.key === 'Control' || e.key === 'Meta' || e.key === 'Shift') {
        setActiveTool(previousToolRef.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [showFlowchart, handleDeleteSelected, handleUndo, handleRedo]);

  // Mouse Handlers
  const handleCanvasMouseDown = (e) => {
    if (e.target === svgRef.current || e.target.tagName === 'svg' || (e.target.tagName === 'rect' && e.target.getAttribute('fill')?.includes('grid'))) {
      if (!e.ctrlKey && !e.metaKey) {
        setSelectedNodeIds([]);
      }
      setSelectedConnId(null);
      setEditingNodeId(null);
      setEditingConnId(null);
      setShowActionsMenu(false);
      if (activeTool === 'pan' || e.button === 1) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (draggingNodes) {
      const dx = (e.clientX - draggingNodes.startX) / zoom;
      const dy = (e.clientY - draggingNodes.startY) / zoom;
      setNodes(prev => prev.map(n => {
        if (draggingNodes.initialPositions[n.id]) {
          const init = draggingNodes.initialPositions[n.id];
          return { ...n, x: Math.round(init.x + dx), y: Math.round(init.y + dy) };
        }
        return n;
      }));
      return;
    }

    if (resizingNode) {
      const dx = (e.clientX - resizingNode.startX) / zoom;
      const dy = (e.clientY - resizingNode.startY) / zoom;
      setNodes(prev => prev.map(n => {
        if (n.id === resizingNode.id) {
          return {
            ...n,
            width: Math.max(40, Math.round(resizingNode.origW + dx)),
            height: Math.max(24, Math.round(resizingNode.origH + dy))
          };
        }
        return n;
      }));
      return;
    }

    if (connectingStart) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      setTempConnectionEnd({ x: mouseX, y: mouseY });
    }
  };

  const handleCanvasMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (draggingNodes) {
      pushState(nodes, connections);
      setDraggingNodes(null);
    }
    if (resizingNode) {
      pushState(nodes, connections);
      setResizingNode(null);
    }
    if (connectingStart) {
      setConnectingStart(null);
      setTempConnectionEnd(null);
    }
  };

  const handlePortMouseDown = (e, nodeId, port) => {
    e.stopPropagation();
    setConnectingStart({ nodeId, port });
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setTempConnectionEnd(getPortCoordinates(node, port));
    }
  };

  const handlePortMouseUp = (e, targetNodeId, targetPort) => {
    e.stopPropagation();
    if (connectingStart && connectingStart.nodeId !== targetNodeId) {
      const newConn = {
        id: `conn_${Date.now()}`,
        from: connectingStart.nodeId,
        fromPort: connectingStart.port,
        to: targetNodeId,
        toPort: targetPort,
        label: '',
        type: 'orthogonal',
        color: '#64748B'
      };
      setConnections(prev => {
        const nextConns = [...prev, newConn];
        pushState(nodes, nextConns);
        return nextConns;
      });
      setSelectedConnId(newConn.id);
      setSelectedNodeIds([]);
    }
    setConnectingStart(null);
    setTempConnectionEnd(null);
  };

  const handleNodeMouseDown = (e, node) => {
    e.stopPropagation();
    if (activeTool === 'connect') return;

    let nextSelectedIds = [];
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      if (selectedNodeIds.includes(node.id)) {
        nextSelectedIds = selectedNodeIds.filter(id => id !== node.id);
      } else {
        nextSelectedIds = [...selectedNodeIds, node.id];
      }
    } else {
      if (selectedNodeIds.includes(node.id)) {
        nextSelectedIds = selectedNodeIds;
      } else {
        nextSelectedIds = [node.id];
      }
    }

    setSelectedNodeIds(nextSelectedIds);
    setSelectedConnId(null);
    setIsPanelCollapsed(false);

    const initialPositions = {};
    nodes.forEach(n => {
      if (nextSelectedIds.includes(n.id)) {
        initialPositions[n.id] = { x: n.x, y: n.y };
      }
    });

    setDraggingNodes({
      startX: e.clientX,
      startY: e.clientY,
      initialPositions
    });
  };

  // Export PNG
  const handleExportPNG = () => {
    if (!nodes.length) {
      alert("Canvas has no elements to export");
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x + n.width > maxX) maxX = n.x + n.width;
      if (n.y + n.height > maxY) maxY = n.y + n.height;
    });

    const padding = 60;
    const contentW = Math.ceil((maxX - minX) + padding * 2);
    const contentH = Math.ceil((maxY - minY) + padding * 2);
    const offsetX = -minX + padding;
    const offsetY = -minY + padding;

    let svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="${contentW}" height="${contentH}" viewBox="0 0 ${contentW} ${contentH}">
      <defs>
        <style>
          text { font-family: Inter, system-ui, sans-serif; }
        </style>
        <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748B" />
        </marker>
      </defs>
      <rect width="100%" height="100%" fill="#FFFFFF" />
      <g transform="translate(${offsetX}, ${offsetY})">`;

    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      if (!fromNode || !toNode) return;
      const pathStr = buildPathString(conn, nodes);
      const midX = (getPortCoordinates(fromNode, conn.fromPort).x + getPortCoordinates(toNode, conn.toPort).x) / 2;
      const midY = (getPortCoordinates(fromNode, conn.fromPort).y + getPortCoordinates(toNode, conn.toPort).y) / 2;

      svgMarkup += `<path d="${pathStr}" fill="none" stroke="${conn.color || '#64748B'}" stroke-width="2" marker-end="url(#arrowhead)" />`;
      if (conn.label) {
        svgMarkup += `<rect x="${midX - 35}" y="${midY - 12}" width="70" height="22" rx="4" fill="white" stroke="#CBD5E1" />`;
        svgMarkup += `<text x="${midX}" y="${midY + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="#334155">${conn.label}</text>`;
      }
    });

    nodes.forEach(node => {
      const shapeDef = SHAPE_TYPES.find(s => s.type === node.type) || SHAPE_TYPES[0];
      const fill = node.fill || '#EFF6FF';
      const stroke = node.stroke || '#3B82F6';
      const textColor = node.textColor || '#1E3A8A';
      const fontSize = node.fontSize || 13;

      svgMarkup += `<g transform="translate(${node.x}, ${node.y})">`;
      if (node.type === 'heading' || node.type === 'text') {
        svgMarkup += `<text x="${node.width / 2}" y="${node.height / 2 + 6}" text-anchor="middle" fill="${textColor}" font-size="${fontSize}" font-weight="${node.fontWeight || 600}">${node.label}</text>`;
      } else if (shapeDef.shapeStyle === 'sticky') {
        const fold = 16;
        svgMarkup += `<polygon points="0,0 ${node.width},0 ${node.width},${node.height - fold} ${node.width - fold},${node.height} 0,${node.height}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" />`;
        svgMarkup += `<polygon points="${node.width - fold},${node.height} ${node.width - fold},${node.height - fold} ${node.width},${node.height - fold}" fill="#FDE047" stroke="${stroke}" stroke-width="1" />`;
        svgMarkup += `<text x="${node.width / 2}" y="${node.height / 2 + 4}" text-anchor="middle" fill="${textColor}" font-size="${fontSize}" font-weight="600">${node.label}</text>`;
      } else if (shapeDef.shapeStyle === 'document') {
        const w = node.width, h = node.height;
        svgMarkup += `<path d="M 0,0 H ${w} V ${h - 12} Q ${w * 0.75},${h} ${w * 0.5},${h - 8} T 0,${h - 12} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5" />`;
        svgMarkup += `<text x="${node.width / 2}" y="${node.height / 2 + 2}" text-anchor="middle" fill="${textColor}" font-size="${fontSize}" font-weight="600">${node.label}</text>`;
      } else if (shapeDef.shapeStyle === 'capsule') {
        svgMarkup += `<rect width="${node.width}" height="${node.height}" rx="${node.height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" />`;
        svgMarkup += `<text x="${node.width / 2}" y="${node.height / 2 + 4}" text-anchor="middle" fill="${textColor}" font-size="${fontSize}" font-weight="600">${node.label}</text>`;
      } else if (shapeDef.shapeStyle === 'diamond') {
        svgMarkup += `<polygon points="${node.width / 2},0 ${node.width},${node.height / 2} ${node.width / 2},${node.height} 0,${node.height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" />`;
        svgMarkup += `<text x="${node.width / 2}" y="${node.height / 2 + 4}" text-anchor="middle" fill="${textColor}" font-size="${fontSize}" font-weight="600">${node.label}</text>`;
      } else {
        svgMarkup += `<rect width="${node.width}" height="${node.height}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="1.5" />`;
        svgMarkup += `<text x="${node.width / 2}" y="${node.height / 2 + 4}" text-anchor="middle" fill="${textColor}" font-size="${fontSize}" font-weight="600">${node.label}</text>`;
      }
      svgMarkup += `</g>`;
    });

    svgMarkup += `</g></svg>`;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const scaleFactor = 2;
    canvas.width = contentW * scaleFactor;
    canvas.height = contentH * scaleFactor;

    img.onload = () => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scaleFactor, scaleFactor);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = `${currentWorkflow?.name || 'flowchart'}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgMarkup)));
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes, connections }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${currentWorkflow?.name || 'flowchart'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJSON = (e) => {
    const fileReader = new FileReader();
    if (!e.target.files?.[0]) return;
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.nodes && parsed.connections) {
          setNodes(parsed.nodes);
          setConnections(parsed.connections);
          pushState(parsed.nodes, parsed.connections);
        }
      } catch (err) {
        alert("Invalid flowchart JSON file");
      }
    };
  };

  if (!showFlowchart) return null;

  const isMultiSelection = selectedNodeIds.length > 1;
  const singleSelectedNode = selectedNodeIds.length === 1 ? nodes.find(n => n.id === selectedNodeIds[0]) : null;
  const selectedConn = connections.find(c => c.id === selectedConnId);
  const hasSelection = selectedNodeIds.length > 0 || !!selectedConn;
  const isPanelOpen = hasSelection && !isPanelCollapsed;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? 0 : 20
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: isFullscreen ? '100vw' : '96vw',
          height: isFullscreen ? '100vh' : '92vh',
          background: 'var(--bg-canvas, #F8FAFC)',
          borderRadius: isFullscreen ? 0 : 16,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
      >
        {/* ── Top Header Toolbar ─────────────────────────────────────────────── */}
        <div
          style={{
            height: 56,
            background: 'var(--bg-panel, #FFFFFF)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 18px',
            userSelect: 'none'
          }}
        >
          {/* Far Left Title & Workflow Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>
              Flowchart Studio
            </span>
            <span style={{ fontSize: 11, background: 'var(--theme-primary-glow, #EFF6FF)', color: 'var(--theme-primary, #2563EB)', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
              {currentWorkflow?.name || 'Untitled Workflow'}
            </span>

            {selectedNodeIds.length > 1 && (
              <span style={{ fontSize: 11, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiLayers size={12} /> {selectedNodeIds.length} Selected
              </span>
            )}
          </div>

          {/* Center Tool Switcher (Select | Connect | Pan) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F1F5F9', padding: '4px', borderRadius: 10 }}>
            <button
              onClick={() => setBaseActiveTool('select')}
              title="Select Tool (Press Tab | Hold Ctrl for Select)"
              style={{
                padding: '6px 12px', borderRadius: 7, border: 'none',
                background: activeTool === 'select' ? 'white' : 'transparent',
                color: activeTool === 'select' ? 'var(--theme-primary, #2563EB)' : '#64748B',
                boxShadow: activeTool === 'select' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600
              }}
            >
              <FiMousePointer size={14} /> Select
            </button>
            <button
              onClick={() => setBaseActiveTool('connect')}
              title="Draw Connection Tool (Press Tab)"
              style={{
                padding: '6px 12px', borderRadius: 7, border: 'none',
                background: activeTool === 'connect' ? 'white' : 'transparent',
                color: activeTool === 'connect' ? 'var(--theme-primary, #2563EB)' : '#64748B',
                boxShadow: activeTool === 'connect' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600
              }}
            >
              <FiCornerDownRight size={14} /> Connect Line
            </button>
            <button
              onClick={() => setBaseActiveTool('pan')}
              title="Pan Canvas (Press Tab | Hold Shift for Pan)"
              style={{
                padding: '6px 12px', borderRadius: 7, border: 'none',
                background: activeTool === 'pan' ? 'white' : 'transparent',
                color: activeTool === 'pan' ? 'var(--theme-primary, #2563EB)' : '#64748B',
                boxShadow: activeTool === 'pan' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600
              }}
            >
              🖐 Pan
            </button>

            <div style={{ width: 1, height: 18, background: '#CBD5E1', margin: '0 4px' }} />

            {/* Undo / Redo */}
            <button onClick={handleUndo} disabled={historyIndex <= 0} style={{ padding: '6px 8px', border: 'none', background: 'transparent', cursor: historyIndex > 0 ? 'pointer' : 'default', opacity: historyIndex > 0 ? 1 : 0.4 }}>
              <FiRotateCcw size={14} />
            </button>
            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} style={{ padding: '6px 8px', border: 'none', background: 'transparent', cursor: historyIndex < history.length - 1 ? 'pointer' : 'default', opacity: historyIndex < history.length - 1 ? 1 : 0.4 }}>
              <FiRotateCw size={14} />
            </button>

            <div style={{ width: 1, height: 18, background: '#CBD5E1', margin: '0 4px' }} />

            {/* Zoom Controls */}
            <button onClick={() => setZoom(z => Math.max(0.3, Number((z - 0.1).toFixed(2))))} style={{ padding: '6px 8px', border: 'none', background: 'transparent', cursor: 'pointer' }}><FiMinus size={14} /></button>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', minWidth: 42, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2.5, Number((z + 0.1).toFixed(2))))} style={{ padding: '6px 8px', border: 'none', background: 'transparent', cursor: 'pointer' }}><FiPlus size={14} /></button>

            <div style={{ width: 1, height: 18, background: '#CBD5E1', margin: '0 4px' }} />

            {/* Grid Toggle */}
            <button
              onClick={() => setShowGrid(g => !g)}
              title="Toggle Grid Background"
              style={{ padding: '6px 8px', border: 'none', background: showGrid ? 'white' : 'transparent', borderRadius: 6, color: showGrid ? 'var(--theme-primary, #2563EB)' : '#64748B', cursor: 'pointer' }}
            >
              <FiGrid size={14} />
            </button>
          </div>

          {/* Far Right Action Buttons Dropdown Menu & Main Save Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

            {/* Actions Dropdown Button (Import, Export, Clear Canvas) */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowActionsMenu(v => !v)}
                style={{
                  padding: '7px 12px',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                Actions <FiChevronDown size={14} />
              </button>

              {showActionsMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 6,
                    background: 'white',
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                    padding: 6,
                    width: 170,
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                    <FiUpload size={14} /> Import JSON
                    <input type="file" accept=".json" onChange={(e) => { handleImportJSON(e); setShowActionsMenu(false); }} style={{ display: 'none' }} />
                  </label>
                  <button onClick={() => { handleExportPNG(); setShowActionsMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, border: 'none', background: 'transparent', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer', textAlign: 'left' }}>
                    <FiDownload size={14} /> Export PNG
                  </button>
                  <button onClick={() => { handleExportJSON(); setShowActionsMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, border: 'none', background: 'transparent', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer', textAlign: 'left' }}>
                    <FiFileText size={14} /> Export JSON
                  </button>
                  <div style={{ height: 1, background: '#E2E8F0', margin: '4px 0' }} />
                  <button onClick={() => { handleClearCanvas(); setShowActionsMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, border: 'none', background: '#FEF2F2', fontSize: 12, fontWeight: 600, color: '#EF4444', cursor: 'pointer', textAlign: 'left' }}>
                    <FiTrash2 size={14} /> Clear Canvas
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => toggleFlowchart()} style={{ padding: '7px 14px', background: 'var(--theme-primary, #2563EB)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiSave size={14} /> Save Diagram
            </button>

            <button onClick={() => setIsFullscreen(f => !f)} style={{ padding: '7px', border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }}>
              {isFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
            </button>

            <button
              onClick={toggleFlowchart}
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none', background: '#F1F5F9', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* ── Main Workspace Body ────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>

          {/* Left Sidebar: Shape Palette */}
          <div
            style={{
              width: 220,
              background: 'var(--bg-panel, #FFFFFF)',
              borderRight: '1px solid var(--border, #E2E8F0)',
              display: 'flex',
              flexDirection: 'column',
              padding: 14,
              gap: 12,
              userSelect: 'none',
              overflowY: 'auto'
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #64748B)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Shapes & Elements
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SHAPE_TYPES.map(shape => (
                <button
                  key={shape.type}
                  onClick={() => handleAddNode(shape)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 6px',
                    borderRadius: 10,
                    border: '1px solid var(--border, #E2E8F0)',
                    background: 'var(--bg-canvas, #F8FAFC)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--theme-primary, #3B82F6)'; e.currentTarget.style.background = 'var(--theme-primary-glow, #EFF6FF)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border, #E2E8F0)'; e.currentTarget.style.background = 'var(--bg-canvas, #F8FAFC)'; }}
                >
                  <span style={{ fontSize: 18, fontWeight: 700, marginBottom: 2, color: 'var(--theme-primary, #2563EB)' }}>{shape.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary, #334155)' }}>{shape.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive SVG Canvas Center */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              cursor: isPanning ? 'grab' : activeTool === 'connect' ? 'crosshair' : 'default',
              background: 'var(--bg-canvas, #F8FAFC)'
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          >
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              style={{ display: 'block' }}
            >
              <defs>
                {showGrid && (
                  <pattern id="dot-grid" width={24 * zoom} height={24 * zoom} patternUnits="userSpaceOnUse" x={pan.x % (24 * zoom)} y={pan.y % (24 * zoom)}>
                    <circle cx={2} cy={2} r={1.2 * zoom} fill="#CBD5E1" />
                  </pattern>
                )}
                <marker
                  id="arrowhead"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748B" />
                </marker>
              </defs>

              {showGrid && <rect width="100%" height="100%" fill="url(#dot-grid)" />}

              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* Render Connections */}
                {connections.map(conn => {
                  const fromNode = nodes.find(n => n.id === conn.from);
                  const toNode = nodes.find(n => n.id === conn.to);
                  if (!fromNode || !toNode) return null;
                  const pathStr = buildPathString(conn, nodes);
                  const startPt = getPortCoordinates(fromNode, conn.fromPort);
                  const endPt = getPortCoordinates(toNode, conn.toPort);
                  const midX = (startPt.x + endPt.x) / 2;
                  const midY = (startPt.y + endPt.y) / 2;
                  const isSelected = selectedConnId === conn.id;

                  return (
                    <g
                      key={conn.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedConnId(conn.id); setSelectedNodeIds([]); setIsPanelCollapsed(false); }}
                      onDoubleClick={(e) => { e.stopPropagation(); setEditingConnId(conn.id); setSelectedConnId(conn.id); setSelectedNodeIds([]); setIsPanelCollapsed(false); }}
                    >
                      <path
                        d={pathStr}
                        fill="none"
                        stroke={isSelected ? 'var(--theme-primary, #2563EB)' : (conn.color || '#64748B')}
                        strokeWidth={isSelected ? 3 : 2}
                        markerEnd="url(#arrowhead)"
                        style={{ transition: 'stroke 0.15s', cursor: 'pointer' }}
                      />
                      <path d={pathStr} fill="none" stroke="transparent" strokeWidth={14} style={{ cursor: 'pointer' }} />

                      {editingConnId === conn.id ? (
                        <foreignObject
                          x={midX - 60}
                          y={midY - 14}
                          width={120}
                          height={28}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            autoFocus
                            placeholder="Line label..."
                            value={conn.label || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConnections(prev => prev.map(c => c.id === conn.id ? { ...c, label: val } : c));
                            }}
                            onBlur={() => {
                              setEditingConnId(null);
                              pushState(nodes, connections);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setEditingConnId(null);
                                pushState(nodes, connections);
                              }
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              background: 'white',
                              border: '2px solid var(--theme-primary, #2563EB)',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#1E293B',
                              textAlign: 'center',
                              outline: 'none',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}
                          />
                        </foreignObject>
                      ) : (
                        <g transform={`translate(${midX}, ${midY})`} style={{ cursor: 'pointer' }}>
                          <rect
                            x={-Math.max(30, (conn.label?.length || 0) * 3.5 + 10)}
                            y={-12}
                            width={Math.max(60, (conn.label?.length || 0) * 7 + 20)}
                            height={22}
                            rx={6}
                            fill="white"
                            stroke={isSelected ? 'var(--theme-primary, #2563EB)' : '#CBD5E1'}
                            strokeWidth={1.5}
                          />
                          <text
                            x={0}
                            y={4}
                            textAnchor="middle"
                            fontSize={11}
                            fontWeight={600}
                            fill={conn.label ? '#1E293B' : '#94A3B8'}
                          >
                            {conn.label || '+ Label'}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Render Active Temp Connection Line */}
                {connectingStart && tempConnectionEnd && (
                  <path
                    d={`M ${getPortCoordinates(nodes.find(n => n.id === connectingStart.nodeId), connectingStart.port).x} ${getPortCoordinates(nodes.find(n => n.id === connectingStart.nodeId), connectingStart.port).y} L ${tempConnectionEnd.x} ${tempConnectionEnd.y}`}
                    fill="none"
                    stroke="var(--theme-primary, #2563EB)"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                  />
                )}

                {/* Render Nodes */}
                {nodes.map(node => {
                  const isSelected = selectedNodeIds.includes(node.id);
                  const shapeDef = SHAPE_TYPES.find(s => s.type === node.type) || SHAPE_TYPES[0];
                  const fill = node.fill || '#EFF6FF';
                  const stroke = isSelected ? 'var(--theme-primary, #2563EB)' : (node.stroke || '#3B82F6');
                  const strokeW = isSelected ? 2.5 : 1.5;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onMouseDown={(e) => handleNodeMouseDown(e, node)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingNodeId(node.id);
                      }}
                      style={{ cursor: 'move' }}
                    >
                      {/* Shape Geometries */}
                      {node.type === 'heading' || node.type === 'text' ? (
                        <rect
                          width={node.width}
                          height={node.height}
                          fill="transparent"
                          stroke={isSelected ? 'var(--theme-primary, #2563EB)' : 'transparent'}
                          strokeWidth={1.5}
                          strokeDasharray={isSelected ? '4,4' : 'none'}
                        />
                      ) : shapeDef.shapeStyle === 'sticky' ? (
                        <g>
                          <polygon
                            points={`0,0 ${node.width},0 ${node.width},${node.height - 18} ${node.width - 18},${node.height} 0,${node.height}`}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={strokeW}
                          />
                          <polygon
                            points={`${node.width - 18},${node.height} ${node.width - 18},${node.height - 18} ${node.width},${node.height - 18}`}
                            fill="#FDE047"
                            stroke={stroke}
                            strokeWidth={1}
                          />
                        </g>
                      ) : shapeDef.shapeStyle === 'document' ? (
                        <path
                          d={`M 0,0 H ${node.width} V ${node.height - 14} Q ${node.width * 0.75},${node.height + 2} ${node.width * 0.5},${node.height - 10} T 0,${node.height - 14} Z`}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={strokeW}
                        />
                      ) : shapeDef.shapeStyle === 'cylinder' ? (
                        <g>
                          <path
                            d={`M 0,12 V ${node.height - 12} A ${node.width / 2} 10 0 0 0 ${node.width} ${node.height - 12} V 12 Z`}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={strokeW}
                          />
                          <ellipse
                            cx={node.width / 2}
                            cy={12}
                            rx={node.width / 2}
                            ry={10}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={strokeW}
                          />
                        </g>
                      ) : shapeDef.shapeStyle === 'rect' ? (
                        <rect
                          width={node.width}
                          height={node.height}
                          rx={8}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={strokeW}
                        />
                      ) : shapeDef.shapeStyle === 'diamond' ? (
                        <polygon
                          points={`${node.width / 2},0 ${node.width},${node.height / 2} ${node.width / 2},${node.height} 0,${node.height / 2}`}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={strokeW}
                        />
                      ) : shapeDef.shapeStyle === 'capsule' ? (
                        <rect
                          width={node.width}
                          height={node.height}
                          rx={node.height / 2}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={strokeW}
                        />
                      ) : shapeDef.shapeStyle === 'parallelogram' ? (
                        <polygon
                          points={`20,0 ${node.width},0 ${node.width - 20},${node.height} 0,${node.height}`}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={strokeW}
                        />
                      ) : shapeDef.shapeStyle === 'circle' ? (
                        <circle
                          cx={node.width / 2}
                          cy={node.height / 2}
                          r={node.width / 2}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={strokeW}
                        />
                      ) : (
                        <rect
                          width={node.width}
                          height={node.height}
                          rx={8}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={strokeW}
                        />
                      )}

                      {/* Canvas Text Editor */}
                      {editingNodeId === node.id ? (
                        <foreignObject
                          x={0}
                          y={0}
                          width={node.width}
                          height={node.height}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <textarea
                            autoFocus
                            value={node.label}
                            onChange={(e) => handleUpdateNodeText(node.id, e.target.value)}
                            onBlur={() => {
                              setEditingNodeId(null);
                              pushState(nodes, connections);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                setEditingNodeId(null);
                                pushState(nodes, connections);
                              }
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              background: 'rgba(255, 255, 255, 0.95)',
                              border: '2px solid var(--theme-primary, #2563EB)',
                              borderRadius: 6,
                              fontSize: node.fontSize || 13,
                              fontWeight: node.fontWeight || 600,
                              color: node.textColor || '#0F172A',
                              textAlign: 'center',
                              outline: 'none',
                              resize: 'none',
                              padding: '4px',
                              boxSizing: 'border-box',
                              fontFamily: 'inherit'
                            }}
                          />
                        </foreignObject>
                      ) : (
                        <text
                          x={node.width / 2}
                          y={node.height / 2 + (node.type === 'heading' ? 6 : 4)}
                          textAnchor="middle"
                          fill={node.textColor || '#1E3A8A'}
                          fontSize={node.fontSize || (node.type === 'heading' ? 20 : 13)}
                          fontWeight={node.fontWeight || (node.type === 'heading' ? 700 : 600)}
                          style={{ userSelect: 'none', pointerEvents: 'none' }}
                        >
                          {node.label}
                        </text>
                      )}

                      {/* Ports */}
                      {['top', 'right', 'bottom', 'left'].map(port => {
                        const pt = getPortCoordinates({ x: 0, y: 0, width: node.width, height: node.height }, port);
                        return (
                          <circle
                            key={port}
                            cx={pt.x}
                            cy={pt.y}
                            r={5}
                            fill={isSelected ? 'var(--theme-primary, #2563EB)' : 'white'}
                            stroke="#3B82F6"
                            strokeWidth={1.5}
                            style={{ cursor: 'crosshair', opacity: isSelected ? 1 : 0.5 }}
                            onMouseDown={(e) => handlePortMouseDown(e, node.id, port)}
                            onMouseUp={(e) => handlePortMouseUp(e, node.id, port)}
                          />
                        );
                      })}

                      {/* Resize Handle */}
                      {isSelected && selectedNodeIds.length === 1 && (
                        <rect
                          x={node.width - 8}
                          y={node.height - 8}
                          width={10}
                          height={10}
                          fill="var(--theme-primary, #2563EB)"
                          stroke="white"
                          strokeWidth={1}
                          style={{ cursor: 'se-resize' }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setResizingNode({
                              id: node.id,
                              startX: e.clientX,
                              startY: e.clientY,
                              origW: node.width,
                              origH: node.height
                            });
                          }}
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Floating AI Architect Bubble (Bottom-Right) Smoothly Animated */}
            <button
              onClick={() => setShowArchitectDrawer(true)}
              title="Open AI Architect Assistant"
              style={{
                position: 'absolute',
                bottom: 24,
                right: isPanelOpen ? 286 : 24,
                zIndex: 90,
                padding: '10px 18px',
                borderRadius: 30,
                background: 'linear-gradient(135deg, var(--theme-primary, #2563EB), #7C3AED)',
                color: 'white',
                border: 'none',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 700,
                transition: 'right 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s ease',
                backdropFilter: 'blur(4px)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <HugeiconsIcon icon={AiMagicIcon} size={18} />
              <span>AI Architect</span>
            </button>
          </div>

          {/* Collapse/Expand Toggle Handle Button (Positioned outside overflow at Z-Index 110) */}
          {hasSelection && (
            <button
              onClick={() => setIsPanelCollapsed(c => !c)}
              title={isPanelCollapsed ? "Expand Inspector Panel" : "Collapse Inspector Panel"}
              style={{
                position: 'absolute',
                top: 18,
                right: isPanelOpen ? 246 : 0,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'white',
                border: '1px solid #CBD5E1',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569',
                zIndex: 110,
                transition: 'right 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {isPanelCollapsed ? <FiChevronLeft size={16} /> : <FiChevronRight size={16} />}
            </button>
          )}

          {/* Sliding Right Inspector Panel */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: 260,
              background: 'var(--bg-panel, #FFFFFF)',
              borderLeft: '1px solid var(--border, #E2E8F0)',
              boxShadow: isPanelOpen ? '-4px 0 20px rgba(0,0,0,0.08)' : 'none',
              transform: isPanelOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              zIndex: 95,
              display: 'flex',
              flexDirection: 'column',
              padding: 16,
              gap: 16,
              overflowY: 'auto'
            }}
          >

            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #0F172A)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiSliders size={16} /> Inspector Panel
            </div>

            {isMultiSelection ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #64748B)', textTransform: 'uppercase' }}>
                  Multi-Selection ({selectedNodeIds.length} Nodes)
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Apply Color to All Selected</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {COLOR_PRESETS.map(cp => (
                      <button
                        key={cp.name}
                        onClick={() => {
                          setNodes(prev => prev.map(n => selectedNodeIds.includes(n.id) ? { ...n, fill: cp.fill, stroke: cp.stroke, textColor: cp.text } : n));
                        }}
                        style={{
                          height: 26,
                          borderRadius: 6,
                          background: cp.fill === 'transparent' ? '#F1F5F9' : cp.fill,
                          border: `2px solid ${cp.stroke === 'transparent' ? '#CBD5E1' : cp.stroke}`,
                          cursor: 'pointer'
                        }}
                        title={cp.name}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleDeleteSelected}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #FCA5A5',
                    background: '#FEF2F2',
                    color: '#EF4444',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    marginTop: 8
                  }}
                >
                  <FiTrash2 size={14} /> Delete {selectedNodeIds.length} Elements
                </button>
              </div>
            ) : singleSelectedNode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #64748B)', textTransform: 'uppercase' }}>
                  Node Properties
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>Text Content</label>
                  <textarea
                    rows={3}
                    value={singleSelectedNode.label}
                    onChange={(e) => handleUpdateNodeText(singleSelectedNode.id, e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, outline: 'none', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>Font Size</label>
                    <input
                      type="number"
                      value={singleSelectedNode.fontSize || 13}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 12;
                        handleUpdateNodeText(singleSelectedNode.id, singleSelectedNode.label);
                        setNodes(prev => prev.map(n => n.id === singleSelectedNode.id ? { ...n, fontSize: val } : n));
                      }}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>Font Weight</label>
                    <select
                      value={singleSelectedNode.fontWeight || 600}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 600;
                        setNodes(prev => prev.map(n => n.id === singleSelectedNode.id ? { ...n, fontWeight: val } : n));
                      }}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
                    >
                      <option value={400}>Normal</option>
                      <option value={600}>Semi-Bold</option>
                      <option value={700}>Bold</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Color Theme</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {COLOR_PRESETS.map(cp => (
                      <button
                        key={cp.name}
                        onClick={() => {
                          setNodes(prev => prev.map(n => n.id === singleSelectedNode.id ? { ...n, fill: cp.fill, stroke: cp.stroke, textColor: cp.text } : n));
                        }}
                        style={{
                          height: 26,
                          borderRadius: 6,
                          background: cp.fill === 'transparent' ? '#F1F5F9' : cp.fill,
                          border: `2px solid ${cp.stroke === 'transparent' ? '#CBD5E1' : cp.stroke}`,
                          cursor: 'pointer'
                        }}
                        title={cp.name}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>Width</label>
                    <input
                      type="number"
                      value={singleSelectedNode.width}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 40;
                        setNodes(prev => prev.map(n => n.id === singleSelectedNode.id ? { ...n, width: val } : n));
                      }}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>Height</label>
                    <input
                      type="number"
                      value={singleSelectedNode.height}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 24;
                        setNodes(prev => prev.map(n => n.id === singleSelectedNode.id ? { ...n, height: val } : n));
                      }}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleDeleteSelected}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #FCA5A5',
                    background: '#FEF2F2',
                    color: '#EF4444',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    marginTop: 8
                  }}
                >
                  <FiTrash2 size={14} /> Delete Element
                </button>
              </div>
            ) : selectedConn ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #64748B)', textTransform: 'uppercase' }}>
                  Connection Line Label
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>Flow Direction / Label</label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. Yes, No, Trigger API, Success"
                    value={selectedConn.label || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConnections(prev => prev.map(c => c.id === selectedConn.id ? { ...c, label: val } : c));
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>Line Routing Style</label>
                  <select
                    value={selectedConn.type || 'orthogonal'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConnections(prev => prev.map(c => c.id === selectedConn.id ? { ...c, type: val } : c));
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, background: 'white' }}
                  >
                    <option value="orthogonal">Orthogonal (Step)</option>
                    <option value="straight">Straight</option>
                    <option value="curved">Curved</option>
                  </select>
                </div>

                <button
                  onClick={handleDeleteSelected}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #FCA5A5',
                    background: '#FEF2F2',
                    color: '#EF4444',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    marginTop: 8
                  }}
                >
                  <FiTrash2 size={14} /> Delete Line
                </button>
              </div>
            ) : null}
          </div>

        </div>

        {/* ── AI Architect Overlay Modal / Drawer ───────────────────────────── */}
        {showArchitectDrawer && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100000,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
            onClick={() => setShowArchitectDrawer(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 540,
                maxWidth: '92vw',
                background: 'white',
                borderRadius: 16,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 18
              }}
            >
              {/* Drawer Title Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}
                  >
                    <HugeiconsIcon icon={AiMagicIcon} size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Flowchart AI Architect</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Smart context-aware flowchart diagram assistant</div>
                  </div>
                </div>

                <button
                  onClick={() => setShowArchitectDrawer(false)}
                  style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#F1F5F9', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* Mode Selection Tabs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#F8FAFC', padding: 4, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <button
                  onClick={() => setArchitectTab('meshCanvas')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: architectTab === 'meshCanvas' ? 'white' : 'transparent',
                    color: architectTab === 'meshCanvas' ? '#2563EB' : '#64748B',
                    boxShadow: architectTab === 'meshCanvas' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <FiZap size={15} /> Sync Mesh Canvas
                </button>
                <button
                  onClick={() => setArchitectTab('promptInput')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: architectTab === 'promptInput' ? 'white' : 'transparent',
                    color: architectTab === 'promptInput' ? '#2563EB' : '#64748B',
                    boxShadow: architectTab === 'promptInput' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <FiCpu size={15} /> Smart Prompt Architect
                </button>
              </div>

              {/* Tab 1: Sync from AgentMesh Canvas */}
              {architectTab === 'meshCanvas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: '#EFF6FF', padding: 18, borderRadius: 12, border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ⚡ Auto-Generate from Active Mesh Canvas
                  </div>
                  <div style={{ fontSize: 12, color: '#1E40AF', lineHeight: 1.5 }}>
                    Reads your active AgentMesh workspace flow (agents, routers, tools, database nodes) and converts it into a visual flowchart with connected Start, Process, Decision, and End nodes.
                  </div>
                  <button
                    onClick={handleGenerateFromMeshCanvas}
                    style={{
                      padding: '10px 16px',
                      background: '#2563EB',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      marginTop: 4
                    }}
                  >
                    <FiZap size={16} /> Generate Flowchart from Mesh Canvas
                  </button>
                </div>
              )}

              {/* Tab 2: Smart AI Prompt Architect (Context-Aware) */}
              {architectTab === 'promptInput' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                    Describe desired flow changes or instructions:
                  </div>

                  {/* Context Indicator Badges */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, background: nodes.length > 0 ? '#ECFDF5' : '#F1F5F9', color: nodes.length > 0 ? '#047857' : '#64748B', padding: '3px 8px', borderRadius: 12, fontWeight: 600, border: `1px solid ${nodes.length > 0 ? '#A7F3D0' : '#E2E8F0'}` }}>
                      {nodes.length > 0 ? `✓ ${nodes.length} Flowchart Nodes Active` : '• Empty Flowchart Canvas'}
                    </span>
                    <span style={{ fontSize: 11, background: (useWorkflowStore.getState().nodes || []).length > 0 ? '#EFF6FF' : '#F1F5F9', color: (useWorkflowStore.getState().nodes || []).length > 0 ? '#1D4ED8' : '#64748B', padding: '3px 8px', borderRadius: 12, fontWeight: 600, border: `1px solid ${(useWorkflowStore.getState().nodes || []).length > 0 ? '#BFDBFE' : '#E2E8F0'}` }}>
                      {(useWorkflowStore.getState().nodes || []).length > 0 ? `✓ Mesh Canvas Flow Active` : '• Off-Topic Custom Flow'}
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    placeholder={nodes.length > 0 ? "e.g. Add a notification step after approval and connect to manual review if rejected" : "e.g. Create a User KYC Verification flow: Start -> Upload Document -> OCR Extraction -> Check Validity? -> If Valid: Send OTP Email -> If Invalid: Manual Review -> End"}
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: 12,
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                  <button
                    onClick={handleGenerateFromPrompt}
                    disabled={generatingAi || !promptInput.trim()}
                    style={{
                      padding: '10px 16px',
                      background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: promptInput.trim() ? 'pointer' : 'default',
                      opacity: promptInput.trim() ? 1 : 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    {generatingAi ? <FiLoader size={16} className="animate-spin" /> : <HugeiconsIcon icon={AiMagicIcon} size={16} />}
                    {generatingAi ? 'Analyzing Context & Generating...' : 'Generate / Update Flowchart with AI'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
