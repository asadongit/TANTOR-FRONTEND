import { useState } from "react";
import { useStateContext } from "../../../context/contextProvider";

export function BusinessFooter() {
    
      const { handleConsolidationPayload,joinPayload,handleJoinPayload  } = useStateContext("");
      const [preview, setPreview] = useState(false);

      const handleClick =()=>{
        setPreview(true)
        console.log("join payload is ===>",joinPayload)
    
    
        const tempArray1 = new Set();
        const tempArray2 = new Set();
    
        joinPayload.joins.forEach((join) => {
          const { view1, view2 } = join;
    
          if (!tempArray2.has(view1)) {
            tempArray1.add(view1);
          }
          if (!tempArray1.has(view2)) {
            tempArray2.add(view2);
          }
    
          tempArray1.delete(view2);
        });
    
        console.log("temp array1",Array.from(tempArray1));
        console.log("tep array 2",Array.from(tempArray2));
    
        handleJoinPayload({
          ...joinPayload,
          base_join: Array.from(tempArray1)[0]
        });


        // ------?
    
      }
    
     const [rowData, setRowData] = useState([
       {
         ID: "12345",
         Connections: "Sample Connection 1",
         Descriptions: "This is a demo connection description.",
         Schema: 5,
         Tables: 10,
         Views: 5,
         Created: "2025-01-20",
       },
       {
         ID: "67890",
         Connections: "Sample Connection 2",
         Descriptions: "Another demo connection description.",
         Schema: 8,
         Tables: 15,
         Views: 9,
         Created: "2025-01-21",
       },
       {
         ID: "11223",
         Connections: "Sample Connection 3",
         Descriptions: "Yet another demo connection description.",
         Schema: 3,
         Tables: 7,
         Views: 17,
         Created: "2025-01-22",
       },
       {
         ID: "12345",
         Connections: "Sample Connection 1",
         Descriptions: "This is a demo connection description.",
         Schema: 5,
         Tables: 10,
         Views: 5,
         Created: "2025-01-20",
       },
       {
         ID: "67890",
         Connections: "Sample Connection 2",
         Descriptions: "Another demo connection description.",
         Schema: 8,
         Tables: 15,
         Views: 9,
         Created: "2025-01-21",
       },
       {
         ID: "11223",
         Connections: "Sample Connection 3",
         Descriptions: "Yet another demo connection description.",
         Schema: 3,
         Tables: 7,
         Views: 17,
         Created: "2025-01-22",
       },
       {
         ID: "12345",
         Connections: "Sample Connection 1",
         Descriptions: "This is a demo connection description.",
         Schema: 5,
         Tables: 10,
         Views: 5,
         Created: "2025-01-20",
       },
       {
         ID: "67890",
         Connections: "Sample Connection 2",
         Descriptions: "Another demo connection description.",
         Schema: 8,
         Tables: 15,
         Views: 9,
         Created: "2025-01-21",
       },
       {
         ID: "11223",
         Connections: "Sample Connection 3",
         Descriptions: "Yet another demo connection description.",
         Schema: 3,
         Tables: 7,
         Views: 17,
         Created: "2025-01-22",
       }
     ]);
    return (
<>
{preview && (
    <>
     <div className="text-black mt-2 mb-2 ml-6 font-semibold">Output Preview</div>
  <div className="bg-white rounded-lg shadow overflow-hidden h-[32%] mx-6 mb-5">
    <div className="overflow-auto h-full"> {/* Enables scrolling without fixed height */}
      <table className="w-full">
        <thead className="sticky top-0 bg-[#29304a] text-white"> {/* Keeps header fixed */}
          <tr>
            <th className="text-left p-3">ID</th>
            <th className="text-left p-3">Connections</th>
            <th className="text-left p-3">Descriptions</th>
            <th className="text-left p-3">Schema</th>
            <th className="text-left p-3">Tables</th>
            <th className="text-left p-3">Views</th>
            <th className="text-left p-3">Created</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {rowData.map((user, index) => (
            <tr key={index} className="border-b bg-white" >
              <td className="p-3 text-left text-black bg-white">{user.ID}</td>
              <td className="p-3 text-left text-black bg-white">{user.Connections}</td>
              <td className="p-3 text-left text-black bg-white">{user.Descriptions}</td>
              <td className="p-3 text-left text-black bg-white">{user.Schema}</td>
              <td className="p-3 text-left text-black bg-white">{user.Tables}</td>
              <td className="p-3 text-left text-black bg-white">{user.Views}</td>
              <td className="p-3 text-left text-black bg-white">{user.Created}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
  </>
)}


        <div className='bg-white w-full py-2.5 flex justify-end border-solid border-t-2'>
      <div className="mr-3">
                <button
                  type="button"
                  onClick={() => setPreview(false)}
                  className="text-black bg-white hover:bg-gray-50 focus:ring-1  rounded-lg text-sm px-8 py-1 mr-2 focus:outline-none border-solid border-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClick}
                  className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-8 py-1 mr-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                >
                  {preview ? "Create view" : "Next"}
                </button>
              </div>    
      </div>
      </>
    )
}