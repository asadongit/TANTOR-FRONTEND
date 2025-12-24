import React, { useState, useRef, useEffect } from "react";
import {
    Network,
    PanelLeftClose,
    PanelLeftOpen,
    Layers,
    Plus,
    Database,
    ArrowRightLeft,
    Calendar,
    FileText
} from "lucide-react";
import toast from "react-hot-toast";

export default function MigrationSidebar({ presentNodeTypes = {}, onModeChange, isEditMode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [isHovering, setIsHovering] = useState(null);
    const [mode, setMode] = useState("migration");

    const migrationNodes = [
        {
            type: "define",
            label: "Define",
            icon: FileText,
            color: "#8e78b7",
            description: "Define migration parameters"
        },
        {
            type: "source",
            label: "Source",
            icon: Database,
            color: "#8e78b7",
            description: "Configure source database"
        },
        {
            type: "target",
            label: "Target",
            icon: Database,
            color: "#8e78b7",
            description: "Configure target database"
        },
        {
            type: "scheduler",
            label: "Schedule",
            icon: Calendar,
            color: "#8e78b7",
            description: "Schedule migration execution"
        }
    ];

    const metadataNodes = [
        {
            type: "define",
            label: "Define",
            icon: FileText,
            color: "#8e78b7",
            description: "Define metadata parameters"
        },
        {
            type: "source",
            label: "Source",
            icon: Database,
            color: "#8e78b7",
            description: "Configure source metadata"
        },
        {
            type: "target",
            label: "Target",
            icon: Database,
            color: "#8e78b7",
            description: "Configure target metadata"
        }
    ];


    const handleNodeDrag = (nodeType) => (e) => {
        e.dataTransfer.setData(
            "application/reactflow",
            JSON.stringify({
                type: nodeType,
                category: mode,
            })
        );
        e.dataTransfer.effectAllowed = "move";
    };

    const nodesToDisplay = mode === "migration" ? migrationNodes : metadataNodes;

    const handleModeToggle = () => {
        const newMode = mode === "migration" ? "metadata" : "migration";
        setMode(newMode);
        onModeChange(newMode);
    };

    return (
        <aside
            className={`
        z-20
        absolute
        top-4
        left-4
        transition-all
        duration-300
        ease-in-out
        border
        border-gray-300
        shadow-lg
        rounded-lg
        bg-white
        ${collapsed ? "w-20" : "w-[240px]"}
      `}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                {!collapsed && (
                    <div className="flex items-center space-x-3">
                        <Network className="w-5 h-5 text-purple-600" />
                        <div className="flex flex-col">
                            <span className="text-gray-800 text-lg font-bold">
                                {mode === "migration" ? "MIGRATION" : "METADATA"}
                            </span>
                            {isEditMode && (
                                <span className="text-sm font-medium text-gray-500">(Edit Mode)</span>
                            )}
                        </div>
                    </div>
                )}
                <div className="flex items-center space-x-2">
                    {!isEditMode && (
                        <button
                            className="p-1 rounded-md hover:bg-gray-200 transition"
                            onClick={handleModeToggle}
                            title="Toggle Mode"
                        >
                            <ArrowRightLeft className="w-5 h-5 text-gray-600" />
                        </button>
                    )}
                    <button
                        className="p-1 rounded-md hover:bg-gray-200 transition"
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        {collapsed ? (
                            <PanelLeftOpen className="w-5 h-5 text-gray-600" />
                        ) : (
                            <PanelLeftClose className="w-5 h-5 text-gray-600" />
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div
                className={`p-3 ${collapsed ? "flex flex-col items-center space-y-3" : "space-y-4"
                    }`}
            >
                {/* Divider */}
                <div className="w-full mb-2">
                    {!collapsed ? (
                        <div className="flex items-center space-x-2">
                            <Layers className="w-4 h-4 text-gray-500" />
                            <span className="text-xs font-medium text-gray-500 uppercase">
                                {mode === "migration" ? "Migration Nodes" : "Metadata Nodes"}
                            </span>
                            <div className="flex-grow h-px bg-gray-200"></div>
                        </div>
                    ) : (
                        <div className="relative flex justify-center w-full mt-2 mb-4">
                            <div className="w-12 h-px bg-gray-300 mt-3"></div>
                            <div
                                className="absolute w-6 h-6 rounded-full hover:bg-purple-100 bg-gray-100 flex items-center justify-center
                   border border-gray-300 mb-2 transition-transform duration-200 ease-in-out hover:scale-125"
                                onMouseEnter={() => setIsHovering("nodes-label")}
                                onMouseLeave={() => setIsHovering(null)}
                            >
                                <Layers className="w-3 h-3 text-gray-500" />
                                {isHovering === "nodes-label" && (
                                    <div
                                        className="absolute left-full ml-2 top-0 -translate-y-1/2
                          bg-purple-600 text-white text-xs px-2 py-1 rounded-md
                          whitespace-nowrap z-50 shadow-lg"
                                    >
                                        {mode === "migration" ? "Migration Nodes" : "Metadata Nodes"}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Nodes */}
                <div className={`${collapsed ? "space-y-3" : "space-y-2 mt-2"}`}>
                    {nodesToDisplay.map((node) => {
                        const disabled = !!presentNodeTypes[node.type];
                        return (
                            <div
                                key={node.type}
                                className={`flex items-center p-3 rounded-lg border border-gray-300 transition relative
                                    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-move hover:bg-purple-50 hover:border-purple-300"}
                                `}
                                draggable={!disabled}
                                onMouseEnter={() => setIsHovering(node.type)}
                                onMouseLeave={() => setIsHovering(null)}
                                onDragStart={!disabled ? handleNodeDrag(node.type) : undefined}
                                title={node.description}
                            >
                                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                                    <node.icon className="w-5 h-5" style={{ color: node.color }} />

                                    {collapsed && isHovering === node.type && !disabled && (
                                        <div
                                            className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2
                      bg-purple-600 text-white text-xs px-2 py-1 rounded-md
                      whitespace-nowrap z-30 shadow-lg"
                                        >
                                            {node.label} +
                                        </div>
                                    )}
                                </div>

                                {!collapsed && (
                                    <div className="flex items-center justify-between flex-grow">
                                        <span className="text-gray-800 text-sm font-medium ml-3">
                                            {node.label}
                                        </span>
                                        <div className="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center ml-2">
                                            <Plus className="w-3 h-3 text-purple-600" />
                                        </div>
                                    </div>
                                )}

                            </div>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}