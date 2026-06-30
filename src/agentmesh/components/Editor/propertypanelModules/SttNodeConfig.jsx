import React from "react";
import { Field, Toggle } from "./SharedComponents";

const SUPPORTED_LANGS = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'हिंदी (Hindi)' },
  { code: 'ar-SA', label: 'العربية (Arabic)' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'es-ES', label: 'Español' },
  { code: 'zh-CN', label: '中文 (Chinese)' },
  { code: 'ja-JP', label: '日本語 (Japanese)' },
  { code: 'pt-BR', label: 'Português (BR)' },
];

const selectStyle = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: 8,
  border: '1px solid rgba(0,0,0,0.1)',
  fontSize: 13,
  fontWeight: 500,
  color: '#1F2937',
  background: '#F9FAFB',
  cursor: 'pointer',
  outline: 'none',
};

export default function SttNodeConfig({ data, update }) {
  const autoStart = data.auto_start === true;
  const autoStop = data.auto_stop !== false; // default true
  const silenceDelay = data.silence_delay ?? 1500;
  const sttLang = data.stt_lang || 'en-US';

  return (
    <>
      {/* ── Start Mode ───────────────────────────────── */}
      <Field
        label="Start Mode"
        hint="Auto Start: recording begins automatically when your voice is detected. Manual: tap the mic to begin."
      >
        <Toggle
          checked={autoStart}
          onChange={(v) => update({ auto_start: v })}
          label={autoStart ? "Auto Start (Voice Activated)" : "Manual Start"}
        />
      </Field>

      {/* ── Stop Mode ────────────────────────────────── */}
      <Field
        label="Stop Mode"
        hint="Auto Stop: recording ends when silence is detected. Manual Stop: click the mic button to finish."
      >
        <Toggle
          checked={autoStop}
          onChange={(v) => update({ auto_stop: v })}
          label={autoStop ? "Auto Stop (On Silence)" : "Manual Stop"}
        />
      </Field>

      {/* ── Silence Delay ────────────────────────────── */}
      {autoStop && (
        <Field
          label={`Silence Pause (${silenceDelay}ms)`}
          hint="How long to wait after silence before auto-submitting. Increase if you pause between words."
        >
          <input
            type="range"
            min={500}
            max={5000}
            step={250}
            value={silenceDelay}
            onChange={(e) => update({ silence_delay: Number(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--theme-primary, #6366F1)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
            <span>0.5s (fast)</span>
            <span style={{ fontWeight: 700, color: '#4B5563' }}>{(silenceDelay / 1000).toFixed(2)}s</span>
            <span>5s (slow)</span>
          </div>
        </Field>
      )}

      {/* ── Language ─────────────────────────────────── */}
      <Field
        label="Recognition Language"
        hint="The language used for speech-to-text. Requires Chrome or Edge browser."
      >
        <select
          value={sttLang}
          onChange={(e) => update({ stt_lang: e.target.value })}
          style={selectStyle}
        >
          {SUPPORTED_LANGS.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </Field>
    </>
  );
}
