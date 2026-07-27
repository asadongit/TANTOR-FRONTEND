import React, { useRef, useState, useEffect } from 'react';
import { FiCamera, FiCheck, FiRefreshCcw, FiUpload, FiFileText, FiX, FiArrowRight } from 'react-icons/fi';

const ACCENT = '#6366F1';
const BORDER = 'rgba(0,0,0,0.1)';
const TEXT = '#111827';

export default function OcrRenderer({ config, context, isLoading, onSubmit }) {
  const [mode, setMode] = useState(null); // null | 'upload' | 'camera'
  const [fileObj, setFileObj] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileType, setFileType] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Camera refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [imageCaptured, setImageCaptured] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  const formatBytes = (bytes, decimals = 1) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error("Camera access error:", err);
    }
  };

  const processFile = (file) => {
    if (!file) return;
    setFileObj(file);
    setFileName(file.name);
    setFileSize(formatBytes(file.size));
    setFileType(file.type || file.name.split('.').pop().toUpperCase());

    const reader = new FileReader();
    reader.onload = (ev) => {
      setFilePreview(ev.target.result);
      setFileData(ev.target.result);
      setMode('upload');
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImageCaptured(dataUrl);
      setFilePreview(dataUrl);
      setFileData(dataUrl);
      setFileName('camera_capture.jpg');
      setFileSize('Captured Photo');
      setFileType('image/jpeg');
      if (stream) stream.getTracks().forEach(t => t.stop());
      setMode('upload');
    }
  };

  const resetSelection = () => {
    setImageCaptured(null);
    setFileObj(null);
    setFilePreview(null);
    setFileData(null);
    setFileName('');
    setFileSize('');
    setFileType('');
    setMode(null);
    if (stream) stream.getTracks().forEach(t => t.stop());
  };

  const handleSubmit = async () => {
    if (fileData && onSubmit) {
      setIsSubmitted(true);
      try {
        let filePath = null;
        if (fileObj) {
          const formData = new FormData();
          formData.append('file', fileObj);
          const { ingestData } = await import('../../../api/agentmesh');
          const res = await ingestData(formData);
          if (res.status === 'success') {
            filePath = res.file_path;
          }
        }
        onSubmit({
          ocr_image_base64: fileData,
          ocr_filename: fileName,
          latest_file_path: filePath,
          latest_file_name: fileName
        });
      } catch (err) {
        console.error("OCR File upload error:", err);
        onSubmit({ ocr_image_base64: fileData, ocr_filename: fileName });
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col gap-4 items-center py-10 px-5">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center animate-bounce">
          <FiCheck className="text-3xl text-[#6366F1]" />
        </div>
        <h3 className="text-gray-900 m-0 text-lg font-semibold">Document Submitted!</h3>
        <p className="text-gray-600 text-center max-w-[320px] m-0 text-sm leading-relaxed">
          OCR engine is scanning <span className="font-semibold text-gray-800">{fileName}</span>. Processing results...
        </p>
        <div className="mt-4 flex items-center gap-2 text-indigo-600 text-xs font-semibold">
          <div className="w-4 h-4 border-2 border-indigo-200 border-t-[#6366F1] rounded-full animate-spin" />
          Running OCR Extraction...
        </div>
      </div>
    );
  }

  // STEP 1: Upload / Camera Options Screen
  if (!mode) {
    const allowedTypes = config?.allowed_file_types || 'all';
    const acceptAttr = allowedTypes === 'pdf' ? '.pdf' : allowedTypes === 'images' ? '.png,.jpg,.jpeg,.webp' : '.pdf,.png,.jpg,.jpeg,.webp';
    const formatHint = allowedTypes === 'pdf' ? 'Supports PDF (.pdf)' : allowedTypes === 'images' ? 'Supports PNG, JPG, WEBP' : 'Supports PDF, PNG, JPG, WEBP';

    return (
      <div className="flex flex-col gap-5 py-2 px-1">
        <div className="text-center">
          <h4 className="text-base font-semibold text-gray-900 m-0">Upload Document for OCR</h4>
          <p className="text-xs text-gray-500 mt-1">Select a document file to process according to node configuration.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl cursor-pointer bg-slate-50/80 border-2 border-dashed border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FiUpload size={24} />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-800 block">Browse or Drop File</span>
              <span className="text-xs text-gray-400 mt-0.5 block">{formatHint}</span>
            </div>
            <button className="mt-1 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium shadow-sm group-hover:bg-indigo-700 transition-colors">
              Browse Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptAttr}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div
            onClick={() => { setMode('camera'); startCamera(); }}
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl cursor-pointer bg-slate-50/80 border-2 border-dashed border-gray-200 hover:border-pink-500 hover:bg-pink-50/40 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-pink-100/70 text-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FiCamera size={24} />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-800 block">Take Photo</span>
              <span className="text-xs text-gray-400 mt-0.5 block">Use webcam to capture document</span>
            </div>
            <button className="mt-1 px-4 py-1.5 bg-pink-600 text-white rounded-lg text-xs font-medium shadow-sm group-hover:bg-pink-700 transition-colors">
              Open Camera
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 1.5: Camera Live Mode
  if (mode === 'camera' && !imageCaptured) {
    return (
      <div className="flex flex-col gap-4 items-center">
        <div className="w-full h-[260px] bg-gray-900 rounded-2xl overflow-hidden relative flex justify-center items-center shadow-inner">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]">
            <track kind="captions" />
          </video>
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-4 border-2 border-white/40 rounded-xl pointer-events-none border-dashed" />
        </div>

        <div className="flex gap-3 w-full justify-end">
          <button
            onClick={resetSelection}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors border-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={captureImage}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-semibold shadow-md transition-colors border-none cursor-pointer"
          >
            <FiCamera size={16} /> Capture Photo
          </button>
        </div>
      </div>
    );
  }

  // STEP 2: File Selected -> Confirmation & Preview Screen
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h4 className="text-sm font-semibold text-gray-900 m-0">Confirm Document for OCR</h4>
        <button
          onClick={resetSelection}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
          title="Remove file"
        >
          <FiX size={18} />
        </button>
      </div>

      {/* Selected File Card */}
      <div className="flex items-center gap-3 p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
        <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <FiFileText size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate m-0">{fileName}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <span>{fileSize}</span>
            {fileType && <span className="uppercase font-medium px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded text-[10px]">{fileType}</span>}
          </div>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:bg-indigo-100/60 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
        >
          Change
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File / Image Preview Container */}
      <div className="w-full h-[220px] bg-slate-900/90 rounded-2xl overflow-hidden relative flex justify-center items-center p-2 border border-gray-200">
        {filePreview && (filePreview.startsWith('data:image/') || filePreview.startsWith('data:application/pdf') === false) ? (
          <img src={filePreview} alt="Document Preview" className="max-w-full max-h-full object-contain rounded-lg" />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-300 gap-2">
            <FiFileText size={48} className="text-indigo-400" />
            <span className="text-xs font-medium text-gray-300">{fileName}</span>
            <span className="text-[11px] text-gray-400">PDF Document Ready for Processing</span>
          </div>
        )}
      </div>

      {/* Action Buttons: Confirm & Proceed */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          onClick={resetSelection}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors border-none cursor-pointer disabled:opacity-50"
        >
          <FiRefreshCcw size={14} /> Retake / Clear
        </button>

        <button
          onClick={handleSubmit}
          disabled={isLoading || !fileData}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all border-none cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            'Processing...'
          ) : (
            <>
              <FiCheck size={16} /> Confirm & Proceed <FiArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

