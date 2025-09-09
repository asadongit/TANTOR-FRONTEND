/*eslint-disable*/
import { useEffect, useState } from "react";
import { useStateContext } from "../context/contextViewProvider";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import SaveViewModal from "../components/SaveViewModal";
import { useLocation, useNavigate } from "react-router-dom";
import FilterComponent from "../components/FilterComponent";
import { useAuth } from "../../../../context/AuthContext";
import { Icon } from "@iconify/react"; // Added for toast icons
import { X } from "lucide-react"; // Added for close button

export function BusinessFooter() {
  const navigate = useNavigate();
  const { finalPayload, handleFinalPayload, connectionPayload, viewPayload, columnSettings } = useStateContext("");
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token, project, decodedToken, setSelectedProject, hostnameV1, hostnameV2 } = useAuth();
  const [toast, setToast] = useState({ show: false, message: '', type: '' }); // Added toast state

  const modalState = useLocation().state || {
    queryType: "Regular",
    viewType: "Business",
  };

  const getSelectFields = (columnSettings, hasOperation) => {

    const selectedViews = hasOperation
      ? { Union: columnSettings.Union }
      : Object.fromEntries(Object.entries(columnSettings).filter(([key]) => key !== "Union"));


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
  const [colDefs, setColumnDefs] = useState([]);

  const helperPreviewData = async (cleanApiPayload) => {

    try {
      const response = await fetch(
        `${hostnameV2}/save-view?execute_query=true`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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
          setLoading(false);
          const columns = Object.keys(data[0]);
          setColumnDefs(columns);
          setRowData(data);
          setError(null);
          setToast({
            show: true,
            message: "View Query Executed!",
            type: "success",
          });
          setTimeout(() => {
            setToast({ show: false, message: "", type: "" });
          }, 3000);
        }
        return data;
      } else {
        try {
          const errorData = JSON.parse(responseText);
          let errorMessage = errorData.detail || "Unknown error occurred";
          setError(errorMessage);
          setToast({
            show: true,
            message: errorMessage,
            type: "error",
          });
          setTimeout(() => {
            setToast({ show: false, message: "", type: "" });
          }, 3000);
          setColumnDefs([]);
          setRowData([]);
          setPreview(false);
        } catch (parseError) {
          console.error("Error parsing error response:", parseError, responseText);
          setError("An unexpected error occurred");
          setToast({
            show: true,
            message: "An unexpected error occurred",
            type: "error",
          });
          setTimeout(() => {
            setToast({ show: false, message: "", type: "" });
          }, 3000);
        }
        return null;
      }
    } catch (error) {
      console.error("Error executing query:", error);
      setError("Something went wrong!");
      setToast({
        show: true,
        message: "Failed to execute query",
        type: "error",
      });
      setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 3000);
      setColumnDefs([]);
      setRowData([]);
      setPreview(false);
      return null;
    } finally {
      setLoading(false);
    }
  };


  const fetchPreviewData = async (payload = null, filterData = null) => {
    setIsFilterModalOpen(false);


    let apiPayload = payload || finalPayload;

    if (filterData) {
      apiPayload = { ...apiPayload, filter_data: filterData };
    }

    const isSkipCondition = !payload && !filterData;

    apiPayload = { ...apiPayload, skip_filter: isSkipCondition };

    let apiPayloadForApi = { ...apiPayload };
    if (isSkipCondition) {
      delete apiPayloadForApi.filter_data;
    }

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
      setToast({
        show: true,
        message: "Please select columns first before proceeding.",
        type: "error",
      });
      setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 3000);
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

    if (modalState.queryType === "Regular") {
      const invalidSelectColumns = selectColumns.filter(col => !groupByColumns.includes(col));

      if (groupByColumns.length > 0 && selectColumns.length > 0 && invalidSelectColumns.length > 0) {
        setToast({
          show: true,
          message: `${invalidSelectColumns.join(', ')} must be an aggregate expression or appear in GROUP BY`,
          type: "error",
        });
        setTimeout(() => {
          setToast({ show: false, message: "", type: "" });
        }, 3000);
        return;
      }

      const nonAggregatedSelectColumns = selectColumns;

      if (groupByColumns.length === 0 && aggregateColumns.length > 0 && selectColumns.length > 0 && nonAggregatedSelectColumns.length > 0) {
        setToast({
          show: true,
          message: `${nonAggregatedSelectColumns.join(', ')} must be an aggregate expression or appear in GROUP BY`,
          type: "error",
        });
        setTimeout(() => {
          setToast({ show: false, message: "", type: "" });
        }, 3000);
        return;
      }

      const invalidSortColumns = sortColumns.filter(col => !groupByColumns.includes(col) && !aggregateColumns.includes(col));

      if ((groupByColumns.length > 0 || aggregateColumns.length > 0) && invalidSortColumns.length > 0) {
        setToast({
          show: true,
          message: `${invalidSortColumns.join(', ')} must be an aggregate expression or appear in GROUP BY`,
          type: "error",
        });
        setTimeout(() => {
          setToast({ show: false, message: "", type: "" });
        }, 3000);
        return;
      }
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

      const selectFields = getSelectFields(columnSettings, hasOperation);

      const updatedPayload = {
        ...apiPayloadForApi,
        group_by: groupByArray,
        order_by: finalOrderBy,
        select_fields: selectFields,
        metadata,
      };


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
      if (modalState.queryType == "Regular") setIsFilterModalOpen(true);
      else {
        const connections = connectionPayload.map(item => item.selectedConnection);
        const views = viewPayload.map(item => item.view);
        const metadata = { connections, views };

        let selectColumns = new Set();
        let groupByColumns = new Set();
        let aggregateColumns = new Set();
        let sortColumns = new Set();

        const hasOperation = finalPayload?.operation !== undefined;
        const source = hasOperation
          ? Object.fromEntries(Object.entries(columnSettings).filter(([key]) => key === "Union"))
          : Object.fromEntries(Object.entries(columnSettings).filter(([key]) => key !== "Union"));

        if (!source || Object.keys(source).length === 0) {
          setToast({
            show: true,
            message: "Please select columns first before proceeding.",
            type: "error",
          });
          setTimeout(() => {
            setToast({ show: false, message: "", type: "" });
          }, 3000);
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

          const selectFields = getSelectFields(columnSettings, hasOperation);

          const updatedPayload = {
            ...finalPayload,
            group_by: groupByArray,
            order_by: finalOrderBy,
            select_fields: selectFields,
            metadata,
          };

          handleFinalPayload(updatedPayload);
          helperPreviewData(updatedPayload);
        }
      }
    } else {
      setToast({
        show: true,
        message: "Select inputs first",
        type: "error",
      });
      setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 3000);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen((prev) => !prev);
  };

  const handleSaveView = async (params) => {
    const { newViewName } = params;

    finalPayload["view_name"] = newViewName.toLowerCase();

    if (finalPayload.skip_filter === true) {
      delete finalPayload.filter_data;
      delete finalPayload.skip_filter;
    } else {
      delete finalPayload.skip_filter;
    }


    const viewExistsResponse = await fetch(
      `${hostnameV2}/view-exists/${newViewName}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (viewExistsResponse.status !== 200) {
      setToast({
        show: true,
        message: "Error checking if view exists",
        type: "error",
      });
      setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 3000);
      return null;
    }
    const viewExists = await viewExistsResponse.json();
    if (viewExists["result"]) {
      setToast({
        show: true,
        message: "View already exists",
        type: "error",
      });
      setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 3000);
      return null;
    }

    const newPayload = {
      ...finalPayload,
      project: (project === "default" || project === "none") ? "default" : project,
      created_by: decodedToken?.preferred_username,
    };

    const response = await fetch(
      `${hostnameV2}/save-view`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPayload),
      }
    );

    const data = await response.json();

    if (response.status == 200) {
      setToast({
        show: true,
        message: "View Saved Successfully.",
        type: "success",
      });
      setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
        navigate("/federation");
      }, 3000);
    } else {
      setToast({
        show: true,
        message: "Error while saving view..",
        type: "error",
      });
      setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 3000);
    }
  };

  return (
    <>
      {preview && (
        <>
          <div className="text-black mt-2 mb-2 ml-2 font-semibold">Output Preview</div>
          <div className="bg-white shadow overflow-hidden h-[32%] z-50">
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
            className="text-black bg-white hover:bg-gray-50 focus:ring-1 rounded-lg text-sm px-8 py-1 mr-2 focus:outline-none border-solid border-2"
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
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn ${
            toast.type === "success"
              ? "bg-green-100 text-green-800 border-l-4 border-green-500"
              : "bg-red-100 text-red-800 border-l-4 border-red-500"
          }`}
        >
          <Icon
            icon={toast.type === "success" ? "mdi:check-circle" : "mdi:alert-circle"}
            className="h-5 w-5"
          />
          <p>{toast.message}</p>
          <button
            onClick={() => setToast({ show: false, message: "", type: "" })}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}