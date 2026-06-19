import React, { useState, useEffect, useRef } from "react";
import { fetchWorkflowApiSpec, sendWebhookTest } from "../../api/agentmesh";
import {
  FiX,
  FiCopy,
  FiCheck,
  FiPlay,
  FiCode,
  FiLock,
  FiUnlock,
  FiZap,
  FiChevronDown,
  FiChevronRight,
  FiServer,
  FiSend,
  FiFileText,
  FiBox,
  FiAlertTriangle,
  FiInfo,
  FiLoader,
  FiGlobe,
  FiShield,
  FiDatabase,
} from "react-icons/fi";

const FONT = "'Google Sans','Roboto',sans-serif";

// ─── Copyable Code Block ──────────────────────────────────────────────────────
function CodeBlock({ code, lang = "bash", label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid #334155",
      }}
    >
      {label && (
        <div
          style={{
            background: "#1E293B",
            padding: "6px 14px",
            fontSize: 10,
            fontWeight: 700,
            color: "#94A3B8",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            borderBottom: "1px solid #334155",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {label}
          <button
            onClick={copy}
            style={{
              background: "none",
              border: "none",
              color: copied ? "#22C55E" : "#64748B",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {copied ? (
              <>
                <FiCheck size={11} /> Copied
              </>
            ) : (
              <>
                <FiCopy size={11} /> Copy
              </>
            )}
          </button>
        </div>
      )}
      <pre
        style={{
          margin: 0,
          padding: "14px 16px",
          background: "#0F172A",
          color: "#E2E8F0",
          fontSize: 12,
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          lineHeight: 1.7,
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {code}
      </pre>
    </div>
  );
}

// ─── Collapsible Section ──────────────────────────────────────────────────────
function Section({ icon: Icon, title, badge, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid var(--border)",
        overflow: "hidden",
        background: "white",
      }}
    >
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "14px 18px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: open ? "#F8FAFC" : "white",
          transition: "background 0.15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon size={16} color="var(--accent-btn)" />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {title}
          </span>
          {badge && (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 20,
                fontSize: 10,
                fontWeight: 700,
                background: "#DBEAFE",
                color: "#1D4ED8",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {open ? (
          <FiChevronDown size={16} color="#94A3B8" />
        ) : (
          <FiChevronRight size={16} color="#94A3B8" />
        )}
      </div>
      {open && (
        <div
          style={{
            padding: "16px 18px",
            borderTop: "1px solid var(--border-light)",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const color = status < 300 ? "#22C55E" : status < 400 ? "#EAB308" : "#EF4444";
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 700,
        background: `${color}15`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {status}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════
export default function WorkflowAPIConsole({ workflowId, onClose }) {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Try-it-now state
  const [requestBody, setRequestBody] = useState('{\n  "key": "value"\n}');
  const [customHeaders, setCustomHeaders] = useState("");
  const [response, setResponse] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!workflowId) return;
    setLoading(true);
    setError(null);
    fetchWorkflowApiSpec(workflowId)
      .then((res) => setSpec(res.spec))
      .catch((err) => setError(err.message || "Failed to load API spec"))
      .finally(() => setLoading(false));
  }, [workflowId]);

  const handleSend = async () => {
    if (!spec) return;
    setSending(true);
    setResponse(null);
    try {
      let headers = {};
      if (customHeaders.trim()) {
        customHeaders.split("\n").forEach((line) => {
          const idx = line.indexOf(":");
          if (idx > 0)
            headers[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
        });
      }
      const body = JSON.parse(requestBody);
      const result = await sendWebhookTest(spec.endpoint.url, {
        method: "POST",
        headers,
        body,
      });
      setResponse(result);
    } catch (err) {
      setResponse({
        status: 0,
        statusText: "Client Error",
        body: { error: err.message },
      });
    }
    setSending(false);
  };

  if (!workflowId) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(6px)",
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          width: 720,
          maxHeight: "92vh",
          background: "white",
          borderRadius: 20,
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "18px 24px",
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(99,102,241,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiCode size={18} color="#818CF8" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>
                API Console
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>
                {spec?.workflow_name || "Loading..."}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#94A3B8",
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* ── Content ── */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {loading && (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <FiLoader
                size={24}
                className="animate-spin"
                style={{ display: "block", margin: "0 auto 12px" }}
              />
              Generating API documentation...
            </div>
          )}

          {error && (
            <div
              style={{
                padding: 16,
                background: "#FEF2F2",
                borderRadius: 10,
                border: "1px solid #FECACA",
                color: "#DC2626",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <FiAlertTriangle size={16} /> {error}
            </div>
          )}

          {spec && (
            <>
              {/* Endpoint */}
              <Section icon={FiGlobe} title="Endpoint" defaultOpen={true}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: "#22C55E",
                      color: "white",
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    POST
                  </span>
                  <code
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: "#F1F5F9",
                      borderRadius: 8,
                      fontSize: 13,
                      fontFamily: "monospace",
                      color: "#334155",
                      wordBreak: "break-all",
                    }}
                  >
                    {spec.endpoint.url}
                  </code>
                  <CopyBtn text={spec.endpoint.url} />
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Tag
                    label={`Response: ${spec.endpoint.response_mode}`}
                    color="#6366F1"
                  />
                  {spec.endpoint.content_types.map((ct) => (
                    <Tag key={ct} label={ct} color="#0EA5E9" />
                  ))}
                </div>
                {spec.description && (
                  <p
                    style={{
                      margin: "12px 0 0",
                      fontSize: 12,
                      color: "#64748B",
                      lineHeight: 1.5,
                    }}
                  >
                    {spec.description}
                  </p>
                )}
              </Section>

              {/* Authentication */}
              {spec.authentication &&
                Object.keys(spec.authentication).length > 0 && (
                  <Section
                    icon={FiShield}
                    title="Authentication"
                    badge={spec.authentication.type?.toUpperCase()}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "#475569",
                        lineHeight: 1.6,
                      }}
                    >
                      <div>
                        <strong>Method:</strong> {spec.authentication.type}
                      </div>
                      <div>
                        <strong>Header:</strong>{" "}
                        <code
                          style={{
                            background: "#F1F5F9",
                            padding: "2px 6px",
                            borderRadius: 4,
                          }}
                        >
                          {spec.authentication.header}
                        </code>
                      </div>
                      <div style={{ marginTop: 6, color: "#64748B" }}>
                        {spec.authentication.description}
                      </div>
                    </div>
                  </Section>
                )}

              {/* Capabilities */}
              <Section
                icon={FiZap}
                title="Capabilities"
                badge={`${spec.capabilities.node_count} nodes`}
              >
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {spec.capabilities.accepts_files && (
                    <Tag label="📁 File Uploads" color="#F59E0B" />
                  )}
                  {spec.capabilities.has_hitl && (
                    <Tag label="🛑 Human-in-the-Loop" color="#EF4444" />
                  )}
                  {spec.capabilities.has_database && (
                    <Tag label="🗄️ Database Writes" color="#10B981" />
                  )}
                </div>
              </Section>

              {/* cURL Example */}
              <Section
                icon={FiFileText}
                title="cURL Example"
                defaultOpen={true}
              >
                <CodeBlock
                  code={spec.curl_example}
                  lang="bash"
                  label="Terminal"
                />
              </Section>

              {/* Resume Endpoint (HITL) */}
              {spec.resume_endpoint && (
                <Section icon={FiPlay} title="Resume Endpoint (HITL)">
                  <div
                    style={{
                      fontSize: 12,
                      color: "#475569",
                      lineHeight: 1.6,
                      marginBottom: 10,
                    }}
                  >
                    {spec.resume_endpoint.description}
                  </div>
                  <CodeBlock
                    code={`POST ${spec.resume_endpoint.url}\n\n${JSON.stringify(spec.resume_endpoint.body_schema, null, 2)}`}
                    lang="json"
                    label="Resume Request"
                  />
                </Section>
              )}

              {/* ── Try It Now ── */}
              <Section icon={FiSend} title="Try It Now" defaultOpen={true}>
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748B",
                      display: "block",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Request Body (JSON)
                  </label>
                  <textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    rows={6}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "#0F172A",
                      color: "#E2E8F0",
                      fontFamily: "'JetBrains Mono','Fira Code',monospace",
                      fontSize: 12,
                      lineHeight: 1.6,
                      resize: "vertical",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748B",
                      display: "block",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Custom Headers (one per line, Key: Value)
                  </label>
                  <textarea
                    value={customHeaders}
                    onChange={(e) => setCustomHeaders(e.target.value)}
                    rows={2}
                    placeholder="X-AgentMesh-Secret: your-secret-here"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "#F8FAFC",
                      fontSize: 12,
                      fontFamily: "'JetBrains Mono','Fira Code',monospace",
                      resize: "vertical",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <button
                  onClick={handleSend}
                  disabled={sending}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 10,
                    border: "none",
                    background: sending
                      ? "#94A3B8"
                      : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: sending ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: sending
                      ? "none"
                      : "0 4px 14px rgba(99,102,241,0.3)",
                    transition: "all 0.2s",
                  }}
                >
                  {sending ? (
                    <>
                      <FiLoader size={14} /> Sending...
                    </>
                  ) : (
                    <>
                      <FiSend size={14} /> Send Request
                    </>
                  )}
                </button>

                {/* Response */}
                {response && (
                  <div style={{ marginTop: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#64748B",
                        }}
                      >
                        RESPONSE
                      </span>
                      <StatusBadge status={response.status} />
                      <span style={{ fontSize: 11, color: "#94A3B8" }}>
                        {response.statusText}
                      </span>
                    </div>
                    <CodeBlock
                      code={JSON.stringify(response.body, null, 2)}
                      lang="json"
                      label={`Response Body — ${response.status}`}
                    />
                  </div>
                )}
              </Section>

              {/* Request / Response Schemas */}
              <Section icon={FiBox} title="Schemas">
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <CodeBlock
                    code={JSON.stringify(spec.request_schema, null, 2)}
                    lang="json"
                    label="Request Schema"
                  />
                  <CodeBlock
                    code={JSON.stringify(spec.response_schema, null, 2)}
                    lang="json"
                    label="Response Schema"
                  />
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tiny Helpers ─────────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
      style={{
        background: ok ? "#DCFCE7" : "#F1F5F9",
        border: "1px solid var(--border)",
        borderRadius: 6,
        width: 30,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: ok ? "#22C55E" : "#64748B",
        transition: "all 0.15s",
        flexShrink: 0,
      }}
    >
      {ok ? <FiCheck size={13} /> : <FiCopy size={13} />}
    </button>
  );
}

function Tag({ label, color }) {
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 700,
        background: `${color}12`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      {label}
    </span>
  );
}
