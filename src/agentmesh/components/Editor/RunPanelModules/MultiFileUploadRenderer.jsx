import React, { useRef, useState } from 'react';
import { FiUploadCloud, FiFile, FiTrash2, FiAlertCircle, FiCheck, FiLayers } from 'react-icons/fi';

const ACCENT = '#6366F1';

export default function MultiFileUploadRenderer({ config, context, isLoading, onSubmit }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef(null);

  const rawAllowed = config?.allowed_extensions && Array.isArray(config.allowed_extensions)
    ? config.allowed_extensions
    : ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
  const allowedExts = rawAllowed.map(e => e.toLowerCase().replace('.', '')).filter(Boolean);
  const maxMb = config?.max_file_size_mb || 25.0;
  const maxFiles = config?.max_files_count || 10;
  const pdfRule = (config?.strategy_rules || []).find(r => r.file_type === 'pdf');
  const pdfMode = pdfRule?.strategy || 'page_by_page';

  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const validateAndAddFiles = (filesList) => {
    setErrorMessage('');
    const newFiles = [...selectedFiles];
    let errs = [];

    for (const file of Array.from(filesList)) {
      if (newFiles.length >= maxFiles) {
        errs.push(`Maximum file limit of ${maxFiles} reached.`);
        break;
      }

      const ext = file.name.split('.').pop().toLowerCase();
      if (!allowedExts.includes(ext)) {
        errs.push(`File '${file.name}' format .${ext} is not allowed (Allowed: ${allowedExts.join(', ')})`);
        continue;
      }

      if (file.size > maxMb * 1024 * 1024) {
        errs.push(`File '${file.name}' (${formatBytes(file.size)}) exceeds limit of ${maxMb} MB`);
        continue;
      }

      // Avoid duplicates by name + size
      if (!newFiles.some(f => f.name === file.name && f.size === file.size)) {
        newFiles.push(file);
      }
    }

    if (errs.length > 0) {
      setErrorMessage(errs[0]);
    }
    setSelectedFiles(newFiles);
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setErrorMessage('');
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      setErrorMessage('Please select at least 1 file to upload.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setErrorMessage('');

    try {
      const uploadedFiles = [];
      const { uploadTempFile } = await import('../../../api/agentmesh');
      const safeThreadId = context?.thread_id || 'default_thread';

      let currentCount = 0;
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('thread_id', safeThreadId);
        const res = await uploadTempFile(formData);
        if (res.status === 'success') {
          uploadedFiles.push({
            path: res.vfs_path,
            filename: file.name,
            size: file.size,
            type: file.type
          });
          currentCount++;
          setUploadProgress(currentCount);
        } else {
          throw new Error(`Upload failed for ${file.name}`);
        }
      }

      if (onSubmit) {
        onSubmit({
          uploaded_files: uploadedFiles,
          uploaded_count: uploadedFiles.length
        });
      }
    } catch (err) {
      console.error("Multi-file upload error:", err);
      setErrorMessage("Upload failed: " + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-xl max-w-lg w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FiUploadCloud size={20} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800 m-0">Multi-File Batch Upload</h4>
            <p className="text-xs text-gray-400 m-0">
              Upload up to {maxFiles} files (max {maxMb}MB each)
            </p>
          </div>
        </div>

        {pdfMode === 'whole_file' ? (
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-medium border border-blue-200/60 flex items-center gap-1">
            <FiLayers size={12} /> Whole PDF
          </span>
        ) : (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-medium border border-amber-200/60 flex items-center gap-1">
            <FiLayers size={12} /> Page-by-Page
          </span>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        className="flex flex-col items-center justify-center gap-2.5 p-6 rounded-2xl cursor-pointer bg-slate-50/80 border-2 border-dashed border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-all text-center group"
      >
        <div className="w-11 h-11 rounded-xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
          <FiUploadCloud size={22} />
        </div>
        <div>
          <span className="text-sm font-semibold text-gray-800 block">Click to Select or Drop Files</span>
          <span className="text-xs text-gray-400 mt-0.5 block">
            Allowed: {allowedExts.map(e => e.toUpperCase()).join(', ')}
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedExts.length > 0 ? allowedExts.map(e => `.${e}`).join(',') : undefined}
          onClick={(e) => { e.target.value = null; }}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
          <FiAlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Selected Documents ({selectedFiles.length}/{maxFiles})
          </span>
          {selectedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <FiFile size={16} className="text-indigo-500 shrink-0" />
                <div className="truncate">
                  <span className="font-medium text-gray-800 block truncate">{file.name}</span>
                  <span className="text-[10px] text-gray-400">{formatBytes(file.size)}</span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer"
                title="Remove file"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex gap-3 pt-2 justify-end">
        <button
          onClick={handleSubmit}
          disabled={selectedFiles.length === 0 || isSubmitting || isLoading}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 text-white rounded-xl text-sm font-semibold shadow-md transition-all border-none cursor-pointer w-full ${
            selectedFiles.length === 0 || isSubmitting
              ? 'bg-gray-300 cursor-not-allowed shadow-none'
              : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]'
          }`}
        >
          {isSubmitting ? (
            <>Uploading & Ingesting Files...</>
          ) : (
            <>
              <FiCheck size={16} /> Submit & Process {selectedFiles.length} File(s)
            </>
          )}
        </button>
      </div>

      {/* Minimalist Loading Overlay matching FormRenderer */}
      {isSubmitting && (
        <div style={{
          position: 'absolute',
          top: -24,
          left: -24,
          right: -24,
          bottom: -24,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(4px)',
          borderRadius: 24,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12
        }}>
          <div style={{
            width: 38,
            height: 38,
            border: '3px solid rgba(99, 102, 241, 0.2)',
            borderTopColor: '#6366F1',
            borderRadius: '50%',
            animation: 'multiFileModalSpin 0.8s linear infinite'
          }} />
          <style>{`
            @keyframes multiFileModalSpin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', letterSpacing: '0.02em' }}>
            Uploading & Ingesting {selectedFiles.length} File(s)...
          </div>
          <div style={{ width: '180px', height: '4px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: '#6366F1',
              width: `${(uploadProgress / selectedFiles.length) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
