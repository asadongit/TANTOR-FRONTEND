import React from "react";
import { Select, Field, Input, CommaArrayEditor } from "./SharedComponents";

export default function IngestionRouterConfig({ data, update }) {
  return (
    <>
      <Field
        label="Scan Mode"
        hint="How should this router handle the payload?"
      >
        <Select
          value={data.scan_mode || "auto"}
          onChange={(v) => update({ scan_mode: v })}
          options={[
            { value: "auto", label: "Auto Detect" },
            { value: "files", label: "Files Only" },
            { value: "directory", label: "Directory Bulk Dispatch" },
          ]}
        />
      </Field>

      <div
        style={{
          marginTop: 12,
          borderTop: "1px solid var(--border)",
          paddingTop: 12,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: "var(--text-muted)",
            marginBottom: 12,
            textTransform: "uppercase",
          }}
        >
          Payload Keys Setup
        </div>

        <Field
          label="Parent Folder Key"
          hint="Key for macro-bulk processing (default: 'parent_folder_path')."
        >
          <Input
            stripBraces
            value={data.parent_folder_key || "parent_folder_path"}
            onChange={(v) => update({ parent_folder_key: v })}
            placeholder="parent_folder_path"
          />
        </Field>

        <Field
          label="Folder / Item Identifier Key"
          hint="Key used to pass the item's name to the child workflow (default: 'customer_folder_name')."
        >
          <Input
            stripBraces
            value={data.folder_identifier_key || "customer_folder_name"}
            onChange={(v) => update({ folder_identifier_key: v })}
            placeholder="customer_folder_name"
          />
        </Field>

        <Field
          label="cURL Command Key"
          hint="Key containing a cURL command string to execute for JSON endpoints (default: 'curl_command')."
        >
          <Input
            stripBraces
            value={data.curl_command_key || "curl_command"}
            onChange={(v) => update({ curl_command_key: v })}
            placeholder="curl_command"
          />
        </Field>
      </div>

      <Field
        label="File Filters"
        hint="Comma-separated extensions for bulk directory scanning (e.g. .pdf, .jpg)"
      >
        <CommaArrayEditor
          value={data.file_filters || [".pdf", ".jpg", ".png", ".jpeg"]}
          onChange={(v) => update({ file_filters: v })}
          placeholder=".pdf, .jpg, .png"
        />
      </Field>

      <Field
        label="Concurrency Limit"
        hint="Maximum number of parallel child workflows to spawn (Semaphore limit)."
      >
        <Input
          type="number"
          value={data.concurrency_limit ?? 5}
          onChange={(v) =>
            update({ concurrency_limit: v === "" ? "" : parseInt(v) })
          }
        />
      </Field>
    </>
  );
}
