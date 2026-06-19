import React, { useState, useEffect, useRef, useCallback } from "react";
import { useWorkflowStore, useUIStore } from "../../store";
import {
  FiX,
  FiPlus,
  FiTrash2,
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiSearch,
  FiBookOpen,
  FiSave,
  FiZap,
  FiLoader,
  FiTerminal,
  FiDatabase,
  FiCopy,
  FiDownload,
  FiFilter,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiCheck,
  FiInfo,
  FiTrash,
} from "react-icons/fi";
import {
  listWorkflowNotes,
  createWorkflowNote,
  deleteWorkflowNote,
  updateWorkflowNote,
  fixGrammar,
} from "../../api/agentmesh";

/**
 * REDESIGNED WORKFLOW NOTES ENGINE v2.5 (Professional Editor Edition)
 */

const NOTE_CATEGORIES = [
  "Technical",
  "Research",
  "Brainstorming",
  "Requirement",
  "Meeting",
  "Bug/Issue",
];

const getCategoryStyles = (cat) => {
  switch (cat) {
    case "Technical":
      return {
        bg: "rgba(59, 130, 246, 0.1)",
        text: "#60a5fa",
        border: "rgba(59, 130, 246, 0.3)",
      };
    case "Research":
      return {
        bg: "rgba(139, 92, 246, 0.1)",
        text: "#a78bfa",
        border: "rgba(139, 92, 246, 0.3)",
      };
    case "Brainstorming":
      return {
        bg: "rgba(245, 158, 11, 0.1)",
        text: "#fbbf24",
        border: "rgba(245, 158, 11, 0.3)",
      };
    case "Requirement":
      return {
        bg: "rgba(16, 185, 129, 0.1)",
        text: "#34d399",
        border: "rgba(16, 185, 129, 0.3)",
      };
    case "Meeting":
      return {
        bg: "rgba(6, 182, 212, 0.1)",
        text: "#22d3ee",
        border: "rgba(6, 182, 212, 0.3)",
      };
    case "Bug/Issue":
      return {
        bg: "rgba(239, 68, 68, 0.1)",
        text: "#f87171",
        border: "rgba(239, 68, 68, 0.3)",
      };
    default:
      return {
        bg: "rgba(156, 163, 175, 0.1)",
        text: "#9ca3af",
        border: "rgba(156, 163, 175, 0.3)",
      };
  }
};

export default function WorkflowNotesModal() {
  const { workflowId, workflowName } = useWorkflowStore();
  const { showNotes, toggleNotes } = useUIStore();

  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, alphabetical
  const [saveStatus, setSaveStatus] = useState("idle"); // idle, typing, saving, saved
  const [isGrammarFixing, setIsGrammarFixing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ words: 0, chars: 0, readTime: 0 });
  const [copied, setCopied] = useState(false);

  const editorRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const lastSavedContentRef = useRef("");

  // 1. Initial Load
  useEffect(() => {
    if (showNotes && workflowId) {
      loadNotes();
    }
  }, [showNotes, workflowId]);

  const loadNotes = async (selectId = null) => {
    try {
      setLoading(true);
      const data = await listWorkflowNotes(workflowId);
      const sorted = (data || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      setNotes(sorted);

      if (selectId) {
        const found = sorted.find((n) => n.id === selectId);
        if (found) selectNote(found);
      } else if (selectedNote) {
        const current = sorted.find((n) => n.id === selectedNote.id);
        if (current) {
          setSelectedNote((prev) => ({ ...current, content: prev.content }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Controlled Note Selection
  const selectNote = (note) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setSelectedNote(note);
    lastSavedContentRef.current = note?.content || "";
    setSaveStatus("idle");
    updateStats(note?.content || "");
  };

  // 3. Robust Save
  const saveNote = async (id, content, category) => {
    if (
      !id ||
      (content === lastSavedContentRef.current &&
        category === selectedNote?.category)
    )
      return;

    try {
      setSaveStatus("saving");
      await updateWorkflowNote(workflowId, id, content, category);

      lastSavedContentRef.current = content;
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, content, category } : n)),
      );

      setSaveStatus("saved");
      setTimeout(
        () => setSaveStatus((prev) => (prev === "saved" ? "idle" : prev)),
        2000,
      );
    } catch (e) {
      console.error("Save failed:", e);
      setSaveStatus("idle");
    }
  };

  const updateStats = (html) => {
    if (!html) {
      setStats({ words: 0, chars: 0, readTime: 0 });
      return;
    }
    const cleanText = html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const chars = cleanText.length;
    const words = cleanText ? cleanText.split(/\s+/).length : 0;
    const readTime = Math.max(1, Math.ceil(words / 200));
    setStats({ words, chars, readTime });
  };

  const onInput = () => {
    setSaveStatus("typing");
    const newContent = editorRef.current ? editorRef.current.innerHTML : "";
    updateStats(newContent);

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      if (selectedNote) {
        saveNote(selectedNote.id, newContent, selectedNote.category);
      }
    }, 1500);
  };

  const handleCreate = async () => {
    try {
      setSaveStatus("saving");
      const res = await createWorkflowNote(
        workflowId,
        "<h1>New Note</h1><p>Start writing here...</p>",
        "Technical",
      );
      await loadNotes(res.id);
    } catch (e) {
      alert("Action failed");
    }
  };

  const handleFixGrammar = async () => {
    if (!selectedNote || !editorRef.current) return;
    const raw = editorRef.current.innerText;
    try {
      setIsGrammarFixing(true);
      const res = await fixGrammar(raw);
      if (res.status === "success") {
        const paragraphs = res.fixed.split("\n").filter((p) => p.trim());
        const fixedHtml = paragraphs
          .map((p) => {
            if (p.startsWith("# ")) return `<h1>${p.substring(2)}</h1>`;
            if (p.startsWith("## ")) return `<h2>${p.substring(3)}</h2>`;
            return `<p>${p}</p>`;
          })
          .join("");
        editorRef.current.innerHTML = fixedHtml;
        saveNote(selectedNote.id, fixedHtml, selectedNote.category);
        updateStats(fixedHtml);
      }
    } finally {
      setIsGrammarFixing(false);
    }
  };

  const handleDelete = async () => {
    if (
      !selectedNote ||
      !window.confirm("Are you sure you want to permanently delete this note?")
    )
      return;
    await deleteWorkflowNote(workflowId, selectedNote.id);
    setSelectedNote(null);
    loadNotes();
  };

  const handleCopy = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!selectedNote || !editorRef.current) return;
    const text = editorRef.current.innerText;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const title =
      text
        .split("\n")[0]
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .substring(0, 30)
        .trim() || "note";
    link.download = `${title.toLowerCase().replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exec = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    onInput();
  };

  if (!showNotes) return null;

  // Search & Filtering & Sorting
  const filtered = notes
    .filter((n) => {
      const matchSearch = n.content
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchCategory =
        filterCategory === "All" || n.category === filterCategory;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "oldest")
        return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "alphabetical") {
        const titleA = a.content
          .replace(/<[^>]*>/g, " ")
          .substring(0, 30)
          .trim()
          .toLowerCase();
        const titleB = b.content
          .replace(/<[^>]*>/g, " ")
          .substring(0, 30)
          .trim()
          .toLowerCase();
        return titleA.localeCompare(titleB);
      }
      return 0;
    });

  const renderNotesList = () => {
    if (loading && notes.length === 0) {
      return (
        <div className="sidebar-status-msg">
          <FiLoader className="spin" size={24} />
          <span>Loading notes...</span>
        </div>
      );
    }
    if (filtered.length === 0) {
      return (
        <div className="sidebar-status-msg">
          <FiDatabase size={24} style={{ opacity: 0.5 }} />
          <span>No notes found</span>
        </div>
      );
    }
    return filtered.map((n) => {
      const active = selectedNote?.id === n.id;
      const cleanContent = n.content.replace(/<[^>]*>/g, " ").trim();
      const title = cleanContent.substring(0, 30) || "Untitled Note";
      const snippet =
        cleanContent.substring(title.length, title.length + 60) ||
        "No additional content...";
      const catStyle = getCategoryStyles(n.category);

      return (
        <div
          key={n.id}
          onClick={() => selectNote(n)}
          className={`note-item ${active ? "active" : ""}`}
        >
          <div className="note-item-meta">
            <span className="note-item-date">
              {new Date(n.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
            <span
              className="note-item-badge"
              style={{
                background: catStyle.bg,
                color: catStyle.text,
                borderColor: catStyle.border,
              }}
            >
              {n.category}
            </span>
          </div>
          <div className="note-item-title">{title}</div>
          <div className="note-item-snippet">{snippet}</div>
        </div>
      );
    });
  };

  return (
    <div className="notes-overlay" onClick={toggleNotes}>
      <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
        {/* Sidebar */}
        <div className="notes-sidebar">
          {/* Header */}
          <div className="sidebar-header">
            <div className="sidebar-title-container">
              <FiBookOpen className="sidebar-logo" size={20} />
              <h2 className="sidebar-title">Workflow Journal</h2>
            </div>
            <button
              className="add-note-btn"
              onClick={handleCreate}
              title="Create Note"
            >
              <FiPlus size={18} />
              <span>New Note</span>
            </button>
          </div>

          {/* Search, Filter & Sort */}
          <div className="sidebar-filters">
            <div className="search-wrapper">
              <FiSearch className="search-icon" size={14} />
              <input
                placeholder="Search notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              {search && (
                <FiX
                  className="clear-search"
                  size={12}
                  onClick={() => setSearch("")}
                />
              )}
            </div>

            <div className="filter-sort-row">
              <div className="filter-select-wrapper">
                <FiFilter size={12} className="select-icon" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="sidebar-select"
                >
                  <option value="All">All Categories</option>
                  {NOTE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sidebar-select sort-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alphabetical">A-Z Title</option>
              </select>
            </div>
          </div>

          {/* Notes list */}
          <div className="notes-list custom-scrollbar">{renderNotesList()}</div>
        </div>

        {/* Main Editor Area */}
        <div className="notes-editor-container">
          {/* Main Toolbar */}
          <div className="editor-toolbar">
            <div className="toolbar-left">
              {selectedNote && (
                <div className="formatting-group">
                  <button
                    className="toolbar-btn"
                    onClick={() => exec("bold")}
                    title="Bold"
                  >
                    <FiBold size={14} />
                  </button>
                  <button
                    className="toolbar-btn"
                    onClick={() => exec("italic")}
                    title="Italic"
                  >
                    <FiItalic size={14} />
                  </button>
                  <button
                    className="toolbar-btn"
                    onClick={() => exec("underline")}
                    title="Underline"
                  >
                    <FiUnderline size={14} />
                  </button>
                  <div className="toolbar-divider" />
                  <button
                    className="toolbar-btn"
                    onClick={() => exec("formatBlock", "<h1>")}
                    title="Heading 1"
                  >
                    H1
                  </button>
                  <button
                    className="toolbar-btn"
                    onClick={() => exec("formatBlock", "<h2>")}
                    title="Heading 2"
                  >
                    H2
                  </button>
                  <button
                    className="toolbar-btn"
                    onClick={() => exec("formatBlock", "<blockquote>")}
                    title="Blockquote"
                    style={{ fontFamily: "Georgia, serif", fontWeight: "bold" }}
                  >
                    “
                  </button>
                  <div className="toolbar-divider" />
                  <button
                    className="toolbar-btn"
                    onClick={() => exec("insertUnorderedList")}
                    title="Bullet List"
                  >
                    <FiList size={14} />
                  </button>
                  <button
                    className="toolbar-btn"
                    onClick={() => exec("justifyLeft")}
                    title="Align Left"
                  >
                    <FiAlignLeft size={14} />
                  </button>
                  <button
                    className="toolbar-btn"
                    onClick={() => exec("justifyCenter")}
                    title="Align Center"
                  >
                    <FiAlignCenter size={14} />
                  </button>
                  <button
                    className="toolbar-btn"
                    onClick={() => exec("justifyRight")}
                    title="Align Right"
                  >
                    <FiAlignRight size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="toolbar-right">
              {selectedNote && (
                <>
                  <div className="sync-status">
                    {saveStatus === "saving" && (
                      <span className="status-saving">
                        <FiLoader className="spin" size={12} /> Syncing...
                      </span>
                    )}
                    {saveStatus === "saved" && (
                      <span className="status-saved">
                        <FiCheck size={12} /> Autosaved
                      </span>
                    )}
                    {saveStatus === "typing" && (
                      <span className="status-typing">Typing...</span>
                    )}
                  </div>

                  <select
                    value={selectedNote.category}
                    onChange={(e) => {
                      setSelectedNote((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }));
                      saveNote(
                        selectedNote.id,
                        editorRef.current.innerHTML,
                        e.target.value,
                      );
                    }}
                    className="category-selector-dropdown"
                  >
                    {NOTE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <button
                    className="action-btn wizard-btn"
                    onClick={handleFixGrammar}
                    disabled={isGrammarFixing}
                    title="Fix grammar with Wizard AI"
                  >
                    {isGrammarFixing ? (
                      <FiLoader className="spin" size={13} />
                    ) : (
                      <FiZap size={13} />
                    )}
                    <span>Wizard</span>
                  </button>

                  <div className="toolbar-divider" />

                  <button
                    className="toolbar-btn action"
                    onClick={handleCopy}
                    title={copied ? "Copied!" : "Copy plaintext"}
                  >
                    {copied ? (
                      <FiCheck size={14} style={{ color: "#34d399" }} />
                    ) : (
                      <FiCopy size={14} />
                    )}
                  </button>

                  <button
                    className="toolbar-btn action"
                    onClick={handleDownload}
                    title="Download note as text"
                  >
                    <FiDownload size={14} />
                  </button>

                  <button
                    className="toolbar-btn action delete-btn"
                    onClick={handleDelete}
                    title="Delete note permanently"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </>
              )}
              <div className="toolbar-divider" />
              <button
                className="toolbar-btn close-modal-btn"
                onClick={toggleNotes}
                title="Close Journal"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          {/* Main Editing Canvas */}
          {selectedNote ? (
            <div className="editor-body custom-scrollbar">
              <div className="editor-meta-bar">
                <div className="meta-item">
                  <FiTerminal size={12} />
                  <span>
                    Workflow Context: <strong>{workflowName}</strong>
                  </span>
                </div>
                <div className="meta-item">
                  <FiInfo size={12} />
                  <span>
                    Created:{" "}
                    {new Date(selectedNote.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div
                key={selectedNote.id}
                ref={(el) => {
                  if (el) {
                    if (el.innerHTML === "" && selectedNote.content) {
                      el.innerHTML = selectedNote.content;
                    }
                    editorRef.current = el;
                  }
                }}
                contentEditable
                suppressContentEditableWarning
                onInput={onInput}
                className="editor-canvas"
                placeholder="Start writing your thoughts..."
              />
            </div>
          ) : (
            <div className="editor-empty-state">
              <FiDatabase size={48} className="empty-icon" />
              <h3>No Note Selected</h3>
              <p>
                Select an existing note from the ledger or create a new one to
                begin writing.
              </p>
              <button className="add-note-btn centered" onClick={handleCreate}>
                <FiPlus size={16} />
                <span>Create a Note</span>
              </button>
            </div>
          )}

          {/* Bottom Stats Footer */}
          {selectedNote && (
            <div className="editor-footer">
              <div className="stat-pill">{stats.words} words</div>
              <div className="stat-pill">{stats.chars} characters</div>
              <div className="stat-pill">{stats.readTime} min read</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* Scoped styles adapting to AgentMesh theme color variables */
        .notes-overlay {
          position: fixed; 
          inset: 0; 
          z-index: 10000;
          display: flex; 
          align-items: center; 
          justify-content: center;
          background: rgba(15, 23, 42, 0.45); 
          backdrop-filter: blur(10px);
          animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .notes-modal {
          width: 90%; 
          maxWidth: 1200px; 
          height: 85vh;
          background: var(--bg-secondary); 
          border-radius: 24px; 
          display: flex; 
          overflow: hidden;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: var(--text-primary);
        }

        /* Sidebar Styling */
        .notes-sidebar {
          width: 340px; 
          background: var(--bg-primary); 
          border-right: 1px solid var(--border);
          display: flex; 
          flex-direction: column;
        }

        .sidebar-header {
          padding: 24px 20px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .sidebar-title-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sidebar-logo {
          color: var(--theme-primary);
        }

        .sidebar-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .add-note-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          border: none;
          background: var(--accent-btn);
          color: var(--accent-btn-text);
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .add-note-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .add-note-btn.centered {
          margin-top: 16px;
        }

        .sidebar-filters {
          padding: 0 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          border-bottom: 1px solid var(--border-light);
        }

        .search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .clear-search {
          position: absolute;
          right: 12px;
          color: var(--text-muted);
          cursor: pointer;
        }

        .search-input {
          width: 100%;
          padding: 8px 32px 8px 34px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--bg-canvas);
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          border-color: var(--theme-primary);
        }

        .filter-sort-row {
          display: flex;
          gap: 8px;
        }

        .filter-select-wrapper {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }

        .select-icon {
          position: absolute;
          left: 8px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .sidebar-select {
          width: 100%;
          padding: 6px 8px 6px 26px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--bg-canvas);
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 500;
          outline: none;
          cursor: pointer;
        }

        .sidebar-select.sort-select {
          padding-left: 8px;
          flex: 0 0 110px;
        }

        /* Note Items List */
        .notes-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sidebar-status-msg {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 40px 20px;
          color: var(--text-muted);
          font-size: 13px;
        }

        .note-item {
          padding: 14px 16px;
          border-radius: 12px;
          cursor: pointer;
          background: transparent;
          border: 1px solid transparent;
          transition: all 0.2s ease;
        }

        .note-item:hover {
          background: var(--bg-hover);
        }

        .note-item.active {
          background: var(--bg-secondary);
          border-color: var(--theme-primary);
          box-shadow: 0 4px 12px var(--theme-primary-glow);
        }

        .note-item-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .note-item-date {
          font-size: 11px;
          color: var(--text-muted);
        }

        .note-item-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid transparent;
        }

        .note-item-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .note-item-snippet {
          font-size: 11px;
          color: var(--text-secondary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
        }

        /* Editor Area */
        .notes-editor-container {
          flex: 1; 
          display: flex; 
          flex-direction: column; 
          background: var(--bg-secondary);
        }

        .editor-toolbar {
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-primary);
        }

        .toolbar-left, .toolbar-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .formatting-group {
          display: flex;
          align-items: center;
          background: var(--bg-canvas);
          padding: 3px;
          border-radius: 8px;
          border: 1px solid var(--border);
        }

        .toolbar-btn {
          border: none;
          background: transparent;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 600;
          transition: all 0.15s ease;
        }

        .toolbar-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .toolbar-btn.action {
          color: var(--text-muted);
        }

        .toolbar-btn.action:hover {
          color: var(--text-primary);
        }

        .toolbar-btn.action.delete-btn:hover {
          color: var(--red);
          background: rgba(239, 68, 68, 0.1);
        }

        .toolbar-btn.close-modal-btn {
          width: 32px;
          height: 32px;
          color: var(--text-muted);
        }

        .toolbar-btn.close-modal-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          color: var(--red);
        }

        .toolbar-divider {
          width: 1px;
          height: 16px;
          background: var(--border);
          margin: 0 4px;
        }

        .sync-status {
          font-size: 11px;
          font-weight: 500;
          margin-right: 8px;
        }

        .status-saving {
          color: var(--theme-primary);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .status-saved {
          color: var(--green);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .status-typing {
          color: var(--text-muted);
        }

        .category-selector-dropdown {
          background: var(--bg-canvas);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .wizard-btn {
          background: var(--theme-primary-glow);
          color: var(--theme-primary);
          border: 1px solid var(--theme-primary);
        }

        .wizard-btn:hover:not(:disabled) {
          background: var(--theme-primary);
          color: var(--theme-primary-text);
          box-shadow: 0 0 10px var(--theme-primary-glow-heavy);
        }

        .wizard-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Editing body */
        .editor-body {
          flex: 1;
          overflow-y: auto;
          padding: 30px 50px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: var(--bg-canvas);
        }

        .editor-meta-bar {
          display: flex;
          gap: 16px;
          font-size: 11px;
          color: var(--text-secondary);
          background: var(--bg-secondary);
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid var(--border);
          align-self: flex-start;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .editor-canvas {
          flex: 1;
          min-height: 300px;
          font-size: 15px;
          line-height: 1.7;
          color: var(--text-primary);
          outline: none;
          white-space: pre-wrap;
        }

        .editor-canvas h1 {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
          margin-top: 0;
          margin-bottom: 12px;
        }

        .editor-canvas h2 {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin-top: 16px;
          margin-bottom: 8px;
        }

        .editor-canvas blockquote {
          border-left: 4px solid var(--theme-primary);
          background: var(--theme-primary-glow);
          padding: 10px 16px;
          margin: 12px 0;
          border-radius: 0 8px 8px 0;
          font-style: italic;
          color: var(--text-secondary);
        }

        .editor-canvas[placeholder]:empty:before {
          content: attr(placeholder);
          color: var(--text-muted);
          cursor: text;
        }

        /* Footer styling */
        .editor-footer {
          padding: 10px 20px;
          border-top: 1px solid var(--border);
          display: flex;
          gap: 12px;
          background: var(--bg-primary);
        }

        .stat-pill {
          font-size: 11px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        /* Empty state */
        .editor-empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: var(--text-muted);
          text-align: center;
        }

        .empty-icon {
          opacity: 0.2;
          color: var(--theme-primary);
          margin-bottom: 16px;
        }

        .editor-empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 8px;
        }

        .editor-empty-state p {
          font-size: 13px;
          max-width: 300px;
          margin: 0 0 16px;
          line-height: 1.5;
        }

        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }

        @keyframes fadeIn { 
          from { opacity: 0; transform: scale(0.98); } 
          to { opacity: 1; transform: scale(1); } 
        }
        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
        .spin { 
          animation: spin 1s linear infinite; 
        }
      `}</style>
    </div>
  );
}
