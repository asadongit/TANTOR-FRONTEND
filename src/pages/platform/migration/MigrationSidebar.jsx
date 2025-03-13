import React, { useState } from 'react';
import {
  FileSpreadsheet, Table, Brain, Network, LineChart, BarChart2, Workflow,
  ChevronDown, ChevronRight, Search
} from 'lucide-react';



const components = [
  {
    category: 'Migration',
    icon: FileSpreadsheet,
    items: [
      {
        id: 'define',
        type: 'define',
        icon: FileSpreadsheet,
        description: 'Configure your Migration Details',
        name: 'Define'
      },
      {
        id: 'source',
        type: 'source',
        icon: FileSpreadsheet,
        description: 'Choose your Source Configuration',
        name: 'Source'
      },
      {
        id: 'target',
        type: 'target',
        icon: FileSpreadsheet,
        description: 'Choose your target Configuration',
        name: 'Target'
      }
    ]
  },
];

export function MigrationSidebar() {
  const [expandedCategories, setExpandedCategories] = useState(['Data Input']);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredComponents = components.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className="w-72 bg-gray-900 p-4 border-r border-gray-700 overflow-y-auto">

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search components"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2">
        {filteredComponents.map((category) => (
          <div key={category.category} className="bg-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category.category)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-750 transition-colors text-left border-l-4 border-transparent hover:border-[#8E77BB]"
            >
              <div className="flex items-center space-x-3">
                <category.icon className="w-5 h-5 text-[#8E77BB]" />
                <span className="text-white font-medium">{category.category}</span>
              </div>
              {expandedCategories.includes(category.category) ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {expandedCategories.includes(category.category) && (
              <div className="grid grid-cols-1 gap-2 p-2 bg-gray-850 border-t border-gray-700">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 transition-all cursor-move"
                    onDragStart={(e) => onDragStart(e, item.type)}
                    draggable
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-800 rounded-lg">
                      <item.icon className="w-5 h-5 text-gray-400 hover:text-blue-400 transition-colors" />
                    </div>
                    <span className="text-gray-200 text-sm">{item.name}</span>
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
