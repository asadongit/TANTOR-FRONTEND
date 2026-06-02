import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiEdit2, FiKey, FiX, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi';
import { listConnections, saveConnection, deleteConnection } from '../../../api/agentmesh';
import ConfirmationModal from '../../Common/ConfirmationModal';
import { useWorkflowStore } from '../../../store';

export default function ConnectionsPage() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { invalidateVaultCache } = useWorkflowStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConn, setEditingConn] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showRefreshToken, setShowRefreshToken] = useState(false);

  const getAccessTokenPlaceholder = () => {
    if (!editingConn) return "Enter access token";
    return showAccessToken ? "Keep existing token" : "••••••••••••••••";
  };

  const getClientSecretPlaceholder = () => {
    if (!editingConn) return "Enter client secret";
    return showClientSecret ? "Keep existing client secret" : "••••••••••••••••";
  };

  const getRefreshTokenPlaceholder = () => {
    if (!editingConn) return "Enter refresh token";
    return showRefreshToken ? "Keep existing refresh token" : "••••••••••••••••";
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listConnections();
      if (res.status === 'success') {
        setConnections(res.connections || []);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch connections");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setConfirmDeleteId(id);
  };

  const confirmDeleteConnectionProfile = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteConnection(confirmDeleteId);
      setConnections(prev => prev.filter(c => c.id !== confirmDeleteId));
      invalidateVaultCache();
    } catch (err) {
      globalThis.alert("Failed to delete: " + err.message);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const openModal = (conn = null) => {
    setShowAccessToken(false);
    setShowClientSecret(false);
    setShowRefreshToken(false);
    if (conn) {
      setEditingConn(conn);
      setFormData({
        id: conn.id,
        platform_name: conn.platform_name,
        auth_type: conn.auth_type,
        enable_heartbeat: conn.enable_heartbeat,
        test_url: conn.test_url || '',
        access_token: '', // never populate secret on edit
        refresh_token: '',
        oauth_client_id: conn.oauth_client_id || '',
        oauth_client_secret: '', // never populate secret on edit
        oauth_token_url: conn.oauth_token_url || ''
      });
    } else {
      setEditingConn(null);
      setFormData({
        id: '',
        platform_name: '',
        auth_type: 'Bearer',
        enable_heartbeat: false,
        test_url: '',
        access_token: '',
        refresh_token: '',
        oauth_client_id: '',
        oauth_client_secret: '',
        oauth_token_url: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.platform_name) {
      alert("Platform name is required");
      return;
    }
    setSaving(true);
    try {
      await saveConnection(formData);
      setIsModalOpen(false);
      invalidateVaultCache();
      fetchConnections();
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC', height: '100%', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ 
        padding: '16px 32px', 
        background: 'white', 
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>Enterprise Vault</h1>
        <button 
          onClick={() => openModal()}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 16px',
            background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.95)'}
          onMouseLeave={e => e.currentTarget.style.filter = 'none'}
        >
          <FiPlus size={14} /> Add Connection
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading vault...</div>
        ) : error ? (
          <div style={{ color: '#ef4444', padding: 20, background: '#fee2e2', borderRadius: 8 }}>{error}</div>
        ) : connections.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <FiDatabase size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 18 }}>Vault is Empty</h3>
            <p style={{ marginTop: 8 }}>Add a connection profile to securely authenticate your API nodes.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
            <AnimatePresence>
              {connections.map((conn) => (
                <motion.div
                  key={conn.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{
                    background: 'white',
                    borderRadius: 24,
                    border: '1px solid #F0F0EE',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.02)';
                    e.currentTarget.style.borderColor = '#F0F0EE';
                  }}
                >
                  {/* Top Body */}
                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: 'var(--theme-primary-glow)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: 'var(--theme-primary)',
                        border: '1px solid rgba(255,255,255,0.4)',
                        boxShadow: '0 8px 16px -4px var(--theme-primary-glow)'
                      }}>
                        <FiKey size={24} strokeWidth={1.5} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                          margin: 0,
                          fontSize: 17,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          letterSpacing: '-0.02em',
                          marginBottom: 4
                        }}>
                          {conn.platform_name}
                        </h3>
                        <div style={{
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          fontFamily: 'monospace',
                          background: '#F1F5F9',
                          padding: '1px 6px',
                          borderRadius: 4,
                          display: 'inline-block',
                          fontWeight: 600
                        }}>
                          {conn.id}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        <strong>Auth Type:</strong> {conn.auth_type}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        <strong>Heartbeat:</strong> {conn.enable_heartbeat ? 'Active' : 'Disabled'}
                      </div>
                      {conn.last_used_at && (
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          <strong>Last Used:</strong> {new Date(conn.last_used_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer area with actions */}
                  <div style={{
                    padding: '12px 24px',
                    background: '#F9FAFB',
                    borderTop: '1px solid #F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: 8,
                    position: 'relative'
                  }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); openModal(conn); }}
                      title="Edit Connection Profile"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: '1px solid #E5E7EB',
                        background: 'white',
                        color: '#6B7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(conn.id); }}
                      title="Delete Connection Profile"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: '1px solid #E5E7EB',
                        background: 'white',
                        color: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'white', width: 500, borderRadius: 20, overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {editingConn ? <FiEdit2 /> : <FiPlus />}
                  {editingConn ? 'Edit Connection Profile' : 'New Connection Profile'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX size={20} /></button>
              </div>

              <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '70vh', overflow: 'auto' }}>
                
                {/* Custom ID input (optional, normally auto-gen) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Profile ID</label>
                  <input 
                    type="text" 
                    value={formData.id} 
                    onChange={e => setFormData({...formData, id: e.target.value})}
                    placeholder="Auto-generated if left blank"
                    disabled={!!editingConn}
                    style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: editingConn ? '#F1F5F9' : 'white', fontSize: 14 }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Used directly in workflow API nodes.</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Platform Name</label>
                  <input 
                    type="text" 
                    value={formData.platform_name} 
                    onChange={e => setFormData({...formData, platform_name: e.target.value})}
                    placeholder="e.g. Salesforce, Zendesk, ERP API"
                    style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Authentication Type</label>
                  <select 
                    value={formData.auth_type} 
                    onChange={e => setFormData({...formData, auth_type: e.target.value})}
                    style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, background: 'white' }}
                  >
                    <option value="None">None (Unauthenticated)</option>
                    <option value="Basic">Basic Auth</option>
                    <option value="Bearer">Bearer Token</option>
                    <option value="OAuth2">OAuth2 (Enterprise Refresh)</option>
                  </select>
                </div>

                {formData.auth_type !== 'None' && (
                  <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Access Token {editingConn && '(Leave empty to keep existing)'}</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input 
                          type={showAccessToken ? "text" : "password"} 
                          value={formData.access_token || ''} 
                          onChange={e => setFormData({...formData, access_token: e.target.value})}
                          placeholder={getAccessTokenPlaceholder()}
                          style={{ padding: '10px 40px 10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowAccessToken(!showAccessToken)}
                          style={{
                            position: 'absolute',
                            right: 12,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 4
                          }}
                        >
                          {showAccessToken ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                        </button>
                      </div>
                    </div>

                    {formData.auth_type === 'OAuth2' && (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>OAuth Token Refresh URL</label>
                          <input 
                            type="text" 
                            value={formData.oauth_token_url} 
                            onChange={e => setFormData({...formData, oauth_token_url: e.target.value})}
                            placeholder="e.g. https://oauth2.googleapis.com/token"
                            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>OAuth Client ID</label>
                          <input 
                            type="text" 
                            value={formData.oauth_client_id} 
                            onChange={e => setFormData({...formData, oauth_client_id: e.target.value})}
                            placeholder="Client ID (from Provider App Console)"
                            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>OAuth Client Secret {editingConn && '(Leave empty to keep existing)'}</label>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input 
                              type={showClientSecret ? "text" : "password"} 
                              value={formData.oauth_client_secret || ''} 
                              onChange={e => setFormData({...formData, oauth_client_secret: e.target.value})}
                              placeholder={getClientSecretPlaceholder()}
                              style={{ padding: '10px 40px 10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowClientSecret(!showClientSecret)}
                              style={{
                                position: 'absolute',
                                right: 12,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 4
                              }}
                            >
                              {showClientSecret ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Refresh Token {editingConn && '(Leave empty to keep existing)'}</label>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input 
                              type={showRefreshToken ? "text" : "password"} 
                              value={formData.refresh_token || ''} 
                              onChange={e => setFormData({...formData, refresh_token: e.target.value})}
                              placeholder={getRefreshTokenPlaceholder()}
                              style={{ padding: '10px 40px 10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowRefreshToken(!showRefreshToken)}
                              style={{
                                position: 'absolute',
                                right: 12,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 4
                              }}
                            >
                              {showRefreshToken ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                  </div>
                )}

                <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Enable Heartbeat Monitor</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Automatically checks health to suspend dead APIs</div>
                      </div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 24 }}>
                      <input 
                        type="checkbox" 
                        checked={formData.enable_heartbeat} 
                        onChange={e => setFormData({...formData, enable_heartbeat: e.target.checked})}
                        style={{ opacity: 0, width: 0, height: 0 }} 
                      />
                      <span style={{ 
                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: formData.enable_heartbeat ? 'var(--theme-primary)' : '#cbd5e1', 
                        transition: '.2s', borderRadius: 24 
                      }}>
                        <span style={{ 
                          position: 'absolute', content: '""', height: 18, width: 18, left: 3, bottom: 3, 
                          backgroundColor: 'white', transition: '.2s', borderRadius: '50%',
                          transform: formData.enable_heartbeat ? 'translateX(16px)' : 'translateX(0)'
                        }}></span>
                      </span>
                    </label>
                  </div>
                  
                  {formData.enable_heartbeat && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Heartbeat Ping URL</label>
                      <input 
                        type="text" 
                        value={formData.test_url} 
                        onChange={e => setFormData({...formData, test_url: e.target.value})}
                        placeholder="https://api.example.com/ping"
                        style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
                      />
                    </div>
                  )}
                </div>

              </div>

              <div style={{ padding: '16px 32px', background: '#F8FAFC', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '10px 16px', background: 'white', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '10px 24px',
                    background: 'var(--theme-primary-glow)',
                    color: 'var(--theme-primary)',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.95)'}
                  onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                >
                  {saving ? 'Saving...' : <><FiCheck /> Save Vault Profile</>}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={confirmDeleteConnectionProfile}
        title="Delete Connection Profile?"
        message="Are you sure you want to delete this connection profile? Workflows using it will fail to authenticate."
        confirmText="Delete Profile"
        variant="danger"
      />
    </div>
  );
}
