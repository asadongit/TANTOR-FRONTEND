import React, { useState, useEffect, useRef } from 'react';
import { listAvailableModels } from '../../../api/agentmesh';
import { 
  FiCpu, FiCheck, FiLoader, FiEye, FiEyeOff, FiLayout,
  FiCornerDownRight, FiActivity, FiGrid, FiMaximize, FiTarget, FiMinus, FiInfo
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useUIStore } from '../../../store';
import PageHeader from '../../Common/PageHeader';

function Tooltip({ text }) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 6, verticalAlign: 'middle', cursor: 'pointer' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <FiInfo size={13} style={{ color: '#94A3B8', transition: 'color 0.2s' }} />
      {visible && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 220,
          background: '#1E293B',
          color: 'white',
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 400,
          lineHeight: '1.4',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 999999,
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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('architect');
  const [models, setModels] = useState([]);
  const [providers, setProviders] = useState([]);
  
  // Settings State
  const [provider, setProvider] = useState('groq');
  const [model, setModel] = useState('llama-3.3-70b-versatile');
  const [temperature, setTemperature] = useState(0.2);
  const [apiKeyOverride, setApiKeyOverride] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Canvas Settings State
  const [wireStyle, setWireStyle] = useState('square');
  const [backgroundStyle, setBackgroundStyle] = useState('dots');
  const [nodeTheme, setNodeTheme] = useState('modern');
  const [dotSize, setDotSize] = useState(1.5);
  const [edgeWidth, setEdgeWidth] = useState(1.5);
  const [handleSize, setHandleSize] = useState(10);
  const [connectionRadius, setConnectionRadius] = useState(20);
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
 
  // Track the last-persisted values to compute isDirty
  const savedRef = useRef({
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    apiKeyOverride: '',
    wireStyle: 'square',
    backgroundStyle: 'dots',
    nodeTheme: 'modern',
    dotSize: 1.5,
    edgeWidth: 1.5,
    handleSize: 10,
    connectionRadius: 20
  });

  const isDirty =
    provider !== savedRef.current.provider ||
    model !== savedRef.current.model ||
    temperature !== savedRef.current.temperature ||
    apiKeyOverride !== savedRef.current.apiKeyOverride ||
    wireStyle !== savedRef.current.wireStyle ||
    backgroundStyle !== savedRef.current.backgroundStyle ||
    nodeTheme !== savedRef.current.nodeTheme ||
    dotSize !== savedRef.current.dotSize ||
    edgeWidth !== savedRef.current.edgeWidth ||
    handleSize !== savedRef.current.handleSize ||
    connectionRadius !== savedRef.current.connectionRadius;
 
  useEffect(() => {
    // Load settings from localStorage
    const cachedProvider = localStorage.getItem('architect_provider') || 'groq';
    const cachedModel = localStorage.getItem('architect_model') || 'llama-3.3-70b-versatile';
    const cachedTemp = localStorage.getItem('architect_temperature') || '0.2';
    const cachedKey = localStorage.getItem('architect_api_key') || '';
    const cachedWire = localStorage.getItem('canvas_wire_style') || 'square';
    const cachedBg = localStorage.getItem('canvas_background_style') || 'dots';
    const cachedTheme = localStorage.getItem('canvas_node_theme') || 'modern';
    const cachedDotSize = localStorage.getItem('canvas_dot_size') || '1.5';
    const cachedEdgeWidth = localStorage.getItem('canvas_edge_width') || '1.5';
    const cachedHandleSize = localStorage.getItem('canvas_handle_size') || '10';
    const cachedConnectionRadius = localStorage.getItem('canvas_connection_radius') || '20';
  
    setProvider(cachedProvider);
    setModel(cachedModel);
    setTemperature(parseFloat(cachedTemp));
    setApiKeyOverride(cachedKey);
    setWireStyle(cachedWire);
    setBackgroundStyle(cachedBg);
    setNodeTheme(cachedTheme);
    setDotSize(parseFloat(cachedDotSize));
    setEdgeWidth(parseFloat(cachedEdgeWidth));
    setHandleSize(parseInt(cachedHandleSize, 10));
    setConnectionRadius(parseInt(cachedConnectionRadius, 10));
  
    // Sync ref so isDirty starts false
    savedRef.current = {
      provider: cachedProvider,
      model: cachedModel,
      temperature: parseFloat(cachedTemp),
      apiKeyOverride: cachedKey,
      wireStyle: cachedWire,
      backgroundStyle: cachedBg,
      nodeTheme: cachedTheme,
      dotSize: parseFloat(cachedDotSize),
      edgeWidth: parseFloat(cachedEdgeWidth),
      handleSize: parseInt(cachedHandleSize, 10),
      connectionRadius: parseInt(cachedConnectionRadius, 10)
    };
 
    // Fetch available models
    listAvailableModels()
      .then(res => {
        if (res.status === 'success' && res.models) {
          setModels(res.models);
          // Extract unique providers
          const uniqueProviders = Array.from(new Set(res.models.map(m => m.provider)));
          setProviders(uniqueProviders);
        }
      })
      .catch(err => console.error("Failed to load models:", err));
  }, []);
 
  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem('architect_provider', provider);
      localStorage.setItem('architect_model', model);
      localStorage.setItem('architect_temperature', temperature.toString());
      localStorage.setItem('architect_api_key', apiKeyOverride);
 
      localStorage.setItem('canvas_wire_style', wireStyle);
      localStorage.setItem('canvas_background_style', backgroundStyle);
      localStorage.setItem('canvas_node_theme', nodeTheme);
      localStorage.setItem('canvas_dot_size', dotSize.toString());
      localStorage.setItem('canvas_edge_width', edgeWidth.toString());
      localStorage.setItem('canvas_handle_size', handleSize.toString());
      localStorage.setItem('canvas_connection_radius', connectionRadius.toString());
 
      // Propagate setting changes to store instantly
      const storeState = useUIStore.getState();
      if (storeState.setCanvasWireStyle) storeState.setCanvasWireStyle(wireStyle);
      if (storeState.setCanvasBackgroundStyle) storeState.setCanvasBackgroundStyle(backgroundStyle);
      if (storeState.setCanvasNodeTheme) storeState.setCanvasNodeTheme(nodeTheme);
      if (storeState.setCanvasDotSize) storeState.setCanvasDotSize(dotSize);
      if (storeState.setCanvasEdgeWidth) storeState.setCanvasEdgeWidth(edgeWidth);
      if (storeState.setCanvasHandleSize) storeState.setCanvasHandleSize(handleSize);
      if (storeState.setCanvasConnectionRadius) storeState.setCanvasConnectionRadius(connectionRadius);
 
      // Update ref so isDirty resets to false
      savedRef.current = { provider, model, temperature, apiKeyOverride, wireStyle, backgroundStyle, nodeTheme, dotSize, edgeWidth, handleSize, connectionRadius };
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Filter models based on the selected provider
  const filteredModels = models.filter(m => m.provider === provider);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC', height: '100%', overflow: 'hidden', fontFamily: "'Google Sans','Roboto',sans-serif" }}>
      {/* Header */}
      <div style={{ 
        padding: '16px 32px', 
        background: 'white', 
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        zIndex: 10
      }}>
        <PageHeader 
          title="Global Settings" 
          description="Configure system preferences, default LLM providers, canvas interaction parameters, and theme settings." 
          letterSpacing="-0.5px"
        />
      </div>

      {/* Main Settings Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar */}
        <div style={{ width: 220, borderRight: '1px solid var(--border-light)', background: 'white', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => setActiveTab('architect')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 10,
              border: 'none',
              width: '100%',
              textAlign: 'left',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'architect' ? 'var(--theme-primary-glow)' : 'transparent',
              color: activeTab === 'architect' ? 'var(--theme-primary)' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            <FiCpu size={18} />
            Architect
          </button>
          <button
            onClick={() => setActiveTab('canvas')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 10,
              border: 'none',
              width: '100%',
              textAlign: 'left',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'canvas' ? 'var(--theme-primary-glow)' : 'transparent',
              color: activeTab === 'canvas' ? 'var(--theme-primary)' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            <FiLayout size={18} />
            Canvas Settings
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '32px 48px', overflowY: 'auto' }}>
          {activeTab === 'architect' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 1000, margin: '0 auto' }}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1E1B4B', margin: '0 0 8px 0' }}>Architect Configuration</h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Configure the default model and provider settings used globally by the Workflow Architect and Skill SOP Writer.</p>
              </div>

              <div style={{ 
                background: 'white', 
                border: '1px solid #E2E8F0', 
                borderRadius: 16, 
                padding: 24, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 24,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)'
              }}>
                {/* Provider Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                    Provider
                    <Tooltip text="The default AI models provider utilized globally by the Workflow Architect." />
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      const selectedProv = e.target.value;
                      setProvider(selectedProv);
                      // Auto select first model of the new provider
                      const firstModel = models.find(m => m.provider === selectedProv);
                      if (firstModel) setModel(firstModel.model);
                    }}
                    style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, outline: 'none', background: 'white', fontWeight: 600 }}
                  >
                    {providers.length > 0 ? (
                      providers.map(p => (
                        <option key={p} value={p}>{p.toUpperCase()}</option>
                      ))
                    ) : (
                      <option value="groq">Groq</option>
                    )}
                  </select>
                </div>

                {/* Model Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                    Model
                    <Tooltip text="The default model utilized to generate nodes and orchestration scripts." />
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, outline: 'none', background: 'white', fontWeight: 600 }}
                  >
                    {filteredModels.length > 0 ? (
                      filteredModels.map(m => (
                        <option key={m.model} value={m.model}>{m.label}</option>
                      ))
                    ) : (
                      <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Groq)</option>
                    )}
                  </select>
                </div>

                {/* Temperature */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                      Temperature
                      <Tooltip text="Controls the creativity vs determinism of generated output. Lower values are more structured." />
                    </label>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--theme-primary)', background: 'var(--theme-primary-glow)', padding: '2px 8px', borderRadius: 6 }}>{temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--theme-primary)', cursor: 'pointer', height: 6, borderRadius: 3, background: '#E2E8F0', outline: 'none' }}
                  />
                </div>

                {/* API Key Override */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                    API Key Override (Optional)
                    <Tooltip text="Override the system environment API key with a personal key for this provider." />
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="Leave empty to use system default environment key"
                      value={apiKeyOverride}
                      onChange={(e) => setApiKeyOverride(e.target.value)}
                      style={{ padding: '10px 42px 10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      style={{ position: 'absolute', right: 12, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {showApiKey ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'canvas' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 1000, margin: '0 auto' }}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1E1B4B', margin: '0 0 8px 0' }}>Canvas Settings</h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Configure the appearance and behaviors of the workspace workflow canvas.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                
                {/* CATEGORY 1: Grid & Background */}
                <div style={{ 
                  background: 'white', 
                  border: '1px solid #E2E8F0', 
                  borderRadius: 16, 
                  padding: 24, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 20,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                    <FiGrid size={18} color="var(--theme-primary)" />
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>Grid & Background</h3>
                  </div>

                  {/* Canvas Grid Background */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                      Canvas Background Style
                      <Tooltip text="Select the background grid style for the workflow workspace canvas." />
                    </label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {[
                        { value: 'dots', label: 'Dots Grid', icon: FiGrid, desc: 'Dotted workspace' },
                        { value: 'lines', label: 'Lines Grid', icon: FiMaximize, desc: 'Full gridlines' },
                        { value: 'cross', label: 'Cross Grid', icon: FiTarget, desc: 'Intersection tick-marks' },
                        { value: 'clean', label: 'Clean Canvas', icon: FiMinus, desc: 'Empty canvas' }
                      ].map(bgOpt => {
                        const Icon = bgOpt.icon;
                        const isSelected = backgroundStyle === bgOpt.value;
                        return (
                          <button
                            key={bgOpt.value}
                            type="button"
                            onClick={() => setBackgroundStyle(bgOpt.value)}
                            style={{
                              flex: 1,
                              padding: '12px 8px',
                              borderRadius: 12,
                              border: isSelected ? '2px solid var(--theme-primary)' : '1px solid #E2E8F0',
                              background: isSelected ? 'var(--theme-primary-glow)' : 'white',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              textAlign: 'center',
                              gap: 8,
                              boxShadow: isSelected ? '0 4px 12px rgba(142, 119, 187, 0.1)' : '0 2px 4px rgba(0,0,0,0.01)',
                            }}
                          >
                            <Icon size={16} color={isSelected ? 'var(--theme-primary)' : '#64748B'} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                {bgOpt.label}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Canvas Background Dot/Line Size */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                      Grid Dot / Line Size
                      <Tooltip text="Adjust the line or dot size of the background grid." />
                    </label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {[
                        { value: 1, label: 'Small' },
                        { value: 1.5, label: 'Default' },
                        { value: 2, label: 'Medium' },
                        { value: 3, label: 'Large' }
                      ].map(sizeOpt => {
                        const isSelected = dotSize === sizeOpt.value;
                        return (
                          <button
                            key={sizeOpt.value}
                            type="button"
                            onClick={() => setDotSize(sizeOpt.value)}
                            style={{
                              flex: 1,
                              padding: '10px 8px',
                              borderRadius: 10,
                              border: isSelected ? '2px solid var(--theme-primary)' : '1px solid #E2E8F0',
                              background: isSelected ? 'var(--theme-primary-glow)' : 'white',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              textAlign: 'center',
                              gap: 2,
                            }}
                          >
                            <div style={{ fontSize: 12, fontWeight: 700 }}>
                              {sizeOpt.label}
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                              {sizeOpt.value}px
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* CATEGORY 2: Connection Lines & Wires */}
                <div style={{ 
                  background: 'white', 
                  border: '1px solid #E2E8F0', 
                  borderRadius: 16, 
                  padding: 24, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 20,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                    <FiActivity size={18} color="var(--theme-primary)" />
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>Connecting Wires & Edges</h3>
                  </div>

                  {/* Connecting Wire Style */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                      Edge Routing Style
                      <Tooltip text="Select orthogonal 90-degree lines or smooth Bezier curves to connect nodes." />
                    </label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => setWireStyle('square')}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: 12,
                          border: wireStyle === 'square' ? '2px solid var(--theme-primary)' : '1px solid #E2E8F0',
                          background: wireStyle === 'square' ? 'var(--theme-primary-glow)' : 'white',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.15s',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
                          <FiCornerDownRight size={16} color="var(--theme-primary)" />
                          Orthogonal
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setWireStyle('curve')}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: 12,
                          border: wireStyle === 'curve' ? '2px solid var(--theme-primary)' : '1px solid #E2E8F0',
                          background: wireStyle === 'curve' ? 'var(--theme-primary-glow)' : 'white',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.15s',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
                          <FiActivity size={16} color="var(--theme-primary)" />
                          Bezier Curve
                        </div>
                      </button>
                    </div>
                  </div>



                </div>

                {/* CATEGORY 3: Nodes & Connection Dots */}
                <div style={{ 
                  background: 'white', 
                  border: '1px solid #E2E8F0', 
                  borderRadius: 16, 
                  padding: 24, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 20,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                    <FiCpu size={18} color="var(--theme-primary)" />
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>Nodes & Connection Handles</h3>
                  </div>

                  {/* Node Design Theme */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                      Node Design Theme
                      <Tooltip text="Switch the color theme design of node elements on the canvas." />
                    </label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {[
                        { value: 'modern', label: 'Modern (Default)' },
                        { value: 'flat', label: 'Flat' },
                        { value: 'border', label: 'Border Outline' }
                      ].map(themeOpt => {
                        const isSelected = nodeTheme === themeOpt.value;
                        return (
                          <button
                            key={themeOpt.value}
                            type="button"
                            onClick={() => setNodeTheme(themeOpt.value)}
                            style={{
                              flex: 1,
                              padding: '12px',
                              borderRadius: 12,
                              border: isSelected ? '2px solid var(--theme-primary)' : '1px solid #E2E8F0',
                              background: isSelected ? 'var(--theme-primary-glow)' : 'white',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 2,
                            }}
                          >
                            <div style={{ fontSize: 12, fontWeight: 700 }}>
                              {themeOpt.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Node Connection Handle Size */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                      Node Dot Size (Connection Handles)
                      <Tooltip text="Select the handle diameter size of input and output connection dots on nodes." />
                    </label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {[
                        { value: 8, label: 'Small' },
                        { value: 10, label: 'Default' },
                        { value: 12, label: 'Medium' },
                        { value: 14, label: 'Large' }
                      ].map(sizeOpt => {
                        const isSelected = handleSize === sizeOpt.value;
                        return (
                          <button
                            key={sizeOpt.value}
                            type="button"
                            onClick={() => setHandleSize(sizeOpt.value)}
                            style={{
                              flex: 1,
                              padding: '10px 8px',
                              borderRadius: 10,
                              border: isSelected ? '2px solid var(--theme-primary)' : '1px solid #E2E8F0',
                              background: isSelected ? 'var(--theme-primary-glow)' : 'white',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              textAlign: 'center',
                              gap: 2,
                            }}
                          >
                            <div style={{ fontSize: 12, fontWeight: 700 }}>
                              {sizeOpt.label}
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                              {sizeOpt.value}px
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Connection Magnet Snap Sensitivity */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                      Connection Magnet Sensitivity
                      <Tooltip text="Select how far a connection wire can be from a dot before it snaps into place." />
                    </label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {[
                        { value: 10, label: 'Low', desc: '10px snap' },
                        { value: 20, label: 'Normal', desc: '20px snap' },
                        { value: 30, label: 'High', desc: '30px snap' },
                        { value: 40, label: 'Strong', desc: '40px snap' }
                      ].map(snapOpt => {
                        const isSelected = connectionRadius === snapOpt.value;
                        return (
                          <button
                            key={snapOpt.value}
                            type="button"
                            onClick={() => setConnectionRadius(snapOpt.value)}
                            style={{
                              flex: 1,
                              padding: '10px 8px',
                              borderRadius: 10,
                              border: isSelected ? '2px solid var(--theme-primary)' : '1px solid #E2E8F0',
                              background: isSelected ? 'var(--theme-primary-glow)' : 'white',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              textAlign: 'center',
                              gap: 2,
                            }}
                          >
                            <div style={{ fontSize: 12, fontWeight: 700 }}>
                              {snapOpt.label}
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                              {snapOpt.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <div style={{
        borderTop: '1px solid var(--border-light)',
        background: 'white',
        padding: '14px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.04)'
      }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
          {activeTab === 'architect' ? 'Architect Configuration' : 'Canvas Settings'}
        </span>
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 28px',
            background: saveSuccess ? '#10B981' : isDirty ? 'var(--theme-primary)' : '#E5E7EB',
            color: saveSuccess || isDirty ? 'white' : '#9CA3AF',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: saving || !isDirty ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: saveSuccess ? '0 4px 12px rgba(16,185,129,0.3)' : isDirty ? '0 4px 12px var(--theme-primary-glow)' : 'none',
            opacity: saving ? 0.7 : 1
          }}
        >
          {saving ? (
            <FiLoader className="animate-spin" size={16} />
          ) : saveSuccess ? (
            <><FiCheck size={16} /> Saved!</>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
      </div>
    </div>
  );
}
