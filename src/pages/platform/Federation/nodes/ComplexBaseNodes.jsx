import { useCallback, useEffect, useState } from "react";
import { Cable, X, ChevronDown, ChevronUp, Pencil, Search,SquareKanban, Database } from "lucide-react";
import { useStateContext } from "../../../../context/contextProvider";
import { defaultSetting } from "../viewsource/ColumnSettings";

const AUTH_TOKEN = import.meta.env.VITE_FEDERATION_ACCESS_TOKEN;
const FAST_BACKEND = import.meta.env.VITE_FAST_API;

const SearchableSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredOptions = options.map(option => 
    typeof option === 'object' ? option.connection_name : option
  ).filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectClick = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option) => {
    onChange({ target: { value: option } });
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative w-full">
      <div 
        className="w-full px-3 py-2 border-2 rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
        onClick={handleSelectClick}
      >
        <span>{value || placeholder}</span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="w-full p-2 pl-8 border rounded-md"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.map((option) => (
              <div
                key={option}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleOptionClick(option)}
              >
                {option}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export function ComplexSourceNode({ id, data }) {
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [apiViews, setApiViews] = useState([]);
  const [selectedView, setSelectedView] = useState("");
  const [apiColumns, setApiColumns] = useState([]);
  const { 
    settingsList, 
    setSettingsList, 
    userSelections, 
    setUserSelections,
    userCheckedColumns, 
    setUserCheckedColumns 
  } = useStateContext();

  // Fetch Views
  useEffect(() => {
    (async () => {
      let response;
      try {
        const VIEW_TYPE = "Base";
        response = await fetch(
          `${FAST_BACKEND}/get-all-views?view_type=${VIEW_TYPE}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${AUTH_TOKEN}`,
            },
          }
        );

        const data = await response.json();

        if (response.status == 200) {
          const sortedViews = data.result.sort((a, b) => {
            if (a.toUpperCase() < b.toUpperCase()) return -1;
            if (a.toUpperCase() > b.toUpperCase()) return 1;
            return 0;
          });
          setApiViews(sortedViews);
        } else {
          data.toast.error("Error occurred while trying to fetch views");
        }
      } catch (error) {
        console.error("Error occurred while trying to fetch views", error);
        data.toast.error("Error occurred while trying to fetch views");
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedView) {
      (async () => {
        let response;

        try {
          response = await fetch(`${FAST_BACKEND}/fetch_view_columns`, {
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${AUTH_TOKEN}`,
            },
            body: JSON.stringify({ view_names: [selectedView] }),
            method: "POST",
          });
          let data = await response.json();

          if (response.status == 200) {
            setApiColumns(data.result[selectedView]);
          } else {
            console.error(
              `Fetch Columns error. : \nStatus Code: ${response.status} \nData: `,
              data
            );
            data.toast.error("Error occurred while trying to fetch columns");
          }
        } catch (error) {
          console.log(error);
          data.toast.error("Error occurred while trying to fetch Columns");
        }
      })();
    }
  }, [selectedView]);

  const handleChangeView = (event) => {
    const selectedViewName = event.target.value;
    setUserCheckedColumns([]);
    setApiColumns([]);

    setSelectedView(selectedViewName);

    setUserSelections((prev) => {
      const updatedSelections = new Map();
      updatedSelections.set("viewName", selectedViewName);
      return updatedSelections;
    });
    setSettingsList([]);
  };

  const handleColumnCheck = (column) => {
    const columnName = column.column_name;
    const dataType = column.data_type;
    const updatedCheckedColumns = [...userCheckedColumns];
    const columnIndex = updatedCheckedColumns.indexOf(columnName);
    
    if (columnIndex !== -1) {
      if(isAllSelected)
        setIsAllSelected(false);
      updatedCheckedColumns.splice(columnIndex, 1);
      setSettingsList(prev => prev.filter(item => item.name !== columnName));
    } else {      
      updatedCheckedColumns.push(columnName);
      setSettingsList((prev) => [
        ...prev,
        { ...defaultSetting, name: columnName, type: dataType },
      ]);
      
      if(updatedCheckedColumns.length === apiColumns.length)
        setIsAllSelected(true);
    }
    setUserCheckedColumns(updatedCheckedColumns);
  };

  const handleClose = () => {
    data.deleteNode(id);
  };

  const handleEditColumn = (columnName) => {
    apiColumns.forEach((item) => {
      if (item.column_name == columnName)
        data.handleColumnSetting({
          column: item,
          viewName: selectedView,
          viewType: "Source",
        });
    });
  };

  const handleSelectAllColumns = () => {
    if (isAllSelected) {
      setUserCheckedColumns([]);
      setSettingsList([]);
    } else {
      const updatedCheckedColumns = [];
      const updatedSettingsList = [];

      apiColumns.forEach((item) => {
        updatedCheckedColumns.push(item.column_name);
        updatedSettingsList.push({
          ...defaultSetting,
          name: item.column_name,
          type: item.data_type,
        });
      });

      setUserCheckedColumns(updatedCheckedColumns);
      setSettingsList(updatedSettingsList);
    }

    setIsAllSelected((prev) => !prev);
  };

  return (
    <div className="w-64 p-4 mt-1 bg-white rounded-lg shadow-lg relative group">
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 bg-black rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4 text-white" />
      </button>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <SquareKanban className="w-5 h-5 text-[#8E77BB]" />
        <h2 className="text-lg font-medium">Source View</h2>
        <button onClick={(e) => {
            e.preventDefault();
            data.setShowQueryEditor(prev => !prev);
            console.log("clicked");
          }}> <Database className="w-5 h-5 text-[#8E77BB]" /></button>
      </div>
      </div>

      <div className="space-y-4">
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">View</label>
          <SearchableSelect
            options={apiViews}
            value={selectedView}
            onChange={handleChangeView}
            placeholder="Select View"
          />
        </div>

        {apiColumns && (
          <div className={`mb-4 ${selectedView ? "" : "hidden"}`}>
            <h3 className="font-semibold text-gray-700 mb-2">Select Columns</h3>

            <div className="flex items-center mb-2 cursor-pointer">
              <input
                type="checkbox"
                className="mr-2"
                checked={isAllSelected}
                onChange={handleSelectAllColumns}
              />
              <label
                htmlFor="select-all"
                className="text-gray-700 cursor-pointer"
              >
                Select All
              </label>
            </div>

            {apiColumns.map((item) => (
              <div
                key={item.column_name}
                className="flex items-center mb-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={userCheckedColumns.includes(item.column_name)}
                  onChange={() => handleColumnCheck(item)}
                />
                <label
                  htmlFor={item.column_name}
                  className="text-gray-700 cursor-pointer"
                >
                  {item.column_name}
                </label>
                <Pencil
                  name="edit"
                  onClick={() => handleEditColumn(item.column_name)}
                  className="ml-auto h-4 w-4 text-gray-500 hover:text-gray-700"
                />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() =>
            data.handleOk({
              userCheckedColumns,
              viewType: "Source",
              settings: settingsList,
              userSelections: userSelections,
            })
          }
          className="w-full p-3 text-white bg-[rgb(142,119,187)] hover:bg-[rgba(142,119,187,0.8)] rounded-lg text-center font-sans"
        >
          Ok
        </button>
      </div>
    </div>
  );
}

export function ComplexConnectionNode({ id, data }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [selectedConnection, setSelectedConnection] = useState("");
    const [selectedSchema, setSelectedSchema] = useState("");
    const [selectedTable, setSelectedTable] = useState("");
    const [apiConnections, setApiConnections] = useState([]);
    const [apiSchemas, setApiSchemas] = useState([]);
    const [apiTables, setApiTables] = useState([]);
    const [apiColumns, setApiColumns] = useState([]);
    const [isAllSelected, setIsAllSelected] = useState(false);
  const { settingsList, setSettingsList, userSelections, setUserSelections ,userCheckedColumns, setUserCheckedColumns} =
    useStateContext();

  useEffect(() => {
    (async () => {
      let response;
      try {
        response = await fetch(`${FAST_BACKEND}/connection-saves`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${AUTH_TOKEN}`,
          },
        });
        let data = await response.json();
        if (response.status == 200) {
          const uniqueConnections = [
            ...new Map(
              data.map((item) => [item.connection_name, item])
            ).values(),
          ];
          setApiConnections(uniqueConnections); //Data = array of Connection Objects
        } else {
          console.log(
            `Error fetching connections.\nResponse status: ${response.status}\nData: `,
            data
          );
          data.toast.error("Error fetching connections.");
        }
      } catch (error) {
        console.log("Error fetching connections. ", error);
        data.toast.error("Error fetching connections.");
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      (async () => {
        try {
          let response = await fetch(
            `${FAST_BACKEND}/${selectedConnection}/schemas`,
            {
              method: "GET",
              headers: {
                authorization: `Bearer ${AUTH_TOKEN}`,
                "Content-Type": "application/json",
              },
            }
          );

          let data = await response.json();
          if (response.status == 200) {
            setApiSchemas(data);
          } else {
            console.log(
              `Error fetching Schemas.\nResponse status: ${response.status}\nData: `,
              data
            );
            data.toast.error("Error fetching Schemas.");
          }
        } catch (error) {
          console.log("Error fetching schemas. ", error);
          data.toast.error("Error fetching Schemas.");
        }
      })();
    }
  }, [selectedConnection]);

  useEffect(() => {
    if (selectedSchema) {
      (async () => {
        let response;
        try {
          response = await fetch(
            `${FAST_BACKEND}/${selectedConnection}/schemas/${selectedSchema}/tables`,
            {
              method: "GET",
              headers: {
                authorization: `Bearer ${AUTH_TOKEN}`,
                "Content-Type": "application/json",
              },
            }
          );

          let data = await response.json();
          if (response.status == 200) {
            console.log(data);
            setApiTables(data);
          } else {
            console.log(
              `Error fetching Tables.\nResponse status: ${response.status}\nData: `,
              data
            );
            data.toast.error("Error fetching Tables.");
          }
        } catch (error) {
          console.log("Error fetching tables. ", error);
          data.toast.error("Error fetching Tables.");
        }
      })();
    }
  }, [selectedSchema]);

  useEffect(() => {
    if (selectedTable) {
      (async () => {
        let response;
        try {
          response = await fetch(
            `${FAST_BACKEND}/${selectedConnection}/schemas/${selectedSchema}/tables/${selectedTable}/columns`,
            {
              method: "GET",
              headers: {
                authorization: `Bearer ${AUTH_TOKEN}`,
                "Content-Type": "application/json",
              },
            }
          );
          let data = await response.json();

          if (response.status == 200) {
            console.log("\n\nCOLUMNS = ", data, "\n\n\n");
            setApiColumns(data);
          } else {
            console.log("Error while trying to fetch columns. ", data);
            data.toast.error("Error while trying to fetch columns.");
          }
        } catch (error) {
          console.error("Error while trying to fetch columns. ", error);
          data.toast.error("Error while trying to fetch columns.");
        }
      })();
    }
  }, [selectedTable]);

  const handleColumnChange = (column) => {

    const columnName = column.column;
    const columnType = column.datatype;

    const updatedCheckedColumns = [...userCheckedColumns];
    const columnIndex = updatedCheckedColumns.indexOf(columnName);

    console.log("COLUMN INDEX = ", columnIndex);
    if (columnIndex !== -1) {
      if (isAllSelected) setIsAllSelected(false);
      updatedCheckedColumns.splice(columnIndex, 1);
      setSettingsList(prev => prev.filter(item => item.name !== columnName));
    } else {
      updatedCheckedColumns.push(columnName);
      setSettingsList((prev) => [
        ...prev,
        { ...defaultSetting, name: columnName, type: columnType },
      ]);
    }
    setUserCheckedColumns(updatedCheckedColumns);
    console.log("Selected Columns: ", userCheckedColumns);

  };

  const handleEditColumn = (columnName) => {
    // if (!selectedColumns.includes(columnName))
    //   setSelectedColumns([...selectedColumns, columnName]);
    console.log(columnName);
    apiColumns.forEach((item) => {
      if (item.column == columnName) {
        data.handleColumnSetting({
          column: item,
          connection: selectedConnection,
          schema: selectedSchema,
          table: selectedTable,
          viewType: "Connection",
        });
      }
    });
  };

  const handleSelectAllChange = () => {
    if (isAllSelected) {
      setUserCheckedColumns([]);
      setSettingsList([]);
    } else {
      const updatedCheckedColumns = [];
      const updatedColumnSettingsList = [];

      apiColumns.forEach((column) => {
        updatedCheckedColumns.push(column.column);
        updatedColumnSettingsList.push({
          ...defaultSetting,
          name: column.column,
          type: column.datatype,
        });
      });

      setUserCheckedColumns(updatedCheckedColumns);
      setSettingsList(updatedColumnSettingsList);
    }
    setIsAllSelected((prev) => !prev);
  };


  const resetSelections = () => {
    setApiSchemas([]);
    setApiTables([]);
    setApiColumns([]);
    setSelectedSchema("");
    setSelectedTable("");
    setUserCheckedColumns([]);
    setIsAllSelected(false);
  };

  const handleConnectionChange = (event) => {
    setSelectedConnection(event.target.value);
    resetSelections();
    setUserSelections((prev) => {
      const updatedSelections = new Map();
      updatedSelections.clear();
      updatedSelections.set("connection", event.target.value);
      return updatedSelections;
    });
  };

  const handleSchemaChange = (event) => {
    setSelectedSchema(event.target.value);
    setApiTables([]);
    setApiColumns([]);
    setSelectedTable("");
    setUserCheckedColumns([]);
    setIsAllSelected(false);
    setUserSelections((prev) => {
      const updatedSelections = new Map(prev);
      updatedSelections.set("schema", event.target.value);
      return updatedSelections;
    });
  };

  const handleTableChange = (event) => {
    setSelectedTable(event.target.value);
    setApiColumns([]);
    setUserCheckedColumns([]);
    setIsAllSelected(false);
    setUserSelections((prev) => {
      const updatedSelections = new Map(prev);
      updatedSelections.set("table", event.target.value);
      return updatedSelections;
    });
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-lg min-w-[300px] relative group">
      <button
        onClick={() => data.deleteNode(id)}
        className="absolute -top-2 -right-2 bg-black rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4 text-white" />
      </button>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Cable className="w-5 h-5 text-[#8E77BB]" />
          <h3 className="text-black font-medium">Connection</h3>
          <button onClick={(e) => {
            e.preventDefault();
            data.setShowQueryEditor(prev => !prev);
            console.log("clicked");
          }}> <Database className="w-5 h-5 text-[#8E77BB]" /></button>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md hover:bg-gray-200"
        >
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-black" />
          ) : (
            <ChevronUp className="w-5 h-5 text-black" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Connection
              </label>
              <SearchableSelect
                options={apiConnections}
                value={selectedConnection}
                onChange={handleConnectionChange}
                placeholder="Select a connection"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Schema
              </label>
              <SearchableSelect
                options={apiSchemas}
                value={selectedSchema}
                onChange={handleSchemaChange}
                placeholder="Select a schema"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Table
              </label>
              <SearchableSelect
                options={apiTables}
                value={selectedTable}
                onChange={handleTableChange}
                placeholder="Select a table"
              />
            </div>

            {selectedTable && (
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Select Columns
                </label>
                <div className="p-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="selectAll"
                      checked={isAllSelected}
                      onChange={handleSelectAllChange}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <label
                      htmlFor="selectAll"
                      className="text-sm text-gray-700 font-medium"
                    >
                      Select All
                    </label>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-2 custom-scrollbar">
                    {apiColumns.map((item) => (
                      <div
                        key={item.column}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          id={item.column}
                          value={item.column}
                          checked={userCheckedColumns.includes(item.column)}
                          onChange={() => handleColumnChange(item)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <label
                          htmlFor={item.column}
                          className="text-sm text-gray-700"
                        >
                          {item.column}
                        </label>
                        <Pencil
                          name="edit"
                          onClick={() => handleEditColumn(item.column)}
                          className="ml-auto h-4 w-4 text-gray-500 hover:text-gray-700 hover:cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={() =>
              data.handleOk({
                userCheckedColumns: userCheckedColumns,
                viewType: "Connection",
                settings: settingsList,
                userSelections: userSelections,
              })
            }
            className="w-full text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-1.5 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7] mt-3"
          >
            OK
          </button>
        </>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #a0aec0;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}