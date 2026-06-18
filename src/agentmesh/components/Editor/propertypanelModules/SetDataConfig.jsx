import React from "react";
import { FiInfo } from "react-icons/fi";
import { Field, inputStyle } from "./SharedComponents";

export default function SetDataConfig({ data, update }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <Field
        label="Custom Message"
        hint="The static text this node will output."
      >
        <textarea
          value={data.message || ""}
          onChange={(e) => update({ message: e.target.value })}
          placeholder="Hello! How can I help you today?"
          style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
        />
      </Field>
      <div
        style={{
          padding: 12,
          background: "#F8FAFC",
          borderRadius: 10,
          fontSize: 11,
          color: "#64748B",
          lineHeight: 1.5,
          border: "1px solid var(--border)",
          marginTop: 16,
        }}
      >
        <FiInfo size={12} style={{ marginRight: 6 }} />
        Use this to inject static responses into the conversation without using
        an LLM.
      </div>
    </div>
  );
}
