import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useWorkflowStore, useRunStore, useUIStore } from '../../store';
import { executeWorkflow, compileWorkflow, listThreads, getThreadHistory, deleteThread, listVfsFiles } from '../../api/agentmesh';
import {
  FiSend, FiRotateCcw, FiPaperclip, FiMic, FiChevronDown, FiChevronUp, FiArrowUp,
  FiAlertCircle, FiCpu, FiBox, FiActivity,
  FiMessageSquare, FiX, FiCheck, FiEdit, FiTrash, FiUser, FiMicOff, FiClock, FiPlus,
  FiFolder, FiZap, FiStar, FiBriefcase, FiCheckSquare, FiRefreshCw, FiList, FiCamera
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
// Import RunPanelModules submodules
import {
  THEME_BG, THEME_GRAY, THEME_BORDER, THEME_TEXT, THEME_ACCENT, THEME_SECONDARY, THEME_USER_BUBBLE, FONT,
  getButtonCategoryStyles, genThreadId, findProfileReportHtml, PAUSE_UI
} from './RunPanelModules/constants';
import useAudioPlayer from './RunPanelModules/useAudioPlayer';
import { MinimalButton, ActionButton, ActionButtonGroup, ReworkFormPanel } from './RunPanelModules/HitlControls';
import FormRenderer from './RunPanelModules/FormRenderer';
import SpeechRecorder from './RunPanelModules/SpeechRecorder';
import CameraRenderer from './RunPanelModules/CameraRenderer';
import OcrRenderer from './RunPanelModules/OcrRenderer';
import TurnRenderer from './RunPanelModules/TurnRenderer';
import ChatInput from './RunPanelModules/ChatInput';
import { VfsExplorer, BlackboardModal, ProfilingModal } from './RunPanelModules/sessiontool';
import { findStartingTriggers, resolvePauseConfig, processWorkflowMessages } from './RunPanelModules/utils';
import HistorySidebar from './RunPanelModules/HistorySidebar';
import PauseModal from './RunPanelModules/PauseModal';

export default function RunPanel({ onClose }) {
  const {
    workflowId, workflowName, isDirty, isCompiled, nodes, edges,
    autoNewSession, setWorkflowMeta, workflowDescription, workflowGroup,
    workflowCategory, globalErrorNode, dynamicResumption, warmup
  } = useWorkflowStore();
  const {
    running, streamEvents, runOutput, runError, threadId, history,
    startRun, addEvent, finishRun, setError, reset, removeEventsFromIndex,
    pausedInfo, setPausedInfo, setHistory, addToHistory, removeFromHistory, setEvents,
    latestContext
  } = useRunStore();

  const [reworkFeedback, setReworkFeedback] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [vfsTarget, setVfsTarget] = useState(null);
  const [artifactCount, setArtifactCount] = useState(0); // 📊 New State for Badge
  const [showProfilingModal, setShowProfilingModal] = useState(false);
  const [showBlackboardModal, setShowBlackboardModal] = useState(false);

  // 📝 Pagination States for History
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Hook into custom audio engine player
  const { audioPlaying, playAudio, stopAudio } = useAudioPlayer();

  const startingButtonTriggers = useMemo(() => {
    return findStartingTriggers(nodes, edges, 'button_trigger');
  }, [nodes, edges]);

  const startingAutoTriggers = useMemo(() => {
    return findStartingTriggers(nodes, edges, 'auto_trigger');
  }, [nodes, edges]);

  const startingSttNodes = useMemo(() => {
    return findStartingTriggers(nodes, edges, 'stt_trigger');
  }, [nodes, edges]);

  const startingCameraNodes = useMemo(() => {
    return findStartingTriggers(nodes, edges, 'camera');
  }, [nodes, edges]);

  const startingOcrNodes = useMemo(() => {
    return findStartingTriggers(nodes, edges, 'ocr_node');
  }, [nodes, edges]);

  const startingFormNodes = useMemo(() => {
    return findStartingTriggers(nodes, edges, 'form_node');
  }, [nodes, edges]);

  const hasButtonTriggers = startingButtonTriggers.length > 0;
  const hasAutoTriggers = startingAutoTriggers.length > 0;
  const hasStartingSttNode = startingSttNodes.length > 0;
  const hasStartingCameraNode = startingCameraNodes.length > 0;
  const hasStartingOcrNode = startingOcrNodes.length > 0;
  const hasStartingFormNode = startingFormNodes.length > 0;

  const hasOcrNodes = useMemo(() => {
    return nodes.some(n => n.data?.type === 'ocr_node');
  }, [nodes]);

  const isChatStarted = useMemo(() => {
    return streamEvents.some(e => ['node_start', 'token', 'user_message'].includes(e.type));
  }, [streamEvents]);

  const hideInput = !isChatStarted && (hasButtonTriggers || hasAutoTriggers || hasStartingOcrNode || hasStartingSttNode || hasStartingCameraNode || hasStartingFormNode);

  const hasBlackboardTool = useMemo(() => {
    return nodes.some(n => {
      const tools = n.data?.tools || n.tools || [];
      const directTool = n.data?.direct_tool_name || n.direct_tool_name;
      return tools.includes('agent_blackboard') || directTool === 'agent_blackboard';
    });
  }, [nodes]);

  const scrollRef = useRef(null);

  // 🔄 Fetch Artifact Count for current thread
  const syncArtifactCount = async (tid) => {
    if (!tid) {
      setArtifactCount(0);
      return;
    }
    try {
      const daNode = nodes.find(n => n.data?.type === 'deep_agent');
      const rootDir = daNode?.data?.deep_agent_root_dir || './mnt/deep_agents';
      const data = await listVfsFiles(rootDir, tid);
      if (data.status === 'success') {
        setArtifactCount(data.files?.length || 0);
      }
    } catch (e) {
      console.warn("Failed to sync VFS artifact count:", e);
    }
  };

  // Sync count when threadId changes or run finishes
  useEffect(() => {
    syncArtifactCount(threadId);
  }, [threadId, running]);

  // Auto-scroll to bottom on new events
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamEvents, runOutput, runError]);

  // Fetch History on Mount / reset page
  useEffect(() => {
    const initHistory = async () => {
      setLoadingHistory(true);
      try {
        const limit = 20;
        const res = await listThreads(workflowId, { page: 1, limit });
        const newThreads = res.threads || [];
        setHistory(newThreads);
        setHistoryPage(1);
        setHasMoreHistory(newThreads.length === limit);
      } catch (e) {
        console.error("Failed to fetch history:", e);
      } finally {
        setLoadingHistory(false);
      }
    };
    initHistory();
  }, [workflowId, setHistory]);

  const loadMoreHistory = async () => {
    if (loadingHistory || !hasMoreHistory) return;
    setLoadingHistory(true);
    try {
      const nextPage = historyPage + 1;
      const limit = 20;
      const res = await listThreads(workflowId, { page: nextPage, limit });
      const newThreads = res.threads || [];
      if (newThreads.length < limit) {
        setHasMoreHistory(false);
      }
      const currentHistory = useRunStore.getState().history;
      const existingIds = new Set(currentHistory.map(h => h.thread_id));
      const filteredNew = newThreads.filter(h => !existingIds.has(h.thread_id));
      setHistory([...currentHistory, ...filteredNew]);
      setHistoryPage(nextPage);
    } catch (e) {
      console.error("Failed to load more history:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ⚡ Auto-Restore History: If we opened via the Dashboard with a threadId
  useEffect(() => {
    if (threadId && streamEvents.length === 0 && !running) {
      console.log("[RunPanel] Detected external thread reference, restoring history:", threadId);
      handleOpenThread(threadId);
    }
  }, [threadId]); // Only trigger when threadId is established

  // Can the user run? 
  const canRun = true; // We auto-compile now

  const onSend = async (overrideInput, overrideContext, overrideTargetId, isAutoTrigger) => {
    const textToSubmit = typeof overrideInput === 'string' ? overrideInput : '';
    if (!textToSubmit.trim() || running) return;
    const currentInput = textToSubmit;

    // ── Auto-Compile Step ──
    if (isDirty || !isCompiled) {
      try {
        addEvent({ type: 'node_start', node: 'SYSTEM: Compiling changes...' });
        const config = useWorkflowStore.getState().buildConfig();
        await compileWorkflow(config);
        useWorkflowStore.getState().markCompiled();
      } catch (e) {
        setError('Auto-compile failed: ' + e.message);
        return;
      }
    }

    // Use existing thread or create a new one for a fresh conversation
    let tid = threadId;
    if (autoNewSession || !tid) {
      tid = genThreadId();
      if (autoNewSession) {
        reset();
      }
    }
    startRun(tid);

    try {
      // Add the user message immediately for responsiveness
      if (!isAutoTrigger) {
        addEvent({ type: 'user_message', content: currentInput });
      }

      const res = await executeWorkflow(workflowId, {
        input: currentInput,
        thread_id: tid,
        context: overrideContext || {},
        target_node_id: (typeof overrideTargetId === 'string' ? overrideTargetId : null) || useUIStore.getState().targetNodeId
      });

      if (res.status === 'paused') {
        const pauseMessages = res.messages || [];
        let pausedOutput = res.output || 'Ready for approval...';

        for (let i = pauseMessages.length - 1; i >= 0; i--) {
          const content = pauseMessages[i].content;
          if (content && typeof content === 'string' && content.trim()) {
            pausedOutput = content;
            break;
          }
        }

        const pausedOriginalNodeId = res.next_node?.replace(/^(gate_|pre_gate_|post_gate_)/, '') || res.next_node;

        const storeNodes = useWorkflowStore.getState().nodes;
        const { nodeType, nodeConfig } = resolvePauseConfig(res, storeNodes, pausedOriginalNodeId);
        
        const enabledActions = (nodeConfig?.hitl_actions) || ['approve', 'rework', 'reject'];

        console.log(`DEBUG [RunPanel]: Pause detected at ${res.next_node} (Original: ${pausedOriginalNodeId}). Enabled actions:`, enabledActions);

        setPausedInfo({
          isPaused: true,
          nextNode: pausedOriginalNodeId,
          gateNodeId: res.next_node,
          pausedNodeOutput: pausedOutput,
          threadId: tid,
          enabledActions: enabledActions,
          nodeType: nodeType,
          nodeConfig: nodeConfig,
          context: res.context || {}
        });
      }

      // ── Process the full message history to extract artifacts ──
      const messages = res.messages || [];

      let userMsgIdx = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].type === 'HumanMessage' && messages[i].content === currentInput) {
          userMsgIdx = i;
          break;
        }
      }
      const newMessages = userMsgIdx >= 0 ? messages.slice(userMsgIdx + 1) : messages;

      const { chartCount, lastActiveAgent: processedAgent, lastActiveAgentName: processedAgentName } = processWorkflowMessages(newMessages, addEvent, null);
      let lastActiveAgent = processedAgent;
      let lastActiveAgentName = processedAgentName;

      // Show final text summary for the latest agent
      const rawOutput = res.output;
      lastActiveAgent = lastActiveAgent || res.active_agent;
      let output = '';
      if (typeof rawOutput === 'object' && rawOutput !== null) {
        output = rawOutput.final_output || rawOutput.output || JSON.stringify(rawOutput, null, 2);
      } else {
        output = String(rawOutput || '');
      }

      const isPlaceholder = /imgur|<img|placeholder/i.test(output);
      if (output.trim() && !isPlaceholder) {
        addEvent({ type: 'token', content: output, node: lastActiveAgent, agent_name: lastActiveAgentName });
      } else if (chartCount === 0 && output.trim()) {
        addEvent({ type: 'token', content: output, node: lastActiveAgent, agent_name: lastActiveAgentName });
      }

      finishRun(output || null);

      console.log("[WorkflowDebug] Finished run. Result object:", res);

      // 🕵️ VARIABLE EXPLORER: Persist context for data discovery
      const { setLatestContext } = useRunStore.getState();
      setLatestContext(res.context || {});

      const currentHistory = history || [];
      const isNewThread = !currentHistory.some(h => h.thread_id === tid);

      if (isNewThread) {
        addToHistory({
          thread_id: tid,
          workflow_id: workflowId,
          first_message: currentInput,
          created_at: new Date().toISOString()
        });
      }

      // Play audio if generated
      if (res.context?.latest_audio?.length > 0) {
        const latest = res.context.latest_audio[0];
        console.log("[WorkflowDebug] Audio payload found:", latest);
        if (latest.file) {
          playAudio(latest.file);
        }
      } else {
        console.log("[WorkflowDebug] No audio data in context.");
      }

    } catch (e) {
      setError(e.message || 'Workflow execution failed');
    }
  };

  // 🚀 AUTO-TRIGGER LOGIC: If we arrived here via a "Quick Run" button on a card
  useEffect(() => {
    const currentInitialInput = useUIStore.getState().initialRunInput;

    if (currentInitialInput && !running && isCompiled) {
      console.log("[AutoTrigger] Executing initial input:", currentInitialInput);
      const timer = setTimeout(() => {
        onSend(currentInitialInput);
        const ui = useUIStore.getState();
        ui.setInitialRunInput(null);
        ui.setTargetNodeId(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [running, isCompiled, onSend]);

  // 🚀 AUTO-TRIGGER NODE EFFECT: If there is an auto_trigger node on canvas, run automatically on mount
  useEffect(() => {
    const hasAutoTrigger = startingAutoTriggers.length > 0;
    if (hasAutoTrigger && !running && !isChatStarted && !pausedInfo.isPaused) {
      const autoNode = startingAutoTriggers[0];
      const initialInput = autoNode.data?.button_input || 'Start Auto Workflow';
      console.log("[AutoTriggerNode] Triggering workflow automatically via:", autoNode.id);
      const timer = setTimeout(() => {
        onSend(initialInput, null, null, true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [running, isChatStarted, startingAutoTriggers, onSend, pausedInfo.isPaused]);

  const onResume = async (actionArg, choicePayload) => {
    if (running) return;

    const isForm = typeof actionArg === 'object' && actionArg !== null;
    const action = isForm ? 'submit' : actionArg;

    if (action === 'rework') {
      const targetNodeId = pausedInfo.nextNode;
      let clearFromIdx = -1;

      // 1. Search backwards for the last node_start for this specific node
      for (let i = streamEvents.length - 1; i >= 0; i--) {
        if (streamEvents[i].type === 'node_start' && streamEvents[i].node === targetNodeId) {
          clearFromIdx = i;
          break;
        }
      }

      // 2. Fallback: If we couldn't find the node start, use the old user message logic
      if (clearFromIdx === -1) {
        let userMsgIdx = -1;
        for (let i = streamEvents.length - 1; i >= 0; i--) {
          if (streamEvents[i].type === 'user_message') {
            userMsgIdx = i;
            break;
          }
        }
        if (userMsgIdx >= 0) {
          clearFromIdx = userMsgIdx + 1;
        }
      }

      if (clearFromIdx >= 0 && removeEventsFromIndex) {
        removeEventsFromIndex(clearFromIdx);
      }
    }

    startRun(threadId);
    try {
      const payload = {
        ...(isForm ? actionArg : {}),  // Spread individual form field values
        ...(choicePayload || {}),      // Spread choice selection payload
        feedback: reworkFeedback || null,
        decision: isForm ? (actionArg.decision || action) : action,
        include_original_output: pausedInfo.includeOriginalOutput ?? true,
        inject_feedback: pausedInfo.injectFeedback ?? true,
        user_input: isForm ? actionArg : null
      };

      const res = await executeWorkflow(workflowId, {
        mode: 'resume',
        thread_id: threadId,
        action: action,
        payload: payload
      });

      if (res.status === 'paused') {
        const resumeMessages = res.messages || [];
        let pausedOutput = res.output || 'Ready for approval...';

        for (let i = resumeMessages.length - 1; i >= 0; i--) {
          const content = resumeMessages[i].content;
          if (content && typeof content === 'string' && content.trim()) {
            pausedOutput = content;
            break;
          }
        }

        const resumeOriginalNodeId = res.next_node?.replace(/^(gate_|pre_gate_|post_gate_)/, '') || res.next_node;
        
        const storeNodes = useWorkflowStore.getState().nodes;
        const { nodeType, nodeConfig } = resolvePauseConfig(res, storeNodes, resumeOriginalNodeId);
        
        const enabledActions = (nodeConfig?.hitl_actions) || ['approve', 'rework', 'reject'];
        
        setPausedInfo({
          isPaused: true,
          nextNode: resumeOriginalNodeId,
          gateNodeId: res.next_node,
          pausedNodeOutput: pausedOutput,
          threadId: threadId,
          enabledActions: enabledActions,
          showReworkForm: false,
          nodeType: nodeType,
          nodeConfig: nodeConfig,
          context: res.context || {}
        });
      } else if (res.status === 'rejected') {
        setPausedInfo({ isPaused: false, nextNode: null, pausedNodeOutput: null, showReworkForm: false });
        setReworkFeedback('');
        addEvent({
          type: 'system_log',
          message: 'WORKFLOW REJECTED',
          content: 'Workflow execution has been rejected and stopped.'
        });
      } else {
        setPausedInfo({ isPaused: false, nextNode: null, pausedNodeOutput: null, showReworkForm: false });
        setReworkFeedback('');

        // 🕵️ VARIABLE EXPLORER: Persist context for data discovery
        const { setLatestContext } = useRunStore.getState();
        setLatestContext(res.context || {});
      }

      // ── Process messages from resume response ──
      const messages = res.messages || [];

      const { chartCount, lastActiveAgent: processedAgent, lastActiveAgentName: processedAgentName } = processWorkflowMessages(messages, addEvent, res.active_agent || null);
      let lastActiveAgent = processedAgent;
      let lastActiveAgentName = processedAgentName;

      // Handle output
      const rawOutput = res.output;
      let output = '';
      if (typeof rawOutput === 'object' && rawOutput !== null) {
        output = rawOutput.final_output || rawOutput.output || JSON.stringify(rawOutput, null, 2);
      } else {
        output = String(rawOutput || '');
      }

      const isPlaceholder = /imgur|<img|placeholder/i.test(output);
      if (output.trim() && !isPlaceholder) {
        addEvent({ type: 'token', content: output, node: lastActiveAgent, agent_name: lastActiveAgentName });
      } else if (chartCount === 0 && output.trim()) {
        addEvent({ type: 'token', content: output, node: lastActiveAgent, agent_name: lastActiveAgentName });
      }

      const entry = (history || []).find(h => h.thread_id === threadId);
      if (entry) {
        addToHistory({ ...entry, updated_at: new Date().toISOString() });
      }

      finishRun(output || null);

      console.log("[WorkflowDebug] Finished resume. Result object:", res);

      // Play audio if generated
      if (res.context?.latest_audio?.length > 0) {
        const latest = res.context.latest_audio[0];
        console.log("[WorkflowDebug] Audio payload found in resume:", latest);
        if (latest.file) {
          playAudio(latest.file);
        }
      } else {
        console.log("[WorkflowDebug] No audio data in resume context.");
      }

    } catch (e) {
      setError(e.message || 'Resume failed');
      setPausedInfo({
        ...pausedInfo,
        isPaused: true
      });
    }
  };

  const handleNewConversation = () => {
    reset();
    setShowHistory(false);
  };

  const handleOpenThread = async (tid) => {
    if (running) return;
    try {
      addEvent({ type: 'node_start', node: 'SYSTEM: Retrieving context...' });
      const res = await getThreadHistory(workflowId, tid);
      const messages = res.messages || [];

      const events = [];
      let lastActiveAgent = null;

      for (const msg of messages) {
        const nodeId = msg.metadata?.active_agent;
        const agentName = msg.metadata?.agent_name;

        if (msg.type === 'HumanMessage') {
          events.push({ type: 'user_message', content: msg.content });
        } else if (msg.type === 'ToolMessage') {
          const hasArtifact = typeof msg.content === 'string' && (msg.content.includes('```chart') || msg.content.includes('```mermaid'));
          if (!hasArtifact) {
            events.push({ type: 'tool_result', tool: msg.metadata?.tool_name || 'tool', content: msg.content });
          }
        } else if (msg.type === 'AIMessage') {
          if (nodeId && nodeId !== lastActiveAgent) {
            events.push({ type: 'node_start', node: nodeId, agent_name: agentName });
            lastActiveAgent = nodeId;
          }
          if (msg.content && typeof msg.content === 'string' && msg.content.trim()) {
            events.push({ type: 'token', content: msg.content, node: nodeId, agent_name: agentName });
          }
        }
      }

      setEvents(events);
      startRun(tid);

      // 🕵️ NEW: Restore HITL Pause state from history
      if (res.is_paused) {
        const nextNode = res.next_node;
        const originalNodeId = nextNode?.replace(/^(gate_|pre_gate_|post_gate_)/, '') || nextNode;

        const storeNodes = useWorkflowStore.getState().nodes;
        const { nodeType, nodeConfig } = resolvePauseConfig(res, storeNodes, originalNodeId);
        
        const enabledActions = (nodeConfig?.hitl_actions) || ['approve', 'rework', 'reject'];

        const lastAiMsg = [...messages].reverse().find(m => m.type === 'AIMessage');

        setPausedInfo({
          isPaused: true,
          nextNode: originalNodeId,
          gateNodeId: nextNode,
          pausedNodeOutput: lastAiMsg?.content || 'Ready for approval...',
          threadId: tid,
          enabledActions: enabledActions,
          nodeType: nodeType,
          nodeConfig: nodeConfig,
          context: res.context || {}
        });
      }

      // 🕵️ VARIABLE EXPLORER: Restore context from history
      const historicalCtx = res.context || {};
      useRunStore.getState().setLatestContext(historicalCtx);

      // Wait for finishRun state update
      setTimeout(() => {
        finishRun(events.filter(e => e.type === 'token').pop()?.content || null);
      }, 100);
      setShowHistory(false);
    } catch (e) {
      setError("Failed to load thread: " + e.message);
    }
  };

  const handleDeleteThread = async (e, tid) => {
    e.stopPropagation();
    if (!window.confirm("Permanently delete this conversation history?")) return;
    try {
      await deleteThread(tid);
      removeFromHistory(tid);
      if (threadId === tid) {
        handleNewConversation();
      }
    } catch (e) {
      setError("Delete failed: " + e.message);
    }
  };

  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      addEvent({ type: 'node_start', node: 'SYSTEM: Uploading Document...' });
      const formData = new FormData();
      formData.append('file', file);

      const { ingestData } = await import('../../api/agentmesh');
      const res = await ingestData(formData);

      if (res.status === 'success') {
        const filePath = res.file_path;
        addEvent({ type: 'system_log', message: 'UPLOAD SUCCESS', content: `Document ${file.name} uploaded successfully.` });

        const ocrNode = nodes.find(n => n.data?.type === 'ocr_node');
        onSend(`Processing uploaded file: ${file.name}`, {
          latest_file_path: filePath,
          latest_file_name: file.name
        }, ocrNode?.id);
      }
    } catch (err) {
      setError("Upload failed: " + err.message);
    }
  };

  const reportHtml = useMemo(() => {
    return findProfileReportHtml(pausedInfo?.context) || findProfileReportHtml(latestContext);
  }, [pausedInfo?.context, latestContext]);

  const shouldHideInput = pausedInfo.isPaused && PAUSE_UI[pausedInfo.nodeType]?.hidesInput && pausedInfo.nodeType !== 'stt_trigger';

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: THEME_BG,
      color: THEME_TEXT,
      fontFamily: FONT,
      position: 'relative'
    }}>
      {/* ── Chat Header ── */}
      <div style={{
        padding: '10px 24px',
        borderBottom: `1px solid ${THEME_BORDER}`,
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 100,
        position: 'sticky',
        top: 0
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: '#1C1C1E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
            <circle cx="4" cy="4" r="3" fill="#8E77BB" />
            <circle cx="10" cy="10" r="3" fill="white" opacity="0.4" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: THEME_TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{workflowName}</div>
          <div style={{ fontSize: 9, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1, fontWeight: 700 }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: running ? '#8E77BB' : canRun ? '#8E77BB' : '#F59E0B'
            }} />
            {running ? 'TRANSMITTING' : canRun ? 'CONNECTED' : 'STANDBY'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {reportHtml && (
            <button
              onClick={() => setShowProfilingModal(true)}
              title="View Data Profiling Report"
              style={{
                height: 28,
                padding: '0 10px',
                borderRadius: 6,
                border: '1px solid #6366F1',
                background: 'rgba(99, 102, 241, 0.05)',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                color: '#6366F1',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'; }}
            >
              <FiActivity size={11} /> Profiling Report
            </button>
          )}

          <button
            onClick={() => setShowHistory(!showHistory)}
            title="History"
            style={{
              height: 28,
              padding: '0 10px',
              borderRadius: 6,
              border: `1px solid ${THEME_BORDER}`,
              background: showHistory ? '#F3F4F6' : 'white',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              color: showHistory ? '#111827' : '#4B5563',
              transition: 'all 0.15s'
            }}
          >
            <FiClock size={11} /> History
          </button>

          <button
            onClick={handleNewConversation}
            title="New Conversation"
            style={{
              height: 28,
              padding: '0 10px',
              borderRadius: 6,
              border: `1px solid ${THEME_BORDER}`,
              background: 'white',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              color: '#4B5563',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = THEME_BORDER; }}
          >
            <FiRotateCcw size={11} /> Reset
          </button>

          <button
            onClick={onClose}
            title="Exit Run Mode"
            style={{
              width: 28, height: 28,
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9CA3AF',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#111827'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
          >
            <FiX size={16} />
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      {(isDirty || !isCompiled) && !running && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          style={{
            padding: '10px 40px',
            background: 'rgba(142, 119, 187, 0.08)',
            borderBottom: '1px solid rgba(142, 119, 187, 0.2)',
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 12, color: '#1C1C1E', fontWeight: 600, overflow: 'hidden'
          }}
        >
          <FiActivity size={12} />
          AUTO-COMPILE READY: {isDirty ? 'CHANGES DETECTED' : 'INITIAL DEPLOYMENT NEEDED'}
        </motion.div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '60px 40px 140px', background: THEME_BG, display: 'flex', flexDirection: 'column' }} className="custom-scrollbar" ref={scrollRef}>
        <div style={{ margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40, width: '100%', flex: 1, justifyContent: (streamEvents.length === 0 && !runError && !running) ? 'center' : 'flex-start' }}>
          {streamEvents.length === 0 && !runError && !running && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.9 }}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  width: 72, height: 72, borderRadius: 24,
                  background: 'linear-gradient(135deg, #1C1C1E 0%, #000000 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${THEME_BORDER}`, marginBottom: 28,
                  boxShadow: `0 20px 40px ${THEME_ACCENT}20`
                }}
              >
                <FiCpu size={32} color={THEME_ACCENT} />
              </motion.div>
              <div style={{ fontSize: 28, fontWeight: 800, color: THEME_TEXT, marginBottom: 8, letterSpacing: '-0.02em' }}>
                Agent Mesh Intelligence
              </div>
              <div style={{ fontSize: 14, color: '#6B7280', fontWeight: 500, maxWidth: 360, textAlign: 'center', lineHeight: 1.6 }}>
                {canRun ? 'Engage the neural network with a prompt or specific instruction to begin orchestration.' : 'System initialization required.'}
              </div>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            <TurnRenderer
              streamEvents={streamEvents}
              running={running}
              removeEventsFromIndex={removeEventsFromIndex}
              onSend={onSend}
              nodes={nodes}
              onShowVfs={setVfsTarget}
            />
          </AnimatePresence>

          {running && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', gap: 20, maxWidth: '100%' }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: THEME_SECONDARY, flexShrink: 0,
                border: `1px solid ${THEME_BORDER}`,
                boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
              }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                >
                  <FiCpu size={18} />
                </motion.div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 6 }}>
                <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, letterSpacing: '0.05em' }}>THINKING...</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[0, 1, 2].map(j => (
                    <motion.div
                      key={j}
                      animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: j * 0.2 }}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: THEME_ACCENT }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {runError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ alignSelf: 'center', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px 28px', borderRadius: 16, color: '#F87171', fontSize: 14, display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, boxShadow: '0 10px 30px rgba(239, 68, 68, 0.1)' }}>
              <FiAlertCircle size={20} /> {typeof runError === 'string' ? runError : 'An orchestration error occurred.'}
            </motion.div>
          )}

          {/* ────── HUMAN-IN-THE-LOOP STATUS LINE ────── */}
          {pausedInfo.isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                alignSelf: 'center',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '16px 0',
                margin: '10px 0',
                borderTop: `1px solid ${THEME_BORDER}`,
                borderBottom: `1px solid ${THEME_BORDER}`,
                opacity: 0.9
              }}
            >
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, letterSpacing: '0.01em' }}>
                <span style={{ color: THEME_TEXT, fontWeight: 800, marginRight: 8, textTransform: 'uppercase', fontSize: 11 }}>
                  SYSTEM INTERRUPT: {pausedInfo.nextNode === 'human_gate' ? 'Tool Approval Required' : (nodes.find(n => n.id === pausedInfo.nextNode)?.data?.label || pausedInfo.nextNode || 'AWAITING RESPONSE')}
                </span>
                The workflow context requires a human decision to proceed.
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Run History Sidebar (Overlay) ── */}
      <HistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        threadId={threadId}
        onOpenThread={handleOpenThread}
        onDeleteThread={handleDeleteThread}
        onNewConversation={handleNewConversation}
        hasMore={hasMoreHistory}
        loadingMore={loadingHistory}
        onLoadMore={loadMoreHistory}
      />

      {/* Form Modal Portal - Renders outside stacking context */}
      <PauseModal
        isOpen={pausedInfo.isPaused && pausedInfo.nodeType === 'form_node'}
        title={pausedInfo.nodeConfig?.form_title || 'Information Required'}
        icon={FiEdit}
        maxWidth={600}
      >
        <FormRenderer
          config={pausedInfo.nodeConfig || {}}
          context={pausedInfo.context || {}}
          isLoading={running}
          onSubmit={(data) => onResume(data)}
        />
      </PauseModal>


      {/* Camera Paused Overlay - Show CameraRenderer when workflow is paused at camera */}
      <PauseModal
        isOpen={pausedInfo.isPaused && pausedInfo.nodeType === 'camera'}
        title={pausedInfo.nodeConfig?.form_title || 'Camera Verification'}
        icon={FiCamera}
        maxWidth={450}
        bodyPadding="20px"
      >
        <CameraRenderer
          config={pausedInfo.nodeConfig || {}}
          context={pausedInfo.context || {}}
          isLoading={running}
          onSubmit={(data) => onResume(data)}
        />
      </PauseModal>

      {/* OCR Paused Overlay - Show OcrRenderer when workflow is paused at ocr_node */}
      <PauseModal
        isOpen={pausedInfo.isPaused && pausedInfo.nodeType === 'ocr_node'}
        title={pausedInfo.nodeConfig?.form_title || 'Document OCR'}
        icon={FiPaperclip}
        maxWidth={480}
        bodyPadding="20px"
      >
        <OcrRenderer
          config={pausedInfo.nodeConfig || {}}
          context={pausedInfo.context || {}}
          isLoading={running}
          onSubmit={(data) => onResume(data)}
        />
      </PauseModal>

      <div style={{
        padding: '12px 24px 12px',
        background: 'linear-gradient(to top, #FFFFFF 0%, rgba(255,255,255,0.8) 100%)',
        backdropFilter: 'blur(20px)',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        pointerEvents: 'none',
        display: shouldHideInput ? 'none' : 'block'
      }}>
        <div style={{ margin: '0 auto', position: 'relative', pointerEvents: 'auto', maxWidth: 680, width: '100%' }}>
          {pausedInfo.isPaused && !(PAUSE_UI[pausedInfo.nodeType]?.showsHitl === false) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
              <AnimatePresence>
                {pausedInfo.showReworkForm && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.98 }}
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 16px)',
                      left: 0,
                      right: 0,
                      background: '#FFFFFF',
                      borderRadius: 24,
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      padding: 24,
                      boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
                      zIndex: 1000,
                      backdropFilter: 'blur(12px)'
                    }}
                  >
                    {/* Arrow Pointer down to Edit button */}
                    <div style={{
                      position: 'absolute',
                      bottom: -6,
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      width: 10,
                      height: 10,
                      background: '#FFFFFF',
                      borderRight: '1px solid rgba(99, 102, 241, 0.25)',
                      borderBottom: '1px solid rgba(99, 102, 241, 0.25)',
                      zIndex: 1001
                    }} />

                    <div style={{ fontSize: 11, fontWeight: 900, color: THEME_ACCENT, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiEdit size={14} /> REWORK PARAMETERS
                    </div>

                    <ReworkFormPanel
                      feedback={reworkFeedback}
                      onChange={setReworkFeedback}
                      includeOriginal={pausedInfo.includeOriginalOutput ?? true}
                      setIncludeOriginal={(val) => setPausedInfo({ ...pausedInfo, includeOriginalOutput: val })}
                      injectFeedback={pausedInfo.injectFeedback ?? true}
                      setInjectFeedback={(val) => setPausedInfo({ ...pausedInfo, injectFeedback: val })}
                      onSubmit={() => !running && onResume('rework')}
                      onCancel={() => setPausedInfo({ ...pausedInfo, showReworkForm: false })}
                      isLoading={running}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{
                display: 'flex',
                gap: 10,
                background: '#F3F4F6',
                padding: 10,
                borderRadius: 20,
                border: `1px solid ${THEME_BORDER}`,
                boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
                opacity: running ? 0.6 : 1,
                pointerEvents: running ? 'none' : 'auto',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                justifyContent: 'center'
              }}>
                {(() => {
                  const nextNodeId = pausedInfo.nextNode;
                  let choiceButtons = [];
                  if (pausedInfo.context?.paused_subgraph_buttons) {
                    choiceButtons = pausedInfo.context.paused_subgraph_buttons;
                  } else {
                    const outgoingEdges = edges ? edges.filter(e => e.source === nextNodeId) : [];
                    choiceButtons = outgoingEdges
                      .map(e => nodes.find(n => n.id === e.target || (n.data && n.data.id === e.target)))
                      .filter(n => n && (n.type === 'button_trigger' || n.data?.type === 'button_trigger'));
                  }

                  if (choiceButtons.length > 0) {
                    return choiceButtons.map((btn) => {
                      const catStyles = getButtonCategoryStyles(btn.data?.button_category || btn.button_category || btn.data?.category || btn.category);
                      return (
                        <motion.button
                          key={btn.id}
                          whileHover={{ y: -1, scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onResume('approve', { clicked_button_id: btn.id })}
                          style={{
                            flex: 1,
                            maxWidth: '200px',
                            padding: '10px 18px',
                            borderRadius: '10px',
                            background: catStyles.bg,
                            color: catStyles.color,
                            border: `1px solid ${catStyles.border}`,
                            fontWeight: '600',
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = catStyles.bgHover;
                            e.currentTarget.style.borderColor = catStyles.borderHover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = catStyles.bg;
                            e.currentTarget.style.borderColor = catStyles.border;
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: catStyles.dotColor, opacity: 0.8 }} />
                          {btn.data?.button_label || btn.button_label || btn.label || btn.data?.label || 'Proceed'}
                        </motion.button>
                      );
                    });
                  }

                  if (pausedInfo.nodeType === 'button_trigger') {
                    const catStyles = getButtonCategoryStyles(pausedInfo.nodeConfig?.data?.button_category || pausedInfo.nodeConfig?.button_category);
                    return (
                      <motion.button
                        whileHover={{ y: -1, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onResume('approve')}
                        style={{
                          flex: 1,
                          maxWidth: '200px',
                          padding: '10px 18px',
                          borderRadius: '10px',
                          background: catStyles.bg,
                          color: catStyles.color,
                          border: `1px solid ${catStyles.border}`,
                          fontWeight: '600',
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = catStyles.bgHover;
                          e.currentTarget.style.borderColor = catStyles.borderHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = catStyles.bg;
                          e.currentTarget.style.borderColor = catStyles.border;
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: catStyles.dotColor, opacity: 0.8 }} />
                        {pausedInfo.nodeConfig?.data?.button_label || pausedInfo.nodeConfig?.button_label || 'Proceed'}
                      </motion.button>
                    );
                  }

                  return (
                    <ActionButtonGroup
                      actions={pausedInfo.enabledActions || ['approve', 'rework', 'reject']}
                      onApprove={() => onResume('approve')}
                      onRework={() => setPausedInfo({ ...pausedInfo, showReworkForm: !pausedInfo.showReworkForm })}
                      onReject={() => onResume('reject')}
                      isLoading={running}
                    />
                  );
                })()}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', pointerEvents: 'auto' }}>
              {canRun && !running && !isChatStarted && (hasButtonTriggers || hasOcrNodes) && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: hideInput ? 10 : 4,
                  padding: '0 4px',
                  justifyContent: hideInput ? 'center' : 'flex-start'
                }}>
                  {startingButtonTriggers.map(btnNode => {
                    const catStyles = getButtonCategoryStyles(btnNode.data?.button_category || btnNode.button_category || btnNode.data?.category || btnNode.category);
                    return (
                      <motion.button
                        key={btnNode.id}
                        whileHover={{ scale: 1.01, translateY: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSend(btnNode.data?.button_input || 'Start')}
                        style={{
                          padding: hideInput ? '10px 20px' : '6px 14px',
                          borderRadius: hideInput ? 10 : 8,
                          background: hideInput ? (btnNode.data?.button_category ? catStyles.color : 'var(--theme-primary, #6366F1)') : catStyles.bg,
                          border: hideInput ? 'none' : `1px solid ${catStyles.border}`,
                          color: hideInput ? '#FFFFFF' : catStyles.color,
                          fontSize: hideInput ? 12.5 : 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onMouseEnter={(e) => {
                          if (!hideInput) {
                            e.currentTarget.style.background = catStyles.bgHover;
                            e.currentTarget.style.borderColor = catStyles.borderHover;
                          } else {
                            e.currentTarget.style.opacity = '0.9';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!hideInput) {
                            e.currentTarget.style.background = catStyles.bg;
                            e.currentTarget.style.borderColor = catStyles.border;
                          } else {
                            e.currentTarget.style.opacity = '1';
                          }
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: hideInput ? '#FFFFFF' : catStyles.dotColor, opacity: 0.8 }} />
                        {btnNode.data?.button_label || btnNode.data?.label || 'Run'}
                      </motion.button>
                    );
                  })}

                  {hasOcrNodes && (
                    <motion.label
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      htmlFor="run-panel-file-upload"
                      style={{
                        padding: '16px 28px',
                        borderRadius: 16,
                        background: THEME_ACCENT,
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        boxShadow: '0 10px 25px rgba(142, 119, 187, 0.4)',
                        letterSpacing: '0.02em'
                      }}
                    >
                      <FiPaperclip size={18} strokeWidth={3} />
                      UPLOAD & PROCESS DOCUMENT
                    </motion.label>
                  )}
                </div>
              )}

              {/* STT Entry: Show mic recorder before chat starts when stt_node is the starting node */}
              {canRun && !running && !isChatStarted && hasStartingSttNode && !pausedInfo.isPaused && (
                <div style={{ width: '100%' }}>
                  <SpeechRecorder
                    autoStart={startingSttNodes[0]?.data?.auto_start === true}
                    autoStop={startingSttNodes[0]?.data?.auto_stop !== false}
                    silenceDelay={startingSttNodes[0]?.data?.silence_delay ?? 1500}
                    lang={startingSttNodes[0]?.data?.stt_lang || 'en-US'}
                    onTranscript={(text) => onSend(text)}
                  />
                </div>
              )}

              {/* Camera Entry: Show capture button before chat starts when camera is the starting node */}
              {canRun && !running && !isChatStarted && hasStartingCameraNode && (
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSend('camera_capture')}
                  style={{
                    padding: '16px 32px',
                    borderRadius: 16,
                    background: '#BE185D',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: '0 10px 25px rgba(190,24,93,0.35)',
                    letterSpacing: '0.02em',
                  }}
                >
                  <FiCamera size={18} strokeWidth={3} /> CAPTURE PHOTO
                </motion.button>
              )}

              {!hideInput && !hasStartingSttNode && !hasStartingCameraNode && !(pausedInfo.isPaused && pausedInfo.nodeType === 'stt_trigger') && !(pausedInfo.isPaused && pausedInfo.nodeType === 'camera') && (
                <ChatInput
                  onSend={onSend}
                  running={running}
                  canRun={canRun}
                  artifactCount={artifactCount}
                  hasBlackboardTool={hasBlackboardTool}
                  nodes={nodes}
                  setVfsTarget={setVfsTarget}
                  setShowBlackboardModal={setShowBlackboardModal}
                  hasOcrNodes={hasOcrNodes}
                  audioPlaying={audioPlaying}
                  stopAudio={stopAudio}
                />
              )}

              {/* Midway STT: Show mic recorder inline when workflow is paused at stt_trigger */}
              {pausedInfo.isPaused && pausedInfo.nodeType === 'stt_trigger' && !running && (
                <div style={{ width: '100%' }}>
                  <SpeechRecorder
                    autoStart={pausedInfo.nodeConfig?.auto_start === true}
                    autoStop={pausedInfo.nodeConfig?.auto_stop !== false}
                    silenceDelay={pausedInfo.nodeConfig?.silence_delay ?? 1500}
                    lang={pausedInfo.nodeConfig?.stt_lang || 'en-US'}
                    onTranscript={(text) => onResume({ stt_output: text })}
                  />
                </div>
              )}

              {/* Ongoing STT chat: keep showing mic recorder instead of text box */}
              {!hideInput && hasStartingSttNode && !running && !pausedInfo.isPaused && (
                <SpeechRecorder
                  autoStart={startingSttNodes[0]?.data?.auto_start === true}
                  autoStop={startingSttNodes[0]?.data?.auto_stop !== false}
                  silenceDelay={startingSttNodes[0]?.data?.silence_delay ?? 1500}
                  lang={startingSttNodes[0]?.data?.stt_lang || 'en-US'}
                  onTranscript={(text) => onSend(text)}
                />
              )}
              {/* Ongoing camera: show capture button after chat started */}
              {!hideInput && hasStartingCameraNode && !running && !pausedInfo.isPaused && (
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSend('camera_capture')}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 12,
                    background: '#BE185D',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 6px 16px rgba(190,24,93,0.3)',
                  }}
                >
                  <FiCamera size={16} strokeWidth={3} /> Capture Photo
                </motion.button>
              )}
            </div>
          )}
          <div style={{
            fontSize: 9,
            color: '#9BA3AF',
            textAlign: 'center',
            marginTop: 6,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity: 0.5
          }}>
            AgentMesh Intelligence v2.0 // Core Engine
          </div>
        </div>
      </div>

      <VfsExplorer
        isOpen={!!vfsTarget}
        onClose={() => setVfsTarget(null)}
        rootDir={vfsTarget?.rootDir}
        threadId={threadId}
      />

      <ProfilingModal
        isOpen={showProfilingModal}
        onClose={() => setShowProfilingModal(false)}
        reportHtml={reportHtml}
        threadId={threadId}
      />

      <BlackboardModal
        isOpen={showBlackboardModal}
        onClose={() => setShowBlackboardModal(false)}
        threadId={threadId}
      />

      <input
        type="file"
        id="run-panel-file-upload"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        accept=".pdf,.png,.jpg,.jpeg,.webp"
      />
    </div>
  );
}
