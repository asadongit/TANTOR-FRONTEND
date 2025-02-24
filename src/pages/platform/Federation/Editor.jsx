import { useEffect, useState } from "react";
import { Database, Search } from "lucide-react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-mysql";
import "ace-builds/src-noconflict/theme-tomorrow";
import CircularProgress from "@mui/material/CircularProgress";
import { ToastContainer, toast } from "react-toastify";
import Switch from "@mui/material/Switch";
import {
  TextField,
  Autocomplete,
  Typography
} from "@mui/material";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { ChevronDown } from 'lucide-react';

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
  const [curl, setCurl] = useState("pervious curl is")

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

  const [checked, setChecked] = useState(true);
  const [shownViews, setShownViews] = useState([])
  const [selectedView, setsSelectedView] = useState("");
  const handleViewChange = async (event, value) => {
    // setData([])
    setsSelectedView(value);
  };

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


  const handleExecuteQuery = () => {
    const query = `Select * from iceberg_test.data_federation.${selectedView}`;
    executeQuery(query)

  }

  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  return (
    <div className="h-[calc(100vh-64px-32px)]">
      <div className="flex flex-col md:flex-row h-[100%] bg-gray-50">
        {checked ? (
          <>
            <aside className="w-1/4 pr-4 flex flex-col border-r border-gray-300">
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
                <div className="mt-2 flex-1 ml-1 overflow-y-auto overflow-x-auto custom-scroll pr-2">
                  {filteredDatabases.map((db) => (
                    <div className="flex mt-1" key={db}>
                      <Database className="h-4 w-4 mr-3 mt-1" />
                      <div className="block text-gray-700 mb-2">{db}</div>
                    </div>
                  ))}
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

            <main className="flex-1 pl-5 w-3/4">
              <div className={`${(data?.length > 0 || loading) ? "h-[42%]" : "h-[100%]"} flex flex-col`}>
                <div className="w-[100%] flex justify-between">
                  <h2 className="text-xl font-bold">Query Editor</h2>
                  <div>
                    <Switch
                      checked={checked}
                      onChange={() => setChecked(!checked)}
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
                  fontSize={12}
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
          // <div className="h-[97%] bg-gray-50 flex flex-col w-[100%]">
          <div className="h-[100%] w-[100%]">
            <div className="w-[100%] flex justify-between h-[15%] items-center">
              <div className="flex justify-between w-[40%] items-center">
                <Autocomplete
                  disablePortal
                  options={shownViews}
                  value={selectedView}
                  onChange={handleViewChange}
                  sx={{ width: 175, backgroundColor: "#F0F0F0", borderRadius: "8px", border: "none" }}
                  size="small"
                  renderInput={(params) => <TextField {...params} label="Select View" />}
                />
                <button
                  type="button"
                  onClick={handleExecuteQuery}
                  className="text-white px-8 py-1.5 bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                >
                  Execute
                </button>
              </div>
              <div className="flex items-center">
                <Switch
                  checked={checked}
                  onChange={() => setChecked(!checked)}
                  inputProps={{ "aria-label": "controlled" }}
                />
                <span>{checked ? "Editor" : "Builder"}</span>
              </div>
            </div>
            <div className="h-[85%] flex justify-between flex-col">
              {(data?.length > 0 || loading) && (
                <>
                  <div className={`${isAccordionOpen ? "h-[55%]" : "h-[70%]"} flex flex-col`}>
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

                  <div className={`${isAccordionOpen ? "h-[40%]" : "h-[25%]"} flex justify-between flex-col`}>
                    <div>
                      <Accordion style={{ width: "100%", padding: "0px" }}
                      expanded={isAccordionOpen} 
                      onChange={() => setIsAccordionOpen(!isAccordionOpen)}
                      className="transition-all duration-300"
                      >
                        <AccordionSummary
                          expandIcon={<ChevronDown />}
                          aria-controls="panel2-content"
                          id="panel2-header"
                        >
                          <div style={{
                            display: "flex",
                          }}>
                            <div style={{
                              backgroundColor: "#8E77BB",
                              marginRight: "25px",
                              color: "white",
                              borderRadius: "8px",
                              padding: "2px 10px"
                            }}>POST</div>
                            <Typography component="span">/api/v1/view/{selectedView}</Typography>
                          </div>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography>
                            {curl}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    </div>
                    <div className="w-[100%] flex justify-between">
                      <div>
                        <button
                          type="button"
                         // onClick={handleQueryDetails}
                          className="text-white px-8 py-1.5 bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                        >
                          Query Details
                        </button>
                      </div>
                      <div className="w-[60%] flex justify-end">
                        <button
                          type="button"
                          // onClick={handlePreviousPage}
                          // disabled={pageNo === 1}
                          className="text-white px-8 py-1.5 bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7] mr-4"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                           // onClick={handleNextPage}
                        // disabled={!hasMore}
                          className="text-white px-8 py-1.5 bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>

                </>

              )}
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
