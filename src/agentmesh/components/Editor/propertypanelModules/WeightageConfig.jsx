import React from "react";
import { Field, Input, WeightageCategoriesEditor } from "./SharedComponents";

export default function WeightageConfig({ data, update }) {
  return (
    <>
      <Field
        label="Output Context Key"
        hint="The context key where the final weightage scoring JSON breakdown is saved. Defaults to weightage_result."
      >
        <Input
          value={data.weightage_output_key ?? "weightage_result"}
          onChange={(v) => update({ weightage_output_key: v })}
          placeholder="weightage_result"
        />
      </Field>

      <WeightageCategoriesEditor
        categories={data.weightage_categories || []}
        onChange={(cats) => update({ weightage_categories: cats })}
      />
    </>
  );
}
