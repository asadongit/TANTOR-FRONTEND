import PropTypes from "prop-types";
import { Select, Field, Input } from "./SharedComponents";
import TemplateMarkerSuggest from "./TemplateMarkerSuggest";

/**
 * Report Generator.
 *
 * Field names here must match what the backend node actually reads. An earlier
 * version of this panel used its own names (report_file_ext, report_category,
 * report_template_file, ...) which the backend never looked at and which the
 * store's save whitelist stripped, so nothing configured here reached the node.
 */
export default function ReportGeneratorConfig({ data, update }) {
  const format = (data.report_format || "docx").replace(".", "");
  const isTemplateMap = data.report_mode === "template_map";

  return (
    <>
      <Field
        label="Output Format"
        hint="What kind of file this node produces."
      >
        <Select
          value={format}
          onChange={(v) => update({ report_format: v })}
          options={[
            { value: "docx", label: "Word Document (.docx)" },
            { value: "xlsx", label: "Excel Workbook (.xlsx)" },
            { value: "pdf", label: "PDF Document (.pdf)" },
            { value: "csv", label: "Flat CSV (.csv)" },
            { value: "json", label: "JSON Payload (.json)" },
            { value: "md", label: "Markdown (.md)" },
          ]}
        />
      </Field>

      <Field
        label="Input Data Key"
        hint="Context key holding the data to render. The node reads this and fills the template from it."
      >
        <Input
          stripBraces
          value={data.input_data_key || ""}
          onChange={(v) => update({ input_data_key: v })}
          placeholder="report_data"
        />
      </Field>

      <Field
        label="Template"
        hint="ID of a template from the template library. Leave blank to generate a plain document with no template."
      >
        <Input
          value={data.template_id || ""}
          onChange={(v) => update({ template_id: v })}
          placeholder="template id, or 'auto'"
        />
      </Field>

      <Field
        label="Template File Path (Optional)"
        hint="Use a template file directly instead of one from the library."
      >
        <Input
          value={data.template_file_path || ""}
          onChange={(v) => update({ template_file_path: v })}
          placeholder="e.g. /templates/my_template.xlsx"
        />
      </Field>

      <Field
        label="Fill Mode"
        hint="How the template is filled. Blank keeps the node's default behaviour."
      >
        <Select
          value={data.report_mode || ""}
          onChange={(v) => update({ report_mode: v || null })}
          options={[
            { value: "", label: "Default" },
            { value: "template_map", label: "Template Map — exact, no AI" },
            { value: "ai_semantic", label: "AI Semantic — for narrative documents" },
          ]}
        />
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
          <b>Template Map</b> scans every sheet or page for{" "}
          <code>{"{{ path }}"}</code> markers and replaces each with the value at
          that path — exactly, with no model involved. Merged cells, number
          formats and the template&apos;s own formulas are preserved. Use this
          for formats someone else defines, such as regulatory returns or
          invoices, where being approximately right is being wrong.
          <br />
          <b>AI Semantic</b> lets a model decide where content belongs. Suited to
          prose documents, never to figures.
        </div>
      </Field>

      {isTemplateMap && (
        <Field
          label="When a marker has no data"
          hint="What to do if the template contains a placeholder the data does not fill."
        >
          <Select
            value={data.report_on_missing_target || "fail"}
            onChange={(v) => update({ report_on_missing_target: v })}
            options={[
              { value: "fail", label: "Fail — do not produce the file (recommended)" },
              { value: "warn", label: "Warn — leave the marker visible in the cell" },
              { value: "skip", label: "Skip — blank the cell" },
            ]}
          />
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
            <b>Fail is the safe default.</b> A document that looks complete with a
            figure missing is more dangerous than one that refuses to be
            produced, because nobody knows to check it.
          </div>
        </Field>
      )}

      {isTemplateMap && format === "xlsx" && <TemplateMarkerSuggest />}

      <Field
        label="Output Filename"
        hint="Base name for the generated file, without the extension. Supports variables."
      >
        <Input
          value={data.output_file_name || ""}
          onChange={(v) => update({ output_file_name: v })}
          placeholder="e.g. report_{{ payload.reference_id }}"
        />
      </Field>

      <div
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          marginTop: 14,
          paddingTop: 10,
          borderTop: "1px solid var(--border)",
        }}
      >
        The generated file is written to disk and its location is placed in the
        context as <code>report_output_path</code>, with{" "}
        <code>report_filename</code> and <code>report_download_url</code>{" "}
        alongside it.
      </div>
    </>
  );
}

ReportGeneratorConfig.propTypes = {
  data: PropTypes.shape({
    report_format: PropTypes.string,
    report_mode: PropTypes.string,
    report_on_missing_target: PropTypes.string,
    input_data_key: PropTypes.string,
    template_id: PropTypes.string,
    template_file_path: PropTypes.string,
    output_file_name: PropTypes.string,
  }),
  update: PropTypes.func.isRequired,
};

ReportGeneratorConfig.defaultProps = { data: {} };
