import React from 'react';
import {
  Field,
  Input,
  Select,
  Toggle,
  InfoBanner
} from './SharedComponents';

export default function ExcelToJsonConfig({ data, update }) {
  const rowLimitPresets = [
    { label: 'All Rows (Full Scan)', value: 0 },
    { label: 'Top 10', value: 10 },
    { label: 'Top 50', value: 50 },
    { label: 'Top 100', value: 100 },
  ];

  const sampleLimitPresets = [
    { label: '5 Rows (Recommended)', value: 5 },
    { label: '10 Rows', value: 10 },
    { label: '20 Rows', value: 20 },
  ];

  const currentLimit = data.excel_row_limit ?? 0;
  const currentSampleLimit = data.excel_sample_limit ?? 5;
  const currentSampleMethod = data.excel_sample_method ?? 'random';

  return (
    <>
      <InfoBanner
        type="info"
        title="Dual-Output Spreadsheet Architecture"
        message="Converts spreadsheets into two explicit outputs: a full dataset for bulk engines (Jev / DB / Metrics) and a configurable sample preview (Random or Sequential) for LLM agents to prevent token bloat."
      />

      {/* SAMPLE PREVIEW CONFIGURATION */}
      <div style={{
        margin: '12px 0 16px',
        padding: '12px',
        borderRadius: 8,
        border: '1px solid var(--border, #E2E8F0)',
        backgroundColor: 'var(--bg-panel, #F8FAFC)'
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main, #1E293B)', marginBottom: 10 }}>
          Sample Preview for LLM Agents
        </div>

        <Field
          label="Sampling Strategy"
          hint="Choose whether LLM agents receive rows from the top of the spreadsheet or a uniform random sample across all rows."
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              type="button"
              onClick={() => update({ excel_sample_method: 'first' })}
              style={{
                padding: '7px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                border: currentSampleMethod === 'first' ? '1.5px solid #0284C7' : '1px solid var(--border, #CBD5E1)',
                backgroundColor: currentSampleMethod === 'first' ? '#E0F2FE' : 'var(--bg-card, #FFFFFF)',
                color: currentSampleMethod === 'first' ? '#0369A1' : 'var(--text-main, #334155)',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              First N Rows
            </button>
            <button
              type="button"
              onClick={() => update({ excel_sample_method: 'random' })}
              style={{
                padding: '7px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                border: currentSampleMethod === 'random' ? '1.5px solid #0284C7' : '1px solid var(--border, #CBD5E1)',
                backgroundColor: currentSampleMethod === 'random' ? '#E0F2FE' : 'var(--bg-card, #FFFFFF)',
                color: currentSampleMethod === 'random' ? '#0369A1' : 'var(--text-main, #334155)',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              Random N Rows
            </button>
          </div>
        </Field>

        <Field
          label="Sample Row Count"
          hint="Select 5, 10, 20 or enter a custom number of rows sent to LLM agents."
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {sampleLimitPresets.map((preset) => {
              const isSelected = Number(currentSampleLimit) === preset.value;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => update({ excel_sample_limit: preset.value })}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: isSelected ? '1.5px solid #0284C7' : '1px solid var(--border, #CBD5E1)',
                    backgroundColor: isSelected ? '#E0F2FE' : 'var(--bg-card, #FFFFFF)',
                    color: isSelected ? '#0369A1' : 'var(--text-main, #334155)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 8 }}>
            <Input
              type="number"
              value={data.excel_sample_limit ?? 5}
              onChange={(v) => update({ excel_sample_limit: v === '' ? 5 : Number(v) })}
              placeholder="Custom count (e.g. 5, 10, 20)"
            />
          </div>
        </Field>

        <Field
          label="Sample Output Context Key"
          hint="Context key where the lightweight preview payload is stored (e.g. excel_sample_data)."
        >
          <Input
            stripBraces
            value={data.excel_sample_output_key ?? 'excel_sample_data'}
            onChange={(v) => update({ excel_sample_output_key: v })}
            placeholder="excel_sample_data"
          />
        </Field>
      </div>

      {/* FULL DATASET EXTRACTION CONFIGURATION */}
      <Field
        label="Input File Context Key"
        hint="Context key containing the uploaded Excel file path (e.g. uploaded_file, file_path). Leave empty to auto-detect."
      >
        <Input
          stripBraces
          value={data.excel_input_key ?? ''}
          onChange={(v) => update({ excel_input_key: v })}
          placeholder="e.g. uploaded_file or file_path"
        />
      </Field>

      <Field
        label="Full Data Output Context Key"
        hint="Where the entire parsed JSON dataset is stored in workflow context (consumed by Jev, DB nodes, and dashboard metrics)."
      >
        <Input
          stripBraces
          value={data.excel_output_key ?? 'excel_json_data'}
          onChange={(v) => update({ excel_output_key: v })}
          placeholder="excel_json_data"
        />
      </Field>

      <Field
        label="Total Rows to Extract (Overall Limit)"
        hint="Select 'All Rows' to process the full scan, or specify a cap on total rows extracted from disk."
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {rowLimitPresets.map((preset) => {
            const isSelected = Number(currentLimit) === preset.value;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => update({ excel_row_limit: preset.value })}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: isSelected ? '1.5px solid #0284C7' : '1px solid var(--border, #E2E8F0)',
                  backgroundColor: isSelected ? '#E0F2FE' : 'var(--bg-secondary, #F8FAFC)',
                  color: isSelected ? '#0369A1' : 'var(--text-main, #334155)',
                  transition: 'all 0.15s ease',
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 8 }}>
          <Input
            type="number"
            value={data.excel_row_limit ?? ''}
            onChange={(v) => update({ excel_row_limit: v === '' ? null : Number(v) })}
            placeholder="Custom row limit (0 or empty = All rows)"
          />
        </div>
      </Field>

      <Field
        label="Sheet Name or Index"
        hint="Name of the worksheet or 0-indexed position (e.g. 0 for first sheet, or 'Sheet1'). Defaults to first sheet."
      >
        <Input
          value={data.excel_sheet_name ?? ''}
          onChange={(v) => update({ excel_sheet_name: v })}
          placeholder="0 (First sheet)"
        />
      </Field>

      <Field
        label="JSON Structure (Orientation)"
        hint="Records format produces [{col1: val, col2: val}, ...] which is easiest for LLMs and data tables."
      >
        <Select
          value={data.excel_orientation ?? 'records'}
          onChange={(v) => update({ excel_orientation: v })}
          options={[
            { label: 'Records (List of Row Objects)', value: 'records' },
            { label: 'Columns (Object of Column Lists)', value: 'columns' },
            { label: 'Split (Separate index, columns, data)', value: 'split' },
            { label: 'Index (Row IDs as Keys)', value: 'index' },
            { label: 'Values (2D Array of Rows)', value: 'values' },
          ]}
        />
      </Field>

      <Field
        label="Null / NaN Value Handling"
        hint="How missing values in cells should be represented."
      >
        <Select
          value={data.excel_handle_nulls ?? 'none'}
          onChange={(v) => update({ excel_handle_nulls: v })}
          options={[
            { label: 'Preserve as null (None)', value: 'none' },
            { label: 'Convert to empty string ("")', value: 'empty_string' },
            { label: 'Drop rows where all cells are empty', value: 'drop_rows' },
            { label: 'Drop columns where all cells are empty', value: 'drop_cols' },
          ]}
        />
      </Field>

      <Field
        label="Headers Only (Skip Rows)"
        hint="Extracts only column header names without reading any row data. Useful for quick schema-only checks."
      >
        <Toggle
          checked={Boolean(data.excel_headers_only)}
          onChange={(v) => update({ excel_headers_only: v })}
        />
      </Field>
    </>
  );
}
