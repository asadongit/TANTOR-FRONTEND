import {
  Field,
  Input,
  Textarea,
  Toggle,
  FormFieldsEditor,
  FormDecisionsEditor,
  InfoBanner,
} from "./SharedComponents";


export default function FormNodeConfig({ data, update }) {
  return (
    <>
      <Field
        label="Form Title"
        hint="The heading shown at the top of the form."
      >
        <Input
          value={data.form_title || ""}
          onChange={(v) => update({ form_title: v })}
          placeholder="e.g. Please Provide Information"
        />
      </Field>
      <Field
        label="Form Description"
        hint="Introductory text or instructions for the user."
      >
        <Textarea
          value={data.form_description || ""}
          onChange={(v) => update({ form_description: v })}
          placeholder="e.g. Tell us more about your request so we can assist you better."
          rows={3}
        />
      </Field>

      <FormFieldsEditor
        fields={data.form_fields || []}
        onChange={(f) => update({ form_fields: f })}
      />

      <FormDecisionsEditor
        decisions={data.form_decisions || []}
        onChange={(d) => update({ form_decisions: d })}
      />

      {(!data.form_decisions || data.form_decisions.length === 0) && (
        <Field
          label="Submit Button Label"
          hint="Fallback single button label if no custom Decision Buttons are defined."
        >
          <Input
            value={data.form_submit_label || "Submit"}
            onChange={(v) => update({ form_submit_label: v })}
            placeholder="Submit"
          />
        </Field>
      )}

      <Toggle
        label="Dynamic Schema (from Context)"
        checked={data.form_use_context_schema || false}
        onChange={(v) => update({ form_use_context_schema: v })}
      />
      {data.form_use_context_schema && (
        <InfoBanner type="info">
          If enabled, the form will be generated from <code>context.form_schema</code> (must be a JSON array of fields) instead of the static fields above.
        </InfoBanner>
      )}


    </>
  );
}
