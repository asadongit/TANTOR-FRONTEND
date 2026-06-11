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
            const type = parentNode.type || parentNode.data?.type;
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
