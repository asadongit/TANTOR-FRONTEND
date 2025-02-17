import { useEffect, useState } from "react";
import AceEditor from "react-ace";
import { useStateContext } from "../../../../context/contextProvider";

function ComplexQueryEditor({setShowQueryEditor}) {
  const [query, setQuery] = useState("");
  
  const {userSelections, setUserSelections} = useStateContext("");
  
  useEffect(() => {
    if(userSelections.has("complex_query"))
        setQuery(userSelections.get("complex_query"));
  },[]);
  
  const handelExecute = () => {
    setUserSelections(prev => {
        const updatedSelections = new Map(prev);
        updatedSelections.set("complex_query", query);
        return updatedSelections;
    });

    setShowQueryEditor(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black bg-opacity-0 p-0 h-screen">
      <div className="w-96 bg-white rounded-lg shadow-lg overflow-hidden h-full"> {/* Increased width to w-96 */}
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <span className="text-lg font-medium">Query Editor</span>
            {/* Close Button */}
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={(e) => setShowQueryEditor(false)}
            >
              <span className="material-icons text-">Close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 pl-1">
            {/* AceEditor Component */}
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
              style={{
                width: "100%",
                height: "calc(100% - 70px)", // Subtract the space taken by header and buttons
                padding: "10px",
                borderRadius: "8px",
              }}
              showLineNumbers
            />
          </div>

          <div className="flex gap-3 mt-4 pt-4 border-t">
            <button
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              onClick={(e) => setQuery("")}
            >
              Clear
            </button>
            <button
              className="flex-1 px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[rgb(142,119,187,0.8)]"
              onClick={handelExecute}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplexQueryEditor;
