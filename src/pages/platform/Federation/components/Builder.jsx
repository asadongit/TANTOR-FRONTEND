import CircularProgress from "@mui/material/CircularProgress";
import { ToastContainer, toast } from "react-toastify";
import Switch from "@mui/material/Switch";
import {
    TextField,
    Autocomplete,
    Typography
} from "@mui/material";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";

export default function Builder({ handleSwitch, checked }) {
    const {token, project, decodedToken, setSelectedProject, hostnameV1, hostnameV2 }= useAuth();
    // var encodedToken = import.meta.env.VITE_FEDERATION_ACCESS_TOKEN;
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [columnDefs, setColumnDefs] = useState([]);
    const [curl, setCurl] = useState("pervious curl is")

    const [selectedView, setSelectedView] = useState("");
    const [shownViews, setShownViews] = useState([])

    useEffect(() => {
        const fetchViews = async () => {
          try {
            // const project = sessionStorage.getItem("project");
            // const createdBy = sessionStorage.getItem("created_by");
      
            const params = new URLSearchParams({
              project: project,
              created_by: decodedToken?.preferred_username,
            });
      
            const response = await fetch(`${hostnameV2}/get-all-views_v2?${params}`);
            const data = await response.json();
            
            if (data && data.result) {
                console.log("views in builder is =-====>",data.result)
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
      

    const handleViewChange = async (event, value) => {
        // setData([])
        setSelectedView(value);
        setColumnDefs([]);
        setData([]);
    };

    const checkCaching = async (pay) => {
        try {
            console.log("Inside checking caching");

            const cachingResponse = await fetch(`${hostnameV1}/checkCaching/${selectedView}`);
            const cachingData = await cachingResponse.json();

            console.log("caching response is ====>", cachingData.result)

            if (cachingData.result) {
                console.log("inside iff===>")
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
                            console.log("data result is ====>", data)
                            if (data.detail) {
                                toast.error("Table is empty");
                                setData([]);
                            } else {
                                const rows = data;
                                const colns = Object.keys(rows[0]);
                                setColumnDefs(colns);
                                setData(rows);
                                setHasMore(rows.length === 100);
                            }
                        } else {
                            if (data) {
                                const res = JSON.parse(data);
                                toast.error(res.detail);
                            }
                        }
                    })
                    .catch((error) => {
                        console.error("Error fetching data:", error);
                        toast.error("Something went wrong!");
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            } else {
                console.log("inside else===>")
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
                                toast.error("Table is empty");
                                setData([]);
                            } else {
                                console.log("Parsed Data Array: ", dataArray);
                                const rows = data.trim().split("\n").map((row) => JSON.parse(row));
                                const columns = Object.keys(rows[0]);
                                setColumnDefs(columns);
                                setData(rows);
                                setHasMore(rows.length === 100);
                            }
                        } else {
                            if (data) {
                                const res = JSON.parse(data);
                                toast.error(res.detail);
                            }
                        }
                    })
                    .catch((error) => {
                        console.error("Error fetching data:", error);
                        toast.error("Something went wrong!");
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            }
        } catch (error) {
            console.error("Error checking caching status:", error);
            toast.error("Failed to check caching status");
            setLoading(false);
        }
    };


    const executeQuery = (query = "", page = 1) => {
        setLoading(true);
        setViewsDetails(null)

        const payload = {
            page: page,
            // isCaching: isCaching
        };

        checkCaching(payload)
        var url = `${hostnameV1}/view/${selectedView}`
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
                    console.log("Raw response text:", text);
                    setCurl(text)
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
    const [isQueryModalOpen, setIsQueryModalOpen] = useState(false)
    const [viewsDetails, setViewsDetails] = useState(null);

    const handleQueryDetails = async () => {
        console.log("query details is ===>", viewsDetails)
        if (viewsDetails === null) {
            try {
                setQueryLoading(true)
                setIsQueryModalOpen(true);
                const response = await fetch(
                    `${hostnameV1}/analyzeQuery/${selectedView}/${pageNo}`)
                const data = await response.json();
                if (data) {
                    setLoading(false)
                    setViewsDetails(data);
                }
                else {
                    setQueryLoading(false)
                    setViewsDetails(null);
                    console.error("Invalid response from the API");
                }
            } catch (error) {
                setQueryLoading(false)
                console.error("Error fetching data:", error);
                setViewsDetails({ status: "Failed", message: "Unable to fetch data" });
            } finally {
                setQueryLoading(false)
                setIsQueryModalOpen(true);
            }
        }
        else {
            console.log("query details  IN ELSE is ===>", viewsDetails)
            setIsQueryModalOpen(true);
        }
    };

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
                    <div className="flex items-center">
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
                                                    <div class="bg-[#8E77BB] mr-6 text-white rounded-lg px-2.5 py-0.5">
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
                                        <div>
                                            <button
                                                type="button"
                                                onClick={handleQueryDetails}
                                                className="text-white px-8 py-1.5 bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                                            >
                                                Query Details
                                            </button>
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
                        <CircularProgress sx={{ color: "#8e78b7" }}/>
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
    )

}