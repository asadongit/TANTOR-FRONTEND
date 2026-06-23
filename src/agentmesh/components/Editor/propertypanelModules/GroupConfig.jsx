import React from "react";
import { Field, Input, Textarea } from "./SharedComponents";
import { useWorkflowStore } from "../../../store";
import { FiLayers } from "react-icons/fi";

export default function GroupConfig({ data, update, selectedNodeId }) {
  const internalNodes = data.internal_nodes || [];
  const enterGroupPreview = useWorkflowStore((s) => s.enterGroupPreview);

  return (
    <>
      <div style={{ marginBottom: "16px" }}>
        <button
          onClick={() => selectedNodeId && enterGroupPreview(selectedNodeId)}
          style={{
            width: '100%',
            padding: '10px 14px',
            background: 'var(--theme-primary, #3B82F6)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
            transition: 'background 0.2s, transform 0.1s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--theme-primary-hover, #2563EB)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--theme-primary, #3B82F6)'}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <FiLayers size={15} /> Preview Group
        </button>
      </div>

      <Field label="Group Name" hint="The display name of the group node.">
        <Input
          value={data.label || data.name || ""}
          onChange={(v) => update({ label: v, name: v })}
          placeholder="Group Name"
        />
      </Field>

      <Field label="Description" hint="Detailed explanation of the group's functionality.">
        <Textarea
          value={data.description || ""}
          onChange={(v) => update({ description: v })}
          placeholder="Describe the group's purpose..."
          rows={4}
        />
      </Field>

      <Field label="Internal Nodes" hint="A read-only list of nodes contained within this group.">
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '8px 12px',
          maxHeight: '200px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {internalNodes.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
              No internal nodes
            </div>
          ) : (
            internalNodes.map((n, idx) => (
              <div 
                key={n.id || idx} 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  padding: '4px 6px',
                  background: 'white',
                  borderRadius: '4px',
                  border: '1px solid #F1F5F9',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}
              >
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  {n.data?.label || n.label || n.id}
                </span>
                <span style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase' }}>
                  {n.data?.type || n.type}
                </span>
              </div>
            ))
          )}
        </div>
      </Field>
    </>
  );
}
