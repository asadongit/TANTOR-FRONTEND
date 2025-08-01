import React, { useState, useEffect } from "react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";
import { secureQuery, fetchConnectionDetails } from './Components/function.js';
import { useAuth } from "../../../context/AuthContext.jsx";
import { ChevronRight, ChevronLeft, Pencil } from 'lucide-react';
import { flushSync } from 'react-dom';
import ColumnsEdit from "./ColumnsEdit.jsx";


function Columns() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [columnData, setColumnData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10);
  const [refresh, setRefresh] = useState(false);
  const [showEditPage, setShowEditPage] = useState(false);
  const [editColumnDetails, setEditColumnDetails] = useState({})

  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const processColumnData = (data) => {
    return data.map(item => {
      const dataType = item.column_metadata ? item.column_metadata.DATA_TYPE || 'UNKNOWN' : 'UNKNOWN';
      const isNullable = item.column_metadata ? item.column_metadata.is_nullable === 'Y' : false;

      return {
        id: `#${item.conn_metadata_id.substring(0, 4)}`,
        name: item.column_name || 'Unnamed',
        diagram: "Diagram_1",
        joins: "Joins",

        //old
        // table: item.table_name,
        // schema: item.table_schema,
        // dataType,
        // nullable: isNullable ? 'Yes' : 'No',
        // database: item.connection_type,
        // // diagram: Math.floor(Math.random() * 10) + 1,
        // joins: new Date(item.created_at).toLocaleDateString(),
        // selected: false
      };
    });
  };

  const loadData = async (forceResfresh = false) => {
    if(columnData.length > 0 && !forceResfresh) {
      return;
    }
    setLoading(true);
    try {
      const secureQueryResponse = await secureQuery({
        user_query: "",
      }, token);

      const policyIds = secureQueryResponse.matched_policy_ids || [];

      const allColumnsData = await fetchConnectionDetails(policyIds, token);

      const processedData = processColumnData(allColumnsData);
      setColumnData(processedData);
      return { success: true };
    } catch (error) {
      console.error('Error loading column data:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Refresh handler with toast
  const handleRefresh = async () => {
    setColumnData([])
    const result = await loadData(true);
    if (result.success) {
      setToast({
        show: true,
        message: 'Column data refreshed successfully',
        type: 'success'
      });
    } else {
      setToast({
        show: true,
        message: 'Failed to refresh column data',
        type: 'error'
      });
    }

      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
  };

  const handleShowEditPage = (column) => {
    setShowEditPage(true);
    setEditColumnDetails(column);
  }  

  // Handle checkbox selection
  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setColumnData(columnData.map(item => ({ ...item, selected: isChecked })));
  };

  const handleSelectItem = (index) => {
    const updatedData = [...columnData];
    updatedData[index].selected = !updatedData[index].selected;
    setColumnData(updatedData);

  };

  const handlPageSize = (e) => {
    setPageSize(e.target.value)
  }

  //Pagination Info
  const itemsPerPage = pageSize;
  const totalPages = Math.ceil(columnData.length / itemsPerPage);

  //calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = columnData.slice(indexOfFirstItem, indexOfLastItem)

  const handlePageForward = (nextPage) => {
    setCurrentPage(nextPage)
  }

  const handlePageBackward = (prevPage) => {
    setCurrentPage(prevPage)
  }


  return (
    <div className="p-5">
      {/* Toast notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn ${
          toast.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' :
          'bg-red-100 text-red-800 border-l-4 border-red-500'
        }`}>
          <Icon
            icon={toast.type === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'}
            className="h-5 w-5"
          />
          <p>{toast.message}</p>
          <button
            onClick={() => setToast({ show: false, message: '', type: '' })}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}
      <Breadcrumb/>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Column</h1>
        <div className="flex items-center gap-2">
          <button
            className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => 
              {
                // setRefresh(true);
                handleRefresh()
              }}
            disabled={loading}
          >
            <Icon
              icon="material-symbols:autorenew-rounded"
              width="24"
              height="24"
              className={`text-gray-600 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden mt-5 text-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-[#29304a] text-white">
                <th className="text-left p-4">SNo</th>
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Name</th>
                {/* <th className="text-left p-4">Table</th>
                <th className="text-left p-4">Schema</th>
                <th className="text-left p-4">Data Type</th>
                <th className="text-left p-4">Nullable</th>
                <th className="text-left p-4">Database</th> */}
                <th className="text-left p-4">Diagram</th>
                <th className="text-left p-4">Joins</th>
                <th className="text-left p-4">Action</th>
                {/* <th className="text-left p-4">
                  <input
                    type="checkbox"
                    name="selectAll"
                    onChange={handleSelectAll}
                  />
                </th> */}
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? currentItems.map((column, index) => (
                <tr key={index} className="border-b text-gray-500">
                  <td className="p-4">{(currentPage -1) * itemsPerPage + index+1}</td>
                  <td className="p-4">{column.id}</td>
                  <td className="p-4 underline underline-offset-4 text-blue-600">{column.name}</td>
                  {/* <td className="p-4">{column.table}</td>
                  <td className="p-4">{column.schema}</td>
                  <td className="p-4">{column.dataType}</td>
                  <td className="p-4">{column.nullable}</td>
                  <td className="p-4">{column.database}</td> */}
                  <td className="p-4">{column.diagram}</td>
                  <td className="p-4">{column.joins}</td>
                  <td 
                    onClick={() => {handleShowEditPage(column)}}
                    className="p-4 cursor-pointer">
                      <Pencil className="w-4 h-4"/>
                  </td>
                  {/* <td className="p-4">
                    <button className="text-blue-600 hover:underline">View</button>
                  </td> */}
                  {/* <td className="p-4">
                    <input
                      type="checkbox"
                      name={`select-${index}`}
                      checked={column.selected || false}
                      onChange={() => handleSelectItem(index)}
                    />
                  </td> */}
                </tr>
              )) : (
                <tr>
                  <td colSpan="11" className="p-4 text-center">No column data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* pagination details */}
      {currentItems.length > 0 && (
        <div className="pt-3 flex justify-between items-center text-sm">
          <div className="text-gray-500">
            {currentPage} of {totalPages} results
          </div>

          <div className="flex gap-3 items-center">
            <span className="text-gray-500">Show per page</span>
            <select 
              value={pageSize}
              onChange={handlPageSize}
              className="p-1 text-gray-500 cursor-pointer">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
            </select>

            <div className="flex flex-row text-gray-500 p-1 border gap-x-3 bg-white">
              <button 
                disabled={currentPage === 1}
                onClick={() => handlePageBackward(currentPage-1)}
                className="disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50"
                >
                <ChevronLeft 
                  className="w-5 h-5" 
                />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageForward(currentPage+1)}
                className="disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50"
              ><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      )}

      {/* Edit page */}
      {showEditPage && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
            onClick={() => setShowEditPage(false)} 
          />

          <div 
            className="relative ml-auto w-full sm:w-[400px] h-full bg-white shadow-xl z-50 animate-slide-in">
            <ColumnsEdit 
              onClose={() => {
                setEditColumnDetails({})
                setShowEditPage(false)
              }}
              columnData={columnData}
              editColumnDetails={editColumnDetails}
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default Columns;