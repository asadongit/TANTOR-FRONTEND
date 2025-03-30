import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Play, ChevronLeft, ChevronRight, Search } from "lucide-react";

const DataTable = ({ 
  columns, 
  data, 
  actions = [],  
  title,
  onRowAction
}) => {

  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const processedData = useMemo(() => {
    let result = [...data];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((value) => 
          String(value || "").toLowerCase().includes(lowerSearch)
        )
      );
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal || "").toLowerCase();
        const bStr = String(bVal || "").toLowerCase();
        
        return sortConfig.direction === "asc" 
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return result;
  }, [data, searchTerm, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, page, itemsPerPage]);
  
  

  const toggleActionMenu = useCallback((index) => {
    setActiveMenu((prev) => (prev === index ? null : index));
  }, []);

  const handleAction = useCallback((action, row) => {
    if (onRowAction) {
      onRowAction(action, row);
    }
    setActiveMenu(null);
  }, [onRowAction]);

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setPage(1);
  };
  
  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };
  
  const handleNextPage = () => {
    const maxPage = Math.ceil(processedData.length / itemsPerPage);
    if (page < maxPage) setPage(page + 1);
  };

  const totalItems = processedData.length;
  const startItem = totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalItems);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="w-full mt-6">
      {/* <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        {title && <h2 className="text-xl font-bold mb-2 md:mb-0">{title}</h2>}
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 border rounded-lg w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search records"
          />
        </div>
      </div> */}

      <div
        className="overflow-auto border rounded-lg mb-4"
        style={{ maxHeight: "calc(100vh - 240px)" }}
      >
        <table className="w-full bg-white table-fixed" aria-label={title || "Data table"}>
          <thead>
            <tr className="bg-gray-800 text-white sticky top-0 z-10">
              {columns.map((column, index) => (
                <th
                  key={column.key || column.label}
                  className="py-3 px-4 text-left sticky top-0 bg-gray-800 z-10"
                  style={{
                    width: column.width || (column.label === "Action" ? "100px" : "auto"),
                    minWidth: column.minWidth || "120px",
                  }}
                  onClick={() => column.key && column.sortable !== false && handleSort(column.key)}
                  aria-sort={
                    sortConfig.key === column.key
                      ? sortConfig.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.key && column.sortable !== false && (
                      <ArrowUpDown
                        className={`ml-2 cursor-pointer ${
                          sortConfig.key === column.key ? "text-blue-300" : ""
                        }`}
                        size={16}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-4 px-4 text-center text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b hover:bg-gray-50">
                  {columns.map((column, cellIndex) => {
                    if (column.label === "Action") {
                      return (
                        <td key={cellIndex} className="py-3 px-4 text-center relative">
                          <button
                            className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActionMenu(rowIndex);
                            }}
                            aria-label="Open actions menu"
                            aria-expanded={activeMenu === rowIndex}
                            aria-haspopup="true"
                          >
                            <MoreHorizontal size={20} />
                          </button>

                          {activeMenu === rowIndex && (
                            <div 
                              ref={menuRef}
                              className="absolute right-4 mt-2 bg-white shadow-lg rounded-lg py-1 px-3 z-10 border"
                              role="menu"
                              aria-orientation="horizontal"
                            >
                          <div className="flex items-center space-x-3">
                          {actions.map((action, actionIndex) => (
                            <button className="p-1 text-gray-500 hover:text-gray-800"
                                    key={actionIndex}
                                    onClick={() => handleAction(action, row)}
                                    aria-label={action.label}
                                    role="menuitem"
                                  >
                                    {action.icon && (
                                      <span >
                                        {action.icon}
                                      </span>
                                    )}
                                  </button>
                                ))}
                                {actions.length === 0 && (
                                  <>
                                    <button 
                                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                                      onClick={() => handleAction({ type: 'edit' }, row)}
                                      aria-label="Edit"
                                      role="menuitem"
                                    >
                                      <Pencil size={16} className="mr-2" />
                                    </button>
                                    <button 
                                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                                      onClick={() => handleAction({ type: 'delete' }, row)}
                                      aria-label="Delete"
                                      role="menuitem"
                                    >
                                      <Trash2 size={16} className="mr-2" />
                                    </button>
                                    <button 
                                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                                      onClick={() => handleAction({ type: 'view' }, row)}
                                      aria-label="View"
                                      role="menuitem"
                                    >
                                      <Play size={16} className="mr-2" fill="currentColor" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    }
                    
                    if (column.render) {
                      return (
                        <td key={cellIndex} className="py-3 px-4">
                          {column.render(row, rowIndex)}
                        </td>
                      );
                    }
                    
                    return (
                      <td key={cellIndex} className="py-3 px-4 text-gray-600">
                        {column.key ? (
                          column.key === "status" ? (
                            <span className={`px-3 py-1 rounded-full text-sm ${getStatusStyles(row[column.key])}`}>
                              {row[column.key]}
                            </span>
                          ) : (
                            <div className="truncate max-w-[200px]" title={row[column.key]}>
                              {row[column.key]}
                            </div>
                          )
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="text-sm text-gray-500 mb-2 md:mb-0">
          {totalItems > 0 ? (
            `Showing ${startItem} to ${endItem} of ${totalItems} results`
          ) : (
            "No results found"
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Show per page</span>
          <select
            className="border rounded p-1 text-sm"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            aria-label="Show per page"
          >
            {[10, 25, 50].map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <div className="flex items-center">
            <button
              onClick={handlePrevPage}
              className="p-1 border rounded-l hover:bg-gray-100 disabled:opacity-50"
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={20} />
            </button>
            {/* <span className="px-3 border-t border-b">
              Page {page} of {totalPages || 1}
            </span> */}
            <button
              onClick={handleNextPage}
              className="p-1 border rounded-r border-l-0 hover:bg-gray-100 disabled:opacity-50"
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const getStatusStyles = (status) => {
  status = String(status || "").toLowerCase();
  
  if (status === "active" || status === "completed") {
    return "bg-green-100 text-green-600";
  } else if (status === "pending" || status === "in progress" ) {
    return "bg-yellow-100 text-yellow-600";
  } else if (status === "inactive" || status === "failed" ) {
    return "bg-red-100 text-red-600";
  } else {
    return "bg-gray-100 text-gray-600";
  }
};

export default DataTable;