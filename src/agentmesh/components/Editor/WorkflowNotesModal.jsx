import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWorkflowStore, useUIStore } from '../../store';
import { 
  FiX, FiPlus, FiTrash2, FiBold, FiItalic, 
  FiUnderline, FiList, FiSearch, FiBookOpen,
  FiFilePlus, FiSave, FiZap, FiLoader, FiTerminal, FiDatabase
} from 'react-icons/fi';
import { listWorkflowNotes, createWorkflowNote, deleteWorkflowNote, updateWorkflowNote, fixGrammar } from '../../api/agentmesh';

/**
 * REDESIGNED WORKFLOW NOTES ENGINE v2.0
 * -------------------------------------
 * Features:
 * 1. Identity-Locked Editor: Uses 'key' prop to force reset on note change.
 * 2. Aero-Glass UI: Premium professional aesthetic with blur and shadows.
 * 3. Atomic Save Architecture: Captures ID state at request time.
 */

const NOTE_CATEGORIES = ["Technical", "Research", "Brainstorming", "Requirement", "Meeting", "Bug/Issue"];

const STYLES = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 10000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(28, 28, 30, 0.4)', backdropFilter: 'blur(8px)',
    animation: 'fadeIn 0.2s ease-out'
  },
  modal: {
    width: '90%', maxWidth: 1100, height: '85vh',
    background: 'var(--bg-secondary)', borderRadius: 28, 
    display: 'flex', overflow: 'hidden',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border)',
    fontFamily: "'Google Sans', 'Roboto', sans-serif"
  },
  sidebar: {
    width: 320, background: 'var(--bg-canvas)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column'
  },
  editorArea: {
    flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)'
  },
  toolbar: {
    padding: '16px 24px', borderBottom: '1px solid var(--border-light)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
  }
};

export default function WorkflowNotesModal() {
  const { workflowId, workflowName } = useWorkflowStore();
  const { showNotes, toggleNotes } = useUIStore();
  
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [search, setSearch] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, typing, saving, saved
  const [isGrammarFixing, setIsGrammarFixing] = useState(false);
  const [loading, setLoading] = useState(false);

  const editorRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const lastSavedContentRef = useRef('');

  // 1. Initial Load
  useEffect(() => {
    if (showNotes && workflowId) {
      loadNotes();
    }
  }, [showNotes, workflowId]);

  const loadNotes = async (selectId = null) => {
    try {
      setLoading(true);
      const data = await listWorkflowNotes(workflowId);
      const sorted = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // Update the list of notes
      setNotes(sorted);
      
      // Handle selection logic
      if (selectId) {
        const found = sorted.find(n => n.id === selectId);
        if (found) selectNote(found);
      } else if (selectedNote) {
        // Sync selectedNote metadata but avoid overwriting content
        const current = sorted.find(n => n.id === selectedNote.id);
        if (current) {
          setSelectedNote(prev => ({ ...current, content: prev.content }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Controlled Note Selection
  const selectNote = (note) => {
    // Switch Note
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setSelectedNote(note);
    lastSavedContentRef.current = note?.content || '';
    setSaveStatus('idle');
  };

  // 3. Robust Atomic Save
  const saveNote = async (id, content, category) => {
    if (!id || (content === lastSavedContentRef.current && category === selectedNote?.category)) return;
    
    try {
      setSaveStatus('saving');
      await updateWorkflowNote(workflowId, id, content, category);
      
      lastSavedContentRef.current = content;
      setNotes(prev => prev.map(n => n.id === id ? { ...n, content, category } : n));
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 2000);
    } catch (e) {
      console.error('Save failed:', e);
      setSaveStatus('idle');
    }
  };

  const onInput = () => {
    setSaveStatus('typing');
  };

  const handleCreate = async () => {
    try {
      setSaveStatus('saving');
      const res = await createWorkflowNote(workflowId, 'Start typing...', 'Technical');
      await loadNotes(res.id);
    } catch (e) {
      alert('Action failed');
    }
  };

  const handleFixGrammar = async () => {
    if (!selectedNote || !editorRef.current) return;
    const raw = editorRef.current.innerText;
    try {
      setIsGrammarFixing(true);
      const res = await fixGrammar(raw);
      if (res.status === 'success') {
        const paragraphs = res.fixed.split('\n').filter(p => p.trim());
        editorRef.current.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
        saveNote(selectedNote.id, editorRef.current.innerHTML, selectedNote.category);
      }
    } finally {
      setIsGrammarFixing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNote || !window.confirm('Permanent delete?')) return;
    await deleteWorkflowNote(workflowId, selectedNote.id);
    setSelectedNote(null);
    loadNotes();
  };

  const exec = (cmd) => {
    document.execCommand(cmd, false, null);
    editorRef.current?.focus();
  };

  if (!showNotes) return null;

  const filtered = notes.filter(n => n.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={STYLES.overlay} onClick={toggleNotes}>
      <div style={STYLES.modal} onClick={e => e.stopPropagation()}>
        
        {/* Sidebar */}
        <div style={STYLES.sidebar}>
          <div style={{ padding: '24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiBookOpen color="var(--accent-btn-text)" size={24} />
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Journal</h2>
              </div>
              <button onClick={handleCreate} style={{ border: 'none', background: 'var(--accent-btn)', color: 'var(--accent-btn-text)', padding: '6px', borderRadius: 8, cursor: 'pointer', display: 'flex' }}>
                <FiPlus size={20} />
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input 
                placeholder="Search..." 
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 12, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--bg-secondary)' }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 20px' }}>
            {filtered.map(n => {
              const active = selectedNote?.id === n.id;
              const title = n.content.replace(/<[^>]*>/g, ' ').substring(0, 30) || 'Untitled Note';
              return (
                <div 
                  key={n.id} 
                  onClick={() => selectNote(n)}
                  style={{
                    padding: '16px', borderRadius: 16, cursor: 'pointer', marginBottom: 8,
                    background: active ? 'var(--bg-secondary)' : 'transparent',
                    boxShadow: active ? 'var(--shadow-md)' : 'none',
                    border: '1px solid', borderColor: active ? 'var(--border)' : 'transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: active ? 'var(--text-primary)' : 'var(--text-secondary)', marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleDateString()}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Editor Area */}
        <div style={STYLES.editorArea}>
          <div style={STYLES.toolbar}>
            <div style={{ display: 'flex', gap: 8 }}>
              {selectedNote && (
                <>
                  <ToolbarBtn icon={<FiBold />} onAction={() => exec('bold')} />
                  <ToolbarBtn icon={<FiList />} onAction={() => exec('insertUnorderedList')} />
                  <div style={{ width: 1, background: 'var(--border-light)', margin: '0 8px' }} />
                  <button 
                    onClick={() => saveNote(selectedNote.id, editorRef.current.innerHTML, selectedNote.category)} 
                    style={{ 
                      border: 'none', background: 'var(--accent-btn)', color: 'var(--accent-btn-text)', 
                      padding: '6px 12px', borderRadius: 8, fontWeight: 700, 
                      fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 
                    }}
                  >
                    <FiSave size={14}/> SAVE
                  </button>
                  <button onClick={handleFixGrammar} style={{ 
                    border: 'none', background: 'var(--accent-glow)', color: 'var(--text-primary)', 
                    padding: '6px 12px', borderRadius: 8, fontWeight: 700, 
                    fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 
                  }}>
                    {isGrammarFixing ? <FiLoader className="spin" size={14}/> : <FiZap size={14}/>} WIZARD
                  </button>
                </>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {selectedNote && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                    {saveStatus === 'saving' && 'Updating...'}
                    {saveStatus === 'saved' && <span style={{ color: 'var(--green)' }}>Saved</span>}
                    {saveStatus === 'typing' && 'Drafting...'}
                  </div>
                  <select 
                    value={selectedNote.category}
                    onChange={e => saveNote(selectedNote.id, editorRef.current.innerHTML, e.target.value)}
                    style={{ background: 'var(--bg-canvas)', border: 'none', color: 'var(--text-secondary)', padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {NOTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ToolbarBtn icon={<FiTrash2 />} onAction={handleDelete} color="var(--red)" />
                </>
              )}
              <ToolbarBtn icon={<FiX size={20}/>} onAction={toggleNotes} />
            </div>
          </div>

          {selectedNote ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '40px 60px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 800, marginBottom: 16 }}>
                <FiTerminal color="var(--accent-btn)" /> CTX: {workflowName}
              </div>
              <div 
                 key={selectedNote.id}
                 ref={(el) => {
                   if (el) {
                     if (el.innerHTML === "" && selectedNote.content) {
                       el.innerHTML = selectedNote.content;
                     }
                     editorRef.current = el;
                   }
                 }}
                 contentEditable
                 suppressContentEditableWarning
                 onInput={onInput}
                 style={{ fontSize: 18, lineHeight: 1.8, color: 'var(--text-primary)', outline: 'none', minHeight: '60%', whiteSpace: 'pre-wrap' }}
              />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
              <FiDatabase size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-muted)' }}>Select a note from the ledge</p>
            </div>
          )}

        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

function ToolbarBtn({ icon, onAction, color }) {
  return (
    <button 
      onClick={onAction}
      style={{
        border: 'none', background: 'transparent', width: 34, height: 34,
        borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: color || '#64748B', transition: 'all 0.2s'
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {icon}
    </button>
  );
}
