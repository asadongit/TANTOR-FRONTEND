import React, { memo } from "react";
import {
  VariablePicker,
  Field,
  Input,
  Textarea,
  Select,
  Toggle,
} from "./SharedComponents";

const NotificationConfig = memo(function NotificationConfig({ data, update }) {
  return (
    <>
      <VariablePicker
        onSelect={(v) =>
          update({
            notification_message: (data.notification_message || "") + v,
          })
        }
      />
      <Field
        label="Notification Title"
        hint="Supports {{variable}} interpolation."
      >
        <Input
          value={data.notification_title || ""}
          onChange={(v) => update({ notification_title: v })}
          placeholder="e.g. Workflow {{name}} Finished"
        />
      </Field>
      <Field
        label="Message Content"
        hint="The main body of the notification. Supports {{variable}} interpolation."
      >
        <Textarea
          value={data.notification_message || ""}
          onChange={(v) => update({ notification_message: v })}
          placeholder="Details of the event..."
          rows={5}
        />
      </Field>
      <Field label="Alert Type">
        <Select
          value={data.notification_type || "info"}
          onChange={(v) => update({ notification_type: v })}
          options={[
            { value: "info", label: "Info (Blue)" },
            { value: "success", label: "Success (Green)" },
            { value: "warning", label: "Warning (Yellow)" },
            { value: "error", label: "Error (Red)" },
          ]}
        />
      </Field>
      <Toggle
        label="Enable 'Open Chat' Button"
        checked={data.show_chat_button || false}
        onChange={(v) => update({ show_chat_button: v })}
      />
    </>
  );
});

export default NotificationConfig;
