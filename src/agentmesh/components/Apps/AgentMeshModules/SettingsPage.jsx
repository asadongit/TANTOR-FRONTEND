import React, { useState, useEffect, useRef } from 'react';
import { listAvailableModels } from '../../../api/agentmesh';
import { 
  FiCpu, FiCheck, FiLoader, FiEye, FiEyeOff, FiLayout,
  FiCornerDownRight, FiActivity, FiGrid, FiMaximize, FiTarget, FiMinus
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useUIStore } from '../../../store';

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
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Track the last-persisted values to compute isDirty
  const savedRef = useRef({ provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0.2, apiKeyOverride: '', wireStyle: 'square', backgroundStyle: 'dots' });
  const isDirty =
    provider !== savedRef.current.provider ||
    model !== savedRef.current.model ||
    temperature !== savedRef.current.temperature ||
    apiKeyOverride !== savedRef.current.apiKeyOverride ||
    wireStyle !== savedRef.current.wireStyle ||
    backgroundStyle !== savedRef.current.backgroundStyle;

  useEffect(() => {
    // Load settings from localStorage
    const cachedProvider = localStorage.getItem('architect_provider') || 'groq';
    const cachedModel = localStorage.getItem('architect_model') || 'llama-3.3-70b-versatile';
    const cachedTemp = localStorage.getItem('architect_temperature') || '0.2';
    const cachedKey = localStorage.getItem('architect_api_key') || '';
    const cachedWire = localStorage.getItem('canvas_wire_style') || 'square';
    const cachedBg = localStorage.getItem('canvas_background_style') || 'dots';

    setProvider(cachedProvider);
    setModel(cachedModel);
    setTemperature(parseFloat(cachedTemp));
    setApiKeyOverride(cachedKey);
    setWireStyle(cachedWire);
    setBackgroundStyle(cachedBg);

    // Sync ref so isDirty starts false
    savedRef.current = {
      provider: cachedProvider,
      model: cachedModel,
      temperature: parseFloat(cachedTemp),
      apiKeyOverride: cachedKey,
      wireStyle: cachedWire,
      backgroundStyle: cachedBg
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

      // Propagate setting changes to store instantly
      const storeState = useUIStore.getState();
      if (storeState.setCanvasWireStyle) storeState.setCanvasWireStyle(wireStyle);
      if (storeState.setCanvasBackgroundStyle) storeState.setCanvasBackgroundStyle(backgroundStyle);

      // Update ref so isDirty resets to false
      savedRef.current = { provider, model, temperature, apiKeyOverride, wireStyle, backgroundStyle };
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
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>Global Settings</h1>
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
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 640 }}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1E1B4B', margin: '0 0 8px 0' }}>Architect Configuration</h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Configure the default model and provider settings used globally by the Workflow Architect and Skill SOP Writer.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Provider Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Provider</label>
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
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model</label>
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
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Temperature</label>
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
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>API Key Override (Optional)</label>
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
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 640 }}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1E1B4B', margin: '0 0 8px 0' }}>Canvas Settings</h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Configure the appearance and behaviors of the workspace workflow canvas.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Connecting Wire Style */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Edge Routing Style</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setWireStyle('square')}
                      style={{
                        flex: 1,
                        padding: '16px',
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
                        justifyContent: 'center',
                        gap: 8
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
                        <FiCornerDownRight size={18} color="var(--theme-primary)" />
                        Orthogonal (SmoothStep)
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, textAlign: 'center' }}>90-degree step wires with rounded corners</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWireStyle('curve')}
                      style={{
                        flex: 1,
                        padding: '16px',
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
                        justifyContent: 'center',
                        gap: 8
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
                        <FiActivity size={18} color="var(--theme-primary)" />
                        Bezier Curve
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, textAlign: 'center' }}>Smooth fluid curves connecting your nodes</div>
                    </button>
                  </div>
                </div>

                {/* Canvas Grid Background */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Canvas Background Grid</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[
                      { value: 'dots', label: 'Dots Grid', icon: FiGrid, desc: 'Dotted workspace pattern' },
                      { value: 'lines', label: 'Lines Grid', icon: FiMaximize, desc: 'Full horizontal & vertical gridlines' },
                      { value: 'cross', label: 'Cross Grid', icon: FiTarget, desc: 'Clean intersection tick-marks' },
                      { value: 'clean', label: 'Clean Canvas', icon: FiMinus, desc: 'Empty canvas without background grid' }
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
                            padding: '20px 16px',
                            borderRadius: 16,
                            border: isSelected ? '2px solid var(--theme-primary)' : '1px solid #E2E8F0',
                            background: isSelected ? 'var(--theme-primary-glow)' : 'white',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: 12,
                            boxShadow: isSelected ? '0 4px 12px rgba(142, 119, 187, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
                          }}
                        >
                          <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: isSelected ? 'white' : '#F1F5F9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                            transition: 'all 0.2s',
                            flexShrink: 0
                          }}>
                            <Icon size={20} color={isSelected ? 'var(--theme-primary)' : '#64748B'} />
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                              {bgOpt.label}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.3, maxWidth: 110, textAlign: 'center' }}>
                              {bgOpt.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
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
