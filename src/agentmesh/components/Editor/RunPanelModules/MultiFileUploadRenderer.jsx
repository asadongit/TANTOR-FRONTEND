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
  const pdfMode = config?.pdf_processing_mode || 'whole_file';

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
      const { ingestData } = await import('../../../api/agentmesh');

      let currentCount = 0;
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await ingestData(formData);
        if (res.status === 'success') {
          uploadedFiles.push({
            path: res.file_path,
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

        {pdfMode === 'page_by_page' && (
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

      {/* Progress Modal Overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-ping opacity-75" />
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <FiUploadCloud size={28} className="animate-bounce" />
            </div>
          </div>

          <div>
            <h4 className="text-base font-bold text-gray-900 m-0">Uploading & Ingesting Documents</h4>
            <p className="text-xs text-gray-500 mt-1 m-0">
              Processing {selectedFiles.length} file(s) for automated workflow classification
            </p>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full max-w-xs flex flex-col gap-1.5 mt-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-indigo-600">Batch Upload Progress</span>
              <span className="text-gray-500">{Math.round((uploadProgress / selectedFiles.length) * 100)}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200/60">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(uploadProgress / selectedFiles.length) * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-gray-400 mt-1">
              Uploading {uploadProgress} of {selectedFiles.length} documents...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
