/*eslint-disable*/
import { useCallback, useEffect, useState } from "react";
import { Cable, X, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { useStateContext } from "../../../../context/contextProvider";

const AUTH_TOKEN = import.meta.env.VITE_FEDERATION_ACCESS_TOKEN;
const FAST_BACKEND = import.meta.env.VITE_FAST_API;

console.log(FAST_BACKEND);

export function BaseNode({ id, data }) {
  const [apiViews, setApiViews] = useState([]);
  const [selectedView, setSelectedView] = useState("");
  const [apiColumns, setApiColumns] = useState([]);
  const [userCheckedColumns, setUserCheckedColumns] = useState([]);
  const { settingsList, userSelections } = useStateContext();

  // Fetch Views
  useEffect(() => {
    (async () => {
      let response;
      try {
        const VIEW_TYPE = "Base";
        response = await fetch(`${FAST_BACKEND}/get-all-views?view_type=${VIEW_TYPE}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${AUTH_TOKEN}`
          }
        });

        const data = await response.json();

        if (response.status == 200) {
          const sortedViews = data.result.sort((a,b) => {
            if(a.toUpperCase() < b.toUpperCase()) return -1;
            if(a.toUpperCase() > b.toUpperCase()) return 1;
            return 0;
          })
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
            console.error(`Fetch Columns error. : \nStatus Code: ${response.status} \nData: `, data);
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
    console.log(event.target.value);
    setUserCheckedColumns([]);
    setSelectedView(event.target.value);
  };

  const handleColumnCheck = (columnName) => {
    const updatedCheckedColumns = [...userCheckedColumns];
    const columnIndex = updatedCheckedColumns.indexOf(columnName);

    if (columnIndex !== -1) {
      updatedCheckedColumns.splice(columnIndex, 1);
    } else {
      updatedCheckedColumns.push(columnName);
    }

    setUserCheckedColumns(updatedCheckedColumns);
  };

  const handleClose = () => {
    data.deleteNode(id);
  };

  const handleEditColumn = (columnName) => {
    if (!userCheckedColumns.includes(columnName))
      setUserCheckedColumns([...userCheckedColumns, columnName]);
    apiColumns.forEach(item => {
      if (item.column_name == columnName)
        data.handleColumnSetting({
          column: item,
          viewName: selectedView,
          viewType: "Source"
        })
    });
  }

  return (
    <div className="w-64 p-4 mt-1 bg-white rounded-lg shadow-lg relative group">
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 bg-black rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4 text-white" />
      </button>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Source View</h2>
      </div>

      <div className="space-y-4">
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">View</label>
          <select
            className="w-full p-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            value={selectedView}
            onChange={handleChangeView}
          >
            <option value="">Select a view</option>
            {apiViews.map(view => <option key={view} value={view}>{view}</option>)}
          </select>
        </div>

        {apiColumns && (
          <div
            className={`mb-4 ${selectedView ? "" : "hidden"}`}
          >
            <h3 className="font-semibold text-gray-700">Select Columns</h3>
            {apiColumns.map((item) => (
              <div
                key={item.column_name}
                className="flex items-center mb-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={userCheckedColumns.includes(item.column_name)}
                  onClick={() => handleColumnCheck(item.column_name)}
                  readOnly
                />
                <label htmlFor={item.column_name} className="text-gray-700 cursor-pointer">
                  {item.column_name}
                </label>
                <Pencil name="edit" onClick={(e) => handleEditColumn(item.column_name)} className="ml-auto h-4 w-4 text-gray-500 hover:text-gray-700" />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={(e) => data.handleOk({
            userCheckedColumns,
            viewType: "Source",
            settings: settingsList,
            userSelections: userSelections
          })}
          className="w-full p-3 text-white bg-[rgb(142,119,187)] hover:bg-[rgba(142,119,187,0.8)] rounded-lg text-center font-sans"
        >
          Ok
        </button>
      </div>
    </div>
  );
}

export function ConnectionNode({ id, data }) {
  const [handleConnectionPayload, setHandleConnectionPayload] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [selectedSchema, setSelectedSchema] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedColumns, setSelectedColumns] = useState([]);

  const [apiConnections, setApiConnections] = useState([]);
  const [apiSchemas, setApiSchemas] = useState([]);
  const [apiTables, setApiTables] = useState([]);
  const [apiColumns, setApiColumns] = useState([]);

  const { settingsList, setSettingsList, userSelections, setUserSelections } = useStateContext();

  const dummyColumns = [
    "connection 1",
    "id ",
    "name",
    "address",
    "phonenumber",
  ];

  useEffect(() => {
    (async () => {
      let response;
      try {
        response = await fetch(`${FAST_BACKEND}/connection-saves`, {
          method: "GET",
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${AUTH_TOKEN}`
          }
        });
        let data = await response.json();
        if (response.status == 200) {
          const uniqueConnections = [
            ...new Map(data.map((item) => [item.connection_name, item])).values(),
          ];
          setApiConnections(uniqueConnections); //Data = array of Connection Objects
        } else {
          console.log(`Error fetching connections.\nResponse status: ${response.status}\nData: `, data);
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
            console.log(`Error fetching Schemas.\nResponse status: ${response.status}\nData: `, data);
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
            console.log(`Error fetching Tables.\nResponse status: ${response.status}\nData: `, data);
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
            console.log("\n\nCOLUMNS = ", data, "\n\n\n")
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
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column]
    );
  };

  const handleEditColumn = (columnName) => {
    if (!selectedColumns.includes(columnName))
      setSelectedColumns([...selectedColumns, columnName]);
    console.log(columnName)
    apiColumns.forEach(item => {
      if (item.column == columnName) {
        data.handleColumnSetting({
          column: item,
          connection: selectedConnection,
          schema: selectedSchema,
          table: selectedTable,
          viewType: "Connection"
        })
      }
    });
  }

  const handleSelectAllChange = (isChecked) => {
    if (isChecked) {
      setSelectedColumns(dummyColumns);
    } else {
      setSelectedColumns([]);
    }
  };

  const isAllSelected = selectedColumns.length === dummyColumns.length;

  const handleSave = () => {
    const payload = {
      id,
      type: "Connection",
      selectedConnection,
      selectedView,
      selectedSchema,
      selectedTable,
      selectedColumns,
      Columns: apiColumns,
    };
    console.log("Saved Payload:", payload); // Debugging purpose
    setHandleConnectionPayload(payload);
    data.onSubmit(payload);
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
              <select
                value={selectedConnection}
                onChange={(e) => {
                  e.preventDefault();
                  setSelectedConnection(e.target.value);
                  setSelectedColumns([]);
                }}
                className="w-full bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg group border-solid border-2"
              >
                <option value="" disabled>
                  Select a connection
                </option>
                {apiConnections.map((connection) => (
                  <option
                    key={connection.connection_name}
                    value={connection.connection_name}
                  >
                    {connection.connection_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Schema
              </label>
              <select
                value={selectedSchema}
                onChange={(e) => {
                  e.preventDefault()
                  setSelectedSchema(e.target.value);
                  setSelectedColumns([]);
                }}
                className="w-full bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg group border-solid border-2"
              >
                <option value="" disabled>
                  Select a Schema
                </option>
                {apiSchemas.map((schema) => (
                  <option key={schema} value={schema}>
                    {schema}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Table
              </label>
              <select
                value={selectedTable}
                onChange={(e) => {
                  e.preventDefault();
                  setSelectedTable(e.target.value);
                  setSelectedColumns([]);
                }}
                className="w-full bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg group border-solid border-2"
              >
                <option value="" disabled>
                  Select a table
                </option>
                {apiTables.map((table) => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))}
              </select>
            </div>
            {selectedTable && (
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Select Columns
                </label>
                <div className="p-3 space-y-2">
                  {/* <div className="flex items-center space-x-2"> */}
                    {/* <input
                      type="checkbox"
                      id="selectAll"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAllChange(e.target.checked)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <label
                      htmlFor="selectAll"
                      className="text-sm text-gray-700 font-medium"
                    >
                      Select All
                    </label> */}
                  {/* </div> */}
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
                          checked={selectedColumns.includes(item.column)}
                          onChange={() => handleColumnChange(item.column)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <label
                          htmlFor={item.column}
                          className="text-sm text-gray-700"
                        >
                          {item.column}
                        </label>
                        <Pencil name="edit" onClick={(e) => handleEditColumn(item.column)} className=" ml-auto h-4 w-4 text-gray-500 hover:text-gray-700" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => data.handleOk({
              userCheckedColumns: selectedColumns,
              viewType: "Connection",
              settings: settingsList,
              userSelections: userSelections,
            })}
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