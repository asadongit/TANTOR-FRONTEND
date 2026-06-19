import React, { memo } from "react";
import PropTypes from "prop-types";
import {
  Field,
  Select,
  Toggle,
  Textarea,
  CollapsibleSection,
  ErrorTargetField,
} from "./SharedComponents";

const TextToAudioConfig = memo(function TextToAudioConfig({
  data,
  update,
  nodes,
  selectedNodeId,
  hitlSection,
}) {
  const voiceOptions = [
    { value: "en_US-amy", label: "English (US) - Amy" },
    { value: "en_GB-alba", label: "English (UK) - Alba" },
    { value: "zh_CN-huayan", label: "Chinese - Huayan" },
    { value: "ru_RU-dmitri", label: "Russian - Dmitri" },
    { value: "hi_IN-priyamvada", label: "Hindi - Priyamvada" },
    { value: "hi_IN-rohan", label: "Hindi - Rohan" },
    { value: "en-US-GuyNeural", label: "English (US) - Guy Neural" },
    { value: "en-US-JennyNeural", label: "English (US) - Jenny Neural" },
    { value: "en-GB-SoniaNeural", label: "English (UK) - Sonia Neural" },
    { value: "zh-CN-XiaoxiaoNeural", label: "Chinese - Xiaoxiao Neural" },
  ];

  return (
    <>
      <Field
        label="Voice Model"
        hint="Select the voice model to convert text to speech."
      >
        <Select
          value={data.audio_voice || "en-US-GuyNeural"}
          onChange={(v) => update({ audio_voice: v })}
          options={voiceOptions}
        />
      </Field>

      <div style={{ margin: "16px 0" }} />

      <Field
        label="Custom Text / Speech Input"
        hint="Optional. Provide custom static text or context variables (e.g. {{my_var}}). If empty, falls back to the previous node's output message."
      >
        <Textarea
          value={data.audio_input_text || ""}
          onChange={(v) => update({ audio_input_text: v })}
          placeholder="e.g. Hello, this is a custom speech message..."
          rows={3}
        />
      </Field>

      <div style={{ margin: "16px 0" }} />

      <Toggle
        checked={data.mute_audio || false}
        onChange={(v) => update({ mute_audio: v })}
        label="Mute Audio Generation"
      />

      <CollapsibleSection title="Advanced Options">
        {hitlSection}
        {hitlSection && (
          <div
            style={{
              height: "1px",
              background: "var(--border)",
              margin: "16px 0",
            }}
          />
        )}
        <ErrorTargetField
          value={data.on_error}
          onChange={(v) => update({ on_error: v })}
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          hint="If audio generation fails, jump to this error handler."
        />
      </CollapsibleSection>
    </>
  );
});

TextToAudioConfig.propTypes = {
  data: PropTypes.shape({
    audio_voice: PropTypes.string,
    mute_audio: PropTypes.bool,
    audio_input_text: PropTypes.string,
    on_error: PropTypes.string,
  }).isRequired,
  update: PropTypes.func.isRequired,
  nodes: PropTypes.array.isRequired,
  selectedNodeId: PropTypes.string.isRequired,
  hitlSection: PropTypes.node,
};

export default TextToAudioConfig;
