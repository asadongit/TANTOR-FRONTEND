import React from "react";
import { Field, Input, Textarea, Toggle } from "./SharedComponents";

const STICKY_COLORS = {
  slate: { name: 'Slate', color: '#64748B' },
  blue: { name: 'Blue', color: '#3B82F6' },
  green: { name: 'Green', color: '#22C55E' },
  purple: { name: 'Purple', color: '#A855F7' },
  amber: { name: 'Amber', color: '#F59E0B' },
  red: { name: 'Red', color: '#EF4444' },
  pink: { name: 'Pink', color: '#EC4899' }
};

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
        <div style={{ display: 'flex', gap: '8px', padding: '4px 0' }}>
          {Object.entries(STICKY_COLORS).map(([key, info]) => {
            const isSelected = key === currentColor;
            return (
              <button
                key={key}
                onClick={() => update({ color: key })}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: info.color,
                  border: isSelected ? '2px solid var(--text-primary, #1E293B)' : '1px solid var(--border, #E2E8F0)',
                  boxShadow: isSelected ? '0 0 0 2px white inset' : 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.15s, border-color 0.15s'
                }}
                title={info.name}
              />
            );
          })}
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
