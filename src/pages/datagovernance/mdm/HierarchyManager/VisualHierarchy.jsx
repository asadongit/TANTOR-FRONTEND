import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Download, ChevronRight, ChevronDown, ChevronsRight, ChevronsDownUp } from 'lucide-react';
import { useHierarchies, useVisualHierarchyTree } from '../../../../hooks/mdm/hierarchyDefinition';
import Breadcrumb from '../../../../components/Breadcrumb';
import SearchableDropdown from '../components/SearchableDropdown';

const LEVEL_COLORS = [
    { color: '#8E77BB', bg: '#8E77BB40', gradientEnd: '#8E77BB' },
    { color: '#098C60', bg: '#098C601A', gradientEnd: '#098C60' },
    { color: '#FF9500', bg: '#FFC93F40', gradientEnd: '#FF9500' },
    { color: '#3B82F6', bg: '#3B82F640', gradientEnd: '#3B82F6' },
    { color: '#EF4D5F', bg: '#EF4D5F40', gradientEnd: '#EF4D5F' },
    { color: '#06B6D4', bg: '#06B6D440', gradientEnd: '#06B6D4' },
];
const getLevelColor = (level) => LEVEL_COLORS[level % LEVEL_COLORS.length];

const Skeleton = ({ className = '' }) => (
    <span className={`inline-block bg-gray-200 rounded animate-pulse ${className}`} />
);

const formatPath = (path) => (path ?? '').split('/').filter(Boolean).join(' → ');

const collectAllIds = (nodes) => {
    const ids = [];
    const walk = (list) => {
        list.forEach((n) => {
            ids.push(n.node_id);
            if (n.children?.length) walk(n.children);
        });
    };
    walk(nodes);
    return ids;
};

const TreeNode = ({ node, expandedIds, toggleExpand, selectedNodeId, onSelectNode, depth = 0 }) => {
    const hasChildren = node.children?.length > 0;
    const isExpanded = expandedIds.has(node.node_id);
    const isSelected = selectedNodeId === node.node_id;
    const lc = getLevelColor(node.level_number ?? depth);

    return (
        <div>
            <div
                className={`flex items-center justify-between px-4 py-3 rounded-lg mb-1 cursor-pointer transition-all duration-150 bg-[#FFFFFF] border border-[#CCCCCC]`}
                style={{
                    marginLeft: `${depth * 20}px`,
                    borderLeft: `4px solid ${lc.color}`,
                    paddingLeft: depth > 0 ? '10px' : '12px',
                }}
                onClick={() => onSelectNode(node)}
            >
                <div className="flex items-center gap-2 min-w-0">
                    {hasChildren ? (
                        <button
                            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-black/10 transition-colors"
                            onClick={(e) => { e.stopPropagation(); toggleExpand(node.node_id); }}
                        >
                            {isExpanded
                                ? <ChevronDown className="w-5 h-5 text-[#818181]" />
                                : <ChevronRight className="w-5 h-5 text-[#818181]" />
                            }
                        </button>
                    ) : (
                        <span className="w-5 flex-shrink-0" />
                    )}
                    <span className="text-base font-medium text-[#282F49] truncate">{node.node_name}</span>
                </div>
                <span
                    className="flex-shrink-0 ml-2 px-2 py-1 text-sm font-medium rounded-lg"
                    style={{ color: lc.color, backgroundColor: lc.bg }}
                >
                    {node.node_code}
                </span>
            </div>

            {hasChildren && isExpanded && (
                <div>
                    {node.children.map((child) => (
                        <TreeNode
                            key={child.node_id}
                            node={child}
                            expandedIds={expandedIds}
                            toggleExpand={toggleExpand}
                            selectedNodeId={selectedNodeId}
                            onSelectNode={onSelectNode}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const NodeDetails = ({ node, nodeMap = {} }) => {
    const lc = getLevelColor(node.level_number ?? 0);
    const gradientBg = `linear-gradient(360deg, #FFFFFF -4.43%, ${lc.gradientEnd}40 340.11%)`;

    const parentNode = node.parent_node_id ? nodeMap[node.parent_node_id] : null;
    const parentDisplay = parentNode?.node_name ?? '—';

    return (
        <div className="p-4">
            <p className="text-[20px] font-bold text-[#332849] mb-3">Node Details</p>

            {/* name + code card */}
            <div
                className="rounded-lg p-5 mb-4"
                style={{ background: gradientBg }}
            >
                <p className="text-lg font-medium text-[#332849]">{node.node_name}</p>
                <span
                    className="mt-3 inline-block px-2 py-1 text-sm font-medium rounded-lg"
                    style={{ color: lc.color, backgroundColor: lc.bg }}
                >
                    {node.node_code}
                </span>
            </div>

            {/* details */}
            <div className="space-y-3">
                <DetailRow label="Level" value={node.level_name ?? `Level ${node.level_number}`} />
                {/* ── FIX: show parent node_name instead of code ── */}
                <DetailRow label="Parent" value={parentDisplay} />
                <DetailRow label="Path" value={formatPath(node.path)} />
            </div>
        </div>
    );
};

const DetailRow = ({ label, value }) => (
    <div className="flex items-start justify-between pt-1 pb-4 border-b-2 border-[#D9D9D9] last:border-0">
        <span className="text-sm font-normal text-[#494747] flex-shrink-0">{label}</span>
        <span className="text-sm font-medium text-[#282F49] text-right">{value}</span>
    </div>
);

const VisualHierarchy = () => {
    const { hierarchies, isLoading: hierarchiesLoading } = useHierarchies();

    const { tree, nodes: nodeCount, levels: levelCount, isLoading: treeLoading, fetchTree } = useVisualHierarchyTree();

    const [selectedHierarchyId, setSelectedHierarchyId] = useState(null);
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
        if (hierarchies.length > 0 && !selectedHierarchyId) {
            setSelectedHierarchyId(hierarchies[0].hierarchy_type_id);
        }
    }, [hierarchies]);

    useEffect(() => {
        if (selectedHierarchyId) {
            fetchTree(selectedHierarchyId);
            setExpandedIds(new Set());
            setSelectedNode(null);
        }
    }, [selectedHierarchyId]);

    const hierarchyOptions = useMemo(
        () => hierarchies.map((h) => ({ value: h.hierarchy_type_id, label: h.hierarchy_name })),
        [hierarchies]
    );

    const nodeMap = useMemo(() => {
        const map = {};
        const walk = (list) => list.forEach((n) => {
            map[n.node_id] = n;
            if (n.children?.length) walk(n.children);
        });
        walk(tree);
        return map;
    }, [tree]);

    const toggleExpand = useCallback((id) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const handleExpandAll = () => setExpandedIds(new Set(collectAllIds(tree)));
    const handleCollapseAll = () => setExpandedIds(new Set());

    return (
        <div className="p-5 m-4 bg-white min-h-screen rounded">
            <Breadcrumb />

            {/* Header */}
            <div className="flex items-start justify-between mb-4 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-[#282F49]">Visual Hierarchy</h1>
                    <p className="text-sm text-[#818181] mt-0.5">Interactive tree visualization – browse and navigate</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-[#CCCCCC] text-[#818181] rounded-lg text-sm font-medium transition-colors">
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search"
                            className="pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8E77BB] w-[250px] bg-white"
                        />
                        <svg className="absolute left-2.5 top-3 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <div className="min-w-[200px]">
                        <SearchableDropdown
                            value={selectedHierarchyId}
                            onChange={setSelectedHierarchyId}
                            options={hierarchyOptions}
                            placeholder="Select Hierarchy"
                        />
                    </div>

                    {!treeLoading && tree.length > 0 && (
                        <div className="flex items-center gap-4 ml-3">
                            <div className="flex flex-col text-center">
                                <span className="text-xs font-medium text-[#818181]">Nodes</span>
                                <span className="text-base font-medium text-[#332849]">{nodeCount}</span>
                            </div>
                            <div className="w-px h-8 bg-gray-200" />
                            <div className="flex flex-col text-center">
                                <span className="text-xs font-medium text-[#818181]">Levels</span>
                                <span className="text-base font-medium text-[#332849]">{String(levelCount).padStart(2, '0')}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExpandAll}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#818181] border border-[#CCCCCC] rounded-lg transition-colors"
                    >
                        <ChevronsRight className="w-3.5 h-3.5" />
                        Expand all
                    </button>
                    <button
                        onClick={handleCollapseAll}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#818181] border border-[#CCCCCC] rounded-lg transition-colors"
                    >
                        <ChevronsDownUp className="w-3.5 h-3.5" />
                        Collapse
                    </button>
                </div>
            </div>

            {/* Main panels */}
            <div className="flex gap-4 min-h-[520px] mt-3">
                {/* Tree panel */}
                <div className="flex-1 rounded-lg overflow-hidden bg-[#FAFAFA]">
                    <div className="px-4 py-3">
                        <p className="text-[20px] font-bold text-[#332849]">Hierarchy Tree</p>
                    </div>
                    <div className="px-3 py-2 overflow-y-auto" style={{ maxHeight: '520px' }}>
                        {treeLoading ? (
                            <div className="space-y-2 p-1">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-2 py-2.5 px-3" style={{ marginLeft: `${(i % 3) * 20}px` }}>
                                        <Skeleton className="h-4 w-4 rounded" />
                                        <Skeleton className="h-4 w-32 rounded" />
                                    </div>
                                ))}
                            </div>
                        ) : tree.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <p className="text-sm text-[#818181]">No hierarchy data available</p>
                            </div>
                        ) : (
                            tree.map((node) => (
                                <TreeNode
                                    key={node.node_id}
                                    node={node}
                                    expandedIds={expandedIds}
                                    toggleExpand={toggleExpand}
                                    selectedNodeId={selectedNode?.node_id}
                                    onSelectNode={setSelectedNode}
                                    depth={0}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Details panel */}
                {selectedNode && (
                    <div className="w-72 flex-shrink-0 rounded-lg overflow-hidden bg-[#FAFAFA]">
                        <NodeDetails node={selectedNode} nodeMap={nodeMap} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default VisualHierarchy;