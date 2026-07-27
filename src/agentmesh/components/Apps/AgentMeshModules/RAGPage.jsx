import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ingestData, listAvailableModels, listCollections, getCollectionDetails, deleteCollection } from '../../../api/agentmesh';
import { FiBookOpen, FiType, FiUpload, FiCheck, FiAlertCircle, FiInfo, FiFileText, FiX, FiLayers, FiDatabase, FiScissors, FiMic, FiActivity, FiVideo, FiShare2, FiTrash2, FiSearch, FiChevronDown } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../../Common/PageHeader';

const scrollableSelectInputClass = {
  width: '100%', padding: '10px 12px', background: 'white',
  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)',
  fontSize: 13, outline: 'none', transition: 'border-color 0.15s',
  fontFamily: 'inherit',
};

function ScrollableSelect({ value, onChange, options, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...scrollableSelectInputClass,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'white',
          border: isOpen ? '1.5px solid var(--accent-btn)' : '1.5px solid var(--border)',
          userSelect: 'none'
        }}
      >
        <span>{options.find(o => o.value === value)?.label || value || placeholder}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>▼</span>
      </div>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'white',
            border: '1.5px solid var(--border)',
            borderRadius: 8,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            maxHeight: '170px',
            overflowY: 'auto',
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: 13,
                background: value === opt.value ? 'var(--theme-primary-glow)' : 'transparent',
                color: value === opt.value ? 'var(--theme-primary)' : 'var(--text-primary)',
                fontWeight: value === opt.value ? 600 : 400,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (value !== opt.value) e.currentTarget.style.background = '#F3F4F6';
              }}
              onMouseLeave={(e) => {
                if (value !== opt.value) e.currentTarget.style.background = 'transparent';
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

ScrollableSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
  placeholder: PropTypes.string,
};

function TooltipLabel({ label, tooltipText }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, position: 'relative' }}>
      <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>
        {label}
      </label>
      <div 
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{ cursor: 'help', display: 'flex', alignItems: 'center' }}
      >
        <FiInfo size={13} color="var(--text-muted)" />
      </div>
      {show && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: 0,
          width: 250,
          background: '#1E293B',
          color: 'white',
          padding: '8px 12px',
          borderRadius: 6,
          fontSize: 11,
          lineHeight: 1.4,
          boxShadow: 'var(--shadow-md)',
          zIndex: 1001,
          pointerEvents: 'none'
        }}>
          {tooltipText}
        </div>
      )}
    </div>
  );
}

TooltipLabel.propTypes = {
  label: PropTypes.string.isRequired,
  tooltipText: PropTypes.string.isRequired,
};

export default function RAGPage() {
  const [mainNav, setMainNav] = useState('ingest');
  const [tab, setTab] = useState('text');
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [collection, setCollection] = useState('default');
  const [showRagInfo, setShowRagInfo] = useState(false);
  const [vectorStore, setVectorStore] = useState('chroma');
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(100);
  const [chunkingStrategy, setChunkingStrategy] = useState('recursive');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [audioFiles, setAudioFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [whisperModel, setWhisperModel] = useState('base');
  const [targetType, setTargetType] = useState('vector');
  const [llmProvider, setLlmProvider] = useState('openai');
  const [llmModel, setLlmModel] = useState('gpt-4o');
  const [allowedNodes, setAllowedNodes] = useState('');
  const [allowedRelationships, setAllowedRelationships] = useState('');
  const [graphDatabase, setGraphDatabase] = useState('neo4j');
  const [contextHint, setContextHint] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [providers, setProviders] = useState([]);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [existingCollections, setExistingCollections] = useState([]);
  const [collectionDetails, setCollectionDetails] = useState(null);
  const [activeChunkModal, setActiveChunkModal] = useState(null);
  const [collectionSearchQuery, setCollectionSearchQuery] = useState('');
  const [isCollectionDropdownOpen, setIsCollectionDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await listCollections(vectorStore);
        if (res && res.collections) {
          setExistingCollections(res.collections);
        }
      } catch (err) {
        console.error("Failed to load collections:", err);
      }
    };
    if (targetType === 'vector') {
      fetchCollections();
    }
  }, [vectorStore, targetType]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!collection || targetType !== 'vector') return;
      try {
        const res = await getCollectionDetails(collection, vectorStore);
        if (res && res.details) {
          setCollectionDetails(res.details);
        }
      } catch (err) {
        console.error("Failed to load collection details:", err);
      }
    };
    fetchDetails();
  }, [collection, vectorStore, targetType, result]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await listAvailableModels();
        if (res && res.models) {
          setAvailableModels(res.models);
          const uniqueProviders = Array.from(new Set(res.models.map(m => m.provider)));
          setProviders(uniqueProviders);
          
          if (uniqueProviders.includes('openai')) {
            setLlmProvider('openai');
            const openaiModels = res.models.filter(m => m.provider === 'openai');
            if (openaiModels.length > 0) {
              setLlmModel(openaiModels[0].model);
            }
          } else if (uniqueProviders.length > 0) {
            setLlmProvider(uniqueProviders[0]);
            const provModels = res.models.filter(m => m.provider === uniqueProviders[0]);
            if (provModels.length > 0) {
              setLlmModel(provModels[0].model);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load available models:", err);
      }
    };
    fetchModels();
  }, []);

  // --- Security & Validation Constants ---
  const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_MEDIA_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_DOCS = ['.pdf', '.txt', '.md', '.docx', '.csv', '.xlsx'];
  const ALLOWED_AUDIO = ['.mp3', '.wav', '.m4a', '.flac'];
  const ALLOWED_VIDEO = ['.mp4', '.mov', '.avi', '.mkv'];
  const COLLECTION_REGEX = /^[a-zA-Z0-9_\-]+$/;

  const handleIngest = async () => {
    if (tab === 'text' && !text.trim()) return;
    if (tab === 'file' && files.length === 0) return;

    setLoading(true); setResult(null); setError(null);

    // 1. Validate Collection Name (Only for Vector Target)
    if (targetType === 'vector' && !COLLECTION_REGEX.test(collection)) {
      setError("Collection name must contain only alphanumeric characters, underscores, or hyphens.");
      setLoading(false); return;
    }

    // 2. Validate Chunking Parameters
    if (chunkingStrategy !== 'none' && chunkingStrategy !== 'markdown_heading') {
      if (chunkSize < 100 || chunkSize > 10000) {
        setError("Chunk size must be between 100 and 10,000.");
        setLoading(false); return;
      }
      if (chunkOverlap >= chunkSize) {
        setError("Chunk overlap must be less than chunk size.");
        setLoading(false); return;
      }
    }

    const finalChunkSize = chunkingStrategy === 'none' ? 0 : chunkSize;
    const finalOverlap = chunkingStrategy === 'none' ? 0 : chunkOverlap;

    const appendFormParameters = (formData) => {
      formData.append('target_type', targetType);
      formData.append('chunk_size', finalChunkSize);
      formData.append('chunk_overlap', finalOverlap);
      formData.append('chunking_strategy', chunkingStrategy);
      
      if (targetType === 'graph') {
        formData.append('llm_provider', llmProvider);
        formData.append('llm_model', llmModel);
        formData.append('allowed_nodes', allowedNodes);
        formData.append('allowed_relationships', allowedRelationships);
        formData.append('graph_database', graphDatabase);
        formData.append('context_hint', contextHint);
      } else {
        formData.append('collection_name', collection);
        formData.append('vector_store', vectorStore);
      }
    };

    try {
      if (tab === 'text') {
        const formData = new FormData();
        formData.append('text', text);
        appendFormParameters(formData);
        
        const res = await ingestData(formData);
        setResult(res);
      } else if (tab === 'file') {
        let totalChunks = 0;
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          appendFormParameters(formData);

          const res = await ingestData(formData);
          totalChunks += res.chunks_ingested;
        }
        setResult({ chunks_ingested: totalChunks, file_count: files.length });
        setFiles([]); // Clear after success
      } else if (tab === 'audio') {
        let totalChunks = 0;
        for (const file of audioFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('model_name', whisperModel);
          appendFormParameters(formData);

          const res = await ingestData(formData);
          totalChunks += res.chunks_ingested;
        }
        setResult({ chunks_ingested: totalChunks, file_count: audioFiles.length });
        setAudioFiles([]);
      } else if (tab === 'video') {
        let totalChunks = 0;
        for (const file of videoFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('model_name', whisperModel);
          appendFormParameters(formData);

          const res = await ingestData(formData);
          totalChunks += res.chunks_ingested;
        }
        setResult({ chunks_ingested: totalChunks, file_count: videoFiles.length });
        setVideoFiles([]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const invalidFiles = selectedFiles.filter(f => f.size > MAX_DOC_SIZE);
      if (invalidFiles.length > 0) {
        setError(`Some files exceed the 10MB limit: ${invalidFiles.map(f => f.name).join(', ')}`);
        return;
      }
      setFiles(selectedFiles);
      setError(null);
    }
  };

  const removeFile = (index, e) => {
    e.stopPropagation();
    setFiles(files.filter((_, i) => i !== index));
  };

  const onAudioChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const invalidFiles = selectedFiles.filter(f => f.size > MAX_MEDIA_SIZE);
      if (invalidFiles.length > 0) {
        setError(`Audio file too large (>50MB): ${invalidFiles[0].name}`);
        return;
      }
      setAudioFiles(selectedFiles);
      setError(null);
    }
  };

  const removeAudioFile = (index, e) => {
    e.stopPropagation();
    setAudioFiles(audioFiles.filter((_, i) => i !== index));
  };

  const onVideoChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const invalidFiles = selectedFiles.filter(f => f.size > MAX_MEDIA_SIZE);
      if (invalidFiles.length > 0) {
        setError(`Video file too large (>50MB): ${invalidFiles[0].name}`);
        return;
      }
      setVideoFiles(selectedFiles);
      setError(null);
    }
  };

  const removeVideoFile = (index, e) => {
    e.stopPropagation();
    setVideoFiles(videoFiles.filter((_, i) => i !== index));
  };

  const inputClass = {
    width: '100%', padding: '10px 12px', background: 'white',
    border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)',
    fontSize: 13, outline: 'none', transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  };

  const labelNode = (text) => (
    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>{text}</label>
  );

  const isIngestDisabled = loading ||
    (tab === 'text' && !text.trim()) ||
    (tab === 'file' && files.length === 0) ||
    (tab === 'audio' && audioFiles.length === 0) ||
    (tab === 'video' && videoFiles.length === 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)', fontFamily: "'Google Sans','Roboto',sans-serif" }}>
      {/* ── Standard Header ── */}
      <div style={{ padding: '16px 40px 8px 40px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white' }}>
        <PageHeader 
          title="Knowledge Base" 
          description="Manage and index documents, PDFs, web contents, and vectors for semantic retrieval (RAG) during execution." 
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <div 
            onMouseEnter={() => setShowRagInfo(true)}
            onMouseLeave={() => setShowRagInfo(false)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
              border: '1px solid var(--border)', borderRadius: 20, color: 'var(--text-muted)',
              fontSize: 13, fontWeight: 500, cursor: 'help', transition: 'all 0.2s',
              background: 'white'
            }}
          >
            <FiInfo size={16} color="var(--theme-primary)" />
            How it works
            
            <AnimatePresence>
              {showRagInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 320,
                    background: 'white', border: '1px solid var(--border)', borderRadius: 16,
                    padding: '24px', boxShadow: 'var(--shadow-lg)', zIndex: 100,
                    cursor: 'default'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <FiBookOpen size={18} color="var(--theme-primary)" />
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>How RAG works</span>
                  </div>
                  {[
                    'Text is split into overlapping semantic chunks',
                    'For audio, Whisper transcribes content to text first',
                    'Each chunk is encoded into a high-dimensional vector',
                    'Vectors are stored in the selected vector database',
                    'At runtime, RAG nodes retrieve the most relevant chunks',
                  ].map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-primary)', background: 'var(--theme-primary-glow)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'left' }}>{step}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Main Knowledge Views Switcher (Knowledge Ingestion vs Knowledges Table) ── */}
      <div style={{ padding: '0 40px', background: 'white', borderBottom: '1px solid var(--border)', display: 'flex', gap: 24, alignItems: 'center' }}>
        {[
          { key: 'ingest', label: 'Knowledge Ingestion', icon: FiUpload },
          { key: 'browse', label: 'Knowledges & Collections', icon: FiDatabase },
        ].map(({ key, label: l, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMainNav(key)}
            style={{
              background: 'none', border: 'none', padding: '14px 4px', fontSize: 14, fontWeight: 700,
              color: mainNav === key ? 'var(--theme-primary)' : 'var(--text-muted)',
              cursor: 'pointer', position: 'relative', transition: 'color 0.2s', fontFamily: 'inherit'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon size={16} />
              {l}
            </div>
            {mainNav === key && (
              <motion.div
                layoutId="activeMainNav"
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
                  background: 'var(--theme-primary)', borderRadius: '3px 3px 0 0'
                }}
              />
            )}
          </button>
        ))}
      </div>

      {mainNav === 'browse' ? (
        /* ── Knowledges & Collections Table View ── */
        <div style={{ flex: 1, padding: '24px 40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top Filters bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '16px 20px', borderRadius: 14, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Vector Engine:</div>
              <select
                value={vectorStore}
                onChange={(e) => setVectorStore(e.target.value)}
                style={{ ...inputClass, width: 160 }}
              >
                <option value="chroma">Chroma DB</option>
                <option value="qdrant">Qdrant DB</option>
              </select>

              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginLeft: 16 }}>Collection:</div>
              <div style={{ position: 'relative', width: 220 }}>
                {/* Trigger Button */}
                <div
                  onClick={() => setIsCollectionDropdownOpen(!isCollectionDropdownOpen)}
                  style={{
                    padding: '8px 12px', background: 'white', border: '1px solid var(--border)',
                    borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justify: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {collection}
                  </span>
                  <FiChevronDown size={16} color="var(--text-muted)" style={{ transform: isCollectionDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>

                {/* Dropdown Menu Popup */}
                <AnimatePresence>
                  {isCollectionDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      style={{
                        position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                        background: 'white', border: '1px solid var(--border)', borderRadius: 10,
                        boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden'
                      }}
                    >
                      {/* Search Bar Input */}
                      <div style={{ padding: '8px', borderBottom: '1px solid var(--border)', background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiSearch size={14} color="#64748B" />
                        <input
                          type="text"
                          value={collectionSearchQuery}
                          onChange={(e) => setCollectionSearchQuery(e.target.value)}
                          placeholder="Search collections..."
                          autoFocus
                          style={{
                            border: 'none', background: 'transparent', outline: 'none',
                            fontSize: 12, width: '100%', color: 'var(--text-primary)'
                          }}
                        />
                      </div>

                      {/* Scrollable Collection Options List */}
                      <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '4px 0' }}>
                        {existingCollections
                          .filter(col => col.toLowerCase().includes(collectionSearchQuery.toLowerCase()))
                          .map((col, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setCollection(col);
                                setIsCollectionDropdownOpen(false);
                                setCollectionSearchQuery('');
                              }}
                              style={{
                                padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                                background: collection === col ? '#E0F2FE' : 'transparent',
                                color: collection === col ? '#0369A1' : 'var(--text-primary)',
                                fontWeight: collection === col ? 700 : 400,
                                transition: 'background 0.15s'
                              }}
                              onMouseEnter={e => { if (collection !== col) e.currentTarget.style.background = '#F1F5F9'; }}
                              onMouseLeave={e => { if (collection !== col) e.currentTarget.style.background = 'transparent'; }}
                            >
                              {col}
                            </div>
                          ))}
                        {existingCollections.filter(col => col.toLowerCase().includes(collectionSearchQuery.toLowerCase())).length === 0 && (
                          <div style={{ padding: '12px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                            No collections found
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ padding: '6px 12px', background: '#F1F5F9', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#334155' }}>
                Total Vector Chunks: {collectionDetails?.total_chunks || 0}
              </div>
              <div style={{ padding: '6px 12px', background: '#E0F2FE', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#0369A1' }}>
                Vector Size: {collectionDetails?.vector_size || 384}
              </div>
              <button
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to permanently delete the collection '${collection}' from ${vectorStore}?`)) {
                    try {
                      await deleteCollection(collection, vectorStore);
                      setCollectionDetails(null);
                      const res = await listCollections(vectorStore);
                      if (res && res.collections) {
                        setExistingCollections(res.collections);
                        if (res.collections.length > 0) setCollection(res.collections[0]);
                      }
                    } catch (e) {
                      alert(`Failed to delete collection: ${e.message}`);
                    }
                  }
                }}
                title="Delete Collection"
                style={{
                  padding: '7px 14px', borderRadius: 8, border: '1px solid #FECACA',
                  background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
              >
                <FiTrash2 size={14} color="#DC2626" />
                Delete Collection
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Collection Chunks Table ({collectionDetails?.chunks?.length || 0} Records Loaded)</span>
              
            </div>

            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '550px' }}>
              {collectionDetails?.chunks && collectionDetails.chunks.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F8FAFC' }}>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 16px', width: '150px' }}>Chunk ID</th>
                      <th style={{ padding: '12px 16px', width: '200px' }}>Source File</th>
                      <th style={{ padding: '12px 16px' }}>Text Content Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectionDetails.chunks.map((row, idx) => {
                      let rawText = typeof row.content === 'object' ? JSON.stringify(row.content, null, 2) : String(row.content || '');
                      let previewText = rawText.length > 180 ? rawText.substring(0, 180) + '...' : rawText;

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: '#64748B' }}>{row.id.substring(0, 16)}...</td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1E293B' }}>{row.filename}</td>
                          <td style={{ padding: '12px 16px', color: '#334155', lineHeight: 1.5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '600px' }}>
                                {previewText}
                              </span>
                              <button
                                onClick={() => setActiveChunkModal(row)}
                                style={{
                                  padding: '4px 10px', borderRadius: 6, border: '1px solid #CBD5E1',
                                  background: '#F8FAFC', color: '#0F172A', fontSize: 11, fontWeight: 700,
                                  cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
                                onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}
                              >
                                Inspect Full Chunk
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '340px', gap: 16, color: '#64748B', padding: '40px' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiDatabase size={32} color="#94A3B8" strokeWidth={1.5} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>
                      No vector records found in '{collection}'
                    </div>
                  
                  </div>
                  <button
                    onClick={() => setMainNav('ingest')}
                    style={{
                      padding: '9px 18px', background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)',
                      border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.2s', marginTop: 4
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-primary)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--theme-primary-glow)'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
                  >
                    Go to Knowledge Ingestion
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Full Chunk Inspector Modal ── */}
          <AnimatePresence>
            {activeChunkModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 2000, padding: 24
                }}
                onClick={() => setActiveChunkModal(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 10 }}
                  onClick={e => e.stopPropagation()}
                  style={{
                    background: 'white', borderRadius: 16, border: '1px solid var(--border)',
                    maxWidth: 800, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Modal Header */}
                  <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Chunk Inspector</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                        Source: <span style={{ fontWeight: 600, color: '#1E293B' }}>{activeChunkModal.filename}</span> • ID: <span style={{ fontFamily: 'monospace' }}>{activeChunkModal.id}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveChunkModal(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: '50%', color: '#64748B' }}
                    >
                      <FiX size={18} />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div style={{ padding: 24, overflowY: 'auto', flex: 1, background: '#FAFAF9' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>
                      Full Content Payload
                    </div>
                    <pre style={{
                      background: '#0F172A', color: '#38BDF8', padding: '16px', borderRadius: 12,
                      fontSize: 12, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
                      maxHeight: '400px', lineHeight: 1.6
                    }}>
                      <code>
                        {typeof activeChunkModal.content === 'object'
                          ? JSON.stringify(activeChunkModal.content, null, 2)
                          : activeChunkModal.content}
                      </code>
                    </pre>

                    {activeChunkModal.metadata && (
                      <div style={{ marginTop: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>
                          Chunk Metadata
                        </div>
                        <pre style={{
                          background: '#F1F5F9', color: '#334155', padding: '12px', borderRadius: 8,
                          fontSize: 11, fontFamily: 'monospace', margin: 0, overflowX: 'auto'
                        }}>
                          <code>{JSON.stringify(activeChunkModal.metadata, null, 2)}</code>
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div style={{ padding: '14px 24px', borderTop: '1px solid #E2E8F0', background: 'white', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setActiveChunkModal(null)}
                      style={{
                        padding: '8px 18px', borderRadius: 8, border: '1px solid #CBD5E1',
                        background: '#0F172A', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Close Inspector
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
      <>
      {/* ── Ingestion Tabs ── */}
      <div style={{ padding: '0 40px', background: 'white', borderBottom: '1px solid var(--border)', display: 'flex' }}>
        <div style={{ display: 'flex', gap: 32 }}>
          {[
            { key: 'text', label: 'Text', icon: FiType },
            { key: 'file', label: 'File', icon: FiUpload },
            { key: 'audio', label: 'Audio', icon: FiMic },
            { key: 'video', label: 'Video', icon: FiVideo },
          ].map(({ key, label: l, icon: Icon }) => (
            <button 
              key={key} 
              onClick={() => { setTab(key); setResult(null); setError(null); }} 
              style={{
                background: 'none', border: 'none', padding: '12px 4px', fontSize: 14, fontWeight: 600,
                color: tab === key ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer', position: 'relative', transition: 'color 0.2s', fontFamily: 'inherit'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={14} />
                {l}
              </div>
              {tab === key && (
                <motion.div
                  layoutId="activeTabRAG"
                  style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                    background: 'var(--accent-btn)',
                    boxShadow: '0 0 8px var(--accent-glow)'
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* ── Left: Form ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ flex: 1, width: '100%', minWidth: 360 }}
        >
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '32px' }}>
              {/* Text Tab */}
              {tab === 'text' && (
                <div style={{ marginBottom: 20 }}>
                  {labelNode('Source content')}
                  <textarea
                    value={text} onChange={(e) => setText(e.target.value)} rows={12}
                    placeholder="Paste documentation, policies, or any text content. AgentMesh will chunk and vectorize it automatically…"
                    style={{ ...inputClass, resize: 'vertical', lineHeight: 1.6 }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-btn)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  />
                </div>
              )}

              {/* File Tab */}
              {tab === 'file' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '32px 24px',
                    border: files.length > 0 ? '1.5px solid var(--accent-btn)' : '1.5px dashed var(--border)',
                    borderRadius: 12,
                    textAlign: 'center',
                    background: files.length > 0 ? 'var(--accent-glow)' : '#FAFAF8',
                    marginBottom: 20,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 180
                  }}
                  onMouseEnter={(e) => { if (files.length === 0) e.currentTarget.style.borderColor = '#4285F4'; }}
                  onMouseLeave={(e) => { if (files.length === 0) e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <input type="file" ref={fileInputRef} onChange={onFileChange} style={{ display: 'none' }} accept=".pdf,.txt,.md,.docx,.json" multiple />

                  {files.length > 0 ? (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <FiFileText size={32} color="#4285F4" style={{ marginBottom: 16 }} />
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1E', marginBottom: 12 }}>{files.length} file(s) selected</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: '100%' }}>
                        {files.map((f, i) => (
                          <div key={i} style={{
                            background: 'white', padding: '6px 10px', borderRadius: 8, border: '1px solid #E0E7FF',
                            fontSize: 11, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                          }}>
                            <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                            <FiX size={12} style={{ cursor: 'pointer' }} onClick={(e) => removeFile(i, e)} />
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: '#6366F1', marginTop: 12, fontWeight: 600 }}>Click to add more files</div>
                    </div>
                  ) : (
                    <>
                      <FiUpload size={32} color="#D4D4CC" style={{ marginBottom: 14 }} />
                      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>Click to upload files</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Support for PDF, TXT, MD, DOCX, and JSON<br />You can select multiple files
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Audio Tab */}
              {tab === 'audio' && (
                <div style={{ marginBottom: 20 }}>
                  <div
                    onClick={() => audioInputRef.current?.click()}
                    style={{
                      padding: '32px 24px',
                      border: audioFiles.length > 0 ? '1.5px solid var(--accent-btn)' : '1.5px dashed var(--border)',
                      borderRadius: 12,
                      textAlign: 'center',
                      background: audioFiles.length > 0 ? 'var(--accent-glow)' : '#FAFAF8',
                      marginBottom: 16,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 180
                    }}
                  >
                    <input type="file" ref={audioInputRef} onChange={onAudioChange} style={{ display: 'none' }} accept=".mp3,.wav,.webm,.m4a,.ogg" multiple />

                    {audioFiles.length > 0 ? (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <FiActivity size={32} color="#4285F4" style={{ marginBottom: 16 }} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1E', marginBottom: 12 }}>{audioFiles.length} audio file(s) selected</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: '100%' }}>
                          {audioFiles.map((f, i) => (
                            <div key={i} style={{
                              background: 'white', padding: '6px 10px', borderRadius: 8, border: '1px solid #E0E7FF',
                              fontSize: 11, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                              <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                              <FiX size={12} style={{ cursor: 'pointer' }} onClick={(e) => removeAudioFile(i, e)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <FiMic size={32} color="#D4D4CC" style={{ marginBottom: 14 }} />
                        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>Upload audio for transcription</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                          Supports MP3, WAV, WebM, M4A<br />Transcribed via OpenAI Whisper
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ padding: '16px', background: 'white', border: '1px solid var(--border)', borderRadius: 12 }}>
                    {labelNode('Whisper Model')}
                    <select
                      value={whisperModel}
                      onChange={(e) => setWhisperModel(e.target.value)}
                      style={{ ...inputClass }}
                    >
                      <option value="tiny">Tiny (Fastest)</option>
                      <option value="base">Base (Good balance)</option>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large (Best accuracy)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Video Tab */}
              {tab === 'video' && (
                <div style={{ marginBottom: 20 }}>
                  <div
                    onClick={() => videoInputRef.current?.click()}
                    style={{
                      padding: '32px 24px',
                      border: videoFiles.length > 0 ? '1.5px solid var(--accent-btn)' : '1.5px dashed var(--border)',
                      borderRadius: 12,
                      textAlign: 'center',
                      background: videoFiles.length > 0 ? 'var(--accent-glow)' : '#FAFAF8',
                      marginBottom: 16,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 180
                    }}
                  >
                    <input type="file" ref={videoInputRef} onChange={onVideoChange} style={{ display: 'none' }} accept=".mp4,.avi,.mov,.mkv" multiple />

                    {videoFiles.length > 0 ? (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <FiVideo size={32} color="#4285F4" style={{ marginBottom: 16 }} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1E', marginBottom: 12 }}>{videoFiles.length} video file(s) selected</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: '100%' }}>
                          {videoFiles.map((f, i) => (
                            <div key={i} style={{
                              background: 'white', padding: '6px 10px', borderRadius: 8, border: '1px solid #E0E7FF',
                              fontSize: 11, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                              <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                              <FiX size={12} style={{ cursor: 'pointer' }} onClick={(e) => removeVideoFile(i, e)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <FiVideo size={32} color="#D4D4CC" style={{ marginBottom: 14 }} />
                        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>Upload video for transcription</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                          Supports MP4, AVI, MOV, MKV<br />AgentMesh extracts audio and transcribes it
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ padding: '16px', background: 'white', border: '1px solid var(--border)', borderRadius: 12 }}>
                    {labelNode('Whisper Model')}
                    <select
                      value={whisperModel}
                      onChange={(e) => setWhisperModel(e.target.value)}
                      style={{ ...inputClass }}
                    >
                      <option value="tiny">Tiny (Fastest)</option>
                      <option value="base">Base (Good balance)</option>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large (Best accuracy)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* ── Chunking Strategy Segment ── */}
              <div style={{ marginBottom: 24, padding: '18px', background: '#FAFAF9', border: '1px solid var(--border)', borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  <FiScissors size={18} color="var(--text-primary)" />
                  Content Chunking Strategy
                </div>

                <div style={{ marginBottom: 16 }}>
                  {labelNode('Chunking technique')}
                  <select
                    value={chunkingStrategy}
                    onChange={(e) => setChunkingStrategy(e.target.value)}
                    style={{ ...inputClass, border: '1.5px solid var(--accent-btn)', background: 'white' }}
                  >
                    <option value="recursive">Recursive Character (General Purpose)</option>
                    <option value="token">Token-based (LLM Context Optimized)</option>
                    <option value="json">JSON Object (Structured RAG)</option>
                    <option value="markdown_heading">Format Markdown Chunk Splitter</option>
                    <option value="none">None (Upload whole document)</option>
                  </select>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.4 }}>
                    <FiInfo size={12} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      {chunkingStrategy === 'json' && 'Optimized for structured JSON files. Splits only by major objects to preserve data hierarchy.'}
                      {chunkingStrategy === 'recursive' && 'The industry standard. Splits by paragraphs, lines, then spaces to keep semantic meaning.'}
                      {chunkingStrategy === 'token' && 'Calculates chunks based on token counts. Recommended for long contexts in OpenAI/Mistral.'}
                      {chunkingStrategy === 'markdown_heading' && 'Splits Markdown document dynamically by headings and subheadings with a 2000 character limit.'}
                      {chunkingStrategy === 'none' && 'Doc will be treated as one single block. Use only for very small documents.'}
                    </div>
                  </div>
                </div>

                {chunkingStrategy !== 'none' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        {labelNode('Chunk size')}
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-btn)' }}>
                          {chunkingStrategy === 'markdown_heading' ? 2000 : chunkSize} chars
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <input
                          type="range" min={100} max={10000} step={100}
                          value={chunkingStrategy === 'markdown_heading' ? 2000 : chunkSize}
                          onChange={(e) => setChunkSize(Number(e.target.value))}
                          disabled={chunkingStrategy === 'none' || chunkingStrategy === 'markdown_heading'}
                          style={{ flex: 1, accentColor: 'var(--accent-btn)', cursor: chunkingStrategy === 'markdown_heading' ? 'not-allowed' : 'pointer', height: 4 }}
                        />
                        <input type="number"
                          value={chunkingStrategy === 'markdown_heading' ? 2000 : chunkSize}
                          onChange={(e) => setChunkSize(Number(e.target.value))}
                          disabled={chunkingStrategy === 'none' || chunkingStrategy === 'markdown_heading'}
                          min={100} max={10000}
                          style={{ ...inputClass, width: 80, padding: '6px 8px', textAlign: 'center', opacity: (chunkingStrategy === 'none' || chunkingStrategy === 'markdown_heading') ? 0.6 : 1 }}
                        />
                      </div>
                    </div>

                    {chunkingStrategy !== 'markdown_heading' && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          {labelNode('Overlap (tokens/chars)')}
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B' }}>{chunkOverlap} chars</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <input
                            type="range" min={0} max={Math.min(2000, chunkSize)} step={10}
                            value={chunkOverlap} onChange={(e) => setChunkOverlap(Number(e.target.value))}
                            disabled={chunkingStrategy === 'none'}
                            style={{ flex: 1, accentColor: '#F59E0B', cursor: 'pointer', height: 4 }}
                          />
                          <input type="number" value={chunkOverlap} onChange={(e) => setChunkOverlap(Number(e.target.value))}
                            disabled={chunkingStrategy === 'none'}
                            min={0}
                            style={{ ...inputClass, width: 80, padding: '6px 8px', textAlign: 'center', opacity: chunkingStrategy === 'none' ? 0.6 : 1 }}
                          />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                          Overlap should be ~10-15% of chunk size for best context retrieval.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Storage Target Switcher ── */}
              <div style={{ marginBottom: 24, padding: '18px', background: '#FAFAF9', border: '1px solid var(--border)', borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  <FiLayers size={18} color="var(--text-primary)" />
                  Knowledge Storage Model
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div
                    onClick={() => { setTargetType('vector'); setResult(null); setError(null); }}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 12, padding: 16, borderRadius: 16, border: '2px solid ' + (targetType === 'vector' ? 'var(--theme-primary)' : 'var(--border)'),
                      background: targetType === 'vector' ? 'var(--theme-primary-glow)' : 'white', cursor: 'pointer', transition: 'all 0.25s',
                      boxShadow: targetType === 'vector' ? 'var(--shadow-sm)' : 'none', textAlign: 'left'
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: targetType === 'vector' ? 'var(--theme-primary)' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: targetType === 'vector' ? 'white' : 'var(--text-muted)' }}>
                      <FiDatabase size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Classic RAG</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>Embed document chunks into a vector space to retrieve facts using semantic similarity searches.</div>
                    </div>
                  </div>
                  <div
                    onClick={() => { setTargetType('graph'); setResult(null); setError(null); }}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 12, padding: 16, borderRadius: 16, border: '2px solid ' + (targetType === 'graph' ? 'var(--theme-primary)' : 'var(--border)'),
                      background: targetType === 'graph' ? 'var(--theme-primary-glow)' : 'white', cursor: 'pointer', transition: 'all 0.25s',
                      boxShadow: targetType === 'graph' ? 'var(--shadow-sm)' : 'none', textAlign: 'left'
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: targetType === 'graph' ? 'var(--theme-primary)' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: targetType === 'graph' ? 'white' : 'var(--text-muted)' }}>
                      <FiShare2 size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Knowledge Graph</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>Extract entities and relationship networks to construct a structured graph index for complex reasoning.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Vector Database Configuration (Conditional) ── */}
              {targetType === 'vector' && (
                <div style={{ marginBottom: 24, padding: '18px', background: '#FAFAF9', border: '1px solid var(--border)', borderRadius: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    <FiDatabase size={18} color="var(--text-primary)" />
                    Vector Database Configuration
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      {labelNode('Vector engine')}
                      <select value={vectorStore} onChange={(e) => setVectorStore(e.target.value)}
                        style={{ ...inputClass }}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-btn)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <option value="chroma">chroma</option>
                        <option value="qdrant">qdrant</option>
                        <option value="pinecone">pinecone</option>
                      </select>
                    </div>
                    <div>
                      {labelNode('Collection name')}
                      <input 
                        value={collection} 
                        onChange={(e) => setCollection(e.target.value)} 
                        placeholder="e.g. default"
                        list="existing-collections-list"
                        style={inputClass}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-btn)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                      />
                      <datalist id="existing-collections-list">
                        {existingCollections.map((col, idx) => (
                          <option key={idx} value={col} />
                        ))}
                      </datalist>
                      {existingCollections.length > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span>Existing collections:</span>
                          {existingCollections.map((c, i) => (
                            <span 
                              key={i} 
                              onClick={() => setCollection(c)}
                              style={{
                                cursor: 'pointer', background: '#E2E8F0', padding: '2px 6px', borderRadius: 4,
                                color: '#1E293B', fontWeight: 600
                              }}
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Collection Metrics & File Breakdown ── */}
                  {collectionDetails && collectionDetails.exists && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--border)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
                        <div style={{ padding: '10px 12px', background: '#F1F5F9', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Chunks</span>
                          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{collectionDetails.total_chunks}</span>
                        </div>
                        <div style={{ padding: '10px 12px', background: '#F1F5F9', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Vector Dim</span>
                          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{collectionDetails.vector_size || 384}</span>
                        </div>
                        <div style={{ padding: '10px 12px', background: '#F1F5F9', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Metric</span>
                          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{collectionDetails.distance || 'COSINE'}</span>
                        </div>
                      </div>

                      {collectionDetails.files && collectionDetails.files.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>Ingested Files ({collectionDetails.files.length})</span>
                            <span style={{ fontSize: 10, color: '#94A3B8' }}>Chunks per file</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 130, overflowY: 'auto' }}>
                            {collectionDetails.files.map((fileObj, fIdx) => (
                              <div key={fIdx} style={{
                                padding: '6px 10px', background: 'white', border: '1px solid #E2E8F0', borderRadius: 8,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12
                              }}>
                                <span style={{ color: '#334155', fontWeight: 600, maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {fileObj.filename}
                                </span>
                                <span style={{ background: '#E0F2FE', color: '#0369A1', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
                                  {fileObj.chunks} chunks
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Graph Extraction Configuration (Conditional) ── */}
              {targetType === 'graph' && (
                <div style={{ marginBottom: 24, padding: '18px', background: '#FAFAF9', border: '1px solid var(--border)', borderRadius: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    <FiDatabase size={18} color="var(--text-primary)" />
                    Graph Extractor Configuration
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      {labelNode('LLM Provider')}
                      <ScrollableSelect
                        value={llmProvider}
                        onChange={(newProv) => {
                          setLlmProvider(newProv);
                          const provModels = availableModels.filter(m => m.provider === newProv);
                          if (provModels.length > 0) {
                            setLlmModel(provModels[0].model);
                          }
                        }}
                        options={providers.map(p => ({
                          value: p,
                          label: p.charAt(0).toUpperCase() + p.slice(1)
                        }))}
                        placeholder="Select Provider"
                      />
                    </div>
                    <div>
                      {labelNode('Model Name')}
                      <ScrollableSelect
                        value={llmModel}
                        onChange={(val) => setLlmModel(val)}
                        options={availableModels.filter(m => m.provider === llmProvider).map(m => ({
                          value: m.model,
                          label: m.label || m.model
                        }))}
                        placeholder="Select Model"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      {labelNode('Tenant Database / Graph Name')}
                      <input value={graphDatabase} onChange={(e) => setGraphDatabase(e.target.value)} placeholder="e.g. neo4j"
                        style={inputClass}
                      />
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                        Set a custom tenant database name to physically isolate this ingestion in Neo4j (Default: neo4j).
                      </div>
                    </div>
                    <div>
                      <TooltipLabel 
                        label="Context Hint / Subject Anchor (Optional)" 
                        tooltipText="Declare the main entity/subject of the document (e.g. 'Tata Motors' or 'Mahindra'). This guides the LLM to link every extracted node back to this central entity, preventing orphan nodes and improving connectivity." 
                      />
                      <input value={contextHint} onChange={(e) => setContextHint(e.target.value)} placeholder="e.g. Tata Motors"
                        style={inputClass}
                      />
                    </div>
                    <div>
                      <TooltipLabel 
                        label="Allowed Node Labels (Optional)" 
                        tooltipText="Specifies the target entity types the LLM should extract (e.g., Person, Organization, Location). If left empty, the model will dynamically extract any labels it identifies." 
                      />
                      <input value={allowedNodes} onChange={(e) => setAllowedNodes(e.target.value)} placeholder="e.g. Person, Company, Product"
                        style={inputClass}
                      />
                    </div>
                    <div>
                      <TooltipLabel 
                        label="Allowed Relationship Types (Optional)" 
                        tooltipText="Defines the specific connection types between nodes that the LLM should identify (e.g., WORKS_FOR, LIVES_IN, OWNED_BY). If left empty, the model will dynamically name relationships." 
                      />
                      <input value={allowedRelationships} onChange={(e) => setAllowedRelationships(e.target.value)} placeholder="e.g. WORKS_FOR, HAS_METRIC"
                        style={inputClass}
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleIngest}
                disabled={isIngestDisabled}
                style={{
                  width: '100%', height: 48, borderRadius: 12, border: 'none',
                  fontSize: 15, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'all 0.2s',
                  background: isIngestDisabled ? '#E5E7EB' : 'var(--theme-primary-glow)',
                  color: isIngestDisabled ? '#9CA3AF' : 'var(--theme-primary)',
                  cursor: isIngestDisabled ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (!isIngestDisabled) e.currentTarget.style.filter = 'brightness(0.95)'; }}
                onMouseLeave={e => { if (!isIngestDisabled) e.currentTarget.style.filter = 'none'; }}
              >
                {loading ? (
                  <><div className="loading-spinner" style={{ borderTopColor: 'var(--theme-primary)' }} /> Processing…</>
                ) : targetType === 'graph' ? (
                  'Extract & Ingest to Graph'
                ) : (
                  'Ingest into Knowledge Base'
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Right: Results + Info ── */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {result && (
            <div style={{ background: '#F0FEF5', border: '1px solid #BBF7D0', borderRadius: 14, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiCheck size={14} color="white" />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#15803D' }}>Ingestion complete</span>
              </div>
              {[
                { label: targetType === 'graph' ? 'Nodes Ingested' : 'Chunks indexed', value: result.chunks_ingested },
                ...(result.file_count ? [{ label: 'Files processed', value: result.file_count }] : []),
                ...(targetType === 'graph' ? [
                  { label: 'LLM Extractor', value: `${llmProvider} (${llmModel})` }
                ] : [
                  { label: 'Collection', value: collection },
                  { label: 'Engine', value: vectorStore }
                ]),
              ].map(({ label: l, value: v }) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #D1FAE5', fontSize: 13 }}>
                  <span style={{ color: '#5F5F6B' }}>{l}</span>
                  <span style={{ fontWeight: 600, color: '#15803D' }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 12 }}>
              <FiAlertCircle color="#DC2626" size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', marginBottom: 4 }}>Ingestion failed</div>
                <div style={{ fontSize: 12, color: '#B91C1C', lineHeight: 1.5 }}>{error}</div>
              </div>
            </div>
          )}

        </div>
      </div>
      </>
      )}
    </div>
  );
}
