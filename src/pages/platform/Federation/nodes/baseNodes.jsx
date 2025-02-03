/*eslint-disable*/
import { useCallback, useEffect, useState } from "react";
import { Cable, X, ChevronDown, ChevronUp, Pencil } from "lucide-react";

const AUTH_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJfT0JkZW9SZGQxaVVwd3RJb2t6Y2JYdnZ1QXdMeENzMk1KTTYwa0s5QUw0In0.eyJleHAiOjE3MzgxNDQ3MzcsImlhdCI6MTczODE0NDQzNywianRpIjoiODk1YzU4NWItYzFjZi00NjEzLWE5ODctNTk4YmMxYTMzZWY3IiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay50YW50b3IuaW8vcmVhbG1zL0dhdGVrZWVwZXIiLCJhdWQiOlsicmVhbG0tbWFuYWdlbWVudCIsImFjY291bnQiXSwic3ViIjoiOTU0NDNkYzQtZDY1My00Njg3LWFjOWEtMTYxMDNmYzVlN2ViIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiZGFyY2giLCJzZXNzaW9uX3N0YXRlIjoiNjc5YWViMWYtMWZmNy00ZTQyLTlkMjMtMjI2NTc0OTc4Y2RmIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsImRlZmF1bHQtcm9sZXMtZ2F0ZWtlZXBlciIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsInZpZXctcmVhbG0iLCJtYW5hZ2UtaWRlbnRpdHktcHJvdmlkZXJzIiwiaW1wZXJzb25hdGlvbiIsInJlYWxtLWFkbWluIiwiY3JlYXRlLWNsaWVudCIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXJlYWxtcyIsInZpZXctYXV0aG9yaXphdGlvbiIsInF1ZXJ5LWNsaWVudHMiLCJxdWVyeS11c2VycyIsIm1hbmFnZS1ldmVudHMiLCJtYW5hZ2UtcmVhbG0iLCJ2aWV3LWV2ZW50cyIsInZpZXctdXNlcnMiLCJ2aWV3LWNsaWVudHMiLCJtYW5hZ2UtYXV0aG9yaXphdGlvbiIsIm1hbmFnZS1jbGllbnRzIiwicXVlcnktZ3JvdXBzIl19LCJkYXJjaCI6eyJyb2xlcyI6WyJnbG9iYWwtYWRtaW4iXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJzaWQiOiI2NzlhZWIxZi0xZmY3LTRlNDItOWQyMy0yMjY1NzQ5NzhjZGYiLCJuYW1lIjoic2FiaHlhdGEgYmhhcmdhdmEiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzYWJoeWF0YSIsImdpdmVuX25hbWUiOiJzYWJoeWF0YSIsImZhbWlseV9uYW1lIjoiYmhhcmdhdmEifQ.KOdzmc4v-u-qNatsnOLpi2cUvDoZSYPoRkf4RqjSqryzEepJxLmvwW_vzW9pdPQHHN46MLw1_vC8CmFbRgS_t8BVvM0k039gVuR9Z6rDPDQ8p0ENk5T6_XmkQUDQwlF2Nln5ASTQnaucMeuvrVQO0pdTtypRXM5S_Hk-GBZkYZZdcZDYvl9nagXCfW6XqyMOT9ck2eBTePHpQr2thlg_1yv1lMvgaXIfX4qJCHwgUTdiKvxTrPErmsicTLKH-wA06x8fqtK0sRD9vC1z6G-cY0zJ4aQgtbSbLUzo7L2q-nE6S5nhrZE3WI0Zs1M_ykrVyy2a-3ilL8GkdLx22KHZSQ";
const FAST_BACKEND = import.meta.env.VITE_FAST_API;

console.log(FAST_BACKEND);
export function BaseNode({ id, data }) {
  const [currentViewState, setViewState] = useState({
    apiViewsResult: [],
    selectedViewName: "",
    selectedViewColumns: [],
  });

  const [apiViews, setApiViews] = useState([]);
  const [selectedView, setSelectedView] = useState("");
  const [apiColumns,setApiColumns] = useState([]);
  const [userCheckedColumns, setUserCheckedColumns] = useState([]);

  // Fetch Views
  useEffect(() => {
    (async () => {
      let response
      try{
        response = await fetch(`${FAST_BACKEND}/get-all-views`,{
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${AUTH_TOKEN}`
        }
      });
      
      const data = await response.json();
      
      if(response.status == 200){
        setApiViews(data.result);
      }else{
        alert("Error occured while trying to fetch views");
      }
    }catch(error){
      console.error("Error occured while trying to fetch views", error);
      alert("Error occured while trying to fetch views");
    }
    })();
  }, []);

  useEffect(() => {
    if(selectedView){
      (async () => {
        let response;

        try{
          response = await fetch(`${FAST_BACKEND}/fetch_view_columns`,{
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${AUTH_TOKEN}`,
          },
          body: JSON.stringify({view_names:[selectedView]}),
          method: "POST",
        });
        let data = await response.json();

        if(response.status == 200){
          setApiColumns(data.result[selectedView]);
        }else {
          console.error(`Fetch Columms error. : \nStatus Code: ${response.status} \nData: `, data);
          alert("Error occured while trying to fetch columns");
        }
        }catch(error){
          console.log(error);
          alert("Error occured while trying to fetch Columns");
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
      // data.setColumnSetting(null);

      // data.setFinalPayload((prevPayload) => {
      //   const updatedPayload = { ...prevPayload };
      //   if (updatedPayload[currentViewState.selectedViewName]) {
      //     updatedPayload[currentViewState.selectedViewName] = updatedPayload[
      //       currentViewState.selectedViewName
      //     ].filter((setting) => setting.name !== columnName);

      //     if (updatedPayload[currentViewState.selectedViewName].length === 0) {
      //       delete updatedPayload[currentViewState.selectedViewName];
      //     }
      //   }
      //   return updatedPayload;
      // });
    } else {
      updatedCheckedColumns.push(columnName);
      
      // apiColumns.forEach(item => {
      //   if(item.column_name == columnName)
      //     data.handleColumnSetting({
      //     column: item,
      //     viewName: selectedView,
      //     type: "Source"
      //   })
      // });

      // data.setColumnSetting({
      //   viewName: currentViewState.selectedViewName,
      //   column: selectedColumn,
      // });
    }

    setUserCheckedColumns(updatedCheckedColumns);
  };

  const handleOk = (event) => {
    event.preventDefault();

    // const currentPayload = data.finalPayload || {};
    // const currentViewSettings =
    //   currentPayload[currentViewState.selectedViewName] || [];

    // const filteredSettings = currentViewSettings.filter((setting) =>
    //   currentViewState.userCheckedColumns.includes(setting.name)
    // );

    // data.setFinalPayload((prevPayload) => ({
    //   ...prevPayload,
    //   [currentViewState.selectedViewName]: filteredSettings,
    // }));

    // if (data.onSubmit) {
    //   data.onSubmit({ type: "Source" });
    // }

    // data.handleOk({
    //   userCheckedColumns,
    //   type: "Source",
    // });

  };

  const handleClose = () => {
    data.deleteNode(id);
  };

  const handleEditColumn = (columnName) => {
    if(!userCheckedColumns.includes(columnName))
      setUserCheckedColumns([...userCheckedColumns, columnName]);
    apiColumns.forEach(item => {
      if(item.column_name == columnName)
        data.handleColumnSetting({
        column: item,
        viewName: selectedView,
        type: "Source"
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
              //  onClick={() => handleColumnCheck(item.column_name)}
             >
               <input
                 type="checkbox"
                 className="mr-2"
                 checked={userCheckedColumns.includes(item.column_name)}
                 onClick={() => handleColumnCheck(item.column_name)} //delete
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
            type: "Source",
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
      try{
        response = await fetch(`${FAST_BACKEND}/connection-saves`,{
          method: "GET",
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${AUTH_TOKEN}`
          }
        });
        let data = await response.json();
        if(response.status == 200){
          const uniqueConnections = [
            ...new Map(data.map((item) => [item.connection_name, item])).values(),
          ];
          setApiConnections(uniqueConnections); //Data = array of Connection Objects
        }else{
          console.log(`Error fetching connections.\nResponse status: ${response.status}\nData: `,data);
          alert("Error fetching connections.");
        }
      }catch(error){
        console.log("Error fetching connections. ", error);
        alert("Error fetching connections.");
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      (async() => {
        try{
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
        if(response.status == 200){
          setApiSchemas(data);
        }else {
          console.log(`Error fetching Schemas.\nResponse status: ${response.status}\nData: `,data);
          alert("Error fetching Schemas.");
        }
      }catch(error){
        console.log("Error fetching schemas. ", error);
        alert("Error fetching Schemas.");
      }
      })();
    }
  }, [selectedConnection]);

  useEffect(() => {
    if (selectedSchema) {
      (async () => {
        let response;
        try{
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
          if(response.status == 200){
            console.log(data);
            setApiTables(data);
          }else {
            console.log(`Error fetching Tables.\nResponse status: ${response.status}\nData: `,data);
            alert("Error fetching Tables.");
          }
        }catch(error){
          console.log("Error fetching tables. ", error);
          alert("Error fetching Tables.");
        }
      })();
    }
  }, [selectedSchema]);

  useEffect(() => {
    if (selectedTable) {
      (async() => {
        let response;
        try{
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
          
          if(response.status == 200){
            console.log("\n\nCOLUMNS = ", data, "\n\n\n")
            setApiColumns(data);
          }else {
            console.log("Error while trying to fetch columns. ", data);
            alert("Error while trying to fetch columns.");
          }
        }catch(error){
          console.error("Error while trying to fetch columns. ", error);
          alert("Error while trying to fetch columns.");
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
    if(!selectedColumns.includes(columnName))
      setSelectedColumns([...selectedColumns, columnName]);

    apiColumns.forEach(item => {
      if(item.column == columnName){
        data.handleColumnSetting({
        column: item,
        connection: selectedConnection,
        schema: selectedSchema,
        table: selectedTable,
        type: "Connection"
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
                  <div className="flex items-center space-x-2">
                    <input
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
              type: "Connection",
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
