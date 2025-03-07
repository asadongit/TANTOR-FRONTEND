/*eslint-disable*/
import { useEffect, useState } from "react";
import { useStateContext } from "../context/contextProvider";
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

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const helperPreviewData = (cleanApiPayload) => {

    console.log("CALLING API VIA PAYLOAD =====>", cleanApiPayload)
    fetch(`${import.meta.env.VITE_FAST_API_V2}/save-view?execute_query=true`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${encodedToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanApiPayload),
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

    // } else {
    //   toast.error("Select inputs first");
    // }
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

    const hasOperation = apiPayloadForApi?.operation !== undefined;
    const source = hasOperation
      ? columnSettings["Union"]
      : Object.fromEntries(Object.entries(columnSettings).filter(([key]) => key !== "Union"));


    Object.entries(source).forEach(([tableOrColumn, columnsOrProperties]) => {
      const columns = hasOperation ? { [tableOrColumn]: columnsOrProperties } : columnsOrProperties;

      Object.entries(columns).forEach(([column, properties]) => {
        if (properties.output === "Yes" && !properties.aggregate) {
          selectColumns.add(column);
        }
        if (properties.groupBy === "Yes") {
          groupByColumns.add(column);
        }
        if (properties.aggregate) {
          aggregateColumns.add(column);
        }
      });
    });

    selectColumns = [...selectColumns];
    groupByColumns = [...groupByColumns];
    aggregateColumns = [...aggregateColumns];


    if (groupByColumns.length > 0 && JSON.stringify(selectColumns) !== JSON.stringify(groupByColumns)) {
      toast.error("Select Field must be aggregate or in Group by");
      return;
    }

    if (groupByColumns.length === 0 && aggregateColumns.length > 0 && selectColumns.length > 0) {
      toast.error("Select Field must be aggregate or in Group by");
      return;
    }

    if (Object.keys(apiPayloadForApi).length > 0) {
      setPreview(true);
      setLoading(true);
      setRowData([]);

      const groupByArray = Object.entries(source).flatMap(([view, columns]) =>
        Object.entries(columns)
          .filter(([col, settings]) => settings.groupBy === "Yes")
          .map(([col]) => (hasOperation ? `${col}` : `${view}.${col}`))
      );

      let orderBy = [];
      Object.keys(source).forEach(table => {
        Object.entries(source[table]).forEach(([key, column]) => {
          if (column.order) {
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

        const hasOperation = finalPayload?.operation !== undefined;
        const source = hasOperation
          ? columnSettings["Union"]
          : Object.fromEntries(Object.entries(columnSettings).filter(([key]) => key !== "Union"));


        Object.entries(source).forEach(([tableOrColumn, columnsOrProperties]) => {
          const columns = hasOperation ? { [tableOrColumn]: columnsOrProperties } : columnsOrProperties;

          Object.entries(columns).forEach(([column, properties]) => {
            if (properties.output === "Yes" && !properties.aggregate) {
              selectColumns.add(column);
            }
            if (properties.groupBy === "Yes") {
              groupByColumns.add(column);
            }
            if (properties.aggregate) {
              aggregateColumns.add(column);
            }
          });
        });

        selectColumns = [...selectColumns];
        groupByColumns = [...groupByColumns];
        aggregateColumns = [...aggregateColumns];


        if (groupByColumns.length > 0 && JSON.stringify(selectColumns) !== JSON.stringify(groupByColumns)) {
          toast.error("Select Field must be aggregate or in Group by");
          return;
        }

        if (groupByColumns.length === 0 && aggregateColumns.length > 0 && selectColumns.length > 0) {
          toast.error("Select Field must be aggregate or in Group by");
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

          let orderBy = [];
          Object.keys(source).forEach(table => {
            Object.entries(source[table]).forEach(([key, column]) => {
              if (column.order) {
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
          console.log("second time calling the",finalOrderBy)

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




  const [rowData, setRowData] = useState([]);

  const [colDefs, setColumnDefs] = useState([])

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

    const response = await fetch(
      `${import.meta.env.VITE_FAST_API_V2}/save-view`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_FEDERATION_ACCESS_TOKEN
            }`,
        },
        body: JSON.stringify(finalPayload),
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
          <div className="text-black mt-2 mb-2 ml-6 font-semibold">Output Preview</div>
          <div className="bg-white rounded-lg shadow overflow-hidden h-[32%] mx-6 mb-5">
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