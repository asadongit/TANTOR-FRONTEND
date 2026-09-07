import React from 'react';
import { agentMeshFetch } from '../../../api/authenticatedFetch';

export default function FileUploadField({ field, value, onChange, isLoading, threadId }) {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState('');
  const [isDragActive, setIsDragActive] = React.useState(false);

  const allowMultiple = field.allow_multiple ?? field.allowMultiple ?? false;
  const storageMode = field.file_storage_mode ?? field.fileStorageMode ?? 'path';
  const maxSizeMB = field.max_size_mb ?? field.maxSizeMB ?? 10;
  const allowedFormats = field.allowed_types ?? field.allowedTypes ?? [];

  const getAcceptAttribute = () => {
    if (allowedFormats.length === 0) return '*';
    const mapping = {
      pdf: '.pdf',
      csv: '.csv',
      excel: '.xlsx,.xls',
      word: '.docx,.doc',
      image: 'image/*',
      video: 'video/*',
      zip: '.zip,application/zip,application/x-zip-compressed',
      json: '.json,application/json',
    };
    return allowedFormats.map(k => mapping[k] || k).join(',');
  };

  const validateFile = (file) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File "${file.name}" exceeds maximum size limit of ${maxSizeMB}MB.`;
    }

    if (allowedFormats.length > 0) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      const type = file.type;

      const isMatch = allowedFormats.some(k => {
        if (k === 'pdf' && (ext === '.pdf' || type === 'application/pdf')) return true;
        if (k === 'csv' && (ext === '.csv' || type === 'text/csv')) return true;
        if (k === 'excel' && (['.xlsx', '.xls'].includes(ext) || type.includes('excel') || type.includes('spreadsheet'))) return true;
        if (k === 'word' && (['.docx', '.doc'].includes(ext) || type.includes('word') || type.includes('officedocument.wordprocessingml'))) return true;
        if (k === 'image' && type.startsWith('image/')) return true;
        if (k === 'video' && type.startsWith('video/')) return true;
        if (k === 'zip' && (ext === '.zip' || type === 'application/zip' || type === 'application/x-zip-compressed')) return true;
        if (k === 'json' && (ext === '.json' || type === 'application/json')) return true;
        return false;
      });

      if (!isMatch) {
        return `File "${file.name}" format is not allowed. Allowed types: ${allowedFormats.join(', ')}`;
      }
    }
    return null;
  };

  const handleFiles = async (fileList) => {
    setError('');
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const filesToUpload = allowMultiple ? files : [files[0]];

    for (const f of filesToUpload) {
      const err = validateFile(f);
      if (err) {
        setError(err);
        return;
      }
    }

    setUploading(true);
    setProgress(10);

    try {
      const results = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];

        if (storageMode === 'binary') {
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (e) => reject(e);
          });

          results.push({
            filename: file.name,
            size_bytes: file.size,
            mime_type: file.type,
            data: base64
          });
        } else {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('thread_id', threadId);

          const BASE_URL = window._env_?.VITE_AGENT_MESH || import.meta.env.VITE_AGENT_MESH || 'http://localhost:8000/api/v1/agentmesh';

          const response = await agentMeshFetch(`${BASE_URL}/execution/upload-artifact`, {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const uploadMeta = await response.json();
          results.push(uploadMeta);
        }

        setProgress(Number.parseFloat(((i + 1) / filesToUpload.length) * 100) || 100);
      }

      if (allowMultiple) {
        const currentVal = Array.isArray(value) ? value : [];
        onChange([...currentVal, ...results]);
      } else {
        onChange(results[0]);
      }

    } catch (e) {
      setError(e.message || 'An error occurred during file upload');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading && !uploading) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (isLoading || uploading) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (idx) => {
    if (allowMultiple) {
      onChange(value.filter((_, i) => i !== idx));
    } else {
      onChange(null);
    }
  };

  const getFormatBadgeColor = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return { bg: 'rgba(239, 68, 68, 0.08)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.15)', label: 'PDF' };
    if (ext === 'zip') return { bg: 'rgba(217, 119, 6, 0.08)', text: '#D97706', border: 'rgba(217, 119, 6, 0.15)', label: 'ZIP' };
    if (ext === 'json') return { bg: 'rgba(13, 148, 136, 0.08)', text: '#0D9488', border: 'rgba(13, 148, 136, 0.15)', label: 'JSON' };
    if (['csv', 'xlsx', 'xls'].includes(ext)) return { bg: 'rgba(16, 185, 129, 0.08)', text: '#10B981', border: 'rgba(16, 185, 129, 0.15)', label: 'SPREADSHEET' };
    if (['doc', 'docx'].includes(ext)) return { bg: 'rgba(59, 130, 246, 0.08)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.15)', label: 'DOC' };
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) return { bg: 'rgba(139, 92, 246, 0.08)', text: '#8B90F6', border: 'rgba(139, 92, 246, 0.15)', label: 'IMAGE' };
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return { bg: 'rgba(245, 158, 11, 0.08)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.15)', label: 'VIDEO' };
    return { bg: 'rgba(107, 114, 128, 0.08)', text: '#6B7280', border: 'rgba(107, 114, 128, 0.15)', label: 'FILE' };
  };

  const filesList = allowMultiple ? (Array.isArray(value) ? value : []) : (value ? [value] : []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${error ? '#EF4444' : isDragActive ? '#8E77BB' : 'rgba(142, 119, 187, 0.3)'}`,
          borderRadius: 16,
          padding: '24px 20px',
          textAlign: 'center',
          background: isDragActive ? 'rgba(142, 119, 187, 0.03)' : '#F9FAFB',
          cursor: isLoading || uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          boxShadow: isDragActive ? '0 10px 25px rgba(142, 119, 187, 0.05), inset 0 0 20px rgba(142, 119, 187, 0.02)' : 'none',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={() => {
          if (!isLoading && !uploading) {
            document.getElementById(`file-input-${field.id}`).click();
          }
        }}
        onMouseEnter={(e) => {
          if (!isLoading && !uploading && !isDragActive) {
            e.currentTarget.style.borderColor = '#8E77BB';
            e.currentTarget.style.background = '#FFFFFF';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(142, 119, 187, 0.03)';
            e.currentTarget.querySelector('.upload-icon').style.transform = 'translateY(-2px) scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading && !uploading && !isDragActive) {
            e.currentTarget.style.borderColor = 'rgba(142, 119, 187, 0.3)';
            e.currentTarget.style.background = '#F9FAFB';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.querySelector('.upload-icon').style.transform = 'translateY(0) scale(1)';
          }
        }}
      >
        <input
          id={`file-input-${field.id}`}
          type="file"
          multiple={allowMultiple}
          accept={getAcceptAttribute()}
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
          disabled={isLoading || uploading}
        />

        <div className="upload-icon" style={{ transition: 'transform 0.3s cubic-bezier(0.19, 1, 0.22, 1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={error ? '#EF4444' : '#8E77BB'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>
            {uploading ? 'PROCESSING UPLOAD...' : isDragActive ? 'DROP FILES TO UPLOAD' : 'Drag & Drop files or Browse'}
          </div>
          <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>
            Max size: {maxSizeMB}MB {allowedFormats.length > 0 && `| Allowed: ${allowedFormats.join(', ')}`}
          </div>
        </div>

        {uploading && (
          <div style={{ width: '100%', maxWidth: 240, background: '#E5E7EB', borderRadius: 10, height: 4, marginTop: 6, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#8E77BB', borderRadius: 10, transition: 'width 0.3s ease' }} />
          </div>
        )}
      </div>

      {error && (
        <div style={{
          fontSize: 12,
          color: '#EF4444',
          fontWeight: 600,
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
          padding: '10px 14px',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.02)'
        }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {filesList.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {filesList.map((file, idx) => {
            const badge = getFormatBadgeColor(file.filename);
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: 14,
                  fontSize: 13,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(142, 119, 187, 0.2)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.02)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden', flex: 1 }}>
                  <div style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: badge.bg,
                    color: badge.text,
                    border: `1px solid ${badge.border}`,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    flexShrink: 0
                  }}>
                    {badge.label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 2 }}>
                    <span style={{ fontWeight: 600, color: '#1F2937', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: 13 }}>
                      {file.filename}
                    </span>
                    {file.size_bytes && (
                      <span style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 500 }}>
                        {file.size_bytes > 1024 * 1024
                          ? `${(file.size_bytes / (1024 * 1024)).toFixed(2)} MB`
                          : `${Math.round(file.size_bytes / 1024)} KB`}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(idx); }}
                  disabled={isLoading}
                  style={{
                    background: 'rgba(239, 68, 68, 0.06)',
                    border: 'none',
                    color: '#EF4444',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 'bold',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)'; e.currentTarget.style.color = '#EF4444'; }}
                >
                  &times;
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
