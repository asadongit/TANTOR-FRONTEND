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
    type: 'success',
    loadingText: ""
  });

  const openModal = ({ 
    title, 
    message, 
    onConfirm, 
    onClose, 
    type, 
    confirmText = "Confirm", 
    loadingText 
  }) => {
    setModalState({
      isOpen: true,
      title,
      message,
      onConfirm,
      onClose: onClose || (() => closeModal()),
      confirmText,
      type,
      loadingText
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