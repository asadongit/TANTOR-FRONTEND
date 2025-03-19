/*eslint-disable*/
import { useEffect, useState } from "react";
import { useStateContext } from "../context/contextViewProvider";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { ToastContainer, toast } from "react-toastify";
import SaveViewModal from "../components/SaveViewModal";
import { useLocation, useNavigate } from "react-router-dom";
import FilterComponent from "../components/FilterComponent";

export function BusinessFooter() {

  const navigate = useNavigate();
  const { finalPayload, handleFinalPayload, complexCheck, connectionPayload, viewPayload, columnSettings } = useStateContext("");
  const [preview, setPreview] = useState(false);
  const encodedToken = import.meta.env.VITE_FEDERATION_ACCESS_TOKEN;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  // const getSelectFields = (columnSettings, hasOperation) => {
  //   console.log("hase operation isss =====>",hasOperation)
  //   const selectedViews = hasOperation
  //     ? { Union: columnSettings.Union }
  //     : Object.fromEntries(Object.entries(columnSettings).filter(([key]) => key !== "Union"));


  //   console.log("selected views column seetings ====>", selectedViews)

  //   return Object.entries(selectedViews || {})
  //     .flatMap(([view, columns]) =>
  //       Object.entries(columns)
  //         .filter(([colName, colProps]) => colProps.output === "Yes")
  //         .map(([colName, colProps]) => ({
  //           field: colProps.aggregate
  //             ? `${colProps.aggregate}(${hasOperation ? colName : `${view}.${colName}`})`
  //             : (hasOperation ? colName : `${view}.${colName}`),
  //           alias: colProps.alias || ""
  //         }))
  //     );
  // };

  const getSelectFields = (columnSettings, hasOperation) => {
    console.log("hasOperation is =====>", hasOperation);

    const selectedViews = hasOperation
      ? { Union: columnSettings.Union }
      : Object.fromEntries(Object.entries(columnSettings).filter(([key]) => key !== "Union"));

    console.log("selected views column settings ====>", selectedViews);

    return Object.entries(selectedViews || {}).flatMap(([view, columns]) =>
      Object.entries(columns).flatMap(([colName, colProps]) => {
        let fields = [];

        if (colProps.aggregate) {
          fields.push({
            field: `${colProps.aggregate}(${hasOperation ? colName : `${view}.${colName}`})`,
            alias: colProps.alias || ""
          });
        }

        if (colProps.output === "Yes") {
          fields.push({
            field: hasOperation ? colName : `${view}.${colName}`,
            alias: colProps.aggregate ? "" : colProps.alias || ""
          });
        }

        return fields;
      })
    );
  };


  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [rowData, setRowData] = useState([]);

  const [colDefs, setColumnDefs] = useState([])

  const helperPreviewData = async (cleanApiPayload) => {

    console.log("CALLING API VIA PAYLOAD =====>", cleanApiPayload)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_FAST_API_V2}/save-view?execute_query=true`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_FEDERATION_ACCESS_TOKEN}`,
          },
          body: JSON.stringify(cleanApiPayload),
        }
      );

      const responseText = await response.text();

      if (response.ok) {
        const data = responseText
          .trim()
          .split("\n")
          .reduce((validData, jsonString) => {
            try {
              validData.push(JSON.parse(jsonString));
            } catch (error) {
              console.error("Error parsing JSON object:", error, jsonString);
            }
            return validData;
          }, []);

        if (data.length === 0) {
          setError("Table is empty");
          setRowData([]);
        } else {
          console.log("Parsed Data Array:", data);
          setLoading(false);
          const columns = Object.keys(data[0]);
          setColumnDefs(columns);
          setRowData(data);
          setError(null);
          toast.success("View Query Executed!");
        }
        return data;
      } else {
        try {
          const errorData = JSON.parse(responseText);
          let errorMessage = errorData.detail || "Unknown error occurred";
          setError(errorMessage);
          toast.error(errorMessage);
          setColumnDefs([]);
          setRowData([]);
          setPreview(false);
        } catch (parseError) {
          console.error("Error parsing error response:", parseError, responseText);
          setError("An unexpected error occurred");
          toast.error("An unexpected error occurred");
        }
        return null;
      }
    } catch (error) {
      console.error("Error executing query:", error);
      setError("Something went wrong!");
      toast.error("Failed to execute query");
      setColumnDefs([]);
      setRowData([]);
      setPreview(false);
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log("PAYLOAD IS $$$$$$$$$$$$$", finalPayload)
  }, [finalPayload])

  const fetchPreviewData = async (payload = null, filterData = null) => {
    setIsFilterModalOpen(false);

    console.log("filterdata is ====>", filterData);

    let apiPayload = payload || finalPayload;

    if (filterData) {
      apiPayload = { ...apiPayload, filter_data: filterData };
    }

    const isSkipCondition = !payload && !filterData;
    console.log("skip condition is ====>", isSkipCondition);


    apiPayload = { ...apiPayload, skip_filter: isSkipCondition };


    let apiPayloadForApi = { ...apiPayload };
    if (isSkipCondition) {
      delete apiPayloadForApi.filter_data;
    }

    console.log("FILTER API PAYLOAD ==> ", apiPayloadForApi);


    const connections = connectionPayload.map(item => item.selectedConnection);
    const views = viewPayload.map(item => item.view);
    const metadata = { connections, views };

    let selectColumns = new Set();
    let groupByColumns = new Set();
    let aggregateColumns = new Set();
    let sortColumns = new Set();

    const hasOperation = apiPayloadForApi?.operation !== undefined;
    const source = hasOperation
      ? Object.fromEntries(Object.entries(columnSettings).filter(([key]) => key === "Union"))
      : Object.fromEntries(Object.entries(columnSettings).filter(([key]) => key !== "Union"));

    if (!source || Object.keys(source).length === 0) {
      toast.error("Please select columns first before proceeding.");
      return;
    }

    Object.entries(source).forEach(([tableOrColumn, columnsOrProperties]) => {
      const columns = hasOperation ? columnsOrProperties : columnsOrProperties;

      Object.entries(columns).forEach(([column, properties]) => {
        if (properties.output === "Yes") {
          selectColumns.add(column);
        }
        if (properties.groupBy === "Yes") {
          groupByColumns.add(column);
        }
        if (properties.aggregate) {
          aggregateColumns.add(column);
        }
        if (parseInt(properties.order, 10) > 0 && properties.sort.trim() !== "") {
          sortColumns.add(column);
      }
      
      });
    });

    selectColumns = [...selectColumns];
    groupByColumns = [...groupByColumns];
    aggregateColumns = [...aggregateColumns];
    sortColumns = [...sortColumns];

    console.log("Select Columns:", selectColumns);
    console.log("Group By Columns:", groupByColumns);
    console.log("Aggregate Columns:", aggregateColumns);
    console.log("Sort Columns:", sortColumns);


    const invalidSelectColumns = selectColumns.filter(col => !groupByColumns.includes(col));

    if (groupByColumns.length > 0 && selectColumns.length > 0 && invalidSelectColumns.length > 0) {
      toast.error(`${invalidSelectColumns.join(', ')} must be an aggregate expression or appear in GROUP BY`);
      return;
    }

    const nonAggregatedSelectColumns = selectColumns;

    if (groupByColumns.length === 0 && aggregateColumns.length > 0 && selectColumns.length > 0 && nonAggregatedSelectColumns.length > 0) {
      toast.error(`${nonAggregatedSelectColumns.join(', ')} must be an aggregate expression or appear in GROUP BY`);
      return;
    }


    const invalidSortColumns = sortColumns.filter(col => !groupByColumns.includes(col) && !aggregateColumns.includes(col));

    if ((groupByColumns.length > 0 || aggregateColumns.length > 0) && invalidSortColumns.length > 0) {
      toast.error(`${invalidSortColumns.join(', ')} must be an aggregate expression or appear in GROUP BY`);
      return;
    }

    if (Object.keys(apiPayloadForApi).length > 0) {
      setPreview(true);
      setLoading(true);
      setRowData([]);

      console.log("source is newwwwwwww =====>", source)

      const groupByArray = Object.entries(source).flatMap(([view, columns]) =>
        Object.entries(columns)
          .filter(([col, settings]) => settings.groupBy === "Yes")
          .map(([col]) => (hasOperation ? `${col}` : `${view}.${col}`))
      );

      console.log("group by array new is =====>", groupByArray)

      let orderBy = [];
      Object.keys(source).forEach(table => {
        Object.entries(source[table]).forEach(([key, column]) => {
          if (column.order && parseInt(column.order, 10) > 0 && column.sort.trim() !== "") {
            orderBy.push({
              table,
              key,
              order: parseInt(column.order, 10),
              sort: column.sort.toLowerCase(),
            });
          }
        });
      });

      orderBy.sort((a, b) => a.order - b.order);

      const finalOrderBy = orderBy.map(col => {
        const sortOrder = col.sort.toLowerCase() === "ascending" ? "ASC" : "DESC";
        return hasOperation ? `${col.key} ${sortOrder}` : `${col.table}.${col.key} ${sortOrder}`;
      });

      console.log("order by is ====>", { order_by: finalOrderBy });


      const selectFields = getSelectFields(columnSettings, hasOperation);

      console.log("selected fields areeee =========>", selectFields)

      const updatedPayload = {
        ...apiPayloadForApi,
        group_by: groupByArray,
        order_by: finalOrderBy,
        select_fields: selectFields,
        metadata,
      };

      console.log("Updated final payload for API is ===>", updatedPayload);

      handleFinalPayload({
        ...apiPayload,
        group_by: groupByArray,
        order_by: finalOrderBy,
        select_fields: selectFields,
        metadata,
      });

      helperPreviewData(updatedPayload);
    }
  };



  const handleClick = async () => {

    if (finalPayload && Object.keys(finalPayload).length > 0) {
      if (!complexCheck) setIsFilterModalOpen(true);
      else {
        const connections = connectionPayload.map(item => item.selectedConnection);
        const views = viewPayload.map(item => item.view);
        const metadata = { connections, views };

        let selectColumns = new Set();
        let groupByColumns = new Set();
        let aggregateColumns = new Set();
        let sortColumns = new Set();

        const hasOperation = apiPayloadForApi?.operation !== undefined;
        const source = hasOperation
          ? Object.fromEntries(Object.entries(columnSettings).filter(([key]) => key === "Union"))
          : Object.fromEntries(Object.entries(columnSettings).filter(([key]) => key !== "Union"));

        if (!source || Object.keys(source).length === 0) {
          toast.error("Please select columns first before proceeding.");
          return;
        }

        Object.entries(source).forEach(([tableOrColumn, columnsOrProperties]) => {
          const columns = hasOperation ? columnsOrProperties : columnsOrProperties;

          Object.entries(columns).forEach(([column, properties]) => {
            if (properties.output === "Yes") {
              selectColumns.add(column);
            }
            if (properties.groupBy === "Yes") {
              groupByColumns.add(column);
            }
            if (properties.aggregate) {
              aggregateColumns.add(column);
            }
            if (parseInt(properties.order, 10) > 0 && properties.sort.trim() !== "") {
              sortColumns.add(column);
          }
          
          });
        });

        selectColumns = [...selectColumns];
        groupByColumns = [...groupByColumns];
        aggregateColumns = [...aggregateColumns];
        sortColumns = [...sortColumns];

        console.log("Select Columns:", selectColumns);
        console.log("Group By Columns:", groupByColumns);
        console.log("Aggregate Columns:", aggregateColumns);
        console.log("Sort Columns:", sortColumns);


        const invalidSelectColumns = selectColumns.filter(col => !groupByColumns.includes(col));

        if (groupByColumns.length > 0 && selectColumns.length > 0 && invalidSelectColumns.length > 0) {
          toast.error(`${invalidSelectColumns.join(', ')} must be an aggregate expression or appear in GROUP BY`);
          return;
        }

        const nonAggregatedSelectColumns = selectColumns;

        if (groupByColumns.length === 0 && aggregateColumns.length > 0 && selectColumns.length > 0 && nonAggregatedSelectColumns.length > 0) {
          toast.error(`${nonAggregatedSelectColumns.join(', ')} must be an aggregate expression or appear in GROUP BY`);
          return;
        }


        const invalidSortColumns = sortColumns.filter(col => !groupByColumns.includes(col) && !aggregateColumns.includes(col));

        if ((groupByColumns.length > 0 || aggregateColumns.length > 0) && invalidSortColumns.length > 0) {
          toast.error(`${invalidSortColumns.join(', ')} must be an aggregate expression or appear in GROUP BY`);
          return;
        }

        if (Object.keys(finalPayload).length > 0) {
          setPreview(true);
          setLoading(true);
          setRowData([]);

          const groupByArray = Object.entries(source).flatMap(([view, columns]) =>
            Object.entries(columns)
              .filter(([col, settings]) => settings.groupBy === "Yes")
              .map(([col]) => (hasOperation ? `${col}` : `${view}.${col}`))
          );

          console.log("group by array new is =====>", groupByArray)

          let orderBy = [];
          Object.keys(source).forEach(table => {
            Object.entries(source[table]).forEach(([key, column]) => {
              if (column.order && parseInt(column.order, 10) > 0 && column.sort.trim() !== "") {
                orderBy.push({
                  table,
                  key,
                  order: parseInt(column.order, 10),
                  sort: column.sort.toLowerCase(),
                });
              }
            });
          });

          orderBy.sort((a, b) => a.order - b.order);

          const finalOrderBy = orderBy.map(col => {
            const sortOrder = col.sort.toLowerCase() === "ascending" ? "ASC" : "DESC";
            return hasOperation ? `${col.key} ${sortOrder}` : `${col.table}.${col.key} ${sortOrder}`;
          });

          console.log("order by is ====>", { order_by: finalOrderBy });

          const selectFields = getSelectFields(columnSettings, hasOperation);

          const updatedPayload = {
            ...finalPayload,
            group_by: groupByArray,
            order_by: finalOrderBy,
            select_fields: selectFields,
            metadata,
          };

          console.log("Updated final payload for API is ===>", updatedPayload);

          handleFinalPayload(updatedPayload);
          helperPreviewData(updatedPayload)
        }
      }
    }
    else {
      toast.error("Select inputs first");
    }
  };


  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen((prev) => !prev);
  };

  const handleSaveView = async (params) => {

    console.log("view name entered is =======>", params)
    const { newViewName } = params;

    finalPayload["view_name"] = newViewName;

    if (finalPayload.skip_filter === true) {
      delete finalPayload.filter_data;
      delete finalPayload.skip_filter;
    } else {
      delete finalPayload.skip_filter;
    }

    console.log("final payload fainally is =======>", finalPayload)

    const viewExistsResponse = await fetch(
      `${import.meta.env.VITE_FAST_API_V2}/view-exists/${newViewName}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_FEDERATION_ACCESS_TOKEN
            }`,
        },
      }
    );

    if (viewExistsResponse.status !== 200) {
      toast.error("Error checking if view exists");
      return null;
    }
    const viewExists = await viewExistsResponse.json();
    console.log("viewExists ===> ", viewExists);
    if (viewExists["result"]) {
      toast.error("View already exists");
      return null;
    }

    
    const newPayload = {
      ...finalPayload,
      project: "default",
      created_by: "sabhyata"
    }

    const response = await fetch(
      `${import.meta.env.VITE_FAST_API_V2}/save-view`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_FEDERATION_ACCESS_TOKEN
            }`,
        },
        body: JSON.stringify(newPayload),
      }
    );

    const data = await response.json();

    if (response.status == 200) {
      console.log("Save View Result ==> ", data);
      toast.success("View Saved Successfully.", { autoClose: 2900 });
      setTimeout(() => navigate("/federation"), 3000);
    } else {
      toast.error("Error while saving view..");
    }

  }
  return (
    <>
      {preview && (
        <>
          <div className="text-black mt-2 mb-2 ml-2 font-semibold">Output Preview</div>
          <div className="bg-white shadow overflow-hidden h-[32%]">
            {loading && (
              <div className="flex justify-center w-full h-full items-center">
                <CircularProgress />
              </div>
            )}
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
            onClick={preview === true ? toggleModal : handleClick}
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-8 py-1 mr-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            {preview ? "Create view" : "Next"}
          </button>
        </div>
      </div>
      {isModalOpen && (
        <SaveViewModal
          toggleModal={toggleModal}
          handleSaveView={handleSaveView}
        />
      )}
      {isFilterModalOpen && (
        <FilterComponent
          setIsOpen={setIsFilterModalOpen}
          columns={finalPayload?.columnsDataType || []}
          onApply={fetchPreviewData}
        />
      )}
      <ToastContainer />
    </>
  )
}