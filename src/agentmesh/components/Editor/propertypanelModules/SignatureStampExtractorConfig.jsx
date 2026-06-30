import React from "react";
import {
  Field,
  Input,
  LLMConfigSection,
} from "./SharedComponents";

export default function SignatureStampExtractorConfig({ data, update }) {
  return (
    <>
      <Field
        label="Input File Path Key"
        hint="Context key containing the file path or list of file paths to extract from (e.g. latest_file_path)."
      >
        <Input
          value={data.extractor_input_key || "latest_file_path"}
          onChange={(v) => update({ extractor_input_key: v })}
          placeholder="latest_file_path"
        />
      </Field>

      <Field
        label="Destination Key"
        hint="Context key where the extracted signatures and stamps list will be saved."
      >
        <Input
          value={data.extractor_output_key || "extracted_elements"}
          onChange={(v) => update({ extractor_output_key: v })}
          placeholder="extracted_elements"
        />
      </Field>

      <div
        style={{
          marginTop: 20,
          borderTop: "1px solid var(--border)",
          paddingTop: 20,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          Vision Model Settings
        </div>
        <LLMConfigSection
          llm={data.llm}
          onChange={(v) => update({ llm: v })}
        />
      </div>
    </>
  );
}
