import React, { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import CircularProgress from "@mui/material/CircularProgress";
import { useNavigate } from "react-router-dom";
import { usePersonaStatuses } from "../../../../hooks/dataGovernance/Users/auth";

import { Lock } from "lucide-react";

const EditorSaveViewModal = ({ isOpen, onClose, query, securedQuery, project, policyIds, onSaveSuccess, isEditMode, editViewName, editOriginalPayload }) => {
  const { hostnameV2, token, decodedToken } = useAuth();
  const navigate = useNavigate();
  const { personaStatuses } = usePersonaStatuses();

  const isViewManager = decodedToken?.resource_access?.darch?.roles?.some(role => role.toLowerCase() === 'persona:view manager') && personaStatuses?.['persona:view manager'] === true;

  const [viewName, setViewName] = useState("");
  const [isMaterializedView, setIsMaterializedView] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [gracePeriod, setGracePeriod] = useState("");
  const [cacheTtl, setCacheTtl] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && editOriginalPayload) {
      console.log("editoriginalpayload is @@@@ ", editOriginalPayload)
      setViewName(editViewName || "");
      setIsMaterializedView(editOriginalPayload.materalized === true);
      setIsCaching(editOriginalPayload.cached === true);
      setGracePeriod(editOriginalPayload?.grace_period || "");
      setCacheTtl(editOriginalPayload?.cache_ttl || "");
    } else {
      setViewName("");
      setIsMaterializedView(false);
      setIsCaching(false);
      setGracePeriod("");
      setCacheTtl("");
    }
    setErrorMsg("");
  }, [isOpen, isEditMode, editViewName, editOriginalPayload]);

  if (!isOpen) return null;

  const handleViewTypeChange = (event) => {
    setIsMaterializedView(event.target.checked);
    if (!event.target.checked) setGracePeriod("");
  };

  const handleCachingChange = (event) => {
    setIsCaching(event.target.checked);
    if (!event.target.checked) setCacheTtl("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!viewName.trim()) {
      setErrorMsg("Please enter a view name.");
      return;
    }
    setErrorMsg("");
    setSaving(true);

    try {
      // 1. Check if view exists (only if not in edit mode)
      if (!isEditMode) {
        const viewExistsResponse = await fetch(`${hostnameV2}/view-exists/${viewName.trim().toLowerCase()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });

        if (viewExistsResponse.status !== 200) {
          setErrorMsg("Error checking if view exists.");
          setSaving(false);
          return;
        }
        const viewExists = await viewExistsResponse.json();
        if (viewExists["result"]) {
          setErrorMsg("View already exists.");
          setSaving(false);
          return;
        }
      }

      // 2. Save the view
      const payload = {
        query: query,
        secure_query: securedQuery,
        view_name: viewName.trim().toLowerCase(),
        isMaterializedView: isMaterializedView,
        grace_period: isMaterializedView && gracePeriod ? Number(gracePeriod) : null,
        isCaching: isCaching,
        cache_ttl: isCaching && cacheTtl ? Number(cacheTtl) : null,
        created_by: decodedToken?.preferred_username,
        project: project === "default" || project === "none" ? "default" : project,
        policy_id: policyIds || []
      };

      // Clean up nulls
      if (payload.grace_period === null) delete payload.grace_period;
      if (payload.cache_ttl === null) delete payload.cache_ttl;

      const endpoint = isEditMode ? `${hostnameV2}/edit-editor-view` : `${hostnameV2}/save-editor-view`;

      const saveRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!saveRes.ok) {
        const errText = await saveRes.text();
        let errMsg = isEditMode ? "Failed to update view." : "Failed to save view.";
        try {
          const parsed = JSON.parse(errText);
          const detail = parsed.detail;
          if (Array.isArray(detail)) {
            // FastAPI validation error — extract first human-readable message
            errMsg = detail.map(d => d.msg || JSON.stringify(d)).join("; ");
          } else if (typeof detail === "string") {
            errMsg = detail;
          } else if (detail) {
            errMsg = JSON.stringify(detail);
          }
        } catch { errMsg = errText || errMsg; }
        setErrorMsg(errMsg);
        setSaving(false);
        return;
      }
      
      if (isEditMode) {
        sessionStorage.removeItem("editMode");
        sessionStorage.removeItem("editViewName");
        sessionStorage.removeItem("editOriginalPayload");
      }

      onSaveSuccess(viewName.trim().toLowerCase());
      onClose();
      navigate("/federation");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed z-[60] inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-[#8E77BB] text-2xl font-bold">{isEditMode ? "Update View" : "Save View"}</h2>
          <button onClick={onClose} disabled={saving} className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors">
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap text-black items-center gap-3 pb-2 border-b border-gray-100">
            {(!isCaching && isViewManager) && (
              <label className="inline-flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isMaterializedView}
                  onChange={handleViewTypeChange}
                  disabled={saving}
                  className="form-checkbox accent-[#8E77BB] w-4 h-4"
                />
                <span className="text-base font-normal">Materialized View</span>
              </label>
            )}
            {isMaterializedView && (
              <div className="w-full mt-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Grace Period (hr)
                </label>
                <input
                  type="number"
                  min="1"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(e.target.value)}
                  disabled={saving}
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
                  disabled={saving}
                  className="form-checkbox accent-[#8E77BB] w-4 h-4"
                />
                <span className="text-base font-normal">Caching</span>
              </label>
            )}
            {isCaching && (
              <div className="w-full mt-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Cache Expiry Duration (mins)
                </label>
                <input
                  type="number"
                  min="1"
                  value={cacheTtl}
                  onChange={(e) => setCacheTtl(e.target.value)}
                  disabled={saving}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-[#8E77BB] focus:outline-none"
                  placeholder="e.g. 15"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[#282F49] text-sm font-medium text-gray-600 mb-1">
              View Name
            </label>
            {isEditMode ? (
              <div className="relative">
                <input
                  type="text"
                  value={viewName}
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
                value={viewName}
                onChange={(e) => {
                  setViewName(e.target.value);
                  setErrorMsg("");
                }}
                disabled={saving}
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

          {errorMsg && (
            <div className="text-red-500 text-sm font-normal">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center w-full bg-[#8E77BB] hover:bg-[#7a63a8] disabled:opacity-70 disabled:cursor-not-allowed transition-colors text-white py-2.5 rounded-lg font-medium text-sm"
          >
            {saving ? <CircularProgress size={20} sx={{ color: "white" }} /> : isEditMode ? "Update View" : "Save View"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorSaveViewModal;
