import React from "react";
import { Field, Textarea } from "./SharedComponents";

export default function TriggerConfig({ data, update }) {
  const isButton = data.type === "button_trigger";
  return (
    <Field
      label="Initial Input"
      hint={
        isButton
          ? "The text sent to the workflow when the button is clicked."
          : "The text sent to the workflow when triggered automatically."
      }
    >
      <Textarea
        value={data.button_input || "Start"}
        onChange={(v) => update({ button_input: v })}
        placeholder={
          isButton
            ? "e.g. Please generate the daily report"
            : "e.g. Auto run workflow"
        }
        rows={3}
      />
    </Field>
  );
}
