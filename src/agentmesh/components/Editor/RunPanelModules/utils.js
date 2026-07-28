/**
 * Traverses the graph to find starting trigger nodes of a specific type
 * connected to the START node.
 * 
 * @param {Array} nodes 
 * @param {Array} edges 
 * @param {string} triggerType 'button_trigger' or 'auto_trigger'
 * @returns {Array} List of matching trigger nodes
 */
export function findStartingTriggers(nodes, edges, triggerType) {
  if (!nodes) return [];
  
  return nodes
    .filter(n => n.data?.type === triggerType)
    .filter(n => {
      const visited = new Set();
      let foundStart = false;

      const traverse = (currentId) => {
        if (currentId === 'START' || currentId === 'start' || currentId === '__start__') {
          foundStart = true;
          return;
        }
        if (visited.has(currentId)) return;
        visited.add(currentId);

        const incoming = edges ? edges.filter(e => e.target === currentId) : [];
        for (const edge of incoming) {
          const parentNode = nodes.find(n => n.id === edge.source);
          if (parentNode) {
            const type = parentNode.data?.type;
            if (type !== 'start' && parentNode.id !== 'START' && parentNode.id !== 'start' && parentNode.id !== '__start__') {
              continue;
            }
          }
          traverse(edge.source);
          if (foundStart) return;
        }
      };

      traverse(n.id);
      return foundStart;
    });
}

/**
 * Resolve pause type and configuration logic, looking up store nodes fallback if needed.
 */
export function resolvePauseConfig(res, storeNodes, pausedOriginalNodeId) {
  let nodeType = res.pause_type;
  let nodeConfig = res.pause_config;

  if (res.context?.paused_subgraph_node_id) {
    nodeType = res.context.paused_subgraph_node_type;
    nodeConfig = res.context.paused_subgraph_node_config || {};
  } else if (!nodeType) {
    const pausedNode = storeNodes.find(n => n.id === pausedOriginalNodeId);
    nodeType = nodeType || (pausedNode?.type === 'customNode' ? pausedNode.data?.type : (pausedNode?.data?.type || pausedNode?.type));
    nodeConfig = { ...(pausedNode?.data || {}), ...(nodeConfig || {}) };
  } else if (pausedOriginalNodeId) {
    const pausedNode = storeNodes.find(n => n.id === pausedOriginalNodeId);
    if (pausedNode?.data) {
      nodeConfig = { ...pausedNode.data, ...nodeConfig };
    }
  }
  return { nodeType, nodeConfig };
}

/**
 * Parses AIMessages, user_messages, and charts/artifacts from workflow stream events.
 */
export function processWorkflowMessages(messages, addEvent, initialActiveAgent = null) {
  const hasArtifact = (str) =>
    typeof str === 'string' && (str.includes('```chart') || str.includes('```mermaid'));

  let chartCount = 0;
  let lastActiveAgent = initialActiveAgent;
  let lastActiveAgentName = null;

  for (const msg of messages) {
    const nodeId = msg.metadata?.active_agent;
    const agentName = msg.metadata?.agent_name;

    if (nodeId && nodeId !== lastActiveAgent) {
      addEvent({ type: 'node_start', node: nodeId, agent_name: agentName });
      lastActiveAgent = nodeId;
      lastActiveAgentName = agentName;
    }

    if (msg.type === 'AIMessage') {
      if (hasArtifact(msg.content)) {
        addEvent({ type: 'tool_result', tool: 'chart_generator', content: msg.content });
        chartCount++;
      }

      const isNotLast = msg !== messages[messages.length - 1];
      if (isNotLast && msg.content && typeof msg.content === 'string' && msg.content.trim()) {
        addEvent({ type: 'token', content: msg.content, node: nodeId, agent_name: agentName });
      }
    }
  }

  return { chartCount, lastActiveAgent, lastActiveAgentName };
}

