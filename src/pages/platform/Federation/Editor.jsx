import { useEffect, useState } from "react";
import { Database, Search } from "lucide-react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-mysql";
import "ace-builds/src-noconflict/theme-tomorrow";
import CircularProgress from "@mui/material/CircularProgress";
import { ToastContainer, toast } from "react-toastify";
 
export default function Editor() {
  var encodedToken = import.meta.env.VITE_FEDERATION_ACCESS_TOKEN;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");
  const [connections, setConnections] = useState([]);
  const [history, setHistory] = useState([]);
  const [outputData, setOutputData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
 
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
              // item.project.toUpperCase() === project.toUpperCase() &&
              // item.created_by.toUpperCase() === token.preferred_username.toUpperCase() &&
              !item.is_deleted
          );
        } else {
          data = data.filter(
            (item) =>
              // item.created_by.toUpperCase() === token.preferred_username.toUpperCase() &&
              !item.is_deleted
          );
        }
        console.log("connection data is ===>", data)
        const names = data?.map(connection => connection.connection_name);
        setConnections(names);
      } catch (error) {
        console.log(error);
      }
    };
 
    fetchData();
  }, []);
 
  const filteredDatabases = connections?.filter((db) =>
    db.toLowerCase().includes(searchTerm.toLowerCase())
  );
 
 
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
        console.log("queries are ====>", queries)
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
    console.log("newquery is", newquery)
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
            // setQuery("");
            // setHasMore(rows.length === 100);
            // setError(null);
            //
          } else {
            if (data) {
              const res = JSON.parse(data);
              toast.error(res.detail);
              // setError(res.detail);
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
 
  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px-32px)] bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full md:w-1/4 pr-4 flex flex-col border-r border-gray-300">
        {/* Connection Section */}
        <div className="h-[60%] flex flex-col pb-4">
          <h2 className="text-xl font-bold mb-3">Connection</h2>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full p-2 pl-10 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="mt-3 flex-1 ml-1 overflow-y-auto custom-scroll pr-2">
            {filteredDatabases.map((db) => (
              <div className="flex mt-1" key={db}>
                <Database className="h-4 w-4 mr-3 mt-1" />
                <div className="block text-gray-700 mb-2">{db}</div>
              </div>
            ))}
          </div>
        </div>
 
        {/* History Section */}
        <div className="h-[40%] flex flex-col border-t pt-3">
          <h2 className="text-xl font-bold">History</h2>
          <div className="mt-2 flex-1 overflow-x-auto overflow-y-auto custom-scroll pr-2">
            {history.length === 0 ? (
              <div className="text-gray-500">No recent queries</div>
            ) : (
              <ul className="list-decimal pl-5">
                {history.map((query, index) => (
                  <li key={index} className="text-xs text-gray-700 mb-2" onClick={() => handleHistoryClick(query)}>
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
 
      {/* Main Content */}
      <main className="flex-1 pl-5 md:w-3/4">
        <h2 className="text-xl font-bold">Query Editor</h2>
        <div className={`mt-3 border rounded-lg shadow-lg overflow-hidden ${(data?.length>0 || loading) ? "h-[30%]" : "h-[83%]"}`}>
          <AceEditor
            aria-label="editor"
            mode="mysql"
            theme="tomorrow"
            name="editor"
            fontSize={18}
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
            style={{ width: "100%", height: "100%", padding: "10px", borderRadius: "8px" }}
            showLineNumbers
          />
        </div>
        <div className="mt-3 flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => executeQuery(query)}
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-8 py-1.5 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            <div className="flex justify-between">
              {/* <Plus className="h-5 w-5 mr-1"/> */}
              Run
            </div>
          </button>
          <button onClick={handleClearQuery} className="bg-gray-400 text-white px-7 py-1.5 rounded-lg hover:bg-gray-500">Clear</button>
        </div>
 
        {/* Output Section */}
        {(data?.length>0 || loading) && (
          <>
            <h2 className="text-xl font-bold pb-3">Output</h2>
            <div className="h-[45%] bg-white rounded-lg shadow overflow-hidden w-[100%]">
              {loading ? (
                <div className="flex justify-center items-center h-full ">
                  <CircularProgress sx={{ color: "#8e78b7" }} />
                </div>
              ) : (
                <div className="h-full overflow-y-auto overflow-x-auto">
                  <table className="h-full w-full">
                    <thead className="text-sm sticky top-0 bg-[#29304a] text-white">
                      <tr>
                        {columnDefs.map((col, index) => (
                          <th key={index} className="text-left p-4">
                            {col.replace(/_/g, " ").toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-sm">
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
          </>
        )}
      </main>
      <ToastContainer />
    </div>
  );
}
 