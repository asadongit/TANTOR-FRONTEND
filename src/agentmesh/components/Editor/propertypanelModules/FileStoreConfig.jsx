import React from 'react';
import { Select, Field, Input, Toggle } from './SharedComponents';

export default function FileStoreConfig({ data, update }) {
  return (
    <>
      <Field label="File Format" hint="Excel is best for visual reading, CSV for data processing, Markdown for text that was laid out — a table stays a table instead of being flattened into one line.">
        <Select
          value={data.file_format || 'csv'}
          onChange={(v) => update({ file_format: v })}
          options={[
            { value: 'csv', label: 'CSV (Comma Separated)' },
            { value: 'excel', label: 'Excel (.xlsx)' },
            { value: 'txt', label: 'Plain Text (.txt)' },
            { value: 'md', label: 'Markdown (.md) — keeps layout' }
          ]}
        />
      </Field>

      <Field label="Filename" hint="The name of the saved file. Supports {{variable}} interpolation.">
        <Input
          value={data.file_name || ''}
          onChange={(v) => update({ file_name: v })}
          placeholder="e.g. leads_{{search_query}}"
        />
      </Field>

      <Field label="Data Source Key" hint="Optional: Specify a key in the context to save. If empty, saves the latest API result or last message.">
        <Input
          stripBraces
          value={data.file_data_key || ''}
          onChange={(v) => update({ file_data_key: v })}
          placeholder="e.g. scraped_items"
        />
      </Field>

      <div style={{ padding: 16, background: '#F8F9FA', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 20 }}>
        <Toggle
          checked={data.file_overwrite !== false}
          onChange={(v) => update({ file_overwrite: v })}
          label="Overwrite Existing File"
        />
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -8, marginLeft: 50 }}>
          If disabled, CSV will append new data to the existing file. Excel always overwrites.
        </div>
      </div>
    </>
  );
}

