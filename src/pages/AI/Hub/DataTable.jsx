import { MoreVertical, Library, Box, Database, Archive, Trash2 } from 'lucide-react';
import { useState } from 'react';

const DataTable = () => {
  const [openMenu, setOpenMenu] = useState(null);

  const tableData = [
    {
      id: 1,
      name: 'Project - Churn',
      createdDate: '01/10/2025',
      lastUsedDate: '07/10/2025',
      size: '23 MB',
      rows: 23,
      features: 'Salah',
      tags: []
    },
    {
      id: 2,
      name: 'Project - Analysis',
      createdDate: '01/10/2025',
      lastUsedDate: '01/10/2025',
      size: '23 MB',
      rows: 23,
      features: 'Salad',
      tags: [{ label: 'Library', icon: Library, color: 'bg-purple-100 text-purple-700' }]
    },
    {
      id: 3,
      name: 'Project - Retention',
      createdDate: '15/11/2025',
      lastUsedDate: '15/11/2025',
      size: '23 MB',
      rows: 23,
      features: 'Moki',
      tags: [{ label: 'FI Mode', icon: Box, color: 'bg-gray-100 text-gray-700' }]
    },
    {
      id: 4,
      name: 'Project - Acquisition',
      createdDate: '01/12/2025',
      lastUsedDate: '01/12/2025',
      size: '23 MB',
      rows: 23,
      features: 'And',
      tags: [{ label: 'AI Camus', icon: Database, color: 'bg-gray-100 text-gray-700' }]
    },
    {
      id: 5,
      name: 'Project - Engagement',
      createdDate: '20/10/2025',
      lastUsedDate: '20/12/2025',
      size: '23 MB',
      rows: 23,
      features: 'Niko',
      tags: [
        { label: 'Deploy', icon: Box, color: 'bg-gray-100 text-gray-700' },
        { label: 'Archive', icon: Archive, color: 'bg-gray-100 text-gray-700' }
      ]
    },
    {
      id: 6,
      name: 'Project - Onboarding',
      createdDate: '05/01/2025',
      lastUsedDate: '05/01/2026',
      size: '23 MB',
      rows: 23,
      features: 'Yang',
      tags: [{ label: 'Delete', icon: Trash2, color: 'bg-pink-100 text-pink-700' }]
    },
    {
      id: 7,
      name: 'Project - Feedback',
      createdDate: '30/01/2026',
      lastUsedDate: '30/01/2026',
      size: '23 MB',
      rows: 23,
      features: 'Darubu',
      tags: []
    },
    {
      id: 8,
      name: 'Project - Analysis',
      createdDate: '18/02/2026',
      lastUsedDate: '16/03/2026',
      size: '23 MB',
      rows: 23,
      features: 'Thames',
      tags: []
    },
    {
      id: 9,
      name: 'Project - Strategy',
      createdDate: '01/03/2026',
      lastUsedDate: '01/03/2026',
      size: '23 MB',
      rows: 23,
      features: 'Sethi',
      tags: []
    },
    {
      id: 10,
      name: 'Project - Optimization',
      createdDate: '16/03/2026',
      lastUsedDate: '16/03/2026',
      size: '23 MB',
      rows: 23,
      features: 'Mississippi',
      tags: []
    }
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-300">
        <thead className="bg-white border-b border-gray-300">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sno</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Used Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rows</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Features</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tableData.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                {row.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.createdDate}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.lastUsedDate}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.size}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.rows}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.features}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="flex items-center gap-2 justify-end">
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === row.id ? null : row.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>
                    
                    {openMenu === row.id && (
                      <div className="absolute right-8 top-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 pr-2 z-10">
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                          <Library className="w-4 h-4 text-purple-600" />
                          <span>Library</span>
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                          <Box className="w-4 h-4 text-gray-600" />
                          <span>FI Mode</span>
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                          <Database className="w-4 h-4 text-gray-600" />
                          <span>AI Canvas</span>
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                          <Box className="w-4 h-4 text-gray-600" />
                          <span>Deploy</span>
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                          <Archive className="w-4 h-4 text-gray-600" />
                          <span>Archive</span>
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-3">
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="flex items-center justify-between px-6 py-4 bg-white border border-gray-300">
        <span className="text-sm text-gray-600">10 to 10 of results</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Show per page:</span>
          <select className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option>04</option>
            <option>10</option>
            <option>20</option>
            <option>50</option>
          </select>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              &lt;
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;