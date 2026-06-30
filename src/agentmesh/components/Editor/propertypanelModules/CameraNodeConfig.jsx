import React from 'react';
import PropTypes from 'prop-types';
import {
  Field,
  Input,
  Textarea,
} from "./SharedComponents";

export default function CameraNodeConfig({ data, update }) {
  return (
    <>
      <Field
        label="Camera Form Title"
        hint="The heading shown at the top of the camera capture modal."
      >
        <Input
          value={data.form_title || ""}
          onChange={(v) => update({ form_title: v })}
          placeholder="e.g. Camera Verification"
        />
      </Field>
      <Field
        label="Description / Instructions"
        hint="Introductory text or instructions for the user."
      >
        <Textarea
          value={data.form_description || ""}
          onChange={(v) => update({ form_description: v })}
          placeholder="e.g. Please align your face in the frame and capture a live image for verification."
          rows={3}
        />
      </Field>

      <Field
        label="Submit Button Label"
        hint="The label shown on the submit button."
      >
        <Input
          value={data.form_submit_label || "Submit Photo"}
          onChange={(v) => update({ form_submit_label: v })}
          placeholder="Submit Photo"
        />
      </Field>
    </>
  );
}

CameraNodeConfig.propTypes = {
  data: PropTypes.shape({
    form_title: PropTypes.string,
    form_description: PropTypes.string,
    form_submit_label: PropTypes.string,
  }).isRequired,
  update: PropTypes.func.isRequired,
};
