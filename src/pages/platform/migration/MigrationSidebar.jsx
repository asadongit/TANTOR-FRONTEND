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
        description: 'Import your CSV data',
        name: 'Define'
      },
      {
        id: 'source',
        type: 'source',
        icon: FileSpreadsheet,
        description: 'Import your CSV data',
        name: 'Source'
      },
      {
        id: 'target',
        type: 'target',
        icon: FileSpreadsheet,
        description: 'Import your CSV data',
        name: 'Target'
      },
      {
        id: 'schedule',
        type: 'schedule',
        icon: FileSpreadsheet,
        description: 'Import your CSV data',
        name: 'Schedule'
      }
    ]
  },
  // {
  //   category: 'Data Analysis',
  //   icon: BarChart2,
  //   items: [
  //     {
  //       id: 'data-profiling',
  //       type: 'dataProfiling',
  //       icon: BarChart2,
  //       description: 'Analyze data statistics and quality',
  //       name: 'Data Profiling'
  //     },
  //     {
  //       id: 'data-preparation',
  //       type: 'dataPreparation',
  //       icon: Workflow,
  //       description: 'Clean and prepare dataset',
  //       name: 'Data Preparation'
  //     },
  //     {
  //       id: 'view-csv',
  //       type: 'viewCsv',
  //       icon: Table,
  //       description: 'Display CSV contents',
  //       name: 'View CSV'
  //     }
  //   ]
  // },
  // {
  //   category: 'Machine Learning',
  //   icon: Brain,
  //   items: [
  //     {
  //       id: 'supervised-ml',
  //       type: 'supervisedMl',
  //       icon: Brain,
  //       description: 'Train supervised models',
  //       name: 'Supervised ML'
  //     },
  //     {
  //       id: 'unsupervised-ml',
  //       type: 'unsupervisedMl',
  //       icon: Network,
  //       description: 'Train unsupervised models',
  //       name: 'Unsupervised ML'
  //     },
  //     {
  //       id: 'model-metrics',
  //       type: 'modelMetrics',
  //       icon: LineChart,
  //       description: 'View model performance',
  //       name: 'Model Metrics'
  //     }
  //   ]
  // }
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

{/* <div className="flex justify-center mb-6">
        <img src={Logo} alt="Logo" className="h-12 w-auto" />
      </div> */}


      {/* <h2 className="text-xl font-bold mb-4 text-white">Components</h2> */}

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
