import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiX, FiAlertTriangle, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { formatMessage } from "./messageFormatting";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
}) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "Enter" && !isLoading) {
        handleConfirm();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Confirmation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <FiAlertTriangle size={24} color="#EF4444" />,
          iconBg: "rgba(239, 68, 68, 0.1)",
          confirmBtn: "#EF4444",
          glow: "rgba(239, 68, 68, 0.2)",
        };
      case "warning":
        return {
          icon: <FiAlertCircle size={24} color="#F59E0B" />,
          iconBg: "rgba(245, 158, 11, 0.1)",
          confirmBtn: "#F59E0B",
          glow: "rgba(245, 158, 11, 0.2)",
        };
      case "success":
        return {
          icon: <FiCheckCircle size={24} color="#10B981" />,
          iconBg: "rgba(16, 185, 129, 0.1)",
          confirmBtn: "#10B981",
          glow: "rgba(16, 185, 129, 0.2)",
        };
      default:
        return {
          icon: <FiAlertCircle size={24} color="var(--theme-primary)" />,
          iconBg: "var(--theme-primary-glow)",
          confirmBtn: "var(--theme-primary)",
          glow: "var(--theme-primary-glow-heavy)",
        };
    }
  };

  const styles = getVariantStyles();

  return createPortal(
    <div style={inlineStyles.overlay} onClick={onClose}>
      <div
        style={inlineStyles.modal}
        onClick={(e) => e.stopPropagation()}
        className="neo-confirm-modal"
      >
        <div style={inlineStyles.header}>
          <div style={{ ...inlineStyles.iconWrapper, backgroundColor: styles.iconBg }}>
            {styles.icon}
          </div>
          <h3 style={inlineStyles.title}>{title}</h3>
          <button onClick={onClose} style={inlineStyles.closeBtn}>
            <FiX size={18} />
          </button>
        </div>

        <div style={inlineStyles.body}>
          <div style={inlineStyles.message}>
            {formatMessage(message)}
          </div>
        </div>

        <div style={inlineStyles.footer}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={inlineStyles.cancelBtn}
            className="neo-confirm-cancel"
          >
            {cancelText}
          </button>

          <button
            onClick={handleConfirm}
            disabled={isLoading}
            style={{
              ...inlineStyles.confirmBtn,
              backgroundColor: styles.confirmBtn,
              color: "#fff",
              boxShadow: `0 0 15px ${styles.glow}`
            }}
            className="neo-confirm-submit"
          >
            {isLoading ? (
              <div style={inlineStyles.loader} />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>

      <style>{`
        .neo-confirm-modal {
          animation: neo-modal-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes neo-modal-pop {
          0% { opacity: 0; transform: scale(0.9) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .neo-confirm-cancel:hover {
          background: #F3F4F6 !important;
          color: #111827 !important;
          border-color: #D1D5DB !important;
        }
        .neo-confirm-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.2);
        }
      `}</style>
    </div>,
    document.body
  );
}

const inlineStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'var(--modal-overlay-bg, rgba(0,0,0,0.35))',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '24px',
  },
  modal: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: '#ffffff',
    border: '1px solid #E8E8E5',
    borderRadius: '24px',
    boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  header: {
    padding: '28px 28px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    position: 'relative',
  },
  iconWrapper: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#1C1C1E',
    letterSpacing: '-0.3px',
    flex: 1,
  },
  closeBtn: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    color: 'rgba(156, 163, 175, 0.5)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  body: {
    padding: '0 28px 28px',
  },
  message: {
    margin: 0,
    fontSize: '14.5px',
    lineHeight: 1.6,
    color: '#5F5F6B',
    fontWeight: 400,
  },
  footer: {
    padding: '24px 28px 28px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    background: '#F9F9F8',
    borderTop: '1px solid #F2F2EF',
  },
  cancelBtn: {
    padding: '10px 20px',
    borderRadius: '12px',
    border: '1px solid #E8E8E5',
    background: '#ffffff',
    color: '#5F5F6B',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  confirmBtn: {
    padding: '10px 22px',
    borderRadius: '12px',
    border: 'none',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '110px',
  },
  loader: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'neo-spin 0.8s linear infinite',
  }
};

