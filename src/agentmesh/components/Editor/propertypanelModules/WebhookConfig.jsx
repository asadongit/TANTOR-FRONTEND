import React, { useState } from "react";
import { FiGlobe, FiCopy, FiInfo, FiCheck } from "react-icons/fi";
import {
  Toggle,
  Field,
  Select,
  Input,
  SearchableSelect,
} from "./SharedComponents";
import { useWorkflowStore } from "../../../store";

export default function WebhookConfig({ data, update, nodes, selectedNodeId }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/api/v1/agentmesh/webhook/${data.path || useWorkflowStore?.getState()?.workflowId || ""}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Toggle
        checked={data.enabled !== false}
        onChange={(v) => update({ enabled: v })}
        label="Trigger Enabled"
      />

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 16,
          background: "#F8FAFC",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            marginBottom: 14,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Authentication
        </div>
        <Field
          label="Auth Method"
          hint="Header: Uses static secret in X-AgentMesh-Secret. HMAC: Uses SHA256 signature verification."
        >
          <Select
            value={data.auth_method || "header"}
            onChange={(v) => update({ auth_method: v })}
            options={[
              { value: "header", label: "Header (X-AgentMesh-Secret)" },
              {
                value: "hmac",
                label: "HMAC Signature (X-AgentMesh-Signature)",
              },
              { value: "none", label: "None (Public Endpoint)" },
            ]}
          />
        </Field>
        {data.auth_method !== "none" && (
          <Field
            label="Secret Key"
            hint="Used for either Header or HMAC validation."
          >
            <Input
              value={data.secret || ""}
              onChange={(v) => update({ secret: v })}
              placeholder="Enter secret key…"
              type="password"
            />
          </Field>
        )}
      </div>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 16,
          background: "#F0F9FF",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#0369A1",
            marginBottom: 14,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Response Settings
        </div>
        <Field
          label="Response Mode"
          hint="Immediate: Responds 202 Accepted instantly. On Completion: Waits for workflow to finish and returns its output."
        >
          <Select
            value={data.response_mode || "immediate"}
            onChange={(v) => update({ response_mode: v })}
            options={[
              { value: "immediate", label: "Immediate (Fire & Forget)" },
              {
                value: "on_completion",
                label: "On Completion (Sync Response)",
              },
            ]}
          />
        </Field>
        {data.response_mode === "on_completion" && (
          <Field
            label="Return Data From"
            hint="Optional. Select a node to use its output as the response content. If empty, uses final workflow state."
          >
            <SearchableSelect
              value={data.response_node || ""}
              onChange={(v) => update({ response_node: v })}
              placeholder="— Final Output —"
              options={[
                { value: "", label: "— Final Output —" },
                ...nodes
                  .filter(
                    (n) => n.id !== selectedNodeId && n.data?.type !== "start",
                  )
                  .map((n) => ({
                    value: n.id,
                    label: n.data?.label || n.id,
                    sublabel: n.data?.type,
                  })),
              ]}
            />
          </Field>
        )}
      </div>

      <Field
        label="Webhook Path"
        hint="Custom path for the webhook. If empty, uses the Workflow ID."
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              background: "#F1F5F9",
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          >
            /webhook/
          </div>
          <Input
            value={data.path || ""}
            onChange={(v) => update({ path: v })}
            placeholder="my-custom-path"
          />
        </div>
      </Field>

      <div style={{ marginTop: 8 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Webhook Endpoint
        </div>
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "12px 14px",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                color: "#64748B",
                marginBottom: 2,
                fontWeight: 600,
              }}
            >
              {data.response_mode === "on_completion" ? "SYNC" : "ASYNC"} • POST
              / GET / PUT
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#1E293B",
                fontFamily: "monospace",
                wordBreak: "break-all",
                lineHeight: 1.4,
              }}
            >
              {`${window.location.origin}/api/v1/agentmesh/webhook/${data.path || useWorkflowStore?.getState()?.workflowId || ""}`}
            </div>
          </div>
          <button
            onClick={handleCopy}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "white",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: copied ? "#10B981" : "var(--text-muted)",
              flexShrink: 0,
            }}
            title={copied ? "Copied!" : "Copy URL"}
          >
            {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 12,
          background: "#F0F9FF",
          borderRadius: 10,
          fontSize: 11,
          color: "#0369A1",
          lineHeight: 1.5,
          border: "1px solid #BAE6FD",
        }}
      >
        <FiInfo size={12} style={{ marginRight: 6 }} />
        {data.response_mode === "on_completion"
          ? "Synchronous Mode: Caller waits for result. Use a 'Webhook Response' node to customize the output."
          : "Asynchronous Mode: Instant response. Workflow runs in background."}
      </div>
    </div>
  );
}
