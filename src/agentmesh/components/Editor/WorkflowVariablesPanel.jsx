import React, { useState, useEffect, useRef, useCallback } from "react";
import { useWorkflowStore, useVariablesStore } from "../../store";
import {
  FiX,
  FiPlus,
  FiTrash2,
  FiSearch,
  FiUploadCloud,
  FiSave,
  FiLoader,
  FiDatabase,
  FiCheck,
  FiAlertCircle,
  FiFile,
  FiKey,
  FiEdit2,
  FiArrowLeft,
  FiTool,
} from "react-icons/fi";
import FieldListBuilder from "./FieldListBuilder";

/**
 * WORKFLOW VARIABLES PANEL v2.0
 * ─────────────────────────────
 * Generic, workflow-scoped key-value configuration panel.
 * Modes:
 * 1. Initial Mode (No sidebar): Displays clean full-width list of all variables.
 * 2. Editing/Adding Mode (Split view): Moves list to left sidebar and opens form in main panel.
 */

const VAR_TYPES = [
  { value: "text", label: "Text" },
  { value: "variable_ref", label: "Variable Reference (Dynamic)" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "list", label: "List (Tags)" },
  { value: "schema_list", label: "Schema List (Name + Desc)" },
  { value: "json", label: "JSON" },
];

const STYLES = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 10000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(28, 28, 30, 0.4)",
    backdropFilter: "blur(8px)",
    animation: "varPanelFadeIn 0.2s ease-out",
  },
  modal: {
    width: "92%",
    maxWidth: 1200,
    height: "88vh",
    background: "var(--bg-secondary, #fff)",
    borderRadius: 24,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
    border: "1px solid var(--border, #e2e8f0)",
    fontFamily: "'Google Sans', 'Roboto', sans-serif",
  },
  sidebar: {
    width: 340,
    background: "var(--bg-canvas, #f8fafc)",
    borderRight: "1px solid var(--border, #e2e8f0)",
    display: "flex",
    flexDirection: "column",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "var(--bg-secondary, #fff)",
  },
};

export default function WorkflowVariablesPanel() {
  const { workflowId, workflowName } = useWorkflowStore();
  const {
    variables,
    isLoading,
    error,
    showVariablesPanel,
    setShowVariablesPanel,
    fetchVariables,
    upsertVariable,
    deleteVariable,
    uploadJsonFile,
  } = useVariablesStore();

  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const fileInputRef = useRef(null);

  // Load variables when panel opens
  useEffect(() => {
    if (showVariablesPanel && workflowId) {
      fetchVariables(workflowId);
    }
  }, [showVariablesPanel, workflowId]);

  const selectedVar = variables.find((v) => v.key === selectedKey);

  const handleClose = () => {
    setShowVariablesPanel(false);
    setSelectedKey(null);
    setShowAddForm(false);
  };

  const handleJsonUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setSaveMsg(null);
    try {
      const res = await uploadJsonFile(workflowId, file);
      setSaveMsg({
        type: "success",
        text: `Extracted ${res.total_keys} keys from ${res.file_name}`,
      });
      setSelectedKey("sample_json_keys");
    } catch (err) {
      setSaveMsg({ type: "error", text: err.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (key) => {
    if (!window.confirm(`Delete variable "${key}"?`)) return;
    try {
      await deleteVariable(workflowId, key);
      if (selectedKey === key) {
        setSelectedKey(null);
      }
      setSaveMsg({ type: "success", text: `Deleted "${key}"` });
    } catch (err) {
      setSaveMsg({ type: "error", text: err.message });
    }
  };

  const filtered = variables.filter(
    (v) =>
      v.key.toLowerCase().includes(search.toLowerCase()) ||
      (v.description || "").toLowerCase().includes(search.toLowerCase()),
  );

  const isEditingOrAdding = selectedKey !== null || showAddForm;

  if (!showVariablesPanel) return null;

  return (
    <div style={STYLES.overlay} onClick={handleClose}>
      <div style={STYLES.modal} onClick={(e) => e.stopPropagation()}>
        {/* ─── Top Header ─── */}
        <div
          style={{
            padding: "16px 24px",
            background: "var(--bg-canvas, #f8fafc)",
            borderBottom: "1px solid var(--border, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Title Info */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "rgba(99, 102, 241, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiDatabase color="var(--theme-primary, #6366f1)" size={22} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: "var(--text-primary, #1e293b)",
                  margin: 0,
                }}
              >
                Variable Explorer
              </h2>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {saveMsg && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  background:
                    saveMsg.type === "success"
                      ? "rgba(34, 197, 94, 0.1)"
                      : "rgba(239, 68, 68, 0.1)",
                  color:
                    saveMsg.type === "success"
                      ? "var(--green, #22c55e)"
                      : "var(--red, #ef4444)",
                }}
              >
                {saveMsg.type === "success" ? (
                  <FiCheck size={14} />
                ) : (
                  <FiAlertCircle size={14} />
                )}
                {saveMsg.text}
              </span>
            )}

            {/* Back to Full List Button */}
            {isEditingOrAdding && (
              <button
                onClick={() => {
                  setSelectedKey(null);
                  setShowAddForm(false);
                }}
                style={{
                  padding: "8px 14px",
                  background: "var(--bg-secondary, #fff)",
                  border: "1px solid var(--border, #e2e8f0)",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-secondary, #64748b)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FiArrowLeft size={14} />
                All Variables
              </button>
            )}

            {/* Field list tools — optional helpers for working out which
                fields a workflow must produce, from a real sample. Nothing
                else on this screen depends on them. */}
            <button
              onClick={() => {
                setShowBuilder((v) => !v);
                setSelectedKey(null);
                setShowAddForm(false);
              }}
              title="Build a field list from a sample file"
              style={{
                padding: "8px 14px",
                background: showBuilder ? "#D8D2E7" : "var(--bg-secondary, #fff)",
                border: showBuilder ? "none" : "1px solid var(--border, #e2e8f0)",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                color: showBuilder ? "#3B1F70" : "var(--text-secondary, #64748b)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
            >
              <FiTool size={15} />
              {showBuilder ? "Back to Variables" : "Build Field List"}
            </button>

            {/* Upload JSON Button */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,.txt"
              onChange={handleJsonUpload}
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Upload JSON to extract keys"
              style={{
                padding: "8px 14px",
                background: "var(--bg-secondary, #fff)",
                border: "1px solid var(--border, #e2e8f0)",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-secondary, #64748b)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
            >
              {uploading ? (
                <FiLoader className="spin" size={15} />
              ) : (
                <FiUploadCloud size={15} />
              )}
              {uploading ? "Extracting..." : "Upload JSON"}
            </button>

            {/* + Add Variable Button (Light Purple) */}
            <button
              onClick={() => {
                setShowAddForm(true);
                setSelectedKey(null);
              }}
              style={{
                border: "none",
                background: "#D8D2E7",
                color: "#3B1F70",
                padding: "8px 16px",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 6px rgba(216, 210, 231, 0.5)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#C8BFDF")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#D8D2E7")}
            >
              <FiPlus size={16} />
              Add Variable
            </button>

            {/* Close Modal Button */}
            <button
              onClick={handleClose}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--text-muted, #94a3b8)",
                padding: 6,
                borderRadius: 8,
                display: "flex",
                marginLeft: 4,
              }}
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* ─── Body Content ─── */}
        {showBuilder ? (
          <FieldListBuilder
            workflowId={workflowId}
            variables={variables}
            onClose={() => setShowBuilder(false)}
          />
        ) : !isEditingOrAdding ? (
          /* ─── MODE 1: Initial Full-Width List View (No Sidebar) ─── */
          /* Fixed frame: the search bar sits at the top and the list below it
             scrolls. minHeight: 0 is load-bearing - a flex item defaults to
             min-height: auto and will not shrink below its content, so without
             it this box grows past the modal and the modal's overflow:hidden
             silently clips the last row instead of a scrollbar appearing. */
          <div style={{ flex: 1, minHeight: 0, padding: "28px 36px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {/* Search Bar - stays put; only the list below it scrolls */}
            <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ position: "relative", width: 360 }}>
                <FiSearch
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94A3B8",
                  }}
                  size={15}
                />
                <input
                  placeholder="Search variables by name or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 36px",
                    borderRadius: 10,
                    border: "1px solid var(--border, #e2e8f0)",
                    outline: "none",
                    fontSize: 13,
                    background: "var(--bg-secondary, #fff)",
                    color: "var(--text-primary, #1e293b)",
                  }}
                />
              </div>
              <span style={{ fontSize: 13, color: "var(--text-muted, #94a3b8)", fontWeight: 600 }}>
                Showing {filtered.length} of {variables.length} variables
              </span>
            </div>

            {/* The scrolling region. It is a container in its own right rather
                than the padded body above, so the scrollbar sits against the
                list and the search box cannot be scrolled off. minHeight: 0 is
                required: a flex item will not shrink below its content without
                it, so the list would grow and be clipped instead of scrolling. */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>

            {/* Loading / Empty States */}
            {isLoading && (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted, #94a3b8)" }}>
                <FiLoader className="spin" size={24} />
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 60,
                  color: "var(--text-muted, #94a3b8)",
                }}
              >
                <FiDatabase size={48} style={{ opacity: 0.15, marginBottom: 16 }} />
                <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                  {search ? "No matching variables" : "No Variables Configured Yet"}
                </p>
                <p style={{ fontSize: 13, maxWidth: 420, textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>
                  Define shared configuration variables for your workflow nodes. Click <strong>+ Add Variable</strong> above to create one.
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  style={{
                    border: "none",
                    background: "var(--theme-primary, #6366f1)",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <FiPlus size={16} />
                  Add Variable Now
                </button>
              </div>
            )}

            {/* Full-Width Table Grid of Variables */}
            {!isLoading && filtered.length > 0 && (
              <div
                style={{
                  border: "1px solid var(--border, #e2e8f0)",
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "var(--bg-secondary, #fff)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                {/* Table Header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "240px 150px 1fr 110px",
                    padding: "14px 20px",
                    background: "var(--bg-canvas, #f8fafc)",
                    borderBottom: "1px solid var(--border, #e2e8f0)",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "var(--text-muted, #94a3b8)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  <div>Variable Key</div>
                  <div>Type</div>
                  <div>Description</div>
                  <div style={{ textAlign: "right" }}>Actions</div>
                </div>

                {/* Table Rows */}
                {filtered.map((v) => {
                  const typeObj = VAR_TYPES.find((t) => t.value === v.var_type);
                  const typeLabel = typeObj ? typeObj.label : v.var_type;

                  return (
                    <div
                      key={v.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "240px 150px 1fr 110px",
                        padding: "14px 20px",
                        alignItems: "center",
                        borderBottom: "1px solid var(--border, #f1f5f9)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-canvas, #f8fafc)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Name */}
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "var(--text-primary, #1e293b)",
                          fontFamily: "monospace",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={v.key}
                      >
                        {v.key}
                      </div>

                      {/* Type Badge */}
                      <div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background:
                              v.var_type === "variable_ref"
                                ? "#EDE9FE"
                                : v.var_type === "json"
                                  ? "#DBEAFE"
                                  : "#F1F5F9",
                            color:
                              v.var_type === "variable_ref"
                                ? "#6D28D9"
                                : v.var_type === "json"
                                  ? "#1E40AF"
                                  : "#475569",
                            textTransform: "uppercase",
                          }}
                        >
                          {v.var_type === "variable_ref" ? "REF" : typeLabel}
                        </span>
                      </div>

                      {/* Description (Truncated) */}
                      <div
                        style={{
                          fontSize: 12,
                          color: v.description ? "var(--text-secondary, #64748b)" : "var(--text-muted, #cbd5e1)",
                          fontStyle: v.description ? "normal" : "italic",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          paddingRight: 20,
                        }}
                        title={v.description || "No description"}
                      >
                        {v.description || "—"}
                      </div>

                      {/* Action Buttons (Circular Style) */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
                        {/* Edit Button (Circle) */}
                        <button
                          onClick={() => {
                            setSelectedKey(v.key);
                            setShowAddForm(false);
                          }}
                          title="Edit variable"
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            border: "none",
                            background: "rgba(99, 102, 241, 0.1)",
                            color: "var(--theme-primary, #6366f1)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--theme-primary, #6366f1)";
                            e.currentTarget.style.color = "white";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                            e.currentTarget.style.color = "var(--theme-primary, #6366f1)";
                          }}
                        >
                          <FiEdit2 size={14} />
                        </button>

                        {/* Delete Button (Circle) */}
                        <button
                          onClick={() => handleDelete(v.key)}
                          title="Delete variable"
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            border: "none",
                            background: "rgba(239, 68, 68, 0.1)",
                            color: "var(--red, #ef4444)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--red, #ef4444)";
                            e.currentTarget.style.color = "white";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                            e.currentTarget.style.color = "var(--red, #ef4444)";
                          }}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            </div>{/* end scrolling region */}
          </div>
        ) : (
          /* ─── MODE 2: Split View (Left Sidebar List + Right Form Panel) ─── */
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            {/* Left Sidebar */}
            <div style={STYLES.sidebar}>
              <div style={{ padding: "16px", borderBottom: "1px solid var(--border, #e2e8f0)" }}>
                <div style={{ position: "relative" }}>
                  <FiSearch
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94A3B8",
                    }}
                    size={14}
                  />
                  <input
                    placeholder="Search variables..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 10px 9px 34px",
                      borderRadius: 10,
                      border: "1px solid var(--border, #e2e8f0)",
                      outline: "none",
                      fontSize: 12,
                      background: "var(--bg-secondary, #fff)",
                      color: "var(--text-primary, #1e293b)",
                    }}
                  />
                </div>
              </div>

              {/* Sidebar Variable List */}
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px" }}>
                {filtered.map((v) => {
                  const active = selectedKey === v.key && !showAddForm;
                  const typeObj = VAR_TYPES.find((t) => t.value === v.var_type);
                  const typeLabel = typeObj ? typeObj.label : v.var_type;

                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        setSelectedKey(v.key);
                        setShowAddForm(false);
                      }}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 12,
                        cursor: "pointer",
                        marginBottom: 8,
                        background: active ? "var(--bg-secondary, #fff)" : "transparent",
                        boxShadow: active ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                        border: "1px solid",
                        borderColor: active ? "var(--theme-primary, #6366f1)" : "transparent",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: "var(--text-primary, #1e293b)",
                            fontFamily: "monospace",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "140px",
                          }}
                          title={v.key}
                        >
                          {v.key}
                        </div>

                        <div>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: v.var_type === "variable_ref" ? "#EDE9FE" : "#F1F5F9",
                              color: v.var_type === "variable_ref" ? "#6D28D9" : "#475569",
                              textTransform: "uppercase",
                            }}
                          >
                            {v.var_type === "variable_ref" ? "REF" : v.var_type}
                          </span>
                        </div>
                      </div>

                      {v.description && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted, #94a3b8)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={v.description}
                        >
                          {v.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Main Form Panel */}
            <div style={STYLES.main}>
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "32px 40px" }}>
                {showAddForm ? (
                  <AddVariableForm
                    workflowId={workflowId}
                    onSave={async (variable) => {
                      setSaving(true);
                      setSaveMsg(null);
                      try {
                        await upsertVariable(workflowId, variable);
                        setSaveMsg({
                          type: "success",
                          text: `Variable "${variable.key}" saved`,
                        });
                        setShowAddForm(false);
                        setSelectedKey(
                          variable.key.trim().toLowerCase().replace(/ /g, "_"),
                        );
                      } catch (err) {
                        setSaveMsg({ type: "error", text: err.message });
                      } finally {
                        setSaving(false);
                      }
                    }}
                    saving={saving}
                  />
                ) : selectedVar ? (
                  <VariableDetail
                    variable={selectedVar}
                    workflowId={workflowId}
                    onSave={async (updated) => {
                      setSaving(true);
                      setSaveMsg(null);
                      try {
                        await upsertVariable(workflowId, updated);
                        setSaveMsg({
                          type: "success",
                          text: `Variable "${updated.key}" updated`,
                        });
                      } catch (err) {
                        setSaveMsg({ type: "error", text: err.message });
                      } finally {
                        setSaving(false);
                      }
                    }}
                    onDelete={() => handleDelete(selectedVar.key)}
                    saving={saving}
                  />
                ) : null}
              </div>
            </div>
          </div>
        )}
        <style>{`
          @keyframes varPanelFadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .spin { animation: spin 1s linear infinite; }
        `}</style>
      </div>
    </div>
  );
}

// ─── Add Variable Form ────────────────────────────────────────────────────────

function AddVariableForm({ workflowId, onSave, saving }) {
  const [key, setKey] = useState("");
  const [varType, setVarType] = useState("text");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");

  // schema_list state
  const [schemaItems, setSchemaItems] = useState([
    { name: "", description: "" },
  ]);

  // list state
  const [listItems, setListItems] = useState([]);

  // Auto-set sensible defaults when type changes
  useEffect(() => {
    if (varType === "boolean") {
      setValue("true");
    } else if (varType === "json") {
      setValue(prev => prev && prev.trim() ? prev : "{}");
    } else if (varType === "number") {
      setValue(prev => prev && prev.trim() ? prev : "0");
    } else if (varType === "text") {
      setValue(prev => (prev === "true" || prev === "false" || prev === "{}" || prev === "0") ? "" : prev);
    }
  }, [varType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!key.trim()) return;

    let finalValue;
    switch (varType) {
      case "text":
        finalValue = value;
        break;
      case "number":
        finalValue = parseFloat(value) || 0;
        break;
      case "boolean":
        finalValue = value === "true";
        break;
      case "list":
        finalValue = listItems.filter((i) => i.trim());
        break;
      case "schema_list":
        finalValue = schemaItems.filter((i) => i.name.trim());
        break;
      case "json":
        try {
          finalValue = JSON.parse(value);
        } catch {
          alert("Invalid JSON");
          return;
        }
        break;
      default:
        finalValue = value;
    }

    onSave({
      key: key.trim(),
      value: finalValue,
      var_type: varType,
      description: description || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", minHeight: "100%", justifyContent: "space-between" }}>
      <div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "var(--text-primary, #1e293b)",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <FiPlus size={20} /> New Variable
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <label style={labelStyle}>Variable Key</label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g. agent_classes"
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Type</label>
            <select
              value={varType}
              onChange={(e) => setVarType(e.target.value)}
              style={inputStyle}
            >
              {VAR_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Description (optional)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief hint for this variable"
            style={inputStyle}
          />
        </div>

        {/* Type-specific value editors */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Value</label>
          {varType === "text" && (
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter text value"
              style={inputStyle}
            />
          )}
          {varType === "variable_ref" && (
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. {{nodes.set_data_32602.cust_name}} or cust_name"
              style={inputStyle}
            />
          )}
          {varType === "number" && (
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
              step="any"
              style={inputStyle}
            />
          )}
          {varType === "boolean" && (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              style={inputStyle}
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          )}
          {varType === "json" && (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='{"key": "value"}'
              rows={6}
              style={{
                ...inputStyle,
                fontFamily: "monospace",
                resize: "vertical",
              }}
            />
          )}
          {varType === "list" && (
            <ListEditor items={listItems} setItems={setListItems} />
          )}
          {varType === "schema_list" && (
            <SchemaListEditor items={schemaItems} setItems={setSchemaItems} />
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar (Bottom Right) */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "var(--bg-secondary, #fff)",
          paddingTop: 16,
          paddingBottom: 8,
          marginTop: 24,
          borderTop: "1px solid var(--border, #e2e8f0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 12,
        }}
      >
        <button
          type="submit"
          disabled={saving || !key.trim()}
          style={{
            border: "none",
            background: "#D8D2E7",
            color: "#3B1F70",
            padding: "10px 22px",
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 2px 6px rgba(216, 210, 231, 0.5)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#C8BFDF")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#D8D2E7")}
        >
          {saving ? (
            <FiLoader className="spin" size={14} />
          ) : (
            <FiSave size={14} />
          )}
          {saving ? "Saving..." : "Save Variable"}
        </button>
      </div>
    </form>
  );
}

// ─── Variable Detail View ─────────────────────────────────────────────────────

function VariableDetail({ variable, workflowId, onSave, onDelete, saving }) {
  const [description, setDescription] = useState(variable.description || "");
  const [value, setValue] = useState("");
  const [schemaItems, setSchemaItems] = useState([]);
  const [listItems, setListItems] = useState([]);

  useEffect(() => {
    setDescription(variable.description || "");
    if (variable.var_type === "schema_list") {
      setSchemaItems(Array.isArray(variable.value) ? [...variable.value] : []);
    } else if (
      variable.var_type === "list" ||
      variable.var_type === "json_keys"
    ) {
      setListItems(Array.isArray(variable.value) ? [...variable.value] : []);
    } else if (variable.var_type === "json") {
      setValue(JSON.stringify(variable.value, null, 2));
    } else if (variable.var_type === "boolean") {
      setValue(String(variable.value));
    } else {
      setValue(
        variable.value !== null && variable.value !== undefined
          ? String(variable.value)
          : "",
      );
    }
  }, [variable]);

  const handleSave = () => {
    let finalValue;
    switch (variable.var_type) {
      case "text":
        finalValue = value;
        break;
      case "number":
        finalValue = parseFloat(value) || 0;
        break;
      case "boolean":
        finalValue = value === "true";
        break;
      case "list":
        finalValue = listItems.filter((i) => i.trim());
        break;
      case "json_keys":
        finalValue = listItems;
        break;
      case "schema_list":
        finalValue = schemaItems.filter((i) => i.name?.trim());
        break;
      case "json":
        try {
          finalValue = JSON.parse(value);
        } catch {
          alert("Invalid JSON");
          return;
        }
        break;
      default:
        finalValue = value;
    }
    onSave({
      key: variable.key,
      value: finalValue,
      var_type: variable.var_type,
      description: description || null,
    });
  };

  const isReadOnly = variable.var_type === "json_keys";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", justifyContent: "space-between" }}>
      <div>
        {/* Top Header with Key Info */}
        <div
          style={{
            marginBottom: 24,
            paddingBottom: 16,
            borderBottom: "1px solid var(--border, #e2e8f0)",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "var(--text-primary, #1e293b)",
              fontFamily: "monospace",
              marginBottom: 4,
            }}
          >
            {variable.key}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 4,
                background:
                  variable.var_type === "json_keys"
                    ? "#DBEAFE"
                    : variable.var_type === "schema_list"
                      ? "#F0FDF4"
                      : "#F1F5F9",
                color:
                  variable.var_type === "json_keys"
                    ? "#1E40AF"
                    : variable.var_type === "schema_list"
                      ? "#166534"
                      : "#475569",
                textTransform: "uppercase",
              }}
            >
              {variable.var_type}
            </span>
            {variable.source_filename && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted, #94a3b8)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <FiFile size={10} /> {variable.source_filename}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            style={inputStyle}
            readOnly={isReadOnly}
          />
        </div>

        {/* Value Editor */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>
            Value
            {isReadOnly && (
              <span
                style={{
                  fontWeight: 400,
                  fontSize: 10,
                  marginLeft: 8,
                  color: "#94a3b8",
                }}
              >
                (auto-generated, read-only — re-upload to refresh)
              </span>
            )}
            {variable.var_type === "list" && (
              <span
                style={{
                  fontWeight: 400,
                  fontSize: 10,
                  marginLeft: 8,
                  color: "#94a3b8",
                }}
              >
                ({listItems.length} items)
              </span>
            )}
            {variable.var_type === "json_keys" && (
              <span
                style={{
                  fontWeight: 400,
                  fontSize: 10,
                  marginLeft: 8,
                  color: "#94a3b8",
                }}
              >
                ({listItems.length} keys)
              </span>
            )}
            {variable.var_type === "schema_list" && (
              <span
                style={{
                  fontWeight: 400,
                  fontSize: 10,
                  marginLeft: 8,
                  color: "#94a3b8",
                }}
              >
                ({schemaItems.length} items)
              </span>
            )}
          </label>

          {variable.var_type === "text" && (
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              style={inputStyle}
            />
          )}
          {variable.var_type === "number" && (
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              step="any"
              style={inputStyle}
            />
          )}
          {variable.var_type === "boolean" && (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              style={inputStyle}
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          )}
          {variable.var_type === "json" && (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={10}
              style={{
                ...inputStyle,
                fontFamily: "monospace",
                resize: "vertical",
              }}
            />
          )}
          {variable.var_type === "list" && (
            <ListEditor items={listItems} setItems={setListItems} />
          )}
          {variable.var_type === "json_keys" && (
            <JsonKeysViewer keys={listItems} />
          )}
          {variable.var_type === "schema_list" && (
            <SchemaListEditor items={schemaItems} setItems={setSchemaItems} />
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar (Bottom Right) */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "var(--bg-secondary, #fff)",
          paddingTop: 16,
          paddingBottom: 8,
          marginTop: 24,
          borderTop: "1px solid var(--border, #e2e8f0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 12,
        }}
      >
        {/* Delete Circle Button */}
        <button
          onClick={onDelete}
          title="Delete variable"
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: "none",
            background: "rgba(239, 68, 68, 0.1)",
            color: "var(--red, #ef4444)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--red, #ef4444)";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
            e.currentTarget.style.color = "var(--red, #ef4444)";
          }}
        >
          <FiTrash2 size={16} />
        </button>

        {/* Save Changes Button (Light Purple #D8D2E7) */}
        {!isReadOnly && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              border: "none",
              background: "#D8D2E7",
              color: "#3B1F70",
              padding: "10px 22px",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 2px 6px rgba(216, 210, 231, 0.5)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#C8BFDF")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#D8D2E7")}
          >
            {saving ? (
              <FiLoader className="spin" size={14} />
            ) : (
              <FiSave size={14} />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ListEditor({ items, setItems }) {
  const [input, setInput] = useState("");

  const addItem = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (items.includes(trimmed)) return;
    setItems([...items, trimmed]);
    setInput("");
  };

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder="Type and press Enter to add..."
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          type="button"
          onClick={addItem}
          style={{
            border: "1px solid var(--border, #e2e8f0)",
            background: "white",
            padding: "8px 14px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <FiPlus size={12} />
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map((item, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 6,
              background: "#F1F5F9",
              fontSize: 12,
              fontWeight: 500,
              color: "#475569",
              fontFamily: "monospace",
            }}
          >
            {item}
            <button
              type="button"
              onClick={() => removeItem(i)}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 0,
                color: "#94a3b8",
                display: "flex",
              }}
            >
              <FiX size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function SchemaListEditor({ items, setItems }) {
  const addItem = () => setItems([...items, { name: "", description: "" }]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx, field, value) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  };

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "200px 1fr 32px",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
          }}
        >
          Name
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
          }}
        >
          Description
        </div>
        <div />
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "200px 1fr 32px",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <input
            value={item.name}
            onChange={(e) => updateItem(i, "name", e.target.value)}
            placeholder="e.g. FA"
            style={{ ...inputStyle, fontSize: 12, padding: "8px 10px" }}
          />
          <input
            value={item.description || ""}
            onChange={(e) => updateItem(i, "description", e.target.value)}
            placeholder="Handles income, assets, employment..."
            style={{ ...inputStyle, fontSize: 12, padding: "8px 10px" }}
          />
          <button
            type="button"
            onClick={() => removeItem(i)}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        style={{
          border: "1px dashed var(--border, #e2e8f0)",
          background: "transparent",
          padding: "8px",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 12,
          color: "var(--text-muted, #94a3b8)",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          marginTop: 4,
        }}
      >
        <FiPlus size={12} /> Add Row
      </button>
    </div>
  );
}

function JsonKeysViewer({ keys }) {
  const [search, setSearch] = useState("");
  const filtered = keys.filter((k) =>
    k.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 8 }}>
        <FiSearch
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#94a3b8",
          }}
          size={12}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${keys.length} keys...`}
          style={{ ...inputStyle, paddingLeft: 30, fontSize: 11 }}
        />
      </div>
      <div
        style={{
          maxHeight: 340,
          overflowY: "auto",
          border: "1px solid var(--border, #e2e8f0)",
          borderRadius: 8,
          background: "#FAFBFC",
        }}
      >
        {filtered.map((key, i) => (
          <div
            key={i}
            style={{
              padding: "7px 12px",
              fontSize: 11,
              fontFamily: "monospace",
              borderBottom:
                i < filtered.length - 1 ? "1px solid #F1F5F9" : "none",
              color: "#334155",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FiKey size={10} color="#94a3b8" />
            {key}
          </div>
        ))}
        {filtered.length === 0 && (
          <div
            style={{
              padding: 16,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 11,
            }}
          >
            No matching keys
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  marginBottom: 6,
  color: "var(--text-muted, #94a3b8)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--border, #e2e8f0)",
  outline: "none",
  fontSize: 13,
  color: "var(--text-primary, #1e293b)",
  background: "var(--bg-secondary, #fff)",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

const primaryBtnStyle = {
  border: "none",
  background: "var(--theme-primary, #6366f1)",
  color: "white",
  padding: "10px 24px",
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
  transition: "all 0.2s",
};
