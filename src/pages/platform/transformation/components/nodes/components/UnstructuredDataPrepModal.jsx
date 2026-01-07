import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAuth } from "../../../../../../context/AuthContext";

const UnStructureDataPrep = ({ open, onClose, txtFile }) => {
  const [fileContent, setFileContent] = useState("");
  const { token, decodedToken, project, hostnameV1 } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [preparedData, setPreparedData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (txtFile) {
      const reader = new FileReader();
      reader.onload = (e) => setFileContent(e.target.result);
      reader.readAsText(txtFile);
    } else {
      setFileContent("");
      setPreparedData(null);
      setError(null);
    }
  }, [txtFile]);

  const handlePrepareData = async () => {
    if (!txtFile) return;
    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", txtFile);

    try {
      const response = await fetch(
        `${hostnameV1}/etl/agentic_unstructure_to_structure`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      if (!response.ok) throw new Error("Failed to prepare data");
      const data = await response.json();
      setPreparedData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return open ? (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Data Preparation
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">
              Preview your file and run preparation.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>


        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900">
                {preparedData ? "Prepared Data Preview" : "File Preview"}
              </div>
              <div className="text-xs text-gray-500">
                {txtFile?.name ? txtFile.name : "No file selected"}
              </div>
            </div>

            {preparedData ? (
              <div>

                <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto mb-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {preparedData.columns.map((col, idx) => (
                          <th
                            key={idx}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {preparedData.structured_data.slice(0, 10).map((row, idx) => (
                        <tr key={idx}>
                          {preparedData.columns.map((col, colIdx) => (
                            <td
                              key={colIdx}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            >
                              {row[col]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50">
                <textarea
                  className="h-[360px] w-full resize-none rounded-lg bg-transparent p-3 text-sm text-gray-800 outline-none placeholder:text-gray-400"
                  value={fileContent}
                  readOnly
                  placeholder="No content to preview."
                />
              </div>
            )}
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          {!preparedData && (
            <aside className="flex flex-col justify-between rounded-l-lg border-l border-gray-200 bg-white p-4 w-[280px]">
              <div>
                <div className="text-sm font-medium text-gray-900">Actions</div>
                <p className="mt-1 text-sm text-gray-500">
                  Run Auto preparation on the file.
                </p>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={handlePrepareData}
                  disabled={!txtFile || isLoading}
                  className="w-full rounded-md bg-[#8E77BB] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#7A66A3] focus:outline-none focus:ring-2 focus:ring-[#8E77BB] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? "Preparing..." : "Prepare Data"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
            </aside>
          )}
        </div>

        {preparedData && (
          <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                window.onUseData?.(preparedData);
                onClose();
              }}
              className="rounded-md bg-[#8E77BB] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#7A66A3] focus:outline-none focus:ring-2 focus:ring-[#8E77BB]"
            >
              Use Data
            </button>
          </div>
        )}
      </div>
    </div>
  ) : null;
};

export default UnStructureDataPrep;
