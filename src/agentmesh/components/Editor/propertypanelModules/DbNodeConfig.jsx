import React from "react";
import { FiBox } from "react-icons/fi";
import { Select, Field, Input, Textarea } from "./SharedComponents";

export default function DbNodeConfig({ data, update }) {
  return (
    <>
      <Field label="Operation" hint="Choose the MongoDB CRUD operation.">
        <Select
          value={data.db_operation || "insert_one"}
          onChange={(v) => update({ db_operation: v })}
          options={[
            { value: "insert_one", label: "Insert One" },
            { value: "insert_many", label: "Insert Many" },
            { value: "find_one", label: "Find One" },
            { value: "find_many", label: "Find Many" },
            { value: "update_one", label: "Update One" },
            { value: "delete_one", label: "Delete One" },
          ]}
        />
      </Field>

      <Field
        label="Connection String"
        hint="MongoDB URI. Leave blank to use backend MONGODB_URI env var."
      >
        <Input
          value={data.db_connection_string || ""}
          onChange={(v) => update({ db_connection_string: v || null })}
          placeholder="mongodb://localhost:27017 (or leave blank)"
          type="password"
        />
      </Field>

      <Field label="Database Name" hint="Target MongoDB database.">
        <Input
          value={data.db_database || ""}
          onChange={(v) => update({ db_database: v })}
          placeholder="e.g. credit_decisioning"
        />
      </Field>

      <Field
        label="Collection Name"
        hint="Target MongoDB collection. Supports {{context.xxx}} interpolation."
      >
        <Input
          value={data.db_collection || ""}
          onChange={(v) => update({ db_collection: v })}
          placeholder="e.g. customer_profiles"
        />
      </Field>

      {["insert_one", "insert_many", "update_one"].includes(
        data.db_operation || "insert_one",
      ) && (
        <Field
          label="Document Template"
          hint="JSON template with {{context.xxx}} placeholders. Use {{__NOW__}} for current timestamp."
        >
          <Textarea
            value={
              typeof data.db_document === "string"
                ? data.db_document
                : JSON.stringify(data.db_document || {}, null, 2)
            }
            onChange={(v) => {
              try {
                update({ db_document: JSON.parse(v) });
              } catch {
                update({ db_document: v });
              }
            }}
            placeholder={
              '{\n  "name": "{{extracted_identifiers.0.value}}",\n  "status": "completed",\n  "created_at": "{{__NOW__}}"\n}'
            }
            rows={8}
          />
        </Field>
      )}

      {["find_one", "find_many", "update_one", "delete_one"].includes(
        data.db_operation || "insert_one",
      ) && (
        <Field
          label="Query Filter"
          hint="MongoDB query filter with {{context.xxx}} placeholders."
        >
          <Textarea
            value={
              typeof data.db_query === "string"
                ? data.db_query
                : JSON.stringify(data.db_query || {}, null, 2)
            }
            onChange={(v) => {
              try {
                update({ db_query: JSON.parse(v) });
              } catch {
                update({ db_query: v });
              }
            }}
            placeholder={'{\n  "customer_uid": "{{customer_uid}}"\n}'}
            rows={4}
          />
        </Field>
      )}

      {["find_one", "find_many"].includes(
        data.db_operation || "insert_one",
      ) && (
        <Field label="Output Key" hint="Context key to store query results.">
          <Input
            value={data.db_output_key || "db_result"}
            onChange={(v) => update({ db_output_key: v })}
            placeholder="db_result"
          />
        </Field>
      )}

      {(data.db_operation || "insert_one") === "find_many" && (
        <Field label="Limit" hint="Maximum documents to return.">
          <Input
            type="number"
            value={data.db_limit || 100}
            onChange={(v) => update({ db_limit: parseInt(v) || 100 })}
            placeholder="100"
          />
        </Field>
      )}

      <div
        style={{
          padding: "12px 14px",
          background: "#D1FAE5",
          borderRadius: 10,
          fontSize: 11,
          color: "#065F46",
          border: "1px solid #A7F3D0",
          lineHeight: 1.5,
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <FiBox size={14} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontWeight: 500 }}>
          MongoDB node performs real database operations. Use{" "}
          {"{{context.xxx}}"} in document templates to inject workflow data
          dynamically.
        </span>
      </div>
    </>
  );
}
