const PIPELINE_CONFIG = {
  cdc: ["define", "source", "target", "schedule"],
  metadata: ["define", "source", "target"],
  migration: ["define", "source", "target", "schedule"],
  purge: ["define", "source", "target", "schedule"],
  default: ["define", "source", "target", "schedule"]
};

export const createPipeline = (category, pipelineId, pipelineIndex=0 ) => {
  const verticalGap = 500;
  const horizontalSpacing = 300;
  const baseX = 100;
  const baseY = 100 + pipelineIndex * verticalGap;

  const categoryKey = category.toLowerCase();
  const nodeTypes = PIPELINE_CONFIG[categoryKey] || PIPELINE_CONFIG.default;

  const nodeDefinitions = {
    define: { type: "define", label: "Define" },
    source: { type: "source", label: "Source" },
    target: { type: "target", label: "Target" },
    schedule: { type: "schedule", label: "Scheduler" }
  };

  const pipelineNodes = nodeTypes.map((nodeType, index) => {
    const position = {
      x: baseX + (index + 1) * horizontalSpacing,
      y: baseY
    };

    if (index === 1) position.x = baseX + 2.3 * horizontalSpacing;
    if (index === 2) position.x = baseX + 3.7 * horizontalSpacing;
    if (index === 3) position.x = baseX + 5.1 * horizontalSpacing;

    return {
      id: `${nodeType}_${pipelineId}`,
      type: nodeDefinitions[nodeType].type,
      position: position,
      data: { 
        label: nodeDefinitions[nodeType].label,
        category,
        pipelineId
      }
    };
  });

  const pipelineEdges = [];
  for (let i = 0; i < pipelineNodes.length - 1; i++) {
    pipelineEdges.push({
      id: `e${i+1}_${pipelineId}`,
      source: pipelineNodes[i].id,
      target: pipelineNodes[i+1].id,
      style: { stroke: '#8e78b7' }
    });
  }

  return {
    nodes: pipelineNodes,
    edges: pipelineEdges
  };
};
