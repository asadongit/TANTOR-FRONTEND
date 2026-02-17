import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Play,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const DataTable = ({
  columns,
  data = [],
  actions = [],
  title,
  isLoading = false,
  isError = false,
  refetch = () => {},
  resetSortTrigger,
  onRowClick,
  selectedRowId,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeMenu, setActiveMenu] = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);
  const menuRef = useRef(null);
  const { project } = useAuth();
  const columnCount = columns.length;

  const density = useMemo(() => {
    const relativeWidthPercent = Math.max(
      6,
      Math.floor(100 / Math.max(columnCount, 1))
    );

    if (columnCount > 12) {
      return {
        minColumnWidth: 80,
        cellFontSize: "12px",
        headerFontSize: "12px",
        paddingX: 8,
        paddingY: 8,
        lineHeight: "1.3",
        relativeWidthPercent,
      };
    }

    if (columnCount > 9) {
      return {
        minColumnWidth: 100,
        cellFontSize: "13px",
        headerFontSize: "13px",
        paddingX: 10,
        paddingY: 10,
        lineHeight: "1.4",
        relativeWidthPercent,
      };
    }

    return {
      minColumnWidth: 120,
      cellFontSize: "14px",
      headerFontSize: "14px",
      paddingX: 12,
      paddingY: 12,
      lineHeight: "1.5",
      relativeWidthPercent,
    };
  }, [columnCount]);

  const cellBaseStyle = useMemo(
    () => ({
      padding: `${density.paddingY}px ${density.paddingX}px`,
      fontSize: density.cellFontSize,
      lineHeight: density.lineHeight,
    }),
    [density]
  );

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
    if (resetSortTrigger !== undefined) {
      setSortConfig({ key: "", direction: "asc" });
    }
  }, [resetSortTrigger]);

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
          String(value || "")
            .toLowerCase()
            .includes(lowerSearch)
        )
      );
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (typeof aVal === "number" && typeof bVal === "number") {
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
  }, [data, searchTerm, sortConfig, project]);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, page, itemsPerPage]);

  const toggleActionMenu = useCallback((index) => {
    setActiveMenu((prev) => (prev === index ? null : index));
  }, []);

  const handleAction = useCallback(
    (action, row) => {
      if (action) {
        action.onClick(row);
      }
      setActiveMenu(null);
    },
    [actions]
  );

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

  const handleRowClickInternal = (row, e) => {
    if (
      e.target.closest('button') ||
      e.target.closest('.action-menu')
    ) {
      return;
    }

    if (onRowClick) {
      onRowClick(row);
    }
  };

  const totalItems = processedData.length;
  const startItem = totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalItems);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const renderSkeletonRows = () => {
    return Array.from({ length: itemsPerPage }).map((_, rowIndex) => (
      <tr key={`skeleton-${rowIndex}`} className="border-b animate-pulse align-middle">
        {columns.map((column, colIndex) => (
          <td
            key={`skeleton-cell-${rowIndex}-${colIndex}`}
            className="whitespace-normal break-words"
            style={cellBaseStyle}
          >
            {column.label === "Action" ? (
              <div className="flex justify-center">
                <div className="h-8 w-8 rounded-full bg-gray-200"></div>
              </div>
            ) : column.key === "status" ? (
              <div className="h-6 w-16 bg-gray-200 rounded-full mx-auto"></div>
            ) : (
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            )}
          </td>
        ))}
      </tr>
    ));
  };

  return (
    <div className="w-full mt-6" style={{ fontSize: density.cellFontSize, lineHeight: density.lineHeight }}>
      <div
        className="overflow-y-auto overflow-x-auto border rounded-lg mb-4"
        style={{ maxHeight: "calc(100vh - 240px)" }}
      >
        <table
          className="w-full bg-white table-fixed"
          aria-label={title || "Data table"}
          style={{ tableLayout: columnCount > 10 ? "auto" : "fixed" }}
        >
          <thead>
            <tr className="bg-gray-800 text-white sticky top-0 z-10">
              {columns.map((column, index) => (
                <th
                  key={column.key || column.label}
                  className="text-left sticky top-0 bg-gray-800 z-10 whitespace-normal break-words"
                  style={{
                    width:
                      column.width ||
                      (column.label === "Action" ? "100px" : "auto"),
                    minWidth:
                      column.minWidth ||
                      `clamp(${density.minColumnWidth}px, ${density.relativeWidthPercent}%, 200px)`,
                    padding: `${density.paddingY}px ${density.paddingX}px`,
                    fontSize: density.headerFontSize,
                    lineHeight: density.lineHeight,
                  }}
                  onClick={() =>
                    column.key &&
                    column.sortable !== false &&
                    handleSort(column.key)
                  }
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
            {isLoading ? (
              renderSkeletonRows()
            ) : isError ? (
              <tr>
                <td colSpan={columns.length} className="py-6 px-4 text-center">
                  <div className="text-red-500 mb-2">Error loading data</div>
                  <button
                    onClick={refetch}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium"
                  >
                    Try Again
                  </button>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-4 px-4 text-center text-gray-500"
                >
                  No data found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`border-b transition-colors align-middle ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${
                    selectedRowId && row.sno === selectedRowId
                      ? 'bg-[#f3f0f8] border-l-4 border-l-[#8e78b7]'
                      : 'hover:bg-gray-50'
                  } ${row.rowClassName || ''}`}
                  onClick={(e) => handleRowClickInternal(row, e)}
                >
                  {columns.map((column, cellIndex) => {
                    if (column.label === "Action") {
                      return (
                        <td
                          key={cellIndex}
                          className="text-center align-middle relative action-menu"
                          style={cellBaseStyle}
                        >
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
                              className={`absolute right-4 bg-white shadow-lg rounded-lg py-1 px-3 z-10 border ${
                                rowIndex >= paginatedData.length - 2 ? 'bottom-full mb-2' : 'mt-2'
                              }`}
                              role="menu"
                              aria-orientation="horizontal"
                            >
                              <div className="flex items-center space-x-3">
                                {actions
                                  .filter(
                                    (action) =>
                                      action.show === undefined ||
                                      (typeof action.show === "function"
                                        ? action.show(row)
                                        : action.show)
                                  )
                                  .map((action, actionIndex) => (
                                    <div key={actionIndex} className="relative">
                                      <button
                                        className="p-1 text-gray-500 hover:text-gray-800 transition-colors"
                                        onClick={() => handleAction(action, row)}
                                        onMouseEnter={() => setHoveredAction(`${rowIndex}-${actionIndex}`)}
                                        onMouseLeave={() => setHoveredAction(null)}
                                        aria-label={action.label}
                                        role="menuitem"
                                      >
                                        {action.icon && (
                                          <span>{action.icon}</span>
                                        )}
                                      </button>
                                      {hoveredAction === `${rowIndex}-${actionIndex}` && (action.tooltip || action.label) && (
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-20">
                                          {action.tooltip || action.label}
                                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                {actions.length === 0 && (
                                  <>
                                    <button
                                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                                      onClick={() =>
                                        handleAction({ type: "edit" }, row)
                                      }
                                      aria-label="Edit"
                                      role="menuitem"
                                    >
                                      <Pencil size={16} className="mr-2" />
                                    </button>
                                    <button
                                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                                      onClick={() =>
                                        handleAction({ type: "delete" }, row)
                                      }
                                      aria-label="Delete"
                                      role="menuitem"
                                    >
                                      <Trash2 size={16} className="mr-2" />
                                    </button>
                                    <button
                                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                                      onClick={() =>
                                        handleAction({ type: "view" }, row)
                                      }
                                      aria-label="View"
                                      role="menuitem"
                                    >
                                      <Play
                                        size={16}
                                        className="mr-2"
                                        fill="currentColor"
                                      />
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
    <td
      key={cellIndex}
      className={`align-middle ${column.wrap ? 'whitespace-normal break-words' : 'whitespace-nowrap text-ellipsis overflow-hidden'}`}
      style={{ ...cellBaseStyle, maxWidth: "100%" }}
      title={column.renderTitle ? column.renderTitle(row, rowIndex) : undefined}
    >
      {column.render(row, rowIndex)}
    </td>
  );
}

                    return (
                      <td
                      key={cellIndex}
                      className={`text-gray-600 align-middle ${column.wrap ? 'whitespace-normal break-words' : 'whitespace-nowrap overflow-hidden text-ellipsis'}`}
                      style={{ ...cellBaseStyle, maxWidth: "100%" }}
                      title={column.key ? row[column.key] : undefined}
                    >
                        {column.key ? (
                          column.key === "status" ? (
                            <span
                              className={`px-3 py-1 rounded-full text-xs ${getStatusStyles(
                                row[column.key]
                              )}`}
                            >
                              {row[column.key]}
                            </span>
                          ) : (row[column.key] === 0
                                ? 0
                                : row[column.key] || "-"
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
          {isLoading ? (
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
          ) : totalItems > 0 ? (
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
            disabled={isLoading}
          >
            {[10, 25, 50].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <div className="flex items-center">
            <button
              onClick={handlePrevPage}
              className="p-1 border rounded-l hover:bg-gray-100 disabled:opacity-50"
              disabled={page === 1 || isLoading}
              aria-label="Previous page"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextPage}
              className="p-1 border rounded-r border-l-0 hover:bg-gray-100 disabled:opacity-50"
              disabled={page >= totalPages || isLoading}
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

  if (status === "active" || status === "completed" || status === "created") {
    return "bg-green-100 text-green-600";
  } else if (status === "pending" || status === "in progress" || status === "orphan") {
    return "bg-yellow-100 text-yellow-600";
  } else if (status === "inactive" || status === "failed") {
    return "bg-red-100 text-red-600";
  }
  else {
    return "bg-gray-100 text-gray-600";
  }
};

export default DataTable;