import React from "react";
import { FiPlus } from "react-icons/fi";
import { Field, Select, Input, Textarea, RuleAccordionItem } from "./SharedComponents";

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript (coming soon)", disabled: true },
];

const MODES = [
  { value: "run_once", label: "Run Once for All Items" },
  { value: "run_for_each", label: "Run Once for Each Item" },
];

const BLOCK_MODES = [
  { value: "single", label: "Single Code Block" },
  { value: "multi", label: "Multi-Block Code Rules" },
];

export default function CodeExecutionConfig({ data, update }) {
  const blockMode = data.ce_block_mode || "single";
  const blocks = data.ce_code_blocks || [];

  const addBlock = () => {
    const newBlock = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Block ${blocks.length + 1}`,
      code: "",
      enabled: true,
    };
    update({ ce_code_blocks: [...blocks, newBlock] });
  };

  const updateBlock = (index, key, val) => {
    const next = [...blocks];
    next[index] = { ...next[index], [key]: val };
    update({ ce_code_blocks: next });
  };

  const removeBlock = (index) => {
    const next = [...blocks];
    next.splice(index, 1);
    update({ ce_code_blocks: next });
  };

  const moveBlock = (index, dir) => {
    if (index + dir < 0 || index + dir >= blocks.length) return;
    const next = [...blocks];
    const temp = next[index];
    next[index] = next[index + dir];
    next[index + dir] = temp;
    update({ ce_code_blocks: next });
  };

  return (
    <div style={{ paddingTop: 8 }}>
      <Field label="Block Mode" hint="Single script, or modular multi-step blocks with enable/disable toggles.">
        <Select
          value={blockMode}
          onChange={(v) => update({ ce_block_mode: v })}
          options={BLOCK_MODES}
        />
      </Field>

      {blockMode === "single" ? (
        <>
          <Field label="Language" hint="Python is supported. JavaScript reserved for future use.">
            <Select
              value={data.ce_language || "python"}
              onChange={(v) => update({ ce_language: v })}
              options={LANGUAGES}
            />
          </Field>

          <Field label="Execution Mode" hint="Run once with all input data, or once per item in a list.">
            <Select
              value={data.ce_mode || "run_once"}
              onChange={(v) => update({ ce_mode: v })}
              options={MODES}
            />
          </Field>

          <Field label="Input Key" hint="Context key to read input data from. Available as 'input_data' in your code.">
            <Input
              stripBraces
              value={data.ce_input_key || "latest_api_result"}
              onChange={(v) => update({ ce_input_key: v })}
              placeholder="latest_api_result"
            />
          </Field>

          <Field label="Output Key" hint="Context key to write the result to. Also set as latest_code_result.">
            <Input
              stripBraces
              value={data.ce_output_key || "code_result"}
              onChange={(v) => update({ ce_output_key: v })}
              placeholder="code_result"
            />
          </Field>

          <Field label="Code" hint="Write your Python script. Available variables: input_data, input_items, context. Set 'result' to produce output.">
            <Textarea
              value={data.ce_code || ""}
              onChange={(v) => update({ ce_code: v })}
              placeholder={`# Example: filter items\nresult = [x for x in input_data if x.get("status") == "active"]`}
              rows={12}
              noVariablePicker
            />
          </Field>
        </>
      ) : (
        <>
          <Field label="Execution Mode" hint="Run once with all input data, or once per item in a list.">
            <Select
              value={data.ce_mode || "run_once"}
              onChange={(v) => update({ ce_mode: v })}
              options={MODES}
            />
          </Field>

          <Field label="Input Key" hint="Context key to read input data from. Available as 'input_data' in each block.">
            <Input
              stripBraces
              value={data.ce_input_key || "latest_api_result"}
              onChange={(v) => update({ ce_input_key: v })}
              placeholder="latest_api_result"
            />
          </Field>

          <Field label="Output Key" hint="Context key to write the final result to.">
            <Input
              stripBraces
              value={data.ce_output_key || "code_result"}
              onChange={(v) => update({ ce_output_key: v })}
              placeholder="code_result"
            />
          </Field>

          {blocks.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                border: "1px dashed var(--border)",
                borderRadius: 8,
                color: "var(--text-tertiary)",
                fontSize: 12,
                marginBottom: 12,
              }}
            >
              No code blocks defined. Click "Add Block" to create one.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {blocks.map((block, idx) => (
              <RuleAccordionItem
                key={block.id}
                rule={block}
                idx={idx}
                totalRules={blocks.length}
                updateRule={updateBlock}
                removeRule={removeBlock}
                moveRule={moveBlock}
              />
            ))}
          </div>

          <button
            onClick={addBlock}
            style={{
              width: "100%",
              padding: "10px",
              background: "var(--bg-canvas, #F8FAFC)",
              border: "1px dashed var(--border)",
              borderRadius: "8px",
              fontSize: "11px",
              color: "var(--accent-btn)",
              cursor: "pointer",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              marginTop: "8px",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-canvas, #F8FAFC)";
            }}
          >
            <FiPlus size={12} /> Add Block
          </button>
        </>
      )}

      <div
        style={{
          marginTop: 8,
          padding: "12px",
          background: "var(--bg-hover, #F8FAFC)",
          borderRadius: 8,
          border: "1px solid var(--border)",
          fontSize: 11,
          color: "var(--text-muted)",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ display: "block", marginBottom: 4, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Available Variables
        </strong>
        <code style={{ display: "block", fontFamily: "monospace" }}>
          input_data   — Data from the configured input key (dict or list)<br />
          input_items  — Always a list (wraps single values)<br />
          context      — Full workflow context (read/write; dict mutations persist)<br />
          _index       — Current item index (only in "Run for Each" mode)<br />
          result       — Set this variable as your output
        </code>
      </div>

      <div
        style={{
          marginTop: 8,
          padding: "12px",
          background: "#FFFBEB",
          borderRadius: 8,
          border: "1px solid #FDE68A",
          fontSize: 11,
          color: "#92400E",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ display: "block", marginBottom: 4, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
          ⚠️ Sandbox Restrictions
        </strong>
        <code style={{ display: "block", fontFamily: "monospace" }}>
          No imports · No file access · No exec/eval · No network<br />
          Safe builtins only: list, dict, str, int, float, bool, len, range,<br />
          &nbsp;&nbsp;enumerate, zip, map, filter, sorted, sum, min, max, any, all
        </code>
      </div>
    </div>
  );
}
