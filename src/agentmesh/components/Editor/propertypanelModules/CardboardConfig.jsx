import React from "react";
import { Field, Input, Textarea, Toggle } from "./SharedComponents";

const STICKY_COLORS = {
  slate: { name: 'Slate', color: '#64748B' },
  blue: { name: 'Blue', color: '#3B82F6' },
  sky: { name: 'Sky', color: '#0EA5E9' },
  cyan: { name: 'Cyan', color: '#06B6D4' },
  teal: { name: 'Teal', color: '#14B8A6' },
  green: { name: 'Green', color: '#22C55E' },
  emerald: { name: 'Emerald', color: '#10B981' },
  lime: { name: 'Lime', color: '#84CC16' },
  yellow: { name: 'Yellow', color: '#EAB308' },
  amber: { name: 'Amber', color: '#F59E0B' },
  orange: { name: 'Orange', color: '#F97316' },
  red: { name: 'Red', color: '#EF4444' },
  rose: { name: 'Rose', color: '#F43F5E' },
  pink: { name: 'Pink', color: '#EC4899' },
  fuchsia: { name: 'Fuchsia', color: '#D946EF' },
  purple: { name: 'Purple', color: '#A855F7' },
  violet: { name: 'Violet', color: '#8B5CF6' },
  indigo: { name: 'Indigo', color: '#6366F1' }
};

const COLOR_GROUPS = [
  { label: 'Neutral', keys: ['slate'] },
  { label: 'Cool', keys: ['blue', 'sky', 'cyan', 'teal', 'green', 'emerald'] },
  { label: 'Warm', keys: ['lime', 'yellow', 'amber', 'orange', 'red', 'rose'] },
  { label: 'Vivid', keys: ['pink', 'fuchsia', 'purple', 'violet', 'indigo'] }
];

export default function CardboardConfig({ data, update }) {
  const currentColor = data.color || 'slate';

  return (
    <>
      <Field label="Title" hint="The heading title of the sticky note.">
        <Input
          value={data.label || ""}
          onChange={(v) => update({ label: v })}
          placeholder="Sticky Note Title"
        />
      </Field>

      <Field label="Description" hint="The main body text of the sticky note.">
        <Textarea
          value={data.description || ""}
          onChange={(v) => update({ description: v })}
          placeholder="Write note description here..."
          rows={5}
        />
      </Field>

      <Field label="Color Theme" hint="Choose the color theme of the note.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--border, #E2E8F0)' }}>
          {COLOR_GROUPS.map((group) => (
            <div key={group.label}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                {group.label}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {group.keys.map((key) => {
                  const info = STICKY_COLORS[key];
                  const isSelected = key === currentColor;
                  return (
                    <button
                      key={key}
                      onClick={() => update({ color: key })}
                      title={info.name}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        backgroundColor: info.color,
                        border: isSelected ? '2px solid var(--text-primary, #1E293B)' : '2px solid transparent',
                        boxShadow: isSelected
                          ? `0 0 0 2px white inset, 0 2px 6px rgba(0,0,0,0.15)`
                          : '0 1px 3px rgba(0,0,0,0.08)',
                        cursor: 'pointer',
                        padding: 0,
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.transform = 'scale(1.08)'; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.transform = 'scale(1)'; }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          <div style={{
            marginTop: 4,
            padding: '6px 10px',
            borderRadius: 6,
            background: STICKY_COLORS[currentColor]?.color || '#64748B',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            textAlign: 'center',
            letterSpacing: '0.03em',
            transition: 'background 0.2s'
          }}>
            {STICKY_COLORS[currentColor]?.name || 'Slate'} selected
          </div>
        </div>
      </Field>

      <Toggle
        checked={data.locked || false}
        onChange={(v) => update({ locked: v })}
        label="Lock Sticky Note"
      />
      <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', marginTop: '-8px', marginLeft: 48 }}>
        If enabled, prevents moving or resizing the note on the canvas.
      </div>
    </>
  );
}
