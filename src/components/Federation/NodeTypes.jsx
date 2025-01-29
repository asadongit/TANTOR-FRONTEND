import { Icon } from '@iconify/react';
import { useEffect, useState } from 'react';
// State 0
export function SourceViewNode({ data }) {

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
                    userCheckedColumns: [] 
                }));
                
                data.setColumnSetting(null);
                data.setFinalPayload({});
            }
        } else {
            setViewState(prev => ({
                ...prev,
                selectedViewName: "",
                selectedViewColumns: [],
                userCheckedColumns: []
            }));
            data.setColumnSetting(null);
            data.setFinalPayload({});
        }
    };

    const handleColumnCheck = (columnName) => {
        const updatedCheckedColumns = [...currentViewState.userCheckedColumns];
        const columnIndex = updatedCheckedColumns.indexOf(columnName);
        console.log("Checking Column ==> ", columnName)
        console.log("updatedCheckedColumns  ==> ", updatedCheckedColumns)
        

        if (columnIndex !== -1) {
            updatedCheckedColumns.splice(columnIndex, 1);
            data.setColumnSetting(null);
            
            data.setFinalPayload(prevPayload => {
                const updatedPayload = { ...prevPayload };
                if (updatedPayload[currentViewState.selectedViewName]) {
                    updatedPayload[currentViewState.selectedViewName] = updatedPayload[currentViewState.selectedViewName]
                        .filter(setting => setting.name !== columnName);
                    
                    if (updatedPayload[currentViewState.selectedViewName].length === 0) {
                        delete updatedPayload[currentViewState.selectedViewName];
                    }
                }
                return updatedPayload;
            });
        } else {
            updatedCheckedColumns.push(columnName);
            const selectedColumn = currentViewState.selectedViewColumns.find(column => column.name === columnName);
            data.setColumnSetting({
                viewName: currentViewState.selectedViewName,
                column: selectedColumn
            });
        }

        setViewState(prevState => ({
            ...prevState,
            userCheckedColumns: updatedCheckedColumns,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        
        const currentPayload = data.finalPayload || {};
        const currentViewSettings = currentPayload[currentViewState.selectedViewName] || [];
        
        console.log("data ===> ", data);
        
        const filteredSettings = currentViewSettings.filter(
            setting => currentViewState.userCheckedColumns.includes(setting.name)
        );
        
        console.log('View Settings:', {
            viewName: currentViewState.selectedViewName,
            columns: filteredSettings
        });

        data.setFinalPayload(prevPayload => ({
            ...prevPayload,
            [currentViewState.selectedViewName]: filteredSettings
        }));

        if (data.onSubmit) {
            data.onSubmit();
        }
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
                    className="w-full p-3 text-white bg-[rgb(142,119,187)] hover:bg-[rgba(142,119,187,0.8)] rounded-lg text-center font-sans"
                >
                    Ok
                </button>
            </div>
        </div>
    );
}