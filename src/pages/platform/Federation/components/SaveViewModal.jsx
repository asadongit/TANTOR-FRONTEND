import React, { useEffect, useState } from "react";
import { useStateContext } from "../context/contextViewProvider";
import { Lock } from "lucide-react";

const SaveViewModal = ({ toggleModal, handleSaveView }) => {
  const { finalPayload, handleFinalPayload, isEditMode, editViewName } = useStateContext("");

  const [newViewName, setNewViewName] = useState(
    isEditMode ? editViewName : (finalPayload?.view_name || "")
  );

  const [isMaterializedView, setIsMaterializedView] = useState(() => {
    const val = finalPayload?.isMateralizedView;
    if (val === true || val === "true") return true;
    return false;
  });

  const [isCaching, setIsCaching] = useState(() => {
    const val = finalPayload?.isCaching;
    if (val === true || val === "true") return true;
    return false;
  });

  const [refreshPeriod, setRefreshPeriod] = useState(
    finalPayload?.grace_period !== undefined ? String(finalPayload.grace_period) : ""
  );

  const [cacheTtl, setCacheTtl] = useState(
    finalPayload?.cache_ttl !== undefined ? String(finalPayload.cache_ttl) : ""
  );

  useEffect(() => {
    if (finalPayload) {
      const updatedPayload = {
        ...finalPayload,
        isMateralizedView: isMaterializedView,
        isCaching: isCaching,
      };

      if (isMaterializedView && refreshPeriod !== "" && refreshPeriod !== null) {
        updatedPayload.grace_period = Number(refreshPeriod);
      } else {
        delete updatedPayload.grace_period;
      }

      if (isCaching && cacheTtl !== "" && cacheTtl !== null) {
        updatedPayload.cache_ttl = Number(cacheTtl);
      } else {
        delete updatedPayload.cache_ttl;
      }

      handleFinalPayload(updatedPayload);
    }
  }, [isMaterializedView, isCaching, refreshPeriod, cacheTtl]);

  const handleViewTypeChange = (event) => {
    setIsMaterializedView(event.target.checked);
    if (!event.target.checked) {
      setRefreshPeriod("");
    }
  };

  const handleCachingChange = (event) => {
    setIsCaching(event.target.checked);
    if (!event.target.checked) {
      setCacheTtl("");
    }
  };

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-[#8E77BB] text-2xl font-bold">Save View</h2>
          <button
            onClick={toggleModal}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          {/* MV / Caching toggles — only for Integrated Views */}
          {finalPayload?.view_type === "Integrated View" && (
            <div className="flex flex-wrap text-black items-center gap-3 pb-2 border-b border-gray-100">
              {!isCaching && (
                <label className="inline-flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isMaterializedView}
                    onChange={handleViewTypeChange}
                    aria-label="Materialized view"
                    className="form-checkbox accent-[#8E77BB] w-4 h-4"
                  />
                  <span className="text-sm font-medium">Materialized View</span>
                </label>
              )}

              {isMaterializedView && (
                <div className="w-full mt-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Grace Period (hr)
                  </label>
                  <input
                    id="refresh-period"
                    type="number"
                    min="1"
                    value={refreshPeriod}
                    onChange={(e) => setRefreshPeriod(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-[#8E77BB] focus:outline-none"
                    placeholder="e.g. 60"
                  />
                </div>
              )}

              {!isMaterializedView && (
                <label className="inline-flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isCaching}
                    onChange={handleCachingChange}
                    aria-label="Caching"
                    className="form-checkbox accent-[#8E77BB] w-4 h-4"
                  />
                  <span className="text-sm font-medium">Caching</span>
                </label>
              )}

              {isCaching && (
                <div className="w-full mt-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Cache Expiry Duration (mins)
                  </label>
                  <input
                    id="cache-ttl"
                    type="number"
                    min="1"
                    value={cacheTtl}
                    onChange={(e) => setCacheTtl(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-[#8E77BB] focus:outline-none"
                    placeholder="e.g. 15"
                  />
                </div>
              )}
            </div>
          )}

          {/* View Name field */}
          <div>
            <label className="block text-[#282F49] text-sm font-semibold mb-1">
              View Name
            </label>

            {isEditMode ? (
              /* Read-only in edit mode */
              <div className="relative">
                <input
                  type="text"
                  value={newViewName}
                  readOnly
                  className="w-full mt-1 p-2.5 pr-10 border rounded-lg text-gray-500 border-gray-200 bg-gray-50 cursor-not-allowed"
                />
                <Lock
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 mt-0.5"
                />
              </div>
            ) : (
              <input
                type="text"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="Enter view name"
                className="w-full mt-1 p-2.5 border rounded-lg text-gray-700 border-gray-300 focus:ring-2 focus:ring-[#8E77BB] focus:outline-none"
              />
            )}

            {isEditMode && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Lock size={11} />
                View name cannot be changed in edit mode.
              </p>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleModal();
              handleSaveView({ newViewName });
            }}
            className="w-full bg-[#8E77BB] hover:bg-[#7a63a8] transition-colors text-white py-2.5 rounded-lg font-medium text-sm"
          >
            {isEditMode ? "Update View" : "Save View"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveViewModal;
