/*eslint-disable*/
import { useEffect, useState } from "react";
import { useStateContext } from "../../../context/contextProvider";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { ToastContainer, toast } from "react-toastify";

export function BusinessFooter() {

  const { finalPayload } = useStateContext("");
  const [preview, setPreview] = useState(false);
  const encodedToken = import.meta.env.VITE_ACCESS_TOKEN;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { columnSettings } = useStateContext("")


  const getSelectFields = (columnSettings, hasOperation) => {
    const selectedViews = hasOperation
      ? { Union: columnSettings.Union }
      : Object.fromEntries(Object.entries(columnSettings).filter(([key]) => key !== "Union"));


    console.log("selected views column seetings ====>", selectedViews)

    return Object.entries(selectedViews || {})
      .flatMap(([view, columns]) =>
        Object.entries(columns)
          .filter(([colName, colProps]) => colProps.output === "Yes")
          .map(([colName, colProps]) => ({
            field: colProps.aggregate
              ? `${colProps.aggregate}(${hasOperation ? colName : `${view}.${colName}`})`
              : (hasOperation ? colName : `${view}.${colName}`),
            alias: colProps.alias || ""
          }))
      );
  };


  const handleClick = async () => {

    console.log("column settings are ===>", columnSettings)

    let selectColumns = new Set();
    let groupByColumns = new Set();
    let aggregateColumns = new Set();

    const hasOperation = finalPayload?.operation !== undefined;
    const source = hasOperation
      ? columnSettings["Union"]
      : Object.fromEntries(Object.entries(columnSettings).filter(([key]) => key !== "Union"));

    Object.entries(source).forEach(([tableOrColumn, columnsOrProperties]) => {
      const columns = hasOperation ? { [tableOrColumn]: columnsOrProperties } : columnsOrProperties;

      Object.entries(columns).forEach(([column, properties]) => {
        if (properties.output === "Yes") {
          if (!properties.aggregate) selectColumns.add(column);
        }
        if (properties.groupBy === "Yes") groupByColumns.add(column);
        if (properties.aggregate) aggregateColumns.add(column);
      });
    });

    selectColumns = [...selectColumns];
    groupByColumns = [...groupByColumns];
    aggregateColumns = [...aggregateColumns];

    console.log("group by cols are ===>", groupByColumns);
    console.log("select cols are ===>", selectColumns);
    console.log("aggregate cols are ===>", aggregateColumns);

    // unionnnnnnnnnnnn

    if (groupByColumns.length > 0 && JSON.stringify(selectColumns) !== JSON.stringify(groupByColumns)) {
      toast.error("Select Field must be aggregate or in Group by");
      return;
    }

    if (groupByColumns.length === 0 && aggregateColumns.length > 0 && selectColumns.length > 0) {
      toast.error("Select Field must be aggregate or in Group by");
      return;
    }

    if (finalPayload && Object.keys(finalPayload).length > 0) {
      setPreview(true);
      setLoading(true);
      setRowData([]);

      console.log("ggggggggggggggggggg final payload is =====>", finalPayload);

      const hasOperation = finalPayload?.operation !== undefined;
      const source = hasOperation ? { Union: columnSettings["Union"] } : columnSettings;

      const groupByArray = Object.entries(source).flatMap(([view, columns]) =>
        Object.entries(columns)
          .filter(([col, settings]) => settings.groupBy === "Yes")
          .map(([col]) => hasOperation ? `${col}` : `${view}.${col}`)
      );

      const selectFields = getSelectFields(columnSettings, hasOperation)


      console.log("select fields are in every case is   &&&&&&&&&&&&&&&=====>", selectFields)

      const updatedPayload = { ...finalPayload, group_by: groupByArray, select_fields: selectFields };

      console.log("Updated final payload with group_by and select fields is ===>", updatedPayload);

      fetch(`${import.meta.env.VITE_FAST_API_V2}/save-view`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${encodedToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPayload),
      })
        .then((response) =>
          response.text().then((data) => ({ status: response.status, data }))
        )
        .then(({ status, data }) => {
          if (status === 200) {
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
              setError("Table is empty");
              setRowData([]);
            } else {
              console.log("Parsed Data Array: ", dataArray);
              setLoading(false);
              const rows = data.trim().split("\n").map((row) => JSON.parse(row));
              const columns = Object.keys(rows[0]);
              console.log("rows are ===>", rows);
              console.log("columns are ===>", columns);
              setColumnDefs(columns);
              setRowData(rows);
              setError(null);
            }
          } else {
            if (data) {
              setLoading(false);
              const res = JSON.parse(data);
              toast.error("Select correct inputs");
              setError(res.detail);
              setPreview(false);
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          setError("Something went wrong!");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      toast.error("Select inputs first");
    }
  };




  const [rowData, setRowData] = useState([]);

  const [colDefs, setColumnDefs] = useState([])
  return (
    <>
      {preview && (
        <>
          <div className="text-black mt-2 mb-2 ml-6 font-semibold">Output Preview</div>
          <div className="bg-white rounded-lg shadow overflow-hidden h-[32%] mx-6 mb-5">
            {loading && (
              <div className="flex justify-center w-full h-full items-center">
                <CircularProgress />
              </div>
            )}

            {/* {(!loading && error != null) && (
  <div className="flex h-full w-full justify-center">
 <div className="flex w-[20%] mx-auto text-gray-500 text-center self-center bg-gray-100 p-2 text-[17px] shadow-md">
  <Alert severity="error">
      <AlertTitle>Error</AlertTitle>
      {error}
  </Alert>
</div>
</div>

)} */}
            {(!loading && rowData.length > 0 && error == null) && (
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
            )}


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
      <ToastContainer />
    </>
  )
}