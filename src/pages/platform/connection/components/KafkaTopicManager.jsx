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
} from "lucide-react";
import toast from "react-hot-toast";

const BulkJsonUpload = ({ files, onChange, hasError, compact = false }) => {
  const [search, setSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const addFiles = (incoming) => {
    const valid = incoming.filter((f) => f.name.toLowerCase().endsWith(".json"));
    if (valid.length !== incoming.length) toast.error("Only .json files are accepted");
    const merged = [...files];
    valid.forEach((f) => {
      if (!merged.find((x) => x.name === f.name)) merged.push(f);
    });
    onChange(merged);
  };

  const removeFile = (name) => onChange(files.filter((f) => f.name !== name));
  const clearAll = () => { onChange([]); setSearch(""); };

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
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
        onClick={() => inputRef.current?.click()}
        className={`flex items-center gap-3 px-4 py-3 border rounded-lg cursor-pointer transition-all duration-200
          ${isDragging
            ? "border-[#8e78b7] bg-[#f0eafa] border-solid"
            : hasError
              ? "border-red-400 border-dashed bg-red-50"
              : "border-[#c4b8e8] border-dashed bg-[#faf8fe] hover:border-[#8e78b7] hover:bg-[#f5f2fd]"}`}
      >
        <Upload size={16} className="text-[#8e78b7] shrink-0" />
        <span className="text-sm text-gray-500">
          Drop <span className="text-[#8e78b7] font-medium">.json</span> files here or{" "}
          <span className="text-[#8e78b7] font-medium underline underline-offset-2">browse</span>
        </span>
        {files.length > 0 && (
          <span className="ml-auto shrink-0 text-sm font-medium bg-[#f0eafa] text-[#6b52a8] rounded-full px-2.5 py-0.5">
            {files.length} file{files.length !== 1 ? "s" : ""}
          </span>
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

      {hasError && (
        <p className="text-red-500 text-sm mt-1">At least one custom file is required</p>
      )}

      {files.length > 0 && (
        <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
          {/* Search + clear bar */}
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
          {/* Scrollable file rows */}
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
                    {f.name}
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

const JsonEditorModal = ({ topic, connectionName, hostnameV1, token, onClose, onSave }) => {
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [originalJson, setOriginalJson] = useState("");

  useEffect(() => {
    const fetchTopicJson = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${hostnameV1}/kafka/table-description/${connectionName}/${topic.table_name}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          const formatted = JSON.stringify(data, null, 2);
          setJsonText(formatted);
          setOriginalJson(formatted);
        } else {
          setJsonError("Failed to load topic configuration.");
        }
      } catch {
        setJsonError("Network error while loading topic configuration.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTopicJson();
  }, [topic, connectionName, hostnameV1, token]);

  const validate = (text) => {
    try { JSON.parse(text); setJsonError(null); return true; }
    catch (e) { setJsonError(e.message); return false; }
  };

  const handleChange = (e) => { setJsonText(e.target.value); validate(e.target.value); };

  const handleSave = () => {
    if (!validate(jsonText)) return;
    const blob = new Blob([jsonText], { type: "application/json" });
    const file = new File([blob], `${topic.table_name}.json`, { type: "application/json" });
    onSave(topic.table_name, file);
    onClose();
  };

  const isDirty = jsonText !== originalJson;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl w-full max-w-5xl shadow-2xl flex flex-col overflow-hidden" style={{ height: "min(90vh, 900px)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
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

        {/* Body */}
        <div className="flex flex-col flex-1 overflow-hidden p-5">
          {isLoading ? (
            <div className="flex flex-col flex-1 items-center justify-center gap-3">
              <div className="h-8 w-8 border-2 border-[#8e78b7] border-t-transparent rounded-full animate-spin" />
              <p className="text-base text-gray-400">Loading configuration...</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <textarea
                value={jsonText}
                onChange={handleChange}
                spellCheck={false}
                className={`w-full flex-1 min-h-0 font-mono text-sm p-4 rounded-lg border resize-none outline-none transition-colors
                  ${jsonError
                    ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-1 focus:ring-red-200"
                    : "border-gray-200 bg-gray-50 focus:border-[#8e78b7] focus:ring-1 focus:ring-[#e8e0f7]"}`}
              />
              {jsonError ? (
                <div className="flex items-start gap-1.5 mt-2">
                  <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-500">{jsonError}</p>
                </div>
              ) : jsonText ? (
                <div className="flex items-center gap-1.5 mt-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <p className="text-sm text-emerald-600">Valid JSON</p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-white rounded-b-2xl shadow-[0px_-4px_9px_0px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-end gap-3 px-6 py-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!!jsonError || isLoading || !jsonText || !isDirty}
              className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium
                ${!!jsonError || isLoading || !jsonText || !isDirty
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#8e78b7] text-white hover:bg-[#7a6aa3]"}`}
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
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
          <Trash2 size={18} className="text-red-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-1">Remove Topic</p>
          <p className="text-sm text-gray-500 leading-relaxed">
            Are you sure you want to remove{" "}
            <span className="font-medium text-gray-700">{topicName}</span>?
            This will be applied when you save the connection.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
        >
          Remove
        </button>
      </div>
    </div>
  </div>
);

const TopicRow = ({ topic, onEditJson, onUploadJson, onDelete, pendingFile, isMarkedForDelete }) => {
  const fileInputRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
      toast.error("Only .json files are accepted");
      e.target.value = "";
      return;
    }
    onUploadJson(topic.table_name, file);
    e.target.value = "";
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
        <FileJson size={14} className={isMarkedForDelete ? "text-red-400" : "text-[#8e78b7]"} />
      </div>

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isMarkedForDelete ? "line-through text-gray-400" : "text-gray-700"}`}>
          {topic.table_name}
        </p>
        {pendingFile && !isMarkedForDelete && (
          <p className="text-xs text-[#8e78b7] truncate mt-0.5">
            {pendingFile.name === `${topic.table_name}.json`
              ? "Edited · pending save"
              : `${pendingFile.name} · pending save`}
          </p>
        )}
      </div>

      {/* Actions */}
      {!isMarkedForDelete ? (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEditJson(topic)}
            title="Edit Json"
            className="p-1.5 text-gray-400 rounded hover:bg-[#f0eafa] hover:text-[#8e78b7] transition-all"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload Json"
            className="p-1.5 text-gray-400 rounded hover:bg-gray-100 hover:text-gray-600 transition-all"
          >
            <Upload size={14} />
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => onDelete(topic.table_name)}
            title="Delete Json"
            className="p-1.5 text-gray-400 rounded hover:bg-red-50 hover:text-red-500 transition-all"
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

  const handleToggleDelete = (tableName) => {
    const key = `${tableName}.json`;
    if (removedTopics.includes(key)) {
      onRemovedTopicsChange(removedTopics.filter((n) => n !== key));
    } else {
      setDeleteTopic(tableName);
    }
  };

  const confirmDelete = () => {
    const name = deleteTopic;
    onRemovedTopicsChange([...removedTopics, `${name}.json`]);
    if (pendingFiles[name]) {
      const updated = { ...pendingFiles };
      delete updated[name];
      setPendingFiles(updated);
      syncToParent(updated, newFiles);
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
              <p className="text-base font-medium text-gray-800">Manage Kafka Topic JSONs</p>
              <p className="text-sm text-gray-400 mt-0.5">Edit, upload, or remove topic configurations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="text-sm bg-[#f0eafa] text-[#8e78b7] px-2.5 py-0.5 rounded-full font-medium">
                {pendingCount} edited
              </span>
            )}
            {newCount > 0 && (
              <span className="text-sm bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full font-medium">
                {newCount} new
              </span>
            )}
            {removedCount > 0 && (
              <span className="text-sm bg-red-50 text-red-500 px-2.5 py-0.5 rounded-full font-medium">
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
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Upload new topic JSON files
                </p>
                <BulkJsonUpload
                  files={newFiles}
                  onChange={handleNewFilesChange}
                  hasError={false}
                  compact={true}
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
                <button type="button" onClick={fetchTopics} className="text-sm text-red-500 hover:underline shrink-0">
                  Retry
                </button>
              </div>
            )}

            {!isLoading && !loadError && topics.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">No topics found for this connection.</p>
              </div>
            )}

            {!isLoading && !loadError && topics.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                {/* Search bar */}
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
                      <span className="text-sm text-gray-400 shrink-0">
                        {filteredTopics.length}/{topics.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTopicSearch("")}
                        className="text-gray-400 hover:text-gray-600 shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400 shrink-0">
                      {topics.length} topic{topics.length !== 1 ? "s" : ""}
                    </span>
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

            {/* Footer note */}
            {!isLoading && topics.length > 0 && (
              <p className="text-sm text-gray-400 leading-relaxed">
                Changes take effect when you save the connection.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
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