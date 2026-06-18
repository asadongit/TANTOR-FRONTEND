import React from "react";
import PropTypes from "prop-types";
import { FiSettings, FiX } from "react-icons/fi";
import {
  Toggle,
  LLMConfigSection,
  Field,
  Select,
  Input,
  CollapsibleSection,
} from "./SharedComponents";

export default function ToolConfigModal({
  toolName,
  config = {},
  onChange,
  onClose,
  onRemove,
  availableTools = [],
}) {
  const toolInfo = availableTools.find((t) => t.name === toolName) || {
    name: toolName,
  };

  // Helper to update a single config key
  const set = (key, val) => onChange({ ...config, [key]: val });

  // Determine fields to show
  const toolConfigs = toolInfo.configs || [];

  // Effect to apply backend-driven default values for missing fields.
  // We stabilize the onChange reference via a ref to prevent infinite loops
  // when the parent re-creates the onChange function on each render.
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  });

  React.useEffect(() => {
    let hasChanges = false;
    const nextConfig = { ...config };

    toolConfigs.forEach((f) => {
      if (
        f.default !== undefined &&
        f.default !== null &&
        config[f.name] === undefined
      ) {
        nextConfig[f.name] = f.default;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      onChangeRef.current(nextConfig);
    }
  }, [toolName, toolConfigs, config]);

  // Determine fields
  let fieldsList = [];
  if (toolConfigs.length > 0) {
    fieldsList = toolConfigs;
  } else {
    const isRagOrMemory =
      toolName.toLowerCase().includes("rag") ||
      toolName.toLowerCase().includes("memory");
    if (isRagOrMemory) {
      fieldsList = [
        {
          name: "collection_name",
          type: "string",
          description: "Vector collection name",
        },
        {
          name: "k",
          type: "number",
          description: "Number of results to return",
        },
        {
          name: "threshold",
          type: "number",
          description: "Similarity threshold (0.0 to 1.0)",
        },
      ];
    }
  }

  const fields = fieldsList.filter(
    (f) => !(toolName === "chart_generator" && f.name.startsWith("llm_")),
  );

  const toolLlm = {
    provider: config.llm_provider || "openai",
    model: config.llm_model || "gpt-4o",
    temperature: config.llm_temperature ?? 0.1,
    api_key_override: config.llm_api_key_override || null,
    base_url: config.llm_base_url || null,
  };

  const handleLlmChange = (newLlm) => {
    onChange({
      ...config,
      llm_provider: newLlm.provider,
      llm_model: newLlm.model,
      llm_temperature: newLlm.temperature,
      llm_api_key_override: newLlm.api_key_override,
      llm_base_url: newLlm.base_url,
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          width: 440,
          background: "white",
          borderRadius: 16,
          boxShadow: "var(--shadow-2xl)",
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#F8FAFC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FiSettings size={16} color="#475569" />
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {toolInfo.display_name || toolName} Settings
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        <div style={{ padding: "20px", maxHeight: "76vh", overflowY: "auto" }}>
          <CollapsibleSection title="Advanced Options">
            <Toggle
              checked={config.return_direct || false}
              onChange={(v) => set("return_direct", v)}
              label="Return result direct to user"
            />
            <div
              style={{
                height: "1px",
                background: "var(--border)",
                margin: "12px 0",
              }}
            />
            <Toggle
              checked={config.interrupt_before || false}
              onChange={(v) => set("interrupt_before", v)}
              label="Pause before execution (Human approval)"
            />
          </CollapsibleSection>

          {toolName === "chart_generator" && (
            <>
              <div
                style={{
                  height: "1px",
                  background: "var(--border)",
                  margin: "16px 0",
                }}
              />
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
                Chart Generator LLM
              </div>
              <LLMConfigSection llm={toolLlm} onChange={handleLlmChange} />
            </>
          )}

          <div
            style={{
              height: "1px",
              background: "var(--border)",
              margin: "16px 0",
            }}
          />
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
            Parameter Overrides (Human-Only)
          </div>

          {fields.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {fields.map((f) => {
                let inputType = "text";
                if (f.type === "number") {
                  inputType = "number";
                } else if (
                  f.type === "password" ||
                  f.name.toLowerCase().includes("password") ||
                  f.name.toLowerCase().includes("key")
                ) {
                  inputType = "password";
                }

                return (
                  <Field
                    key={f.name}
                    label={f.name.replaceAll("_", " ")}
                    hint={f.description}
                  >
                    {f.options && f.options.length > 0 ? (
                      <Select
                        value={config[f.name] || f.default}
                        onChange={(v) =>
                          set(
                            f.name,
                            f.type === "number" ? Number.parseFloat(v) : v,
                          )
                        }
                        options={f.options.map((o) => ({ value: o, label: o }))}
                      />
                    ) : (
                      <Input
                        type={inputType}
                        value={config[f.name]}
                        onChange={(v) =>
                          set(
                            f.name,
                            f.type === "number" ? Number.parseFloat(v) : v,
                          )
                        }
                        placeholder={
                          f.name === "collection_name" ? "default" : ""
                        }
                      />
                    )}
                  </Field>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                padding: 12,
                background: "#F1F5F9",
                borderRadius: 8,
                fontSize: 12,
                color: "#475569",
                textAlign: "center",
              }}
            >
              No specific parameter overrides defined for this tool.
            </div>
          )}
        </div>

        <div
          style={{
            padding: "16px 20px",
            background: "#F8FAFC",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "var(--accent-btn)",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

ToolConfigModal.propTypes = {
  toolName: PropTypes.string.isRequired,
  config: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onRemove: PropTypes.func,
  availableTools: PropTypes.array,
};
