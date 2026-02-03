import React from "react";
import { X } from "lucide-react";

const ArchiveModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Archive",
  description = "Are you sure you want to archive this item? This action can be undone.",
  confirmText = "Archive",
  loading = false,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[#8e78b7]">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-6 text-gray-700">{description}</div>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-[#8e78b7] text-white hover:bg-[#7a679f]"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Archiving..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveModal;