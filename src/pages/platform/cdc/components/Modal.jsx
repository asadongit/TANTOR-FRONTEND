import successBackground from "../../../../assets/green.png"
import failureBackground from "../../../../assets/green.png"
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader } from 'lucide-react';

const Modal = ({ 
  isOpen, 
  onClose, 
  type = "question",
  title, 
  message,
  onConfirm = () => {},
  loadingText,
  confirmText = "Yes",
  cancelText = "No",
  customContent = null, 
}) => {
  const [animationClass, setAnimationClass] = useState("scale-0");
  const [currentType, setCurrentType] = useState(type);
  const [isChanging, setIsChanging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const getTypeConfig = (modalType) => {
    const configs = {
      question: {
        icon: <iconify-icon icon="lucide:badge-help" style={{color: "#1d4ed8", fontSize: "2rem"}}></iconify-icon>,
        bgColor: "#e6f0fd",
        title: title || "Confirmation",
        buttonColor: "bg-[#8e78b7] hover:bg-gray-400"
      },
      success: {
        icon: <iconify-icon icon="garden:check-badge-fill-16" style={{color: "#16a34a", fontSize: "2rem"}}></iconify-icon>,
        bgColor: "#e6f7e6",
        title: title || "Success",
        buttonColor: "bg-[#8e78b7] hover:bg-gray-400"
      },
      failure: {
        icon: <AlertCircle style={{color: "#ef4444", fontSize: "2rem"}} />,
        bgColor: "#fde6e6",
        title: title || "Error",
        buttonColor: "bg-[#8e78b7] hover:bg-gray-400"
      }
    };
    
    return configs[modalType] || configs.question;
  };

  const config = getTypeConfig(currentType);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setAnimationClass("scale-100");
      }, 10);
    } else {
      setAnimationClass("scale-0");
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentType !== type && isOpen) {
      setIsChanging(true);
      setTimeout(() => {
        setCurrentType(type);
        setIsChanging(false);
      }, 500);
    } else {
      setCurrentType(type);
    }
  }, [type, isOpen]);

  if (!isOpen) return null;

  const handleConfirmClick = () => {
    setIsLoading(true);
    onConfirm();
  };

  return (
    <div className="fixed w-full inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-300">
      <div 
        className={`bg-white rounded-2xl min-w-[20vw] max-w-[900px] h-auto max-h-[80vh] overflow-hidden transform transition-all duration-300 ${animationClass} shadow-xl`}
      >
       

        {customContent ? (
          <div className="p-4">
            {customContent}
            
            <div className="flex justify-start gap-4 mt-4">
              {currentType === "question" ? (
                <>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors"
                    disabled={isLoading}
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={`px-6 py-3 text-white rounded-lg transition-colors flex items-center justify-center ${config.buttonColor}`}
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        {loadingText}
                      </>
                    ) : confirmText}
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className={`px-6 py-3 text-white rounded-lg transition-colors ${
                    currentType === "success" ? "bg-[#8e78b7] hover:bg-gray-400" : "bg-red-500 hover:bg-gray-400"
                  }`}
                >
                  {currentType === "success" ? "Alright" : "Close"}
                </button>
              )}
            </div>
          </div>
        ) : (


          <div className="p-4">
             <div className="relative h-20">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${currentType === 'success' ? successBackground : failureBackground})` }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-black p-1"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
            <div className="flex items-center mb-2">
              <div className={`w-12 h-12 flex items-center justify-center transform transition-all duration-500 ${isChanging ? "rotate-180 scale-0" : "rotate-0 scale-100"}`}>
                {isChanging ? (
                  <Loader className="w-8 h-8 text-gray-400 animate-spin" />
                ) : config.icon}
              </div>
              <h2 className="text-2xl text-gray-800 font-bold">{config.title}</h2>
            </div>
            
            <p className="text-lg text-gray-700">
              {message || "Your CDC has been saved successfully."}
            </p>

            <div className="flex justify-start gap-4 mt-4">
              {currentType === "question" ? (
                <>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors"
                    disabled={isLoading}
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={handleConfirmClick}
                    disabled={isLoading}
                    className={`px-6 py-3 text-white rounded-lg transition-colors flex items-center justify-center ${config.buttonColor}`}
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        {loadingText}
                      </>
                    ) : confirmText}
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className={`px-6 py-3 text-white rounded-lg transition-colors ${
                    currentType === "success" ? "bg-[#8e78b7] hover:bg-gray-400" : "bg-red-500 hover:bg-gray-400"
                  }`}
                >
                  {currentType === "success" ? "Alright" : "Close"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;