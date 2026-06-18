import React from "react";
import { FiInfo } from "react-icons/fi";
import { Select, Field, Input } from "./SharedComponents";

export default function DataCleaningConfig({ data, update }) {
  return (
    <>
      <Field
        label="Cleaning Rules"
        hint="Select the data cleaning rules to apply to the dataset."
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            background: "#F8FAFC",
            padding: 12,
            borderRadius: 10,
            border: "1px solid var(--border)",
          }}
        >
          {[
            {
              value: "GEN_TRIM_WHITESPACE",
              label: "Trim Whitespace",
              desc: "Remove leading and trailing whitespaces",
            },
            {
              value: "GEN_PROPER_CASE",
              label: "Proper Case",
              desc: "Capitalize first letter of each word (Title Case)",
            },
            {
              value: "GEN_STRIP_SPECIAL_CHARS",
              label: "Strip Special Characters",
              desc: "Remove all non-alphanumeric characters except spaces",
            },
            {
              value: "GEN_STRIP_CURRENCY",
              label: "Strip Currency Symbols",
              desc: "Remove currency signs ($, ₹, €, etc.) and parse as numbers",
            },
            {
              value: "GEN_NORMALIZE_CATEGORY",
              label: "Normalize Category",
              desc: "Lowercase, clean, and convert to snake_case",
            },
          ].map((rule) => {
            const rules = data.data_cleaning_rules || [];
            const isChecked = rules.includes(rule.value);
            const handleRuleToggle = (checked) => {
              const nextRules = checked
                ? [...rules, rule.value]
                : rules.filter((r) => r !== rule.value);
              update({ data_cleaning_rules: nextRules });
            };

            return (
              <div
                key={rule.value}
                style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleRuleToggle(e.target.checked)}
                  style={{ marginTop: 3, cursor: "pointer" }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {rule.label}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {rule.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Field>

      <Field label="Data Source Target" hint="Where is the data coming from?">
        <Select
          value={data.data_cleaning_target || "latest_message"}
          onChange={(v) => update({ data_cleaning_target: v })}
          options={[
            { value: "latest_message", label: "Latest Chat Message" },
            { value: "context_data", label: "Workflow Context Key" },
          ]}
        />
      </Field>

      {data.data_cleaning_target === "context_data" && (
        <Field
          label="Source Context Key"
          hint="Specify the context key where the input JSON string/dictionary is stored."
        >
          <Input
            value={data.data_cleaning_input_key || ""}
            onChange={(v) => update({ data_cleaning_input_key: v })}
            placeholder="e.g. raw_input_json"
          />
        </Field>
      )}

      <Field
        label="Output Context Key"
        hint="The context key where the cleaned dataset (dict or list) and execution metrics will be saved."
      >
        <Input
          value={data.data_cleaning_output_key || "cleaned_data"}
          onChange={(v) => update({ data_cleaning_output_key: v })}
          placeholder="cleaned_data"
        />
      </Field>

      <div
        style={{
          marginTop: 20,
          padding: 12,
          background: "#ECFDF5",
          borderRadius: 10,
          fontSize: 11,
          color: "#059669",
          lineHeight: 1.5,
          border: "1px solid #A7F3D0",
        }}
      >
        <FiInfo size={12} style={{ marginRight: 6 }} />
        Loads a JSON string/dictionary, runs a Pandas data cleaning script, and
        outputs the cleaned dataset plus execution metrics (issues found, fixes
        applied).
      </div>
    </>
  );
}
