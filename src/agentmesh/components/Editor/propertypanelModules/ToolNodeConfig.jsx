import React, { memo } from "react";
import {
  Field,
  ToolTagInput,
  Toggle,
  CollapsibleSection,
  ErrorTargetField,
} from "./SharedComponents";

const ToolNodeConfig = memo(function ToolNodeConfig({
  data,
  update,
  nodes,
  availableTools,
  syncTools,
  syncToggle,
  selectedNodeId,
  hitlSection,
}) {
  return (
    <>
      <Field label="Managed Tools" hint="Auto-syncs with connected Agents.">
        <ToolTagInput
          value={data.tools || []}
          configs={data.tool_configs || {}}
          onUpdate={syncTools}
          availableTools={availableTools}
        />
      </Field>

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
        <Toggle
          checked={data.return_direct}
          onChange={(v) => syncToggle("return_direct", v)}
          label="Return tool result directly to user"
        />
        <div
          style={{
            height: "1px",
            background: "var(--border)",
            margin: "16px 0",
          }}
        />
        <ErrorTargetField
          value={data.on_error}
          onChange={(v) => update({ on_error: v })}
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          hint="If this tool execution fails, jump to this error handler."
        />
      </CollapsibleSection>
    </>
  );
});

export default ToolNodeConfig;
