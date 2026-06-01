import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Trash2,
  FileJson,
  Edit3,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Search,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

const ALLOWED_TOP_LEVEL_KEYS = new Set(["tableName", "topicName", "message"]);
const ALLOWED_MESSAGE_KEYS = new Set(["dataFormat", "fields"]);

const ALLOWED_FIELD_KEYS = new Set(["name", "type", "mapping", "dataFormat", "formatHint"]);
const REQUIRED_FIELD_KEYS = new Set(["name", "type", "mapping"]);

const SUPPORTED_TYPES = new Set([
  "BIGINT", "INTEGER", "SMALLINT", "TINYINT",
  "DOUBLE", "REAL", "BOOLEAN", "VARCHAR",
  "DATE", "TIME", "TIME WITH TIME ZONE",
  "TIMESTAMP", "TIMESTAMP WITH TIME ZONE",
]);

const TEMPORAL_TYPES = new Set([
  "DATE", "TIME", "TIME WITH TIME ZONE",
  "TIMESTAMP", "TIMESTAMP WITH TIME ZONE",
]);

const SUPPORTED_DATA_FORMATS = new Set([
  "iso8601", "rfc2822", "custom-date-time",
  "milliseconds-since-epoch", "seconds-since-epoch",
]);

const TEMPORAL_TYPE_ALLOWED_FORMATS = {
  "DATE": new Set(["custom-date-time", "iso8601"]),
  "TIME": new Set(["custom-date-time", "iso8601", "milliseconds-since-epoch", "seconds-since-epoch"]),
  "TIME WITH TIME ZONE": new Set(["custom-date-time", "iso8601"]),
  "TIMESTAMP": new Set(["custom-date-time", "iso8601", "rfc2822", "milliseconds-since-epoch", "seconds-since-epoch"]),
  "TIMESTAMP WITH TIME ZONE": new Set(["custom-date-time", "iso8601", "rfc2822", "milliseconds-since-epoch", "seconds-since-epoch"]),
};

const validateKafkaTopicJson = (filename, text, seenTopicNames = new Set()) => {
  // 1. Valid JSON
  let data;
  try {
    data = typeof text === "string" ? JSON.parse(text) : text;
  } catch (e) {
    return `Invalid JSON — ${e.message}.`;
  }

  if (typeof data !== "object" || Array.isArray(data) || data === null) {
    return `Root must be a JSON object.`;
  }

  const topLevelKeys = new Set(Object.keys(data));
  const extraTopLevel = [...topLevelKeys].filter((k) => !ALLOWED_TOP_LEVEL_KEYS.has(k));
  if (extraTopLevel.length > 0) {
    return `Unexpected top-level properties: [${extraTopLevel.join(", ")}]. Only 'tableName', 'topicName', and 'message' are allowed.`;
  }

  if (!("tableName" in data)) {
    return `Missing required field 'tableName'.`;
  }
  if (typeof data.tableName !== "string" || data.tableName.trim() === "") {
    return `'tableName' must be a non-empty string.`;
  }

  if (!("topicName" in data)) {
    return `Missing required field 'topicName'.`;
  }
  if (typeof data.topicName !== "string" || data.topicName.trim() === "") {
    return `'topicName' must be a non-empty string.`;
  }

  if (data.tableName !== data.topicName) {
    return `'tableName' and 'topicName' must be the same, got '${data.tableName}' and '${data.topicName}'.`;
  }

  if (seenTopicNames.has(data.topicName)) {
    return `A file with topicName '${data.topicName}' has already been uploaded. Duplicate topics are not allowed.`;
  }

  if (!("message" in data)) {
    return `Missing required field 'message'.`;
  }
  if (typeof data.message !== "object" || Array.isArray(data.message) || data.message === null) {
    return `'message' must be an object.`;
  }

  const messageKeys = new Set(Object.keys(data.message));
  const extraMessageKeys = [...messageKeys].filter((k) => !ALLOWED_MESSAGE_KEYS.has(k));
  if (extraMessageKeys.length > 0) {
    return `'message' contains unexpected properties: [${extraMessageKeys.join(", ")}]. Only 'dataFormat' and 'fields' are allowed.`;
  }

  if (!("dataFormat" in data.message)) {
    return `Missing required field 'message.dataFormat'.`;
  }
  if (typeof data.message.dataFormat !== "string" || data.message.dataFormat.trim() === "") {
    return `'message.dataFormat' must be a non-empty string.`;
  }
  if (data.message.dataFormat !== "json") {
    return `'message.dataFormat' must be "json", got "${data.message.dataFormat}".`;
  }

  if (!("fields" in data.message)) {
    return `Missing required field 'message.fields'.`;
  }
  if (!Array.isArray(data.message.fields) || data.message.fields.length === 0) {
    return `'message.fields' must be a non-empty array.`;
  }

  for (let idx = 0; idx < data.message.fields.length; idx++) {
    const field = data.message.fields[idx];

    if (typeof field !== "object" || Array.isArray(field) || field === null) {
      return `'message.fields[${idx + 1}]' must be an object.`;
    }

    const fieldKeys = new Set(Object.keys(field));
    const fieldLabel = "name" in field ? `field '${field.name}'` : `field ${idx + 1}`;

    const extraFieldKeys = [...fieldKeys].filter((k) => !ALLOWED_FIELD_KEYS.has(k));
    if (extraFieldKeys.length > 0) {
      return `${fieldLabel} contains unexpected properties: [${extraFieldKeys.join(", ")}]. Allowed keys are 'name', 'type', 'mapping', 'dataFormat', and 'formatHint'.`;
    }

    const missingFieldKeys = [...REQUIRED_FIELD_KEYS].filter((k) => !fieldKeys.has(k));
    if (missingFieldKeys.length > 0) {
      return `${fieldLabel} is missing required properties: [${missingFieldKeys.join(", ")}].`;
    }

    for (const key of ["name", "type", "mapping"]) {
      if (typeof field[key] !== "string" || field[key].trim() === "") {
        return `${fieldLabel} — '${key}' must be a non-empty string.`;
      }
    }

    if (field.name !== field.mapping) {
      return `${fieldLabel} — 'name' and 'mapping' must be the same, got name='${field.name}' and mapping='${field.mapping}'.`;
    }

    if (!SUPPORTED_TYPES.has(field.type)) {
      return `${fieldLabel} — unsupported type '${field.type}'. Supported types are: ${[...SUPPORTED_TYPES].join(", ")}.`;
    }

    const isTemporal = TEMPORAL_TYPES.has(field.type);

    if (isTemporal && !("dataFormat" in field)) {
      return `${fieldLabel} — 'dataFormat' is required for temporal type '${field.type}'.`;
    }

    if (!isTemporal && "dataFormat" in field) {
      return `${fieldLabel} — 'dataFormat' is only allowed for temporal types, but '${field.type}' is not a temporal type.`;
    }

    if ("dataFormat" in field) {
      if (typeof field.dataFormat !== "string" || field.dataFormat.trim() === "") {
        return `${fieldLabel} — 'dataFormat' must be a non-empty string.`;
      }

      if (!SUPPORTED_DATA_FORMATS.has(field.dataFormat)) {
        return `${fieldLabel} — unsupported dataFormat '${field.dataFormat}'. Supported formats are: ${[...SUPPORTED_DATA_FORMATS].join(", ")}.`;
      }

      const allowedFormats = TEMPORAL_TYPE_ALLOWED_FORMATS[field.type];
      if (!allowedFormats.has(field.dataFormat)) {
        return `${fieldLabel} — dataFormat '${field.dataFormat}' is not supported for type '${field.type}'. Allowed formats: ${[...allowedFormats].join(", ")}.`;
      }
    }

    if ("formatHint" in field) {
      if (field.dataFormat !== "custom-date-time") {
        return `${fieldLabel} — 'formatHint' is only allowed when 'dataFormat' is "custom-date-time".`;
      }
      if (typeof field.formatHint !== "string" || field.formatHint.trim() === "") {
        return `${fieldLabel} — 'formatHint' must be a non-empty string.`;
      }
    }

    if (field.dataFormat === "custom-date-time" && !("formatHint" in field)) {
      return `${fieldLabel} — 'formatHint' is required when 'dataFormat' is "custom-date-time".`;
    }
  }

  return null;
};

const readFileText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsText(file);
  });

const BulkJsonUpload = ({ files, onChange, hasError, compact = false, existingTopicNames = [] }) => {
  const [search, setSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validatingCount, setValidatingCount] = useState({ current: 0, total: 0 });
  const [validationErrors, setValidationErrors] = useState([]);
  const inputRef = useRef(null);

  const addFiles = async (incoming) => {
    const jsonOnly = incoming.filter((f) => f.name.toLowerCase().endsWith(".json"));
    if (jsonOnly.length !== incoming.length) {
      toast.error("Only .json files are accepted");
    }
    if (jsonOnly.length === 0) return;

    setIsValidating(true);
    setValidationErrors([]);
    setValidatingCount({ current: 0, total: jsonOnly.length });

    const validFiles = [];
    const errors = [];

    const seenTopicNames = new Set(existingTopicNames);
    for (const existing of files) {
      try {
        const text = await readFileText(existing);
        const data = JSON.parse(text);
        if (data?.topicName) seenTopicNames.add(data.topicName);
      } catch {
      }
    }

    for (let i = 0; i < jsonOnly.length; i++) {
      const file = jsonOnly[i];
      setValidatingCount({ current: i + 1, total: jsonOnly.length });
      try {
        const text = await readFileText(file);
        const error = validateKafkaTopicJson(file.name, text, seenTopicNames);
        if (error) {
          errors.push({ filename: file.name, error });
        } else {
          const data = JSON.parse(text);
          seenTopicNames.add(data.topicName);
          validFiles.push(file);
        }
      } catch {
        errors.push({ filename: file.name, error: "Could not read file." });
      }
    }

    setIsValidating(false);
    setValidatingCount({ current: 0, total: 0 });
    setValidationErrors(errors);

    if (validFiles.length > 0) {
      const merged = [...files];
      validFiles.forEach((f) => {
        if (!merged.find((x) => x.name === f.name)) merged.push(f);
      });
      onChange(merged);
    }
  };

  const removeFile = (name) => onChange(files.filter((f) => f.name !== name));
  const clearAll = () => { onChange([]); setSearch(""); setValidationErrors([]); };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filtered = search
    ? files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : files;

  const highlightMatch = (name) => {
    if (!search) return name;
    const idx = name.toLowerCase().indexOf(search.toLowerCase());
    if (idx === -1) return name;
    return (
      <>
        {name.slice(0, idx)}
        <mark className="bg-[#e8e0f7] text-[#6b52a8] rounded-sm px-px">
          {name.slice(idx, idx + search.length)}
        </mark>
        {name.slice(idx + search.length)}
      </>
    );
  };

  return (
    <div className={compact ? "w-full" : "col-span-3 mt-2"}>
      {!compact && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Json Files <span className="text-red-500">*</span>
        </label>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!isValidating) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!isValidating) addFiles(Array.from(e.dataTransfer.files));
        }}
        onClick={() => { if (!isValidating) inputRef.current?.click(); }}
        className={`flex items-center gap-3 px-4 py-3 border rounded-lg transition-all duration-200
          ${isValidating
            ? "border-[#8e78b7] bg-[#f0eafa] border-solid cursor-not-allowed"
            : isDragging
              ? "border-[#8e78b7] bg-[#f0eafa] border-solid cursor-pointer"
              : hasError
                ? "border-red-400 border-dashed bg-red-50 cursor-pointer"
                : "border-[#c4b8e8] border-dashed bg-[#faf8fe] hover:border-[#8e78b7] hover:bg-[#f5f2fd] cursor-pointer"
          }`}
      >
        {isValidating ? (
          <>
            <Loader2 size={16} className="text-[#8e78b7] shrink-0 animate-spin" />
            <span className="text-sm text-[#8e78b7] font-medium">
              Validating {validatingCount.current} of {validatingCount.total} file{validatingCount.total !== 1 ? "s" : ""}...
            </span>
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <div className="w-24 h-1.5 bg-[#e8e0f7] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8e78b7] rounded-full transition-all duration-300"
                  style={{ width: `${(validatingCount.current / validatingCount.total) * 100}%` }}
                />
              </div>
              <span className="text-xs text-[#8e78b7] font-medium w-8 text-right">
                {Math.round((validatingCount.current / validatingCount.total) * 100)}%
              </span>
            </div>
          </>
        ) : (
          <>
            <Upload size={16} className="text-[#8e78b7] shrink-0" />
            <span className="text-sm text-gray-500">
              Drop <span className="text-[#8e78b7] font-medium">.json</span> files here or{" "}
              <span className="text-[#8e78b7] font-medium underline underline-offset-2">browse</span>
            </span>
            {files.length > 0 && (
              <span className="ml-auto shrink-0 text-sm font-medium text-[#8e78b7] rounded-md px-2.5 py-0.5">
                {files.length} file{files.length !== 1 ? "s" : ""}
              </span>
            )}
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".json"
          multiple
          className="hidden"
          onChange={(e) => { addFiles(Array.from(e.target.files)); e.target.value = ""; }}
        />
      </div>

      {hasError && !isValidating && (
        <p className="text-red-500 text-sm mt-1">At least one custom file is required</p>
      )}

      {!isValidating && validationErrors.length > 0 && (
        <div className="mt-2 border border-red-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-red-200 bg-red-50">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <span className="text-sm font-medium text-red-600">
                {validationErrors.length} file{validationErrors.length !== 1 ? "s" : ""} rejected
              </span>
            </div>
            <button
              type="button"
              onClick={() => setValidationErrors([])}
              className="text-red-400 hover:text-red-600 transition-colors"
              aria-label="Dismiss errors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[200px] divide-y divide-red-100 scrollbar-thin scrollbar-thumb-red-200 scrollbar-track-transparent">
            {validationErrors.map(({ filename, error }) => (
              <div key={filename} className="flex items-start gap-2.5 px-3 py-2.5">
                <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 bg-red-100">
                  <FileJson size={12} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-600 truncate">{filename}</p>
                  <p className="text-xs text-red-500 mt-0.5 leading-relaxed">{error}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400 min-w-0"
            />
            {search && (
              <span className="text-sm text-gray-400">{filtered.length}/{files.length}</span>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearAll(); }}
              className="text-sm text-[#8e78b7] hover:underline shrink-0"
            >
              Clear all
            </button>
          </div>
          <div className="overflow-y-auto max-h-[180px] divide-y divide-gray-100 scrollbar-thin scrollbar-thumb-[#c4b8e8] scrollbar-track-transparent">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-400">
                No files match &ldquo;{search}&rdquo;
              </div>
            ) : (
              filtered.map((f) => (
                <div
                  key={f.name}
                  className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-7 h-7 rounded flex items-center justify-center bg-[#f0eafa] shrink-0">
                    <FileJson size={14} className="text-[#8e78b7]" />
                  </div>
                  <span className="flex-1 text-sm text-gray-700 truncate min-w-0">
                    {highlightMatch(f.name)}
                  </span>
                  <span className="text-sm text-gray-400 shrink-0">{formatSize(f.size)}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                    className="shrink-0 p-1 rounded hover:bg-red-50 hover:text-red-500 text-gray-400 transition-all"
                    aria-label={`Remove ${f.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const useMonaco = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.__monaco_ready) { setReady(true); return; }

    if (document.getElementById("monaco-loader")) {
      const poll = setInterval(() => {
        if (window.__monaco_ready) { clearInterval(poll); setReady(true); }
      }, 50);
      return () => clearInterval(poll);
    }

    window.require = { paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" } };

    const script = document.createElement("script");
    script.id = "monaco-loader";
    script.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.js";
    script.onload = () => {
      window.require(["vs/editor/editor.main"], () => {
        window.__monaco_ready = true;
        setReady(true);
      });
    };
    document.head.appendChild(script);
  }, []);

  return ready;
};

const JsonEditorModal = ({ topic, connectionName, hostnameV1, token, onClose, onSave }) => {
  const editorContainerRef = useRef(null);
  const editorRef = useRef(null);
  const originalJsonRef = useRef("");
  const monacoReady = useMonaco();

  const [fetchError, setFetchError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialJson, setInitialJson] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const [isValidated, setIsValidated] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchTopicJson = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(
          `${hostnameV1}/kafka/table-description/${connectionName}/${topic.table_name}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          const formatted = JSON.stringify(data, null, 2);
          originalJsonRef.current = formatted;
          setInitialJson(formatted);
        } else {
          setFetchError("Failed to load topic configuration.");
        }
      } catch {
        if (!cancelled) setFetchError("Network error while loading topic configuration.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchTopicJson();
    return () => { cancelled = true; };
  }, [topic, connectionName, hostnameV1, token]);

  useEffect(() => {
    if (!monacoReady || !editorContainerRef.current || initialJson === null || editorRef.current) return;

    const editor = window.monaco.editor.create(editorContainerRef.current, {
      value: initialJson,
      language: "json",
      theme: "vs",
      automaticLayout: true,
      fontSize: 13,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: "off",
      lineNumbers: "on",
      renderWhitespace: "none",
      tabSize: 2,
      formatOnPaste: true,
    });

    editorRef.current = editor;

    editor.onDidChangeModelContent(() => {
      const current = editor.getValue();
      setIsDirty(current !== originalJsonRef.current);
      setIsValidated(false);
      setJsonError(null);
    });

    return () => {
      editor.dispose();
      editorRef.current = null;
    };
  }, [monacoReady, initialJson]);

  const handleValidate = () => {
    const text = editorRef.current?.getValue() ?? "";
    const filename = `${topic.table_name}.json`;

    try {
      const parsed = JSON.parse(text);
      if (parsed.tableName !== undefined && parsed.tableName !== topic.table_name) {
        setJsonError(`'tableName' cannot be changed. Expected '${topic.table_name}', got '${parsed.tableName}'.`);
        setIsValidated(false);
        return;
      }
      if (parsed.topicName !== undefined && parsed.topicName !== topic.table_name) {
        setJsonError(`'topicName' cannot be changed. Expected '${topic.table_name}', got '${parsed.topicName}'.`);
        setIsValidated(false);
        return;
      }
    } catch {
    }

    const error = validateKafkaTopicJson(filename, text);
    if (error) {
      setJsonError(error.replace(`'${filename}': `, ""));
      setIsValidated(false);
    } else {
      setJsonError(null);
      setIsValidated(true);
    }
  };

  const handleSave = () => {
    const text = editorRef.current?.getValue() ?? "";
    const blob = new Blob([text], { type: "application/json" });
    const file = new File([blob], `${topic.table_name}.json`, { type: "application/json" });
    onSave(topic.table_name, file);
    onClose();
  };

  const isEditorReady = monacoReady && !isLoading && !fetchError && initialJson !== null;
  const canValidate = isDirty && isEditorReady;
  const canSave = isValidated && isDirty && isEditorReady;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
      <div
        className="bg-white rounded-xl w-full max-w-5xl shadow-2xl flex flex-col overflow-hidden"
        style={{ height: "min(90vh, 900px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#f0eafa] flex items-center justify-center">
              <FileJson size={16} className="text-[#8e78b7]" />
            </div>
            <div>
              <p className="text-base font-medium text-gray-800">{topic.table_name}</p>
              <p className="text-sm text-gray-400">Edit topic configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Editor area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {(isLoading || !monacoReady) && !fetchError && (
            <div className="flex flex-col flex-1 items-center justify-center gap-3">
              <div className="h-8 w-8 border-2 border-[#8e78b7] border-t-transparent rounded-full animate-spin" />
              <p className="text-base text-gray-400">
                {isLoading ? "Loading configuration..." : "Initialising editor..."}
              </p>
            </div>
          )}

          {fetchError && (
            <div className="flex flex-col flex-1 items-center justify-center gap-3">
              <AlertCircle size={20} className="text-red-400" />
              <p className="text-sm text-red-500">{fetchError}</p>
            </div>
          )}

          <div
            ref={editorContainerRef}
            style={{ display: isEditorReady ? "block" : "none" }}
            className="flex-1 min-h-0"
          />
        </div>

        {/* Status + footer */}
        <div className="shrink-0 bg-white border-t border-gray-100 rounded-b-2xl shadow-[0px_-4px_9px_0px_rgba(0,0,0,0.08)]">
          <div className="px-6 pt-3 min-h-[28px]">
            {jsonError ? (
              <div className="flex items-start gap-1.5">
                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-500">{jsonError}</p>
              </div>
            ) : isValidated ? (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <p className="text-sm text-emerald-600">Valid — you can now save your changes</p>
              </div>
            ) : isDirty ? (
              <p className="text-sm text-gray-400">Validate your changes before saving</p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleValidate}
              disabled={!canValidate}
              className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium border
                ${canValidate
                  ? "border-[#8e78b7] text-[#8e78b7] hover:bg-[#f0eafa]"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"}`}
            >
              Validate
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium
                ${canSave
                  ? "bg-[#8e78b7] text-white hover:bg-[#7a6aa3]"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmModal = ({ topicName, onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <Trash2 size={18} className="text-red-500" />
        </div>
        <div>
          <p className="text-lg font-medium text-gray-800 mb-2">Remove Topic Json</p>
          <p className="text-md text-gray-500 leading-relaxed">
            Are you sure you want to remove{" "}
            <span className="font-medium text-gray-700">{topicName}</span>?
            This will be applied when you save the connection.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">
          Remove
        </button>
      </div>
    </div>
  </div>
);

const TopicRow = ({ topic, onEditJson, onUploadJson, onDelete, pendingFile, isMarkedForDelete }) => {
  const fileInputRef = useRef(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".json")) {
      toast.error("Only .json files are accepted");
      e.target.value = "";
      return;
    }

    setIsValidating(true);
    try {
      const text = await readFileText(file);
      const error = validateKafkaTopicJson(file.name, text);
      if (error) {
        toast.error(error, {
          duration: 8000,
          style: { maxWidth: "520px", wordBreak: "break-word", whiteSpace: "pre-wrap" },
        });
        e.target.value = "";
        return;
      }
      onUploadJson(topic.table_name, file);
    } catch {
      toast.error(`Failed to read '${file.name}'.`);
    } finally {
      setIsValidating(false);
      e.target.value = "";
    }
  };

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2.5 transition-colors group
        ${isMarkedForDelete
          ? "opacity-60"
          : pendingFile
            ? "bg-[#faf8fe]"
            : "hover:bg-gray-50"}`}
    >
      <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0
        ${isMarkedForDelete ? "bg-red-100" : "bg-[#f0eafa]"}`}>
        {isValidating
          ? <Loader2 size={14} className="text-[#8e78b7] animate-spin" />
          : <FileJson size={14} className={isMarkedForDelete ? "text-red-400" : "text-[#8e78b7]"} />
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isMarkedForDelete ? "line-through text-gray-400" : "text-gray-700"}`}>
          {topic.table_name}
        </p>
        {isValidating && (
          <p className="text-xs text-[#8e78b7] mt-0.5">Validating...</p>
        )}
        {!isValidating && pendingFile && !isMarkedForDelete && (
          <p className="text-xs text-[#8e78b7] truncate mt-0.5">
            {pendingFile.name === `${topic.table_name}.json`
              ? "Edited · pending save"
              : `${pendingFile.name} · pending save`}
          </p>
        )}
      </div>

      {!isMarkedForDelete ? (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEditJson(topic)}
            disabled={isValidating}
            title="Edit Json"
            className="p-1.5 text-gray-400 rounded hover:bg-[#f0eafa] hover:text-[#8e78b7] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isValidating}
            title="Upload Json"
            className="p-1.5 text-gray-400 rounded hover:bg-gray-100 hover:text-gray-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Upload size={14} />
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => onDelete(topic.table_name)}
            disabled={isValidating}
            title="Delete Json"
            className="p-1.5 text-gray-400 rounded hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => onDelete(topic.table_name)}
          className="text-sm text-[#8e78b7] hover:underline shrink-0 font-medium"
        >
          Undo
        </button>
      )}
    </div>
  );
};

const TopicListPanel = ({
  connectionName,
  hostnameV1,
  token,
  customFiles,
  onCustomFilesChange,
  removedTopics,
  onRemovedTopicsChange,
}) => {
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [editorTopic, setEditorTopic] = useState(null);
  const [deleteTopic, setDeleteTopic] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingFiles, setPendingFiles] = useState({});
  const [newFiles, setNewFiles] = useState([]);
  const [topicSearch, setTopicSearch] = useState("");
  const [showAddNew, setShowAddNew] = useState(false);

  const fetchTopics = async () => {
    if (!connectionName) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(
        `${hostnameV1}/connection/${connectionName}/tables`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setTopics(data.tables || []);
      } else {
        setLoadError("Could not load topics. Please try again.");
      }
    } catch {
      setLoadError("Network error while fetching topics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded && topics.length === 0 && !loadError) fetchTopics();
  }, [isExpanded]);

  const syncToParent = (updatedPending, updatedNew) => {
    const topicEdits = Object.values(updatedPending);
    onCustomFilesChange([...topicEdits, ...updatedNew]);
  };

  const handleSaveJson = (tableName, file) => {
    const updated = { ...pendingFiles, [tableName]: file };
    setPendingFiles(updated);
    syncToParent(updated, newFiles);
  };

  const handleUploadJson = (tableName, file) => {
    const updated = { ...pendingFiles, [tableName]: file };
    setPendingFiles(updated);
    syncToParent(updated, newFiles);
  };

  const handleNewFilesChange = (files) => {
    setNewFiles(files);
    syncToParent(pendingFiles, files);
  };

  const getTopicNameFromFile = async (file) => {
    try {
      const text = await readFileText(file);
      const data = JSON.parse(text);
      return data?.topicName ?? null;
    } catch {
      return null;
    }
  };

  const handleToggleDelete = async (tableName) => {
    const key = `${tableName}.json`;
    if (removedTopics.includes(key)) {
      const conflict = await Promise.all(
        newFiles.map((f) => getTopicNameFromFile(f))
      ).then((names) => names.some((n) => n === tableName));

      if (conflict) {
        toast.error(
          `Cannot restore '${tableName}' — a newly uploaded file already uses this topic name. Remove it from the new files list first.`,
          { duration: 8000, style: { maxWidth: "520px", wordBreak: "break-word", whiteSpace: "pre-wrap" } }
        );
        return;
      }
      onRemovedTopicsChange(removedTopics.filter((n) => n !== key));
    } else {
      setDeleteTopic(tableName);
    }
  };

  const confirmDelete = async () => {
    const name = deleteTopic;
    onRemovedTopicsChange([...removedTopics, `${name}.json`]);

    let updatedPending = pendingFiles;
    if (pendingFiles[name]) {
      updatedPending = { ...pendingFiles };
      delete updatedPending[name];
      setPendingFiles(updatedPending);
    }

    const topicNamesInNew = await Promise.all(newFiles.map((f) => getTopicNameFromFile(f)));
    const updatedNew = newFiles.filter((_, i) => topicNamesInNew[i] !== name);
    if (updatedNew.length !== newFiles.length) {
      setNewFiles(updatedNew);
      syncToParent(updatedPending, updatedNew);
    } else {
      syncToParent(updatedPending, newFiles);
    }

    setDeleteTopic(null);
  };

  const filteredTopics = topicSearch
    ? topics.filter((t) => t.table_name.toLowerCase().includes(topicSearch.toLowerCase()))
    : topics;

  const activeFiltered = filteredTopics.filter((t) => !removedTopics.includes(`${t.table_name}.json`));
  const removedFiltered = filteredTopics.filter((t) => removedTopics.includes(`${t.table_name}.json`));

  const pendingCount = Object.keys(pendingFiles).length;
  const removedCount = removedTopics.length;
  const newCount = newFiles.length;

  return (
    <>
      <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#f0eafa] flex items-center justify-center">
              <FileJson size={17} className="text-[#8e78b7]" />
            </div>
            <div>
              <p className="text-base font-medium text-gray-700">Manage Kafka Topic JSONs</p>
              <p className="text-sm text-gray-400 mt-0.5">Edit, upload, or remove topic configurations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="text-sm bg-[#f0eafa] text-[#8e78b7] px-2.5 py-1 rounded-md font-medium">
                {pendingCount} edited
              </span>
            )}
            {newCount > 0 && (
              <span className="text-sm bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md font-medium">
                {newCount} new
              </span>
            )}
            {removedCount > 0 && (
              <span className="text-sm bg-red-50 text-red-500 px-2.5 py-1 rounded-md font-medium">
                {removedCount} removed
              </span>
            )}
            <ChevronRight
              size={18}
              className={`text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
            />
          </div>
        </button>

        {isExpanded && (
          <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-4">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={fetchTopics}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-[#8e78b7] bg-white border border-gray-200 rounded-lg transition-colors"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setShowAddNew((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors
                  ${showAddNew
                    ? "bg-[#f0eafa] text-[#8e78b7] border-[#c4b8e8]"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-[#f0eafa] hover:text-[#8e78b7] hover:border-[#c4b8e8]"}`}
              >
                <Plus size={14} />
                Add Topics
              </button>
            </div>

            {showAddNew && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-md font-medium text-gray-600 mb-3">Upload new topic JSON files</p>
                <BulkJsonUpload
                  files={newFiles}
                  onChange={handleNewFilesChange}
                  hasError={false}
                  compact={true}
                  existingTopicNames={topics
                    .map((t) => t.table_name)
                    .filter((name) => !removedTopics.includes(`${name}.json`))
                  }
                />
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="h-5 w-5 border-2 border-[#8e78b7] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Fetching topics...</p>
              </div>
            )}

            {!isLoading && loadError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                <AlertCircle size={15} className="text-red-500 shrink-0" />
                <p className="text-sm text-red-600 flex-1">{loadError}</p>
                <button type="button" onClick={fetchTopics} className="text-sm text-red-500 hover:underline shrink-0">Retry</button>
              </div>
            )}

            {!isLoading && !loadError && topics.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">No topics found for this connection.</p>
              </div>
            )}

            {!isLoading && !loadError && topics.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <Search size={14} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={topicSearch}
                    onChange={(e) => setTopicSearch(e.target.value)}
                    placeholder="Search existing topics..."
                    className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400 min-w-0"
                  />
                  {topicSearch ? (
                    <>
                      <span className="text-sm text-gray-400 shrink-0">{filteredTopics.length}/{topics.length}</span>
                      <button type="button" onClick={() => setTopicSearch("")} className="text-gray-400 hover:text-gray-600 shrink-0">
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400 shrink-0">{topics.length} topic{topics.length !== 1 ? "s" : ""}</span>
                  )}
                </div>

                <div className="overflow-y-auto max-h-[280px] divide-y divide-gray-100 scrollbar-thin scrollbar-thumb-[#c4b8e8] scrollbar-track-transparent">
                  {activeFiltered.map((topic) => (
                    <TopicRow
                      key={topic.table_name}
                      topic={topic}
                      onEditJson={setEditorTopic}
                      onUploadJson={handleUploadJson}
                      onDelete={handleToggleDelete}
                      pendingFile={pendingFiles[topic.table_name] || null}
                      isMarkedForDelete={false}
                    />
                  ))}
                  {removedFiltered.map((topic) => (
                    <TopicRow
                      key={topic.table_name}
                      topic={topic}
                      onEditJson={setEditorTopic}
                      onUploadJson={handleUploadJson}
                      onDelete={handleToggleDelete}
                      pendingFile={null}
                      isMarkedForDelete={true}
                    />
                  ))}
                  {topicSearch && filteredTopics.length === 0 && (
                    <div className="py-6 text-center">
                      <p className="text-sm text-gray-400">No topics match &ldquo;{topicSearch}&rdquo;</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isLoading && topics.length > 0 && (
              <p className="text-sm text-gray-400 leading-relaxed">Changes take effect when you save the connection.</p>
            )}
          </div>
        )}
      </div>

      {editorTopic && (
        <JsonEditorModal
          topic={editorTopic}
          connectionName={connectionName}
          hostnameV1={hostnameV1}
          token={token}
          onClose={() => setEditorTopic(null)}
          onSave={handleSaveJson}
        />
      )}
      {deleteTopic && (
        <DeleteConfirmModal
          topicName={deleteTopic}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTopic(null)}
        />
      )}
    </>
  );
};

const KafkaTopicManager = ({
  isEditMode,
  connectionName,
  hostnameV1,
  token,
  customFiles,
  onCustomFilesChange,
  removedTopics,
  onRemovedTopicsChange,
  customFilesError,
}) => {
  if (isEditMode) {
    return (
      <TopicListPanel
        connectionName={connectionName}
        hostnameV1={hostnameV1}
        token={token}
        customFiles={customFiles}
        onCustomFilesChange={onCustomFilesChange}
        removedTopics={removedTopics}
        onRemovedTopicsChange={onRemovedTopicsChange}
      />
    );
  }

  return (
    <BulkJsonUpload
      files={customFiles}
      onChange={onCustomFilesChange}
      hasError={customFilesError}
    />
  );
};

export default KafkaTopicManager;