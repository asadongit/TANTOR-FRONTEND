import { createContext, useState, useContext } from "react";
import Modal from "../components/Modal";
const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onClose: () => {},
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: 'success',
    loadingText: "",
    customContent: null
  });

  const openModal = ({ 
    title, 
    message, 
    onConfirm, 
    onClose, 
    type, 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    loadingText,
    customContent
  }) => {
    setModalState({
      isOpen: true,
      title,
      message,
      onConfirm,
      onClose: onClose || (() => closeModal()),
      confirmText,
      cancelText,
      type,
      loadingText,
      customContent
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <ModalContext.Provider value={{ modalState, openModal, closeModal }}>
      {children}
      {modalState.isOpen && (
        <Modal 
          isOpen={modalState.isOpen} 
          onClose={() => {
            modalState.onClose();
          }} 
          type={modalState.type}
          title={modalState.title}
          message={modalState.message}
          onConfirm={modalState.onConfirm}
          loadingText={modalState.loadingText}
          confirmText={modalState.confirmText}
          cancelText={modalState.cancelText}
          customContent={modalState.customContent}
        />
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}