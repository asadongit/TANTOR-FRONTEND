import React, { useEffect, useState } from "react";
import {
  Pencil,
  Trash2,
  List,
  Play,
  Download,
  RefreshCcw,
  Plus,
  MoveUpRight,
  Search,
  Eye
} from "lucide-react";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { useNavigate } from "react-router-dom";
import { encrypt } from "../../../utils/Crypto";
import DataTable from "../../../components/DataTable";
import { useProjectData } from "../../../hooks/platform/project";
// import { useProjectCardData } from "../../../hooks/platform/cardCounts";
import { secureQuery } from '../../datagovernance/DataCatalogue/Components/function';
import { useAuth } from '../../../context/AuthContext';
import SupersetReport from './components/SupersetReport';
import toast from "react-hot-toast";
import ReportSummaryComponent from "./components/ReportSummaryComponent";
import {CardGrid} from "../../../components/ReportingCardGrid"
import Breadcrumb from "../../../components/Breadcrumb";

const ReportConfigDashboard = () => {
  // const { data: cardData, isLoading: isCardLoading, error: cardError, refetch: refetchCardData } = useProjectCardData();
  const [hoveredBar, setHoveredBar] = useState(null);
  const { token, hostnameV1 } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [currentEmbedId, setCurrentEmbedId] = useState('');
  const [currentDashboardId, setCurrentDashboardId] = useState('');
  const [currentReportData, setCurrentReportData] = useState({});
  const [isReportSummaryOpen, setIsReportSummaryOpen] = useState(false);
  const [cards, setCards] = useState([]);
  const[filteredReportData,setFilteredReportData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  const handleRefresh = () => {
    refetchReports();
    refetchCardData();
  };
  // const handleCreate = () => {
  //   navigate("/config/report/ruleLinks");
  // };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const secureQueryResponse = await secureQuery({ user_query: "" }, token);
        const policyIds = secureQueryResponse.matched_policy_ids || [];

        const response = await fetch(`${hostnameV1}/ispublished`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ids: policyIds
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const mappedCards = [
          {
            title: "Total",
            count: data.total_reports || 0,
          },
          {
            title: "Published",
            count: data.published || 0,
          },
          {
            title: "Draft",
            count: data.draft || 0,
          },
          {
            title: "Disabled",
            count: data?.disabled || 0,
          },
        ];

        setCards(mappedCards);
      } catch (err) {
        console.error("error ", err.message)
      } finally {

      }
    };

    fetchData();
  }, []);

  const actions = [
    {
      label: "View",
      icon: <MoveUpRight size={16} />,
      onClick: async (row) => {
        const reportId = row.report_id;
        const reportType = row.report_type;
        const reportFileName = row.report_name;
        const embedID = row.embed_id;
        const dashboardId = row.dashboard_id;

        // ----------- SUPERSET CODE START -----------
        if ((reportType || "").toUpperCase() === "LIST" || (reportType || "").toUpperCase() === "DASHBOARD") {
          
          if(!embedID){
            toast.error("Dashboard not configured!");
            return;
          }

          console.log("Current dashboard id ==> ", dashboardId)
          setCurrentEmbedId(embedID);
          setCurrentDashboardId(dashboardId);
          setShowModal(true);
          return;
        }
         else if ((reportType || "").toUpperCase() === "GRID" || (reportType || "").toUpperCase() === "HYBRID") {
            const reportFolder = window._env_?.VITE_REPORTING_REPORT_FOLDER;
            const reportPath = `${reportFolder}/${reportFileName}.rptdesign`;

            window.open(
              `${window._env_?.VITE_REPORTING_API}/frameset?__report=${encodeURIComponent(reportPath)}&__format=${
                window._env_?.VITE_REPORTING_EXPORT_FORMAT
              }`,
              "_blank"
            );
            return;
          }
          else{
            toast.error("Invalid Report Type provided.");
            return;
          }
      },
    },
    {
      label: "Edit",
      icon: <Pencil size={16} />,
      onClick: (row) => {
        navigate(`/config/report/lineItems`, {
          state: {
            reportId: row.report_id,
            reportName: row.report_name,
            reportType: row.report_type,
            reportDesc: row.reportDesc,
            // mode: "EDIT",
          },
        });
      },
      show: (row) => {return ["GRID", "HYBRID"].includes(row.report_type.toUpperCase())}
    },
  ];

  const [reportsData, setReportsData] = useState([]);
  const [isReportsLoading, setIsReportsLoading] = useState(false);
  const [reportError, setReportError] = useState(null);

  const columns = [
    { key: "s_no", label: "#" },
    { key: "report_id", label: "ID" },
    { key: "report_name", label: "Name" },
    { key: "report_type", label: "type" },
    { key: "report_desc", label: "Description" },
    { key: "is_active", label: "Is Active" },
    { label: "Action", sortable: false },
  ];

  const fetchReports = async () => {
    setIsReportsLoading(true);
    setReportError(null);
    try {

      const secureQueryResponse = await secureQuery({ user_query: "" }, token);
      const policyIds = secureQueryResponse.matched_policy_ids || [];

      if (policyIds.length == 0)
        return;

      const response = await fetch(`${hostnameV1}/reportdetails`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: policyIds
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const reportsWithSerial = data.reports.map((report, index) => {
        const { is_published, ...rest } = report;
        return {
          ...rest,
          s_no: index + 1,
        };
      });

      setReportsData(reportsWithSerial);
      setFilteredReportData(reportsWithSerial);
      
    } catch (error) {
      setReportError(error.message);
      console.error('Error fetching reports:', error);
    } finally {
      setIsReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const filteredReportData = reportsData.filter((row) =>
        Object.values(row).some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(lowerSearch)
        )
      );

      setFilteredReportData(filteredReportData);
    }
  }, [reportsData, searchTerm, setSearchTerm]);
  const refetchReports = () => {
    fetchReports();
  };

  const [chartData, setChartData] = useState( [
    {
      name: 'Grid',
    },
    {
      name: 'List',
    },
    {
      name: 'Other',
    },
    {
      name: 'Hybrid',
    },
  ]);

  useEffect(() => {
    const fetchData = async () => {

      try {

        const secureQueryResponse = await secureQuery({ user_query: "" }, token);
        const policyIds = secureQueryResponse.matched_policy_ids || [];

        if (policyIds.length == 0)
          return;

        const response = await fetch(`${hostnameV1}/reportsgraph`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ids: policyIds,
          }),
        });

        const result = await response.json();
        const { report_type } = result;

        // Map API data to chart format
        const data = [
          { name: 'Grid', blue: report_type.GRID },
           { name: 'List', teal: report_type.LIST },
          { name: 'Other', redStripes: report_type.OTHERS },
          { name: 'Hybrid', gray: report_type.HYBRID },
        ];

        setChartData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);


  const handleCardClick = (card) => {
    const url = `/componentType=project&cardType=${card.title}&heading=${card.title}`;
    const encryptedUrl = encodeURIComponent(encrypt(url));
    navigate(`/details?${encryptedUrl}`);
  };


  const CustomBar = (props) => {
    const { x, y, width, height, fill, dataKey } = props;

    // Pattern definitions based on data key
    let pattern;
    if (dataKey === 'redStripes') {
      pattern = (
        <pattern id="redStripes" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
          <rect width="10" height="10" fill="white" />
          <line x1="0" y1="0" x2="0" y2="10" stroke="#ff6b6b" strokeWidth="5" />
        </pattern>
      );

      return (
        <g>
          <defs>{pattern}</defs>
          <rect x={x} y={y} width={width} height={height} fill="url(#redStripes)" />
        </g>
      );
    } else {
      return <rect x={x} y={y} width={width} height={height} fill={fill} />;
    }
  };


  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 shadow-md">
          <p className="font-bold text-gray-800">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };


  return (
    <div className="p-6">
      <Breadcrumb title="Platform" link={"/"} />
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <div className="flex items-center">

          <button
            type="button"
            className="text-black shadow-lg hover:bg-[#8e78b7] hover:text-white focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7] transition-colors"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="text-black shadow-lg hover:bg-[#8e78b7] hover:text-white focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7] transition-colors"
            onClick={handleRefresh}
          >
            <RefreshCcw className={`h-5 w-5 ${isReportsLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            className="text-black shadow-lg hover:bg-[#8e78b7] hover:text-white focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7] transition-colors"
            onClick={handleRefresh}
          >
            <List className={`h-5 w-5 ${isReportsLoading ? 'animate-spin' : ''}`} />
          </button>
          {/* <button
            type="button"
            className="text-black shadow-lg hover:bg-[#8e78b7] hover:text-white focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7] transition-colors"
            onClick={handleCreate}
          >
            <Plus className={`h-5 w-5 ${isReportsLoading ? 'animate-spin' : ''}`} />
          </button> */}
        </div>
      </div>


      <CardGrid cards={cards} onCardClick={handleCardClick} isLoading={false} />


      {/* Chart container */}
      <div className="w-full md:w-[calc(60%-1rem)] h-96 pt-4 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{
              top: 20,
              bottom: 5,
            }}
            barSize={40}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number"
              allowDecimals={false}
              tickFormatter={(value) => Math.round(value)}
            />
            <YAxis dataKey="name" type="category" />
            <Tooltip content={<CustomTooltip />} />
            {/* <Legend /> */}
            <Bar dataKey="blue" stackId="a" fill="#3b82f6" shape={<CustomBar />} />
            <Bar dataKey="teal" stackId="a" fill="#2dd4bf" shape={<CustomBar />} />
            <Bar dataKey="redStripes" stackId="a" fill="#ff6b6b" shape={<CustomBar />} />
            <Bar dataKey="gray" stackId="a" fill="#e5e7eb" shape={<CustomBar />} />
          </BarChart>
        </ResponsiveContainer>
      </div>


      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 mt-10">
        {/* {title && <h2 className="text-xl font-bold mb-2 md:mb-0">{title}</h2>} */}
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
      </div>
      <DataTable
        columns={columns}
        data={filteredReportData}
        actions={actions}
        isLoading={isReportsLoading}
        isError={!!reportError}
        refetch={refetchReports}
      />

      <SupersetReport
        showModal={showModal}
        setShowModal={setShowModal}
        currentReportName={currentEmbedId}
        dashboardId={currentDashboardId}
      />

      <ReportSummaryComponent
        isOpen={isReportSummaryOpen}
        onClose={() => {setIsReportSummaryOpen(false)}}
        reportName={currentReportData.reportName || ""} 
        lineItemsData={currentReportData?.lineItemsConfig || []}
        />
    </div>
  );
};

export default ReportConfigDashboard;