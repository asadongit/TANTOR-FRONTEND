import React, { memo } from "react";
import PropTypes from "prop-types";
import {
  Field,
  Select,
  Toggle,
  Textarea,
  Input,
  AdvancedSection,
} from "./SharedComponents";


const TextToAudioConfig = memo(function TextToAudioConfig({
  data,
  update,
  nodes,
  selectedNodeId,
  hitlSection,
}) {
  const libraryOptions = [
    { value: "piper", label: "Piper (Offline Local)" },
    { value: "kittentts", label: "KittenTTS (Fast CPU)" },
  ];

  const piperVoiceOptions = [
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

  const kittenVoiceOptions = [
    { value: "Bella", label: "Bella" },
    { value: "Jasper", label: "Jasper" },
    { value: "Luna", label: "Luna" },
    { value: "Bruno", label: "Bruno" },
    { value: "Rosie", label: "Rosie" },
    { value: "Hugo", label: "Hugo" },
    { value: "Kiki", label: "Kiki" },
    { value: "Leo", label: "Leo" },
  ];

  const kittenModelOptions = [
    { value: "KittenML/kitten-tts-mini-0.8", label: "KittenTTS Mini (80M / 80 MB)" },
    { value: "KittenML/kitten-tts-micro-0.8", label: "KittenTTS Micro (40M / 41 MB)" },
    { value: "KittenML/kitten-tts-nano-0.8", label: "KittenTTS Nano (15M / 56 MB)" },
    { value: "KittenML/kitten-tts-nano-0.8-int8", label: "KittenTTS Nano int8 (15M / 25 MB)" },
  ];

  const currentLibrary = data.tts_library || "piper";
  const voiceOptions = currentLibrary === "kittentts" ? kittenVoiceOptions : piperVoiceOptions;
  const defaultVoice = currentLibrary === "kittentts" ? "Bella" : "en-US-GuyNeural";

  const handleLibraryChange = (newLib) => {
    const defaultVoiceForLib = newLib === "kittentts" ? "Bella" : "en-US-GuyNeural";
    update({
      tts_library: newLib,
      audio_voice: defaultVoiceForLib,
    });
  };

  return (
    <>
      <Field
        label="TTS Library"
        hint="Select the engine/library to synthesize speech."
      >
        <Select
          value={currentLibrary}
          onChange={handleLibraryChange}
          options={libraryOptions}
        />
      </Field>

      <div style={{ margin: "16px 0" }} />

      {currentLibrary === "kittentts" && (
        <>
          <Field
            label="KittenTTS Model"
            hint="Choose the specific model version (automatically downloads if not cached)."
          >
            <Select
              value={data.kittentts_model || "KittenML/kitten-tts-micro-0.8"}
              onChange={(v) => update({ kittentts_model: v })}
              options={kittenModelOptions}
            />
          </Field>

          <div style={{ margin: "16px 0" }} />
        </>
      )}

      <Field
        label="Voice Model"
        hint="Select the voice model to convert text to speech."
      >
        <Select
          value={data.audio_voice || defaultVoice}
          onChange={(v) => update({ audio_voice: v })}
          options={voiceOptions}
        />
      </Field>

      <div style={{ margin: "16px 0" }} />

      {currentLibrary === "kittentts" && (
        <>
          <Field
            label="Speech Speed"
            hint="Set the speech speed multiplier (e.g. 1.0 is standard, 1.2 is faster, 0.9 is slower)."
          >
            <Input
              type="number"
              step="0.05"
              min="0.1"
              max="3.0"
              value={data.audio_speed !== undefined ? data.audio_speed : 1.0}
              onChange={(v) => {
                const num = parseFloat(v);
                update({ audio_speed: isNaN(num) ? 1.0 : num });
              }}
            />
          </Field>

          <div style={{ margin: "16px 0" }} />
        </>
      )}

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

      <AdvancedSection
        hitlSection={hitlSection}
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        onErrorValue={data.on_error}
        onErrorChange={(v) => update({ on_error: v })}
        onErrorHint="If audio generation fails, jump to this error handler."
      />
    </>
  );
});

TextToAudioConfig.propTypes = {
  data: PropTypes.shape({
    tts_library: PropTypes.string,
    kittentts_model: PropTypes.string,
    audio_voice: PropTypes.string,
    audio_speed: PropTypes.number,
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
