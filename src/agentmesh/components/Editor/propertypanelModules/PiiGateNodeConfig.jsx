import React from "react";
import { Field, Input, Toggle } from "./SharedComponents";

export default function PiiGateNodeConfig({ data, update }) {
  return (
    <>
      <div
        style={{
          padding: "14px 16px",
          background: "#F0FDF4",
          borderRadius: 12,
          fontSize: 12,
          color: "#166534",
          border: "1px solid #BBF7D0",
          lineHeight: 1.6,
          marginTop: 8,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>
          🛡️ PII Verification Gate
        </div>
        <div style={{ color: "#14532D", fontSize: 11 }}>
          Pauses the workflow and saves a draft of the OCR results to the
          database for human review before allowing the pipeline to continue.
        </div>
      </div>

      <Field
        label="Input Key"
        hint="Context key containing the OCR extraction results."
      >
        <Input
          value={data.input_key || "latest_ocr_output"}
          onChange={(v) => update({ input_key: v })}
          placeholder="latest_ocr_output"
        />
      </Field>

      <div
        style={{
          marginTop: 24,
          padding: 16,
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          background: "#F8FAFC",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 12,
          }}
        >
          Execution Control
        </div>
        <Toggle
          checked={data.interrupt_after !== false}
          onChange={(v) => update({ interrupt_after: v })}
          label="Pause Workflow For Human Review (interrupt_after)"
        />
        <div
          style={{
            fontSize: 10,
            color: "#64748B",
            marginTop: 4,
            marginLeft: 28,
          }}
        >
          Essential for Human-in-the-Loop. The workflow will halt until the
          verification is completed in the dashboard.
        </div>
      </div>
    </>
  );
}
