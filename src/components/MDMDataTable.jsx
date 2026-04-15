import React, {
    useState,
    useMemo,
    useCallback,
    useEffect,
} from "react";
import {
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";


const MDMDataTable = ({
    columns,
    data = [],
    isLoading = false,
    isError = false,
    refetch = () => {},
    resetSortTrigger,
    onRowClick,
    selectedRowId,
    className = 'w-full mt-4',
    maxHeight = 'calc(100vh - 240px)',
    horizontalScroll = false,
}) => {
    const [sortConfig, setSortConfig]     = useState({ key: '', direction: 'asc' });
    const [page, setPage]                 = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const cellBaseStyle = {
        padding: '11.50px 16px',
        fontSize: '14px',
        fontWeight: 400,
        lineHeight: '18.5px',
        color: '#23252D',
    };

    useEffect(() => {
        if (resetSortTrigger !== undefined) {
            setSortConfig({ key: '', direction: 'asc' });
        }
    }, [resetSortTrigger]);

    const handleSort = useCallback((key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    }, []);

    const processedData = useMemo(() => {
        let result = [...data];
        if (sortConfig.key) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
                }
                const aStr = String(aVal || '').toLowerCase();
                const bStr = String(bVal || '').toLowerCase();
                return sortConfig.direction === 'asc'
                    ? aStr.localeCompare(bStr)
                    : bStr.localeCompare(aStr);
            });
        }
        return result;
    }, [data, sortConfig]);

    const paginatedData = useMemo(() => {
        const startIndex = (page - 1) * itemsPerPage;
        return processedData.slice(startIndex, startIndex + itemsPerPage);
    }, [processedData, page, itemsPerPage]);

    const totalItems = processedData.length;
    const startItem  = totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1;
    const endItem    = Math.min(page * itemsPerPage, totalItems);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const handlePrevPage = () => { if (page > 1) setPage(page - 1); };
    const handleNextPage = () => { if (page < totalPages) setPage(page + 1); };

    const handleRowClickInternal = (row, e) => {
        if (e.target.closest('button')) return;
        if (onRowClick) onRowClick(row);
    };

    const renderSkeletonRows = () =>
        Array.from({ length: itemsPerPage }).map((_, rowIndex) => (
            <tr key={`skeleton-${rowIndex}`} className="animate-pulse align-middle border-b" style={{ borderColor: '#cccccc' }}>
                {columns.map((col, colIndex) => (
                    <td key={colIndex} style={cellBaseStyle}>
                        {col.key === 'status'
                            ? <div className="h-6 w-16 bg-gray-200 rounded-full mx-auto" />
                            : <div className="h-4 bg-gray-200 rounded w-3/4" />
                        }
                    </td>
                ))}
            </tr>
        ));

    const PaginationBar = () => (
        <div
            className="flex items-center justify-between shrink-0"
            style={{
                padding: '12px 16px',
                borderTop: '1px solid #cccccc',
                backgroundColor: '#fff',
            }}
        >
            <div className="text-sm" style={{ color: '#818181' }}>
                {totalItems > 0
                    ? `${startItem} to ${endItem} of ${totalItems} results`
                    : 'No results found'}
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-sm" style={{ color: '#818181' }}>Show per page</span>
                <select
                    value={itemsPerPage}
                    onChange={e => { setItemsPerPage(Number(e.target.value)); setPage(1); }}
                    disabled={isLoading}
                    style={{
                        border: '1px solid #cccccc',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontSize: '14px',
                        color: '#282F49',
                        outline: 'none',
                        height: '31px',
                    }}
                >
                    {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <div className="flex" style={{ width: '55px', height: '31px' }}>
                    <button
                        onClick={handlePrevPage}
                        disabled={page === 1 || isLoading}
                        className="flex-1 border border-[#cccccc] rounded-l flex items-center justify-center"
                    >
                        <ChevronLeft size={16} style={{ color: page === 1 ? '#cccccc' : '#818181' }} />
                    </button>
                    <button
                        onClick={handleNextPage}
                        disabled={page >= totalPages || isLoading}
                        className="flex-1 border border-[#cccccc] rounded-r border-l-0 flex items-center justify-center"
                    >
                        <ChevronRight size={16} style={{ color: page >= totalPages ? '#cccccc' : '#818181' }} />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`flex flex-col ${className}`} style={{ minHeight: 0 }}>
            <div
                className="flex flex-col rounded-lg overflow-hidden"
                style={{
                    flex: 1,
                    minHeight: 0,
                    border: '1px solid #cccccc',
                }}
            >
                <div
                    className="overflow-y-auto"
                    style={{
                        flex: 1,
                        minHeight: 0,
                        maxHeight,
                        overflowX: horizontalScroll ? 'auto' : 'hidden',
                        position: 'relative',
                    }}
                >
                    <table
                        className="bg-white"
                        style={{
                            borderCollapse: 'collapse',
                            borderSpacing: 0,
                            width: horizontalScroll ? 'max-content' : '100%',
                            minWidth: '100%',
                        }}
                    >
                        {/* Head */}
                        <thead>
                            <tr className="sticky top-0 z-10">
                                {columns.map((column) => (
                                    <th
                                        key={column.key || column.label}
                                        className="text-left sticky top-0 z-10 satoshi-medium-3"
                                        style={{
                                            background: '#F9F9F9',
                                            padding: '16px',
                                            fontSize: '16px',
                                            lineHeight: '22px',
                                            borderBottom: '1px solid #e5e5e5',
                                            ...(column.maxWidth ? { maxWidth: column.maxWidth, minWidth: column.maxWidth } : {}),
                                        }}
                                        onClick={() => column.key && column.sortable !== false && handleSort(column.key)}
                                    >
                                        <div className="flex items-center">
                                            {column.label}
                                            {column.key && column.sortable !== false && (
                                                <ArrowUpDown
                                                    className={`ml-2 cursor-pointer ${sortConfig.key === column.key ? 'text-gray-500' : ''}`}
                                                    size={16}
                                                />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* Body */}
                        <tbody className="divide-y divide-[#e5e5e5]">
                            {isLoading ? (
                                renderSkeletonRows()
                            ) : isError ? (
                                <tr>
                                    <td colSpan={columns.length} className="py-6 px-4 text-center">
                                        <div className="text-red-500 mb-2">Error loading data</div>
                                        <button onClick={refetch} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium">
                                            Try Again
                                        </button>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="py-4 px-4 text-center text-gray-500">
                                        No data found
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((row, rowIndex) => (
                                    <tr
                                        key={rowIndex}
                                        style={{ height: '52px' }}
                                        className={`transition-colors align-middle ${onRowClick ? 'cursor-pointer' : ''} ${
                                            selectedRowId && row.id === selectedRowId
                                                ? 'bg-[#f3f0f8] border-l-4 border-l-[#8e78b7]'
                                                : 'hover:bg-gray-50'
                                        } ${row.rowClassName || ''}`}
                                        onClick={(e) => handleRowClickInternal(row, e)}
                                    >
                                        {columns.map((column, cellIndex) => {
                                            if (column.render) {
                                                return (
                                                    <td
                                                        key={cellIndex}
                                                        className={`align-middle ${column.wrap ? 'whitespace-normal break-words' : 'whitespace-nowrap overflow-hidden text-ellipsis'}`}
                                                        style={{ ...cellBaseStyle, maxWidth: column.maxWidth ?? '260px', overflow: 'hidden', textOverflow: 'ellipsis' }}
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
                                                    style={{ ...cellBaseStyle, maxWidth: column.maxWidth ?? '260px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                    title={column.key ? String(row[column.key] ?? '') : undefined}
                                                >
                                                    {column.key
                                                        ? (row[column.key] === 0 ? 0 : row[column.key] || '-')
                                                        : null
                                                    }
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <PaginationBar />

            </div>

        </div>
    );
};

export default MDMDataTable;