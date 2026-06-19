import React from "react";
import { FiInfo } from "react-icons/fi";
import { Field, Textarea, LogicHelper } from "./SharedComponents";

export default function ConditionConfig({ data, update }) {
  return (
    <>
      <Field
        label="Condition Expression"
        hint="Evaluate state variables using Python logic. Tip: Use variable names directly (e.g. value == 1) or check the message with 'msg'."
      >
        <Textarea
          value={data.condition || ""}
          onChange={(v) => update({ condition: v })}
          placeholder="value == 'approve' or 'ready' in msg"
          rows={4}
        />
      </Field>
      <LogicHelper />
      <div
        style={{
          padding: 12,
          background: "#FFFBEB",
          borderRadius: 10,
          fontSize: 11,
          color: "#92400E",
          lineHeight: 1.5,
          border: "1px solid #FDE68A",
          marginTop: 10,
        }}
      >
        <FiInfo size={12} style={{ marginRight: 6 }} />
        Connect two edges from this node. Label one <strong>true</strong> and
        the other <strong>false</strong>.
      </div>
    </>
  );
}
