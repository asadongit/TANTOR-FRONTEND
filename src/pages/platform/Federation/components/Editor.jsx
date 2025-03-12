import { useEffect, useState } from "react";
import { Database, Search } from "lucide-react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-mysql";
import "ace-builds/src-noconflict/theme-tomorrow";
import CircularProgress from "@mui/material/CircularProgress";
import { ToastContainer, toast } from "react-toastify";
import Switch from "@mui/material/Switch";
import Builder from "./Builder";
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { FiDatabase } from "react-icons/fi";
import { TbSchema } from "react-icons/tb";
import { CiViewTable } from "react-icons/ci";
import { MdAbc } from "react-icons/md";
import { Md123 } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";

export default function Editor() {
  var encodedToken = import.meta.env.VITE_FEDERATION_ACCESS_TOKEN;
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  
  const [displayedConnections, setDisplayedConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [schemas, setSchemas] = useState({});
  const [tables, setTables] = useState({});
  const [columns, setColumns] = useState({});
  
  const [expanded, setExpanded] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});

  const preferred_username = "sabhyata";
  
  useEffect(() => {
    var project = "me";
    const fetchData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_FAST_API}/connection-saves`, {
          headers: {
            Authorization: `Bearer ${encodedToken}`,
            'Content-Type': 'application/json',
          },
        });
        let data = await response.json();

        if (project !== "none") {
          data = data.filter(
            (item) =>
              item.created_by.toUpperCase() === preferred_username.toUpperCase() &&
              !item.is_deleted
          );
        } else {
          data = data.filter(
            (item) => !item.is_deleted
          );
        }
        console.log("connection data is ===>", data);
        
        const formattedData = data.map((item) => ({
          sourceConnectionId: item.connection_id,
          connection_type: item.connection_type,
          connection_name: item.connection_name,
          project: item.project,
          created_by: item.created_by,
        }));
        setDisplayedConnections(formattedData);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, []);
  
  useEffect(() => {
    if (searchTerm.trim() === "") {
      const originalConnections = displayedConnections.length ? displayedConnections : [];
      setDisplayedConnections(originalConnections);
    } else {
      const filteredConnections = displayedConnections.filter((connection) =>
        connection.connection_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
      setDisplayedConnections(filteredConnections);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_FAST_API}/recent-queries`, {
      headers: {
        'Authorization': `Bearer ${encodedToken}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.text())
      .then((result) => {
        const lines = result.trim().split("\n");
        const queries = lines
          .map((line) => {
            try {
              const json = JSON.parse(line);
              return json.query;
            } catch (error) {
              console.error("Error parsing JSON:", error);
              return null;
            }
          })
          .filter((query) => query !== null);
        console.log("queries are ====>", queries);
        setHistory(queries);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const handleClearQuery = () => {
    setQuery("");
    setData([]);
    setColumnDefs([]);
  };

  function removeComments(sql) {
    const lines = sql.split("\n");
    let newQuery = "";
    let inSingleLineComment = false;
    let inMultiLineComment = false;

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      if (inMultiLineComment) {
        if (trimmedLine.includes("*/")) {
          inMultiLineComment = false;
          return;
        }
        return;
      }
      if (trimmedLine.startsWith("/*")) {
        inMultiLineComment = true;
        return;
      }

      if (trimmedLine.startsWith("--")) {
        return;
      }
      newQuery += line + "\n";
    });
    return newQuery.trim();
  }

  const executeQuery = (query, page = 1) => {
    setData([]);
    setColumnDefs([]);

    const newquery = removeComments(query);
    console.log("newquery is", newquery);
    setLoading(true);
    if (newquery === "" || newquery.trim() === "") {
      setLoading(false);
      toast.error("Enter query first");
      return;
    } else {
      const payload = {
        page: page,
        query: newquery,
      };

      fetch(`${import.meta.env.VITE_FAST_API}/runQuery`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          'Authorization': `Bearer ${encodedToken}`,
        },
        body: JSON.stringify(payload),
      })
        .then((response) =>
          response.text().then((data) => ({ status: response.status, data }))
        )
        .then(({ status, data }) => {
          if (status === 200) {
            const rows = data
              .trim()
              .split("\n")
              .map((row) => JSON.parse(row));

            const columns = Object.keys(rows[0]);

            setColumnDefs(columns);
            setData(rows);
          } else {
            if (data) {
              const res = JSON.parse(data);
              toast.error(res.detail);
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handleHistoryClick = (history) => {
    setQuery(history);
    executeQuery(history, 1);
  };

  const [checked, setChecked] = useState(true);
  const [shownViews, setShownViews] = useState([]);

  useEffect(() => {
    const fetchViews = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_FAST_API}/get-all-views`);
        const data = await response.json();
        if (data && data.result) {
          console.log("Views are ====>", data.result);
          setShownViews(data.result);
        } else {
          console.error("Invalid response from the API");
        }
      } catch (error) {
        console.error("Error fetching views:", error);
      }
    };
    fetchViews();
  }, []);

  const handleSwitch = async () => {
    setData([]);
    setColumnDefs([]);
    setQuery("");
    setChecked(!checked);
  };

  const handleNodeToggle = (event, nodeIds) => {
    setExpanded(nodeIds);
  };
  
  const toggleExpanded = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSchema = async (event, connection) => {
    const connectionId = `conn-${connection}`;
    toggleExpanded(connectionId);
    
    if (!expandedItems[connectionId] && !schemas[connection]) {
      try {
        setSchemas((prevSchemas) => ({
          ...prevSchemas,
          [connection]: "loading",
        }));
        const response = await fetch(
          `${import.meta.env.VITE_FAST_API}/${connection}/schemas`, {
          headers: {
            'Authorization': `Bearer ${encodedToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          setSchemas((prevSchemas) => ({
            ...prevSchemas,
            [connection]: [],
          }));
          throw new Error("Network response was not ok");
        }
        const data = await response.text();
        const res = await JSON.parse(data);

        if (res.length === 0) {
          setSchemas((prevSchemas) => ({
            ...prevSchemas,
            [connection]: [],
          }));
        } else {
          setSchemas((prevSchemas) => ({
            ...prevSchemas,
            [connection]: res,
          }));
        }
      } catch (error) {
        console.error("Error fetching schema data:", error);
        setSchemas((prevSchemas) => ({
          ...prevSchemas,
          [connection]: "error",
        }));
      }
    }
  };

  const handleTables = async (event, connection, schema) => {
    const schemaId = `schema-${connection}-${schema}`;
    toggleExpanded(schemaId);
    
    if (!expandedItems[schemaId] && !tables[`${connection}-${schema}`]) {
      try {
        setTables((prevTables) => ({
          ...prevTables,
          [`${connection}-${schema}`]: "loading",
        }));

        const response = await fetch(
          `${import.meta.env.VITE_FAST_API}/${connection}/schemas/${schema}/tables`, {
          headers: {
            'Authorization': `Bearer ${encodedToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          setTables((prevTables) => ({
            ...prevTables,
            [`${connection}-${schema}`]: [],
          }));
          throw new Error("Network response was not ok");
        }
        const data = await response.text();
        const res = await JSON.parse(data);

        if (res.length === 0) {
          setTables((prevTables) => ({
            ...prevTables,
            [`${connection}-${schema}`]: [],
          }));
        } else {
          setTables((prevTables) => ({
            ...prevTables,
            [`${connection}-${schema}`]: res,
          }));
        }
      } catch (error) {
        console.error("Error fetching table data:", error);
        setTables((prevTables) => ({
          ...prevTables,
          [`${connection}-${schema}`]: "error",
        }));
      }
    }
  };

  const handleColumns = async (event, connection, schema, table) => {
    const tableId = `table-${connection}-${schema}-${table}`;
    toggleExpanded(tableId);
    
    if (!expandedItems[tableId] && !columns[`${connection}-${schema}-${table}`]) {
      try {
        setColumns((prevColumns) => ({
          ...prevColumns,
          [`${connection}-${schema}-${table}`]: "loading",
        }));
        const response = await fetch(
          `${import.meta.env.VITE_FAST_API}/${connection}/schemas/${schema}/tables/${table}/columns`, {
          headers: {
            'Authorization': `Bearer ${encodedToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          setColumns((prevColumns) => ({
            ...prevColumns,
            [`${connection}-${schema}-${table}`]: [],
          }));
          throw new Error("Network response was not ok");
        }
        const data = await response.text();
        const res = await JSON.parse(data);

        if (res.length === 0) {
          setColumns((prevColumns) => ({
            ...prevColumns,
            [`${connection}-${schema}-${table}`]: [],
          }));
        } else {
          setColumns((prevColumns) => ({
            ...prevColumns,
            [`${connection}-${schema}-${table}`]: res,
          }));
        }
      } catch (error) {
        console.error("Error fetching column data:", error);
        setColumns((prevColumns) => ({
          ...prevColumns,
          [`${connection}-${schema}-${table}`]: "error",
        }));
      }
    }
  };

  const handleConnectionChange = (event, selectedConn) => {
    setSelectedConnection(selectedConn);
    handleSchema(event, selectedConn);
  };

  const renderDatabaseLabel = (connection) => {
    const connectionId = `conn-${connection.connection_name}`;
    const isExpanded = expandedItems[connectionId];
    
    return (
      <div
        style={{ 
          display: "flex",
          alignItems: "center", 
          cursor: "pointer",
          width: "100%",
          overflow: "hidden"
        }}
        onClick={(e) => handleConnectionChange(e, connection.connection_name)}
      >
        <div style={{ minWidth: "24px", width: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isExpanded ? (
            <ExpandMoreIcon style={{ fontSize: 18 }} />
          ) : (
            <ChevronRightIcon style={{ fontSize: 18 }} />
          )}
        </div>
        
        <div style={{ minWidth: "24px", width: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FiDatabase size={15} />
        </div>
        
        <span style={{ 
          whiteSpace: "nowrap", 
          overflow: "hidden", 
          textOverflow: "ellipsis"
        }}>
          {connection.connection_name}
        </span>
      </div>
    );
  };
  
  const renderSchemaLabel = (connection, schema) => {
    const schemaId = `schema-${connection}-${schema}`;
    const isExpanded = expandedItems[schemaId];
    
    return (
      <div
        style={{ 
          display: "flex", 
          alignItems: "center", 
          cursor: "pointer",
          width: "100%",
          overflow: "hidden"
        }}
        onClick={(e) => handleTables(e, connection, schema)}
      >
        <div style={{ minWidth: "24px", width: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isExpanded ? (
            <ExpandMoreIcon style={{ fontSize: 18 }} />
          ) : (
            <ChevronRightIcon style={{ fontSize: 18 }} />
          )}
        </div>
        
        <div style={{ minWidth: "24px", width: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <TbSchema size={15} />
        </div>
        
        <span style={{ 
          whiteSpace: "nowrap", 
          overflow: "hidden", 
          textOverflow: "ellipsis"
        }}>
          {schema}
        </span>
      </div>
    );
  };
  
  const renderTableLabel = (connection, schema, table) => {
    const tableId = `table-${connection}-${schema}-${table}`;
    const isExpanded = expandedItems[tableId];
    
    return (
      <div
        style={{ 
          display: "flex", 
          alignItems: "center", 
          cursor: "pointer",
          width: "100%",
          overflow: "hidden"
        }}
        onClick={(e) => handleColumns(e, connection, schema, table)}
      >
        <div style={{ minWidth: "24px", width: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isExpanded ? (
            <ExpandMoreIcon style={{ fontSize: 18 }} />
          ) : (
            <ChevronRightIcon style={{ fontSize: 18 }} />
          )}
        </div>
        
        <div style={{ minWidth: "24px", width: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CiViewTable size={15} />
        </div>
        
        <span style={{ 
          whiteSpace: "nowrap", 
          overflow: "hidden", 
          textOverflow: "ellipsis"
        }}>
          {table}
        </span>
      </div>
    );
  };
  
  const renderColumnLabel = (column) => {
    const isNumber = column.datatype.split("(")[0] === "int" ||
      column.datatype.split("(")[0] === "integer" ||
      column.datatype.split("(")[0] === "decimal" ||
      column.datatype.split("(")[0] === "double";
    
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        paddingLeft: "20px",
        width: "100%",
        overflow: "hidden"
      }}>
        <div style={{ minWidth: "24px", width: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isNumber ? <Md123 size={18} /> : <MdAbc size={18} />}
        </div>
        
        <span style={{ 
          fontWeight: "normal",
          whiteSpace: "nowrap", 
          overflow: "hidden", 
          textOverflow: "ellipsis"
        }}>
          {column.column}
        </span>
      </div>
    );
  };


  return (
    <div className="h-[calc(100vh-64px-32px)]">
      <div className="flex flex-row h-[100%] bg-gray-50">
        {checked ? (
          <>
            <aside className="w-1/4 pr-4 flex flex-col border-r border-gray-300">
              <div className="h-[60%] flex flex-col pb-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-bold">Connection</h2>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full p-1 pl-8 border rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <RxCross2
                      className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 cursor-pointer"
                      onClick={() => setSearchTerm("")}
                    />
                  )}
                </div>
                <div className="mt-1 flex-1 ml-1 overflow-y-auto overflow-x-auto custom-scroll pr-2">
                  <div className="tree-view" style={{ width: "100%" }}>
                    {displayedConnections.map((connection) => {
                      const connectionId = `conn-${connection.connection_name}`;
                      const connectionSchemas = schemas[connection.connection_name];
                      const isExpanded = expandedItems[connectionId];
                      
                      return (
                        <div key={connection.sourceConnectionId} className="tree-item" style={{ width: "100%" }}>
                          <div className="p-1 hover:bg-gray-100 rounded" style={{ width: "100%" }}>
                            {renderDatabaseLabel(connection)}
                          </div>
                          
                          {isExpanded && (
                            <div className="ml-6 pl-2 border-l border-gray-300" style={{ width: "calc(100% - 24px)" }}>
                              {connectionSchemas === "loading" && (
                                <div className="py-1 pl-6 text-gray-500">Loading...</div>
                              )}
                              
                              {connectionSchemas === "error" && (
                                <div className="py-1 pl-6 text-red-500">Error loading schemas</div>
                              )}
                              
                              {Array.isArray(connectionSchemas) && connectionSchemas.length === 0 && (
                                <div className="py-1 pl-6 text-gray-500">No Schemas Available</div>
                              )}
                              
                              {Array.isArray(connectionSchemas) && connectionSchemas.length > 0 && (
                                connectionSchemas.map((schema, schemaIndex) => {
                                  const schemaId = `schema-${connection.connection_name}-${schema}`;
                                  const tableData = tables[`${connection.connection_name}-${schema}`];
                                  const isSchemaExpanded = expandedItems[schemaId];
                                  
                                  return (
                                    <div key={`${schema}-${schemaIndex}`} className="tree-item" style={{ width: "100%" }}>
                                      <div className="p-1 my-1 hover:bg-gray-100 rounded" style={{ width: "100%" }}>
                                        {renderSchemaLabel(connection.connection_name, schema)}
                                      </div>
                                      
                                      {isSchemaExpanded && (
                                        <div className="ml-6 pl-2 border-l border-gray-300" style={{ width: "calc(100% - 24px)" }}>
                                          {tableData === "loading" && (
                                            <div className="py-1 pl-6 text-gray-500">Loading...</div>
                                          )}
                                          
                                          {tableData === "error" && (
                                            <div className="py-1 pl-6 text-red-500">Error loading tables</div>
                                          )}
                                          
                                          {Array.isArray(tableData) && tableData.length === 0 && (
                                            <div className="py-1 pl-6 text-gray-500">No Tables Available</div>
                                          )}
                                          
                                          {Array.isArray(tableData) && tableData.length > 0 && (
                                            tableData.map((table, tableIndex) => {
                                              const tableId = `table-${connection.connection_name}-${schema}-${table}`;
                                              const columnData = columns[`${connection.connection_name}-${schema}-${table}`];
                                              const isTableExpanded = expandedItems[tableId];
                                              
                                              return (
                                                <div key={`${table}-${tableIndex}`} className="tree-item" style={{ width: "100%" }}>
                                                  <div className="p-1 my-1 hover:bg-gray-100 rounded" style={{ width: "100%" }}>
                                                    {renderTableLabel(connection.connection_name, schema, table)}
                                                  </div>
                                                  
                                                  {isTableExpanded && (
                                                    <div className="ml-6 pl-2 border-l border-gray-300" style={{ width: "calc(100% - 24px)" }}>
                                                      {columnData === "loading" && (
                                                        <div className="py-1 pl-6 text-gray-500">Loading...</div>
                                                      )}
                                                      
                                                      {columnData === "error" && (
                                                        <div className="py-1 pl-6 text-red-500">Error loading columns</div>
                                                      )}
                                                      
                                                      {Array.isArray(columnData) && columnData.length === 0 && (
                                                        <div className="py-1 pl-6 text-gray-500">No Columns Available</div>
                                                      )}
                                                      
                                                      {Array.isArray(columnData) && columnData.length > 0 && (
                                                        columnData.map((column, columnIndex) => (
                                                          <div key={`${column.column}-${columnIndex}`} className="p-1 my-1 hover:bg-gray-100 rounded" style={{ width: "100%" }}>
                                                            {renderColumnLabel(column)}
                                                          </div>
                                                        ))
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="h-[40%] flex flex-col border-t pt-1">
                <h2 className="text-xl font-bold">History</h2>
                <div className="mt-2 flex-1 overflow-x-auto overflow-y-auto custom-scroll pr-2">
                  {history.length === 0 ? (
                    <div className="text-gray-500">No recent queries</div>
                  ) : (
                    <ul className="list-decimal pl-5">
                      {history.map((query, index) => (
                        <li key={index} className="text-xs text-gray-700 mb-2 cursor-pointer hover:text-gray-900" onClick={() => handleHistoryClick(query)}>
                          {query}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <style>
                  {`
                    /* Vertical Scrollbar */
                    .custom-scroll::-webkit-scrollbar {
                      width: 5px;
                    }
                    .custom-scroll::-webkit-scrollbar-thumb {
                      background-color: #8e78b7;
                      border-radius: 4px;
                    }
                    .custom-scroll::-webkit-scrollbar-track {
                      background-color: #f1f1f1;
                    }
                    
                    /* Horizontal Scrollbar */
                    .custom-scroll::-webkit-scrollbar:horizontal {
                      display: none
                    }
                  `}
                </style>
              </div>
            </aside>

            <main className="flex-1 pl-5 w-3/4">
              <div className={`${(data?.length > 0 || loading) ? "h-[42%]" : "h-[100%]"} flex flex-col`}>
                <div className="w-[100%] flex justify-between">
                  <h2 className="text-xl font-bold">Query Editor</h2>
                  <div>
                    <Switch
                      checked={checked}
                      onChange={handleSwitch}
                      inputProps={{ "aria-label": "controlled" }}
                    />
                    <span
                      style={{
                        display: "inline-block",
                      }}
                    >
                      {checked ? "Editor" : "Builder"}
                    </span>
                  </div>
                </div>

                <AceEditor
                  aria-label="editor"
                  mode="mysql"
                  theme="tomorrow"
                  name="editor"
                  fontSize={14}
                  wrapEnabled={true}
                  showPrintMargin={false}
                  showGutter
                  placeholder="Write your query here..."
                  editorProps={{ $blockScrolling: true }}
                  setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                  }}
                  value={query}
                  onChange={setQuery}
                  style={{
                    width: "100%",
                    height: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                    border: "1px solid #e0e0e0",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    marginTop: "6px",
                    flexGrow: 1,
                  }}
                  showLineNumbers
                />

                <div className="mt-3 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => executeQuery(query)}
                    className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-8 py-1.5 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                  >
                    <div className="flex justify-between">
                      Run
                    </div>
                  </button>
                  <button onClick={handleClearQuery} className="bg-gray-400 text-white px-7 py-1.5 rounded-lg hover:bg-gray-500">Clear</button>
                </div>
              </div>

              {(data?.length > 0 || loading) && (
                <div className="h-[58%] flex flex-col">
                  <h2 className="text-xl font-bold pb-3">Output</h2>
                  <div className="bg-white rounded-lg shadow w-full flex-1 overflow-hidden">
                    {loading ? (
                      <div className="flex justify-center items-center h-full">
                        <CircularProgress sx={{ color: "#8e78b7" }} />
                      </div>
                    ) : (
                      <div className="h-full overflow-y-auto overflow-x-auto custom-scroll rounded-lg">
                        <table className="w-full">
                          <thead className="text-xs sticky top-0 bg-[#29304a] text-white">
                            <tr>
                              {columnDefs.map((col, index) => (
                                <th key={index} className="text-left p-4">
                                  {col.replace(/_/g, " ").toUpperCase()}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="text-xs">
                            {data.map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-b">
                                {columnDefs.map((col, colIndex) => {
                                  const cellContent = row[col];
                                  const isLink =
                                    typeof cellContent === "string" &&
                                    cellContent.startsWith("http");

                                  return (
                                    <td key={colIndex} className="p-4 text-left">
                                      {isLink ? (
                                        <a
                                          href={cellContent}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-500 underline"
                                        >
                                          {cellContent}
                                        </a>
                                      ) : (
                                        cellContent
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>
          </>
        ) : (
          <Builder handleSwitch={handleSwitch} checked={checked} />
        )}
      </div>
      <ToastContainer />
    </div>
  );
}