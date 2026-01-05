import { X } from "lucide-react";

function GovernanceReportModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Governance Report</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
           <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* AI Use Case Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b-2 border-blue-500">
              AI use case
            </h4>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
              <p className="text-sm text-gray-700">
                This Model is not yet associated with any AI use case
              </p>
            </div>
          </div>

          {/* Model Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b-2 border-blue-500">
              Model
            </h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Name</p>
                  <p className="text-sm font-medium text-gray-900">Fraud Analytics v3 - P2 LGBM Classifier - Model</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">ID</p>
                  <p className="text-sm font-medium text-gray-900">9795cbae-2c96-489a-4dc8-fef404d056fc</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Last modified</p>
                  <p className="text-sm font-medium text-gray-900">Jul 04 2024, 04:33 AM GMT</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Created</p>
                  <p className="text-sm font-medium text-gray-900">Jul 04 2024, 04:33 AM GMT</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Created by</p>
                  <p className="text-sm font-medium text-gray-900">Abhishek Singh (abhishek.singh4@domain.io)</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Label/prediction column</p>
                  <p className="text-sm font-medium text-gray-900">fraud</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Model type</p>
                  <p className="text-sm font-medium text-gray-900">multi-hybrid_0.1</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Algorithm</p>
                  <p className="text-sm font-medium text-gray-900">LGBMClassifier</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Prediction Type</p>
                <p className="text-sm font-medium text-gray-900">classification</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              console.log('Downloading governance report...');
              onClose();
            }}
            className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default GovernanceReportModal;