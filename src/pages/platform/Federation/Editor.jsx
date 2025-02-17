import { useEffect, useState } from "react";
import { Database, Search } from "lucide-react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-mysql";
import "ace-builds/src-noconflict/theme-tomorrow";

export default function Editor() {
  var encodedToken = import.meta.env.VITE_FEDERATION_ACCESS_TOKEN;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");
  const [connections,  setConnections] = useState([]);
  const [history, setHistory] = useState([]);

  const databases = [
    "Oracle",
    "Hive",
    "MySQL",
    "PostgreSQL",
    "SQL Server",
    "SQLite",
    "Snowflake",
    "BigQuery",
    "Redshift",
    "Teradata",
    "MariaDB",
    "CockroachDB",
    "MongoDB",
    "DynamoDB",
    "Cassandra",
    "Neo4j",
    "IBM Db2",
    "Firebird",
  ];

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
          console.log("connection data is ===>",data)
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
        console.log("queries are ====>",queries)
        setHistory(queries);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const handleRunQuery = () => {
    console.log("Running query:", query);
  };

  const handleClearQuery = () => {
    setQuery("");
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px-32px)] bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full md:w-1/4 px-4 flex flex-col border-r border-gray-300">
        {/* Connection Section */}
        <div className="h-[60%] flex flex-col pb-4">
          <h2 className="text-xl font-bold mb-3">Connection</h2>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="mt-3 flex-1 ml-1 overflow-y-auto custom-scrollbar pr-2">
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
          <h2 className="text-xl font-bold mb-3">History</h2>
          
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-6">
        <h2 className="text-xl font-bold">Query Editor</h2>
        <div className="mt-3 border rounded-lg shadow-lg overflow-hidden">
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
            style={{ width: "100%", height: "150px", padding: "10px", borderRadius: "8px" }}
            showLineNumbers
          />
        </div>
        <div className="mt-3 flex gap-3 justify-end">
        <button
            type="button"
            // onClick={toggleModal}
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-7 py-1.5 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
             <div className="flex justify-between"> 
            {/* <Plus className="h-5 w-5 mr-1"/> */}
            Run
            </div>
          </button> 
        <button onClick={handleClearQuery} className="bg-gray-400 text-white px-6 py-1.5 rounded-lg hover:bg-gray-500">Clear</button>
        </div>

        {/* Output Section */}
        <div className="mt-6">
          <h2 className="text-xl font-bold">Output</h2>
          <div className="overflow-auto border rounded-lg">
            <table className="w-full border-collapse text-left text-sm md:text-base">
              <thead>
                <tr className="bg-blue-100 text-blue-900">
                  <th className="border p-2 md:p-3">Column 1</th>
                  <th className="border p-2 md:p-3">Column 2</th>
                  <th className="border p-2 md:p-3">Column 3</th>
                  <th className="border p-2 md:p-3">Column 4</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-100">
                  <td className="border p-2 md:p-3">Data 1</td>
                  <td className="border p-2 md:p-3">Data 2</td>
                  <td className="border p-2 md:p-3">Data 3</td>
                  <td className="border p-2 md:p-3">Data 4</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
