import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheckSquare, FiRefreshCw, FiX, FiList } from "react-icons/fi";

export default function BlackboardModal({ isOpen, onClose, threadId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTasks = async () => {
    if (!threadId) return;
    setLoading(true);
    setError(null);
    try {
      const { getBlackboardTasks } = await import("../../../../api/agentmesh");
      const res = await getBlackboardTasks(threadId);
      if (res.status === "success") {
        setTasks(res.blackboard?.tasks || []);
      } else {
        setError("Failed to fetch blackboard tasks");
      }
    } catch (err) {
      setError(err.message || "Failed to load blackboard tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && threadId) {
      fetchTasks();
    }
  }, [isOpen, threadId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            style={{
              background: "#FFFFFF",
              width: "100%",
              maxWidth: "650px",
              maxHeight: "80vh",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #E5E7EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#F9FAFB",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FiCheckSquare size={18} color="#10B981" />
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 16,
                    color: "#111827",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Task Blackboard
                </span>
                <span
                  style={{
                    fontSize: 11,
                    background: "#E5E7EB",
                    color: "#4B5563",
                    padding: "2px 8px",
                    borderRadius: 12,
                    fontWeight: 600,
                  }}
                >
                  {threadId || "No Session"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={fetchTasks}
                  disabled={loading || !threadId}
                  style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: "#4B5563",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 6,
                    borderRadius: 6,
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#E5E7EB")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "none")
                  }
                  title="Refresh blackboard tasks"
                >
                  <FiRefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />
                </button>
                <button
                  onClick={onClose}
                  style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: "#9CA3AF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 4,
                    borderRadius: 6,
                  }}
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div
              style={{ flex: 1, overflowY: "auto", padding: "24px" }}
              className="custom-scrollbar"
            >
              {!threadId ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#9CA3AF",
                  }}
                >
                  <FiCheckSquare
                    size={36}
                    style={{ marginBottom: 12, opacity: 0.5 }}
                  />
                  <p style={{ fontSize: 14, fontWeight: 500 }}>
                    No active session. Start a conversation first.
                  </p>
                </div>
              ) : loading ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "60px 0",
                  }}
                >
                  <div
                    style={{
                      border: "3px solid #f3f3f3",
                      borderTop: "3px solid #10B981",
                      borderRadius: "50%",
                      width: 28,
                      height: 28,
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <p style={{ marginTop: 12, fontSize: 13, color: "#6B7280" }}>
                    Loading blackboard state...
                  </p>
                </div>
              ) : error ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#EF4444",
                  }}
                >
                  <p>{error}</p>
                </div>
              ) : tasks.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "50px 20px",
                    color: "#9CA3AF",
                    textAlign: "center",
                  }}
                >
                  <FiList
                    size={40}
                    style={{ marginBottom: 12, opacity: 0.4, color: "#10B981" }}
                  />
                  <p
                    style={{ fontSize: 14, fontWeight: 600, color: "#4B5563" }}
                  >
                    Blackboard is currently empty
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#9CA3AF",
                      marginTop: 4,
                      maxWidth: 300,
                    }}
                  >
                    Tasks posted by the agent during this session will appear
                    here.
                  </p>
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {tasks.map((task, index) => (
                    <div
                      key={task.id || index}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                        padding: "16px",
                        borderRadius: "12px",
                        background:
                          task.status === "done" ? "#F9FAFB" : "#FFFFFF",
                        border: `1px solid ${task.status === "done" ? "#E5E7EB" : "rgba(16, 185, 129, 0.15)"}`,
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.01)",
                        transition: "all 0.2s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 20,
                          height: 20,
                          marginTop: 2,
                          flexShrink: 0,
                        }}
                      >
                        {task.status === "done" ? (
                          <FiCheckSquare size={18} color="#10B981" />
                        ) : (
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 4,
                              border: "2px solid #D1D5DB",
                              background: "#FFF",
                            }}
                          />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 14,
                            color:
                              task.status === "done" ? "#9CA3AF" : "#111827",
                            textDecoration:
                              task.status === "done" ? "line-through" : "none",
                            lineHeight: 1.5,
                            fontWeight: 500,
                            wordBreak: "break-word",
                          }}
                        >
                          {task.content}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginTop: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: "monospace",
                              color: "#9CA3AF",
                              background: "#F3F4F6",
                              padding: "2px 6px",
                              borderRadius: 4,
                            }}
                          >
                            ID: {task.id}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#10B981",
                              background: "rgba(16, 185, 129, 0.08)",
                              padding: "2px 8px",
                              borderRadius: 12,
                              textTransform: "uppercase",
                            }}
                          >
                            #{task.category || "general"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
