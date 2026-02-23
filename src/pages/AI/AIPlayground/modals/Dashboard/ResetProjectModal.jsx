import { useState } from 'react';
import { X } from 'lucide-react';
import { tw, aithemestyle } from '../../../../../components/themeContext';

export const ResetProjectModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div
        className="bg-white rounded-xl w-full max-w-sm mx-4 overflow-hidden"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h2 className={tw.cardTitle} style={{ fontSize: '15px', fontWeight: 600 }}>
            Reset project?
          </h2>
          <button
            onClick={onCancel}
            className={`${tw.icon} hover:text-[#332849] transition-colors rounded-full p-0.5`}
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Body */}
        <div className="px-5 py-5">
          <p className={tw.label} style={{ lineHeight: '1.55' }}>
            This will remove the uploaded dataset and reset all configurations and
            workflows. This action cannot be undone.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-4">
          <button
            onClick={onCancel}
            className={`${tw.label} px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors`}
            style={{ fontSize: '13px' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`${tw.resetIcon} px-4 py-2 text-white font-medium rounded-lg transition-colors`}
            style={{ fontSize: '13px' }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.88)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
          >
            Reset Project
          </button>
        </div>
      </div>
    </div>
  );
};