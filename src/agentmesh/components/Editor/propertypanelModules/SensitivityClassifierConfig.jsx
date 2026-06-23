import React from "react";

import { Field, Input, Textarea, Select } from "./SharedComponents";

export default function SensitivityClassifierConfig({ data, update }) {
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const engineMode = data.engine_mode ?? "both";
  const outputFormat = data.output_format ?? "markdown";

  const engineOptions = [
    { value: "both", label: "Presidio + Regex", sub: "Best coverage" },
    { value: "presidio", label: "Presidio AI", sub: "Semantic NLP" },
    { value: "regex", label: "Regex Only", sub: "Fastest" },
  ];

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
            marginBottom: 8,
          }}
        >
          Detection Engine
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 6,
          }}
        >
          {engineOptions.map((opt) => {
            const active = engineMode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ engine_mode: opt.value })}
                style={{
                  padding: "9px 6px",
                  borderRadius: 8,
                  border: active
                    ? "1.5px solid var(--theme-primary)"
                    : "1px solid var(--border)",
                  background: active ? "rgba(142,119,187,0.08)" : "white",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: active
                      ? "var(--theme-primary)"
                      : "var(--text-primary)",
                  }}
                >
                  {opt.label}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  {opt.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
            marginBottom: 8,
          }}
        >
          Output Format
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}
        >
          {[
            {
              value: "markdown",
              label: "Summary",
              icon: "📝",
              sub: "Human-readable",
            },
            {
              value: "json",
              label: "Raw JSON",
              icon: "{ }",
              sub: "Machine-readable",
            },
          ].map((opt) => {
            const active = outputFormat === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ output_format: opt.value })}
                style={{
                  padding: "10px 8px",
                  borderRadius: 8,
                  border: active
                    ? "1.5px solid var(--theme-primary)"
                    : "1px solid var(--border)",
                  background: active ? "rgba(142,119,187,0.08)" : "white",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 14, marginBottom: 3 }}>{opt.icon}</div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: active
                      ? "var(--theme-primary)"
                      : "var(--text-primary)",
                  }}
                >
                  {opt.label}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    marginTop: 1,
                  }}
                >
                  {opt.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid var(--border)",
          margin: "2px 0 18px",
          opacity: 0.6,
        }}
      />

      <Field
        label="Custom Entities"
        hint="Comma-separated keywords (e.g. Apollo11, ProjectX) or a JSON array of regex rules — applied only on this node."
      >
        <Textarea
          value={data.custom_entities ?? ""}
          onChange={(v) => update({ custom_entities: v })}
          placeholder={`e.g. Apollo11, ProjectX\nor: [{"pattern":"\\bUID-\\d{4}\\b","criticality":"HIGH"}]`}
          style={{
            height: "80px",
            fontFamily: "Roboto Mono, monospace",
            fontSize: 11,
          }}
        />
      </Field>

      <div
        style={{
          borderRadius: 10,
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          onClick={() => setAdvancedOpen((o) => !o)}
          style={{
            padding: "10px 14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#F8FAFC",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FiBox size={12} color="var(--text-muted)" /> ADVANCED — I/O ROUTING
          </span>
          <FiChevronDown
            size={14}
            style={{
              color: "var(--text-muted)",
              transform: advancedOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </div>
        {advancedOpen && (
          <div style={{ padding: "14px 14px 2px" }}>
            <Field
              label="Input Context Key"
              hint="Context key that holds the text to scan. Defaults to latest_ocr_output."
            >
              <Input
                value={data.classification_input_key ?? "latest_ocr_output"}
                onChange={(v) => update({ classification_input_key: v })}
                placeholder="e.g. latest_ocr_output"
              />
            </Field>
            <Field
              label="Output Context Key"
              hint="Where to store the result dict. Leave blank to auto-name it."
            >
              <Input
                value={data.classification_output_key ?? ""}
                onChange={(v) => update({ classification_output_key: v })}
                placeholder="e.g. sensitivity_result"
              />
            </Field>
          </div>
        )}
      </div>    </>
  );
}
