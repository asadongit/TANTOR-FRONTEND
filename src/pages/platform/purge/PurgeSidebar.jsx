import { useState } from "react";
import {
  FileSpreadsheet,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Layers,
} from "lucide-react";

const components = [
  {
    id: "define",
    name: "Define",
    icon: FileSpreadsheet,
    description: "Define purge parameters",
  },
  {
    id: "source",
    name: "Source",
    icon: FileSpreadsheet,
    description: "Configure source",
  },
  {
    id: "target",
    name: "Target",
    icon: FileSpreadsheet,
    description: "Configure target",
  },
];

function PurgeSidebar({ presentNodeTypes }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(null);

  const onDragStart = (event, nodeType) => {
    if (presentNodeTypes[nodeType]) return;
    event.dataTransfer.setData("application/reactflow", JSON.stringify({ type: nodeType }));
    event.dataTransfer.effectAllowed = "move";
  };

  const handleToggle = () => {
    setCollapsed(!collapsed);
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
            <FileSpreadsheet className="w-5 h-5 text-purple-600" />
            <span className="text-gray-800 text-lg font-bold">PURGE</span>
          </div>
        )}
        <button
          className="p-1 rounded-md hover:bg-gray-200 transition"
          onClick={handleToggle}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-gray-600" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Content */}
      <div
        className={`p-3 ${
          collapsed ? "flex flex-col items-center space-y-3" : "space-y-4"
        }`}
      >
        {/* Divider */}
        <div className="w-full mb-2">
          {!collapsed ? (
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">
                Purge Nodes
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
                    Purge Nodes
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Nodes */}
        <div className={`${collapsed ? "space-y-3" : "space-y-2 mt-2"}`}>
          {components.map((item) => {
            const isPresent = presentNodeTypes[item.id];
            return (
              <div
                key={item.id}
                className={`flex items-center p-3 rounded-lg border border-gray-300 transition cursor-move hover:bg-purple-50 hover:border-purple-300 ${
                  isPresent ? 'opacity-50 pointer-events-none' : ''
                }`}
                draggable={!isPresent}
                onMouseEnter={() => setIsHovering(item.id)}
                onMouseLeave={() => setIsHovering(null)}
                onDragStart={(e) => onDragStart(e, item.id)}
                title={isPresent ? `${item.description} (Already added)` : item.description}
              >
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                  <item.icon className="w-5 h-5" style={{ color: "#8e78b7" }} />
                  {collapsed && isHovering === item.id && (
                    <div
                      className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2
                      bg-purple-600 text-white text-xs px-2 py-1 rounded-md
                      whitespace-nowrap z-30 shadow-lg"
                    >
                      {item.name} +
                    </div>
                  )}
                </div>
                {!collapsed && (
                  <div className="flex items-center justify-between flex-grow">
                    <span className="text-gray-800 text-sm font-medium ml-3">
                      {item.name}
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

export default PurgeSidebar;
