import CircularProgress from "@mui/material/CircularProgress";
import Switch from "@mui/material/Switch";
import {
    TextField,
    Autocomplete,
    Typography
} from "@mui/material";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { ChevronDown, X, Download } from 'lucide-react'; // Added X for toast close button
import { Icon } from "@iconify/react"; // Added for toast icons
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../../../context/AuthContext";

export default function Builder({ handleSwitch, checked }) {
    const { token, project, decodedToken, setSelectedProject, hostnameV1, hostnameV2 } = useAuth();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [columnDefs, setColumnDefs] = useState([]);
    const [curl, setCurl] = useState("pervious curl is");
    const [selectedView, setSelectedView] = useState("");
    const [shownViews, setShownViews] = useState([]);
    const [toast, setToast] = useState({ show: false, message: '', type: '' }); // Added toast state

    const [pageSize, setPageSize] = useState(100);

    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [fullDataLoading, setFullDataLoading] = useState(false);
    const downloadMenuRef = useRef(null);

    useEffect(() => {
        const fetchViews = async () => {
            try {
                const params = new URLSearchParams({
                    project: project,
                    created_by: decodedToken?.preferred_username,
                });

                const response = await fetch(`${hostnameV2}/get-all-views_v2?${params}`);
                const data = await response.json();

                if (data && data.result) {
                    setShownViews(data.result);
                } else {
                    console.error("Invalid response from the API");
                }
            } catch (error) {
                console.error("Error fetching views:", error);
            }
        };

        fetchViews();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
                setShowDownloadMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const convertToCSV = (jsonData) => {
    const headers = Object.keys(jsonData[0]).join(',');
    const csvRows = jsonData.map(obj => Object.values(obj).map(val => `"${val}"`).join(','));
    return [headers, ...csvRows].join('\n');
};

    const triggerCSVDownload = (csvContent, filename) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDownloadCurrentPage = () => {
        setShowDownloadMenu(false);
        if (!data || data.length === 0) {
            setToast({ show: true, message: "No data to download", type: "error" });
            setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
            return;
        }
        const csvContent = convertToCSV(data);
        triggerCSVDownload(csvContent, `data_page_${pageNo}.csv`);
    };

    const handleDownloadFullData = async () => {
        setShowDownloadMenu(false);
        if (!selectedView) {
            setToast({ show: true, message: "Select a view first to download full data", type: "error" });
            setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
            return;
        }

        setFullDataLoading(true);
        setToast({ show: true, message: "Fetching full data, please wait...", type: "success" });

        try {
            let allRows = [];
            let currentPage = 1;
            let morePages = true;
            const batchSize = 1000;

            while (morePages) {
                const payload = { page: currentPage, page_size: batchSize };
                const cachingResponse = await fetch(`${hostnameV1}/checkCaching/${selectedView}`);
                const cachingData = await cachingResponse.json();

                let response;
                if (cachingData.result) {
                    response = await fetch(`${hostnameV1}/view/${selectedView}`, {
                        method: "POST",
                        headers: { accept: "application/json", "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify(payload),
                    });
                    if (!response.ok) throw new Error("Failed to fetch page " + currentPage);
                    const rows = await response.json();
                    allRows = allRows.concat(rows);
                    if (rows.length < batchSize) morePages = false;
                    else currentPage++;
                } else {
                    response = await fetch(`${hostnameV1}/view/${selectedView}`, {
                        method: "POST",
                        headers: { accept: "application/json", "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify(payload),
                    });
                    if (!response.ok) throw new Error("Failed to fetch page " + currentPage);
                    const dataText = await response.text();
                    const rows = dataText.trim().split("\n")
                        .filter(r => r.trim() !== "")
                        .map(r => JSON.parse(r));
                    allRows = allRows.concat(rows);
                    if (rows.length < batchSize) morePages = false;
                    else currentPage++;
                }
            }

            if (allRows.length === 0) {
                setToast({ show: true, message: "No data available to download", type: "error" });
                setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
                return;
            }

            const csvContent = convertToCSV(allRows);
            triggerCSVDownload(csvContent, `${selectedView}_full_${Date.now()}.csv`);
            setToast({ show: true, message: `Downloaded ${allRows.length} rows successfully`, type: "success" });
            setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
        } catch (error) {
            console.error("Error downloading full data:", error);
            setToast({ show: true, message: "Failed to download full data", type: "error" });
            setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
        } finally {
            setFullDataLoading(false);
        }
    };

    const handleViewChange = async (event, value) => {
        setSelectedView(value);
        setColumnDefs([]);
        setData([]);
    };

    const checkCaching = async (pay) => {
        try {

            const cachingResponse = await fetch(`${hostnameV1}/checkCaching/${selectedView}`);
            const cachingData = await cachingResponse.json();

            if (cachingData.result) {
                fetch(`${hostnameV1}/view/${selectedView}`, {
                    method: "POST",
                    headers: {
                        accept: "application/json",
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify(pay),
                })
                    .then((response) => response.json().then((data) => ({ status: response.status, data })))
                    .then(({ status, data }) => {
                        if (status === 200) {
                            if (data.detail) {
                                setToast({
                                    show: true,
                                    message: "Table is empty",
                                    type: "error",
                                });
                                setTimeout(() => {
                                    setToast({ show: false, message: "", type: "" });
                                }, 3000);
                                setData([]);
                            } else {
                                const rows = data;
                                const colns = Object.keys(rows[0]);
                                setColumnDefs(colns);
                                setData(rows);
                                setHasMore(rows.length === pageSize);
                            }
                        } else {
                            if (data) {
                                const res = JSON.parse(data);
                                setToast({
                                    show: true,
                                    message: res.detail,
                                    type: "error",
                                });
                                setTimeout(() => {
                                    setToast({ show: false, message: "", type: "" });
                                }, 3000);
                            }
                        }
                    })
                    .catch((error) => {
                        console.error("Error fetching data:", error);
                        setToast({
                            show: true,
                            message: "Something went wrong!",
                            type: "error",
                        });
                        setTimeout(() => {
                            setToast({ show: false, message: "", type: "" });
                        }, 3000);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            } else {
                fetch(`${hostnameV1}/view/${selectedView}`, {
                    method: "POST",
                    headers: {
                        accept: "application/json",
                        "Content-Type": "application/json",
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(pay),
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
                                setToast({
                                    show: true,
                                    message: "Table is empty",
                                    type: "error",
                                });
                                setTimeout(() => {
                                    setToast({ show: false, message: "", type: "" });
                                }, 3000);
                                setData([]);
                            } else {
                                const rows = data.trim().split("\n").map((row) => JSON.parse(row));
                                const columns = Object.keys(rows[0]);
                                setColumnDefs(columns);
                                setData(rows);
                                setHasMore(rows.length === pageSize);
                            }
                        } else {
                            if (data) {
                                const res = JSON.parse(data);
                                setToast({
                                    show: true,
                                    message: res.detail,
                                    type: "error",
                                });
                                setTimeout(() => {
                                    setToast({ show: false, message: "", type: "" });
                                }, 3000);
                            }
                        }
                    })
                    .catch((error) => {
                        console.error("Error fetching data:", error);
                        setToast({
                            show: true,
                            message: "Something went wrong!",
                            type: "error",
                        });
                        setTimeout(() => {
                            setToast({ show: false, message: "", type: "" });
                        }, 3000);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            }
        } catch (error) {
            console.error("Error checking caching status:", error);
            setToast({
                show: true,
                message: "Failed to check caching status",
                type: "error",
            });
            setTimeout(() => {
                setToast({ show: false, message: "", type: "" });
            }, 3000);
            setLoading(false);
        }
    };

    const executeQuery = (query = "", page = 1) => {
        setLoading(true);
        setViewsDetails(null);

        const payload = {
            page: page,
            page_size: pageSize,
        };

        checkCaching(payload);
        var url = `${hostnameV1}/view/${selectedView}`;
        fetch(`${hostnameV1}/generate_curl`, {
            method: "POST",
            headers: {
                accept: "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
                url: url,
                page: page,
            }),
        })
            .then((response) =>
                response.text().then((text) => {
                    setCurl(text);
                })
            )
            .catch((error) => {
                console.error("Error fetching data:", error);
            });
    };

    const [pageNo, setPageNo] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const handleNextPage = () => {
        const nextPage = pageNo + 1;
        setPageNo(nextPage);
        executeQuery("", nextPage);
    };

    const handlePreviousPage = () => {
        if (pageNo > 1) {
            const prevPage = pageNo - 1;
            setPageNo(prevPage);
            executeQuery("", prevPage);
        }
    };

    const [queryLoading, setQueryLoading] = useState(false);
    const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
    const [viewsDetails, setViewsDetails] = useState(null);

    const handleQueryDetails = async () => {
        if (viewsDetails === null) {
            try {
                setQueryLoading(true);
                setIsQueryModalOpen(true);
                const response = await fetch(`${hostnameV1}/analyzeQuery`, {
                    method: 'POST',
                    headers: {
                        accept: "application/json",
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        viewname: selectedView,
                        pageNo: pageNo
                    })
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (data) {
                    setLoading(false);
                    setViewsDetails(data);
                } else {
                    setQueryLoading(false);
                    setViewsDetails(null);
                    console.error("Invalid response from the API");
                }
            } catch (error) {
                setQueryLoading(false);
                console.error("Error fetching data:", error);
                setViewsDetails({ status: "Failed", message: "Unable to fetch data" });
            } finally {
                setQueryLoading(false);
                setIsQueryModalOpen(true);
            }
        } else {
            setIsQueryModalOpen(true);
        }
    };

    useEffect(() => {
        if (selectedView && data.length > 0) {
            executeQuery("", 1);
        }
    }, [pageSize]);

    return (
        <>
            <div className="h-[100%] w-[100%]">
                <div className="w-[100%] flex justify-between h-[15%] items-center">
                    <div className="flex items-center ml-4">
                        <Autocomplete
                            disablePortal
                            options={shownViews}
                            value={selectedView}
                            onChange={handleViewChange}
                            sx={{ width: 175, backgroundColor: "#F0F0F0", borderRadius: "8px", border: "none" }}
                            size="small"
                            renderInput={(params) => <TextField {...params} label="Select View" />}
                        />
                        <button
                            type="button"
                            onClick={executeQuery}
                            className="ml-10 text-white px-8 py-2 bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                        >
                            Execute
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative" ref={downloadMenuRef}>
                            <button
                                type="button"
                                onClick={() => setShowDownloadMenu((prev) => !prev)}
                                disabled={fullDataLoading}
                                title="Download CSV"
                                className="text-black shadow-lg hover:bg-[#8e78b7] hover:text-white focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-1.5 bg-white focus:outline-none flex items-center gap-1 transition-colors"
                            >
                                {fullDataLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#8e78b7]" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                <ChevronDown className="h-3 w-3" />
                            </button>

                            {showDownloadMenu && (
                                <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                                    <button
                                        onClick={handleDownloadCurrentPage}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f3f0f9] hover:text-[#8e78b7] flex items-center gap-2 transition-colors"
                                    >
                                        <Download className="h-4 w-4 flex-shrink-0" />
                                        <div>
                                            <div className="font-medium">Current Page</div>
                                            <div className="text-xs text-gray-400">Page {pageNo} · {data.length} rows</div>
                                        </div>
                                    </button>
                                    <div className="border-t border-gray-100" />
                                    <button
                                        onClick={handleDownloadFullData}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f3f0f9] hover:text-[#8e78b7] flex items-center gap-2 transition-colors"
                                    >
                                        <Download className="h-4 w-4 flex-shrink-0" />
                                        <div>
                                            <div className="font-medium">Full Data</div>
                                            <div className="text-xs text-gray-400">All pages · may take a moment</div>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>

                        <Switch
                            checked={checked}
                            onChange={handleSwitch}
                            inputProps={{ "aria-label": "controlled" }}
                        />
                        <span>{checked ? "Editor" : "Builder"}</span>
                    </div>
                </div>
                <div className="h-[85%] flex flex-col">
                    {(data?.length > 0 || loading) && (
                        <>
                            <div className="flex-1 flex flex-col mb-4 overflow-hidden">
                                <h2 className="text-xl font-bold pb-3">Output</h2>
                                <div className="bg-white rounded-lg shadow w-full flex-1 overflow-hidden">
                                    {loading ? (
                                        <div className="flex justify-center items-center h-full">
                                            <CircularProgress sx={{ color: "#8e78b7" }} />
                                        </div>
                                    ) : (
                                        <div className="h-full overflow-y-auto custom-scroll">
                                            <table className="w-full">
                                                <thead className="text-xs sticky top-0 bg-[#29304a] text-white">
                                                    <tr>
                                                        {columnDefs.map((col, index) => (
                                                            <th key={index} className="text-left p-4">
                                                                {col.replace(/_/g, " ").toUpperCase()}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="text-xs">
                                                    {data.map((row, rowIndex) => (
                                                        <tr key={rowIndex} className="border-b">
                                                            {columnDefs.map((col, colIndex) => {
                                                                const cellContent = row[col];
                                                                const isLink =
                                                                    typeof cellContent === "string" &&
                                                                    cellContent.startsWith("http");

                                                                return (
                                                                    <td key={colIndex} className="p-4 text-left">
                                                                        {isLink ? (
                                                                            <a
                                                                                href={cellContent}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-blue-500 underline"
                                                                            >
                                                                                {cellContent}
                                                                            </a>
                                                                        ) : (
                                                                            cellContent
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Accordion and Buttons */}
                            {!loading && (
                                <div className="flex-none">
                                    <div>
                                        <Accordion
                                            style={{ width: "100%", padding: "0px", marginBottom: "15px" }}
                                            className="transition-all duration-300"
                                        >
                                            <AccordionSummary
                                                expandIcon={<ChevronDown />}
                                                aria-controls="panel2-content"
                                                id="panel2-header"
                                            >
                                                <div className="flex">
                                                    <div className="bg-[#8E77BB] mr-6 text-white rounded-lg px-2.5 py-0.5">
                                                        POST
                                                    </div>
                                                    <Typography component="span">
                                                        /api/v1/view/{selectedView}
                                                    </Typography>
                                                </div>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Typography>{curl}</Typography>
                                            </AccordionDetails>
                                        </Accordion>
                                    </div>
                                    <div className="w-[100%] flex justify-between">
                                        <div className="flex gap-4 items-center">
                                            <button
                                                type="button"
                                                onClick={handleQueryDetails}
                                                className="text-white px-8 py-1.5 bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                                            >
                                                Query Details
                                            </button>
                                            <select
                                                value={pageSize}
                                                onChange={(e) => {
                                                    setPageSize(Number(e.target.value));
                                                    setPageNo(1);
                                                }}
                                                className="px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8e78b7]"
                                            >
                                                <option value={100}>100</option>
                                                <option value={200}>200</option>
                                                <option value={500}>500</option>
                                                <option value={800}>800</option>
                                                <option value={1000}>1000</option>
                                            </select>
                                        </div>
                                        <div className="w-[60%] flex justify-end">
                                            <button
                                                type="button"
                                                onClick={handlePreviousPage}
                                                disabled={pageNo === 1}
                                                className={`px-8 py-1.5 focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm focus:outline-none mr-4 
                                                    ${pageNo === 1 ? "text-gray-400 bg-gray-200 cursor-not-allowed" : "text-white bg-[#8e78b7] hover:bg-[#7a63a8]"}
                                                    dark:bg-[#8e78b7] dark:hover:bg-[#7a63a8] dark:focus:ring-[#8e78b7]`}
                                            >
                                                Previous
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleNextPage}
                                                disabled={!hasMore}
                                                className="text-white px-8 py-1.5 bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
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
            </div>
            {isQueryModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg min-w-[32vw] min-h-[50vh] flex flex-col justify-between">
                        <div className="p-2 pl-4 border-b flex justify-between items-center bg-[#282F49] text-white rounded-t-lg">
                            <h2 className="text-xl font-semibold">Query Details</h2>
                        </div>

                        <div className="mt-4 mx-10 flex justify-center">
                            {viewsDetails && viewsDetails.length > 0 && (
                                <div>
                                    {Object.entries(viewsDetails[0])
                                        .filter(([key]) => key !== "query")
                                        .map(([key, value]) => (
                                            <div
                                                key={key}
                                                style={{
                                                    marginBottom: '10px',
                                                    fontSize: '16px',
                                                    fontWeight: '400',
                                                    color: '#8E77BB',
                                                    lineHeight: '1.5',
                                                }}
                                            >
                                                <strong style={{ color: '#8E77BB' }}>
                                                    {key.replace(/_/g, " ").toUpperCase()}:
                                                </strong>{" "}
                                                <span style={{ color: '#555' }}>
                                                    {value || "N/A"}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            )}
                            {queryLoading && (
                                <CircularProgress sx={{ color: "#8e78b7" }} />
                            )}
                        </div>

                        <div className="py-3 pr-4 flex justify-end gap-4">
                            <button
                                onClick={() => setIsQueryModalOpen(false)}
                                className="px-6 py-1 bg-[#8E77BB] text-white rounded-lg hover:bg-opacity-80"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}