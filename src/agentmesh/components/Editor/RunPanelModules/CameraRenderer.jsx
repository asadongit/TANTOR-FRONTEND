import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiCamera, FiCheck, FiRefreshCcw } from 'react-icons/fi';

export default function CameraRenderer({ config, context, isLoading, onSubmit }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [imageCaptured, setImageCaptured] = useState(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
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
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImageCaptured(dataUrl);
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
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

      onSubmit({ 
        vcip_image_base64: imageCaptured,
        user_ip: userIp,
        device_fingerprint: userAgent
      });
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
          Your identity is now being verified against government databases. Please wait while the AML pipeline executes...
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
  isLoading: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
