import React from "react";
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
    </div>
  );
}
