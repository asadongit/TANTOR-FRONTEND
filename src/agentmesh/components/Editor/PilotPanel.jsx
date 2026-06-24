import React, { useState, useMemo } from "react";
import { useWorkflowStore, useUIStore } from "../../store";
import { FiX, FiSearch, FiLayers, FiInfo, FiSliders, FiCompass, FiPlay, FiChevronDown, FiChevronRight } from "react-icons/fi";
import PropertiesPanel from "./PropertiesPanel";
import VariableExplorer from "./VariableExplorer";
import RunPanel from "./RunPanel";
import { NODE_TYPES } from "./NodePalette";

export default function PilotPanel({ onClose }) {
  const { nodes, edges } = useWorkflowStore();
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);
  const workflowName = useWorkflowStore((s) => s.workflowName);

  const [activeTab, setActiveTab] = useState("settings"); // "settings" | "run"
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState({});

  console.log("PILOT PANEL RENDER - selectedNodeId:", selectedNodeId, "total nodes in workflow:", nodes.length);

  // Compute sequential order of nodes starting from '__start__' by tracing edges
  const sequencedNodes = useMemo(() => {
    const startNode = nodes.find(n => n.id === '__start__' || n.data?.type === 'start');
    if (!startNode) return nodes;

    const adj = {};
    edges.forEach(e => {
      if (!adj[e.source]) adj[e.source] = [];
      adj[e.source].push(e.target);
    });

    const ordered = [];
    const visited = new Set();
    const queue = [startNode.id];

    while (queue.length > 0) {
      const currId = queue.shift();
      if (visited.has(currId)) continue;
      visited.add(currId);

      const node = nodes.find(n => n.id === currId);
      if (node) {
        ordered.push(node);
      }

      const targets = adj[currId] || [];
      // Push target IDs to queue for BFS traversal
      targets.forEach(tId => {
        if (!visited.has(tId)) {
          queue.push(tId);
        }
      });
    }

    // Add any leftover nodes (e.g. disconnected nodes or triggers like webhook/cron)
    nodes.forEach(n => {
      if (!visited.has(n.id)) {
        ordered.push(n);
      }
    });

    return ordered;
  }, [nodes, edges]);

  // Flatten list to include internal group nodes sequentially after their parent groups
  const allRenderableNodes = useMemo(() => {
    const list = [];
    sequencedNodes.forEach(node => {
      list.push({
        ...node,
        isInternal: false,
        parentId: null,
      });
      if (node.data?.type === 'group' && node.data?.internal_nodes) {
        const isCollapsed = collapsedGroups[node.id];
        if (!isCollapsed) {
          node.data.internal_nodes.forEach(sub => {
            list.push({
              ...sub,
              isInternal: true,
              parentId: node.id,
              parentLabel: node.data?.label || node.id
            });
          });
        }
      }
    });
    return list;
  }, [sequencedNodes, collapsedGroups]);

  // Find current selected node index in sequential path (including internal group nodes)
  const currentNodeIndex = useMemo(() => {
    return allRenderableNodes.findIndex(n => n.id === selectedNodeId);
  }, [allRenderableNodes, selectedNodeId]);

  // Filter nodes based on search query, preserving the computed sequential flow order
  const filteredNodes = useMemo(() => {
    return allRenderableNodes.filter(n => {
      const label = n.data?.label || n.id;
      const type = n.data?.type || "";
      const matchedTypeInfo = NODE_TYPES.find(t => t.type === type);
      const desc = matchedTypeInfo?.desc || "";
      const query = searchQuery.toLowerCase();
      return (
        label.toLowerCase().includes(query) ||
        type.toLowerCase().includes(query) ||
        desc.toLowerCase().includes(query)
      );
    });
  }, [allRenderableNodes, searchQuery]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(8px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Google Sans', 'Roboto', sans-serif",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "95vw",
          height: "90vh",
          backgroundColor: "white",
          borderRadius: 16,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border, #E2E8F0)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(to right, #F8FAFC, #F1F5F9)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: "var(--theme-primary, #6366F1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                boxShadow: "0 4px 6px -1px rgba(99, 102, 241, 0.2)",
              }}
            >
              <FiCompass size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary, #0F172A)" }}>
                Pilot Console — {workflowName}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted, #64748B)" }}>
                Configure and audit all nodes & variables in a single unified workspace
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Tab Switcher */}
            <div
              style={{
                display: "flex",
                background: "#E2E8F0",
                padding: 3,
                borderRadius: 10,
                gap: 2,
              }}
            >
              <button
                onClick={() => setActiveTab("settings")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: activeTab === "settings" ? "white" : "transparent",
                  color: activeTab === "settings" ? "var(--theme-primary, #6366F1)" : "#64748B",
                  boxShadow: activeTab === "settings" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s",
                }}
              >
                <FiSliders size={13} />
                <span>Configure Node</span>
              </button>
              <button
                onClick={() => setActiveTab("run")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: activeTab === "run" ? "white" : "transparent",
                  color: activeTab === "run" ? "var(--theme-primary, #6366F1)" : "#64748B",
                  boxShadow: activeTab === "run" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s",
                }}
              >
                <FiPlay size={13} fill={activeTab === "run" ? "currentColor" : "none"} />
                <span>Run Console</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted, #64748B)",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#E2E8F0";
                e.currentTarget.style.color = "#0F172A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#64748B";
              }}
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* 3-Column Content Body */}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {/* Column 1: Node Navigation Sidebar (22% width) - Only visible in Settings tab */}
          {activeTab === "settings" && (
            <div
              style={{
                width: "22%",
                borderRight: "1px solid var(--border, #E2E8F0)",
                display: "flex",
                flexDirection: "column",
                background: "#F8FAFC",
                minHeight: 0,
              }}
            >
              {/* Search Input */}
              <div style={{ padding: 16, borderBottom: "1px solid var(--border, #E2E8F0)" }}>
                <div style={{ position: "relative" }}>
                  <FiSearch
                    size={14}
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted, #64748B)",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Filter nodes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 34px",
                      border: "1px solid var(--border, #E2E8F0)",
                      borderRadius: 8,
                      fontSize: 12,
                      outline: "none",
                      background: "white",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Scrollable Node List (Preserves order in workflow nodes array) */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }} className="msg-scrollbar">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {filteredNodes.map((node, index) => {
                    const typeInfo = NODE_TYPES.find(t => t.type === node.data?.type);
                    const Icon = typeInfo?.icon || FiLayers;
                    const isSelected = selectedNodeId === node.id;

                    return (
                      <button
                        key={node.id}
                        onClick={() => {
                          console.log(`PILOT PANEL: Clicked sidebar node id="${node.id}" label="${node.data?.label || node.id}" at index=${index}`);
                          setSelectedNode(node.id);
                          setActiveTab("settings");
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 12px",
                          paddingLeft: node.isInternal ? 28 : 12,
                          borderRadius: 8,
                          border: "none",
                          background: isSelected ? "var(--theme-primary-glow, #EEF2FF)" : "transparent",
                          color: isSelected ? "var(--theme-primary, #6366F1)" : "var(--text-primary, #0F172A)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          fontWeight: isSelected ? 600 : 500,
                          fontSize: 12,
                          transition: "all 0.1s",
                          position: "relative",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = "#F1F5F9";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        {node.isInternal && (
                          <span style={{
                            position: "absolute",
                            left: 14,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "var(--text-muted, #94A3B8)",
                            fontSize: 10,
                            fontWeight: "bold"
                          }}>
                            ↳
                          </span>
                        )}
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            backgroundColor: isSelected ? "white" : (typeInfo?.bg || "#E2E8F0"),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: isSelected ? "var(--theme-primary, #6366F1)" : (typeInfo?.color || "#475569"),
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={13} strokeWidth={2.5} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {node.data?.label || node.id}
                          </span>
                          <span style={{ fontSize: 10, color: "var(--text-muted, #64748B)", textTransform: "capitalize" }}>
                            {node.data?.type?.replace(/_/g, " ")} {node.isInternal && `• in ${node.parentLabel}`}
                          </span>
                        </div>
                        {node.data?.type === 'group' && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setCollapsedGroups(prev => ({
                                ...prev,
                                [node.id]: !prev[node.id]
                              }));
                            }}
                            style={{
                              marginLeft: "auto",
                              padding: "4px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              color: "var(--text-muted, #64748B)",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                          >
                            {collapsedGroups[node.id] ? <FiChevronRight size={14} /> : <FiChevronDown size={14} />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {filteredNodes.length === 0 && (
                  <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted, #64748B)", fontSize: 12 }}>
                    No nodes found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Column 2 & 3 Workspace Area */}
          {activeTab === "settings" ? (
            <>
              {/* Column 2: Properties Editor Workspace (53% width) */}
              <div
                style={{
                  width: "53%",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  background: "white",
                }}
              >
                {selectedNodeId ? (
                  <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                    {/* Node Navigation Bar */}
                    <div
                      style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid var(--border, #E2E8F0)",
                        background: "#F8FAFC",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <button
                        disabled={currentNodeIndex <= 0}
                        onClick={() => {
                          if (currentNodeIndex > 0) {
                            setSelectedNode(allRenderableNodes[currentNodeIndex - 1].id);
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          background: "transparent",
                          border: "none",
                          cursor: currentNodeIndex <= 0 ? "not-allowed" : "pointer",
                          color: currentNodeIndex <= 0 ? "#CBD5E1" : "var(--theme-primary, #6366F1)",
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "6px 10px",
                          borderRadius: 6,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (currentNodeIndex > 0) e.currentTarget.style.backgroundColor = "#E2E8F0";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        &larr; Prev Node
                      </button>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary, #0F172A)" }}>
                        {currentNodeIndex !== -1 ? `Node ${currentNodeIndex + 1} of ${allRenderableNodes.length}` : ""}
                      </div>
                      <button
                        disabled={currentNodeIndex === -1 || currentNodeIndex >= allRenderableNodes.length - 1}
                        onClick={() => {
                          if (currentNodeIndex !== -1 && currentNodeIndex < allRenderableNodes.length - 1) {
                            setSelectedNode(allRenderableNodes[currentNodeIndex + 1].id);
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          background: "transparent",
                          border: "none",
                          cursor: (currentNodeIndex === -1 || currentNodeIndex >= allRenderableNodes.length - 1) ? "not-allowed" : "pointer",
                          color: (currentNodeIndex === -1 || currentNodeIndex >= allRenderableNodes.length - 1) ? "#CBD5E1" : "var(--theme-primary, #6366F1)",
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "6px 10px",
                          borderRadius: 6,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (currentNodeIndex !== -1 && currentNodeIndex < allRenderableNodes.length - 1) {
                            e.currentTarget.style.backgroundColor = "#E2E8F0";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        Next Node &rarr;
                      </button>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                      <PropertiesPanel />
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted, #64748B)",
                      gap: 12,
                    }}
                  >
                    <FiInfo size={36} style={{ color: "var(--border, #E2E8F0)" }} />
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      Select a node from the sidebar list to configure its settings.
                    </div>
                  </div>
                )}
              </div>

              {/* Column 3: Variable / Data Explorer (25% width) */}
              <div
                style={{
                  width: "25%",
                  borderLeft: "1px solid var(--border, #E2E8F0)",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  background: "white",
                }}
              >
                <VariableExplorer onClose={() => {}} />
              </div>
            </>
          ) : (
            /* Run Console View: Show RunPanel on left (75% width) and VariableExplorer on right (25% width) */
            <>
              <div
                style={{
                  width: "75%",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  background: "white",
                }}
              >
                <RunPanel onClose={() => setActiveTab("settings")} />
              </div>

              <div
                style={{
                  width: "25%",
                  borderLeft: "1px solid var(--border, #E2E8F0)",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  background: "white",
                }}
              >
                <VariableExplorer onClose={() => {}} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
