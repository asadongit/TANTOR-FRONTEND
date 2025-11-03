import React, { useState } from 'react';
import { X } from 'lucide-react';

const renderAccessControlDetails = (detailsObject, isColumnControl = false) => {
    if (!detailsObject || Object.keys(detailsObject).length === 0) {
        return <p className="text-sm text-gray-500 text-center py-4">No access control details.</p>;
    }

    const [selectedTable, setSelectedTable] = useState('');
    const [tableSearch, setTableSearch] = useState('');
    const [openTableDropdown, setOpenTableDropdown] = useState(false);

    const allTables = Object.keys(detailsObject).map(table => ({
        fullPath: table,
        tableName: (table.split('.').pop() || table).length > 20 
            ? `${(table.split('.').pop() || table).substring(0, 17)}...` 
            : (table.split('.').pop() || table),
        fullTableName: table
    }));

    const filteredTables = allTables.filter(table =>
        table.fullPath.toLowerCase().includes(tableSearch.toLowerCase())
    );

    const handleTableChange = (value) => {
        setSelectedTable(value);
        setOpenTableDropdown(false);
    };

    const renderTableChips = () => (
        <div className="flex flex-wrap gap-2 mb-4">
            {allTables.map((table) => (
                <span
                    key={table.fullPath}
                    title={table.fullTableName}
                    className={`px-3 py-1 rounded-sm text-sm font-medium cursor-pointer ${selectedTable === table.fullPath
                        ? 'text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    style={{
                        backgroundColor: selectedTable === table.fullPath ? '#8e78b7' : undefined,
                    }}
                    onClick={() => setSelectedTable(table.fullPath)}
                >
                    {table.tableName}
                </span>
            ))}
        </div>
    );

    const renderRulesForTable = () => {
        if (!selectedTable || !detailsObject[selectedTable]) {
            return null;
        }

        const rules = detailsObject[selectedTable];

        return (
            <div className={`border border-gray-200 rounded-lg p-4 mb-6 }`}>
                {rules.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-4">
                        No conditions defined
                    </p>
                ) : (
                    <div className="max-h-72 overflow-y-auto ">
                        {rules.map((rule, index) => (
                            <div key={`${selectedTable}-${index}`} className="mb-4">
                                {isColumnControl ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-700 mb-1">
                                                Column
                                            </label>
                                            <div className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-50">
                                                {rule.column.split('.').pop()}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-700 mb-1">
                                                Type
                                            </label>
                                            <div className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-50">
                                                {rule.type || '-'}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="min-w-[180px]">
                                                <label className="block text-sm text-gray-700 mb-1">
                                                    Column
                                                </label>
                                                <div className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-50">
                                                    {rule.column.split('.').pop()}
                                                </div>
                                            </div>

                                            <div className="min-w-[100px]">
                                                <label className="block text-sm text-gray-700 mb-1">
                                                    Operator
                                                </label>
                                                <div className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-50">
                                                    {rule.operator}
                                                </div>
                                            </div>

                                            <div className="flex-1">
                                                <label className="block text-sm text-gray-700 mb-1">
                                                    Value
                                                </label>
                                                <div className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-50">
                                                    {rule.value}
                                                </div>
                                            </div>
                                        </div>

                                        {rule.logicWithNext && index < rules.length - 1 && (
                                            <div className="flex justify-end my-2">
                                                <div className="w-32 p-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-center">
                                                    {rule.logicWithNext}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-h-[60vh] overflow-y-auto pr-2">
            {allTables.length > 0 && renderTableChips()}
            {renderRulesForTable()}
        </div>
    );
};

// const renderConnectionDetails = (connectionData) => {
//   if (!connectionData || connectionData.length === 0) {
//     return <p className="text-sm text-gray-500 text-center py-4">No connection details available.</p>;
//   }

//   return (
//     <div className="max-h-[60vh] overflow-y-auto pr-2">
//       <div className="space-y-4">
//         {connectionData.map((connection, index) => (
//           <div key={index} className="border border-gray-200 rounded-lg p-4">
//             <div className="mb-4">
//               <h4 className="text-sm font-medium text-gray-700 mb-1">Connection</h4>
//               <div className="p-2 bg-gray-50 rounded-md text-sm">
//                 {connection.connection}
//               </div>
//             </div>
            
//             <div className="mb-4">
//               <h4 className="text-sm font-medium text-gray-700 mb-1">Schema</h4>
//               <div className="p-2 bg-gray-50 rounded-md text-sm">
//                 {connection.schema.split('.').pop()}
//               </div>
//             </div>
            
//             {connection.tables.length > 0 && (
//               <div className="mb-4">
//                 <h4 className="text-sm font-medium text-gray-700 mb-1">Tables</h4>
//                 <div className="space-y-2">
//                   {connection.tables.map((table, tableIndex) => (
//                     <div key={tableIndex} className="p-2 bg-gray-50 rounded-md text-sm">
//                       {table.split('.').pop()}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
            
//             {connection.columns.length > 0 && (
//               <div>
//                 <h4 className="text-sm font-medium text-gray-700 mb-1">Columns</h4>
//                 <div className="space-y-2">
//                   {connection.columns.map((column, columnIndex) => (
//                     <div key={columnIndex} className="p-2 bg-gray-50 rounded-md text-sm">
//                       {column.split('.').pop()}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };


const renderConnectionDetails = (connectionData) => {
  if (!connectionData || connectionData.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-4">No connection details available.</p>;
  }

  const [searchTerm, setSearchTerm] = useState('');

  const filteredConnections = connectionData.map(connection => {
    const filteredTables = connection.tables.filter(table => 
      table.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const filteredColumns = connection.columns.filter(column => 
      column.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return {
      ...connection,
      tables: filteredTables,
      columns: filteredColumns
    };
  }).filter(connection => 
    connection.connection.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.schema.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.tables.length > 0 ||
    connection.columns.length > 0
  );

  return (
    <div className="max-h-[60vh] overflow-y-auto pr-2">
      <div className="mb-4 sticky top-0 bg-white pb-2 z-10">
        <div className="relative">
          <input
            type="text"
            placeholder="Search connections, schemas, tables or columns..."
            className="w-full p-2 pl-8 border border-gray-300 rounded-md text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredConnections.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No results found.</p>
      ) : (
        <div className="space-y-4">
          {filteredConnections.map((connection, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Connection</h4>
                <div 
                  className="p-2 bg-gray-50 rounded-md text-sm"
                  dangerouslySetInnerHTML={{
                    __html: highlightMatches(connection.connection, searchTerm)
                  }}
                />
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Schema</h4>
                <div 
                  className="p-2 bg-gray-50 rounded-md text-sm"
                  dangerouslySetInnerHTML={{
                    __html: highlightMatches(connection.schema.split('.').pop(), searchTerm)
                  }}
                />
              </div>
              
              {connection.tables.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Tables</h4>
                  <div className="space-y-2">
                    {connection.tables.map((table, tableIndex) => (
                      <div 
                        key={tableIndex} 
                        className="p-2 bg-gray-50 rounded-md text-sm"
                        dangerouslySetInnerHTML={{
                          __html: highlightMatches(table.split('.').pop(), searchTerm)
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {connection.columns.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Columns</h4>
                  <div className="space-y-2">
                    {connection.columns.map((column, columnIndex) => (
                      <div 
                        key={columnIndex} 
                        className="p-2 bg-gray-50 rounded-md text-sm"
                        dangerouslySetInnerHTML={{
                          __html: highlightMatches(column.split('.').pop(), searchTerm)
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const highlightMatches = (text, searchTerm) => {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
  return text.toString().replace(regex, '<span class="bg-yellow-200">$1</span>');
};

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const renderRolesDetails = (userSelections) => {
    if (!userSelections || Object.keys(userSelections).length === 0) {
        return <p className="text-sm text-gray-500 text-center py-4">No roles details available.</p>;
    }

    return (
        <div className="max-h-[50vh] overflow-y-auto pr-2">
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                <div className="space-y-3">
                    <div className="p-3 border border-gray-100 rounded-md bg-white shadow-xs">
                        <span className="font-medium text-gray-900">Role:</span>
                        <span className="ml-2 text-sm text-gray-800">{userSelections.role || '-'}</span>
                    </div>
                    <div className="p-3 border border-gray-100 rounded-md bg-white shadow-xs">
                        <span className="font-medium text-gray-900">Group:</span>
                        <span className="ml-2 text-sm text-gray-800">{userSelections.group || '-'}</span>
                    </div>
                    <div className="p-3 border border-gray-100 rounded-md bg-white shadow-xs">
                        <span className="font-medium text-gray-900">Sub-group:</span>
                        <span className="ml-2 text-sm text-gray-800">{userSelections.subGroup || '-'}</span>
                    </div>
                    <div className="p-3 border border-gray-100 rounded-md bg-white shadow-xs">
                        <span className="font-medium text-gray-900">Persona:</span>
                        <span className="ml-2 text-sm text-gray-800">
                            {Array.isArray(userSelections.persona)
                                ? (userSelections.persona.filter(p => p !== '').join(', ') || '-')
                                : (userSelections.persona || '-')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const renderPermissionsDetails = (permissions) => {
    if (!permissions || Object.keys(permissions).length === 0) {
        return <p className="text-sm text-gray-500 text-center py-4">No permissions defined.</p>;
    }

    const enabledPermissions = Object.entries(permissions)
        .filter(([_, value]) => value === true)
        .map(([key]) => key);

    if (enabledPermissions.length === 0) {
        return <p className="text-sm text-gray-500 text-center py-4">No enabled permissions.</p>;
    }

    return (
        <ul className="list-disc pl-5 max-h-[50vh] overflow-y-auto">
            {enabledPermissions.map((permission, index) => (
                <li key={index} className="text-sm text-gray-700 mb-1 capitalize">
                    {permission}
                </li>
            ))}
        </ul>
    );
};


const DetailsModal = ({ isOpen, onClose, title, items, type }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-[60%] max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                {type === 'accessControl' ? (
                    renderAccessControlDetails(items, title.includes("Column")) 
                ) : type === 'connectionDetails' ? (
                    renderConnectionDetails(items)
                ) : type === 'roles' ? (
                    renderRolesDetails(items)
                ) : type === 'permissions' ? (
                    renderPermissionsDetails(items)
                ): (
                    <ul className="list-disc pl-5 max-h-[50vh] overflow-y-auto">
                        {items && Array.isArray(items) && items.length > 0 ? (
                            items.map((item, index) => (
                                <li key={index} className="text-sm text-gray-700 mb-1">
                                    {typeof item === 'object' ? JSON.stringify(item) : item}
                                </li>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">No details available.</p>
                        )}
                    </ul>
                )}
                <div className="flex justify-end mt-4">
                    
                </div>
            </div>
        </div>
    );
};

export default DetailsModal;