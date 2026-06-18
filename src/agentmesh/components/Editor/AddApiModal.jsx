import React, { useState } from "react";
import { FiX, FiCheck } from "react-icons/fi";

const FONT = "'Google Sans', 'Roboto', sans-serif";

export default function AddApiModal({ isOpen, onClose, onSave, type }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState(
    '{"Content-Type": "application/json"}',
  );
  const [payload, setPayload] = useState("{}");

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          background: "var(--bg-primary)",
          width: 500,
          borderRadius: 12,
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Add Custom {type === "internal" ? "Internal" : "External"} API
          </div>
          <FiX
            style={{ cursor: "pointer", color: "var(--text-muted)" }}
            onClick={onClose}
          />
        </div>

        <div
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: 6,
                display: "block",
              }}
            >
              API Name / Source
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fraud Check API"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-canvas)",
                color: "var(--text-main)",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  marginBottom: 6,
                  display: "block",
                }}
              >
                Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg-canvas)",
                  color: "var(--text-main)",
                }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </div>
            <div style={{ flex: 3 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  marginBottom: 6,
                  display: "block",
                }}
              >
                URL Endpoint
              </label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/v1/check"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg-canvas)",
                  color: "var(--text-main)",
                }}
              />
            </div>
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: 6,
                display: "block",
              }}
            >
              Headers (JSON)
            </label>
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              rows={2}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-canvas)",
                color: "var(--text-main)",
                fontFamily: "monospace",
              }}
            />
          </div>
          {method === "POST" && (
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  marginBottom: 6,
                  display: "block",
                }}
              >
                Payload (JSON)
              </label>
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg-canvas)",
                  color: "var(--text-main)",
                  fontFamily: "monospace",
                }}
              />
            </div>
          )}
        </div>

        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            background: "var(--bg-secondary)",
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "transparent",
              border: "1px solid var(--border)",
              cursor: "pointer",
              color: "var(--text-main)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (name && url) {
                onSave({ name, url, method, headers, payload });
                setName("");
                setUrl("");
              }
            }}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "#7C3AED",
              color: "white",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 600,
            }}
          >
            <FiCheck size={16} /> Save API
          </button>
        </div>
      </div>
    </div>
  );
}
