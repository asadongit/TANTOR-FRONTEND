import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFolder, FiFile, FiDownload, FiX, FiRefreshCw, FiSearch, FiCode, FiType, FiClock, FiActivity, FiDatabase, FiTrendingUp, FiFileText, FiBarChart } from 'react-icons/fi';
import { listVfsFiles, readVfsFile } from '../../../../api/agentmesh';
import { formatMessage } from '../../../Common/messageFormatting';

const THEME_ACCENT = '#8E77BB';
const THEME_SECONDARY = '#4F46E5';
const THEME_BORDER = '#F0F0EF';
const THEME_BG_MUTED = '#F8FAFC';

export default function VfsExplorer({ rootDir, threadId, isOpen, onClose }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [search, setSearch] = useState('');

  const fetchFiles = async () => {
    if (!rootDir) return;
    try {
      setLoading(true);
      setError(null);
      const res = await listVfsFiles(rootDir, threadId || 'default');
      setFiles(res.files || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
      setSelectedFile(null);
    }
  }, [isOpen, rootDir, threadId]);

  const handleReadFile = async (file) => {
    try {
      setLoading(true);
      const res = await readVfsFile(rootDir, file.path, threadId || 'default');
      setSelectedFile(file);
      setFileContent(res.content);
    } catch (e) {
      alert(`Failed to read file: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    f.path.toLowerCase().includes(search.toLowerCase())
  );

  const isMarkdown = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    return ['md', 'markdown', 'txt'].includes(ext);
  };

  const isCSV = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    return ['csv'].includes(ext);
  };

  const parseCSV = (content) => {
    const lines = content.trim().split('\n');
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      return line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    });
    return { headers, rows };
  };

  const getBadgeColor = (category) => {
    if (category === 'Knowledge') return { bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE' };
    if (category === 'Artifact') return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
    return { bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB' };
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    
    if (['csv', 'xlsx', 'xls'].includes(ext)) {
      return <FiBarChart size={18} style={{ color: '#059669' }} />; 
    }
    
    if (ext === 'pdf') {
      return <FiFileText size={18} style={{ color: '#DC2626' }} />; 
    }
    
    if (['md', 'markdown', 'txt'].includes(ext)) {
      return <FiType size={18} style={{ color: '#4F46E5' }} />;
    }

    if (['json', 'py', 'js'].includes(ext)) {
      return <FiCode size={18} style={{ color: '#D97706' }} />;
    }

    return <FiFile size={18} />;
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)',
    }}>
      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        style={{
          width: '94%', maxWidth: 1200, height: '85vh',
          background: 'rgba(255, 255, 255, 0.98)', borderRadius: 32, overflow: 'hidden',
          display: 'flex', flexDirection: 'column', 
          boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.8) inset',
          border: '1px solid rgba(0,0,0,0.05)'
        }}
      >
        <div style={{
          padding: '16px 40px', 
          borderBottom: `1px solid ${THEME_BORDER}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(to bottom, #FFFFFF, #FCFCFB)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 850, color: '#111827', letterSpacing: '-0.02em' }}>
                Mesh Filesystem Explorer
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button 
              onClick={fetchFiles}
              title="Refresh"
              style={{ 
                width: 32, height: 32, borderRadius: 8, border: `1px solid ${THEME_BORDER}`, 
                background: 'white', cursor: 'pointer', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <FiRefreshCw size={14} color="#6B7280" className={loading ? 'spin' : ''} />
            </button>
            
            <div style={{ width: 1, height: 20, background: THEME_BORDER, margin: '0 4px' }} />

            <button 
              onClick={onClose}
              title="Close"
              style={{ 
                width: 32, height: 32, borderRadius: 8, border: 'none', 
                background: 'transparent', color: '#9CA3AF', cursor: 'pointer', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s' 
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#111827'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ 
            width: 380, borderRight: `1px solid ${THEME_BORDER}`, 
            display: 'flex', flexDirection: 'column', background: '#FCFCFB' 
          }}>
            <div style={{ padding: '20px 24px', position: 'relative' }}>
               <FiSearch style={{ position: 'absolute', left: 40, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
               <input 
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 placeholder="Search files..."
                 style={{
                   width: '100%', padding: '14px 14px 14px 44px', borderRadius: 16, 
                   border: `1px solid #E5E7EB`, fontSize: 13, outline: 'none', 
                   background: 'white', transition: 'all 0.2s',
                   fontWeight: 500
                 }}
                 onFocus={e => e.currentTarget.style.borderColor = THEME_ACCENT}
                 onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
               />
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
              {loading ? (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: 40,
                  textAlign: 'center',
                  color: '#94A3B8' 
                }}>
                  <FiRefreshCw className="spin" style={{ marginBottom: 16 }} size={32} />
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#6B7280' }}>Indexing VFS Nodes...</div>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: 40,
                  textAlign: 'center',
                  color: '#94A3B8' 
                }}>
                  <FiFolder style={{ marginBottom: 20, opacity: 0.1 }} size={56} />
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#6B7280' }}>No artifacts found.</div>
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>Files created by agents will appear here.</div>
                </div>
              ) : (
                <div style={{ padding: '8px' }}>
                  {filteredFiles.map(file => {
                    const isActive = selectedFile?.path === file.path;
                    return (
                      <motion.div 
                        key={file.path}
                        whileHover={{ x: 4 }}
                        onClick={() => handleReadFile(file)}
                        style={{
                          padding: '14px 18px', borderRadius: 16, cursor: 'pointer',
                          background: isActive ? 'white' : 'transparent',
                          boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                          border: `1px solid ${isActive ? '#E5E7EB' : 'transparent'}`,
                          transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', gap: 14
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: isActive ? `${THEME_ACCENT}15` : '#F1F5F9',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isActive ? THEME_ACCENT : '#64748B'
                        }}>
                          {getFileIcon(file.name)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                             <div style={{ 
                                fontSize: 13, fontWeight: 700, color: isActive ? '#111827' : '#4B5563', 
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
                             }}>
                               {file.name}
                             </div>
                             {file.category && (
                               <div style={{
                                 fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6,
                                 background: getBadgeColor(file.category).bg,
                                 color: getBadgeColor(file.category).text,
                                 border: `1px solid ${getBadgeColor(file.category).border}`,
                                 textTransform: 'uppercase', letterSpacing: '0.05em'
                               }}>
                                 {file.category}
                                </div>
                             )}
                          </div>
                          <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2, fontWeight: 600 }}>
                            {file.path.split('/').slice(0,-1).join('/') || '/root'}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={{ flex: 1, background: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {selectedFile ? (
              <>
                <div style={{ 
                  padding: '18px 32px', borderBottom: `1px solid ${THEME_BORDER}`, 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  background: 'white' 
                }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <FiFile color={THEME_ACCENT} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 750, color: '#1F2937' }}>
                         <span style={{ color: '#9CA3AF' }}>VFS</span>
                         <span style={{ color: '#E5E7EB' }}>/</span>
                         {selectedFile.path.split('/').map((part, pidx, arr) => (
                           <React.Fragment key={pidx}>
                             <span style={{ color: pidx === arr.length - 1 ? '#111827' : '#6B7280' }}>{part}</span>
                             {pidx < arr.length - 1 && <span style={{ color: '#E5E7EB' }}>/</span>}
                           </React.Fragment>
                         ))}
                      </div>
                   </div>
                   <div style={{ display: 'flex', gap: 8 }}>
                     <button 
                       onClick={() => {
                         const blob = new Blob([fileContent], { type: 'text/plain' });
                         const url = URL.createObjectURL(blob);
                         const a = document.createElement('a');
                         a.href = url;
                         a.download = selectedFile.name;
                         a.click();
                       }}
                       style={{ 
                         padding: '8px 16px', borderRadius: 10, background: THEME_ACCENT, 
                         color: 'white', border: 'none', fontSize: 11, fontWeight: 800, 
                         cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                         boxShadow: `0 4px 12px ${THEME_ACCENT}40`
                       }}
                     >
                       <FiDownload size={14} /> EXPORT
                     </button>
                   </div>
                 </div>

                <div style={{ flex: 1, overflow: 'auto', padding: (isMarkdown(selectedFile.name) || isCSV(selectedFile.name)) ? '32px 50px' : '20px' }}>
                   {isMarkdown(selectedFile.name) ? (
                      <div style={{ maxWidth: 800, margin: '0 auto' }}>
                         {formatMessage(fileContent)}
                      </div>
                   ) : isCSV(selectedFile.name) ? (
                      <div style={{ width: '100%', overflowX: 'auto', borderRadius: 16, border: '1px solid #E2E8F0', background: 'white' }} className="msg-scrollbar">
                         <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                            <thead style={{ position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 10 }}>
                               <tr>
                                  {parseCSV(fileContent).headers.map((h, i) => (
                                     <th key={i} style={{ padding: '16px 20px', fontWeight: 800, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>
                                        {h}
                                     </th>
                                  ))}
                               </tr>
                            </thead>
                            <tbody>
                               {parseCSV(fileContent).rows.map((row, ri) => (
                                  <tr key={ri} style={{ borderBottom: '1px solid #F1F5F9', background: ri % 2 === 0 ? 'white' : '#FCFCFB' }}>
                                     {row.map((cell, ci) => (
                                        <td key={ci} style={{ padding: '14px 20px', color: '#1F2937', fontWeight: 500 }}>
                                           {cell}
                                        </td>
                                     ))}
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   ) : (
                      <pre style={{ 
                        margin: 0, padding: 24, borderRadius: 16, background: '#F8FAFC',
                        fontSize: 13, color: '#1F2937', fontFamily: '"JetBrains Mono", monospace', 
                        lineHeight: 1.7, border: '1px solid #E2E8F0',
                        overflowX: 'auto'
                      }} className="msg-scrollbar">
                        <code>{fileContent}</code>
                      </pre>
                   )}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <FiFolder size={80} style={{ marginBottom: 24, opacity: 0.05 }} />
                </motion.div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#64748B' }}>Select an object to inspect</div>
                <div style={{ fontSize: 12, marginTop: 8, opacity: 0.6 }}>Synchronized agent state will appear here</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ 
          padding: '16px 40px', background: '#FCFCFB', borderTop: `1px solid ${THEME_BORDER}`, 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 11, fontWeight: 700, color: '#94A3B8'
        }}>
           <div style={{ display: 'flex', gap: 24 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiClock size={12} /> LAST SYNC: {new Date().toLocaleTimeString()}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiFile size={12} /> {files.length} ARTIFACTS
              </span>
           </div>
           <div style={{ letterSpacing: '0.1em', opacity: 0.5 }}>
              AGENTMESH // SECURE ISOLATION VIRTUAL FILESYSTEM
           </div>
        </div>
      </motion.div>
    </div>
  );
}
