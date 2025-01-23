import { Icon } from '@iconify/react';
import { useEffect, useState } from 'react';

export function SourceNode({ data }) {
    const handleClick = (event) => {
        event.preventDefault();
        data.setUserSelection({ ...data.userSelection, selectedMode: event.target.id });
    };

    return (
        <div className="w-64 p-4 mt-1 bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Federation</h2>
                <button className="text-gray-400 hover:text-gray-600">
                    <Icon icon="mdi:chevron-right" width={20} height={20} />
                </button>
            </div>
            <div className="space-y-2">
                <button
                    id="sourceView"
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg group border-solid border-2"
                    onClick={handleClick}
                >
                    <div className="flex items-center space-x-3 pointer-events-none">
                        <Icon icon="mdi:chart-line" className="w-5 h-5 text-purple-500" />
                        <span className="text-gray-700">Source view</span>
                    </div>
                    <span className="text-gray-400 group-hover:text-gray-600 pointer-events-none">+</span>
                </button>

                <button
                    id="connection"
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg group border-solid border-2"
                    onClick={handleClick}
                >
                    <div className="flex items-center space-x-3 pointer-events-none">
                        <Icon icon="mdi:link" className="w-5 h-5 text-purple-500" />
                        <span className="text-gray-700">Connection</span>
                    </div>
                    <span className="text-gray-400 group-hover:text-gray-600 pointer-events-none">+</span>
                </button>
            </div>
        </div>
    );
}

export function SourceViewNode({ data }) {
    if (data.userSelection.selectedMode !== "sourceView") return null;

    const [currentViewState, setViewState] = useState({
        apiViewsResult: [],
        selectedViewName: "",
        selectedViewColumns: [],
        userCheckedColumns: [],
    });

    useEffect(() => {
        const viewsListDummyData = [
            {
                name: 'View 1',
                columns: [
                    { name: 'column1', dataType: 'varchar' },
                    { name: 'column2', dataType: 'int' }
                ]
            },
            {
                name: 'View 2',
                columns: [
                    { name: 'column3', dataType: 'varchar' },
                    { name: 'column4', dataType: 'boolean' },
                    { name: 'column5', dataType: 'float' }
                ]
            },
            {
                name: 'View 3',
                columns: [
                    { name: 'column6', dataType: 'int' },
                    { name: 'column7', dataType: 'varchar' }
                ]
            },
            {
                name: 'View 4',
                columns: [
                    { name: 'column8', dataType: 'boolean' }
                ]
            }
        ];

        setViewState(prevState => ({
            ...prevState,
            apiViewsResult: viewsListDummyData
        }));
    }, []);

    const handleChangeView = (event) => {
        const selectedView = event.target.value;
        if (selectedView) {
            const selectedViewData = currentViewState.apiViewsResult.find(view => view.name === selectedView);
            if (selectedViewData) {
                setViewState(prev => ({
                    ...prev,
                    selectedViewName: selectedView,
                    selectedViewColumns: selectedViewData.columns,
                }));
            }
        }
    };

    const handleColumnCheck = (columnName) => {
        setViewState(prevState => {
            const updatedCheckedColumns = [...prevState.userCheckedColumns];
            const columnIndex = updatedCheckedColumns.indexOf(columnName);

            if (columnIndex !== -1) {
                updatedCheckedColumns.splice(columnIndex, 1);  // Uncheck
                data.setColumnSetting(null);
                // Remove the column from finalPayload
                data.setFinalPayload(prevPayload => {
                    const updatedPayload = { ...prevPayload };
                    if (updatedPayload[prevState.selectedViewName]) {
                        updatedPayload[prevState.selectedViewName] = updatedPayload[prevState.selectedViewName].filter(
                            setting => setting.name !== columnName
                        );
                    }
                    return updatedPayload;
                });
            } else {
                updatedCheckedColumns.push(columnName);  // Check
                const selectedColumn = prevState.selectedViewColumns.find(column => column.name === columnName);
                data.setColumnSetting({
                    viewName: prevState.selectedViewName,
                    column: selectedColumn
                });
            }
            return {
                ...prevState,
                userCheckedColumns: updatedCheckedColumns,
            };
        });
    };

    const SelectViewComponent = () => (
        <select
            className="w-full p-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            value={currentViewState.selectedViewName}
            onChange={handleChangeView}
        >
            <option value="">Select a view</option>
            {currentViewState.apiViewsResult.map(view => (
                <option key={view.name} value={view.name}>
                    {view.name}
                </option>
            ))}
        </select>
    );

    const SelectColumnsComponent = () => (
        <div className={`mb-4 ${currentViewState.selectedViewName ? "" : "hidden"}`}>
            <h3 className="font-semibold text-gray-700">Select Columns</h3>
            {currentViewState.selectedViewColumns.map((column) => (
                <div
                    key={column.name}
                    className="flex items-center mb-2 cursor-pointer"
                    onClick={() => handleColumnCheck(column.name)}
                >
                    <input
                        type="checkbox"
                        className="mr-2"
                        checked={currentViewState.userCheckedColumns.includes(column.name)}
                        readOnly
                    />
                    <label htmlFor={column.name} className="text-gray-700">
                        {column.name}
                    </label>
                </div>
            ))}
        </div>
    );

    const handleSubmit = (event) => {
        event.preventDefault();
        data.setFinalPayload(prevPayload => {
            const updatedPayload = { ...prevPayload };
            if (updatedPayload[currentViewState.selectedViewName]) {
                updatedPayload[currentViewState.selectedViewName] = updatedPayload[currentViewState.selectedViewName].filter(
                    setting => currentViewState.userCheckedColumns.includes(setting.name)
                );
            }
            return updatedPayload;
        });
        data.onSubmit();
    };

    return (
        <div className="w-64 p-4 mt-1 bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Source View</h2>
            </div>
            <div className="space-y-4">
                <div className="mb-4">
                    <label className="block text-gray-700 mb-1">View</label>
                    <SelectViewComponent />
                </div>

                {currentViewState.selectedViewColumns.length > 0 && (
                    <SelectColumnsComponent />
                )}

                <button
                    onClick={handleSubmit}
                    className="w-full p-3 text-white bg-[rgb(142,119,187)] text-[Proxima Nova] hover:bg-[rgb(142,119,187,0.8)] rounded-lg text-center"
                >
                    Ok
                </button>
            </div>
        </div>
    );
}