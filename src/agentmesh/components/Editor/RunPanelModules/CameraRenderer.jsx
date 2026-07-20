import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiCamera, FiCheck, FiRefreshCcw } from 'react-icons/fi';
import { uploadTempFile } from '../../../api/agentmesh';

export default function CameraRenderer({ config, context, threadId, isLoading, onSubmit }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [imageCaptured, setImageCaptured] = useState(null);
  const streamRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      const MAX_WIDTH = 1920;
      const MAX_HEIGHT = 1080;
      let width = video.videoWidth;
      let height = video.videoHeight;

      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        if (width > height) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        } else {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      setImageCaptured(dataUrl);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const retakeImage = () => {
    setImageCaptured(null);
    startCamera();
  };

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (imageCaptured && onSubmit) {
      setIsSubmitted(true);
      
      // 1. Capture Device Fingerprint (User Agent)
      const userAgent = navigator.userAgent;
      
      // 2. Capture Public IP Address
      let userIp = "Unknown";
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        userIp = ipData.ip;
      } catch (err) {
        console.error("Failed to fetch IP address:", err);
      }

      try {
        const responseBlob = await fetch(imageCaptured);
        const blob = await responseBlob.blob();
        
        const formData = new FormData();
        const safeThreadId = threadId || context?.thread_id || 'default_thread';
        formData.append('file', blob, `camera_capture_${Date.now()}.jpg`);
        formData.append('thread_id', safeThreadId);
        
        const uploadRes = await uploadTempFile(formData);
        
        if (uploadRes?.vfs_path) {
          onSubmit({
            vcip_capture_path: uploadRes.vfs_path,
            user_ip: userIp,
            device_fingerprint: userAgent
          });
        } else {
          throw new Error("Invalid response from upload-temp");
        }
      } catch (uploadErr) {
        console.error("Upload failed, falling back to base64 submit:", uploadErr);
        onSubmit({ 
          vcip_image_base64: imageCaptured,
          user_ip: userIp,
          device_fingerprint: userAgent
        });
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col gap-4 items-center py-10 px-5">
        <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center">
          <FiCheck className="text-3xl text-[#BE185D]" />
        </div>
        <h3 className="text-gray-900 m-0 text-lg font-semibold">Photo Submitted!</h3>
        <p className="text-gray-600 text-center max-w-[300px] m-0 text-sm leading-relaxed">
          Please wait while we process your image.
        </p>
        <div className="mt-6">
          <div className="w-10 h-10 border-4 border-gray-100 border-t-[#BE185D] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 items-center">
      <div className="text-center mb-2.5">
        <p className="text-gray-600 text-sm">
          Please align your face in the frame and capture a live image for verification.
        </p>
      </div>

      <div className="w-full max-w-[400px] h-[300px] bg-black rounded-2xl overflow-hidden relative flex justify-center items-center">
        {imageCaptured ? (
          <img src={imageCaptured} alt="Captured" className="w-full h-full object-cover scale-x-[-1]" />
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover scale-x-[-1]" 
          >
            <track kind="captions" />
          </video>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex gap-3">
        {imageCaptured ? (
          <>
            <button
              onClick={retakeImage}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold cursor-pointer disabled:cursor-not-allowed border-none"
            >
              <FiRefreshCcw /> Retake
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#BE185D] text-white rounded-lg font-semibold cursor-pointer disabled:cursor-not-allowed border-none"
            >
              {isLoading ? 'Submitting...' : <><FiCheck /> Submit Photo</>}
            </button>
          </>
        ) : (
          <button
            onClick={captureImage}
            className="flex items-center gap-2 px-6 py-3 bg-[#BE185D] text-white rounded-lg font-semibold cursor-pointer text-base border-none"
          >
            <FiCamera className="text-lg" /> Capture Photo
          </button>
        )}
      </div>
    </div>
  );
}

CameraRenderer.propTypes = {
  config: PropTypes.object.isRequired,
  context: PropTypes.object.isRequired,
  threadId: PropTypes.string,
  isLoading: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
