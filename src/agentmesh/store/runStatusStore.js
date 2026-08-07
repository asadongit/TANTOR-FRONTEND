import { create } from 'zustand';

/**
 * Ultra-lightweight store that tracks which node ids are currently running for
 * the active workflow. Kept intentionally separate from the heavy
 * `useWorkflowStore.nodes` array so that a single node starting/finishing
 * during a live run does NOT force a whole-canvas re-render.
 *
 * Zustand only re-subscribes a selector when its returned value changes by
 * Object.is. Agents subscribe with `runningNodes.has(nodeId)` (a boolean), so
 * only the node that actually changed re-renders — the other 49 nodes stay put.
 *
 * See .agent/optimization.md (F4).
 */
export const useRunStatusStore = create((set) => ({
  runningNodes: new Set(),
  setRunningNodes: (next) => {
    set((s) => ({
      runningNodes: typeof next === 'function' ? next(s.runningNodes) : next,
    }));
  },
}));