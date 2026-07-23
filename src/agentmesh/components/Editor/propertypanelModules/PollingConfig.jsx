import React from "react";

import {
  Toggle,
  Field,
  CronHelper,
  Select,
  SearchableSelect,
  Input,
  KeyValueEditor,
} from "./SharedComponents";

export default function PollingConfig({
  data,
  update,
  availableTools,
  selectedNodeId,
}) {
  const selectedTool = availableTools.find((t) => t.name === data.poller_tool);
  const schemaProperties =
    selectedTool?.args || selectedTool?.args_schema || {};
  const properties = schemaProperties.properties || schemaProperties;
  const requiredFields = Array.isArray(schemaProperties.required)
    ? schemaProperties.required
    : [];
  const hasArgs = Object.keys(properties || {}).length > 0;

  return (
    <>
      <Toggle
        checked={data.enabled !== false}
        onChange={(v) => update({ enabled: v })}
        label="Polling Enabled"
      />

      <Field label="Schedule Configuration">
        <CronHelper
          value={data.cron_expression || "*/5 * * * *"}
          onChange={(v) => update({ cron_expression: v })}
        />
      </Field>
      <Field label="Timezone">
        <Select
          value={data.timezone || "UTC"}
          onChange={(v) => update({ timezone: v })}
          options={[
            "UTC",
            "local",
            "America/New_York",
            "Europe/London",
            "Asia/Tokyo",
          ]}
        />
      </Field>

      <Field
        label="Poller Tool"
        hint="Choose the registered tool to query for data."
      >
        <SearchableSelect
          value={data.poller_tool || ""}
          onChange={(v) => update({ poller_tool: v })}
          placeholder="Select a poller tool…"
          options={availableTools.map((t) => ({
            value: t.name,
            label: t.display_name || t.name,
            sublabel: t.category,
          }))}
        />
      </Field>

      {data.poller_tool && selectedTool && (
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
            <FiTool size={13} style={{ color: "var(--accent-btn)" }} /> Tool
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
                  return (
                    <div
                      key={argName}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        padding: "8px 10px",
                        background: "white",
                        borderRadius: 8,
                        border: "1px solid #E2E8F0",
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
                            color: "#0F172A",
                          }}
                        >
                          {argName}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            color: "#6366F1",
                            background: "#EEF2FF",
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
                              color: "#EF4444",
                              fontWeight: 600,
                            }}
                          >
                            required
                          </span>
                        )}
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
        hint="The context key where the retrieved data list will be saved (default: 'payload')."
      >
        <Input
          stripBraces
          value={data.destination_key || "payload"}
          onChange={(v) => update({ destination_key: v })}
          placeholder="payload"
        />
      </Field>

      <KeyValueEditor
        label="Tool Arguments (JSON Parameters)"
        value={data.tool_arguments || {}}
        onChange={(v) => update({ tool_arguments: v })}
        hint="Key-value arguments to supply to the poller tool on every execution."
      />

    </>
  );
}
