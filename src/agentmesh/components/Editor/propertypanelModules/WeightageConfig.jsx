import React from "react";
import { FiInfo } from "react-icons/fi";
import { Field, Input, WeightageCategoriesEditor } from "./SharedComponents";

export default function WeightageConfig({ data, update }) {
  return (
    <>
      <Field
        label="Output Context Key"
        hint="The context key where the final weightage scoring JSON breakdown is saved. Defaults to weightage_result."
      >
        <Input
          value={data.weightage_output_key ?? "weightage_result"}
          onChange={(v) => update({ weightage_output_key: v })}
          placeholder="weightage_result"
        />
      </Field>

      <WeightageCategoriesEditor
        categories={data.weightage_categories || []}
        onChange={(cats) => update({ weightage_categories: cats })}
      />

      <div
        style={{
          padding: "12px 14px",
          background: "var(--bg-card-info, #F0F9FF)",
          borderRadius: 10,
          fontSize: 11,
          color: "var(--text-card-info, #0369A1)",
          border: "1px solid var(--border-card-info, #BAE6FD)",
          lineHeight: 1.5,
          marginTop: 18,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <FiInfo size={14} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontWeight: 500 }}>
          Weightage Scoring: Evaluates dynamic conditions across categories and
          fields. Calculates total raw scores, maximum possible scores, and
          normalized percentages (0-100%). Supports Jinja2 variables (e.g.{" "}
          <code>{`{{anualcredit}}`}</code>).
        </span>
      </div>
    </>
  );
}
