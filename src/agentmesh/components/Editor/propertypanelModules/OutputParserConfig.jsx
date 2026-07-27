import React from "react";
import { Field, Select, Input } from "./SharedComponents";

export default function OutputParserConfig({ data, update }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <Field
        label="Parse Mode"
        hint="'auto' tries standard then repairs, 'json' forces JSON, 'strict' fails on error."
      >
        <Select
          value={data.parse_mode || "auto"}
          onChange={(v) => update({ parse_mode: v })}
          options={[
            { value: "auto", label: "Auto (smart fallback)" },
            { value: "json", label: "Force JSON" },
            { value: "strict", label: "Strict (fail on error)" },
          ]}
        />
      </Field>
      <Field
        label="Fallback to Raw"
        hint="If parsing fails, return original message instead of error."
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={data.fallback_to_raw !== false}
            onChange={(e) => update({ fallback_to_raw: e.target.checked })}
            style={{ width: 18, height: 18, cursor: "pointer" }}
          />
          <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
            Return raw data on parse failure
          </span>
        </div>
      </Field>
      <Field
        label="Context Key (Optional)"
        hint="Key to store parsed result in context (default: parsed_output). Leave blank to use default."
      >
        <Input
          stripBraces
          value={data.output_context_key || ""}
          onChange={(v) => update({ output_context_key: v || undefined })}
          placeholder="parsed_output"
        />
      </Field>
    </div>
  );
}
