import { X } from "lucide-react";
import CircularProgress from "@mui/material/CircularProgress";
import { Icon } from "@iconify/react";

/* ─────────────────────────────────────────────
   View Schema Modal
   Opens when user single-clicks a view in the sidebar.
──────────────────────────────────────────────── */
export function ViewSchemaModal({ viewSchema, onClose }) {
  if (!viewSchema) return null;

  const isLoading = viewSchema === "loading";
  const hasColumns =
    !isLoading && viewSchema.columns && viewSchema.columns.length > 0;

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl w-[480px] max-h-[70vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#29304a] flex-shrink-0">
          <div>
            <h2 className="font-bold text-[15px] text-white m-0">View Schema</h2>
            {!isLoading && (
              <p className="text-[11px] text-[#a8b0cc] mt-0.5 m-0">
                {viewSchema.viewName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#a8b0cc] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-36">
              <CircularProgress size={28} sx={{ color: "#8e78b7" }} />
            </div>
          ) : hasColumns ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#29304a] text-white sticky top-0">
                  <th className="text-left px-3.5 py-2.5 text-[11px] font-semibold w-10">
                    #
                  </th>
                  <th className="text-left px-3.5 py-2.5 text-[11px] font-semibold">
                    Column Name
                  </th>
                  <th className="text-left px-3.5 py-2.5 text-[11px] font-semibold">
                    Data Type
                  </th>
                </tr>
              </thead>
              <tbody>
                {viewSchema.columns.map((col, i) => (
                  <tr
                    key={i}
                    className={`border-b border-[#f0edf8] ${
                      i % 2 === 0 ? "bg-[#faf9ff]" : "bg-white"
                    }`}
                  >
                    <td className="px-3.5 py-2 text-[11px] text-gray-400">{i + 1}</td>
                    <td className="px-3.5 py-2 text-[12px] text-gray-800 font-medium">
                      {col.column_name}
                    </td>
                    <td className="px-3.5 py-2 text-[11px] text-gray-500 font-mono">
                      {col.DATA_TYPE || col.data_type || col.datatype || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-28 text-gray-400 text-[13px]">
              No column information available
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#f0edf8] flex-shrink-0">
          {!isLoading && (
            <span className="text-[11px] text-gray-400">
              Double-click the view to run{" "}
              <code className="bg-[#f0edf8] px-1 py-0.5 rounded text-[10px] text-[#79669c]">
                SELECT * FROM {viewSchema.viewName}
              </code>
            </span>
          )}
          <button
            onClick={onClose}
            className="ml-auto bg-[#8e78b7] hover:bg-[#79669c] text-white text-[13px] font-medium px-5 py-1.5 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Query Details Modal
──────────────────────────────────────────────── */
export function QueryDetailsModal({ isOpen, onClose, viewsDetails, queryLoading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl min-w-[32vw] min-h-[50vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#282F49] flex-shrink-0">
          <h2 className="m-0 text-[16px] font-semibold text-white">Query Details</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#a8b0cc] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-5 overflow-auto">
          {viewsDetails && viewsDetails.length > 0 && (
            <div>
              {Object.entries(viewsDetails[0])
                .filter(([key]) => key !== "query")
                .map(([key, value]) => (
                  <div key={key} className="mb-2.5 text-[14px]">
                    <strong className="text-[#8e78b7]">
                      {key.replace(/_/g, " ").toUpperCase()}:
                    </strong>{" "}
                    <span className="text-gray-600">{value || "N/A"}</span>
                  </div>
                ))}
            </div>
          )}
          {queryLoading && (
            <div className="flex justify-center mt-5">
              <CircularProgress sx={{ color: "#8e78b7" }} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="bg-[#8e78b7] hover:bg-[#79669c] text-white text-[13px] font-medium px-5 py-1.5 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   API Details Modal  (shown after CREATE VIEW)
──────────────────────────────────────────────── */
export function ApiDetailsModal({ isOpen, onClose, apiDetails }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl min-w-[32vw] min-h-[30vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#282F49] flex-shrink-0">
          <h2 className="m-0 text-[16px] font-semibold text-white">API Details</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#a8b0cc] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-5 overflow-auto">
          <div className="flex items-center mb-4">
            <span className="bg-[#8e78b7] text-white rounded px-2.5 py-0.5 text-[12px] font-semibold mr-3">
              POST
            </span>
            <span className="text-[14px] text-gray-700">
              /api/v1/view/{apiDetails.viewName}
            </span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-[12px] whitespace-pre-wrap m-0 text-gray-700">
              {apiDetails.curl}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="bg-[#8e78b7] hover:bg-[#79669c] text-white text-[13px] font-medium px-5 py-1.5 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Toast notification
──────────────────────────────────────────────── */
export function EditorToast({ toast, onClose }) {
  if (!toast.show) return null;

  return (
    <div
      className={`fixed top-6 right-6 z-[9999] flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl min-w-[240px] border-l-4 text-[13px] ${
        toast.type === "success"
          ? "bg-green-50 text-green-700 border-green-400"
          : "bg-red-50 text-red-700 border-red-400"
      }`}
    >
      <Icon
        icon={toast.type === "success" ? "mdi:check-circle" : "mdi:alert-circle"}
        width={18}
      />
      <p className="m-0 flex-1">{toast.message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
    </div>
  );
}