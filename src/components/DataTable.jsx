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
  MoreVertical,
  Pencil,
  Trash2,
  Play,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CustomDropdown from "./CustomDropdown";
import { formatDate } from "../utils/DateUtils";

const DataTable = ({
  columns,
  data = [],
  actions = [],
  title,
  isLoading = false,
  isError = false,
  refetch = () => { },
  resetSortTrigger,
  onRowClick,
  selectedRowId,
  onDeleteSelected,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeMenu, setActiveMenu] = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
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

  // const cellBaseStyle = useMemo(
  //   () => ({
  //     padding: `${density.paddingY}px ${density.paddingX}px`,
  //     fontSize: density.cellFontSize,
  //     lineHeight: density.lineHeight,
  //   }),
  //   [density]
  // );
  // row styling and layout  according to figma style 
  const cellBaseStyle = {
    padding: "11.50px 16px",
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: "18.5px",
    color: "#23252D",
  };

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

  // Clear selection when data changes
  useEffect(() => {
    setSelectedRows(new Set());
  }, [data]);

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

  // Selection helpers
  const allPageRowKeys = useMemo(
    () => paginatedData.map((_, idx) => (page - 1) * itemsPerPage + idx),
    [paginatedData, page, itemsPerPage]
  );

  const isAllPageSelected =
    allPageRowKeys.length > 0 &&
    allPageRowKeys.every((key) => selectedRows.has(key));

  const isIndeterminate =
    !isAllPageSelected && allPageRowKeys.some((key) => selectedRows.has(key));

  const handleSelectAll = useCallback(() => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (isAllPageSelected) {
        allPageRowKeys.forEach((key) => next.delete(key));
      } else {
        allPageRowKeys.forEach((key) => next.add(key));
      }
      return next;
    });
  }, [isAllPageSelected, allPageRowKeys]);

  const handleSelectRow = useCallback((globalIndex, e) => {
    e.stopPropagation();
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(globalIndex)) {
        next.delete(globalIndex);
      } else {
        next.add(globalIndex);
      }
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (!onDeleteSelected) return;
    const selectedItems = processedData.filter((_, idx) =>
      selectedRows.has(idx)
    );
    onDeleteSelected(selectedItems);
    setSelectedRows(new Set());
  }, [selectedRows, processedData, onDeleteSelected]);

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
      e.target.closest('.action-menu') ||
      e.target.closest('.row-checkbox')
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
      <tr
        key={`skeleton-${rowIndex}`}
        className="animate-pulse align-middle border-b"
        style={{ borderColor: "#cccccc" }}
      >
        {/* Checkbox skeleton */}
        {onDeleteSelected && (
          <td className="whitespace-normal break-words" style={{ ...cellBaseStyle, width: "44px" }}>
            <div className="h-4 w-4 bg-gray-200 rounded mx-auto"></div>
          </td>
        )}
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

      {/* Bulk Delete Bar */}
      {onDeleteSelected && selectedRows.size > 0 && (
        <div
          className="flex items-center justify-between rounded-lg px-4 py-2 mb-3"
          style={{ background: "#f3f0f8", border: "1px solid #d4cce8" }}
        >
          <span className="text-sm" style={{ color: "#5b4a8a" }}>
            {selectedRows.size} row{selectedRows.size > 1 ? "s" : ""} selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1 px-3 py-1 rounded text-sm font-medium text-white"
            style={{ background: "#e05252" }}
          >
            <Trash2 size={14} />
            Delete Selected
          </button>
        </div>
      )}

      <div
        className="border rounded-lg mb-4 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 240px)" }}
      >
        <table
          className="w-full bg-white"
          style={{
            borderCollapse: "collapse",
            borderSpacing: 0,
          }}
        >
          <thead>
            <tr className="sticky top-0 z-10">
              {/* Select-all checkbox header */}
              {onDeleteSelected && <th
                className="sticky top-0 z-10"
                style={{
                  background: "#F9F9F9",
                  padding: "16px",
                  fontSize: "16px",
                  lineHeight: "22px",
                  borderBottom: "1px solid #e5e5e5",
                  width: "44px",
                }}
              >
                <input
                  type="checkbox"
                  checked={isAllPageSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={handleSelectAll}
                  aria-label="Select all rows on this page"
                  style={{ cursor: "pointer", accentColor: "#8e78b7" }}
                />
              </th>}
              {columns.map((column, index) => (
                <th
                  key={column.key || column.label}
                  className="text-left sticky top-0 z-10 whitespace-nowrap satoshi-medium-3"
                  // style={{
                  //   background: '#F9F9F9',
                  //   borderBottom: '1px solid #e5e5e5',

                  //   width:
                  //     column.width ||
                  //     (column.label === "Action" ? "100px" : "auto"),
                  //   minWidth:
                  //     column.minWidth ||
                  //     `clamp(${density.minColumnWidth}px, ${density.relativeWidthPercent}%, 200px)`,
                  //   padding: `${density.paddingY}px ${density.paddingX}px`,
                  //   fontSize: density.headerFontSize,
                  //   lineHeight: density.lineHeight,
                  // }}
                  style={{
                    background: "#F9F9F9",
                    padding: "16px",
                    fontSize: "16px",
                    lineHeight: "22px",
                    borderBottom: "1px solid #e5e5e5",
                  }}  // header row layout fixed according to the figma 
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
                        className={`ml-2 cursor-pointer ${sortConfig.key === column.key ? "text-gray-500" : ""
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
          <tbody className="divide-y divide-[#e5e5e5]">
            {isLoading ? (
              renderSkeletonRows()
            ) : isError ? (
              <tr>
                <td colSpan={columns.length + (onDeleteSelected ? 1 : 0)} className="py-6 px-4 text-center">
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
                  colSpan={columns.length + (onDeleteSelected ? 1 : 0)}
                  className="py-4 px-4 text-center text-gray-500"
                >
                  No data found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const globalIndex = (page - 1) * itemsPerPage + rowIndex;
                const isRowSelected = selectedRows.has(globalIndex);

                return (
                  <tr
                    key={rowIndex}
                    style={{ height: "52px" }}
                    className={`transition-colors align-middle ${onRowClick ? "cursor-pointer" : ""
                      } ${isRowSelected
                        ? "bg-[#f3f0f8]"
                        : selectedRowId && row.sno === selectedRowId
                          ? "bg-[#f3f0f8] border-l-4 border-l-[#8e78b7]"
                          : "hover:bg-gray-50"
                      } ${row.rowClassName || ""}`}
                    onClick={(e) => handleRowClickInternal(row, e)}
                  >
                    {/* Row checkbox */}
                    {onDeleteSelected && (
                      <td
                        className="row-checkbox align-middle text-center"
                        style={{ ...cellBaseStyle, width: "44px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={(e) => handleSelectRow(globalIndex, e)}
                          aria-label={`Select row ${rowIndex + 1}`}
                          style={{ cursor: "pointer", accentColor: "#8e78b7" }}
                        />
                      </td>
                    )}

                    {columns.map((column, cellIndex) => {
                      if (column.label === "Action") {
                        const availableActions = actions.filter(
                          (action) =>
                            action.show === undefined ||
                            (typeof action.show === "function"
                              ? action.show(row)
                              : action.show)
                        );

                        if (actions.length > 0 && availableActions.length === 0) {
                          return (
                            <td
                              key={cellIndex}
                              className="text-center align-middle"
                              style={cellBaseStyle}
                            ></td>
                          );
                        }

                        return (
                          <td
                            key={cellIndex}
                            className="text-center align-middle relative action-menu"
                            style={{
                              ...cellBaseStyle,
                              paddingTop: "12px",
                              paddingBottom: "12px",
                            }}
                          >
                            <button
                              className="flex items-center justify-center p-1 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleActionMenu(rowIndex);
                              }}
                              aria-label="Open actions menu"
                              aria-expanded={activeMenu === rowIndex}
                              aria-haspopup="true"
                            >
                              <MoreVertical size={20} />
                            </button>

                            {activeMenu === rowIndex && (
                              <div
                                ref={menuRef}
                                className={`absolute right-4 bg-white shadow-lg rounded-lg py-1 px-3 z-10 border ${rowIndex >= paginatedData.length - 2 ? 'bottom-full mb-2' : 'mt-2'
                                  }`}
                                role="menu"
                                aria-orientation="horizontal"
                              >
                                <div className="flex items-center space-x-3">
                                  {availableActions.map((action, actionIndex) => (
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
                            style={{ ...cellBaseStyle, maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis" }}
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
                          style={{ ...cellBaseStyle, maxWidth: "260px", height: "52px", overflow: "hidden", textOverflow: "ellipsis" }}
                          title={column.key ? row[column.key] : undefined}
                        >
                          {column.key ? (
                            column.key === "status" ? (
                              <span
                                className={`px-3  rounded-full text-xs ${getStatusStyles(
                                  row[column.key]
                                )}`}
                              >
                                {row[column.key]}
                              </span>
                            ) : [
                              "created_at",
                              "updated_at",
                              "created_date",
                              "updated_date",
                              "last_run_date",
                              "timestamp",
                              "created",
                              "updated",
                            ].includes(column.key) ? (
                              formatDate(row[column.key])
                            ) : row[column.key] === 0 ? (
                              0
                            ) : (
                              row[column.key] || "-"
                            )
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot
            className="sticky bottom-0 z-20 bg-white"
          >
            <tr>
              <td colSpan={columns.length + (onDeleteSelected ? 1 : 0)} style={{ padding: '12px 16px', borderTop: '1px solid #cccccc' }}>
                <div className="flex items-center justify-between">

                  {/* Left Side - Results Info */}
                  <div className="text-sm" style={{ color: '#818181' }}>
                    {totalItems > 0
                      ? `${startItem} to ${endItem} of ${totalItems} results`
                      : "No results found"}
                  </div>

                  {/* Right Side Controls */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm" style={{ color: '#818181' }}>
                      Show per page
                    </span>

                    {/* Select */}
                    <div style={{ width: '55px', height: '31px' }}>
                      <CustomDropdown
                        value={String(itemsPerPage)}
                        onChange={(e) => handleItemsPerPageChange({ target: { value: e.target.value } })}
                        options={[
                          { value: '10', label: '10' },
                          { value: '25', label: '25' },
                          { value: '50', label: '50' },
                        ]}
                        disabled={isLoading}
                        rounded="lg"
                        borderColor="#cccccc"
                        focusColor="#8e78b7"
                        compact={true}
                      />
                    </div>

                    {/* Pagination Buttons */}
                    <div className="flex" style={{ width: '55px', height: '31px' }}>
                      <button
                        onClick={handlePrevPage}
                        disabled={page === 1 || isLoading}
                        className="flex-1 border border-[#cccccc] rounded-l flex items-center justify-center"
                      >
                        <ChevronLeft
                          size={16}
                          style={{ color: page === 1 ? '#cccccc' : '#818181' }}
                        />
                      </button>

                      <button
                        onClick={handleNextPage}
                        disabled={page >= totalPages || isLoading}
                        className="flex-1 border border-[#cccccc] rounded-r border-l-0 flex items-center justify-center"
                      >
                        <ChevronRight
                          size={16}
                          style={{ color: page >= totalPages ? '#cccccc' : '#818181' }}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="text-sm mb-2 md:mb-0" style={{ color: '#818181' }}>
          {isLoading ? (
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
          ) : totalItems > 0 ? (
            ` ${startItem} to ${endItem} of ${totalItems} results`
          ) : (
            "No results found"
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm" style={{ color: '#818181' }}>Show per page</span>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <select
              className="rounded p-1 text-sm pr-6"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              aria-label="Show per page"
              disabled={isLoading}
              style={{ borderColor: '#cccccc', borderWidth: '1px', outline: 'none', boxShadow: 'none', color: '#282F49', appearance: 'none', width: '51px', height: '31px' }}
              onFocus={e => { e.target.style.borderColor = '#cccccc'; }}
              onBlur={e => { e.target.style.borderColor = '#cccccc'; }}
            >
              {[10, 25, 50].map((option) => (
                <option key={option} value={option} style={{ color: '#282F49' }}>
                  {option}
                </option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <ChevronDown size={18} style={{ color: '#818181' }} />
            </span>
          </div>
          <div
  className="flex"
  style={{ width: '55px', height: '31px' }}
>
  <button
    onClick={handlePrevPage}
    disabled={page === 1 || isLoading}
    aria-label="Previous page"
    className="flex-1 border border-[#cccccc] rounded-l hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center"
  >
    <ChevronLeft
      size={18}
      style={{ color: (page === 1 || isLoading) ? '#cccccc' : '#818181' }}
    />
  </button>

  <button
    onClick={handleNextPage}
    disabled={page >= totalPages || isLoading}
    aria-label="Next page"
    className="flex-1 border border-[#cccccc] rounded-r border-l-0 hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center"
  >
    <ChevronRight
      size={18}
      style={{ color: (page >= totalPages || isLoading) ? '#cccccc' : '#818181' }}
    />
  </button>
</div>
        </div>
      </div> */}
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