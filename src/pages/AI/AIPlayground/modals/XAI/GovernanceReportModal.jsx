import { X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from 'react-hot-toast';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function GovernanceReportModal({ isOpen, onClose, selectedModel, sessionId }) {
  const hostnameAI = window._env_?.VITE_AI_API;
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const reportRef = useRef(null);

  useEffect(() => {
    if (isOpen && selectedModel && sessionId) {
      fetchGovernanceReport();
    }
  }, [isOpen, selectedModel, sessionId]);

  const fetchGovernanceReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${hostnameAI}/model/download-governance-report`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_id: sessionId,
            model_names: [selectedModel]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        toast.error('Failed to fetch governance reports', {
          duration: 3000,
          position: 'top-right',
        });
      }
    } catch (error) {
      toast.error('Failed to fetch governance reports', {
        duration: 3000,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!reportRef.current) return;

    setDownloading(true);

    try {
      const input = reportRef.current;
      const canvas = await html2canvas(input, { 
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: input.scrollWidth,
        windowHeight: input.scrollHeight
      });
      
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`governance-report-${selectedModel}.pdf`);

      toast.success('Report downloaded successfully', {
        duration: 3000,
        position: 'top-right',
      });
      onClose();
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error('Failed to generate PDF', {
        duration: 3000,
        position: 'top-right',
      });
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  const modelData = reportData?.models?.[selectedModel];
  const projectData = reportData?.project;
  const datasetData = reportData?.dataset;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">Model Governance Report</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-6 flex items-center justify-center min-h-[400px]">
            <p className="text-gray-500">Loading report data...</p>
          </div>
        ) : !reportData ? (
          <div className="p-6 flex items-center justify-center min-h-[400px]">
            <p className="text-gray-500">No report data available</p>
          </div>
        ) : (
          <div ref={reportRef} className="p-6 space-y-6">
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
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Name</p>
                    <p className="text-sm font-medium text-gray-900 break-words">{selectedModel || 'N/A'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1">ID</p>
                    <p className="text-sm font-medium text-gray-900 break-all">{modelData?.run_id || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Last modified</p>
                    <p className="text-sm font-medium text-gray-900">{modelData?.created_at || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Created</p>
                    <p className="text-sm font-medium text-gray-900">{modelData?.created_at || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Created by</p>
                    <p className="text-sm font-medium text-gray-900">{modelData?.created_by || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Label/prediction column</p>
                    <p className="text-sm font-medium text-gray-900">{modelData?.target_column || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Model type</p>
                    <p className="text-sm font-medium text-gray-900">{modelData?.model_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Algorithm</p>
                    <p className="text-sm font-medium text-gray-900">{modelData?.algorithm || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Prediction Type</p>
                  <p className="text-sm font-medium text-gray-900">{modelData?.prediction_type || 'N/A'}</p>
                </div>
              </div>

              {/* General Training Information */}
              <div className="mt-6 pt-4 border-t border-gray-300">
                <h5 className="text-sm font-semibold text-gray-900 mb-3 bg-gray-100 px-3 py-2 rounded">General Training Information</h5>
                <div className="space-y-3 px-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Features</p>
                    <p className="text-sm font-medium text-gray-900">{modelData?.data_summary?.num_rows || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Input Schema */}
              {datasetData?.source_schema && (
                <div className="mt-6 pt-4 border-t border-gray-300">
                  <h5 className="text-sm font-semibold text-gray-900 mb-3 bg-gray-100 px-3 py-2 rounded">Input Schema</h5>
                  <div className="overflow-x-auto px-3">
                    <table className="min-w-full border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 border-b">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 border-b">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datasetData.source_schema.map((field, index) => (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-2 text-sm text-gray-900">{field.column_name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{field.data_type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Evaluation Section */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b-2 border-blue-500">
                Evaluation
              </h4>

              {/* Development - Project Info */}
              <div className="mb-4 pt-4 border-t border-gray-300">
                <h5 className="text-sm font-semibold text-gray-900 mb-3 bg-gray-100 px-3 py-2 rounded">Development</h5>
                <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-3 mx-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Project name: <span className="font-normal">{projectData?.project_name || 'N/A'}</span></p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Project ID</p>
                      <p className="text-sm text-gray-900">{projectData?.project_id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Created by</p>
                      <p className="text-sm text-gray-900">{projectData?.owner_name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Date</p>
                      <p className="text-sm text-gray-900">{projectData?.created_at || 'N/A'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Asset name</p>
                      <p className="text-sm text-gray-900 break-words">{selectedModel || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Training Metrics */}
              {modelData?.training_metrics && (
                <div className="mt-6 pt-4 border-t border-gray-300">
                  <h5 className="text-sm font-semibold text-gray-900 mb-3 bg-gray-100 px-3 py-2 rounded">Training Metrics</h5>
                  <div className="overflow-x-auto px-3">
                    <table className="min-w-full border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 border-b">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 border-b">Training</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 border-b">Testing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(modelData.training_metrics.train || {}).map((metric, index) => (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-2 text-sm text-gray-900 capitalize">{metric}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {typeof modelData.training_metrics.train[metric] === 'number'
                                ? modelData.training_metrics.train[metric].toFixed(6)
                                : modelData.training_metrics.train[metric]}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {typeof modelData.training_metrics.test?.[metric] === 'number'
                                ? modelData.training_metrics.test[metric].toFixed(6)
                                : modelData.training_metrics.test?.[metric] || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownloadReport}
            disabled={downloading || !reportData}
            className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#7d67a6]"
          >
            {downloading ? 'Downloading...' : 'Download Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GovernanceReportModal;