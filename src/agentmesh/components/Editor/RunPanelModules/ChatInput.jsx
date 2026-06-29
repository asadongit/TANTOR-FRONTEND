import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import {
  FiBriefcase,
  FiFolder,
  FiCheckSquare,
  FiPaperclip,
  FiMicOff,
  FiArrowUp,
} from "react-icons/fi";
import { THEME_BORDER, THEME_ACCENT, THEME_TEXT } from "./constants";

export default function ChatInput({
  onSend,
  running,
  canRun,
  artifactCount = 0,
  hasBlackboardTool = false,
  nodes = [],
  setVfsTarget,
  setShowBlackboardModal,
  hasOcrNodes = false,
  audioPlaying,
  stopAudio,
}) {
  const [localInput, setLocalInput] = useState("");
  const [showToolsBubble, setShowToolsBubble] = useState(false);
  const textareaRef = useRef(null);

  // Auto-resize textarea logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120;
      textareaRef.current.style.height =
        Math.min(scrollHeight, maxHeight) + "px";
    }
  }, [localInput]);

  // Auto-refocus textarea when run finishes (disabled → enabled)
  const prevRunning = useRef(running);
  useEffect(() => {
    if (prevRunning.current && !running) {
      textareaRef.current?.focus();
    }
    prevRunning.current = running;
  }, [running]);

  const handleSend = () => {
    if (!localInput.trim() || running || !canRun) return;
    onSend(localInput);
    setLocalInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        position: "relative",
        background: "#F9FAFB",
        borderRadius: 24,
        padding: "4px 12px",
        border: `1px solid ${THEME_BORDER}`,
        display: "flex",
        alignItems: "center",
        width: "100%",
        boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
        transition: "all 0.2s ease, border-radius 0.3s ease",
      }}
      id="input-container"
    >
      {/* VFS / Session Tools */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowToolsBubble(!showToolsBubble)}
            title="Session Tools (VFS, Tasks, etc.)"
            style={{
              width: 36,
              height: 36,
              border: "none",
              background: showToolsBubble
                ? "rgba(0, 0, 0, 0.05)"
                : "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: showToolsBubble ? "#111827" : "#9CA3AF",
              transition: "all 0.2s",
              borderRadius: 10,
            }}
          >
            <FiBriefcase size={18} />
            {artifactCount > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  background: THEME_ACCENT,
                  color: "white",
                  fontSize: "9px",
                  fontWeight: 900,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 4px rgba(142, 119, 187, 0.4)",
                  border: "2px solid #F9FAFB",
                }}
              >
                {artifactCount}
              </div>
            )}
          </button>

          {showToolsBubble && (
            <>
              {/* Backdrop to close bubble */}
              <div
                style={{ position: "fixed", inset: 0, zIndex: 998 }}
                onClick={() => setShowToolsBubble(false)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShowToolsBubble(false);
                }}
                role="presentation"
              />
              {/* Popover Bubble */}
              <div
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 12px)",
                  left: -10,
                  background: "#FFFFFF",
                  borderRadius: "12px",
                  border: `1px solid ${THEME_BORDER}`,
                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
                  width: 220,
                  padding: "6px",
                  zIndex: 999,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {/* Arrow Pointer */}
                <div
                  style={{
                    position: "absolute",
                    bottom: -6,
                    left: 22,
                    width: 10,
                    height: 10,
                    background: "#FFFFFF",
                    borderRight: `1px solid ${THEME_BORDER}`,
                    borderBottom: `1px solid ${THEME_BORDER}`,
                    transform: "rotate(45deg)",
                    zIndex: 999,
                  }}
                />

                <div
                  style={{
                    padding: "6px 8px 4px",
                    fontSize: "9px",
                    fontWeight: 800,
                    color: "#9CA3AF",
                    letterSpacing: "0.05em",
                    borderBottom: `1px solid ${THEME_BORDER}`,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    position: "relative",
                    zIndex: 1000,
                  }}
                >
                  Session Tools
                </div>

                {/* VFS Option */}
                <button
                  onClick={() => {
                    const daNode = nodes.find(
                      (n) => n.data?.type === "deep_agent",
                    );
                    setVfsTarget({
                      rootDir:
                        daNode?.data?.deep_agent_root_dir ||
                        "./mnt/deep_agents",
                    });
                    setShowToolsBubble(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    border: "none",
                    background: "transparent",
                    borderRadius: 8,
                    color: THEME_TEXT,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F3F4F6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <FiFolder size={16} style={{ color: "#4F46E5" }} />
                  <span style={{ flex: 1 }}>Virtual Filesystem</span>
                  {artifactCount > 0 && (
                    <span
                      style={{
                        background: "rgba(79, 70, 229, 0.1)",
                        color: "#4F46E5",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 10,
                      }}
                    >
                      {artifactCount}
                    </span>
                  )}
                </button>

                {/* Blackboard Option */}
                {hasBlackboardTool && (
                  <button
                    onClick={() => {
                      setShowBlackboardModal(true);
                      setShowToolsBubble(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      border: "none",
                      background: "transparent",
                      borderRadius: 8,
                      color: THEME_TEXT,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#F3F4F6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <FiCheckSquare size={16} style={{ color: "#10B981" }} />
                    <span style={{ flex: 1 }}>Task Blackboard</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {hasOcrNodes && (
          <>
            <label
              htmlFor="run-panel-file-upload"
              title="Upload Document / Image"
              style={{
                width: 36,
                height: 36,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9CA3AF",
                transition: "all 0.2s",
                borderRadius: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F1F5F9";
                e.currentTarget.style.color = THEME_ACCENT;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#9CA3AF";
              }}
            >
              <FiPaperclip size={18} />
            </label>

            <div
              style={{
                width: 1,
                height: 16,
                background: "#E5E7EB",
                margin: "0 4px",
              }}
            />
          </>
        )}
      </div>

      <textarea
        ref={textareaRef}
        value={localInput}
        onChange={(e) => setLocalInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={running ? "Synthesizing..." : "Ask anything"}
        disabled={running}
        style={{
          flex: 1,
          padding: "8px 12px",
          background: "transparent",
          border: "none",
          color: THEME_TEXT,
          fontSize: 14,
          fontWeight: 500,
          outline: "none",
          fontFamily: "inherit",
          resize: "none",
          minHeight: 20,
          maxHeight: 120,
          overflowY: "auto",
          lineHeight: "20px",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginLeft: 8,
          paddingRight: 4,
        }}
      >
        {audioPlaying && (
          <motion.button
            onClick={stopAudio}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#FEE2E2",
              border: "none",
              color: "#DC2626",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiMicOff size={16} />
          </motion.button>
        )}
        <button
          onClick={handleSend}
          disabled={!localInput.trim() || running || !canRun}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background:
              localInput.trim() && !running && canRun ? "#1C1C1E" : "#E5E7EB",
            border: "none",
            color: "white",
            cursor:
              localInput.trim() && !running && canRun
                ? "pointer"
                : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FiArrowUp size={20} color="white" />
        </button>
      </div>
    </div>
  );
}

ChatInput.propTypes = {
  onSend: PropTypes.func.isRequired,
  running: PropTypes.bool.isRequired,
  canRun: PropTypes.bool.isRequired,
  artifactCount: PropTypes.number,
  hasBlackboardTool: PropTypes.bool,
  nodes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      data: PropTypes.shape({
        type: PropTypes.string,
      }),
    }),
  ),
  setVfsTarget: PropTypes.func.isRequired,
  setShowBlackboardModal: PropTypes.func.isRequired,
  hasOcrNodes: PropTypes.bool,
  audioPlaying: PropTypes.bool,
  stopAudio: PropTypes.func,
};
