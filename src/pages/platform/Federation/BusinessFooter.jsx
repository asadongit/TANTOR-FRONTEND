/*eslint-disable*/
import { useEffect, useState } from "react";
import { useStateContext } from "../../../context/contextProvider";

export function BusinessFooter() {
    
      const {joinPayload,handleJoinPayload,connectionPayload} = useStateContext("");
      const [preview, setPreview] = useState(false);
      const encodedToken = import.meta.env.VITE_ACCESS_TOKEN;

      const handleClick = async ()=>{
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
  
        const baseJoin = Array.from(tempArray1)[0];
        const connection = connectionPayload.find(conn => conn.id === baseJoin);

        const newPayload ={
          ...joinPayload,
          joins: joinPayload.joins.map(({ id, ...rest }) => rest),
          base_join: baseJoin,
          ...(connection && { base_join_def: connection.def }),
           command: "execute"
        }

        handleJoinPayload(newPayload);

        fetch(`${import.meta.env.VITE_FAST_API}/save-view`, {
              method: "POST",
              headers: {
                  'Authorization': `Bearer ${encodedToken}`,
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(newPayload),
          })
          .then((response) =>
            response.text().then((data) => ({ status: response.status, data }))
          )
          .then(({ status, data }) => {
            if (status === 200) {
                // Split data into an array of potential JSON objects
                const dataArray = data.split("\n")
                    .filter(item => item.trim() !== "")
                    .map(item => {
                        try {
                            return JSON.parse(item);
                        } catch (e) {
                            console.error("Error parsing JSON:", e, item);
                            return null;
                        }
                    })
                    .filter(item => item !== null);

                if (dataArray.length === 0) {
                    // If no data in the response, show "Table is empty"
                    // setError("Table is empty");
                    // setData([]); // Clear the table data
                } else {
                    console.log("Parsed Data Array: ", dataArray);
                    // setMapData(dataArray);
                    const rows = data.trim().split("\n").map((row) => JSON.parse(row));
                    const columns = Object.keys(rows[0]);
                    console.log("rows aare ===>",rows)
                    console.log("columns aree ====>",columns)
                    setColumnDefs(columns);
                    setRowData(rows);
                    // setHasMore(rows.length === 100);
                    // setError(null);
                }
            } else {
                if (data) {
                    const res = JSON.parse(data);
                    // setError(res.detail);
                }
            }
        })
        .catch((error) => {
            console.error("Error fetching data:", error);
            // setError("Something went wrong!");
        })
        .finally(() => {
            // setLoading(false);
        });

      }


      useEffect(()=>{        
        console.log("final join payload is ====>",joinPayload)
      },[joinPayload])


    
     const [rowData, setRowData] = useState([]);

     const [colDefs,setColumnDefs] = useState([])
    return (
<>
{preview && (
    <>
     <div className="text-black mt-2 mb-2 ml-6 font-semibold">Output Preview</div>
  <div className="bg-white rounded-lg shadow overflow-hidden h-[32%] mx-6 mb-5">
    <div className="overflow-auto h-full"> 
    <table className="w-full">
    <thead className="sticky top-0 bg-[#29304a] text-white">
      <tr>
        {colDefs.map((column, index) => (
          <th key={index} className="text-center p-3">
            {column.charAt(0).toUpperCase() + column.slice(1)}
          </th>
        ))}
      </tr>
    </thead>
        <tbody className="text-sm">

        {rowData.map((row, rowIndex) => (
    <tr key={rowIndex} className="border-b bg-white">
      {Object.keys(row).map((key, index) => (
        <td key={index} className="p-3 text-center text-black bg-white">
          {row[key]}
        </td>
      ))}
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