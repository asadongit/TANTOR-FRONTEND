import React from "react";

import {
  Select,
  Field,
  Input,
  Toggle,
  CustomRegexEditor,
} from "./SharedComponents";

export default function PiiNodeConfig({ data, update }) {
  return (
    <>
      <Field
        label="Masking Engine"
        hint="WHO performs the masking. Local is fast but destructive; DocBot is enterprise-grade with encrypted vault and reversible tokens."
      >
        <Select
          value={data.pii_engine || "local"}
          onChange={(v) => update({ pii_engine: v })}
          options={[
            { value: "local", label: "Local (DataFog — Fast, In-Process)" },
            {
              value: "docbot",
              label: "External (DocBot — Vaulted, Reversible)",
            },
          ]}
        />
      </Field>

      {(data.pii_engine || "local") === "local" && (
        <>
          <Field
            label="Detection Algorithm"
            hint="Regex is fast (pattern-matching). GLiNER uses NLP for context-aware detection."
          >
            <Select
              value={data.datafog_engine || "regex"}
              onChange={(v) => update({ datafog_engine: v })}
              options={[
                { value: "regex", label: "Regex (Fast, Pattern-based)" },
                { value: "gliner", label: "GLiNER (NLP, Context-aware)" },
              ]}
            />
          </Field>
          <div
            style={{
              padding: "10px 12px",
              background: "#FEF3C7",
              borderRadius: 8,
              fontSize: 10,
              color: "#92400E",
              border: "1px solid #FDE68A",
              lineHeight: 1.5,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <FiAlertTriangle
              size={14}
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <span>
              <strong>Destructive masking:</strong> Original data is permanently
              replaced with placeholders (e.g., [PERSON]). Not reversible. For
              reversible masking with a secure vault, use the DocBot engine.
            </span>
          </div>
        </>
      )}

      {data.pii_engine === "docbot" && (
        <>
          <Field
            label="DocBot API URL"
            hint="Base URL of the DocBot PII service."
          >
            <Input
              value={data.docbot_url || "http://localhost:8000"}
              onChange={(v) => update({ docbot_url: v })}
              placeholder="http://localhost:8000"
            />
          </Field>
          <Field
            label="DocBot Method"
            hint="Local = regex only (fast). Hybrid = regex + LLM verification (more accurate, slower)."
          >
            <Select
              value={data.docbot_method || "local"}
              onChange={(v) => update({ docbot_method: v })}
              options={[
                { value: "local", label: "Local (Regex — Fast)" },
                { value: "hybrid", label: "Hybrid (Regex + LLM — Accurate)" },
              ]}
            />
          </Field>
          <div
            style={{
              padding: "10px 12px",
              background: "#ECFDF5",
              borderRadius: 8,
              fontSize: 10,
              color: "#065F46",
              border: "1px solid #A7F3D0",
              lineHeight: 1.5,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <FiShield size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>Enterprise vault:</strong> Original PII is encrypted and
              stored in DocBot's secure vault. Masked tokens (e.g.,
              [PAN_a3f82b1c]) are reversible via the /pii/reveal endpoint.
            </span>
          </div>
        </>
      )}

      <hr
        style={{
          border: "none",
          borderTop: "1px solid var(--border)",
          margin: "16px 0",
          opacity: 0.4,
        }}
      />

      <Field
        label="Redaction Target"
        hint="WHAT data should be scanned and masked. Works with any engine."
      >
        <Select
          value={data.pii_target || "latest_message"}
          onChange={(v) => update({ pii_target: v })}
          options={[
            { value: "latest_message", label: "Latest Message" },
            {
              value: "context_variable",
              label: "Context Variable (JSON-safe)",
            },
            {
              value: "targeted_replacement",
              label: "Targeted Replacement (Precision)",
            },
          ]}
        />
      </Field>

      {data.pii_target === "context_variable" && (
        <Field
          label="Context Key"
          hint="Specific context variable to mask. Leave empty to mask entire context."
        >
          <Input
            value={data.context_variable_key || ""}
            onChange={(v) => update({ context_variable_key: v })}
            placeholder="e.g. user_input or leave empty for all"
          />
        </Field>
      )}

      {data.pii_target === "targeted_replacement" && (
        <>
          <div
            style={{
              padding: "10px 12px",
              background: "#EFF6FF",
              borderRadius: 8,
              fontSize: 10,
              color: "#1E40AF",
              border: "1px solid #BFDBFE",
              lineHeight: 1.5,
              marginBottom: 8,
            }}
          >
            <strong>Precision mode:</strong> Takes known sensitive values (from
            an upstream Extract Identifiers node) and does an exact
            find-and-replace in the rendered text. Zero false positives — only
            masks what you explicitly extracted.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <Field
                label="Identifiers Input Key"
                hint="Context key containing extracted identifiers array."
              >
                <Input
                  value={data.identifiers_input_key || "extracted_identifiers"}
                  onChange={(v) => update({ identifiers_input_key: v })}
                  placeholder="extracted_identifiers"
                />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field
                label="Rendered Text Key"
                hint="Context key containing the text/summaries where values will be masked."
              >
                <Input
                  value={data.rendered_input_key || "ocr_like_results"}
                  onChange={(v) => update({ rendered_input_key: v })}
                  placeholder="ocr_like_results"
                />
              </Field>
            </div>
          </div>
        </>
      )}

      <hr
        style={{
          border: "none",
          borderTop: "1px solid var(--border)",
          margin: "16px 0",
          opacity: 0.4,
        }}
      />

      <CustomRegexEditor
        value={data.pii_custom_regex || []}
        onChange={(v) => update({ pii_custom_regex: v })}
      />

    </>
  );
}
