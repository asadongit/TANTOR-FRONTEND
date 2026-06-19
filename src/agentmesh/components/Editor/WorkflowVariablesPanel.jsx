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
} from "react-icons/fi";

/**
 * WORKFLOW VARIABLES PANEL v1.0
 * ─────────────────────────────
 * Generic, workflow-scoped key-value configuration panel.
 * Supports: text, number, boolean, list, schema_list, json_keys, json.
 *
 * Features:
 * - Upload JSON files → auto-extract and save flattened keys
 * - Add/edit/delete variables with type-aware UI controls
 * - Searchable list of all configured variables
 * - schema_list: name + description pairs (for agent classes, etc.)
 */

const VAR_TYPES = [
  { value: "text", label: "Text" },
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
      if (selectedKey === key) setSelectedKey(null);
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

  if (!showVariablesPanel) return null;

  return (
    <div style={STYLES.overlay} onClick={handleClose}>
      <div style={STYLES.modal} onClick={(e) => e.stopPropagation()}>
        {/* ─── Sidebar ─── */}
        <div style={STYLES.sidebar}>
          <div style={{ padding: "24px 20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FiDatabase color="var(--theme-primary, #6366f1)" size={20} />
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--text-primary, #1e293b)",
                    margin: 0,
                  }}
                >
                  Variables
                </h2>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setSelectedKey(null);
                  }}
                  title="Add Variable"
                  style={{
                    border: "none",
                    background: "var(--theme-primary, #6366f1)",
                    color: "white",
                    padding: "6px",
                    borderRadius: 8,
                    cursor: "pointer",
                    display: "flex",
                  }}
                >
                  <FiPlus size={16} />
                </button>
              </div>
            </div>

            {/* Upload JSON */}
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
              style={{
                width: "100%",
                padding: "10px 12px",
                marginBottom: 12,
                background: "var(--bg-secondary, #fff)",
                border: "1px dashed var(--border, #e2e8f0)",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-secondary, #64748b)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor =
                  "var(--theme-primary, #6366f1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "var(--border, #e2e8f0)")
              }
            >
              {uploading ? (
                <FiLoader className="spin" size={14} />
              ) : (
                <FiUploadCloud size={14} />
              )}
              {uploading ? "Extracting Keys..." : "Upload Sample JSON"}
            </button>

            {/* Search */}
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

          {/* Variable List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 20px" }}>
            {isLoading && (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "var(--text-muted, #94a3b8)",
                }}
              >
                <FiLoader className="spin" size={20} />
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "var(--text-muted, #94a3b8)",
                  fontSize: 12,
                }}
              >
                {search
                  ? "No matching variables"
                  : "No variables configured yet"}
              </div>
            )}

            {filtered.map((v) => {
              const active = selectedKey === v.key;
              const typeLabel =
                VAR_TYPES.find((t) => t.value === v.var_type)?.label ||
                v.var_type;
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
                    marginBottom: 4,
                    background: active
                      ? "var(--bg-secondary, #fff)"
                      : "transparent",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    border: "1px solid",
                    borderColor: active
                      ? "var(--border, #e2e8f0)"
                      : "transparent",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!active)
                      e.currentTarget.style.background = "rgba(0,0,0,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 2,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: active
                          ? "var(--text-primary, #1e293b)"
                          : "var(--text-secondary, #64748b)",
                        fontFamily: "monospace",
                      }}
                    >
                      {v.key}
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background:
                          v.var_type === "json_keys"
                            ? "#DBEAFE"
                            : v.var_type === "schema_list"
                              ? "#F0FDF4"
                              : "#F1F5F9",
                        color:
                          v.var_type === "json_keys"
                            ? "#1E40AF"
                            : v.var_type === "schema_list"
                              ? "#166534"
                              : "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {v.var_type}
                    </span>
                  </div>
                  {v.description && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted, #94a3b8)",
                        marginTop: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {v.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Main Area ─── */}
        <div style={STYLES.main}>
          {/* Header */}
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid var(--border, #e2e8f0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted, #94a3b8)",
                fontWeight: 600,
              }}
            >
              {workflowName} — {variables.length} variable
              {variables.length !== 1 ? "s" : ""}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {saveMsg && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color:
                      saveMsg.type === "success"
                        ? "var(--green, #22c55e)"
                        : "var(--red, #ef4444)",
                  }}
                >
                  {saveMsg.type === "success" ? (
                    <FiCheck size={12} />
                  ) : (
                    <FiAlertCircle size={12} />
                  )}
                  {saveMsg.text}
                </span>
              )}
              <button
                onClick={handleClose}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--text-muted, #94a3b8)",
                  padding: 4,
                  borderRadius: 6,
                }}
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
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
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "var(--text-muted, #94a3b8)",
                }}
              >
                <FiDatabase
                  size={48}
                  style={{ opacity: 0.15, marginBottom: 16 }}
                />
                <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                  Workflow Variables
                </p>
                <p
                  style={{
                    fontSize: 12,
                    maxWidth: 400,
                    textAlign: "center",
                    lineHeight: 1.6,
                  }}
                >
                  Define shared configuration that any node in this workflow can
                  access. Upload a sample JSON to auto-extract keys, or add
                  variables manually.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes varPanelFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
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
  const [listItems, setListItems] = useState([""]);

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
    <form onSubmit={handleSubmit}>
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

      <button
        type="submit"
        disabled={saving || !key.trim()}
        style={primaryBtnStyle}
      >
        {saving ? (
          <>
            <FiLoader className="spin" size={14} /> Saving...
          </>
        ) : (
          <>
            <FiSave size={14} /> Save Variable
          </>
        )}
      </button>
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
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
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
        <button
          onClick={onDelete}
          style={{
            border: "none",
            background: "#FEF2F2",
            color: "#DC2626",
            padding: "6px 12px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <FiTrash2 size={12} /> Delete
        </button>
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

      {!isReadOnly && (
        <button onClick={handleSave} disabled={saving} style={primaryBtnStyle}>
          {saving ? (
            <>
              <FiLoader className="spin" size={14} /> Saving...
            </>
          ) : (
            <>
              <FiSave size={14} /> Save Changes
            </>
          )}
        </button>
      )}
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
