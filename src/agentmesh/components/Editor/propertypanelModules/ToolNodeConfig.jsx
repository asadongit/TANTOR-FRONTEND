import React, { memo } from "react";
import {
  Field,
  ToolTagInput,
  Toggle,
  AdvancedSection,
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

      <AdvancedSection
        hitlSection={hitlSection}
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        onErrorValue={data.on_error}
        onErrorChange={(v) => update({ on_error: v })}
        onErrorHint="If this tool execution fails, jump to this error handler."
      >
        <Toggle
          checked={data.return_direct}
          onChange={(v) => syncToggle("return_direct", v)}
          label="Return tool result directly to user"
        />
      </AdvancedSection>
    </>
  );
});

export default ToolNodeConfig;
