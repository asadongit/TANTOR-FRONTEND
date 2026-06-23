import React from "react";
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
    </>
  );
}

