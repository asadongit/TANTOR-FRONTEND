import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const Step5 = ({ policyData, onDataChange }) => {
    const [selectedTable, setSelectedTable] = useState('');
    const [tableSearch, setTableSearch] = useState('');
    const [openTableDropdown, setOpenTableDropdown] = useState(false);

    const initialControls = policyData.column_access_control || {};
    const [tableControls, setTableControls] = useState(initialControls);

    useEffect(() => {
        if (Object.keys(policyData.column_access_control || {}).length === 0) {
            setSelectedTable('');
            setTableSearch('');
            setTableControls({});
        }
    }, [policyData.column_access_control]);

    const allTables = policyData.data_connection.flatMap((conn) =>
        conn.tables.map((table) => ({
            fullPath: table,
            connection: conn.connection,
            schema: conn.schema,
            tableName: table.split('.').pop(),
        }))
    );

    const filteredTables = allTables.filter((table) =>
        table.fullPath.toLowerCase().includes(tableSearch.toLowerCase())
    );

    const getColumnsForSelectedTable = () => {
        if (!selectedTable) return [];

        const usedColumns = (tableControls[selectedTable] || []).map(control => control.column);

        const tableConn = policyData.data_connection.find((conn) =>
            conn.tables.includes(selectedTable)
        );

        return (
            tableConn?.columns
                .filter((col) => col.startsWith(`${selectedTable}.`))
                .filter((col) => !usedColumns.includes(col))
                .map((col) => ({
                    fullPath: col,
                    columnName: col.split('.').pop(),
                })) || []
        );
    };

    const handleTableChange = (value) => {
        setSelectedTable(value);
        setOpenTableDropdown(false);
    };

    const handleAddControl = () => {
        if (!selectedTable) return;
        const newControl = {
            column: '',
            type: 'masking',
        };
        setTableControls((prev) => ({
            ...prev,
            [selectedTable]: [...(prev[selectedTable] || []), newControl],
        }));
    };

    const handleControlChange = (table, index, field, value) => {
        const updatedControls = {
            ...tableControls,
            [table]: tableControls[table].map((control, i) =>
                i === index ? { ...control, [field]: value } : control
            ),
        };
        setTableControls(updatedControls);
        onDataChange({ column_access_control: updatedControls });
    };

    const handleRemoveControl = (table, index) => {
        const updatedControls = {
            ...tableControls,
            [table]: tableControls[table].filter((_, i) => i !== index),
        };
        if (updatedControls[table].length === 0) {
            delete updatedControls[table];
        }
        setTableControls(updatedControls);
        onDataChange({ column_access_control: updatedControls });
    };

    const isControlComplete = (control) => {
        return control.column;
    };

    const renderTableSelect = () => (
        <div className="relative mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Table
            </label>
            <div
                className="w-full p-2 border border-gray-300 rounded-md bg-white cursor-pointer h-10 flex items-center"
                onClick={() => setOpenTableDropdown((prev) => !prev)}
            >
                <span className="whitespace-nowrap">
                    {selectedTable
                        ? allTables.find((t) => t.fullPath === selectedTable)?.tableName ||
                        'Select Table'
                        : 'Select Table'}
                </span>
            </div>
            {openTableDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    <input
                        type="text"
                        placeholder="Search tables..."
                        className="w-full p-2 border-b border-gray-200 outline-none"
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                    />
                    {filteredTables.map((table) => (
                        <div
                            key={table.fullPath}
                            className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleTableChange(table.fullPath)}
                        >
                            <span className="font-medium">{table.tableName}</span>
                            <span className="text-sm text-gray-500 ml-2">
                                {table.connection} &gt; {table.schema}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderTableChips = () => (
        <div className="flex flex-wrap gap-2 mb-4">
            {Object.keys(tableControls).map((table) => (
                <span
                    key={table}
                    className={`px-3 py-1 rounded-sm text-sm font-medium cursor-pointer ${selectedTable === table
                        ? 'text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    style={{
                        backgroundColor: selectedTable === table ? '#8e78b7' : undefined,
                        ...(selectedTable === table && {
                            ':hover': { backgroundColor: '#7b689e' },
                        }),
                    }}
                    onClick={() => setSelectedTable(table)}
                >
                    {table.split('.').pop()}
                </span>
            ))}
        </div>
    );

    const renderControlItems = () => {
        if (!selectedTable) return null;
        const controls = tableControls[selectedTable] || [];

        return (
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-base font-medium text-gray-700">
                        Column Controls for: {selectedTable.split('.').pop()}
                    </h4>
                    <button
                        className={`flex items-center px-3 py-1 border rounded-md text-sm font-medium ${controls.length > 0 && !isControlComplete(controls[controls.length - 1])
                            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                            : 'text-[#8e78b7] hover:bg-[#8e78b7]/10'
                            }`}
                        style={{
                            borderColor:
                                controls.length > 0 &&
                                    !isControlComplete(controls[controls.length - 1])
                                    ? undefined
                                    : '#8e78b7',
                        }}
                        onClick={handleAddControl}
                        disabled={
                            controls.length > 0 &&
                            !isControlComplete(controls[controls.length - 1])
                        }
                    >
                        <Plus size={16} className="mr-1" />
                        Add Column Control
                    </button>
                </div>

                {controls.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-4">
                        No column controls added yet
                    </p>
                ) : (
                    <div className="max-h-60 overflow-y-auto">
                        {controls.map((control, index) => (
                            <div key={`${selectedTable}-${control.column || index}`} className="mb-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="min-w-[180px]">
                                        <label className="block text-sm text-gray-700 mb-1">
                                            Column
                                        </label>
                                        <select
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                            value={control.column}
                                            onChange={(e) =>
                                                handleControlChange(
                                                    selectedTable,
                                                    index,
                                                    'column',
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">Select Column</option>
                                            {getColumnsForSelectedTable().map((col) => (
                                                <option key={col.fullPath} value={col.fullPath}>
                                                    {col.columnName}
                                                </option>
                                            ))}
                                            {/* Show currently selected column even if it's already used */}
                                            {control.column && !getColumnsForSelectedTable().some(c => c.fullPath === control.column) && (
                                                <option value={control.column}>
                                                    {control.column.split('.').pop()}
                                                </option>
                                            )}
                                        </select>
                                    </div>

                                    <div className="min-w-[120px]">
                                        <label className="block text-sm text-gray-700 mb-1">
                                            Type
                                        </label>
                                        <select
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                            value={control.type}
                                            onChange={(e) =>
                                                handleControlChange(
                                                    selectedTable,
                                                    index,
                                                    'type',
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="masking">Masking</option>
                                            <option value="hashing">Hashing</option>
                                        </select>
                                    </div>

                                    <button
                                        className="p-2 text-red-600 hover:text-red-700"
                                        onClick={() => handleRemoveControl(selectedTable, index)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            <h3 className="text-lg font-medium mb-6" style={{ color: '#8e78b7' }}>
                Column Access Control
            </h3>
            {renderTableSelect()}
            {Object.keys(tableControls).length > 0 && renderTableChips()}
            {renderControlItems()}
        </div>
    );
};

export default Step5;