import React, { useCallback } from "react";
import { Field, AsyncSearchableSelect, Toggle, InfoBanner } from "./SharedComponents";
import { listWorkflows, getWorkflow } from "../../../api/agentmesh";

export default function SubgraphConfig({
  data,
  update,
  currentWorkflowId,
}) {
  const handleLoadOptions = useCallback(
    async (search, page) => {
      try {
        const res = await listWorkflows({ search, page, limit: 20 });
        const items = (res.workflows || [])
          .filter((w) => w.id !== currentWorkflowId)
          .map((w) => ({
            value: w.id,
            label: w.name,
            sublabel: `${w.category || "General"} • ${w.id.slice(0, 8)}`,
          }));

        if (page === 1 && !search) {
          items.unshift({ value: "", label: "— No workflow selected —" });
        }

        return {
          options: items,
          hasMore: (res.workflows || []).length === 20,
        };
      } catch (err) {
        console.error("Failed to load workflow options:", err);
        return { options: [], hasMore: false };
      }
    },
    [currentWorkflowId]
  );

  const handleLoadSingleOption = useCallback(async (id) => {
    try {
      const w = await getWorkflow(id);
      if (w && w.id) {
        return {
          value: w.id,
          label: w.name,
          sublabel: `${w.category || "General"} • ${w.id.slice(0, 8)}`,
        };
      }
      return null;
    } catch (err) {
      console.error("Failed to load selected workflow:", err);
      return null;
    }
  }, []);

  return (
    <>
      <Field
        label="Target Workflow"
        hint="Select the compiled workflow to invoke as a sub-agent."
      >
        <AsyncSearchableSelect
          value={data.workflow_id || ""}
          onChange={(v) => update({ workflow_id: v })}
          placeholder="Choose a workflow..."
          loadOptions={handleLoadOptions}
          loadSingleOption={handleLoadSingleOption}
        />
      </Field>
      <div
        style={{
          padding: 12,
          background: "var(--bg-primary)",
          borderRadius: 12,
          border: "1px solid var(--border)",
          marginBottom: 18,
        }}
      >
        <Toggle
          checked={data.return_direct}
          onChange={(v) => update({ return_direct: v })}
          label="Return response directly to user"
        />
      </div>
      {!data.workflow_id && (
        <InfoBanner type="warning">
          Select a compiled workflow to use as a subgraph.
        </InfoBanner>
      )}
    </>
  );
}


