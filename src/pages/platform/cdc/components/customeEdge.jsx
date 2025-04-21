import React from 'react';
import { BaseEdge, getSmoothStepPath } from 'reactflow';

export function CustomEdge(props) {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
  } = props;

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          ...style,
          stroke: '#8e78b7', 
        }}
      />
    
    </>
  );
}