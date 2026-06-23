import React, { memo } from "react";
import { FiBox, FiPlus, FiMinus } from "react-icons/fi";
import {
  Field,
  SearchableSelect,
  Input,
  KeyValueEditor,
  Toggle,
  CollapsibleSection,
  ErrorTargetField,
} from "./SharedComponents";

const DirectToolConfig = memo(function DirectToolConfig({
  data,
  update,
  nodes,
  availableTools,
  selectedNodeId,
  hitlSection,
}) {
  const selectedTool = availableTools.find(
    (t) => t.name === data.direct_tool_name,
  );
  const schemaProperties =
    selectedTool?.args || selectedTool?.args_schema || {};
  const properties = schemaProperties.properties || schemaProperties;
  const requiredFields = Array.isArray(schemaProperties.required)
    ? schemaProperties.required
    : [];
  const hasArgs = Object.keys(properties || {}).length > 0;

  return (
    <>
      <Field
        label="Direct Tool Name"
        hint="Choose the registered tool to execute directly."
      >
        <SearchableSelect
          value={data.direct_tool_name || ""}
          onChange={(v) => update({ direct_tool_name: v })}
          placeholder="Select a tool…"
          options={availableTools.map((t) => ({
            value: t.name,
            label: t.display_name || t.name,
            sublabel: t.category,
          }))}
        />
      </Field>

      {data.direct_tool_name && selectedTool && (
        <div
          style={{
            marginBottom: 18,
            padding: "14px 16px",
            background: "#F8FAFC",
            border: "1px solid var(--border)",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FiBox size={13} style={{ color: "var(--accent-btn)" }} /> Tool
            Schema Details
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              lineHeight: 1.5,
              marginBottom: 12,
            }}
          >
            {selectedTool.description || "No description provided."}
          </div>

          {hasArgs ? (
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                }}
              >
                Expected Arguments
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(properties).map(([argName, argMeta]) => {
                  const isRequired =
                    requiredFields.includes(argName) || argMeta.required;
                  const isAdded = data.tool_arguments?.hasOwnProperty(argName);
                  return (
                    <div
                      key={argName}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        padding: "8px 10px",
                        background: "var(--bg-panel, white)",
                        borderRadius: 8,
                        border: "1px solid var(--border, #E2E8F0)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "var(--text-primary, #0F172A)",
                            }}
                          >
                            {argName}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              color: "var(--text-card-purple, #6366F1)",
                              background: "var(--bg-card-purple, #EEF2FF)",
                              padding: "1px 5px",
                              borderRadius: 4,
                              fontWeight: 600,
                            }}
                          >
                            {argMeta.type || "any"}
                          </span>
                          {isRequired && (
                            <span
                              style={{
                                fontSize: 9,
                                color: "var(--text-card-danger, #EF4444)",
                                fontWeight: 600,
                              }}
                            >
                              required
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const next = { ...data.tool_arguments };
                            if (isAdded) {
                              delete next[argName];
                            } else {
                              next[argName] = "";
                            }
                            update({ tool_arguments: next });
                          }}
                          style={{
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "4px 6px",
                            borderRadius: 4,
                            color: isAdded
                              ? "var(--text-card-danger, #EF4444)"
                              : "#7C3AED",
                            background: isAdded
                              ? "var(--bg-card-danger, #FEF2F2)"
                              : "#F5F3FF",
                            fontSize: 10,
                            fontWeight: 600,
                            gap: 3,
                          }}
                        >
                          {isAdded ? (
                            <FiMinus size={12} />
                          ) : (
                            <FiPlus size={12} />
                          )}
                        </button>
                      </div>
                      {argMeta.description && (
                        <div
                          style={{
                            fontSize: 10,
                            color: "#64748B",
                            lineHeight: 1.4,
                            marginTop: 2,
                          }}
                        >
                          {argMeta.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              style={{ fontSize: 11, color: "#64748B", fontStyle: "italic" }}
            >
              This tool does not accept any arguments.
            </div>
          )}
        </div>
      )}

      <Field
        label="Destination Key"
        hint="The context key where the tool result will be saved (default: 'tool_result_{node_id}')."
      >
        <Input
          value={data.destination_key || ""}
          onChange={(v) => update({ destination_key: v })}
          placeholder={`tool_result_${selectedNodeId}`}
        />
      </Field>

      <KeyValueEditor
        label="Tool Arguments"
        value={data.tool_arguments || {}}
        onChange={(v) => update({ tool_arguments: v })}
        hint="Arguments to pass to the tool. Supports {{variable}} dynamic replacement."
      />

      <CollapsibleSection title="Advanced Options">
        {hitlSection}
        <div
          style={{
            height: "1px",
            background: "var(--border)",
            margin: "16px 0",
          }}
        />
        <Toggle
          checked={data.return_direct || false}
          onChange={(v) => update({ return_direct: v })}
          label="Return result direct to user"
        />
        <div
          style={{
            height: "1px",
            background: "var(--border)",
            margin: "16px 0",
          }}
        />
        <ErrorTargetField
          value={data.on_error}
          onChange={(v) => update({ on_error: v })}
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          hint="If this tool execution fails, jump to this error handler."
        />
      </CollapsibleSection>
    </>
  );
});

export default DirectToolConfig;
