import React, { useEffect, useState } from "react";
import { useStateContext } from "../context/contextViewProvider";

const SaveViewModal = ({ toggleModal, handleSaveView }) => {
  const { finalPayload, handleFinalPayload } = useStateContext("");
  const [newViewName, setNewViewName] = useState("");
  const [isMaterializedView, setIsMaterializedView] = useState(finalPayload.isMateralizedView === true);
  const [isCaching, setIsCaching] = useState(finalPayload.isCaching === true);
  const [refreshPeriod, setRefreshPeriod] = useState();
  const [cacheTtl, setCacheTtl] = useState("");


  useEffect(() => {
    if (finalPayload) {
      const updatedPayload = {
        ...finalPayload,
        isMateralizedView: isMaterializedView,
        isCaching: isCaching,
        grace_period: refreshPeriod,
      };

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
  };

  const handleCachingChange = (event) => {
    setIsCaching(event.target.checked);
    if (!event.target.checked) {
      setCacheTtl("");
    }
  };

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[#8E77BB] text-2xl font-bold">View Name</h2>
          <button onClick={toggleModal} className="text-gray-500 text-2xl">
            &times;
          </button>
        </div>

        <div>
          {finalPayload?.view_type === "Integrated View" && (
            <div className="flex flex-wrap text-black items-center mb-3 gap-3">
              {!isCaching && (
                <div>
                  <label className="inline-flex items-center space-x-2 mr-4">
                    <input
                      type="checkbox"
                      checked={isMaterializedView}
                      onChange={handleViewTypeChange}
                      aria-label="Materialized view"
                      className="form-checkbox"
                    />
                    <span>Materialized view</span>
                  </label>
                </div>
              )}

              {isMaterializedView && (
                <div>
                  <input
                    id="refresh-period"
                    type="number"
                    value={refreshPeriod}
                    onChange={(e) => setRefreshPeriod(e.target.value)}
                    className="mt-1 ml-1 p-1 border border-gray-300 rounded-md"
                    placeholder="Enter Refresh Period"
                  />
                </div>
              )}
              {!isMaterializedView && (
                <div>
                  <label className="inline-flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isCaching}
                      onChange={handleCachingChange}
                      aria-label="Caching"
                      className="form-checkbox"
                    />
                    <span>Caching</span>
                  </label>
                </div>
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
          <div className="mb-6">
            <label className="block text-[#282F49] text-lg font-semibold">
              Enter View Name
            </label>
            <input
              type="text"
              value={newViewName || ""}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="Enter View Name"
              className="w-full mt-2 p-2.5 border rounded-lg text-gray-700 border-gray-300 focus:ring-2 focus:ring-[#8E77BB] focus:outline-none"
            />
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              toggleModal();
              handleSaveView({ newViewName });
            }}
            className="w-full bg-[#8E77BB] text-white py-2 rounded-lg"
          >
            Save View
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveViewModal;
