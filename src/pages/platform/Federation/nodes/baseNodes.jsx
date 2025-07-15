import { useCallback, useEffect, useState } from "react";
import {
  Cable,
  X,
  ChevronDown,
  ChevronUp,
  Pencil,
  Search,
  SquareKanban,
  Database,
  FileCode,
} from "lucide-react";
import { useStateContext } from "../context/contextViewProvider";
import { defaultSetting } from "../BaseView/ColumnSettings";
import { useAuth } from "../../../../context/AuthContext";
import { secureQuery } from '../../../datagovernance/DataCatalogue/Components/function.js';

const SearchableSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = options
    .map((option) =>
      typeof option === "object" ? option.connection_name : option
    )
    .filter((option) =>
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
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
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

export function BaseNode({ id, data }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [apiViews, setApiViews] = useState([]);
  const [selectedView, setSelectedView] = useState("");
  const [apiColumns, setApiColumns] = useState([]);
  const { token, project, decodedToken, setSelectedProject, hostnameV1, hostnameV2 } = useAuth();
  const {
    settingsList,
    setSettingsList,
    userSelections,
    setUserSelections,
    userCheckedColumns,
    setUserCheckedColumns,
  } = useStateContext();
  const getFilterModalColumns = () => {
    if (apiColumns.length > 0) {
      return apiColumns.map((column) => ({
        name: column.column_name,
        type: column.data_type,
      }));
    }
    return [];
  };


  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams({
          view_type: "Base",
          project: (project === "default" || project === "none") ? "default" : project,
          created_by: decodedToken?.preferred_username,
        });

        const response = await fetch(`${hostnameV2}/get-all-views_v2?${params}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (response.ok) {
          setApiViews(data.result.sort((a, b) => a.localeCompare(b)));
        } else {
          toast.error("Error fetching views");
        }
      } catch (error) {
        console.error("Fetch error", error);
        toast.error("Error fetching views");
      }
    })();
  }, []);



  useEffect(() => {
    if (selectedView) {
      (async () => {
        let response;
        try {
          response = await fetch(`${hostnameV1}/fetch_view_columns`, {
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${token}`,
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
    const selectedViewName = event.target.value.toLowerCase();
    setUserCheckedColumns([]);
    setApiColumns([]);
    setSelectedView(selectedViewName);
    setIsAllSelected(false);
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

    const isColumnChecked = userCheckedColumns.includes(columnName);

    const updatedCheckedColumns = isColumnChecked
      ? userCheckedColumns.filter((name) => name !== columnName) 
      : [...userCheckedColumns, columnName]; 

    setSettingsList((prev) => {
      const updatedSettingsList = prev.map((item) => {
        if (item.name === columnName) {
          return { ...item, output: isColumnChecked ? "No" : "Yes" };
        }
        return item;
      });

      if (!isColumnChecked && !prev.some((item) => item.name === columnName)) {
        updatedSettingsList.push({
          ...defaultSetting,
          name: columnName,
          type: dataType,
        });
      }

      return updatedSettingsList;
    });

    setUserCheckedColumns(updatedCheckedColumns);
    setIsAllSelected(updatedCheckedColumns.length === apiColumns.length);
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
      setSettingsList((prev) =>
        prev.map((item) => ({ ...item, output: "No" }))
      );
    } else {
      const updatedCheckedColumns = [];
      const newSettingList = [];

      apiColumns.forEach((item) => {
        updatedCheckedColumns.push(item.column_name);
        newSettingList.push({
          ...defaultSetting,
          name: item.column_name,
          type: item.data_type,
        });
      });

      const updatedSettingsList = [...settingsList];
      newSettingList.forEach((newSetting) => {
        const existingIndex = updatedSettingsList.findIndex(
          (setting) => setting.name === newSetting.name
        );
        if (existingIndex !== -1) {
          updatedSettingsList[existingIndex] = {
            ...updatedSettingsList[existingIndex],
            output: "Yes",
          };
        } else {
          updatedSettingsList.push(newSetting);
        }
      });
      setUserCheckedColumns(updatedCheckedColumns);
      setSettingsList(updatedSettingsList);
    }

    setIsAllSelected((prev) => !prev);
  };

  return (
    <div className="w-80 p-4 mt-1 bg-white rounded-lg shadow-lg relative group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <SquareKanban className="w-5 h-5 text-[#8E77BB]" />
          <h2 className="text-lg font-medium">Source View</h2>
        </div>
        <div className="flex items-center space-x-2">
          {data.queryType === "Complex" && (
            <button
              onClick={(e) => {
                e.preventDefault();
                data.setShowQueryEditor((prev) => !prev);
              }}
            >
              <FileCode className="w-5 h-5 text-[#8E77BB]" />
            </button>
          )}
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
          <button
            onClick={handleClose}
            className="p-1 rounded-md hover:bg-gray-200"
          >
            <X className="h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {!isCollapsed && (
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
              <h3 className="font-semibold text-gray-700 mb-2">
                Select Columns
              </h3>

              <div className="p-3 space-y-2">
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

                <div className="max-h-32 overflow-y-auto pr-1">
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
              </div>
            </div>
          )}

          <button
            onClick={() =>
              data.handleOk({
                userCheckedColumns,
                viewType: "Source",
                settings: settingsList,
                userSelections: userSelections,
                apiColumns: getFilterModalColumns(),
              })
            }
            className="w-full p-3 text-white bg-[rgb(142,119,187)] hover:bg-[rgba(142,119,187,0.8)] rounded-lg text-center font-sans"
          >
            Ok
          </button>
        </div>
      )}
    </div>
  );
}

export function ConnectionNode({ id, data }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [selectedSchema, setSelectedSchema] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [apiConnections, setApiConnections] = useState([]);
  const [apiSchemas, setApiSchemas] = useState([]);
  const [apiTables, setApiTables] = useState([]);
  const [apiColumns, setApiColumns] = useState([]);
  const [allowedColumns, setAllowedColumns] = useState([]); 
  const [isAllSelected, setIsAllSelected] = useState(false);
  const {
    settingsList,
    setSettingsList,
    userSelections,
    setUserSelections,
    userCheckedColumns,
    setUserCheckedColumns,
  } = useStateContext();

  const { token, project, decodedToken, setSelectedProject, hostnameV1, hostnameV2 } = useAuth();

  const getFilterModalColumns = () => {
    if (apiColumns.length > 0 && allowedColumns.length > 0) {
      const filtered = apiColumns.filter((column) =>
        allowedColumns.some((allowedCol) => allowedCol.column_name === column.column)
      );
      return filtered.map((column) => ({
        name: column.column,
        type: column.datatype,
      }));
    }
    return [];
  };

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const secureQueryResponse = await secureQuery({ user_query: "" }, token);
        const policyIds = secureQueryResponse.matched_policy_ids || [];

        if (policyIds.length === 0) {
          setApiConnections([]);
          return;
        }

        const response = await fetch(`${hostnameV1}/connections/list`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ matched_policy_ids: policyIds }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch connections");
        }

        const connectionsData = await response.json();
        const names = connectionsData.map((item) => item.connection_name);
        setApiConnections(names);
      } catch (error) {
        console.error("Error fetching connections:", error);
        toast.error("Failed to load connections");
        setApiConnections([]);
      }
    };
    fetchConnections();
  }, [token, hostnameV1]);

  useEffect(() => {
    if (selectedConnection) {
      const fetchSchemas = async () => {
        try {
          const secureQueryResponse = await secureQuery({ user_query: "" }, token);
          const policyIds = secureQueryResponse.matched_policy_ids || [];

          if (policyIds.length === 0) {
            setApiSchemas([]);
            toast.error("No policies matched for schemas.");
            return;
          }

          const response = await fetch(`${hostnameV1}/schemas/list`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              matched_policy_ids: policyIds,
              connection_name: selectedConnection,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to fetch schemas");
          }

          const data = await response.json();
          const connectionData = data.find((item) => item[selectedConnection]);
          if (connectionData) {
            setApiSchemas(connectionData[selectedConnection]);
          } else {
            setApiSchemas([]);
          }
        } catch (error) {
          console.error("Error fetching schema data:", error);
          toast.error("Failed to load schemas");
          setApiSchemas([]);
        }
      };
      fetchSchemas();
    }
  }, [selectedConnection, token, hostnameV1]);

  useEffect(() => {
    if (selectedSchema) {
      const fetchTables = async () => {
        try {
          const secureQueryResponse = await secureQuery({ user_query: "" }, token);
          const policyIds = secureQueryResponse.matched_policy_ids || [];

          if (policyIds.length === 0) {
            setApiTables([]);
            toast.error("No policies matched for tables.");
            return;
          }

          const response = await fetch(`${hostnameV1}/tables/list`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              matched_policy_ids: policyIds,
              connection_name: selectedConnection,
              schema_name: [selectedSchema], 
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to fetch tables");
          }

          const data = await response.json();
          const schemaData = data.schemas?.find(
            (item) => item.connection_name === selectedConnection && item.schema === selectedSchema
          );
          if (schemaData && schemaData.tables) {
            setApiTables(schemaData.tables);
          } else {
            setApiTables([]);
          }
        } catch (error) {
          console.error("Error fetching table data:", error);
          toast.error("Failed to load tables");
          setApiTables([]);
        }
      };
      fetchTables();
    }
  }, [selectedSchema, selectedConnection, token, hostnameV1]);

  useEffect(() => {
    if (selectedTable) {
      const fetchColumns = async () => {
        try {
          const detailedColumnsResponse = await fetch(
            `${hostnameV1}/${selectedConnection}/schemas/${selectedSchema}/tables/${selectedTable}/columns`,
            {
              method: "GET",
              headers: {
                authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!detailedColumnsResponse.ok) {
            throw new Error("Failed to fetch detailed columns");
          }
          const detailedColumnsData = await detailedColumnsResponse.json();
          setApiColumns(detailedColumnsData);

          const secureQueryResponse = await secureQuery({ user_query: "" }, token);
          const policyIds = secureQueryResponse.matched_policy_ids || [];

          if (policyIds.length === 0) {
            setAllowedColumns([]);
            toast.error("No policies matched for columns.");
            return;
          }

          const allowedColumnsResponse = await fetch(`${hostnameV1}/columns/list`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              matched_policy_ids: policyIds,
              connection_name: selectedConnection,
              schema_name: [selectedSchema], 
              table_name: [selectedTable],
            }),
          });

          if (!allowedColumnsResponse.ok) {
            throw new Error("Failed to fetch allowed columns");
          }
          const allowedColumnsData = await allowedColumnsResponse.json();
          if (allowedColumnsData && allowedColumnsData.columns) {
            const columns = allowedColumnsData.columns
              .find(
                (item) =>
                  item.connection_name === selectedConnection &&
                  item.schema === selectedSchema &&
                  item.table_name === selectedTable
              )
              ?.columns.map((col) => ({
                column_name: col.column_name,
                datatype: col.metadata.DATA_TYPE,
              })) || [];
            setAllowedColumns(columns);
          } else {
            setAllowedColumns([]);
          }
        } catch (error) {
          console.error("Error fetching columns:", error);
          toast.error("Failed to load columns");
          setApiColumns([]);
          setAllowedColumns([]);
        }
      };
      fetchColumns();
    }
  }, [selectedTable, selectedConnection, selectedSchema, token, hostnameV1]);


  const handleColumnChange = (column) => {
    const columnName = column.column;
    const dataType = column.datatype;

    const isColumnChecked = userCheckedColumns.includes(columnName);

    const updatedCheckedColumns = isColumnChecked
      ? userCheckedColumns.filter((name) => name !== columnName)
      : [...userCheckedColumns, columnName];

    setSettingsList((prev) => {
      const updatedSettingsList = prev.map((item) => {
        if (item.name === columnName) {
          return { ...item, output: isColumnChecked ? "No" : "Yes" };
        }
        return item;
      });

      if (!isColumnChecked && !prev.some((item) => item.name === columnName)) {
        updatedSettingsList.push({
          ...defaultSetting,
          name: columnName,
          type: dataType,
        });
      }
      return updatedSettingsList;
    });
    setUserCheckedColumns(updatedCheckedColumns);
    const currentApiColumnsConsidered = apiColumns.filter((col) =>
      allowedColumns.some((allowedCol) => allowedCol.column_name.toLowerCase() === col.column.toLowerCase())
    );
    setIsAllSelected(updatedCheckedColumns.length === currentApiColumnsConsidered.length);
  };

  const handleEditColumn = (columnName) => {
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
    const currentApiColumnsConsidered = apiColumns.filter((col) =>
      allowedColumns.some((allowedCol) => allowedCol.column_name.toLowerCase() === col.column.toLowerCase())
    );

    if (isAllSelected) {
      setUserCheckedColumns([]);
      setSettingsList((prev) =>
        prev.map((item) => ({
          ...item,
          output: "No",
        }))
      );
    } else {
      const updatedCheckedColumns = [];
      const newSettingList = [];

      currentApiColumnsConsidered.forEach((item) => {
        updatedCheckedColumns.push(item.column);
        newSettingList.push({
          ...defaultSetting,
          name: item.column,
          type: item.datatype,
        });
      });

      const updatedSettingsList = [...settingsList];
      newSettingList.forEach((newSetting) => {
        const existingIndex = updatedSettingsList.findIndex(
          (setting) => setting.name === newSetting.name
        );
        if (existingIndex !== -1) {
          updatedSettingsList[existingIndex] = {
            ...updatedSettingsList[existingIndex],
            output: "Yes",
          };
        } else {
          updatedSettingsList.push(newSetting);
        }
      });
      setUserCheckedColumns(updatedCheckedColumns);
      setSettingsList(updatedSettingsList);
    }
    setIsAllSelected((prev) => !prev);
  };

  const resetSelections = () => {
    setApiSchemas([]);
    setApiTables([]);
    setApiColumns([]);
    setAllowedColumns([]); 
    setSelectedSchema("");
    setSelectedTable("");
    setUserCheckedColumns([]);
    setIsAllSelected(false);
    setSettingsList([]);
  };

  const handleConnectionChange = (event) => {
    setSelectedConnection(event.target.value);
    resetSelections();
    setUserSelections((prev) => {
      const updatedSelections = new Map(prev); 
      updatedSelections.set("connection", event.target.value);
      updatedSelections.delete("schema"); 
      updatedSelections.delete("table");
      return updatedSelections;
    });
  };

  const handleSchemaChange = (event) => {
    setSelectedSchema(event.target.value);
    setApiTables([]);
    setApiColumns([]);
    setAllowedColumns([]); 
    setSelectedTable("");
    setUserCheckedColumns([]);
    setSettingsList([]);
    setIsAllSelected(false);
    setUserSelections((prev) => {
      const updatedSelections = new Map(prev);
      updatedSelections.set("schema", event.target.value);
      updatedSelections.delete("table"); 
      return updatedSelections;
    });
  };

  const handleTableChange = (event) => {
    setSelectedTable(event.target.value);
    setApiColumns([]);
    setAllowedColumns([]); 
    setUserCheckedColumns([]);
    setIsAllSelected(false);
    setSettingsList([]);
    setUserSelections((prev) => {
      const updatedSelections = new Map(prev);
      updatedSelections.set("table", event.target.value);
      return updatedSelections;
    });
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-lg min-w-[300px] relative group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Cable className="w-5 h-5 text-[#8E77BB]" />
          <h2 className="text-black font-medium">Connection</h2>
        </div>
        <div className="flex items-center space-x-2">
          {data.queryType === "Complex" && (
            <button
              onClick={(e) => {
                e.preventDefault();
                data.setShowQueryEditor((prev) => !prev);
              }}
            >
              <FileCode className="w-5 h-5 text-[#8E77BB]" />
            </button>
          )}
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
          <button
            onClick={() => data.deleteNode(id)}
            className="p-1 rounded-md hover:bg-gray-200"
          >
            <X className="h-5 text-gray-500" />
          </button>
        </div>
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
                    {/* Render only columns that are in allowedColumns and have detailed info */}
                    {apiColumns
                      .filter((col) =>
                        allowedColumns.some(
                          (allowedCol) => allowedCol.column_name.toLowerCase() === col.column.toLowerCase()
                        )
                      )
                      .map((item) => (
                        <div
                          key={item.column}
                          className="flex items-center mb-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            id={item.column}
                            value={item.column}
                            checked={userCheckedColumns.includes(item.column)}
                            onChange={() => handleColumnChange(item)}
                            className="text-purple-600 focus:ring-purple-500 mr-2"
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
                            className="ml-auto h-4 w-4 text-gray-500 hover:text-gray-700"
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
                apiColumns: getFilterModalColumns(),
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
