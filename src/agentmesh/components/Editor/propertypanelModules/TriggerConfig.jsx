import React from "react";
import { Field, Input, Textarea, Select } from "./SharedComponents";

const BUTTON_CATEGORIES = [
  { value: 'action', label: 'Action (Indigo)' },
  { value: 'info', label: 'Info (Blue)' },
  { value: 'help', label: 'Help (Purple)' },
  { value: 'success', label: 'Success (Green)' },
  { value: 'reject', label: 'Reject (Orange)' },
  { value: 'risk', label: 'Risk (Red)' },
  { value: 'delete', label: 'Delete (Rose)' }
];

export default function TriggerConfig({ data, update }) {
  const isButton = data.type === "button_trigger";
  return (
    <>
      {isButton && (
        <Field
          label="Button Label"
          hint="The text displayed on the button in the Run Panel."
        >
          <Input
            value={data.button_label || ''}
            onChange={(v) => update({ button_label: v })}
            placeholder="e.g. Generate Report"
          />
        </Field>
      )}
      {isButton && (
        <Field
          label="Button Theme / Style"
          hint="Determines the color coding of the button."
        >
          <Select
            value={data.button_category || 'action'}
            onChange={(v) => update({ button_category: v })}
            options={BUTTON_CATEGORIES}
          />
        </Field>
      )}
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
    </>
  );
}
