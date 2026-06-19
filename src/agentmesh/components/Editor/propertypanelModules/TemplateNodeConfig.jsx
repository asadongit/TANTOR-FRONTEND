import React from "react";
import { FiFileText, FiInfo } from "react-icons/fi";
import { Field, Input, Textarea } from "./SharedComponents";

export default function TemplateNodeConfig({ data, update }) {
  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <FiFileText color="#3B82F6" size={14} /> Template Engine Settings
        </div>

        <Field
          label="Template Content"
          hint="Define your Jinja2/Markdown template. Use Jinja2 formatting (e.g., {{ latest_message }}, {{ user_input }})."
        >
          <Textarea
            value={data.template_content ?? ""}
            onChange={(v) => update({ template_content: v })}
            placeholder="Hello {{ latest_message }},\n\nYour score is {{ total_score }} out of {{ max_possible_score }}."
            rows={8}
          />
        </Field>

        <Field
          label="Template File Path (Optional)"
          hint="Provide an absolute path to a template file on the server. If set and file exists, its content overrides the Template Content text field above."
        >
          <Input
            value={data.template_file_path ?? ""}
            onChange={(v) => update({ template_file_path: v })}
            placeholder="e.g. C:/templates/my_template.txt"
          />
        </Field>

        <Field
          label="Input Variable Data Key (Optional)"
          hint="Specify the context key (e.g., enriched_transaction) from which to extract variables to inject into the template context. If it points to a dictionary, those fields are merged into the template variables."
        >
          <Input
            value={data.template_data_key ?? ""}
            onChange={(v) => update({ template_data_key: v })}
            placeholder="e.g. enriched_transaction"
          />
        </Field>

        <Field
          label="Output Context Key"
          hint="Context key to save the final rendered string output. Defaults to rendered_template."
        >
          <Input
            value={data.template_output_key ?? "rendered_template"}
            onChange={(v) => update({ template_output_key: v })}
            placeholder="rendered_template"
          />
        </Field>
      </div>

      <div
        style={{
          padding: "12px 14px",
          background: "var(--bg-card-info, #F0F9FF)",
          borderRadius: 10,
          fontSize: 11,
          color: "var(--text-card-info, #0369A1)",
          border: "1px solid var(--border-card-info, #BAE6FD)",
          lineHeight: 1.5,
          marginTop: 18,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <FiInfo size={14} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontWeight: 500 }}>
          Template Engine Node: Renders dynamic text or markdown using Jinja2
          formatting. The global context, <code>latest_message</code>, and
          values under the selected <code>Input Data Key</code> are all exposed
          to your template variables automatically.
        </span>
      </div>
    </>
  );
}
