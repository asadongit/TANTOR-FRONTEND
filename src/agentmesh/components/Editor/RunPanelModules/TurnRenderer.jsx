import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCpu, FiChevronDown, FiRotateCcw } from "react-icons/fi";
import { formatMessage } from "../../Common/messageFormatting";
import {
  THEME_BORDER,
  THEME_ACCENT,
  THEME_TEXT,
  THEME_SECONDARY,
  THEME_USER_BUBBLE,
  THEME_GRAY,
} from "./constants";

// Incremental turn parser. Only the newly appended events are processed per
// render (O(1) per token instead of re-scanning the whole transcript O(n²)).
// Events are attributed by identity: pure appends continue the last turn,
// while truncations/replacements (rework, thread switch, cap-trim) rebuild.
function parseStreamEvents(streamEvents, nodeMap, stateRef) {
  const list = streamEvents || [];
  const state = stateRef.current || { count: 0, lastEvent: null, turns: [] };

  if (
    list.length === state.count &&
    (list.length === 0 || list[list.length - 1] === state.lastEvent)
  ) {
    stateRef.current = state;
    return state.turns;
  }

  const pureAppend =
    state.count === 0 ||
    (list.length > state.count && list[state.count - 1] === state.lastEvent);

  if (!pureAppend) {
    state.turns = [];
    state.count = 0;
    state.lastEvent = null;
  }

  const turns = state.turns;
  let currentTurn = turns.length ? turns[turns.length - 1] : null;

  const isMuted = (nodeId) => {
    if (!nodeId) return false;
    const node = nodeMap.get(nodeId);
    return node?.data?.mute_chat_bubble === true;
  };

  for (let i = state.count; i < list.length; i++) {
    const evt = list[i];
    if (evt.type === "user_message") {
      if (
        currentTurn &&
        turns[turns.length - 1] !== currentTurn &&
        (currentTurn.user || currentTurn.agents.length || currentTurn.logs.length)
      ) {
        turns.push(currentTurn);
      }
      currentTurn = { user: { ...evt, index: i, seq: evt._seq }, agents: [], logs: [], intermediateSteps: [] };
    } else if (evt.type === "token") {
      if (!isMuted(evt.node)) {
        if (!currentTurn) currentTurn = { user: null, agents: [], logs: [], intermediateSteps: [] };
        const agents = currentTurn.agents;
        const lastAgent = agents.length ? agents[agents.length - 1] : null;
        if (lastAgent && lastAgent.node === evt.node) {
          agents[agents.length - 1] = {
            ...lastAgent,
            content: lastAgent.content + evt.content,
            index: i,
          };
        } else {
          agents.push({ ...evt, index: i });
          currentTurn.intermediateSteps = agents.slice(0, -1);
        }
      }
    } else {
      if (evt.type === "node_start" && isMuted(evt.node)) {
        continue;
      }
      if (!currentTurn) currentTurn = { user: null, agents: [], logs: [], intermediateSteps: [] };
      currentTurn.logs.push({ ...evt, index: i });
    }
  }

  if (currentTurn && turns[turns.length - 1] !== currentTurn) {
    turns.push(currentTurn);
  }

  state.count = list.length;
  state.lastEvent = list[list.length - 1] || null;
  stateRef.current = state;
  return turns;
}

const UnifiedAgentTurn = React.memo(function UnifiedAgentTurn({
  finalAgent,
  intermediateSteps,
  isLast,
  running,
  onRegenerate,
  nodeMap,
  onShowVfs,
}) {
  const [threadExpanded, setThreadExpanded] = useState(false);
  const stepCount = intermediateSteps.length;

  const resolveLabel = (id, agentNameFallback) => {
    if (agentNameFallback && agentNameFallback !== id) return agentNameFallback;
    const node = nodeMap.get(id);
    return node?.data?.label || node?.label || id;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        width: "100%",
        maxWidth: "100%",
        marginBottom: 32,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          padding: "0 4px",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: "linear-gradient(135deg, #1C1C1E 0%, #000000 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${THEME_BORDER}`,
            boxShadow: `0 8px 16px ${THEME_ACCENT}20`,
            position: "relative",
            flexShrink: 0,
          }}
        >
          <FiCpu size={22} color={THEME_ACCENT} />
          {running && isLast && (
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                position: "absolute",
                inset: -2,
                borderRadius: 18,
                border: `2px solid ${THEME_ACCENT}`,
              }}
            />
          )}
        </div>

        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: THEME_TEXT,
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {resolveLabel(finalAgent.node, finalAgent.agent_name) || "Agent Mesh Orchestrator"}
            {running && isLast && (
              <span
                style={{
                  fontSize: 10,
                  background: THEME_ACCENT,
                  color: "#000",
                  padding: "2px 8px",
                  borderRadius: 20,
                  fontWeight: 800,
                }}
              >
                LIVE
              </span>
            )}
          </div>

          {stepCount > 0 ? (
            <div
              onClick={() => setThreadExpanded(!threadExpanded)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                opacity: 0.7,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.7)}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                {intermediateSteps.slice(0, 3).map((s, i) => (
                  <div
                    key={i}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 5,
                      background: "#1C1C1E",
                      border: "1.5px solid white",
                      marginLeft: i === 0 ? 0 : -8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 3 - i,
                    }}
                  >
                    <FiCpu size={8} color={THEME_ACCENT} />
                  </div>
                ))}
              </div>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#6B7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {stepCount} PREVIOUS STEPS
              </span>

              <FiChevronDown
                size={14}
                style={{
                  color: "#9CA3AF",
                  transform: threadExpanded ? "rotate(180deg)" : "none",
                  transition: "transform 0.3s",
                }}
              />
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>
              Autonomous Single-Node Reasoning
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {threadExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              overflow: "hidden",
              padding: "0 0 12px 0",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              marginLeft: 64,
            }}
          >
            {intermediateSteps.map((step, idx) => (
              <div
                key={idx}
                style={{ display: "flex", gap: 16, alignItems: "flex-start" }}
              >
                {/* Vertical Line for threading */}
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 10,
                      background: "#1C1C1E",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${THEME_BORDER}`,
                      flexShrink: 0,
                      zIndex: 2,
                    }}
                  >
                    <FiCpu size={14} color={THEME_ACCENT} />
                  </div>
                  {idx < intermediateSteps.length - 1 && (
                    <div
                      style={{
                        width: 1,
                        flex: 1,
                        background: THEME_BORDER,
                        marginTop: 4,
                      }}
                    />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: THEME_SECONDARY,
                      textTransform: "uppercase",
                      marginBottom: 8,
                      letterSpacing: "0.02em",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {resolveLabel(step.node, step.agent_name) || "Internal Processing"}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: THEME_TEXT,
                      lineHeight: 1.6,
                      background: "#FFFFFF",
                      padding: "16px 20px",
                      borderRadius: "0 16px 16px 16px",
                      border: `1px solid ${THEME_BORDER}`,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                    }}
                  >
                    {formatMessage(step.content)}
                  </div>
                </div>
              </div>
            ))}
            <div
              style={{
                height: 1,
                background: `linear-gradient(90deg, transparent, ${THEME_BORDER}, transparent)`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Answer Content ── */}
      <div
        style={{
          marginLeft: 64,
          marginTop: 12,
          position: "relative",
          minWidth: 0,
          padding: "4px 0",
        }}
      >
        <div
          style={{
            fontSize: 15,
            color: THEME_TEXT,
            lineHeight: 1.75,
            fontWeight: 400,
          }}
        >
          {formatMessage(finalAgent.content, false, isLast && !running)}
        </div>

        {/* Action Row */}
        {isLast && !running && (
          <div
            style={{
              marginTop: 20,
              display: "flex",
              gap: 12,
              borderTop: `1px solid ${THEME_BORDER}`,
              paddingTop: 16,
            }}
          >
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: `1px solid ${THEME_BORDER}`,
                  background: "#FFFFFF",
                  color: "#6B7280",
                  fontSize: 12,
                  cursor: "pointer",
                  fontWeight: 700,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = THEME_ACCENT)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = THEME_BORDER)
                }
              >
                <FiRotateCcw size={13} /> REGENERATE
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

export { UnifiedAgentTurn };

const TurnRenderer = React.memo(React.forwardRef(
  (
    {
      streamEvents,
      running,
      removeEventsFromIndex,
      onSend,
      nodes = [],
      onShowVfs,
    },
    ref,
  ) => {
    const nodeMap = React.useMemo(
      () => new Map((nodes || []).map((n) => [n.id, n])),
      [nodes],
    );
    const parserRef = React.useRef(null);
    const turns = parseStreamEvents(streamEvents, nodeMap, parserRef);

    return (
      <div
        ref={ref}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          width: "100%",
        }}
      >
        {turns.map((turn, tIdx) => {
          const isAbsoluteLastTurn = tIdx === turns.length - 1;
          const intermediateSteps = turn.intermediateSteps;
          const finalAgent = turn.agents[turn.agents.length - 1];

          return (
            <React.Fragment key={tIdx}>
              {turn.user && (
                <motion.div
                  key={`u-${tIdx}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    alignSelf: "flex-end",
                    maxWidth: "80%",
                    background: THEME_USER_BUBBLE,
                    padding: "14px 22px",
                    borderRadius: "24px 24px 4px 24px",
                    border: `1px solid ${THEME_BORDER}`,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                    margin: "8px 0",
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      color: THEME_TEXT,
                      lineHeight: 1.6,
                      fontWeight: 500,
                    }}
                  >
                    {turn.user.content}
                  </div>
                </motion.div>
              )}

              {finalAgent && (
                <UnifiedAgentTurn
                  key={`unified-${tIdx}`}
                  finalAgent={finalAgent}
                  intermediateSteps={intermediateSteps}
                  isLast={isAbsoluteLastTurn}
                  running={running}
                  nodeMap={nodeMap}
                  onShowVfs={onShowVfs}
                  onRegenerate={
                    isAbsoluteLastTurn && !running && turn.user
                      ? () => {
                          if (turn.user.seq != null && removeEventsFromIndex) {
                            removeEventsFromIndex(turn.user.seq);
                          }
                          onSend(turn.user.content);
                        }
                      : null
                  }
                />
              )}

              {turn.logs.map((evt, idx) => {
                const isArtifact =
                  evt.type === "tool_result" &&
                  typeof evt.content === "string" &&
                  (evt.content.includes("```chart") ||
                    evt.content.includes("```mermaid"));

                if (evt.type === "system_log") {
                  const isHitlLog =
                    evt.message?.includes("HUMAN REVIEW REQUIRED") ||
                    evt.content?.includes("Workflow paused at");
                  if (isHitlLog) return null;

                  return (
                    <motion.div
                      key={`l-${idx}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        alignSelf: "center",
                        background: THEME_GRAY,
                        border: `1px solid ${THEME_BORDER}`,
                        padding: "10px 18px",
                        borderRadius: 14,
                        fontSize: 12,
                        color: "#6B7280",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        maxWidth: "85%",
                        margin: "12px 0",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 800,
                          color: THEME_SECONDARY,
                          fontSize: 10,
                          textTransform: "uppercase",
                        }}
                      >
                        {evt.message}
                      </div>
                      {evt.content && (
                        <div style={{ color: THEME_TEXT, opacity: 0.8 }}>
                          {evt.content}
                        </div>
                      )}
                    </motion.div>
                  );
                }

                if (isArtifact) {
                  return (
                    <motion.div
                      key={`art-${idx}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        alignSelf: "stretch",
                        width: "100%",
                        margin: "14px auto",
                      }}
                    >
                      {formatMessage(evt.content)}
                    </motion.div>
                  );
                }
                return null;
              })}
            </React.Fragment>
          );
        })}
      </div>
    );
  },
));

export default TurnRenderer;
