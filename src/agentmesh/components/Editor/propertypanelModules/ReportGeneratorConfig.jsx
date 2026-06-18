import React from "react";
import { Select, Field, Input, CommaArrayEditor } from "./SharedComponents";

export default function ReportGeneratorConfig({ data, update }) {
  const fileExt = data.report_file_ext || ".pdf";
  const categories = ["Letter", "Certificate", "Report", "Contract", "Invoice"]; // standard categories

  return (
    <>
      <Field label="Document Category" hint="Choose the template category.">
        <Select
          value={data.report_category || "Report"}
          onChange={(v) => update({ report_category: v })}
          options={categories}
        />
      </Field>

      <Field
        label="Template File"
        hint="Choose the compiled HTML template to render."
      >
        <Input
          value={data.report_template_file || ""}
          onChange={(v) => update({ report_template_file: v })}
          placeholder="e.g., credit_decision_template.html"
        />
      </Field>

      <Field label="Output Extension" hint="Document export format.">
        <Select
          value={data.report_file_ext || ".pdf"}
          onChange={(v) => {
            update({
              report_file_ext: v,
              report_category: "Report",
            });
          }}
          options={[
            { value: ".pdf", label: "PDF Document (.pdf)" },
            { value: ".docx", label: "Word Document (.docx)" },
            { value: ".xlsx", label: "Excel Sheet (.xlsx)" },
            { value: ".csv", label: "Flat CSV (.csv)" },
            { value: ".json", label: "JSON Payload (.json)" },
            { value: ".md", label: "Markdown File (.md)" },
          ]}
        />
      </Field>

      <Field
        label="Output Filename Pattern"
        hint="Supports variable interpolation (e.g. decision_report_{{extracted_identifiers.0.value}}). Extension will be added automatically."
      >
        <Input
          value={data.report_filename_pattern || ""}
          onChange={(v) => update({ report_filename_pattern: v })}
          placeholder="e.g. report_{{customer_uid}}"
        />
      </Field>

      <Field
        label="Destination Context Key"
        hint="Context key to save the generated report details."
      >
        <Input
          value={data.report_destination_key || "generated_report"}
          onChange={(v) => update({ report_destination_key: v })}
          placeholder="generated_report"
        />
      </Field>
    </>
  );
}
