import { useEffect, useState } from "react";
import AceEditor from "react-ace";
import { useStateContext } from "../context/contextViewProvider";
import { X, FileCode } from "lucide-react";

function ComplexQueryEditor({setShowQueryEditor, onQuerySave}) {
  const [query, setQuery] = useState("");
  
  const {userSelections, setUserSelections, finalPayload, handleFinalPayload} = useStateContext("");
  
  useEffect(() => {
    if (finalPayload?.view_type === "Integrated View") {
      if (finalPayload.complex_query) {
        setQuery(finalPayload.complex_query);
      } else if (userSelections?.has("complex_query")) {
        setQuery(userSelections.get("complex_query"));
      } else {
        setQuery("");
      }
    } else if (userSelections?.has("complex_query")) {
      setQuery(userSelections.get("complex_query"));
    } else {
      setQuery("");
    }
  }, [finalPayload, userSelections]);
  
  const handelExecute = () => {
    const trimmedQuery = query.trim();
    if (trimmedQuery !== "") {
      if (finalPayload?.view_type === 'Integrated View') {
        const updatedPayload = { ...finalPayload, "complex_query": query };
        handleFinalPayload(updatedPayload);
      } else {
        setUserSelections((prev) => {
          const updatedSelections = new Map(prev);
          updatedSelections.set("complex_query", query);
          return updatedSelections;
        });
      }
    } else {
      if (finalPayload?.complex_query !== undefined) {
        const updatedPayload = { ...finalPayload };
        delete updatedPayload.complex_query;
        handleFinalPayload(updatedPayload);
      }
      setUserSelections((prev) => {
        const updatedSelections = new Map(prev);
        updatedSelections.delete("complex_query");
        return updatedSelections;
      });
    }
    setShowQueryEditor(false);
    onQuerySave?.(trimmedQuery);
  };

  const handleClear = () => {
    setQuery("");
    if (finalPayload?.complex_query !== undefined) {
      const updatedPayload = { ...finalPayload };
      delete updatedPayload.complex_query;
      handleFinalPayload(updatedPayload);
    }
    setUserSelections((prev) => {
      const updatedSelections = new Map(prev);
      updatedSelections.delete("complex_query");
      return updatedSelections;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black bg-opacity-0 p-0 h-screen">
      <div className="w-96 bg-white shadow-lg overflow-hidden h-full">
        <div className="h-full flex flex-col">

          <div className="h-[10%] border-solid border-b-2">
        <div className="flex items-center justify-between px-3 h-full">
          <div className="flex items-center">
            <FileCode className="w-7 h-7 text-[#8E77BB] pr-3 mt-1" />
            <span className="text-lg font-medium">Query Editor</span>
          </div>
          <div className="mt-1">
          <button className="text-gray-500 hover:text-gray-700">
            <X className="h-4" onClick={(e) => setShowQueryEditor(false)} />
          </button>
          </div>
        </div>
      </div>

          <div className="h-[80%] flex-1 overflow-y-auto px-4 mt-2">
            {/* AceEditor Component */}
            <AceEditor
              aria-label="editor"
              mode="mysql"
              theme="tomorrow"
              name="editor"
              fontSize={15}
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
              }}
              showLineNumbers
            />
          </div>

          <div className="h-[10%] flex border-t-2 justify-center items-center mt-2">
          <div className="flex w-full justify-around">
            <button
              className="w-[43%] px-3 py-1 border rounded-lg hover:bg-gray-50"
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              className="w-[43%] py-1 px-3 bg-[#8E77BB] text-white rounded-lg hover:bg-[rgb(142,119,187,0.8)]"
              onClick={handelExecute}
            >
              Save
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplexQueryEditor;
