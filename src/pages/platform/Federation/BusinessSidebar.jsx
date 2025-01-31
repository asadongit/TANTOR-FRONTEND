/*eslint-disable*/
import React, { useState } from 'react';
import {
 Network,ChevronDown, ChevronRight,Cable,SquareKanban,PanelLeftClose,PanelLeftOpen,Plus
} from 'lucide-react';



const components = [
  {
    category: 'Federation',
    items: [
      {
        id: 'source-view',
        type: 'sourceView',
        icon: SquareKanban,
        description: 'Choose Source View',
        name: 'Source View'
      },
      {
        id: 'connection',
        type: 'connection',
        icon: Cable,
        description: 'Choose Connection',
        name: 'Connection'
      },
      {
        id: 'consolidation',
        type: 'consolidation',
        icon: Network,
        description: 'Choose Consolidation',
        name: 'Consolidation'
      }
    ]
  }
];

export function BusinessSidebar() {
  const [expandedCategories, setExpandedCategories] = useState(['Federation']);

  const toggleCategory = (category) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };


  return (
    <div className="w-25 p-2 ml-5 overflow-y-auto h-fit bg-white rounded-lg shadow-lg">
      <div className="space-y-1">
        {components.map((category) => (
          <div key={category.category} className="bg-white rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category.category)}
              className="w-full flex items-center justify-between p-1 hover:bg-gray-750 transition-colors text-left border-l-4 border-transparent hover:border-[#8E77BB]"
            >
              <div className="flex items-center space-x-2">
             {expandedCategories.includes(category.category) && (
                <span className="text-black font-medium text-lg">{category.category}</span>  )}
              </div>
              {expandedCategories.includes(category.category) ? (
                <PanelLeftClose className="w-4 h-4 text-black" />
              ) : (
                <PanelLeftOpen className="w-4 h-4 text-black" />
              )}
            </button>

            {expandedCategories.includes(category.category) && (
              <div className="grid grid-cols-1 gap-2 p-2 bg-gray-850 border-gray-700">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg  transition-all cursor-move hover:bg-gray-50 rounded-lg group border-solid border-2"
                    onDragStart={(e) => onDragStart(e, item.type)}
                    draggable
                  >
                    <div className="flex items-center justify-center">
                    <div className="flex items-center justify-center w-6 h-6 rounded-lg">
                      <item.icon className="w-4 h-4 text-[#8E77BB] transition-colors" />
                    </div>
                    {expandedCategories.includes(category.category) && (
                    <span className="text-black text-sm ml-1">{item.name}</span> )}
                    </div>
                     <button
                    className="p-1 rounded-md hover:bg-gray-200 "
                     >
                    <Plus className="h-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
