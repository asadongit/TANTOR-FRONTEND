import React, { useState, useEffect } from 'react';
import { registerMCPServer, syncMCPTools } from '../../../api/agentmesh';
import { FiX, FiServer, FiTerminal, FiDatabase, FiActivity, FiGlobe, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AgentMesh Styled MCP Connector Modal
 * Supports both creating and editing MCP server configurations.
 */
const MCPConnectorModal = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [form, setForm] = useState({ 
    name: '', 
    command: '', 
    args: '', 
    env: '', 
    transport: 'stdio' 
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Sync form state when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          name: initialData.name || '',
          command: initialData.command || '',
          args: (initialData.args || []).join(' '),
          env: initialData.env ? Object.entries(initialData.env).map(([k, v]) => `${k}=${v}`).join(', ') : '',
          transport: initialData.transport || 'stdio'
        });
      } else {
        setForm({ name: '', command: '', args: '', env: '', transport: 'stdio' });
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!form.name || !form.command) {
      setError('Name and Command are required.');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const envObj = {};
      if (form.env) {
        form.env.split(',').forEach(pair => {
          const splitIdx = pair.indexOf('=');
          if (splitIdx > -1) {
            const k = pair.substring(0, splitIdx).trim();
            const v = pair.substring(splitIdx + 1).trim();
            if (k) envObj[k] = v;
          }
        });
      }

      await registerMCPServer({ 
        name: form.name, 
        command: form.command, 
        args: form.args.split(' ').filter(Boolean), 
        env: envObj,
        transport: form.transport 
      });
      
      await syncMCPTools();
      onSuccess();
      onClose();
    } catch (e) {
      setError('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, placeholder, icon, disabled = false) => (
    <div style={{ marginBottom: 20 }}>
      <label style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8,
        fontSize: 12, 
        color: 'var(--text-secondary)', 
        marginBottom: 8, 
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        {label}
      </label>
      <input 
        value={form[key]} 
        disabled={disabled}
        onChange={(e) => {
          setForm({ ...form, [key]: e.target.value });
          if (error) setError(null);
        }} 
        placeholder={placeholder}
        style={{ 
          width: '100%', 
          padding: '12px 14px', 
          border: '1px solid var(--border)', 
          borderRadius: 8, 
          fontSize: 14, 
          outline: 'none', 
          color: disabled ? 'var(--text-muted)' : 'var(--text-primary)', 
          background: disabled ? 'var(--bg-canvas)' : 'white',
          fontFamily: 'inherit', 
          transition: 'all 0.15s ease',
          cursor: disabled ? 'not-allowed' : 'text'
        }}
        onFocus={(e) => {
          if(!disabled) {
            e.currentTarget.style.borderColor = 'var(--text-primary)';
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--shadow-sm)';
          }
        }}
        onBlur={(e) => {
          if(!disabled) {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      />
    </div>
  );

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(28, 28, 30, 0.4)',
            backdropFilter: 'blur(12px)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 480,
            position: 'relative',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
            border: '1px solid var(--border)'
          }}
        >
          {/* Header */}
          <div style={{ 
            padding: '24px 32px', 
            borderBottom: '1px solid var(--border-light)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ 
                width: 44, height: 44, borderRadius: 12, 
                background: 'var(--accent-btn)', color: 'var(--accent-btn-text)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(142, 119, 187, 0.3)'
              }}>
                <FiServer size={22} />
              </div>
              <div>
                <h2 style={{ 
                  fontSize: 18, 
                  fontWeight: 700, 
                  color: 'var(--text-primary)', 
                  margin: 0, 
                  letterSpacing: '-0.01em'
                }}>
                  {initialData ? 'Update Connection' : 'MCP Connector'}
                </h2>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                  {initialData ? `Configuring ${initialData.name}` : 'Register Model Context Protocol Server'}
                </span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              style={{ 
                background: 'var(--bg-hover)', border: 'none', cursor: 'pointer', 
                color: 'var(--text-secondary)', borderRadius: '50%', width: 32, height: 32, 
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '32px', background: 'var(--bg-primary)' }}>
            {error && (
              <div style={{ 
                padding: '12px 14px', background: '#FEF2F2', borderRadius: 10, 
                color: 'var(--red)', fontSize: 13, fontWeight: 500, marginBottom: 20,
                border: '1px solid #FEE2E2', display: 'flex', gap: 8
              }}>
                <FiX size={16} /> {error}
              </div>
            )}

            {field('Server Identity', 'name', 'e.g. Google Search Proxy', <FiDatabase size={14} />, !!initialData)}
            {field('Runtime Executable', 'command', 'uvx, npx, python...', <FiTerminal size={14} />)}
            {field('Command Arguments', 'args', '--arg value @provider/package', <FiActivity size={14} />)}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ 
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, 
                  color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  <FiGlobe size={14} color="var(--text-muted)" /> Env Vars
                </label>
                <input 
                  value={form.env} 
                  onChange={(e) => setForm({ ...form, env: e.target.value })}
                  placeholder="KEY=VAL, ..."
                  style={{ 
                    width: '100%', padding: '12px 14px', border: '1px solid var(--border)', 
                    borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', 
                    background: 'white', fontFamily: 'inherit' 
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, 
                  color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  <FiServer size={14} color="var(--text-muted)" /> Transport
                </label>
                <select 
                  value={form.transport} 
                  onChange={(e) => setForm({ ...form, transport: e.target.value })}
                  style={{ 
                    width: '100%', padding: '12px 14px', border: '1px solid var(--border)', 
                    borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', 
                    background: 'white', fontFamily: 'inherit', appearance: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="stdio">stdio</option>
                  <option value="streamable_http">http</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            padding: '20px 32px', background: 'white', borderTop: '1px solid var(--border-light)',
            display: 'flex', justifyContent: 'flex-end', gap: 12 
          }}>
            <button 
              onClick={onClose} 
              className="btn-secondary"
              style={{ minWidth: 100, borderRadius: 8 }}
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={saving} 
              className="btn-primary"
              style={{ 
                minWidth: 160, borderRadius: 8, display: 'flex', 
                alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 10px rgba(142, 119, 187, 0.4)'
              }}
            >
              {saving ? (
                <>
                  <div className="loading-spinner" style={{ borderTopColor: 'var(--accent-btn-text)' }} />
                  Saving...
                </>
              ) : (
                <>
                  {initialData ? 'Update Connection' : 'Connect Server'} <FiChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MCPConnectorModal;
