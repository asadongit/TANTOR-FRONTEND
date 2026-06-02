import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useWorkflowStore, useRunStore, useUIStore } from '../../store';
import { executeWorkflow, compileWorkflow, listThreads, getThreadHistory, deleteThread } from '../../api/agentmesh';
import {
  FiSend, FiRotateCcw, FiPaperclip, FiMic, FiChevronDown, FiChevronUp, FiArrowUp,
  FiAlertCircle, FiCpu, FiBox, FiActivity,
  FiMessageSquare, FiX, FiCheck, FiEdit, FiTrash, FiUser, FiMicOff, FiClock, FiPlus,
  FiFolder, FiZap, FiStar
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { formatMessage } from '../Common/messageFormatting';
import VfsExplorer from './VfsExplorer';

const THEME_BG = '#FFFFFF';
const THEME_GRAY = '#F9FAFB';
const THEME_BORDER = 'rgba(0, 0, 0, 0.08)';
const THEME_TEXT = '#111827';
// Use CSS variables for centralized theme control
const THEME_ACCENT = 'var(--theme-primary)';
const THEME_SECONDARY = '#6366F1'; // Vibrant indigo for light accents
const THEME_USER_BUBBLE = '#F3F4FB'; // Soft light indigo/gray for user messages
const FONT = "'Inter', 'Outfit', 'Google Sans', 'Roboto', sans-serif";

function genThreadId() {
  return 'thread_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
}

export default function RunPanel({ onClose }) {
  const {
    workflowId, workflowName, isDirty, isCompiled, nodes,
    autoNewSession, setWorkflowMeta, workflowDescription, workflowGroup,
    workflowCategory, globalErrorNode, dynamicResumption, warmup
  } = useWorkflowStore();
  const {
    running, streamEvents, runOutput, runError, threadId, history,
    startRun, addEvent, finishRun, setError, reset, removeEventsFromIndex,
    pausedInfo, setPausedInfo, setHistory, addToHistory, removeFromHistory, setEvents
  } = useRunStore();
  const [input, setInput] = useState('');
  const [reworkFeedback, setReworkFeedback] = useState('');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [vfsTarget, setVfsTarget] = useState(null);
  const [artifactCount, setArtifactCount] = useState(0); // 📊 New State for Badge
  const scrollRef = useRef(null);
  const audioRef = useRef(null);
  const textareaRef = useRef(null);

  // 🔄 Fetch Artifact Count for current thread
  const syncArtifactCount = async (tid) => {
    if (!tid) {
      setArtifactCount(0);
      return;
    }
    try {
      const daNode = nodes.find(n => n.data?.type === 'deep_agent');
      const rootDir = daNode?.data?.deep_agent_root_dir || './mnt/deep_agents';
      const res = await fetch(`http://localhost:8000/api/v1/agentmesh/deep-agent/vfs/list?root_dir=${encodeURIComponent(rootDir)}&thread_id=${tid}`);
      const data = await res.json();
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

  // Auto-resize textarea logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px'; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // Max 4 lines (assuming 20px line height + padding)
      textareaRef.current.style.height = (scrollHeight > maxHeight ? maxHeight : scrollHeight) + 'px';
    }
  }, [input]);

  const stopAudio = () => {
    if (audioRef.current) {
      console.log("[AudioEngine] Manually stopping playback");
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioPlaying(false);
    }
  };

  const playAudio = (filename) => {
    if (!filename) return;
    const url = `http://localhost:8000/audio/${filename.replace(/\\/g, '/')}`;
    console.log("[AudioEngine] Attempting playback from:", url);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.addEventListener('play', () => setAudioPlaying(true));
    audio.addEventListener('ended', () => setAudioPlaying(false));
    audio.addEventListener('pause', () => setAudioPlaying(false));

    audio.play()
      .then(() => console.log("[AudioEngine] Playback started"))
      .catch(e => {
        console.error("[AudioEngine] Playback failed:", e.message);
        setAudioPlaying(false);
      });
  };

  // Auto-scroll to bottom on new events
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamEvents, runOutput, runError]);

  // Fetch History on Mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await listThreads(workflowId);
        setHistory(res.threads || []);
      } catch (e) {
        console.error("Failed to fetch history:", e);
      }
    };
    fetchHistory();
  }, [workflowId, setHistory]);

  // 🔊 Audio Engine Cleanup: Stop playback when component unmounts
  useEffect(() => {
    return () => {
      console.log("[AudioEngine] Component unmounting, stopping audio");
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);
  
  // ⚡ Auto-Restore History: If we opened via the Dashboard with a threadId
  useEffect(() => {
    if (threadId && streamEvents.length === 0 && !running) {
        console.log("[RunPanel] Detected external thread reference, restoring history:", threadId);
        handleOpenThread(threadId);
    }
  }, [threadId]); // Only trigger when threadId is established

  // Can the user run? 
  const canRun = true; // We auto-compile now

  const onSend = async (overrideInput, overrideContext, overrideTargetId) => {
    const textToSubmit = typeof overrideInput === 'string' ? overrideInput : input;
    if (!textToSubmit.trim() || running) return;
    const currentInput = textToSubmit;
    if (typeof overrideInput !== 'string') {
      setInput('');
    }

    // ── Auto-Compile Step ──
    if (isDirty || !isCompiled) {
      try {
        addEvent({ type: 'node_start', node: 'SYSTEM: Compiling changes...' });
        const config = useWorkflowStore.getState().buildConfig();
        await compileWorkflow(config);
        useWorkflowStore.getState().markCompiled();
        // Remove the temporary compiling message
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
      addEvent({ type: 'user_message', content: currentInput });

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
        const runConfig = useWorkflowStore.getState().buildConfig();
        const pausedNode = runConfig.nodes.find(n => n.id === pausedOriginalNodeId);
        const enabledActions = pausedNode?.hitl_actions || ['approve', 'rework', 'reject'];

        console.log(`DEBUG [RunPanel]: Pause detected at ${res.next_node} (Original: ${pausedOriginalNodeId}). Enabled actions:`, enabledActions);

        setPausedInfo({
          isPaused: true,
          nextNode: pausedOriginalNodeId,
          gateNodeId: res.next_node,
          pausedNodeOutput: pausedOutput,
          threadId: tid,
          enabledActions: enabledActions,
          nodeType: pausedNode?.type,
          nodeConfig: pausedNode,
          context: res.context || {}
        });
      }

      // ── Process the full message history to extract artifacts ──
      // Industry pattern: scan ToolMessages for ```chart/```mermaid blocks and render
      // them inline, bypassing the LLM's tendency to hallucinate placeholder images.
      const messages = res.messages || [];
      const config = useWorkflowStore.getState().buildConfig();
      const nodes = config.nodes || [];

      // Find the index of the LAST occurrence of this user message
      // (important for multi-turn threads where the same question may repeat)
      let userMsgIdx = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].type === 'HumanMessage' && messages[i].content === currentInput) {
          userMsgIdx = i;
          break;
        }
      }
      // Fallback: process all messages if not found (e.g. tuple format mismatch)
      const newMessages = userMsgIdx >= 0 ? messages.slice(userMsgIdx + 1) : messages;

      const hasArtifact = (str) =>
        typeof str === 'string' && (str.includes('```chart') || str.includes('```mermaid'));

      let chartCount = 0;
      let lastActiveAgent = null;

      // ✅ FIX (Mar 20, 2026): Track and show ALL agents in the turn
      for (const msg of newMessages) {
        const nodeId = msg.metadata?.active_agent;

        // If we detect a new agent starting, add a node_start event
        if (nodeId && nodeId !== lastActiveAgent) {
          addEvent({ type: 'node_start', node: nodeId });
          lastActiveAgent = nodeId;
        }

        // TOOL EXECUTION LOGS (from ToolMessages)
        if (msg.type === 'ToolMessage') {
          if (hasArtifact(msg.content)) {
            addEvent({ type: 'tool_result', tool: 'chart_generator', content: msg.content });
            chartCount++;
          }
        }

        // AGENT OUTPUTS (from AIMessages)
        else if (msg.type === 'AIMessage') {
          // If it has artifacts, show them
          if (hasArtifact(msg.content)) {
            addEvent({ type: 'tool_result', tool: 'chart_generator', content: msg.content });
            chartCount++;
          }

          // If it's a historical agent (not the current one that just finished), show its text
          // This prevents history loss in multi-agent runs
          const isNotLast = msg !== newMessages[newMessages.length - 1];
          if (isNotLast && msg.content && typeof msg.content === 'string' && msg.content.trim()) {
            addEvent({ type: 'token', content: msg.content, node: nodeId });
          }
        }
      }

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
        addEvent({ type: 'token', content: output, node: lastActiveAgent });
      } else if (chartCount === 0 && output.trim()) {
        addEvent({ type: 'token', content: output, node: lastActiveAgent });
      }

      finishRun(output || null);

      console.log("[WorkflowDebug] Finished run. Result object:", res);
      
      // 🕵️ VARIABLE EXPLORER: Persist context for data discovery
      const { setLatestContext } = useRunStore.getState();
      setLatestContext(res.context || {});

      // ✅ FIX (Apr 1, 2026): Only add/update history if this is a new conversation or we need to refresh
      // This prevents the 'Last Message' title bug where every turn overwrote the first message.
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
      // Wait for components to settle
      const timer = setTimeout(() => {
        onSend(currentInitialInput);
        // Clean up store
        const ui = useUIStore.getState();
        ui.setInitialRunInput(null);
        ui.setTargetNodeId(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [running, isCompiled, onSend]);

  const onResume = async (actionArg) => {
    if (running) return;

    // Detect if we are submitting a form (actionArg is an object)
    const isForm = typeof actionArg === 'object' && actionArg !== null;
    const action = isForm ? 'submit' : actionArg;

    // 🎨 UX Improve: If rework is chosen, we clear the previous "attempt" events 
    // for this SPECIFIC node only, to provide a cleaner 'replacement' feel.
    // We used to clear EVERYTHING from the last user message, which broke multi-agent flows.
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
      // 🛠️ FIX (Mar 20, 2026): Incorporate checkbox states into the payload
      // ✅ FORM FIX (Apr 15, 2026): Spread form field values into payload for backend context injection
      const payload = {
        ...(isForm ? actionArg : {}),  // Spread individual form field values (customer_name, email, etc.)
        feedback: reworkFeedback || null,
        decision: action,
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

      // Handle different response states
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
        const resumeConfig = useWorkflowStore.getState().buildConfig();
        const pausedNode = resumeConfig.nodes.find(n => n.id === resumeOriginalNodeId);
        const enabledActions = pausedNode?.hitl_actions || ['approve', 'rework', 'reject'];

        setPausedInfo({
          isPaused: true,
          nextNode: resumeOriginalNodeId,
          gateNodeId: res.next_node,
          pausedNodeOutput: pausedOutput,
          threadId: threadId,
          enabledActions: enabledActions,
          showReworkForm: false,
          nodeType: pausedNode?.type,
          nodeConfig: pausedNode
        });
      } else if (res.status === 'rejected') {
        // Workflow was rejected
        setPausedInfo({ isPaused: false, nextNode: null, pausedNodeOutput: null, showReworkForm: false });
        setReworkFeedback('');
        addEvent({
          type: 'system_log',
          message: 'WORKFLOW REJECTED',
          content: 'Workflow execution has been rejected and stopped.'
        });
      } else {
        // Workflow completed successfully
        setPausedInfo({ isPaused: false, nextNode: null, pausedNodeOutput: null, showReworkForm: false });
        setReworkFeedback('');
        
        // 🕵️ VARIABLE EXPLORER: Persist context for data discovery
        const { setLatestContext } = useRunStore.getState();
        setLatestContext(res.context || {});
      }

      // ── Process messages from resume response ──
      const messages = res.messages || [];
      const config = useWorkflowStore.getState().buildConfig();
      const nodes = config.nodes || [];

      const hasArtifact = (str) =>
        typeof str === 'string' && (str.includes('```chart') || str.includes('```mermaid'));

      let chartCount = 0;
      let lastActiveAgent = res.active_agent || null;

      // ✅ FIX (Mar 20, 2026): Track and show ALL agents in the turn
      for (const msg of messages) {
        const nodeId = msg.metadata?.active_agent;

        // If we detect a new agent starting, add a node_start event
        if (nodeId && nodeId !== lastActiveAgent) {
          addEvent({ type: 'node_start', node: nodeId });
          lastActiveAgent = nodeId;
        }

        // TOOL EXECUTION LOGS
        if (msg.type === 'ToolMessage') {
          if (hasArtifact(msg.content)) {
            addEvent({ type: 'tool_result', tool: 'chart_generator', content: msg.content });
            chartCount++;
          }
        }

        // AGENT OUTPUTS
        else if (msg.type === 'AIMessage') {
          if (hasArtifact(msg.content)) {
            addEvent({ type: 'tool_result', tool: 'chart_generator', content: msg.content });
            chartCount++;
          }

          // Show text for agents in history
          const isNotLast = msg !== messages[messages.length - 1];
          if (isNotLast && msg.content && typeof msg.content === 'string' && msg.content.trim()) {
            addEvent({ type: 'token', content: msg.content, node: nodeId });
          }
        }
      }

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
        addEvent({ type: 'token', content: output, node: lastActiveAgent });
      } else if (chartCount === 0 && output.trim()) {
        addEvent({ type: 'token', content: output, node: lastActiveAgent });
      }

      // ✅ FIX (Apr 1, 2026): Refresh history entry position on resume
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
    setInput('');
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

        if (msg.type === 'HumanMessage') {
          events.push({ type: 'user_message', content: msg.content });
        } else if (msg.type === 'ToolMessage') {
          events.push({ type: 'tool_result', tool: msg.metadata?.tool_name || 'tool', content: msg.content });
        } else if (msg.type === 'AIMessage') {
          if (nodeId && nodeId !== lastActiveAgent) {
            events.push({ type: 'node_start', node: nodeId });
            lastActiveAgent = nodeId;
          }
          if (msg.content && typeof msg.content === 'string' && msg.content.trim()) {
            events.push({ type: 'token', content: msg.content, node: nodeId });
          }
        }
      }

      setEvents(events);
      startRun(tid);

      // 🕵️ NEW: Restore HITL Pause state from history
      if (res.is_paused) {
        const nextNode = res.next_node;
        const originalNodeId = nextNode?.replace(/^(gate_|pre_gate_|post_gate_)/, '') || nextNode;

        const config = useWorkflowStore.getState().buildConfig();
        const pausedNode = config.nodes.find(n => n.id === originalNodeId);
        const enabledActions = pausedNode?.hitl_actions || ['approve', 'rework', 'reject'];

        // Get last AI message for the preview bubble
        const lastAiMsg = [...messages].reverse().find(m => m.type === 'AIMessage');

        setPausedInfo({
          isPaused: true,
          nextNode: originalNodeId,
          gateNodeId: nextNode,
          pausedNodeOutput: lastAiMsg?.content || 'Ready for approval...',
          threadId: tid,
          enabledActions: enabledActions,
          nodeType: pausedNode?.type,
          nodeConfig: pausedNode
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

  const hasButtonTriggers = nodes.some(n => n.data?.type === 'button_trigger');
  const hasOcrNodes = nodes.some(n => n.data?.type === 'ocr_node');
  const isChatStarted = streamEvents.some(e => ['node_start', 'token', 'user_message'].includes(e.type));
  const hideInput = hasButtonTriggers || (hasOcrNodes && !isChatStarted);

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
        
        // Auto-trigger workflow targeting the OCR node if it exists
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

      <div style={{ flex: 1, overflowY: 'auto', padding: '60px 40px 140px', background: THEME_BG }} className="custom-scrollbar" ref={scrollRef}>
        <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40, width: '100%' }}>
          {streamEvents.length === 0 && !runError && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.9, paddingTop: 100 }}>
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

              {/* (Central triggers moved to bottom bar) */}
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
      <AnimatePresence>
        {showHistory && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 2000 }}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)', backdropFilter: 'blur(4px)' }}
            />
            {/* Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: 320, background: 'white',
                borderRight: `1px solid ${THEME_BORDER}`,
                display: 'flex', flexDirection: 'column',
                boxShadow: '20px 0 50px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{
                padding: '24px 20px', borderBottom: `1px solid ${THEME_BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: THEME_TEXT, letterSpacing: '-0.02em' }}>RUN HISTORY</div>
                <button onClick={() => setShowHistory(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF' }}>
                  <FiX size={18} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }} className="custom-scrollbar">
                {history.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13, fontWeight: 500 }}>
                    No sessions recorded for this workflow yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {history.map((h) => (
                      <div
                        key={h.thread_id}
                        onClick={() => handleOpenThread(h.thread_id)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 12,
                          cursor: 'pointer',
                          background: threadId === h.thread_id ? 'rgba(142, 119, 187, 0.06)' : 'transparent',
                          border: `1px solid ${threadId === h.thread_id ? 'rgba(142, 119, 187, 0.15)' : 'transparent'}`,
                          display: 'flex', flexDirection: 'column', gap: 2,
                          transition: 'all 0.2s',
                          position: 'relative',
                          group: true
                        }}
                        onMouseEnter={(e) => {
                          if (threadId !== h.thread_id) e.currentTarget.style.background = '#F9FAFB';
                          e.currentTarget.querySelector('.delete-btn').style.opacity = 1;
                        }}
                        onMouseLeave={(e) => {
                          if (threadId !== h.thread_id) e.currentTarget.style.background = 'transparent';
                          e.currentTarget.querySelector('.delete-btn').style.opacity = 0;
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: threadId === h.thread_id ? THEME_ACCENT : THEME_TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 24 }}>
                          {h.first_message}
                        </div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>
                          {new Date(h.created_at).toLocaleDateString()} at {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        <button
                          className="delete-btn"
                          onClick={(e) => handleDeleteThread(e, h.thread_id)}
                          style={{
                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                            width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent',
                            color: '#FCA5A5', opacity: 0, transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          <FiTrash size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ padding: 16, borderTop: `1px solid ${THEME_BORDER}` }}>
                <button
                  onClick={handleNewConversation}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 12,
                    background: '#1C1C1E', color: 'white', border: 'none',
                    fontSize: 13, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  <FiPlus size={14} /> NEW SESSION
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Form Modal Portal - Renders outside stacking context */}
      {pausedInfo.isPaused && pausedInfo.nodeType === 'form_node' && (
        <>
          {/* Modal Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(2px)',
              zIndex: 90,
            }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-45%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.8, x: '-50%', y: '-45%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              zIndex: 95,
              width: '90%',
              maxWidth: 600,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              background: '#FFFFFF',
              borderRadius: 24,
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0,0,0,0.05)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '24px 24px 16px',
              borderBottom: `1px solid ${THEME_BORDER}`,
              background: '#FAFBFC',
              flexShrink: 0
            }}>
              <div style={{
                fontSize: 14,
                fontWeight: 900,
                color: THEME_TEXT,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <FiEdit size={16} color={THEME_ACCENT} /> {pausedInfo.nodeConfig?.form_title || 'Information Required'}
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div style={{
              padding: '24px',
              overflow: 'auto',
              flex: 1,
              overscrollBehavior: 'contain'
            }}>
              <FormRenderer
                config={pausedInfo.nodeConfig || {}}
                context={pausedInfo.context || {}}
                isLoading={running}
                onSubmit={(data) => onResume(data)}
              />
            </div>
          </motion.div>
        </>
      )}

      <div style={{
        padding: '12px 24px 12px',
        background: 'linear-gradient(to top, #FFFFFF 0%, rgba(255,255,255,0.8) 100%)',
        backdropFilter: 'blur(20px)',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        pointerEvents: 'none', // Let clicks through the transparent part
        display: (pausedInfo.isPaused && pausedInfo.nodeType === 'form_node') ? 'none' : 'block'
      }}>
        <div style={{ maxWidth: 840, margin: '0 auto', position: 'relative', pointerEvents: 'auto' }}>
          {pausedInfo.isPaused && pausedInfo.nodeType !== 'form_node' ? (
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
                      border: `1px solid ${THEME_SECONDARY}40`,
                      padding: 24,
                      boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
                      zIndex: 1000,
                      backdropFilter: 'blur(12px)'
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 900, color: THEME_ACCENT, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiEdit size={14} /> REWORK PARAMETERS
                    </div>
                    <textarea
                      value={reworkFeedback}
                      onChange={(e) => setReworkFeedback(e.target.value)}
                      placeholder="Specify the adjustments needed..."
                      disabled={running}
                      style={{
                        width: '100%',
                        minHeight: 120,
                        padding: 16,
                        borderRadius: 16,
                        border: `1px solid ${THEME_BORDER}`,
                        fontSize: 15,
                        fontFamily: 'inherit',
                        outline: 'none',
                        resize: 'none',
                        background: running ? '#FFFFFF' : '#F9FAFB',
                        color: THEME_TEXT,
                        lineHeight: 1.6,
                        opacity: running ? 0.5 : 1,
                        transition: 'all 0.3s ease'
                      }}
                    />
                    <div style={{ display: 'flex', gap: 20, marginTop: 18, opacity: running ? 0.5 : 1, pointerEvents: running ? 'none' : 'auto' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={pausedInfo.includeOriginalOutput ?? true}
                          onChange={(e) => setPausedInfo({ ...pausedInfo, includeOriginalOutput: e.target.checked })}
                          style={{ accentColor: THEME_SECONDARY, width: 18, height: 18 }}
                        />
                        Include reference
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={pausedInfo.injectFeedback ?? true}
                          onChange={(e) => setPausedInfo({ ...pausedInfo, injectFeedback: e.target.checked })}
                          style={{ accentColor: THEME_SECONDARY, width: 18, height: 18 }}
                        />
                        Inject context
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
                      <button
                        onClick={() => !running && onResume('rework')}
                        disabled={running}
                        style={{
                          flex: 1,
                          padding: '14px 20px',
                          borderRadius: 12,
                          background: running ? '#F1F5F9' : THEME_ACCENT,
                          border: 'none',
                          fontWeight: 800,
                          fontSize: 13,
                          cursor: running ? 'wait' : 'pointer',
                          color: running ? '#94A3B8' : '#FFFFFF',
                          transition: 'all 0.4s cubic-bezier(0.19, 1, 0.22, 1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 10,
                          boxShadow: running ? 'none' : '0 10px 20px rgba(142, 119, 187, 0.2)'
                        }}
                      >
                        {running ? (
                          <>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}>
                              <FiRotateCcw size={14} />
                            </motion.div>
                            TRANSMITTING FEEDBACK...
                          </>
                        ) : (
                          <>✓ SUBMIT ADJUSTMENTS</>
                        )}
                      </button>
                      {!running && (
                        <button
                          onClick={() => setPausedInfo({ ...pausedInfo, showReworkForm: false })}
                          style={{ padding: '14px 24px', borderRadius: 12, background: '#F1F5F9', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#475569', transition: 'all 0.2s' }}
                        >
                          CANCEL
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{
                display: 'flex',
                gap: 10,
                background: '#FFFFFF',
                padding: 10,
                borderRadius: 24,
                border: `1px solid ${THEME_BORDER}`,
                boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                opacity: running ? 0.6 : 1,
                pointerEvents: running ? 'none' : 'auto',
                transition: 'all 0.4s cubic-bezier(0.19, 1, 0.22, 1)'
              }}>
                {(pausedInfo.enabledActions || ['approve', 'rework', 'reject']).includes('approve') && (
                  <button
                    onClick={() => onResume('approve')}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: 16,
                      background: THEME_ACCENT,
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
                      boxShadow: '0 4px 12px rgba(142, 119, 187, 0.2)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(142, 119, 187, 0.3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(142, 119, 187, 0.2)'; }}
                  >
                    <FiCheck size={18} /> Approve
                  </button>
                )}
                {(pausedInfo.enabledActions || ['approve', 'rework', 'reject']).includes('rework') && (
                  <button
                    onClick={() => setPausedInfo({ ...pausedInfo, showReworkForm: !pausedInfo.showReworkForm })}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: 16,
                      background: pausedInfo.showReworkForm ? '#1C1C1E' : '#F3F4F6',
                      color: pausedInfo.showReworkForm ? '#FFFFFF' : '#475569',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = pausedInfo.showReworkForm ? '#000000' : '#E5E7EB'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = pausedInfo.showReworkForm ? '#1C1C1E' : '#F3F4F6'; }}
                  >
                    <FiEdit size={16} /> {pausedInfo.showReworkForm ? 'Collapse' : 'Edit'}
                  </button>
                )}
                {(pausedInfo.enabledActions || ['approve', 'rework', 'reject']).includes('reject') && (
                  <button
                    onClick={() => window.confirm('Terminate orchestration?') && onResume('reject')}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: 16,
                      background: '#FFFFFF',
                      color: '#F87171',
                      border: '1px solid #FEE2E2',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
                  >
                    <FiTrash size={16} /> Stop
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', pointerEvents: 'auto' }}>
              {/* 🖱️ BRANDED BUTTON TRIGGERS (ALWAYS VISIBLE IN TRIGGER-ONLY MODE) */}
              {canRun && !running && (hasButtonTriggers || (hasOcrNodes && !isChatStarted)) && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: hideInput ? 10 : 4,
                  padding: '0 4px',
                  justifyContent: hideInput ? 'center' : 'flex-start'
                }}>
                  {nodes
                    .filter(n => n.data?.type === 'button_trigger')
                    .map(btnNode => (
                      <motion.button
                        key={btnNode.id}
                        whileHover={{ scale: 1.05, translateY: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSend(btnNode.data?.button_input || 'Start')}
                        style={{
                          padding: hideInput ? '14px 28px' : '6px 14px',
                          borderRadius: hideInput ? 16 : 20,
                          background: hideInput ? THEME_ACCENT : 'rgba(142, 119, 187, 0.08)',
                          border: hideInput ? `1px solid ${THEME_ACCENT}` : '1px solid rgba(142, 119, 187, 0.2)',
                          color: hideInput ? '#FFFFFF' : '#554488',
                          fontSize: hideInput ? 13 : 11,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          transition: 'all 0.2s',
                          boxShadow: hideInput ? '0 10px 20px rgba(142, 119, 187, 0.3)' : 'none'
                        }}
                      >
                        <FiZap size={hideInput ? 14 : 12} color={hideInput ? '#FFFFFF' : 'inherit'} />
                        {btnNode.data?.button_label || btnNode.data?.label || 'Run'}
                      </motion.button>
                    ))}

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

              {!hideInput && (
                <div style={{
                  position: 'relative',
                  background: '#F9FAFB',
                  borderRadius: 24,
                  padding: '4px 12px',
                  border: `1px solid ${THEME_BORDER}`,
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease, border-radius 0.3s ease'
                }} id="input-container">
                  {/* VFS Quick Access Icon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      onClick={() => {
                        const daNode = nodes.find(n => n.data?.type === 'deep_agent');
                        setVfsTarget({ rootDir: daNode?.data?.deep_agent_root_dir || './mnt/deep_agents' });
                      }}
                      title="Open Virtual Filesystem"
                      style={{
                        width: 36, height: 36, border: 'none', background: 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#9CA3AF', transition: 'all 0.2s',
                        borderRadius: 10,
                        position: 'relative'
                      }}
                    >
                      <FiFolder size={18} />
                      {artifactCount > 0 && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: 'absolute', top: 2, right: 2, background: THEME_ACCENT, color: 'white', fontSize: '9px', fontWeight: 900, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(142, 119, 187, 0.4)', border: '2px solid #F9FAFB', pointerEvents: 'none' }}>
                          {artifactCount}
                        </motion.div>
                      )}
                    </button>

                    {hasOcrNodes && (
                      <>
                        <label
                          htmlFor="run-panel-file-upload"
                          title="Upload Document / Image"
                          style={{
                            width: 36, height: 36, border: 'none', background: 'transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: '#9CA3AF', transition: 'all 0.2s',
                            borderRadius: 10
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = THEME_ACCENT; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                        >
                          <FiPaperclip size={18} />
                        </label>

                        <div style={{ width: 1, height: 16, background: '#E5E7EB', margin: '0 4px' }} />
                      </>
                    )}
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                    placeholder={running ? 'Synthesizing...' : 'Ask anything'}
                    disabled={running}
                    style={{ flex: 1, padding: '8px 12px', background: 'transparent', border: 'none', color: THEME_TEXT, fontSize: 14, fontWeight: 500, outline: 'none', fontFamily: 'inherit', resize: 'none', minHeight: 20, maxHeight: 120, overflowY: 'auto', lineHeight: '20px' }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 8, paddingRight: 4 }}>
                    {audioPlaying && (
                      <motion.button onClick={stopAudio} style={{ width: 32, height: 32, borderRadius: '50%', background: '#FEE2E2', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiMicOff size={16} />
                      </motion.button>
                    )}
                    <button onClick={onSend} disabled={!input.trim() || running || !canRun} style={{ width: 38, height: 38, borderRadius: '50%', background: (input.trim() && !running && canRun) ? '#1C1C1E' : '#E5E7EB', border: 'none', color: 'white', cursor: (input.trim() && !running && canRun) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FiArrowUp size={20} color="white" />
                    </button>
                  </div>
                </div>
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

// ─────────────────────────────────────────────────────────────
// UNIFIED AGENT TURN (PREMIUM CARDS)
// ─────────────────────────────────────────────────────────────

/**
 * UnifiedAgentTurn
 * Groups intermediate agent steps and the final response into one premium component.
 * Features a large avatar, the agent name, a thread summary, and the main response.
 */
function UnifiedAgentTurn({ finalAgent, intermediateSteps, isLast, running, onRegenerate, nodes = [], onShowVfs }) {
  const [threadExpanded, setThreadExpanded] = useState(false);
  const stepCount = intermediateSteps.length;

  const resolveLabel = (id) => {
    const node = nodes.find(n => n.id === id);
    return node?.data?.label || node?.label || id;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', flexDirection: 'column', gap: 12,
        width: '100%', maxWidth: '100%', marginBottom: 32
      }}
    >
      {/* ── Header Area (Avatar + Name + Thread) ── */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '0 4px' }}>
        {/* Large Avatar */}
        <div style={{
          width: 48, height: 48, borderRadius: 16,
          background: 'linear-gradient(135deg, #1C1C1E 0%, #000000 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${THEME_BORDER}`,
          boxShadow: `0 8px 16px ${THEME_ACCENT}20`,
          position: 'relative',
          flexShrink: 0
        }}>
          <FiCpu size={22} color={THEME_ACCENT} />
          {/* Status Glow */}
          {running && isLast && (
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ position: 'absolute', inset: -2, borderRadius: 18, border: `2px solid ${THEME_ACCENT}` }}
            />
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Final Agent Name */}
          <div style={{
            fontSize: 16, fontWeight: 700, color: THEME_TEXT,
            letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8
          }}>
            {resolveLabel(finalAgent.node) || 'Agent Mesh Orchestrator'}
            {running && isLast && (
              <span style={{
                fontSize: 10, background: THEME_ACCENT, color: '#000',
                padding: '2px 8px', borderRadius: 20, fontWeight: 800
              }}>LIVE</span>
            )}
          </div>

          {/* Thread Summary Summary Row */}
          {stepCount > 0 ? (
            <div
              onClick={() => setThreadExpanded(!threadExpanded)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer', opacity: 0.7, transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
            >
              {/* Mini Avatar Stack */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {intermediateSteps.slice(0, 3).map((s, i) => (
                  <div key={i} style={{
                    width: 16, height: 16, borderRadius: 5,
                    background: '#1C1C1E', border: '1.5px solid white',
                    marginLeft: i === 0 ? 0 : -8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 3 - i,
                  }}>
                    <FiCpu size={8} color={THEME_ACCENT} />
                  </div>
                ))}
              </div>

              <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {stepCount} PREVIOUS STEPS
              </span>

              <FiChevronDown
                size={14}
                style={{
                  color: '#9CA3AF',
                  transform: threadExpanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.3s'
                }}
              />
            </div>
          ) : (
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>
              Autonomous Single-Node Reasoning
            </div>
          )}
        </div>
      </div>

      {/* ── Intermediate Flow (Expanded) ── */}
      <AnimatePresence>
        {threadExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              overflow: 'hidden', padding: '0 0 12px 64px',
              display: 'flex', flexDirection: 'column', gap: 20
            }}
          >
            {intermediateSteps.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* Vertical Line for threading */}
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 10,
                    background: '#1C1C1E', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${THEME_BORDER}`, flexShrink: 0, zIndex: 2
                  }}>
                    <FiCpu size={14} color={THEME_ACCENT} />
                  </div>
                  {idx < intermediateSteps.length - 1 && (
                    <div style={{ width: 1, flex: 1, background: THEME_BORDER, marginTop: 4 }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 800, color: THEME_SECONDARY,
                    textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.02em',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    {resolveLabel(step.node)}
                    <span style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 500 }}>• INTERNAL TURN</span>
                  </div>
                  <div style={{
                    fontSize: 14, color: THEME_TEXT, lineHeight: 1.6,
                    background: '#FFFFFF', padding: '16px 20px',
                    borderRadius: '0 16px 16px 16px', border: `1px solid ${THEME_BORDER}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                  }}>
                    {formatMessage(step.content)}
                  </div>
                </div>
              </div>
            ))}
            <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${THEME_BORDER}, transparent)` }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Answer Content ── */}
      <div style={{ marginLeft: 64, position: 'relative', minWidth: 0, padding: '4px 0' }}>
        <div style={{ fontSize: 15, color: THEME_TEXT, lineHeight: 1.75, fontWeight: 400 }}>
          {formatMessage(finalAgent.content)}
        </div>

        {/* Action Row */}
        {isLast && !running && (
          <div style={{ marginTop: 20, display: 'flex', gap: 12, borderTop: `1px solid ${THEME_BORDER}`, paddingTop: 16 }}>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 14px', borderRadius: 8, border: `1px solid ${THEME_BORDER}`,
                  background: '#FFFFFF', color: '#6B7280', fontSize: 12, cursor: 'pointer',
                  fontWeight: 700, transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = THEME_ACCENT}
                onMouseLeave={e => e.currentTarget.style.borderColor = THEME_BORDER}
              >
                <FiRotateCcw size={13} /> REGENERATE
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// TURN RENDERER
// ─────────────────────────────────────────────────────────────

/**
 * TurnRenderer
 * Groups streamEvents into conversation turns.
 */
function TurnRenderer({ streamEvents, running, removeEventsFromIndex, onSend, nodes = [], onShowVfs }) {
  const turns = [];
  let currentTurn = { user: null, agents: [], logs: [] };

  for (let i = 0; i < streamEvents.length; i++) {
    const evt = streamEvents[i];
    if (evt.type === 'user_message') {
      if (currentTurn.user || currentTurn.agents.length || currentTurn.logs.length) {
        turns.push(currentTurn);
      }
      currentTurn = { user: { ...evt, index: i }, agents: [], logs: [] };
    } else if (evt.type === 'token') {
      currentTurn.agents.push({ ...evt, index: i });
    } else {
      currentTurn.logs.push({ ...evt, index: i });
    }
  }
  turns.push(currentTurn);

  return (
    <>
      {turns.map((turn, tIdx) => {
        const isAbsoluteLastTurn = tIdx === turns.length - 1;
        const intermediateAgents = turn.agents.slice(0, -1);
        const finalAgent = turn.agents[turn.agents.length - 1];

        const userIdx = turn.user?.index ?? -1;

        return (
          <React.Fragment key={tIdx}>
            {/* 1. User Message */}
            {turn.user && (
              <motion.div
                key={`u-${tIdx}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  alignSelf: 'flex-end',
                  maxWidth: '80%',
                  background: THEME_USER_BUBBLE,
                  padding: '14px 22px',
                  borderRadius: '24px 24px 4px 24px',
                  border: `1px solid ${THEME_BORDER}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  margin: '8px 0'
                }}
              >
                <div style={{ fontSize: 15, color: THEME_TEXT, lineHeight: 1.6, fontWeight: 500 }}>
                  {turn.user.content}
                </div>
              </motion.div>
            )}

            {/* 2. Unified Agent Block (Sketch Layout) */}
            {finalAgent && (
              <UnifiedAgentTurn
                key={`unified-${tIdx}`}
                finalAgent={finalAgent}
                intermediateSteps={intermediateAgents}
                isLast={isAbsoluteLastTurn}
                running={running}
                nodes={nodes}
                onShowVfs={onShowVfs}
                onRegenerate={
                  isAbsoluteLastTurn && !running && turn.user
                    ? () => {
                      if (userIdx !== -1 && removeEventsFromIndex) {
                        removeEventsFromIndex(userIdx);
                      }
                      onSend(turn.user.content);
                    }
                    : null
                }
              />
            )}

            {/* 3. Non-token Logs (Charts/System Logs) */}
            {turn.logs.map((evt, idx) => {
              const isArtifact = evt.type === 'tool_result' && typeof evt.content === 'string' &&
                (evt.content.includes('```chart') || evt.content.includes('```mermaid'));

              if (evt.type === 'system_log') {
                // Filter out verbose HITL/Pause logs as requested by user
                const isHitlLog = evt.message?.includes('HUMAN REVIEW REQUIRED') ||
                  evt.content?.includes('Workflow paused at');
                if (isHitlLog) return null;

                return (
                  <motion.div key={`l-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ alignSelf: 'center', background: THEME_GRAY, border: `1px solid ${THEME_BORDER}`, padding: '10px 18px', borderRadius: 14, fontSize: 12, color: '#6B7280', display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '85%', margin: '12px 0' }}>
                    <div style={{ fontWeight: 800, color: THEME_SECONDARY, fontSize: 10, textTransform: 'uppercase' }}>{evt.message}</div>
                    {evt.content && <div style={{ color: THEME_TEXT, opacity: 0.8 }}>{evt.content}</div>}
                  </motion.div>
                );
              }

              if (isArtifact) {
                return (
                  <motion.div key={`art-${idx}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ alignSelf: 'stretch', width: '100%', maxWidth: 840, margin: '14px auto' }}>
                    {formatMessage(evt.content)}
                  </motion.div>
                );
              }
              return null;
            })}
          </React.Fragment>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// HELPER COMPONENTS FOR HITL MINIMAL DESIGN
// ─────────────────────────────────────────────────────────────

/**
 * ActionButtonGroup - Dynamically renders available HITL actions
 */
function ActionButtonGroup({ actions, onApprove, onRework, onReject, isLoading }) {
  const hasApprove = actions.includes('approve');
  const hasRework = actions.includes('rework');
  const hasReject = actions.includes('reject');

  // Calculate columns based on number of actions
  const cols = (hasApprove + hasRework + hasReject);
  const gridTemplate = cols === 1 ? '1fr' : cols === 2 ? '1fr 1fr' : '1fr 1fr 1fr';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: gridTemplate,
      gap: 10
    }}>
      {hasApprove && (
        <MinimalButton
          label="Approve"
          variant="primary"
          onClick={onApprove}
          disabled={isLoading}
        />
      )}
      {hasRework && (
        <MinimalButton
          label="Edit"
          variant="secondary"
          onClick={onRework}
          disabled={isLoading}
        />
      )}
      {hasReject && (
        <MinimalButton
          label="Discard"
          variant="danger"
          onClick={onReject}
          disabled={isLoading}
        />
      )}
    </div>
  );
}

/**
 * MinimalButton - Clean, minimal button design
 */
function MinimalButton({ label, variant = 'primary', onClick, disabled }) {
  const variants = {
    primary: { bg: THEME_SECONDARY, text: 'white', hover: '#4F46E5' },
    secondary: { bg: '#F1F5F9', text: '#475569', hover: '#E2E8F0' },
    danger: { bg: '#FEF2F2', text: '#991B1B', hover: '#FEE2E2' }
  };

  const style = variants[variant] || variants.primary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 16px',
        borderRadius: 8,
        background: style.bg,
        border: 'none',
        color: style.text,
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.6 : 1
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = style.hover;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = style.bg;
      }}
    >
      {label}
    </button>
  );
}

/**
 * ActionButton - Redesigned button with tooltip and color variants
 */
function ActionButton({ label, color, onClick, disabled, tooltip }) {
  const colors = {
    green: { bg: THEME_ACCENT, hover: '#7A64A9', text: '#FFFFFF' },
    blue: { bg: THEME_SECONDARY, hover: '#4F46E5', text: 'white' },
    red: { bg: '#EF4444', hover: '#DC2626', text: 'white' }
  };

  const style = colors[color] || colors.green;

  return (
    <div style={{ position: 'relative', group: true }}>
      <button
        onClick={onClick}
        disabled={disabled}
        title={tooltip}
        style={{
          width: '100%',
          padding: '14px 16px',
          borderRadius: 12,
          background: style.bg,
          border: 'none',
          color: style.text,
          fontSize: 13,
          fontWeight: 700,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.6 : 1,
          transform: 'scale(1)'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = style.hover;
            e.currentTarget.style.transform = 'scale(1.02)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = style.bg;
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {label}
      </button>
      {tooltip && (
        <div style={{
          position: 'absolute',
          bottom: '-32px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#111827',
          color: 'white',
          padding: '6px 12px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.15s',
          zIndex: 100
        }}
          onMouseEnter={(e) => e.parentElement.querySelector('button').style.opacity = 0}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}

/**
 * ReworkFormPanel - Form for providing feedback on rework
 */
function ReworkFormPanel({ feedback, onChange, includeOriginal, setIncludeOriginal, injectFeedback, setInjectFeedback, onSubmit, onCancel, isLoading }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 700,
          color: '#6B7280',
          marginBottom: 10,
          textTransform: 'uppercase'
        }}>
          📝 Your Feedback
        </label>
        <textarea
          value={feedback}
          onChange={(e) => onChange(e.target.value)}
          placeholder="What would you like the agent to adjust? (e.g., 'Focus more on recent developments' or 'Include cost analysis')"
          style={{
            width: '100%',
            minHeight: 120,
            padding: 14,
            borderRadius: 8,
            border: '1px solid #E5E7EB',
            background: '#F9FAFB',
            fontSize: 13,
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            lineHeight: 1.5
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = THEME_SECONDARY;
            e.currentTarget.style.background = '#FFFFFF';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = THEME_BORDER;
            e.currentTarget.style.background = '#F9FAFB';
          }}
        />
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
          {feedback.length} / 500 characters
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={includeOriginal}
            onChange={(e) => setIncludeOriginal(e.target.checked)}
            style={{
              width: 16,
              height: 16,
              cursor: 'pointer',
              accentColor: THEME_SECONDARY
            }}
          />
          <span style={{ fontSize: 12, color: '#6B7280' }}>Include original output for reference</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={injectFeedback}
            onChange={(e) => setInjectFeedback(e.target.checked)}
            style={{
              width: 16,
              height: 16,
              cursor: 'pointer',
              accentColor: '#2563EB'
            }}
          />
          <span style={{ fontSize: 12, color: '#6B7280' }}>Inject feedback into next prompt</span>
        </label>
      </div>

      <div style={{ display: 'flex', gap: 12, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
        <button
          onClick={onCancel}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #E5E7EB',
            background: 'white',
            color: '#6B7280',
            fontSize: 13,
            fontWeight: 700,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F9FAFB';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
          }}
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            background: THEME_SECONDARY,
            border: 'none',
            color: 'white',
            fontSize: 13,
            fontWeight: 700,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = '#4F46E5';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = THEME_SECONDARY;
          }}
        >
          {isLoading ? 'Submitting...' : '✓ Submit Rework'}
        </button>
      </div>
    </div>
  );
}

/**
 * DetailRow - Displays a label/value pair, optionally with copy button
 */
function DetailRow({ label, value, copyable }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'white',
        padding: '8px 12px',
        borderRadius: 6,
        border: '1px solid #E5E7EB'
      }}>
        <code style={{
          flex: 1,
          fontSize: 11,
          color: '#1F2937',
          fontWeight: 600,
          wordBreak: 'break-all',
          fontFamily: '"Monaco", "Menlo", monospace'
        }}>
          {value}
        </code>
        {copyable && (
          <button
            onClick={handleCopy}
            title="Copy to clipboard"
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid #E5E7EB',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 600,
              color: '#6B7280',
              transition: 'all 0.15s',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F3F4F6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {copied ? '✓' : '📋'}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * FormRenderer - Renders a dynamic form based on node configuration
 */
function FormRenderer({ config, context, onSubmit, isLoading }) {
  const [formData, setFormData] = React.useState({});
  const [errors, setErrors] = React.useState({});

  // 🕵️ DYNAMIC SCHEMA RESOLUTION (Apr 21, 2026)
  // If 'form_use_context_schema' is enabled, we override static fields with context.form_schema
  const finalConfig = React.useMemo(() => {
    if (config.form_use_context_schema && context.form_schema && Array.isArray(context.form_schema)) {
      return { ...config, form_fields: context.form_schema };
    }
    return config;
  }, [config, context.form_schema]);

  const validate = () => {
    const newErrors = {};
    const fields = finalConfig.form_fields || [];
    fields.forEach(f => {
      const val = formData[f.id];
      const isEmpty = !val || (Array.isArray(val) && val.length === 0);
      if (f.type !== 'remark' && f.required && isEmpty) {
        newErrors[f.id] = 'This field is required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const updateField = (id, val) => {
    setFormData(prev => ({ ...prev, [id]: val }));
    if (errors[id]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  // 🧪 DYNAMIC OPTION RESOLUTION
  const resolveOptions = React.useCallback((rawOptions) => {
    if (!Array.isArray(rawOptions)) return [];
    
    let resolved = [];
    rawOptions.forEach(opt => {
      const optStr = typeof opt === 'string' ? opt : (opt.value || '');
      const match = optStr.match(/^{{(.+)}}$/);
      if (match) {
        const varName = match[1].trim();
        const value = context[varName];
        if (Array.isArray(value)) {
          resolved = [...resolved, ...value];
        } else if (value !== undefined) {
          resolved.push(value);
        } else {
          resolved.push(opt);
        }
      } else {
        resolved.push(opt);
      }
    });
    return [...new Set(resolved)].filter(v => v !== null && v !== undefined && String(v).trim() !== '');
  }, [context]);

  // 🎯 Auto-initialize default values and first-option selection
  React.useEffect(() => {
    const initial = {};
    const fields = finalConfig.form_fields || [];
    fields.forEach(f => {
      // 1. Try default_value from config first
      if (f.default_value !== undefined && f.default_value !== null && f.default_value !== '') {
        initial[f.id] = f.default_value;
      } 
      // 2. For dropdowns, if mandatory and no default, pulse the first option into state
      else if (f.type === 'select' && f.required) {
        const options = resolveOptions(f.options);
        if (options.length > 0) {
          const firstOpt = options[0];
          initial[f.id] = typeof firstOpt === 'string' ? firstOpt : (firstOpt.value || '');
        }
      }
      // 3. For multiselect/checkboxes, initialize with empty array
      else if (f.type === 'multiselect' || f.type === 'checkbox') {
        initial[f.id] = f.default_value || [];
      }
    });
    setFormData(initial);
  }, [finalConfig, resolveOptions]);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {finalConfig.form_description && (
        <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 4 }}>
          {finalConfig.form_description}
        </div>
      )}

      {(finalConfig.form_fields || []).map((f) => (
        <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {f.type !== 'remark' && (
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
              {f.label} {f.required && <span style={{ color: '#EF4444' }}>*</span>}
            </label>
          )}

          {f.type === 'textarea' ? (
            <textarea
              value={formData[f.id] || ''}
              onChange={(e) => updateField(f.id, e.target.value)}
              placeholder={`Enter ${f.label?.toLowerCase() || ''}...`}
              disabled={isLoading}
              style={{
                width: '100%', minHeight: 100, padding: '12px 14px', borderRadius: 10,
                border: `1px solid ${errors[f.id] ? '#EF4444' : '#E5E7EB'}`,
                background: '#F9FAFB', fontSize: 13, fontFamily: 'inherit', outline: 'none',
                resize: 'vertical'
              }}
            />
          ) : f.type === 'select' ? (
            <select
              value={formData[f.id] || ''}
              onChange={(e) => updateField(f.id, e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${errors[f.id] ? '#EF4444' : '#E5E7EB'}`,
                background: '#F9FAFB', fontSize: 13, outline: 'none'
              }}
            >
              {!f.required && <option value="">— Select an option —</option>}
              {resolveOptions(f.options).map(opt => {
                const optValue = typeof opt === 'string' ? opt : opt.value;
                const optLabel = typeof opt === 'string' ? opt : opt.label;
                return <option key={optValue} value={optValue}>{optLabel}</option>;
              })}
            </select>
          ) : f.type === 'multiselect' ? (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 10,
              background: '#F9FAFB', padding: '12px 14px', borderRadius: 10,
              border: `1px solid ${errors[f.id] ? '#EF4444' : '#E5E7EB'}`,
              maxHeight: 200, overflowY: 'auto'
            }}>
              {resolveOptions(f.options).map(opt => {
                const optValue = typeof opt === 'string' ? opt : opt.value;
                const optLabel = typeof opt === 'string' ? opt : opt.label;
                const isChecked = (formData[f.id] || []).includes(optValue);
                return (
                  <label key={optValue} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'all 0.2s' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const current = formData[f.id] || [];
                        const next = e.target.checked
                          ? [...current, optValue]
                          : current.filter(v => v !== optValue);
                        updateField(f.id, next);
                      }}
                      disabled={isLoading}
                      style={{ width: 17, height: 17, accentColor: THEME_SECONDARY, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 13, color: isChecked ? THEME_TEXT : '#6B7280', fontWeight: isChecked ? 600 : 400 }}>{optLabel}</span>
                  </label>
                );
              })}
            </div>
          ) : f.type === 'boolean' ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!formData[f.id]}
                onChange={(e) => updateField(f.id, e.target.checked)}
                disabled={isLoading}
                style={{ width: 18, height: 18, accentColor: THEME_SECONDARY }}
              />
              <span style={{ fontSize: 13, color: '#4B5563' }}>{f.label}</span>
            </label>
          ) : f.type === 'rating' ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0' }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isSelected = star <= (formData[f.id] || 0);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => updateField(f.id, star)}
                    disabled={isLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      padding: 0,
                      color: isSelected ? '#F59E0B' : '#D1D5DB',
                      transition: 'transform 0.1s ease, color 0.1s ease',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(1.2)'; }}
                    onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(1.0)'; }}
                  >
                    <FiStar size={26} fill={isSelected ? '#F59E0B' : 'none'} strokeWidth={2} />
                  </button>
                );
              })}
              {formData[f.id] > 0 && (
                <span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', marginLeft: 8 }}>
                  {formData[f.id]} / 5
                </span>
              )}
            </div>
          ) : f.type === 'email' || f.type === 'password' || f.type === 'number' ? (
            <input
              type={f.type}
              value={formData[f.id] || ''}
              onChange={(e) => updateField(f.id, e.target.value)}
              placeholder={f.placeholder || `Enter ${f.label?.toLowerCase() || ''}...`}
              disabled={isLoading}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: `1px solid ${errors[f.id] ? '#EF4444' : '#E5E7EB'}`,
                background: '#F9FAFB', fontSize: 13, fontFamily: 'inherit', outline: 'none'
              }}
            />
          ) : f.type === 'remark' ? (
            <div style={{
              fontSize: 13,
              color: '#4B5563',
              lineHeight: 1.6,
              background: '#F3F4F6',
              padding: '12px 14px',
              borderRadius: 10,
              borderLeft: `4px solid ${THEME_ACCENT}`,
              whiteSpace: 'pre-wrap'
            }}>
              {f.content || '...'}
            </div>
          ) : (
            <input
              type={f.type || 'text'}
              value={formData[f.id] || ''}
              onChange={(e) => updateField(f.id, e.target.value)}
              placeholder={f.placeholder || `Enter ${f.label?.toLowerCase() || ''}...`}
              disabled={isLoading}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${errors[f.id] ? '#EF4444' : '#E5E7EB'}`,
                background: '#F9FAFB', fontSize: 13, outline: 'none'
              }}
            />
          )}

          {f.type !== 'remark' && errors[f.id] && (
            <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}>{errors[f.id]}</div>
          )}
        </div>
      ))}

      <div style={{ marginTop: 12, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: isLoading ? '#E5E7EB' : THEME_ACCENT,
            color: 'white', border: 'none', fontWeight: 800, fontSize: 13,
            cursor: isLoading ? 'wait' : 'pointer',
            boxShadow: isLoading ? 'none' : '0 10px 20px rgba(142, 119, 187, 0.2)',
            transition: 'all 0.2s'
          }}
        >
          {isLoading ? 'PROCESSING...' : (finalConfig.form_submit_label || 'SUBMIT')}
        </button>
      </div>
    </form>
  );
}
