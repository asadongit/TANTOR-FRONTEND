import React from 'react';
import PropTypes from 'prop-types';
import CollapsibleSection from './CollapsibleSection';
import { ErrorTargetField } from './LlmConfigs';

export default function AdvancedSection({
  title = 'Advanced Options',
  hitlSection,
  children,
  nodes,
  selectedNodeId,
  onErrorValue,
  onErrorChange,
  onErrorHint,
}) {
  const hasHitl = !!hitlSection;
  const hasChildren = !!children;
  const hasErrorField = !!nodes && !!onErrorChange;

  return (
    <CollapsibleSection title={title}>
      {hasHitl && hitlSection}

      {hasHitl && (hasChildren || hasErrorField) && (
        <div className="h-px bg-[var(--border)] my-4" />
      )}

      {hasChildren && children}

      {hasChildren && hasErrorField && (
        <div className="h-px bg-[var(--border)] my-4" />
      )}

      {hasErrorField && (
        <ErrorTargetField
          value={onErrorValue}
          onChange={onErrorChange}
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          hint={onErrorHint}
        />
      )}
    </CollapsibleSection>
  );
}

AdvancedSection.propTypes = {
  title: PropTypes.string,
  hitlSection: PropTypes.node,
  children: PropTypes.node,
  nodes: PropTypes.array,
  selectedNodeId: PropTypes.string,
  onErrorValue: PropTypes.string,
  onErrorChange: PropTypes.func,
  onErrorHint: PropTypes.string,
};
