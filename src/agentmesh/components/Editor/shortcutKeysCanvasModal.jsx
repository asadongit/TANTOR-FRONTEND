/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { FiX, FiMousePointer, FiSearch, FiFileText, FiTrash2, FiRotateCcw, FiRotateCw } from 'react-icons/fi';

export default function ShortcutKeysCanvasModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    {
      id: 'ctrl-drag',
      keys: ['Ctrl', 'Drag'],
      description: 'Select multiple nodes on the canvas (draw a selection box).',
      icon: <FiMousePointer size={16} />,
    },
    {
      id: 'search',
      keys: ['S'],
      description: 'Open the Node Search tool to quickly find and add nodes (when no node is selected).',
      icon: <FiSearch size={16} />,
    },
    {
      id: 'cardboard',
      keys: ['N'],
      description: 'Insert a new Cardboard (sticky note) at the center of the canvas viewport.',
      icon: <FiFileText size={16} />,
    },
    {
      id: 'delete',
      keys: ['Delete', 'Backspace'],
      description: 'Delete the currently selected node(s) or edge(s).',
      icon: <FiTrash2 size={16} />,
    },
    {
      id: 'undo',
      keys: ['Ctrl', 'Z'],
      description: 'Undo the last action on the canvas (supports up to 50 steps).',
      icon: <FiRotateCcw size={16} />,
    },
    {
      id: 'redo',
      keys: ['Ctrl', 'Y'],
      description: 'Redo the last undone action.',
      icon: <FiRotateCw size={16} />,
    },
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClose();
    }
  };

  return (
    <div 
      className="shortcuts-overlay" 
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Close shortcuts modal"
    >
      <div 
        className="shortcuts-modal" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-dialog-title"
      >
        {/* Header */}
        <div className="shortcuts-header">
          <div className="shortcuts-title-group">
            <h2 id="shortcuts-dialog-title" className="shortcuts-title">Canvas Shortcuts</h2>
            <p className="shortcuts-subtitle">Keyboard controls and canvas gestures to speed up your workflow</p>
          </div>
          <button className="shortcuts-close-btn" onClick={onClose} title="Close shortcuts">
            <FiX size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="shortcuts-content custom-scrollbar">
          <div className="shortcuts-grid">
            {shortcuts.map((s) => (
              <div key={s.id} className="shortcut-card">
                <div className="shortcut-left">
                  <div className="shortcut-icon-wrapper">{s.icon}</div>
                  <div className="shortcut-info">
                    <p className="shortcut-desc">{s.description}</p>
                  </div>
                </div>
                <div className="shortcut-keys">
                  {s.keys.map((k, kIdx) => (
                    <React.Fragment key={k}>
                      {kIdx > 0 && <span className="shortcut-plus">+</span>}
                      <kbd className="shortcut-key">{k}</kbd>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="shortcuts-footer">
          <span>Pro-Tip: Click anywhere outside or press Esc to close this window.</span>
        </div>
      </div>

      <style>{`
        .shortcuts-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          animation: shortcutsFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .shortcuts-modal {
          width: 90%;
          max-width: 680px;
          background: #ffffff;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #1e293b;
          overflow: hidden;
          animation: shortcutsScaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .shortcuts-header {
          padding: 24px 28px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .shortcuts-title-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .shortcuts-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .shortcuts-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .shortcuts-close-btn {
          background: transparent;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .shortcuts-close-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .shortcuts-content {
          padding: 28px;
          max-height: 60vh;
          overflow-y: auto;
        }

        .shortcuts-grid {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .shortcut-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          transition: all 0.2s ease;
          gap: 20px;
        }

        .shortcut-card:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .shortcut-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .shortcut-icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #6366f1;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
        }

        .shortcut-info {
          display: flex;
          flex-direction: column;
        }

        .shortcut-desc {
          font-size: 13.5px;
          font-weight: 500;
          color: #334155;
          margin: 0;
          line-height: 1.5;
        }

        .shortcut-keys {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .shortcut-plus {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
        }

        .shortcut-key {
          display: inline-block;
          padding: 4px 10px;
          font-size: 12px;
          font-family: inherit;
          font-weight: 700;
          line-height: 1;
          color: #475569;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-bottom-width: 3px;
          border-radius: 6px;
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.05);
        }

        .shortcuts-footer {
          padding: 16px 28px;
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
          font-size: 12px;
          color: #94a3b8;
          text-align: center;
        }

        @keyframes shortcutsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes shortcutsScaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
