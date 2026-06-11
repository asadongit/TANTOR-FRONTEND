/**
 * @file utils.js
 * @description Shared helper utilities for message formatting.
 * Includes base64 image detection, pandas-profiling HTML suppression, data cleaning, and dagre graph auto-layout calculation.
 */

import dagre from 'dagre';


export const isBase64Image = (str) => {
    if (typeof str !== 'string') return false;
    const trimmed = str.trim();
    if (/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,/i.test(trimmed)) {
        return true;
    }
    // Check if it looks like raw base64 for png, jpg, gif, webp
    if (trimmed.length > 100 && /^(iVBORw0KGgo|R0lGOD|[a-zA-Z0-9+/]{50,}\/9j\/|UklGR)/.test(trimmed)) {
        return true;
    }
    return false;
};

export const isProfilingHtml = (val) => {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  return (
    trimmed.startsWith('<!doctype html>') &&
    (trimmed.includes('ydata-profiling') || trimmed.includes('pandas-profiling') || trimmed.includes('Dataset Profile') || trimmed.includes('generator" content="YData'))
  );
};

export const cleanProfilingData = (data) => {
  if (!data) return data;
  if (typeof data === 'string') {
    if (isBase64Image(data)) return data;
    if (isProfilingHtml(data)) {
      return "[Profiling Report HTML]";
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(item => cleanProfilingData(item));
  }
  if (typeof data === 'object') {
    const cleaned = {};
    for (const key of Object.keys(data)) {
      cleaned[key] = cleanProfilingData(data[key]);
    }
    return cleaned;
  }
  return data;
};

export const getLayoutedElements = (nodes, edges) => {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 100 });
    nodes.forEach(n => g.setNode(n.id, { width: 160, height: 50 }));
    edges.forEach(e => g.setEdge(e.source, e.target));
    dagre.layout(g);
    return {
        nodes: nodes.map(n => {
            const { x, y } = g.node(n.id);
            return { ...n, position: { x: x - 80, y: y - 25 } };
        }),
        edges,
    };
};
