import React from "react";
import PropTypes from "prop-types";
import { FiFileText } from "react-icons/fi";
import { Field, Input, Textarea } from "./SharedComponents";

export default function TemplateNodeConfig({ data, update }) {
  return (
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
        <FiFileText color="#7C3AED" size={14} /> Template Engine Settings
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
          stripBraces
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
          stripBraces
          value={data.template_output_key ?? "rendered_template"}
          onChange={(v) => update({ template_output_key: v })}
          placeholder="rendered_template"
        />
      </Field>
    </div>
  );
}

TemplateNodeConfig.propTypes = {
  data: PropTypes.shape({
    template_content: PropTypes.string,
    template_file_path: PropTypes.string,
    template_data_key: PropTypes.string,
    template_output_key: PropTypes.string,
  }).isRequired,
  update: PropTypes.func.isRequired,
};
