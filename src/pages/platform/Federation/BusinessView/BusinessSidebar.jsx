/*eslint-disable*/
import React, { useState } from 'react';
import {
  Network, ChevronDown, ChevronRight, Cable, SquareKanban, PanelLeftClose, PanelLeftOpen, Plus
} from 'lucide-react';



const components = [
  {
    id: 'source-view',
    type: 'sourceView',
    icon: SquareKanban,
    name: 'Source View'
  },
  {
    id: 'connection',
    type: 'connection',
    icon: Cable,
    name: 'Connection'
  },
  {
    id: 'consolidation',
    type: 'consolidation',
    icon: Network,
    name: 'Consolidation'
  }
]


export function BusinessSidebar() {
  const [expanded, setExpanded] = useState(true)

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleToggle = () => {
    setExpanded(!expanded)
  }


  return (
    <div className="w-25 px-1 py-2 ml-5 overflow-y-auto h-fit bg-white rounded-lg shadow-lg">
      <div className="space-y-1">
        <div className="bg-white rounded-lg overflow-hidden">
          <button
            onClick={handleToggle}
            className="w-full flex items-center justify-between p-1 hover:bg-gray-750 transition-colors text-left border-l-4 border-transparent hover:border-[#8E77BB]"
          >
            {expanded && (
              <div className="flex items-center space-x-2">
                <span className="text-black font-medium text-lg">Federation</span>
              </div>
            )}
            {expanded ? (
              <PanelLeftClose className="w-5 h-5 text-black" />
            ) : (
              <PanelLeftOpen className="w-5 h-5 text-black" />
            )}
          </button>

          <div className="grid grid-cols-1 gap-2 p-2 bg-gray-850 border-gray-700">
            {components.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-1 py-2 rounded-lg  transition-all cursor-move hover:bg-gray-50 rounded-lg group border-solid border-2"
                onDragStart={(e) => onDragStart(e, item.type)}
                draggable
              >
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg">
                    <item.icon className="w-4 h-4 text-[#8E77BB] transition-colors" />
                  </div>
                  {expanded && (
                    <span className="text-black text-sm ml-1">{item.name}</span>
                  )}
                </div>
                <button
                  className={`rounded-md hover:bg-gray-200 ${expanded && 'ml-3'}`}
                >
                  <Plus className="h-4 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
        {/*  ))} */}
      </div>
    </div>
  );
}
