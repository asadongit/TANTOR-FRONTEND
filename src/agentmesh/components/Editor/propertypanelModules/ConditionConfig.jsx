import React from "react";
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
    </>
  );
}

