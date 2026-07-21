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
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={toggleNotes}
    >
      <div
        className="notes-modal-wrapper"
        style={{
          width: "96vw",
          maxWidth: 1280,
          height: "90vh",
          background: "var(--bg-canvas, #F8FAFC)",
          borderRadius: 16,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Header Bar (Matching Flowchart Studio Header) ────────────────── */}
        <div
          style={{
            height: 56,
            background: "var(--bg-panel, #FFFFFF)",
            borderBottom: "1px solid var(--border, #E2E8F0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 18px",
            userSelect: "none",
          }}
        >
          {/* Left Title & Workflow Pill Tag */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FiBookOpen size={18} style={{ color: "var(--theme-primary, #2563EB)" }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary, #0F172A)" }}>
                Workflow Notes
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                background: "var(--theme-primary-glow, #EFF6FF)",
                color: "var(--theme-primary, #2563EB)",
                padding: "2px 10px",
                borderRadius: 12,
                fontWeight: 600,
                border: "1px solid rgba(37, 99, 235, 0.15)",
              }}
            >
              {workflowName || "Untitled Workflow"}
            </span>

            {notes.length > 0 && (
              <span
                style={{
                  fontSize: 11,
                  background: "#F1F5F9",
                  color: "#475569",
                  padding: "2px 8px",
                  borderRadius: 12,
                  fontWeight: 600,
                }}
              >
                {notes.length} {notes.length === 1 ? "Note" : "Notes"}
              </span>
            )}
          </div>

          {/* Right Action & Close Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={handleCreate}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 8,
                background: "var(--theme-primary, #2563EB)",
                color: "#FFFFFF",
                border: "none",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                transition: "all 0.15s ease",
              }}
            >
              <FiPlus size={16} />
              <span>New Note</span>
            </button>

            <div style={{ width: 1, height: 20, background: "var(--border, #E2E8F0)", margin: "0 4px" }} />

            <button
              onClick={toggleNotes}
              title="Close Notes"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#FEE2E2";
                e.currentTarget.style.color = "#EF4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#64748B";
              }}
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* ── Main Modal Content Grid (Sidebar + Editor Panel) ────────────────── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Sidebar Panel */}
          <div
            style={{
              width: 320,
              background: "var(--bg-panel, #FFFFFF)",
              borderRight: "1px solid var(--border, #E2E8F0)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Search & Filters Header */}
            <div
              style={{
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                borderBottom: "1px solid var(--border, #E2E8F0)",
                background: "#F8FAFC",
              }}
            >
              <div className="search-wrapper" style={{ position: "relative" }}>
                <FiSearch
                  size={14}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94A3B8",
                  }}
                />
                <input
                  placeholder="Search notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 30px 8px 34px",
                    borderRadius: 8,
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    fontSize: 12,
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {search && (
                  <FiX
                    size={12}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94A3B8",
                      cursor: "pointer",
                    }}
                    onClick={() => setSearch("")}
                  />
                )}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    color: "#334155",
                    fontSize: 11,
                    fontWeight: 600,
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="All">All Categories</option>
                  {NOTE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    width: 110,
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    color: "#334155",
                    fontSize: 11,
                    fontWeight: 600,
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="alphabetical">A-Z Title</option>
                </select>
              </div>
            </div>

            {/* Note Cards List */}
            <div className="notes-list custom-scrollbar" style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {renderNotesList()}
            </div>
          </div>

          {/* Main Workspace Editor */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              background: "var(--bg-canvas, #F8FAFC)",
            }}
          >
            {/* Editor Top Control Bar */}
            <div
              style={{
                height: 48,
                background: "var(--bg-panel, #FFFFFF)",
                borderBottom: "1px solid var(--border, #E2E8F0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {selectedNote && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      background: "#F1F5F9",
                      padding: 3,
                      borderRadius: 8,
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <button className="toolbar-btn" onClick={() => exec("bold")} title="Bold">
                      <FiBold size={13} />
                    </button>
                    <button className="toolbar-btn" onClick={() => exec("italic")} title="Italic">
                      <FiItalic size={13} />
                    </button>
                    <button className="toolbar-btn" onClick={() => exec("underline")} title="Underline">
                      <FiUnderline size={13} />
                    </button>
                    <div style={{ width: 1, height: 14, background: "#CBD5E1", margin: "0 2px" }} />
                    <button className="toolbar-btn" onClick={() => exec("formatBlock", "<h1>")} title="Heading 1" style={{ fontWeight: 700, fontSize: 11 }}>
                      H1
                    </button>
                    <button className="toolbar-btn" onClick={() => exec("formatBlock", "<h2>")} title="Heading 2" style={{ fontWeight: 700, fontSize: 11 }}>
                      H2
                    </button>
                    <button className="toolbar-btn" onClick={() => exec("formatBlock", "<blockquote>")} title="Blockquote" style={{ fontFamily: "Georgia, serif", fontWeight: 700 }}>
                      “
                    </button>
                    <div style={{ width: 1, height: 14, background: "#CBD5E1", margin: "0 2px" }} />
                    <button className="toolbar-btn" onClick={() => exec("insertUnorderedList")} title="Bullet List">
                      <FiList size={13} />
                    </button>
                    <button className="toolbar-btn" onClick={() => exec("justifyLeft")} title="Align Left">
                      <FiAlignLeft size={13} />
                    </button>
                    <button className="toolbar-btn" onClick={() => exec("justifyCenter")} title="Align Center">
                      <FiAlignCenter size={13} />
                    </button>
                    <button className="toolbar-btn" onClick={() => exec("justifyRight")} title="Align Right">
                      <FiAlignRight size={13} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {selectedNote && (
                  <>
                    <div className="sync-status" style={{ fontSize: 11, fontWeight: 600 }}>
                      {saveStatus === "saving" && (
                        <span style={{ color: "#2563EB", display: "flex", alignItems: "center", gap: 4 }}>
                          <FiLoader className="spin" size={12} /> Syncing...
                        </span>
                      )}
                      {saveStatus === "saved" && (
                        <span style={{ color: "#10B981", display: "flex", alignItems: "center", gap: 4 }}>
                          <FiCheck size={12} /> Saved
                        </span>
                      )}
                      {saveStatus === "typing" && <span style={{ color: "#94A3B8" }}>Typing...</span>}
                    </div>

                    <select
                      value={selectedNote.category}
                      onChange={(e) => {
                        setSelectedNote((prev) => ({ ...prev, category: e.target.value }));
                        saveNote(selectedNote.id, editorRef.current.innerHTML, e.target.value);
                      }}
                      style={{
                        background: "#F8FAFC",
                        border: "1px solid #CBD5E1",
                        color: "#0F172A",
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      {NOTE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleFixGrammar}
                      disabled={isGrammarFixing}
                      title="Enhance & Fix Grammar with AI"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 12px",
                        borderRadius: 6,
                        background: "linear-gradient(135deg, #2563EB, #7C3AED)",
                        color: "#FFFFFF",
                        border: "none",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: isGrammarFixing ? "not-allowed" : "pointer",
                        opacity: isGrammarFixing ? 0.7 : 1,
                      }}
                    >
                      {isGrammarFixing ? <FiLoader className="spin" size={12} /> : <FiZap size={12} />}
                      <span>Wizard AI</span>
                    </button>

                    <div style={{ width: 1, height: 16, background: "#E2E8F0" }} />

                    <button className="icon-action-btn" onClick={handleCopy} title={copied ? "Copied!" : "Copy plaintext"}>
                      {copied ? <FiCheck size={14} style={{ color: "#10B981" }} /> : <FiCopy size={14} />}
                    </button>

                    <button className="icon-action-btn" onClick={handleDownload} title="Download note as text">
                      <FiDownload size={14} />
                    </button>

                    <button className="icon-action-btn delete-btn" onClick={handleDelete} title="Delete note">
                      <FiTrash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Document Canvas Body */}
            {selectedNote ? (
              <div className="editor-body custom-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "28px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#64748B", background: "#FFFFFF", padding: "8px 14px", borderRadius: 8, border: "1px solid #E2E8F0", alignSelf: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <FiTerminal size={12} style={{ color: "#2563EB" }} />
                    <span>
                      Context: <strong>{workflowName}</strong>
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <FiInfo size={12} />
                    <span>Created: {new Date(selectedNote.created_at).toLocaleString()}</span>
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
                  placeholder="Start typing your workflow note here..."
                  style={{
                    flex: 1,
                    minHeight: 320,
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: "#0F172A",
                    outline: "none",
                    whiteSpace: "pre-wrap",
                    background: "#FFFFFF",
                    padding: 24,
                    borderRadius: 12,
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 40,
                  color: "#64748B",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "#EFF6FF",
                    color: "#2563EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <FiBookOpen size={28} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>No Note Selected</h3>
                <p style={{ fontSize: 13, color: "#64748B", maxWidth: 320, margin: "0 0 18px", lineHeight: 1.5 }}>
                  Select a note from the sidebar or create a new note to start documenting your workflow architecture.
                </p>
                <button
                  onClick={handleCreate}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 8,
                    background: "var(--theme-primary, #2563EB)",
                    color: "#FFFFFF",
                    border: "none",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  <FiPlus size={16} />
                  <span>Create First Note</span>
                </button>
              </div>
            )}

            {/* Bottom Word Count / Stat Footer */}
            {selectedNote && (
              <div
                style={{
                  height: 32,
                  padding: "0 18px",
                  borderTop: "1px solid var(--border, #E2E8F0)",
                  background: "var(--bg-panel, #FFFFFF)",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>{stats.words} words</span>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>{stats.chars} characters</span>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>{stats.readTime} min read</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .note-item {
          padding: 12px;
          border-radius: 10px;
          cursor: pointer;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          transition: all 0.15s ease;
        }
        .note-item:hover {
          border-color: #CBD5E1;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }
        .note-item.active {
          background: #EFF6FF;
          border-color: #3B82F6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
        }
        .note-item-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .note-item-date {
          font-size: 10px;
          color: #94A3B8;
          font-weight: 500;
        }
        .note-item-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 4px;
        }
        .note-item-title {
          font-size: 13px;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .note-item-snippet {
          font-size: 11px;
          color: #64748B;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
        }
        .toolbar-btn {
          border: none;
          background: transparent;
          width: 26px;
          height: 26px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #475569;
          transition: all 0.15s ease;
        }
        .toolbar-btn:hover {
          background: #E2E8F0;
          color: #0F172A;
        }
        .icon-action-btn {
          border: 1px solid #CBD5E1;
          background: #FFFFFF;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          transition: all 0.15s ease;
        }
        .icon-action-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
        }
        .icon-action-btn.delete-btn:hover {
          background: #FEE2E2;
          color: #EF4444;
          border-color: #FCA5A5;
        }
        .sidebar-status-msg {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 40px 20px;
          color: #94A3B8;
          font-size: 13px;
        }
        .editor-canvas h1 {
          font-size: 22px;
          font-weight: 800;
          color: #0F172A;
          margin-top: 0;
          margin-bottom: 12px;
        }
        .editor-canvas h2 {
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin-top: 16px;
          margin-bottom: 8px;
        }
        .editor-canvas blockquote {
          border-left: 4px solid #2563EB;
          background: #EFF6FF;
          padding: 10px 16px;
          margin: 12px 0;
          border-radius: 0 8px 8px 0;
          font-style: italic;
          color: #1E3A8A;
        }
        .editor-canvas[placeholder]:empty:before {
          content: attr(placeholder);
          color: #94A3B8;
          cursor: text;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
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
