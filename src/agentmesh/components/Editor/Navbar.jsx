import React from 'react';
import toast from 'react-hot-toast';
import { useWorkflowStore, useUIStore } from '../../store';
import { compileWorkflow, saveWorkflow, listWorkflowCategories, deleteWorkflow, explainWorkflow, getWorkflow, cloneWorkflow, fixGrammar, publishWorkflow, getMarketplaceUsecase } from '../../api/agentmesh';
import { FiUpload, FiDownload, FiPlus, FiX, FiCheck, FiAlertTriangle, FiCopy, FiChevronDown, FiChevronUp, FiBookOpen, FiZap, FiLoader, FiTrash2, FiInfo, FiMaximize2, FiMinimize2, FiShare2, FiSave } from 'react-icons/fi';
import { HugeiconsIcon } from '@hugeicons/react';
import { AiMagicIcon } from '@hugeicons/core-free-icons';
import { formatMessage } from '../Common/messageFormatting';
import ConfirmationModal from '../Common/ConfirmationModal';
import SaveWorkflowTemplateModal from './SaveWorkflowTemplateModal';
import { copyToClipboard } from '../../utils/copyToClipboard';

function TooltipWrapper({ text, children }) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 240,
          background: '#1E293B',
          color: 'white',
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 400,
          lineHeight: '1.4',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 100000,
          pointerEvents: 'none',
          whiteSpace: 'normal',
          textAlign: 'left'
        }}>
          {text}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderStyle: 'solid',
            borderWidth: '6px 6px 0 6px',
            borderColor: '#1E293B transparent transparent transparent'
          }} />
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const {
    workflowName, workflowDescription, workflowGroup, workflowCategory, globalErrorNode, dynamicResumption, warmup, autoNewSession, setWorkflowMeta, workflowId,
    buildConfig, newWorkflow, isDirty, isCompiled, importWorkflow, markClean, markCompiled, loadWorkflowIntoEditor,
    nodes, edges, listSearch, setListSearch, createdAt, updatedAt
  } = useWorkflowStore();
  const {
    activePage,
    managementSearch, setManagementSearch,
    managementWfFilter, setManagementWfFilter,
    triggerRefresh,
    showManagementModal, setShowManagementModal,
    isSyncing, setIsSyncing,
    showNotes, toggleNotes,
    showNotifications, setShowNotifications, unreadCount
  } = useUIStore();
  const workflows = useWorkflowStore(s => s.workflows);
  const [saving, setSaving] = React.useState(false);
  const [compiling, setCompiling] = React.useState(false);
  const [cloning, setCloning] = React.useState(false);
  const [status, setStatus] = React.useState(null); // 'saved' | 'compiled' | 'err'
  const [errMsg, setErrMsg] = React.useState('');
  const [editingName, setEditingName] = React.useState(false);
  const [editingDesc, setEditingDesc] = React.useState(false);
  const [metaDropdownOpen, setMetaDropdownOpen] = React.useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = React.useState('general');
  const metaDropdownRef = React.useRef(null);
  const metaTriggerRef = React.useRef(null);
  const [showImport, setShowImport] = React.useState(false);
  const [importText, setImportText] = React.useState('');
  const [importErr, setImportErr] = React.useState(null);
  const [copiedId, setCopiedId] = React.useState(false);
  const [categories, setCategories] = React.useState([]);
  const [fixingDesc, setFixingDesc] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [ioDropdownOpen, setIoDropdownOpen] = React.useState(false);
  const ioDropdownRef = React.useRef(null);
  const ioTriggerRef = React.useRef(null);

  const [showPublishModal, setShowPublishModal] = React.useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = React.useState(false);
  const [publishTags, setPublishTags] = React.useState('');
  const [publishing, setPublishing] = React.useState(false);
  const [useWorkflowMeta, setUseWorkflowMeta] = React.useState(true);
  const [customMarketplaceName, setCustomMarketplaceName] = React.useState('');
  const [customMarketplaceDesc, setCustomMarketplaceDesc] = React.useState('');
  const [launchMode, setLaunchMode] = React.useState('default');
  const [customLaunchUrl, setCustomLaunchUrl] = React.useState('');
  const [currentVersion, setCurrentVersion] = React.useState(null);
  const [showMetadataPrompt, setShowMetadataPrompt] = React.useState(false);
  const [promptName, setPromptName] = React.useState('');
  const [promptDesc, setPromptDesc] = React.useState('');
  const [promptGroup, setPromptGroup] = React.useState('Default');
  const [promptCategory, setPromptCategory] = React.useState('General');
  const [validationError, setValidationError] = React.useState(null);

  React.useEffect(() => {
    if (showMetadataPrompt) {
      setPromptName(workflowName === 'Untitled Workflow' ? '' : workflowName);
      setPromptDesc(workflowDescription || '');
      setPromptGroup(workflowGroup || 'Default');
      setPromptCategory(workflowCategory || 'General');
      setValidationError(null);
    }
  }, [showMetadataPrompt, workflowName, workflowDescription, workflowGroup, workflowCategory]);

  React.useEffect(() => {
    if (workflowName) setCustomMarketplaceName(workflowName);
    if (workflowDescription) setCustomMarketplaceDesc(workflowDescription);
  }, [workflowName, workflowDescription]);

  const handlePublish = async () => {
    if (!workflowId) return;
    setPublishing(true);
    try {
      const tagsList = publishTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      await publishWorkflow(workflowId, {
        tags: tagsList,
        marketplace_name: useWorkflowMeta ? null : customMarketplaceName,
        marketplace_description: useWorkflowMeta ? null : customMarketplaceDesc,
        launch_url: launchMode === 'default' ? null : customLaunchUrl
      });
      setStatus('compiled');
      setShowPublishModal(false);
      setPublishTags('');
      alert('Workflow successfully published to Marketplace!');
    } catch (e) {
      alert('Failed to publish workflow: ' + e.message);
    } finally {
      setPublishing(false);
    }
  };

  // --- AI Workflow Architect States ---
  const [showArchitect, setShowArchitect] = React.useState(false);
  const [architectExpanded, setArchitectExpanded] = React.useState(false);
  const [architectExplanation, setArchitectExplanation] = React.useState('');
  const [explaining, setExplaining] = React.useState(false);
  const [architectError, setArchitectError] = React.useState('');
  const [copiedExplanation, setCopiedExplanation] = React.useState(false);
  const [savedToNotes, setSavedToNotes] = React.useState(false);
  const [savingNote, setSavingNote] = React.useState(false);

  React.useEffect(() => {
    setArchitectExplanation('');
    setArchitectError('');
  }, [workflowId]);

  const handleGenerateExplanation = async () => {
    setExplaining(true);
    setArchitectError('');
    setArchitectExplanation('');
    setSavedToNotes(false);
    
    // Prepare optimized workflow data
    const workflowPayload = {
      id: workflowId,
      name: workflowName,
      description: workflowDescription,
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        data: {
          type: n.data?.type,
          label: n.data?.label,
          task: n.data?.task,
          description: n.data?.description,
          tools: n.data?.tools,
          poller_tool: n.data?.poller_tool,
          cron_expression: n.data?.cron_expression,
          webhook_path: n.data?.webhook_path
        }
      })),
      edges: (edges || []).map(e => ({
        source: e.source,
        target: e.target,
        data: {
          condition: e.data?.condition
        }
      }))
    };

    try {
      const cachedProvider = localStorage.getItem('architect_provider') || 'groq';
      const cachedModel = localStorage.getItem('architect_model') || 'llama-3.3-70b-versatile';
      const cachedTemp = localStorage.getItem('architect_temperature') || '0.2';
      const cachedKey = localStorage.getItem('architect_api_key') || '';
      const activeLlm = {
        provider: cachedProvider,
        model: cachedModel,
        temperature: parseFloat(cachedTemp),
        api_key_override: cachedKey
      };
      const res = await explainWorkflow(workflowPayload, activeLlm);
      if (res.status === 'success') {
        setArchitectExplanation(res.explanation);
      } else {
        setArchitectError(res.message || 'Failed to generate summary.');
      }
    } catch (err) {
      setArchitectError(err.message || 'Failed to connect to backend.');
    } finally {
      setExplaining(false);
    }
  };

  const handleCopyExplanation = () => {
    copyToClipboard(architectExplanation);
    setCopiedExplanation(true);
    setTimeout(() => setCopiedExplanation(false), 2000);
  };

  const handleSaveToNotes = async () => {
    setSavingNote(true);
    try {
      const { createWorkflowNote } = await import('../../api/agentmesh');
      await createWorkflowNote(workflowId, architectExplanation, 'Architect');
      setSavedToNotes(true);
    } catch (err) {
      alert('Failed to save to notes: ' + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  React.useEffect(() => {
    listWorkflowCategories().then(res => {
      if (res.status === 'success') setCategories(res.categories);
    }).catch(console.error);
  }, []);

  const handleImport = () => {
    try {
      const cfg = JSON.parse(importText);
      importWorkflow(cfg);
      setShowImport(false);
      setImportText('');
      setImportErr(null);
    } catch (e) {
      setImportErr(e.message);
    }
  };

  const handleExport = () => {
    try {
      const config = buildConfig();
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(workflowName || 'workflow').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed: ' + e.message);
    }
  };

  const handleSave = async () => {
    setSaving(true); setStatus(null); setErrMsg('');
    try {
      const config = buildConfig();
      if (!config.nodes.length) {
        setStatus('err'); setErrMsg('Add at least one node before saving.');
        return;
      }
      await saveWorkflow(config);
      setStatus('saved');
      markClean();
    } catch (e) {
      if (e.status === 409) {
        toast.error(e.message);
      } else {
        setStatus('err');
        setErrMsg(e.message || 'Save failed');
      }
    } finally {
      setSaving(false);
      setTimeout(() => { setStatus(null); setErrMsg(''); }, 3000);
    }
  };

  const handleSaveMetadataAndCompile = async (e) => {
    e.preventDefault();
    setValidationError(null);
    const cleanName = promptName.trim();
    const cleanDesc = promptDesc.trim();
    const cleanGroup = promptGroup.trim();
    const cleanCategory = promptCategory;

    if (!cleanName) {
      setValidationError('Workflow Name is required');
      return;
    }
    if (cleanName.toLowerCase() === 'untitled workflow') {
      setValidationError('Please enter a custom Workflow Name');
      return;
    }
    if (!cleanDesc) {
      setValidationError('Workflow Description is required');
      return;
    }

    setWorkflowMeta(
      workflowId,
      cleanName,
      cleanDesc,
      cleanGroup || 'Default',
      cleanCategory,
      globalErrorNode,
      dynamicResumption,
      warmup,
      autoNewSession
    );
    setShowMetadataPrompt(false);

    setCompiling(true); setStatus(null); setErrMsg('');
    try {
      const config = buildConfig();
      config.name = cleanName;
      config.description = cleanDesc;
      config.group = cleanGroup || 'Default';
      config.category = cleanCategory;

      await compileWorkflow(config);
      setStatus('compiled');
      markCompiled();
      toast.success('Workflow saved and compiled successfully!');
    } catch (err) {
      if (err.status === 409) {
        toast.error(err.message);
      } else {
        setStatus('err');
        setErrMsg(err.message || 'Compile failed');
      }
    } finally {
      setCompiling(false);
      setTimeout(() => { setStatus(null); setErrMsg(''); }, 4000);
    }
  };

  const handleSaveDropdownMetaAndCompile = async () => {
    if (!workflowName || workflowName.trim().toLowerCase() === 'untitled workflow') {
      toast.error('Please enter a custom Workflow Name');
      return;
    }
    if (!workflowDescription || !workflowDescription.trim()) {
      toast.error('Workflow Description is required');
      return;
    }
    setMetaDropdownOpen(false);
    await handleCompile();
  };

  const handleCompile = async () => {
    const isNameInvalid = !workflowName || workflowName.trim().toLowerCase() === 'untitled workflow';
    const isDescInvalid = !workflowDescription || !workflowDescription.trim();

    if (isNameInvalid || isDescInvalid) {
      setShowMetadataPrompt(true);
      return;
    }

    setCompiling(true); setStatus(null); setErrMsg('');
    try {
      const config = buildConfig();
      if (!config.nodes.length) {
        setStatus('err'); setErrMsg('Add at least one node before compiling.');
        return;
      }
      await compileWorkflow(config);
      setStatus('compiled');
      markCompiled();
    } catch (e) {
      if (e.status === 409) {
        toast.error(e.message);
      } else {
        setStatus('err');
        setErrMsg(e.message || 'Compile failed');
      }
    } finally {
      setCompiling(false);
      setTimeout(() => { setStatus(null); setErrMsg(''); }, 4000);
    }
  };

  const handleDelete = async () => {
    if (!workflowId) return;
    try {
      await deleteWorkflow(workflowId);
      newWorkflow(); // Clear the canvas after deletion
    } catch (e) {
      alert('Failed to delete workflow: ' + e.message);
    }
  };

  const handleClone = async () => {
    if (!workflowId) return;
    setCloning(true);
    try {
      const res = await cloneWorkflow(workflowId);
      if (res && res.status === 'success') {
        const full = await getWorkflow(res.workflow_id);
        if (full) {
          loadWorkflowIntoEditor(full);
          setMetaDropdownOpen(false);
          setStatus('saved');
        }
      }
    } catch (e) {
      alert('Failed to clone workflow: ' + e.message);
    } finally {
      setCloning(false);
    }
  };

  const handleFixDescription = async () => {
    if (!workflowDescription) return;
    setFixingDesc(true);
    try {
      const res = await fixGrammar(workflowDescription);
      if (res.status === 'success') {
        setWorkflowMeta(workflowId, workflowName, res.fixed, workflowGroup, workflowCategory, globalErrorNode, dynamicResumption, warmup, autoNewSession);
      }
    } catch (e) {
      console.error('Grammar fix failed:', e);
    } finally {
      setFixingDesc(false);
    }
  };

  const pageTitles = {
    canvas: null,
    workflows: 'Workflows',
    logs: 'Logs',
    library: 'Library',
    rag: 'Knowledge Base',
    observability: 'Observability',
    dashboard: 'Dashboard',
  };

  // ─── Debounced Auto-Save ───
  React.useEffect(() => {
    if (activePage !== 'canvas') return;
    if (!isDirty || !workflowId || nodes.length === 0) return;
    
    // Read interval from injected env (production) or Vite env (local), default to 4000.
    const rawEnv = window._env_?.VITE_AUTO_SAVE_INTERVAL_MS || import.meta.env.VITE_AUTO_SAVE_INTERVAL_MS;
    const intervalMs = rawEnv !== undefined ? parseInt(rawEnv, 10) : 4000;
    
    if (intervalMs <= 0 || isNaN(intervalMs)) return; // Disable auto-save
    
    const timer = setTimeout(() => {
      // Avoid calling save if we are currently compiling (compiling also saves)
      if (!compiling) {
        handleSave();
      }
    }, intervalMs);
    
    return () => clearTimeout(timer);
  }, [isDirty, nodes, edges, workflowName, workflowDescription, workflowGroup, workflowCategory, globalErrorNode, dynamicResumption, warmup, autoNewSession, activePage, compiling]);

  // Determine the workflow status label and color
  const getWorkflowStatus = () => {
    if (saving) return { label: 'Saving...', bg: '#DBEAFE', color: '#1E40AF' };
    if (isDirty) return { label: 'Draft', bg: '#FFF3B8', color: '#92400E' };
    if (isCompiled) return { label: 'Compiled', bg: '#C9F5E0', color: '#065F46' };
    // Not dirty and not compiled means it was just saved as draft (or is a freshly loaded workflow)
    return { label: 'Saved', bg: '#E8E8E5', color: '#5F5F6B' };
  };
  const wsStatus = getWorkflowStatus();

  const hasNodes = nodes.some(n => n.id !== '__start__' && n.id !== '__end__');

  // Close dropdown on outside click
  React.useEffect(() => {
    if (!metaDropdownOpen) return;
    function handleClick(e) {
      if (
        metaDropdownRef.current && 
        !metaDropdownRef.current.contains(e.target) &&
        metaTriggerRef.current &&
        !metaTriggerRef.current.contains(e.target)
      ) {
        setMetaDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [metaDropdownOpen]);

  // Close I/O dropdown on outside click
  React.useEffect(() => {
    if (!ioDropdownOpen) return;
    function handleClick(e) {
      if (
        ioDropdownRef.current && 
        !ioDropdownRef.current.contains(e.target) &&
        ioTriggerRef.current &&
        !ioTriggerRef.current.contains(e.target)
      ) {
        setIoDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ioDropdownOpen]);

  return (
    <>
      <header style={{
        height: 52, flexShrink: 0,
        background: 'white',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 24px',
        position: 'relative', zIndex: 20,
        fontFamily: "'Google Sans','Roboto',sans-serif",
        gap: 12,
      }}>
        {/* Left: page breadcrumb or canvas workflow name */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden', position: 'relative' }}>
          {activePage !== 'canvas' ? (
            <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{pageTitles[activePage]}</span>
          ) : (
            <>
              {/* Dirty / compiled indicator dot */}
              <span style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: isDirty ? 'var(--orange)' : isCompiled ? 'var(--green)' : 'var(--text-muted)',
                boxShadow: isCompiled && !isDirty ? '0 0 0 3px rgba(52,199,89,0.15)' : 'none',
                transition: 'all 0.3s',
              }} />
              <button
                ref={metaTriggerRef}
                onClick={() => setMetaDropdownOpen((v) => {
                  const next = !v;
                  if (next) setActiveSettingsTab('general');
                  return next;
                })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0, margin: 0,
                  fontSize: 14, fontWeight: 500, color: 'var(--text-primary)',
                  maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderRadius: 4
                }}
                title="Edit workflow meta"
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workflowName}</span>
                {metaDropdownOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
              </button>
              {/* Status badge */}
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                background: wsStatus.bg,
                color: wsStatus.color,
                fontWeight: 500,
                transition: 'all 0.3s',
              }}>
                {wsStatus.label}
              </span>

            </>
          )}
        </div>

        {/* Error toast (inline) */}
        {status === 'err' && errMsg && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: 8,
            padding: '6px 12px', fontSize: 12, color: '#DC2626', fontWeight: 500,
            maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            <FiAlertTriangle size={13} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{errMsg}</span>
          </div>
        )}

        {/* Right Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>

          {/* Canvas Actions */}
          {activePage === 'canvas' && (
            <>
              {/* New */}
              <button
                onClick={() => {
                  newWorkflow();
                  useUIStore.getState().setSelectedNode(null);
                  useUIStore.getState().setSelectedEdge(null);
                }}
                style={{ padding: '7px 14px', background: 'white', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, transition: 'background 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <FiPlus size={14} /> New
              </button>

              {/* Notes */}
              <button
                onClick={toggleNotes}
                title="Workflow Notes"
                style={{
                  padding: '7px 14px', border: '1px solid var(--border)', borderRadius: 8,
                  background: showNotes ? 'var(--theme-primary-glow)' : 'white',
                  color: showNotes ? 'var(--theme-primary)' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (!showNotes) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = showNotes ? 'var(--theme-primary-glow)' : 'white'; }}
              >
                <FiBookOpen size={14} /> Notes
              </button>

              {/* Architect */}
              <button
                onClick={() => setShowArchitect(prev => !prev)}
                title="Workflow Architect Explainer"
                style={{
                  padding: '7px 14px', border: '1px solid var(--border)', borderRadius: 8,
                  background: showArchitect ? 'var(--theme-primary-glow)' : 'white',
                  color: showArchitect ? 'var(--theme-primary)' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (!showArchitect) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = showArchitect ? 'var(--theme-primary-glow)' : 'white'; }}
              >
                <HugeiconsIcon icon={AiMagicIcon} size={14} /> Architect
              </button>

              {/* Actions Dropdown */}
              <div style={{ position: 'relative' }} ref={ioDropdownRef}>
                <button
                  ref={ioTriggerRef}
                  onClick={() => setIoDropdownOpen(v => !v)}
                  style={{
                    padding: '7px 14px',
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  Actions {ioDropdownOpen ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                </button>
                {ioDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 4px)',
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 100,
                    minWidth: 150,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px 0'
                  }}>
                    <button
                      onClick={() => {
                        setShowImport(true);
                        setIoDropdownOpen(false);
                      }}
                      style={{
                        padding: '8px 12px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: 13,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'background 0.15s',
                        width: '100%'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <FiUpload size={14} /> Import JSON
                    </button>
                    <button
                      onClick={() => {
                        if (hasNodes) {
                          handleExport();
                          setIoDropdownOpen(false);
                        }
                      }}
                      disabled={!hasNodes}
                      title={!hasNodes ? "No nodes to export" : "Export JSON"}
                      style={{
                        padding: '8px 12px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: hasNodes ? 'pointer' : 'not-allowed',
                        fontSize: 13,
                        color: hasNodes ? 'var(--text-primary)' : '#9CA3AF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'background 0.15s',
                        opacity: hasNodes ? 1 : 0.6,
                        width: '100%'
                      }}
                      onMouseEnter={(e) => { if (hasNodes) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                    >
                      <FiDownload size={14} /> Export JSON
                    </button>
                    <button
                      onClick={() => {
                        if (hasNodes) {
                          setShowSaveTemplateModal(true);
                          setIoDropdownOpen(false);
                        }
                      }}
                      disabled={!hasNodes}
                      title={!hasNodes ? "No nodes to save" : "Save as Template"}
                      style={{
                        padding: '8px 12px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: hasNodes ? 'pointer' : 'not-allowed',
                        fontSize: 13,
                        color: hasNodes ? 'var(--text-primary)' : '#9CA3AF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'background 0.15s',
                        opacity: hasNodes ? 1 : 0.6,
                        width: '100%'
                      }}
                      onMouseEnter={(e) => { if (hasNodes) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                    >
                      <FiSave size={14} /> Save as Template
                    </button>
                    <button
                      onClick={async () => {
                        setIoDropdownOpen(false);
                        try {
                          const res = await getMarketplaceUsecase(workflowId);
                          if (res.status === 'success' && res.published) {
                            setUseWorkflowMeta(false);
                            setCustomMarketplaceName(res.marketplace_name || workflowName);
                            setCustomMarketplaceDesc(res.marketplace_description || workflowDescription);
                            setPublishTags(res.tags ? res.tags.join(', ') : '');
                            setLaunchMode(res.launch_url ? 'custom' : 'default');
                            setCustomLaunchUrl(res.launch_url || '');
                            setCurrentVersion(res.version);
                          } else {
                            setUseWorkflowMeta(true);
                            setCustomMarketplaceName(workflowName);
                            setCustomMarketplaceDesc(workflowDescription);
                            setPublishTags('');
                            setLaunchMode('default');
                            setCustomLaunchUrl('');
                            setCurrentVersion(null);
                          }
                        } catch (err) {
                          console.error("Failed to fetch marketplace details:", err);
                        }
                        setShowPublishModal(true);
                      }}
                      style={{
                        padding: '8px 12px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: 13,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'background 0.15s',
                        width: '100%'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <FiShare2 size={14} /> Publish Usecase
                    </button>
                  </div>
                )}
              </div>

              {/* Compile */}
              <button
                onClick={handleCompile}
                disabled={compiling || saving || !hasNodes}
                style={{
                  padding: '7px 20px',
                  background: !hasNodes ? '#E5E7EB' : status === 'compiled' ? '#22C55E' : 'var(--theme-primary-glow)',
                  border: status === 'compiled' ? 'none' : '1px solid var(--theme-primary-glow)',
                  borderRadius: 10,
                  color: !hasNodes ? '#9CA3AF' : status === 'compiled' ? 'white' : 'var(--theme-primary)',
                  fontSize: 13, fontWeight: 700,
                  cursor: (!hasNodes || compiling) ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, minWidth: 110, justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  opacity: !hasNodes ? 0.7 : 1,
                  boxShadow: hasNodes && status !== 'compiled' ? '0 2px 4px rgba(142, 119, 187, 0.05)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (hasNodes && !compiling && status !== 'compiled') {
                    e.currentTarget.style.background = 'var(--theme-primary)';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (hasNodes && !compiling && status !== 'compiled') {
                    e.currentTarget.style.background = 'var(--theme-primary-glow)';
                    e.currentTarget.style.color = 'var(--theme-primary)';
                  }
                }}
              >
                {compiling ? 'Compiling...' : status === 'compiled' ? 'Compiled!' : 'Compile'}
              </button>
            </>
          )}

        </div>

        {/* Dropdown for editing name/desc */}
        {metaDropdownOpen && (
          <div ref={metaDropdownRef} style={{
            position: 'absolute', left: 24, top: 52, width: 840, background: 'white', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', zIndex: 99999,
            padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 24
          }}>
            {/* Arrow pointer pointing to the trigger button */}
            <div style={{
              position: 'absolute',
              top: -7,
              left: 45,
              width: 12,
              height: 12,
              background: 'white',
              borderLeft: '1px solid var(--border)',
              borderTop: '1px solid var(--border)',
              transform: 'rotate(45deg)',
              zIndex: 100000,
            }} />
            <div style={{ display: 'flex', gap: 36, minHeight: 330 }}>
              {/* Left Column: Tab Navigation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 200, borderRight: '1px solid var(--border)', paddingRight: 20, flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 8 }}>
                  Settings
                </div>

                <button
                  onClick={() => setActiveSettingsTab('general')}
                  style={{
                    padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: 'none', textAlign: 'left', width: '100%', transition: 'all 0.2s',
                    background: activeSettingsTab === 'general' ? 'var(--theme-primary-glow)' : 'transparent',
                    color: activeSettingsTab === 'general' ? 'var(--theme-primary)' : 'var(--text-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSettingsTab !== 'general') e.currentTarget.style.background = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (activeSettingsTab !== 'general') e.currentTarget.style.background = 'transparent';
                  }}
                >
                  General Details
                </button>

                <button
                  onClick={() => setActiveSettingsTab('advanced')}
                  style={{
                    padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: 'none', textAlign: 'left', width: '100%', transition: 'all 0.2s',
                    background: activeSettingsTab === 'advanced' ? 'var(--theme-primary-glow)' : 'transparent',
                    color: activeSettingsTab === 'advanced' ? 'var(--theme-primary)' : 'var(--text-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSettingsTab !== 'advanced') e.currentTarget.style.background = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (activeSettingsTab !== 'advanced') e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Advanced Options
                </button>
              </div>

              {/* Right Column: Tab Content */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {activeSettingsTab === 'general' && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--theme-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>General Details</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Workflow Name <span style={{ color: '#ef4d5f' }}>*</span>
                      </label>
                      <input
                        autoFocus
                        value={workflowName}
                        onChange={(e) => setWorkflowMeta(workflowId, e.target.value, workflowDescription, workflowGroup, workflowCategory, globalErrorNode, dynamicResumption, warmup, autoNewSession)}
                        placeholder="Enter workflow name..."
                        style={{
                          border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', fontWeight: 600, background: '#F8FAFC'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Description <span style={{ color: '#ef4d5f' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <textarea
                          value={workflowDescription}
                          onChange={(e) => setWorkflowMeta(workflowId, workflowName, e.target.value, workflowGroup, workflowCategory, globalErrorNode, dynamicResumption, warmup, autoNewSession)}
                          placeholder="Describe what this workflow does..."
                          style={{
                            width: '100%', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', minHeight: 70, resize: 'vertical', background: '#F8FAFC', boxSizing: 'border-box'
                          }}
                        />
                        <button
                          onClick={handleFixDescription}
                          disabled={fixingDesc || !workflowDescription}
                          style={{
                            position: 'absolute', right: 8, bottom: 8,
                            background: 'white', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--theme-primary)',
                            display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700,
                            padding: '4px 8px', borderRadius: 6, transition: 'all 0.2s',
                            opacity: !workflowDescription ? 0.5 : 1, boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          {fixingDesc ? <FiLoader size={10} className="animate-spin" /> : <FiZap size={10} />}
                          Wizard
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' }}>Group</label>
                        <input
                          value={workflowGroup}
                          onChange={(e) => setWorkflowMeta(workflowId, workflowName, workflowDescription, e.target.value, workflowCategory, globalErrorNode, dynamicResumption, warmup, autoNewSession)}
                          placeholder="Default"
                          style={{
                            width: '100%', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', background: '#F8FAFC'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' }}>Category</label>
                        <select
                          value={workflowCategory}
                          onChange={(e) => setWorkflowMeta(workflowId, workflowName, workflowDescription, workflowGroup, e.target.value, globalErrorNode, dynamicResumption, warmup, autoNewSession)}
                          style={{
                            width: '100%', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', background: '#F8FAFC'
                          }}
                        >
                          <option value="General">General</option>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginTop: 4 }}>
                      <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' }}>Workflow ID</label>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: '#F1F5F9', border: '1px solid var(--border)', borderRadius: 8,
                        padding: '8px 12px'
                      }}>
                        <span style={{
                          flex: 1, fontSize: 11, color: 'var(--text-muted)',
                          fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                          {workflowId}
                        </span>
                        <button
                          onClick={() => {
                            copyToClipboard(workflowId);
                            setCopiedId(true);
                            setTimeout(() => setCopiedId(false), 2000);
                          }}
                          style={{
                            background: 'white', border: '1px solid var(--border)', borderRadius: 6,
                            padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s'
                          }}
                        >
                          {copiedId ? <FiCheck size={12} color="#098c60" /> : <FiCopy size={12} color="#64748B" />}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' }}>Created At</label>
                        <div style={{
                          fontSize: 12, color: 'var(--text-secondary)', background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontFamily: 'monospace'
                        }}>
                          {createdAt ? new Date(createdAt).toLocaleString() : 'Not Saved Yet'}
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' }}>Last Updated</label>
                        <div style={{
                          fontSize: 12, color: 'var(--text-secondary)', background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontFamily: 'monospace'
                        }}>
                          {updatedAt ? new Date(updatedAt).toLocaleString() : 'Not Saved Yet'}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeSettingsTab === 'advanced' && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--theme-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Advanced Options</div>

                    {/* Dynamic Resumption Toggle */}
                    <div
                      onClick={() => setWorkflowMeta(workflowId, workflowName, workflowDescription, workflowGroup, workflowCategory, globalErrorNode, !dynamicResumption, warmup, autoNewSession)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                        background: dynamicResumption ? 'var(--theme-primary-glow)' : '#F8FAFC',
                        border: '1px solid ' + (dynamicResumption ? 'var(--theme-primary)' : 'var(--border)'),
                        borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        width: 32, height: 18, borderRadius: 10, position: 'relative',
                        background: dynamicResumption ? 'var(--theme-primary)' : '#CBD5E1',
                        transition: 'background 0.2s'
                      }}>
                        <div style={{
                          position: 'absolute', top: 2, left: dynamicResumption ? 16 : 2,
                          width: 14, height: 14, borderRadius: '50%', background: 'white',
                          transition: 'left 0.2s'
                        }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Dynamic Resumption</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Auto-continue from active session</span>
                      </div>
                      <TooltipWrapper text="Allows the workflow to automatically resume from the last active checkpoint state if paused or interrupted, instead of starting from scratch.">
                        <span style={{ display: 'flex', padding: 4, cursor: 'help', color: 'var(--text-muted)' }} onClick={(e) => e.stopPropagation()}>
                          <FiInfo size={14} />
                        </span>
                      </TooltipWrapper>
                    </div>

                    {/* Pre-warm on Startup Toggle */}
                    <div
                      onClick={() => setWorkflowMeta(workflowId, workflowName, workflowDescription, workflowGroup, workflowCategory, globalErrorNode, dynamicResumption, !warmup, autoNewSession)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                        background: warmup ? 'var(--theme-primary-glow)' : '#F8FAFC',
                        border: '1px solid ' + (warmup ? 'var(--theme-primary)' : 'var(--border)'),
                        borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        width: 32, height: 18, borderRadius: 10, position: 'relative',
                        background: warmup ? 'var(--theme-primary)' : '#CBD5E1',
                        transition: 'background 0.2s'
                      }}>
                        <div style={{
                          position: 'absolute', top: 2, left: warmup ? 16 : 2,
                          width: 14, height: 14, borderRadius: '50%', background: 'white',
                          transition: 'left 0.2s'
                        }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}> Pre-warm on Startup</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Pre-compile at boot for zero cold-start</span>
                      </div>
                      <TooltipWrapper text="Pre-compiles the workflow graph immediately at server startup. Recommended for webhook-critical or latency-sensitive workloads.">
                        <span style={{ display: 'flex', padding: 4, cursor: 'help', color: 'var(--text-muted)' }} onClick={(e) => e.stopPropagation()}>
                          <FiInfo size={14} />
                        </span>
                      </TooltipWrapper>
                    </div>

                    {/* Auto New Session Toggle */}
                    <div
                      onClick={() => setWorkflowMeta(workflowId, workflowName, workflowDescription, workflowGroup, workflowCategory, globalErrorNode, dynamicResumption, warmup, !autoNewSession)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                        background: autoNewSession ? 'var(--theme-primary-glow)' : '#F8FAFC',
                        border: '1px solid ' + (autoNewSession ? 'var(--theme-primary)' : 'var(--border)'),
                        borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        width: 32, height: 18, borderRadius: 10, position: 'relative',
                        background: autoNewSession ? 'var(--theme-primary)' : '#CBD5E1',
                        transition: 'background 0.2s'
                      }}>
                        <div style={{
                          position: 'absolute', top: 2, left: autoNewSession ? 16 : 2,
                          width: 14, height: 14, borderRadius: '50%', background: 'white',
                          transition: 'left 0.2s'
                        }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Fresh Session per Run</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Auto-reset session thread on every send</span>
                      </div>
                      <TooltipWrapper text="Forces a new session thread and resets conversation state on every execution run, ensuring separate runs are fully isolated.">
                        <span style={{ display: 'flex', padding: 4, cursor: 'help', color: 'var(--text-muted)' }} onClick={(e) => e.stopPropagation()}>
                          <FiInfo size={14} />
                        </span>
                      </TooltipWrapper>
                    </div>

                    {/* Global Error Node Selection */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Global Error Node</label>
                        <TooltipWrapper text="A fallback node where execution is routed if any unhandled exception or error occurs at any node in the workflow.">
                          <span style={{ display: 'flex', cursor: 'help', color: 'var(--text-muted)' }}>
                            <FiInfo size={12} />
                          </span>
                        </TooltipWrapper>
                      </div>
                      <select
                        value={globalErrorNode || ''}
                        onChange={(e) => setWorkflowMeta(workflowId, workflowName, workflowDescription, workflowGroup, workflowCategory, e.target.value, dynamicResumption, warmup, autoNewSession)}
                        style={{
                          width: '100%', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', background: '#F8FAFC'
                        }}
                      >
                        <option value="">— None (Always Stop) —</option>
                        {nodes.filter(n => !['start', 'end'].includes(n.data?.type)).map(n => (
                          <option key={n.id} value={n.id}>{n.data?.label || n.id} ({n.data?.type})</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '12px 0 4px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={handleClone}
                disabled={cloning}
                style={{
                  padding: '8px 16px', background: 'white', border: '1px solid var(--border)', borderRadius: 10,
                  color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                {cloning ? <FiLoader size={14} className="animate-spin" /> : <FiCopy size={14} />} Clone
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  padding: '8px 16px', background: 'white', border: '1px solid #FEE2E2', borderRadius: 10,
                  color: '#ef4d5f', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <FiTrash2 size={14} /> Delete
              </button>
              <button
                onClick={() => setMetaDropdownOpen(false)}
                style={{
                  padding: '8px 16px', background: 'white', border: '1px solid var(--border)', borderRadius: 10,
                  color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDropdownMetaAndCompile}
                style={{
                  padding: '8px 24px',
                  background: 'var(--theme-primary-glow)',
                  border: '1px solid var(--theme-primary-glow)',
                  borderRadius: 10,
                  color: 'var(--theme-primary)',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--theme-primary)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--theme-primary-glow)';
                  e.currentTarget.style.color = 'var(--theme-primary)';
                }}
              >
                Save &amp; Compile
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Workflow"
        message={`Are you sure you want to permanently delete **${workflowName}**? This action cannot be undone.`}
        confirmText="Exterminate"
        variant="danger"
      />

      {/* Import Modal */}
      {showImport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, width: 520, padding: 28, boxShadow: 'var(--shadow-lg)', fontFamily: "'Google Sans','Roboto',sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Import workflow</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Paste a JSON workflow config. Must include <code style={{ background: '#F5F5F3', padding: '1px 5px', borderRadius: 4 }}>name</code>, <code style={{ background: '#F5F5F3', padding: '1px 5px', borderRadius: 4 }}>nodes</code>, and <code style={{ background: '#F5F5F3', padding: '1px 5px', borderRadius: 4 }}>edges</code>.
                </div>
              </div>
              <button onClick={() => { setShowImport(false); setImportErr(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: 6, padding: 4 }}>
                <FiX size={18} />
              </button>
            </div>
            <textarea
              autoFocus value={importText} onChange={(e) => setImportText(e.target.value)}
              placeholder='{"id": "...", "name": "My Flow", "nodes": [...], "edges": [...]}'
              style={{ width: '100%', height: 220, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, color: 'var(--text-primary)', fontSize: 12, fontFamily: 'Roboto Mono, monospace', outline: 'none', resize: 'none', lineHeight: 1.6, boxSizing: 'border-box' }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            />
            {importErr && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 10 }}>Parse error: {importErr}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowImport(false); setImportErr(null); }} style={{ padding: '9px 18px', background: 'white', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-secondary)' }}>
                Cancel
              </button>
              <button onClick={handleImport} style={{ padding: '9px 22px', background: 'var(--theme-primary)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--theme-primary-text)' }}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.98)', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: 28, width: 580, padding: '24px 32px 32px 32px', boxShadow: '0 30px 60px rgba(0, 0, 0, 0.15)', fontFamily: "'Google Sans','Roboto',sans-serif", display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Modal Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -10 }}>
              <button onClick={() => { setShowPublishModal(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: 8, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-canvas)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <FiX size={18} />
              </button>
            </div>

            {/* App Store Style Header Row */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              {/* App Icon */}
              <div style={{
                width: 80, height: 80, borderRadius: 18,
                background: `linear-gradient(135deg, var(--theme-primary) 0%, #1e1b4b 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', boxShadow: '0 8px 16px -4px rgba(76, 29, 149, 0.25)',
                border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0
              }}>
                <FiShare2 size={36} />
              </div>

              {/* Title & Metadata */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '0 0 4px 0', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  {useWorkflowMeta ? (workflowName || 'My Agent') : (customMarketplaceName || 'My Agent')}
                </h3>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#10B981', marginBottom: 4 }}>
                  {workflowGroup || 'Default Group'}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                  {workflowCategory || 'General'} Usecase
                </div>
              </div>
            </div>

            {/* Horizontal Stats Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid #f1f5f9',
              borderBottom: '1px solid #f1f5f9',
              padding: '12px 0',
              margin: '4px 0'
            }}>
              {/* Stat 1: Status */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>
                  {currentVersion ? `v${currentVersion}` : 'New App'}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 650, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Status
                </div>
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />

              {/* Stat 2: Group */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#10B981', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }} title={workflowGroup || 'Default'}>
                  {workflowGroup || 'Default'}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 650, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Group
                </div>
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />

              {/* Stat 3: Category */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--theme-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }} title={workflowCategory || 'General'}>
                  {workflowCategory || 'General'}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 650, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Category
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '42vh', overflowY: 'auto', paddingRight: 4 }}>
              {/* Custom Switch Toggle for metadata */}
              <div 
                onClick={() => setUseWorkflowMeta(!useWorkflowMeta)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  background: 'var(--bg-canvas)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                  border: '1px solid ' + (useWorkflowMeta ? 'var(--theme-primary)' : 'var(--border)'),
                  boxShadow: useWorkflowMeta ? '0 4px 12px rgba(142, 119, 187, 0.08)' : 'none'
                }}
              >
                <div style={{
                  width: 32, height: 18, borderRadius: 10, position: 'relative',
                  background: useWorkflowMeta ? 'var(--theme-primary)' : '#CBD5E1',
                  transition: 'background 0.2s'
                }}>
                  <div style={{
                    position: 'absolute', top: 2, left: useWorkflowMeta ? 16 : 2,
                    width: 14, height: 14, borderRadius: '50%', background: 'white',
                    transition: 'left 0.2s'
                  }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Use Workflow Identity</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Automatically apply current canvas name and description</span>
                </div>
              </div>
 
              {!useWorkflowMeta && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, background: 'var(--bg-canvas)', borderRadius: 14, border: '1px solid var(--border)' }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Marketplace Name</label>
                    <input
                      type="text"
                      value={customMarketplaceName}
                      onChange={(e) => setCustomMarketplaceName(e.target.value)}
                      placeholder="Enter a custom name for the marketplace"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        color: 'var(--text-primary)',
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                        fontFamily: 'inherit'
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--theme-primary)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Marketplace Description</label>
                    <textarea
                      value={customMarketplaceDesc}
                      onChange={(e) => setCustomMarketplaceDesc(e.target.value)}
                      placeholder="Describe what this use case does"
                      style={{
                        width: '100%',
                        height: 80,
                        padding: '10px 14px',
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        color: 'var(--text-primary)',
                        fontSize: 13,
                        outline: 'none',
                        resize: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                        fontFamily: 'inherit',
                        lineHeight: 1.5
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--theme-primary)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                </div>
              )}
 
              {/* Launch URL Selector */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Launch Mode</label>
                <div style={{ display: 'flex', background: 'var(--bg-canvas)', borderRadius: 12, padding: 4, gap: 4, border: '1px solid var(--border)', marginBottom: 12 }}>
                  <button 
                    type="button"
                    onClick={() => setLaunchMode('default')}
                    style={{
                      flex: 1, padding: '8px 12px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: launchMode === 'default' ? 700 : 500,
                      background: launchMode === 'default' ? 'white' : 'transparent',
                      boxShadow: launchMode === 'default' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                      color: launchMode === 'default' ? 'var(--theme-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit'
                    }}
                  >
                    Default Chat Panel
                  </button>
                  <button 
                    type="button"
                    onClick={() => setLaunchMode('custom')}
                    style={{
                      flex: 1, padding: '8px 12px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: launchMode === 'custom' ? 700 : 500,
                      background: launchMode === 'custom' ? 'white' : 'transparent',
                      boxShadow: launchMode === 'custom' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                      color: launchMode === 'custom' ? 'var(--theme-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit'
                    }}
                  >
                    Custom Launch URL
                  </button>
                </div>
                {launchMode === 'custom' && (
                  <input
                    type="text"
                    value={customLaunchUrl}
                    onChange={(e) => setCustomLaunchUrl(e.target.value)}
                    placeholder="https://example.com/custom-launch-endpoint"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--theme-primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                )}
              </div>
 
              {/* Tags */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Marketplace Tags</label>
                <input
                  type="text"
                  value={publishTags}
                  onChange={(e) => setPublishTags(e.target.value)}
                  placeholder="e.g. top 10, trending, hot (comma-separated)"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--theme-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>
 
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <button onClick={() => { setShowPublishModal(false); }} style={{ padding: '10px 20px', background: 'white', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-secondary)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-canvas)'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                style={{
                  padding: '10px 24px',
                  background: 'var(--theme-primary)',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: publishing ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {publishing ? <FiLoader className="spin" size={14} /> : <FiShare2 size={14} />}
                {publishing ? 'Publishing...' : 'Publish Usecase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveTemplateModal && (
        <SaveWorkflowTemplateModal
          workflowConfig={buildConfig()}
          onClose={() => setShowSaveTemplateModal(false)}
          onSaved={() => setShowSaveTemplateModal(false)}
        />
      )}

      {/* AI Workflow Architect Floating Bubble */}
      {showArchitect && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 10000,
          fontFamily: 'inherit',
          width: architectExpanded ? 750 : 550,
          maxWidth: '90vw',
          height: architectExpanded ? '88vh' : 'auto',
          maxHeight: architectExpanded ? '88vh' : '82vh',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: 24,
          border: '1px solid var(--theme-primary-light)',
          boxShadow: '0 20px 40px rgba(142, 119, 187, 0.15), 0 0 30px rgba(142, 119, 187, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)'
        }}>
          <style>{`
            @keyframes architect-pulse {
              0% { transform: scale(0.95); box-shadow: 0 0 0 0 var(--theme-primary-glow), 0 0 0 0 rgba(142, 119, 187, 0.2); }
              70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(142, 119, 187, 0), 0 0 0 25px rgba(142, 119, 187, 0); }
              100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(142, 119, 187, 0), 0 0 0 0 rgba(142, 119, 187, 0); }
            }
            @keyframes architect-wave {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-8px); }
            }
            .architect-orb {
              width: 48px;
              height: 48px;
              border-radius: 50%;
              background: radial-gradient(circle, var(--theme-primary-light) 0%, var(--theme-primary) 100%);
              animation: architect-pulse 2s infinite ease-in-out;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
            }
            .architect-wave-container {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
              height: 40px;
            }
            .architect-bar {
              width: 3px;
              height: 16px;
              background: linear-gradient(to top, var(--theme-primary-light), var(--theme-primary));
              border-radius: 99px;
              animation: architect-wave 1.2s infinite ease-in-out;
            }
            .architect-bar-1 { animation-delay: -0.4s; height: 18px; }
            .architect-bar-2 { animation-delay: -0.2s; height: 26px; }
            .architect-bar-3 { animation-delay: 0s; height: 32px; }
            .architect-bar-4 { animation-delay: -0.6s; height: 22px; }
            .architect-bar-5 { animation-delay: -0.8s; height: 14px; }
          `}</style>

          {/* Architect Bubble Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(241, 245, 249, 0.6)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, var(--theme-primary-glow), rgba(255, 255, 255, 0.8))'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="architect-orb" style={{ width: 32, height: 32, fontSize: 14 }}>
                <HugeiconsIcon icon={AiMagicIcon} size={16} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1E1B4B', margin: 0 }}>Workflow Architect</h3>
                <p style={{ fontSize: 10, color: 'var(--theme-primary)', margin: '2px 0 0', fontWeight: 650 }}>Explain workflow walkthrough and node details</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setArchitectExpanded(!architectExpanded)}
                title={architectExpanded ? 'Collapse' : 'Expand'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--theme-primary-glow)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                {architectExpanded ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
              </button>
              <button
                onClick={() => setShowArchitect(false)}
                title="Minimize"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--theme-primary-glow)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          {/* Architect Bubble Content */}
          <div style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }} className="msg-scrollbar">

            {/* Error Message */}
            {architectError && (
              <div style={{
                padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12,
                color: '#991B1B', fontSize: 12, fontWeight: 550, display: 'flex', alignItems: 'center', gap: 8
              }}>
                <FiAlertTriangle size={16} /> {architectError}
              </div>
            )}

            {/* Thinking Visualizer */}
            {explaining && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '40px 20px', gap: 16, background: 'rgba(255,255,255,0.4)', borderRadius: 16
              }}>
                <div className="architect-wave-container">
                  <div className="architect-bar architect-bar-1" />
                  <div className="architect-bar architect-bar-2" />
                  <div className="architect-bar architect-bar-3" />
                  <div className="architect-bar architect-bar-4" />
                  <div className="architect-bar architect-bar-5" />
                </div>
                <span style={{ fontSize: 12, color: 'var(--theme-primary)', fontWeight: 700, letterSpacing: '0.05em' }}>
                  Architect is analyzing your workflow...
                </span>
              </div>
            )}

            {/* Markdown Formatted Explanation Viewport */}
            {architectExplanation && !explaining && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 750, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Walkthrough Result</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={handleCopyExplanation}
                      style={{
                        background: 'white', border: '1px solid #E2E8F0', borderRadius: 6,
                        padding: '4px 8px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                        color: '#475569', fontWeight: 650, transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      {copiedExplanation ? <FiCheck color="#16A34A" size={12} /> : <FiCopy size={12} />}
                      {copiedExplanation ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={handleSaveToNotes}
                      disabled={savingNote}
                      style={{
                        background: 'white', border: '1px solid #E2E8F0', borderRadius: 6,
                        padding: '4px 8px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                        color: 'var(--theme-primary)', fontWeight: 650, transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--theme-primary-glow)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      {savedToNotes ? <FiCheck color="#16A34A" size={12} /> : <FiBookOpen size={12} />}
                      {savedToNotes ? 'Saved!' : 'Save Notes'}
                    </button>
                  </div>
                </div>

                <div style={{
                  flex: 1, minHeight: 200, maxHeight: architectExpanded ? '70vh' : '42vh', padding: '16px', background: 'white', border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: 16, overflowY: 'auto', fontSize: 13.5, color: '#334155', lineHeight: 1.6,
                  fontFamily: 'inherit', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)'
                }} className="msg-scrollbar">
                  {formatMessage(architectExplanation)}
                </div>
              </div>
            )}

            {!architectExplanation && !explaining && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '40px 20px', gap: 12, textAlign: 'center', color: '#94A3B8'
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'var(--theme-primary-glow)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'var(--theme-primary)'
                }}>
                  <HugeiconsIcon icon={AiMagicIcon} size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: '0 0 4px' }}>Ready to Explain</h4>
                  <p style={{ fontSize: 11, margin: 0 }}>Click the button below to generate a detailed architectural walkthrough of this pipeline.</p>
                </div>
              </div>
            )}
          </div>

          {/* Bubble Action Footer */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(241, 245, 249, 0.6)',
            background: 'white',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <button
               onClick={handleGenerateExplanation}
               disabled={explaining || !hasNodes}
               style={{
                 background: 'var(--theme-primary)',
                 color: 'var(--theme-primary-text)',
                 border: 'none',
                 padding: '10px 20px',
                 borderRadius: 12,
                 fontSize: 13,
                 fontWeight: 700,
                 cursor: explaining || !hasNodes ? 'not-allowed' : 'pointer',
                 display: 'flex',
                 alignItems: 'center',
                 gap: 8,
                 transition: 'all 0.2s',
                 opacity: !hasNodes ? 0.6 : 1,
                 boxShadow: '0 4px 12px var(--theme-primary-glow)'
               }}
               onMouseEnter={e => { if (!explaining && hasNodes) e.currentTarget.style.background = 'var(--theme-primary-light)'; }}
               onMouseLeave={e => { if (!explaining && hasNodes) e.currentTarget.style.background = 'var(--theme-primary)'; }}
             >
               <FiZap size={14} />
               {explaining ? 'Analyzing...' : architectExplanation ? 'Regenerate Walkthrough' : 'Explain Workflow'}
             </button>
           </div>
         </div>
       )}
      
      {/* Workflow Metadata Prompt Modal */}
      {showMetadataPrompt && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            width: 500, background: 'white', borderRadius: 20,
            boxShadow: 'var(--shadow-2xl)', border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', fontFamily: "'Google Sans','Roboto',sans-serif"
          }}>
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC',
              borderTopLeftRadius: 20, borderTopRightRadius: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--theme-primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-primary)' }}>
                  <FiSave size={18} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Save &amp; Compile Workflow
                </div>
              </div>
              <button onClick={() => setShowMetadataPrompt(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMetadataAndCompile} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {validationError ? (
                <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 12, fontWeight: 500 }}>
                  {validationError}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  A custom workflow name and description are required before compiling.
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Workflow Name <span style={{ color: '#ef4d5f' }}>*</span>
                </label>
                <input
                  style={{
                    width: '100%', padding: '10px 12px', background: 'white',
                    border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)',
                    fontSize: 13, outline: 'none', boxSizing: 'border-box'
                  }}
                  value={promptName}
                  onChange={(e) => setPromptName(e.target.value)}
                  placeholder="e.g. Lead Ingestion & Scoring Engine"
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Workflow Description <span style={{ color: '#ef4d5f' }}>*</span>
                </label>
                <textarea
                  style={{
                    width: '100%', padding: '10px 12px', background: 'white',
                    border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)',
                    fontSize: 13, outline: 'none', boxSizing: 'border-box', minHeight: 70, resize: 'vertical'
                  }}
                  value={promptDesc}
                  onChange={(e) => setPromptDesc(e.target.value)}
                  placeholder="Describe what this workflow specializes in..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Group
                  </label>
                  <input
                    style={{
                      width: '100%', padding: '10px 12px', background: 'white',
                      border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)',
                      fontSize: 13, outline: 'none', boxSizing: 'border-box'
                    }}
                    value={promptGroup}
                    onChange={(e) => setPromptGroup(e.target.value)}
                    placeholder="Default"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Category
                  </label>
                  <select
                    style={{
                      width: '100%', padding: '10px 12px', background: 'white',
                      border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)',
                      fontSize: 13, outline: 'none', boxSizing: 'border-box', cursor: 'pointer'
                    }}
                    value={promptCategory}
                    onChange={(e) => setPromptCategory(e.target.value)}
                  >
                    <option value="General">General</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ 
                marginTop: 10, display: 'flex', justifyContent: 'flex-end', gap: 12
              }}>
                <button
                  type="button"
                  onClick={() => setShowMetadataPrompt(false)}
                  style={{ padding: '9px 18px', background: 'white', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 22px', background: 'var(--theme-primary)', color: 'white', 
                    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 12px var(--theme-primary-glow)'
                  }}
                >
                  Save &amp; Compile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
