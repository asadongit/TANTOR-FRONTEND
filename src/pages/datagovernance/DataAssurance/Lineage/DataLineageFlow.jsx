import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow';
import { ChevronRight, ChevronLeft, Eye, RotateCcw, X } from 'lucide-react';

import 'reactflow/dist/style.css';

// Circular Remote Control Component
const CircularNodeRemote = ({ nodeId, position, onNavigate, onToggleVisibility, onReset, onClose, expandedNodes }) => {
  const isForwardExpanded = expandedNodes.has(`${nodeId}-forward`);
  const isBackwardExpanded = expandedNodes.has(`${nodeId}-backward`);

  return (
    <div
      className="absolute z-20"
      style={{
        left: position.x + 80,
        top: position.y - 40,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Circular Remote Design */}
      <div className="relative">
        {/* Outer Circle */}
        <div className="w-24 h-24 bg-gray-800 rounded-full border-4 border-gray-600 shadow-2xl relative">
          {/* Inner Circle */}
          <div className="w-12 h-12 bg-red-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <span className="text-white text-xs font-bold">CTRL</span>
          </div>

          {/* Forward Button (Right) */}
          <button
            onClick={() => onNavigate(nodeId, 'forward')}
            className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center transition-all ${isForwardExpanded ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            title="Toggle Forward Connections"
          >
            <ChevronRight size={14} />
          </button>

          {/* Backward Button (Left) */}
          <button
            onClick={() => onNavigate(nodeId, 'backward')}
            className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center transition-all ${isBackwardExpanded ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            title="Toggle Backward Connections"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Up Button */}
          <button
            onClick={() => onReset(nodeId)}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded-full border-2 border-white text-white flex items-center justify-center transition-all"
            title="Reset View"
          >
            <RotateCcw size={12} />
          </button>

          {/* Down Button */}
          <button
            onClick={() => onToggleVisibility(nodeId)}
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded-full border-2 border-white text-white flex items-center justify-center transition-all"
            title="Toggle All Connections"
          >
            <Eye size={12} />
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full text-white flex items-center justify-center text-xs"
        >
          <X size={12} />
        </button>
      </div>

      {/* Tooltip */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
        Node: {nodeId}
      </div>
    </div>
  );
};

// Initial nodes data
const initialNodes = [
  // Data Sources (blue nodes)
  { id: 'datamart', type: 'default', position: { x: 50, y: 50 }, data: { label: 'DATAMART', type: 'source', description: 'Main data mart source' }, style: { background: '#22D3EE', color: 'white', border: '2px solid #0EA5E9', borderRadius: '50%', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' } },
  { id: 'load-fact-sales', type: 'default', position: { x: 50, y: 200 }, data: { label: 'LOAD_FACT_SALES', type: 'source', description: 'Sales fact loader' }, style: { background: '#22D3EE', color: 'white', border: '2px solid #0EA5E9', borderRadius: '50%', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' } },
  { id: 'load-dwh', type: 'default', position: { x: 50, y: 350 }, data: { label: 'LOAD DWH', type: 'source', description: 'Data warehouse loader' }, style: { background: '#22D3EE', color: 'white', border: '2px solid #0EA5E9', borderRadius: '50%', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' } },
  { id: 'load-dwh-dim-product', type: 'default', position: { x: 50, y: 470 }, data: { label: 'LOAD_DWH_DIM_PRODUCT', type: 'source', description: 'Product dimension loader' }, style: { background: '#22D3EE', color: 'white', border: '2px solid #0EA5E9', borderRadius: '50%', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold' } },

  // Transformation nodes (red nodes)
  { id: 'dbo-dwhfact-sales', type: 'default', position: { x: 300, y: 120 }, data: { label: 'DBO.DWHFACT.SALES', type: 'transformation', description: 'Sales fact table' }, style: { background: '#EF4444', color: 'white', border: '2px solid #DC2626', borderRadius: '50%', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold' } },
  { id: 'dbo-dwhdim-customer', type: 'default', position: { x: 280, y: 280 }, data: { label: 'DBO.DWHDIM.CUSTOMER', type: 'transformation', description: 'Customer dimension table' }, style: { background: '#EF4444', color: 'white', border: '2px solid #DC2626', borderRadius: '50%', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 'bold' } },
  { id: 'dbo-dwhdim-product', type: 'default', position: { x: 280, y: 420 }, data: { label: 'DBO.DWHDIM.PRODUCT', type: 'transformation', description: 'Product dimension table' }, style: { background: '#EF4444', color: 'white', border: '2px solid #DC2626', borderRadius: '50%', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 'bold' } },
  { id: 'dbo-sproductssold', type: 'default', position: { x: 500, y: 80 }, data: { label: 'DBO.SPRODUCTSSOLD', type: 'transformation', description: 'Products sold summary' }, style: { background: '#EF4444', color: 'white', border: '2px solid #DC2626', borderRadius: '50%', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 'bold' } },
  { id: 'dbo-vsalesproductsummary', type: 'default', position: { x: 500, y: 200 }, data: { label: 'DBO.VSALESPRODUCTSUMMARY', type: 'transformation', description: 'Sales product summary view' }, style: { background: '#EF4444', color: 'white', border: '2px solid #DC2626', borderRadius: '50%', width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6px', fontWeight: 'bold' } },
  { id: 'dbo-vsalescustomerproducts', type: 'default', position: { x: 500, y: 350 }, data: { label: 'DBO.VSALESCUSTOMERPRODUCTS', type: 'transformation', description: 'Customer products view' }, style: { background: '#EF4444', color: 'white', border: '2px solid #DC2626', borderRadius: '50%', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6px', fontWeight: 'bold' } },

  // Output nodes (green nodes) - initially hidden
  { id: 'customer-sales-by-year', type: 'default', position: { x: 750, y: 50 }, data: { label: 'CUSTOMER SALES BY YEAR', type: 'output', description: 'Yearly customer sales report' }, style: { background: '#10B981', color: 'white', border: '2px solid #059669', borderRadius: '50%', width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold' }, hidden: true },
  { id: 'top-product-sales', type: 'default', position: { x: 750, y: 180 }, data: { label: 'TOP PRODUCT SALES', type: 'output', description: 'Top selling products report' }, style: { background: '#10B981', color: 'white', border: '2px solid #059669', borderRadius: '50%', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold' }, hidden: true },
  { id: 'order-by-sales-rep-summary', type: 'default', position: { x: 750, y: 300 }, data: { label: 'ORDER BY SALES REP SUMMARY', type: 'output', description: 'Sales representative summary' }, style: { background: '#10B981', color: 'white', border: '2px solid #059669', borderRadius: '50%', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 'bold' }, hidden: true },
  { id: 'sales-report', type: 'default', position: { x: 750, y: 450 }, data: { label: 'SALES REPORT', type: 'output', description: 'Comprehensive sales report' }, style: { background: '#10B981', color: 'white', border: '2px solid #059669', borderRadius: '50%', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold' }, hidden: true },
  { id: 'customer-products', type: 'default', position: { x: 950, y: 350 }, data: { label: 'CUSTOMER PRODUCTS', type: 'output', description: 'Final customer products output' }, style: { background: '#10B981', color: 'white', border: '2px solid #059669', borderRadius: '50%', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold' }, hidden: true }
];

// Initial edges - some hidden initially
const initialEdges = [
  { id: 'e1', source: 'datamart', target: 'dbo-dwhfact-sales', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#6B7280' } },
  { id: 'e2', source: 'load-fact-sales', target: 'dbo-dwhfact-sales', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#6B7280' } },
  { id: 'e3', source: 'load-dwh', target: 'dbo-dwhdim-customer', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#6B7280' } },
  { id: 'e4', source: 'load-dwh-dim-product', target: 'dbo-dwhdim-product', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#6B7280' } },
  { id: 'e5', source: 'dbo-dwhfact-sales', target: 'dbo-sproductssold', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#6B7280' } },
  { id: 'e6', source: 'dbo-dwhfact-sales', target: 'dbo-vsalesproductsummary', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#6B7280' } },
  { id: 'e7', source: 'dbo-dwhdim-customer', target: 'dbo-vsalesproductsummary', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#6B7280' } },
  { id: 'e8', source: 'dbo-dwhdim-product', target: 'dbo-vsalesproductsummary', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#6B7280' } },
  { id: 'e9', source: 'dbo-vsalesproductsummary', target: 'dbo-vsalescustomerproducts', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#6B7280' } },
  { id: 'e10', source: 'dbo-dwhdim-customer', target: 'dbo-vsalescustomerproducts', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#6B7280' } },
  { id: 'e11', source: 'dbo-dwhdim-product', target: 'dbo-vsalescustomerproducts', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#6B7280' } },
  { id: 'e12', source: 'dbo-sproductssold', target: 'customer-sales-by-year', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#6B7280' }, hidden: true },
  { id: 'e13', source: 'dbo-vsalesproductsummary', target: 'top-product-sales', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#6B7280' }, hidden: true },
  { id: 'e14', source: 'dbo-vsalescustomerproducts', target: 'order-by-sales-rep-summary', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#6B7280' }, hidden: true },
  { id: 'e15', source: 'dbo-vsalescustomerproducts', target: 'sales-report', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#6B7280' }, hidden: true },
  { id: 'e16', source: 'sales-report', target: 'customer-products', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#6B7280' }, hidden: true },
];

function DataLineageFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const findConnectedElements = (nodeId, direction) => {
    const connectedNodes = new Set();
    const connectedEdges = new Set();
    edges.forEach(edge => {
      if (direction === 'forward' && edge.source === nodeId) {
        connectedNodes.add(edge.target);
        connectedEdges.add(edge.id);
      } else if (direction === 'backward' && edge.target === nodeId) {
        connectedNodes.add(edge.source);
        connectedEdges.add(edge.id);
      }
    });
    return { nodes: connectedNodes, edges: connectedEdges };
  };

  const handleToggleVisibility = (nodeId) => {
    const forwardConnected = findConnectedElements(nodeId, 'forward');
    const backwardConnected = findConnectedElements(nodeId, 'backward');
    const allConnectedNodes = new Set([...forwardConnected.nodes, ...backwardConnected.nodes]);
    const allConnectedEdges = new Set([...forwardConnected.edges, ...backwardConnected.edges]);
    const hasVisibleConnected = nodes.some(node =>
      allConnectedNodes.has(node.id) && !node.hidden
    );
    setNodes(currentNodes =>
      currentNodes.map(node => ({
        ...node,
        hidden: allConnectedNodes.has(node.id) ? hasVisibleConnected : node.hidden
      }))
    );
    setEdges(currentEdges =>
      currentEdges.map(edge => ({
        ...edge,
        hidden: allConnectedEdges.has(edge.id) ? hasVisibleConnected : edge.hidden
      }))
    );
  };

  const handleReset = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setExpandedNodes(new Set());
  };

  const onNodeClick = (event, node) => {
    setSelectedNodeId(prevId => (prevId === node.id ? null : node.id));
  };

  const closeRemote = () => {
    setSelectedNodeId(null);
  };

  const selectedNode = nodes.find(node => node.id === selectedNodeId);

  // --- START OF UPDATED SECTION ---

  // Dummy data for additional nodes - simulates API response for lineage
  const getDummyAdditionalNodes = (nodeId, direction) => {
    const nodeStyles = {
      source: { background: '#8B5CF6', border: '2px solid #7C3AED', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
      transform: { background: '#F59E0B', border: '2px solid #D97706', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
    };

    const dummyData = {
      // --- Source Nodes ---
      'datamart-forward': { nodes: [{ id: `${nodeId}-downstream-1`, position: { x: 200, y: 20 }, data: { label: 'STAGING_AREA', type: 'transformation', description: 'Staging area for data processing' }, style: { ...nodeStyles.transform, width: 90, height: 90, fontSize: '8px' } }], edges: [{ id: `${nodeId}-downstream-edge-1`, source: nodeId, target: `${nodeId}-downstream-1`, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }] },
      'load-fact-sales-forward': { nodes: [{ id: `${nodeId}-downstream-1`, position: { x: 200, y: 180 }, data: { label: 'VALIDATION_STEP', type: 'transformation', description: 'Data validation before loading' }, style: { ...nodeStyles.transform, width: 100, height: 100, fontSize: '8px' } }], edges: [{ id: `${nodeId}-downstream-edge-1`, source: nodeId, target: `${nodeId}-downstream-1`, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }] },
      'load-dwh-forward': { nodes: [{ id: `${nodeId}-downstream-1`, position: { x: 200, y: 330 }, data: { label: 'CLEANSING_SCRIPT', type: 'transformation', description: 'Script for data cleansing' }, style: { ...nodeStyles.transform, width: 90, height: 90, fontSize: '8px' } }], edges: [{ id: `${nodeId}-downstream-edge-1`, source: nodeId, target: `${nodeId}-downstream-1`, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }] },
      'load-dwh-dim-product-forward': { nodes: [{ id: `${nodeId}-downstream-1`, position: { x: 200, y: 450 }, data: { label: 'CATEGORY_MAP', type: 'transformation', description: 'Mapping product categories' }, style: { ...nodeStyles.transform, width: 95, height: 95, fontSize: '8px' } }], edges: [{ id: `${nodeId}-downstream-edge-1`, source: nodeId, target: `${nodeId}-downstream-1`, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }] },

      // --- Transformation Nodes ---
      'dbo-dwhfact-sales-backward': { nodes: [{ id: `${nodeId}-upstream-1`, position: { x: 120, y: 60 }, data: { label: 'RAW_SALES_DATA', type: 'source', description: 'Raw sales data source' }, style: { ...nodeStyles.source, width: 95, height: 95, fontSize: '7px' } }, { id: `${nodeId}-upstream-2`, position: { x: 120, y: 180 }, data: { label: 'ORDER_SYSTEM', type: 'source', description: 'Order management system' }, style: { ...nodeStyles.source, width: 85, height: 85, fontSize: '8px' } }], edges: [{ id: `${nodeId}-upstream-edge-1`, source: `${nodeId}-upstream-1`, target: nodeId, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#8B5CF6', strokeWidth: 2 } }, { id: `${nodeId}-upstream-edge-2`, source: `${nodeId}-upstream-2`, target: nodeId, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#8B5CF6', strokeWidth: 2 } }] },
      'dbo-dwhfact-sales-forward': { nodes: [{ id: `${nodeId}-downstream-1`, position: { x: 450, y: 60 }, data: { label: 'ANALYTICS_VIEW', type: 'transformation', description: 'Analytics processing view' }, style: { ...nodeStyles.transform, width: 85, height: 85, fontSize: '8px' } }, { id: `${nodeId}-downstream-2`, position: { x: 450, y: 180 }, data: { label: 'METRIC_CALC', type: 'transformation', description: 'Metrics calculation layer' }, style: { ...nodeStyles.transform, width: 80, height: 80, fontSize: '9px' } }], edges: [{ id: `${nodeId}-downstream-edge-1`, source: nodeId, target: `${nodeId}-downstream-1`, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }, { id: `${nodeId}-downstream-edge-2`, source: nodeId, target: `${nodeId}-downstream-2`, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }] },
      'dbo-dwhdim-customer-backward': { nodes: [{ id: `${nodeId}-upstream-1`, position: { x: 100, y: 260 }, data: { label: 'CRM_SYSTEM', type: 'source', description: 'Customer Relationship Manager' }, style: { ...nodeStyles.source, width: 90, height: 90, fontSize: '8px' } }], edges: [{ id: `${nodeId}-upstream-edge-1`, source: `${nodeId}-upstream-1`, target: nodeId, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#8B5CF6', strokeWidth: 2 } }] },
      'dbo-dwhdim-customer-forward': { nodes: [{ id: `${nodeId}-downstream-1`, position: { x: 430, y: 260 }, data: { label: 'CUST_SEGMENT', type: 'transformation', description: 'Customer segmentation model' }, style: { ...nodeStyles.transform, width: 95, height: 95, fontSize: '8px' } }], edges: [{ id: `${nodeId}-downstream-edge-1`, source: nodeId, target: `${nodeId}-downstream-1`, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }] },
      'dbo-dwhdim-product-backward': { nodes: [{ id: `${nodeId}-upstream-1`, position: { x: 100, y: 400 }, data: { label: 'PRODUCT_CATALOG', type: 'source', description: 'Main Product Catalog DB' }, style: { ...nodeStyles.source, width: 100, height: 100, fontSize: '8px' } }], edges: [{ id: `${nodeId}-upstream-edge-1`, source: `${nodeId}-upstream-1`, target: nodeId, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#8B5CF6', strokeWidth: 2 } }] },
      'dbo-dwhdim-product-forward': { nodes: [{ id: `${nodeId}-downstream-1`, position: { x: 430, y: 400 }, data: { label: 'INVENTORY_JOIN', type: 'transformation', description: 'Joined with inventory data' }, style: { ...nodeStyles.transform, width: 90, height: 90, fontSize: '8px' } }], edges: [{ id: `${nodeId}-downstream-edge-1`, source: nodeId, target: `${nodeId}-downstream-1`, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }] },
      'dbo-sproductssold-backward': { nodes: [{ id: `${nodeId}-upstream-1`, position: { x: 350, y: 60 }, data: { label: 'AGG_LOGIC', type: 'transformation', description: 'Aggregation logic script' }, style: { ...nodeStyles.transform, width: 80, height: 80, fontSize: '8px' } }], edges: [{ id: `${nodeId}-upstream-edge-1`, source: `${nodeId}-upstream-1`, target: nodeId, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }] },
      'dbo-sproductssold-forward': { nodes: [{ id: `${nodeId}-downstream-1`, position: { x: 650, y: 60 }, data: { label: 'SALES_FORECAST', type: 'output', description: 'Sales forecasting model input' }, style: { ...nodeStyles.transform, width: 90, height: 90, fontSize: '8px' } }], edges: [{ id: `${nodeId}-downstream-edge-1`, source: nodeId, target: `${nodeId}-downstream-1`, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }] },
      'dbo-vsalesproductsummary-backward': { nodes: [{ id: `${nodeId}-upstream-1`, position: { x: 350, y: 180 }, data: { label: 'JOIN_LOGIC', type: 'transformation', description: 'View definition join logic' }, style: { ...nodeStyles.transform, width: 85, height: 85, fontSize: '8px' } }], edges: [{ id: `${nodeId}-upstream-edge-1`, source: `${nodeId}-upstream-1`, target: nodeId, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }] },
      'dbo-vsalesproductsummary-forward': { nodes: [{ id: `${nodeId}-downstream-1`, position: { x: 650, y: 180 }, data: { label: 'BI_TOOL_QUERY', type: 'output', description: 'Query from BI Tool' }, style: { ...nodeStyles.transform, width: 90, height: 90, fontSize: '8px' } }], edges: [{ id: `${nodeId}-downstream-edge-1`, source: nodeId, target: `${nodeId}-downstream-1`, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }] },
      'dbo-vsalescustomerproducts-backward': { nodes: [{ id: `${nodeId}-upstream-1`, position: { x: 350, y: 330 }, data: { label: 'CUSTOMER_FILTER', type: 'transformation', description: 'Customer filtering logic' }, style: { ...nodeStyles.transform, width: 100, height: 100, fontSize: '8px' } }], edges: [{ id: `${nodeId}-upstream-edge-1`, source: `${nodeId}-upstream-1`, target: nodeId, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }] },
      'dbo-vsalescustomerproducts-forward': { nodes: [{ id: `${nodeId}-downstream-1`, position: { x: 700, y: 320 }, data: { label: 'DASHBOARD_DATA', type: 'output', description: 'Dashboard data feed' }, style: { ...nodeStyles.transform, width: 90, height: 90, fontSize: '7px' } }, { id: `${nodeId}-downstream-2`, position: { x: 700, y: 420 }, data: { label: 'API_ENDPOINT', type: 'output', description: 'API data endpoint' }, style: { ...nodeStyles.transform, width: 80, height: 80, fontSize: '8px' } }], edges: [{ id: `${nodeId}-downstream-edge-1`, source: nodeId, target: `${nodeId}-downstream-1`, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }, { id: `${nodeId}-downstream-edge-2`, source: nodeId, target: `${nodeId}-downstream-2`, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }] },

      // --- Output Nodes ---
      'customer-sales-by-year-backward': { nodes: [{ id: `${nodeId}-upstream-1`, position: { x: 600, y: 30 }, data: { label: 'YEARLY_AGG', type: 'transformation', description: 'Yearly aggregation script' }, style: { ...nodeStyles.transform, width: 80, height: 80, fontSize: '8px' } }], edges: [{ id: `${nodeId}-upstream-edge-1`, source: `${nodeId}-upstream-1`, target: nodeId, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }] },
      'top-product-sales-backward': { nodes: [{ id: `${nodeId}-upstream-1`, position: { x: 600, y: 160 }, data: { label: 'RANKING_FUNC', type: 'transformation', description: 'Ranking function for products' }, style: { ...nodeStyles.transform, width: 85, height: 85, fontSize: '8px' } }], edges: [{ id: `${nodeId}-upstream-edge-1`, source: `${nodeId}-upstream-1`, target: nodeId, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }] },
      'order-by-sales-rep-summary-backward': { nodes: [{ id: `${nodeId}-upstream-1`, position: { x: 600, y: 280 }, data: { label: 'GROUP_BY_REP', type: 'transformation', description: 'Grouping by sales rep' }, style: { ...nodeStyles.transform, width: 90, height: 90, fontSize: '8px' } }], edges: [{ id: `${nodeId}-upstream-edge-1`, source: `${nodeId}-upstream-1`, target: nodeId, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }] },
      'sales-report-backward': { nodes: [{ id: `${nodeId}-upstream-1`, position: { x: 600, y: 430 }, data: { label: 'REPORT_QUERY', type: 'transformation', description: 'Final query for the report' }, style: { ...nodeStyles.transform, width: 80, height: 80, fontSize: '8px' } }], edges: [{ id: `${nodeId}-upstream-edge-1`, source: `${nodeId}-upstream-1`, target: nodeId, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }] },
      'customer-products-backward': { nodes: [{ id: `${nodeId}-upstream-1`, position: { x: 800, y: 330 }, data: { label: 'FINAL_FILTER', type: 'transformation', description: 'Final filtering for customer products' }, style: { ...nodeStyles.transform, width: 85, height: 85, fontSize: '8px' } }], edges: [{ id: `${nodeId}-upstream-edge-1`, source: `${nodeId}-upstream-1`, target: nodeId, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#F59E0B', strokeWidth: 2 } }] },
    };

    return dummyData[`${nodeId}-${direction}`] || { nodes: [], edges: [] };
  };
  // --- END OF UPDATED SECTION ---


  const handleNavigate = (nodeId, direction) => {
    const key = `${nodeId}-${direction}`;
    const isCurrentlyExpanded = expandedNodes.has(key);

    const term = direction === 'forward' ? 'downstream' : 'upstream';

    if (isCurrentlyExpanded) {
      setNodes(currentNodes =>
        currentNodes.filter(node => !node.id.startsWith(`${nodeId}-${term}`))
      );
      setEdges(currentEdges =>
        currentEdges.filter(edge => !edge.id.startsWith(`${nodeId}-${term}`))
      );
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    } else {
      const additionalData = getDummyAdditionalNodes(nodeId, direction);
      if (additionalData.nodes.length > 0) {
        setNodes(currentNodes => [...currentNodes, ...additionalData.nodes]);
        setEdges(currentEdges => [...currentEdges, ...additionalData.edges]);
        setExpandedNodes(prev => new Set(prev).add(key));
      }
    }
  };

  return (
    <div className="w-full h-screen bg-gray-50">
      <div className="h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
          className="bg-gray-50"
        >
          <Controls />
          <MiniMap
            nodeColor={(node) => node.style?.background || '#ddd'}
            className="bg-white border border-gray-300 rounded"
          />
          <Background variant="dots" gap={20} size={1} color="#E5E7EB" />
        </ReactFlow>

        {selectedNodeId && selectedNode && (
          <CircularNodeRemote
            nodeId={selectedNodeId}
            position={selectedNode.position}
            onNavigate={handleNavigate}
            onToggleVisibility={handleToggleVisibility}
            onReset={handleReset}
            onClose={closeRemote}
            expandedNodes={expandedNodes}
          />
        )}
      </div>

      {selectedNodeId && selectedNode && (
        <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm">
          <h4 className="font-bold mb-2">Selected Node Details</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Name:</strong> {selectedNode.data.label}</div>
            <div><strong>Type:</strong> <span className="capitalize">{selectedNode.data.type}</span></div>
            <div><strong>Description:</strong> {selectedNode.data.description}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataLineageFlow;