export const createPipeline = (category, pipelineId, pipelineIndex) => {
    const verticalGap = 500;
    const horizontalSpacing = 300;
 
    const baseX = 100;
    const baseY = 100 + pipelineIndex * verticalGap;
 
    const positions = [
      { x: baseX+horizontalSpacing, y: baseY },
      { x: baseX + 2.3* horizontalSpacing, y: baseY },
      { x: baseX +3.7 * horizontalSpacing, y: baseY },
      { x: baseX + 5.1 * horizontalSpacing, y: baseY },
    ];
 
    const pipelineNodes = [
      { id: `define_${pipelineId}`, type: "define", position: positions[0], data: { label: "Define", category, pipelineId } },
      { id: `source_${pipelineId}`, type: "source", position: positions[1], data: { label: "Source", category, pipelineId } },
      { id: `target_${pipelineId}`, type: "target", position: positions[2], data: { label: "Target", category, pipelineId } },
      { id: `schedule_${pipelineId}`, type: "schedule", position: positions[3], data: { label: "Scheduler", category, pipelineId } },
    ];
 
    const pipelineEdges = [
      { 
        id: `e1_${pipelineId}`, 
        source: pipelineNodes[0].id, 
        target: pipelineNodes[1].id,
        style: { stroke: '#8e78b7' }
      },
      { 
        id: `e2_${pipelineId}`, 
        source: pipelineNodes[1].id, 
        target: pipelineNodes[2].id,
        style: { stroke: '#8e78b7' }

      },
      { 
        id: `e3_${pipelineId}`, 
        source: pipelineNodes[2].id, 
        target: pipelineNodes[3].id,
        style: { stroke: '#8e78b7' }
      },
    ];

    console.log("pipelineNodes---------------------------------------", pipelineNodes)
    console.log("pipelineEdges---------------------------------------", pipelineEdges)
    
    return { 
      nodes: pipelineNodes, 
      edges: pipelineEdges 
    };
};