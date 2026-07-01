import React, { useRef, useState, useEffect } from 'react';
import { FiPaperclip, FiCamera, FiCheck, FiRefreshCcw, FiUpload } from 'react-icons/fi';

const ACCENT = '#6366F1';
const BORDER = 'rgba(0,0,0,0.08)';
const TEXT = '#111827';

export default function OcrRenderer({ config, context, isLoading, onSubmit }) {
  const [mode, setMode] = useState(null); // null | 'upload' | 'camera'
  const [filePreview, setFilePreview] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Camera refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [imageCaptured, setImageCaptured] = useState(null);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error("Camera access error:", err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setFilePreview(ev.target.result);
      setFileData(ev.target.result);
      setMode('upload');
    };
    reader.readAsDataURL(file);
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
      setFileData(dataUrl);
      setFileName('Camera Capture');
      if (stream) stream.getTracks().forEach(t => t.stop());
      setMode('upload');
    }
  };

  const retake = () => {
    setImageCaptured(null);
    setFilePreview(null);
    setFileData(null);
    setFileName('');
    if (mode === 'camera') startCamera();
    else setMode(null);
  };

  const handleSubmit = async () => {
    if (fileData && onSubmit) {
      setIsSubmitted(true);
      onSubmit({ ocr_image_base64: fileData, ocr_filename: fileName });
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col gap-4 items-center py-10 px-5">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
          <FiCheck className="text-3xl text-[#6366F1]" />
        </div>
        <h3 className="text-gray-900 m-0 text-lg font-semibold">Document Submitted!</h3>
        <p className="text-gray-600 text-center max-w-[300px] m-0 text-sm leading-relaxed">
          Processing document for OCR extraction. Results will appear shortly.
        </p>
        <div className="mt-6">
          <div className="w-10 h-10 border-4 border-gray-100 border-t-[#6366F1] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="flex flex-col gap-5 items-center py-4">
        <p className="text-gray-600 text-sm text-center">
          Upload a document image or capture one using your camera for OCR processing.
        </p>
        <div className="flex gap-4">
          <label
            className="flex flex-col items-center gap-3 px-8 py-8 rounded-2xl cursor-pointer bg-gray-50 border-2 border-dashed border-gray-200 hover:border-[#6366F1] hover:bg-indigo-50/30 transition-all"
            style={{ borderColor: BORDER }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = 'rgba(99,102,241,0.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = ''; }}
          >
            <FiUpload size={32} color={ACCENT} />
            <span className="text-sm font-semibold" style={{ color: TEXT }}>Upload Document</span>
            <span className="text-xs text-gray-400">PDF, PNG, JPG</span>
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileSelect} style={{ display: 'none' }} />
          </label>
          <button
            onClick={() => { setMode('camera'); startCamera(); }}
            className="flex flex-col items-center gap-3 px-8 py-8 rounded-2xl cursor-pointer bg-gray-50 border-2 border-dashed border-gray-200 hover:border-[#BE185D] hover:bg-pink-50/30 transition-all"
            style={{ borderColor: BORDER }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#BE185D'; e.currentTarget.style.background = 'rgba(190,24,93,0.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = ''; }}
          >
            <FiCamera size={32} color="#BE185D" />
            <span className="text-sm font-semibold" style={{ color: TEXT }}>Capture Camera</span>
            <span className="text-xs text-gray-400">Live photo capture</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 items-center">
      {(mode === 'camera' && !imageCaptured) ? (
        <div className="w-full max-w-[400px] h-[280px] bg-black rounded-2xl overflow-hidden relative flex justify-center items-center">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]">
            <track kind="captions" />
          </video>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      ) : (
        <div className="w-full max-w-[400px] h-[280px] bg-gray-100 rounded-2xl overflow-hidden relative flex justify-center items-center">
          {filePreview ? (
            <img src={filePreview} alt="Document" className="w-full h-full object-contain" />
          ) : (
            <div className="text-gray-400 text-sm">No document selected</div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {mode === 'camera' && !imageCaptured ? (
          <button
            onClick={captureImage}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-[#BE185D] text-white rounded-lg font-semibold cursor-pointer disabled:cursor-not-allowed text-base border-none"
          >
            <FiCamera className="text-lg" /> Capture
          </button>
        ) : (
          <>
            <button
              onClick={retake}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold cursor-pointer disabled:cursor-not-allowed border-none"
            >
              <FiRefreshCcw /> {mode === 'camera' ? 'Retake' : 'Choose Different'}
            </button>
            {fileData && (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#6366F1] text-white rounded-lg font-semibold cursor-pointer disabled:cursor-not-allowed border-none"
              >
                {isLoading ? 'Processing...' : <><FiCheck /> Submit for OCR</>}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
