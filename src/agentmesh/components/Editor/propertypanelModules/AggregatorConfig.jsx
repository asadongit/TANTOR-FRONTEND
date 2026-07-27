import React from "react";
import { Field, Select, Input } from "./SharedComponents";

export default function AggregatorConfig({ data, update }) {
  return (
    <>
      <Field label="Action Strategy" hint="How to group the incoming items.">
        <Select
          value={data.action || "append"}
          onChange={(v) => update({ action: v })}
          options={[
            { value: "append", label: "Append to List (Array)" },
            { value: "merge", label: "Merge into Object (Dict)" },
            { value: "concatenate", label: "Concatenate (String)" },
          ]}
        />
      </Field>
      <Field
        label="Field to Aggregate"
        hint="The path to the data you want to collect (e.g. 'item')."
      >
        <Input
          stripBraces
          value={data.field_to_aggregate || "item"}
          onChange={(v) => update({ field_to_aggregate: v })}
          placeholder="item"
        />
      </Field>
      <Field
        label="Destination Field"
        hint="Where to store the final combined result."
      >
        <Input
          stripBraces
          value={data.destination_field || "aggregated_results"}
          onChange={(v) => update({ destination_field: v })}
          placeholder="aggregated_results"
        />
      </Field>
      {data.action === "concatenate" && (
        <Field
          label="Separator"
          hint="Characters used to join strings (e.g. \n)."
        >
          <Input
            value={data.separator || "\\n"}
            onChange={(v) => update({ separator: v })}
            placeholder="\\n"
          />
        </Field>
      )}
    </>
  );
}
