import { useEffect, useState } from "react";
import {
  Database,
  Search,
  ChevronRight,
  ChevronDown,
  Table,
  Type,
  Hash,
  X,
  Play,
  Trash2,
  Download
} from "lucide-react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-mysql";
import "ace-builds/src-noconflict/theme-tomorrow";
import CircularProgress from "@mui/material/CircularProgress";
import { ToastContainer, toast } from "react-toastify";
import Switch from "@mui/material/Switch";
import Builder from "./Builder";
import { useAuth } from "../../../../context/AuthContext";
import { secureQuery } from '../../../datagovernance/DataCatalogue/Components/function.js';

export default function Editor() {
  const { token, project, decodedToken, setSelectedProject, hostnameV1 } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  const [securedQuery, setSecuredQuery] = useState("");

  const [displayedConnections, setDisplayedConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [schemas, setSchemas] = useState({});
  const [tables, setTables] = useState({});
  const [columns, setColumns] = useState({});

  const [expanded, setExpanded] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [originalConnections, setOriginalConnections] = useState([]);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const response = await fetch(`${hostnameV1}/connection-saves`, {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           'Content-Type': 'application/json',
  //         },
  //       });
  //       let data = await response.json();

  //       if (project !== "default" && project !== "none") {
  //         data = data.filter(
  //           (item) =>
  //             item.project.toUpperCase() === project.toUpperCase() &&
  //             item.created_by.toUpperCase() === decodedToken?.preferred_username.toUpperCase() &&
  //             !item.is_deleted
  //         );
  //       } else {
  //         data = data.filter(
  //           (item) =>
  //             item.created_by.toUpperCase() === decodedToken?.preferred_username.toUpperCase() &&
  //             !item.is_deleted
  //         );
  //       }

  //       const formattedData = data.map((item) => ({
  //         sourceConnectionId: item.connection_id,
  //         connection_type: item.connection_type,
  //         connection_name: item.connection_name,
  //         project: item.project,
  //         created_by: item.created_by,
  //       }));

  //       setOriginalConnections(formattedData); // Store the original connections
  //       setDisplayedConnections(formattedData); // Set initial displayed connections
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   };

  //   fetchData();
  // }, []);

  useEffect(() => {
    const fetchConnections = async () => {
      try {

        // First get the policy IDs
        const secureQueryResponse = await secureQuery({ user_query: "" }, token);
        const policyIds = secureQueryResponse.matched_policy_ids || [];

        // If no policy IDs are returned, set empty connections and return
        if (policyIds.length === 0) {
          setOriginalConnections([]);
          setDisplayedConnections([]);
          return;
        }

        // Then fetch connections based on policy IDs
        const response = await fetch(`${hostnameV1}/connections/list`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ matched_policy_ids: policyIds })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch connections');
        }

        const connectionsData = await response.json();

        // Format the data according to the new API response
        const formattedConnections = connectionsData.map(conn => ({
          sourceConnectionId: conn.connection_id,
          connection_type: conn.connection_type,
          connection_name: conn.connection_name,
        }));

        setOriginalConnections(formattedConnections);
        setDisplayedConnections(formattedConnections);
      } catch (error) {
        console.error("Error fetching connections:", error);
        toast.error("Failed to load connections");
      } finally {
      }
    };

    fetchConnections();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setDisplayedConnections([...originalConnections]);
    } else {
      const filteredConnections = originalConnections.filter((connection) =>
        connection.connection_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
      setDisplayedConnections(filteredConnections);
    }
  }, [searchTerm, originalConnections]);

  const handleClearQuery = () => {
    setQuery("");
    setData([]);
    setColumnDefs([]);
    setSecuredQuery("");
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

    if (newquery === "" || newquery.trim() === "") {
      toast.error("Enter query first");
      return;
    }

    setLoading(true);

    // First fetch to secure-query
    fetch(`${import.meta.env.VITE_FAST_API}/secure-query`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_query: newquery,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then(errData => {
            toast.error(errData.detail || "Error in query validation");
            throw new Error("secure-query failed");
          });
        }
        return response.json();
      })
      .then((data) => {
        if (!data || !data.secure_query) {
          throw new Error("Invalid response from secure-query");
        }

        const secureQuery = data.secure_query;
        console.log("Secure query:", secureQuery);
        console.log("Matched policy IDs:", data.matched_policy_ids);

        setSecuredQuery(secureQuery);

        const payload = {
          page: page,
          query: secureQuery,
        };

        return fetch(`${hostnameV1}/runQuery`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      })
      .then((response) => {
        if (!response.ok) {
          return response.text().then(text => {
            try {
              const errData = JSON.parse(text);
              toast.error(errData.detail || "Error in query execution");
            } catch {
              toast.error(text || "Error in query execution");
            }
            throw new Error("runQuery failed");
          });
        }
        return response.text();
      })
      .then((data) => {
        const rows = data
          .trim()
          .split("\n")
          .map((row) => JSON.parse(row));

        const columns = Object.keys(rows[0]);
        setColumnDefs(columns);
        setData(rows);
        setHasMore(rows.length === 100);
      })
      .catch((error) => {
        if (error.message !== "secure-query failed" &&
          error.message !== "runQuery failed" &&
          error.message !== "Invalid response from secure-query") {
          console.error("Unexpected error in query execution:", error);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const [checked, setChecked] = useState(true);
  const [shownViews, setShownViews] = useState([]);

  useEffect(() => {
    const fetchViews = async () => {
      try {
        const response = await fetch(`${hostnameV1}/get-all-views`);
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

  // const handleSchema = async (event, connection) => {
  //   const connectionId = `conn-${connection}`;
  //   toggleExpanded(connectionId);

  //   if (!expandedItems[connectionId] && !schemas[connection]) {
  //     try {
  //       setSchemas((prevSchemas) => ({
  //         ...prevSchemas,
  //         [connection]: "loading",
  //       }));
  //       const response = await fetch(
  //         `${hostnameV1}/${connection}/schemas`, {
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //           'Content-Type': 'application/json',
  //         },
  //       });
  //       if (!response.ok) {
  //         setSchemas((prevSchemas) => ({
  //           ...prevSchemas,
  //           [connection]: [],
  //         }));
  //         throw new Error("Network response was not ok");
  //       }
  //       const data = await response.text();
  //       const res = await JSON.parse(data);

  //       if (res.length === 0) {
  //         setSchemas((prevSchemas) => ({
  //           ...prevSchemas,
  //           [connection]: [],
  //         }));
  //       } else {
  //         setSchemas((prevSchemas) => ({
  //           ...prevSchemas,
  //           [connection]: res,
  //         }));
  //       }
  //     } catch (error) {
  //       console.error("Error fetching schema data:", error);
  //       setSchemas((prevSchemas) => ({
  //         ...prevSchemas,
  //         [connection]: "error",
  //       }));
  //     }
  //   }
  // };

  const handleSchema = async (event, connection) => {
    const connectionId = `conn-${connection}`;
    toggleExpanded(connectionId);

    if (!expandedItems[connectionId] && !schemas[connection]) {
      try {
        setSchemas((prevSchemas) => ({
          ...prevSchemas,
          [connection]: "loading",
        }));

        // First get policy IDs
        const secureQueryResponse = await secureQuery({ user_query: "" }, token);
        const policyIds = secureQueryResponse.matched_policy_ids || [];

        // If no policy IDs, set empty schemas and return
        if (policyIds.length === 0) {
          setSchemas((prevSchemas) => ({
            ...prevSchemas,
            [connection]: [],
          }));
          return;
        }

        const response = await fetch(`${hostnameV1}/schemas/list`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            matched_policy_ids: policyIds,
            connection_name: connection
          })
        });

        if (!response.ok) {
          throw new Error("Failed to fetch schemas");
        }

        const data = await response.json();

        const connectionData = data.find(item => item[connection]);
        const schemaNames = connectionData ? connectionData[connection] : [];

        setSchemas((prevSchemas) => ({
          ...prevSchemas,
          [connection]: schemaNames.length > 0 ? schemaNames : [],
        }));
      } catch (error) {
        console.error("Error fetching schema data:", error);
        setSchemas((prevSchemas) => ({
          ...prevSchemas,
          [connection]: "error",
        }));
        toast.error("Failed to load schemas");
      }
    }
  };


  // const handleTables = async (event, connection, schema) => {
  //   const schemaId = `schema-${connection}-${schema}`;
  //   toggleExpanded(schemaId);

  //   if (!expandedItems[schemaId] && !tables[`${connection}-${schema}`]) {
  //     try {
  //       setTables((prevTables) => ({
  //         ...prevTables,
  //         [`${connection}-${schema}`]: "loading",
  //       }));

  //       const response = await fetch(
  //         `${hostnameV1}/${connection}/schemas/${schema}/tables`, {
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //           'Content-Type': 'application/json',
  //         },
  //       });
  //       if (!response.ok) {
  //         setTables((prevTables) => ({
  //           ...prevTables,
  //           [`${connection}-${schema}`]: [],
  //         }));
  //         throw new Error("Network response was not ok");
  //       }
  //       const data = await response.text();
  //       const res = await JSON.parse(data);

  //       if (res.length === 0) {
  //         setTables((prevTables) => ({
  //           ...prevTables,
  //           [`${connection}-${schema}`]: [],
  //         }));
  //       } else {
  //         setTables((prevTables) => ({
  //           ...prevTables,
  //           [`${connection}-${schema}`]: res,
  //         }));
  //       }
  //     } catch (error) {
  //       console.error("Error fetching table data:", error);
  //       setTables((prevTables) => ({
  //         ...prevTables,
  //         [`${connection}-${schema}`]: "error",
  //       }));
  //     }
  //   }
  // };

  const handleTables = async (event, connection, schema) => {
    const schemaId = `schema-${connection}-${schema}`;
    toggleExpanded(schemaId);

    if (!expandedItems[schemaId] && !tables[`${connection}-${schema}`]) {
      try {
        setTables((prevTables) => ({
          ...prevTables,
          [`${connection}-${schema}`]: "loading",
        }));

        // First get policy IDs
        const secureQueryResponse = await secureQuery({ user_query: "" }, token);
        const policyIds = secureQueryResponse.matched_policy_ids || [];

        // If no policy IDs, set empty tables and return
        if (policyIds.length === 0) {
          setTables((prevTables) => ({
            ...prevTables,
            [`${connection}-${schema}`]: [],
          }));
          return;
        }

        // Then fetch tables for this specific connection and schema
        const response = await fetch(`${hostnameV1}/tables/list`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            matched_policy_ids: policyIds,
            connection_name: connection,
            schema_name: schema
          })
        });

        if (!response.ok) {
          throw new Error("Failed to fetch tables");
        }

        const data = await response.json();
        const tableNames = data.tables || [];

        setTables((prevTables) => ({
          ...prevTables,
          [`${connection}-${schema}`]: tableNames.length > 0 ? tableNames : [],
        }));
      } catch (error) {
        console.error("Error fetching table data:", error);
        setTables((prevTables) => ({
          ...prevTables,
          [`${connection}-${schema}`]: "error",
        }));
        toast.error("Failed to load tables");
      }
    }
  };

  // const handleColumns = async (event, connection, schema, table) => {
  //   const tableId = `table-${connection}-${schema}-${table}`;
  //   toggleExpanded(tableId);

  //   if (!expandedItems[tableId] && !columns[`${connection}-${schema}-${table}`]) {
  //     try {
  //       setColumns((prevColumns) => ({
  //         ...prevColumns,
  //         [`${connection}-${schema}-${table}`]: "loading",
  //       }));
  //       const response = await fetch(
  //         `${hostnameV1}/${connection}/schemas/${schema}/tables/${table}/columns`, {
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //           'Content-Type': 'application/json',
  //         },
  //       });
  //       if (!response.ok) {
  //         setColumns((prevColumns) => ({
  //           ...prevColumns,
  //           [`${connection}-${schema}-${table}`]: [],
  //         }));
  //         throw new Error("Network response was not ok");
  //       }
  //       const data = await response.text();
  //       const res = await JSON.parse(data);

  //       if (res.length === 0) {
  //         setColumns((prevColumns) => ({
  //           ...prevColumns,
  //           [`${connection}-${schema}-${table}`]: [],
  //         }));
  //       } else {
  //         setColumns((prevColumns) => ({
  //           ...prevColumns,
  //           [`${connection}-${schema}-${table}`]: res,
  //         }));
  //       }
  //     } catch (error) {
  //       console.error("Error fetching column data:", error);
  //       setColumns((prevColumns) => ({
  //         ...prevColumns,
  //         [`${connection}-${schema}-${table}`]: "error",
  //       }));
  //     }
  //   }
  // };

  const handleColumns = async (event, connection, schema, table) => {
    const tableId = `table-${connection}-${schema}-${table}`;
    toggleExpanded(tableId);

    if (!expandedItems[tableId] && !columns[`${connection}-${schema}-${table}`]) {
      try {
        setColumns((prevColumns) => ({
          ...prevColumns,
          [`${connection}-${schema}-${table}`]: "loading",
        }));

        // First get policy IDs
        const secureQueryResponse = await secureQuery({ user_query: "" }, token);
        const policyIds = secureQueryResponse.matched_policy_ids || [];

        // If no policy IDs, set empty columns and return
        if (policyIds.length === 0) {
          setColumns((prevColumns) => ({
            ...prevColumns,
            [`${connection}-${schema}-${table}`]: [],
          }));
          return;
        }

        // Then fetch columns for this specific connection, schema and table
        const response = await fetch(`${hostnameV1}/columns/list`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            matched_policy_ids: policyIds,
            connection_name: connection,
            schema_name: schema,
            table_name: table
          })
        });

        if (!response.ok) {
          throw new Error("Failed to fetch columns");
        }

        const data = await response.json();
        const columnData = data.columns || [];

        // Format the columns data to match the expected structure
        const formattedColumns = columnData.map(item => ({
          column: item.column_name,
          datatype: item.metadata?.DATA_TYPE || 'unknown',
          metadata: item.metadata
        }));

        setColumns((prevColumns) => ({
          ...prevColumns,
          [`${connection}-${schema}-${table}`]: formattedColumns.length > 0 ? formattedColumns : [],
        }));
      } catch (error) {
        console.error("Error fetching column data:", error);
        setColumns((prevColumns) => ({
          ...prevColumns,
          [`${connection}-${schema}-${table}`]: "error",
        }));
        toast.error("Failed to load columns");
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
      >
        <div style={{ minWidth: "24px", width: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isExpanded ? (
            <ChevronDown size={18} onClick={(e) => handleConnectionChange(e, connection.connection_name)} />
          ) : (
            <ChevronRight size={18} onClick={(e) => handleConnectionChange(e, connection.connection_name)} />
          )}
        </div>

        <div style={{ minWidth: "24px", width: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Database size={15} />
        </div>

        <span
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
          title={connection.connection_name}
        >
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
      >
        <div style={{ minWidth: "24px", width: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isExpanded ? (
            <ChevronDown size={18} onClick={(e) => handleTables(e, connection, schema)} />
          ) : (
            <ChevronRight size={18} onClick={(e) => handleTables(e, connection, schema)} />
          )}
        </div>

        <div style={{ minWidth: "24px", width: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Database size={15} />
        </div>

        <span
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
          title={schema}  // Add this
        >
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
      >
        <div style={{ minWidth: "24px", width: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isExpanded ? (
            <ChevronDown size={18} onClick={(e) => handleColumns(e, connection, schema, table)} />
          ) : (
            <ChevronRight size={18} onClick={(e) => handleColumns(e, connection, schema, table)} />
          )}
        </div>

        <div style={{ minWidth: "24px", width: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Table size={15} />
        </div>

        <span
          onDoubleClick={() => {
            if (!loading) {
              handleTableClick(connection, schema, table)
            }
          }}
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
          title={table}  // Add this
        >
          {table}
        </span>
      </div>
    );
  };

  const handleTableClick = (connection, schema, table) => {
    console.log("Inputs are ===>", connection, schema, table);
    const query = `Select * from ${connection}.${schema}.${table}`;
    setQuery(query);
    setSecuredQuery("");
    setPageNo(1);
    executeQuery(query, 1);
  }

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
          {isNumber ? <Hash size={18} /> : <Type size={18} />}
        </div>

        <span
          style={{
            fontWeight: "normal",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
          title={column.column}  // Add this
        >
          {column.column}
        </span>
      </div>
    );
  };

  const [pageNo, setPageNo] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const handleNextPage = () => {
    const nextPage = pageNo + 1;
    setPageNo(nextPage);
    executeQuery(query, nextPage);
  };

  const handlePreviousPage = () => {
    if (pageNo > 1) {
      const prevPage = pageNo - 1;
      setPageNo(prevPage);
      executeQuery(query, prevPage);
    }
  };

  const convertToCSV = (jsonData) => {
    const headers = Object.keys(jsonData[0]).join(',');

    const csvRows = jsonData.map(obj =>
      Object.values(obj).map(val =>
        `"${val}"`
      ).join(',')
    );

    return [headers, ...csvRows].join('\n');
  };

  const handleDownloadCSV = () => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-[calc(100vh-64px-32px)]">
      <div className="flex flex-row h-[100%] bg-gray-50">
        {checked ? (
          <>
            <aside className="w-1/4 pr-4 flex flex-col border-r border-gray-300">
              <div className="h-[100%] flex flex-col pb-4">
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
                    <X
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
              <div className={`${(data?.length > 0 || loading) ? "h-[41%]" : "h-[100%]"} flex flex-col`}>
                <div className="w-[100%] flex justify-between pr-3">
                  <h2 className="text-xl font-bold">Query Editor</h2>
                  <div className="flex justify-center items-center">
                    <button
                      type="button"
                      onClick={handleDownloadCSV}
                      className="text-black shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-1.5 mr-1 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <Switch
                      checked={checked}
                      onChange={handleSwitch}
                      inputProps={{ "aria-label": "controlled" }}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#8e78b7',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#8e78b7',
                        },
                      }}
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
                    marginTop: "2px",
                    flexGrow: 1,
                  }}
                  showLineNumbers
                />

                <div className="mt-3 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => executeQuery(query)}
                    disabled={loading}
                    className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-8 py-1.5 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                  >
                    <div className="flex justify-between items-center">
                      <Play size={16} className="mr-2" />
                      {loading ? "Processing..." : "Run"}
                    </div>
                  </button>
                  <button
                    onClick={handleClearQuery}
                    className="bg-gray-400 text-white px-7 py-1.5 rounded-lg hover:bg-gray-500 flex items-center"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Clear
                  </button>
                </div>
              </div>

              {(data?.length > 0 || loading) && (
                <div className="h-[60%] flex flex-col">
                  <h2 className="text-xl font-bold pb-2">Output</h2>
                  {loading ? (
                    <div className="bg-white rounded-lg shadow w-full flex-1 overflow-hidden">
                      <div className="flex justify-center items-center h-full">
                        <CircularProgress sx={{ color: "#8e78b7" }} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col flex-1 min-h-0">

                      <div className="flex-1 overflow-hidden">
                        <div className="overflow-y-auto custom-scroll rounded-lg bg-white shadow h-full">
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
                      </div>

                      <div className="w-full flex justify-end mt-2 ">
                        <button
                          type="button"
                          onClick={handlePreviousPage}
                          disabled={pageNo === 1}
                          className={`px-8 py-1.5 focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm focus:outline-none mr-4
                         ${pageNo === 1 ? "text-gray-400 bg-gray-200 cursor-not-allowed" : "text-white bg-[#8e78b7] hover:bg-[#7a63a8]"}`}
                        >
                          Previous
                        </button>

                        <button
                          type="button"
                          onClick={handleNextPage}
                          disabled={!hasMore}
                          className={`px-8 py-1.5 rounded-lg text-sm
                            ${!hasMore ? "text-gray-400 bg-gray-200 cursor-not-allowed" : "text-white focus:ring-1 focus:ring-[#8e78b7] bg-[#8e78b7] hover:bg-[#7a63a8]"} `}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
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