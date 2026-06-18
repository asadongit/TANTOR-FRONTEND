import React from "react";
import { FiClock } from "react-icons/fi";
import { Toggle, Field, CronHelper, Select } from "./SharedComponents";

export default function CronConfig({ data, update }) {
  return (
    <>
      <Toggle
        checked={data.enabled !== false}
        onChange={(v) => update({ enabled: v })}
        label="Schedule Enabled"
      />
      <Field label="Schedule Configuration">
        <CronHelper
          value={data.cron_expression || ""}
          onChange={(v) => update({ cron_expression: v })}
        />
      </Field>
      <Field label="Timezone">
        <Select
          value={data.timezone || "UTC"}
          onChange={(v) => update({ timezone: v })}
          options={[
            "UTC",
            "local",
            "America/New_York",
            "Europe/London",
            "Asia/Tokyo",
          ]}
        />
      </Field>
      <div
        style={{
          marginTop: 20,
          padding: 12,
          background: "#FFFBEB",
          borderRadius: 10,
          fontSize: 11,
          color: "#92400E",
          lineHeight: 1.5,
          border: "1px solid #FDE68A",
        }}
      >
        <FiClock size={12} style={{ marginRight: 6 }} />
        The Cron trigger automatically executes the workflow at specified
        intervals using the backend scheduler.
      </div>
    </>
  );
}
