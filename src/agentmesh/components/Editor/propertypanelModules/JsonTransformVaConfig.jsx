import React from "react";

import {
  Select,
  Field,
  Input,
  CommaArrayEditor,
  VariableLinker,
  KeyValueEditor,
  VariableDropdown,
} from "./SharedComponents";

export default function JsonTransformVaConfig({ data, update }) {
  return (
    <>
      <Field label="Operation" hint="Choose how to transform the JSON data.">
        <Select
          value={data.transform_operation || "flatten"}
          onChange={(v) => update({ transform_operation: v })}
          options={[
            { value: "flatten", label: "Flatten (nested → flat keys)" },
            { value: "pick", label: "Pick (keep only listed fields)" },
            { value: "rename", label: "Rename (change key names)" },
            { value: "omit", label: "Omit (remove specific keys)" },
          ]}
        />
      </Field>

      <Field
        label="Input Key"
        hint="Context variable containing the JSON data."
      >
        <Input
          stripBraces
          value={data.transform_input_key || "payload"}
          onChange={(v) => update({ transform_input_key: v })}
          placeholder="payload"
        />
      </Field>

      <Field
        label="Output Key"
        hint="Context variable where the result will be stored."
      >
        <Input
          stripBraces
          value={data.transform_output_key || "transformed_json"}
          onChange={(v) => update({ transform_output_key: v })}
          placeholder="transformed_json"
        />
      </Field>

      {(data.transform_operation || "flatten") === "flatten" && (
        <Field
          label="Separator"
          hint="Character between nested key segments (e.g., '/' → 'basic_info/name')."
        >
          <Input
            value={data.transform_separator || "/"}
            onChange={(v) => update({ transform_separator: v })}
            placeholder="/"
          />
        </Field>
      )}

      {data.transform_operation === "pick" && (
        <Field
          label={
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              Fields to Pick
              <VariableLinker
                targetType="json_keys"
                onSelect={(variable) => {
                  const current = data.transform_pick_fields || [];
                  update({
                    transform_pick_fields: [
                      ...new Set([...current, ...variable.value]),
                    ],
                  });
                }}
                tooltip="Pick from JSON Keys"
              />
            </div>
          }
          hint="Comma-separated list of field paths to keep (e.g., name,address.city)."
        >
          <CommaArrayEditor
            value={data.transform_pick_fields}
            onChange={(v) => update({ transform_pick_fields: v })}
            placeholder="name, age, address.city"
            isTextarea={true}
            rows={3}
          />
        </Field>
      )}

      {data.transform_operation === "rename" && (
        <KeyValueEditor
          label={
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              Rename Map (Old Key → New Key)
              <VariableLinker
                targetType="json_keys"
                onSelect={(variable) => {
                  const current = data.transform_rename_map || {};
                  const next = { ...current };
                  variable.value.forEach((k) => {
                    if (!(k in next)) next[k] = "";
                  });
                  update({ transform_rename_map: next });
                }}
                tooltip="Pick from JSON Keys"
              />
            </div>
          }
          value={data.transform_rename_map || {}}
          onChange={(v) => update({ transform_rename_map: v })}
          hint="Left = original key name, Right = new key name"
        />
      )}

      {data.transform_operation === "omit" && (
        <Field
          label={
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              Keys to Omit
              <VariableLinker
                targetType="json_keys"
                onSelect={(variable) => {
                  const current = data.transform_omit_keys || [];
                  update({
                    transform_omit_keys: [
                      ...new Set([...current, ...variable.value]),
                    ],
                  });
                }}
                tooltip="Pick from JSON Keys"
              />
            </div>
          }
          hint="Comma-separated list of keys to remove."
        >
          <CommaArrayEditor
            value={data.transform_omit_keys}
            onChange={(v) => update({ transform_omit_keys: v })}
            placeholder="ssn, password, internal_id"
            isTextarea={true}
            rows={3}
          />
        </Field>
      )}    </>
  );
}
