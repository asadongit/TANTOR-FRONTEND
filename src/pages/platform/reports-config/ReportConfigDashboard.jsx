import React, { useEffect, useState } from "react";
import {
  Pencil,
  Trash2,
  List,
  Play,
  Download,
  Plus,
  MoveUpRight
} from "lucide-react";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { useNavigate } from "react-router-dom";
import { encrypt } from "../../../utils/Crypto";
import DataTable from "../../../components/DataTable";
import { useProjectData } from "../../../hooks/platform/project";
import { useProjectCardData } from "../../../hooks/platform/cardCounts";
import { useRuleReportsData } from "../../../hooks/platform/ruleReports";
import { secureQuery } from '../../datagovernance/DataCatalogue/Components/function';
import { useAuth } from '../../../context/AuthContext';
import SupersetReport from './components/SupersetReport';
import toast from "react-hot-toast";



const CardGrid = ({ cards, isLoading = false, onCardClick }) => {

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <React.Fragment key={card.title}>
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition-transform transform hover:scale-105 hover:shadow-md"
            onClick={() => onCardClick && onCardClick(card)}
          >
            <div className="flex items-center mb-2">
              <h3 className="text-lg font-semibold">{card.title}</h3>
            </div>
            {isLoading ? (
              <div className="w-8 md:w-10 h-8 md:h-10 bg-gray-200 rounded-full mr-2"></div>
            ) : (
              <p className="text-black text-5xl font-bold">{card.count}</p>
            )}
          </div>
          {index === 1 && <div className="col-span-1"></div>}
        </React.Fragment>
      ))}
    </div>
  );
};

const ReportConfigDashboard = () => {
  const { data: cardData, isLoading: isCardLoading, error: cardError, refetch: refetchCardData } = useProjectCardData();
  // const { data: reportsData = [], isLoading: isReportsLoading, error: reportError, refetch: refetchReports } = useRuleReportsData();
  const [hoveredBar, setHoveredBar] = useState(null);
  const { token, hostnameV1 } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [currentEmbedId, setCurrentEmbedId] = useState('');

  const navigate = useNavigate();


  const handleRefresh = () => {
    refetchReports();
    refetchCardData();
  };


  const handleCreate = () => {
    navigate("/config/report/ruleLinks");
  };


  const [cards, setCards] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {

        const secureQueryResponse = await secureQuery({ user_query: "" }, token);
        const policyIds = secureQueryResponse.matched_policy_ids || [];
        console.log("policy ids are =====>", policyIds)

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
            count: cardData?.migration || 0,
          },
        ];

        setCards(mappedCards);
      } catch (err) {
        console.log("error ", err.message)
        // setError(err.message);
      } finally {

      }
    };

    fetchData();
  }, []);


  // const cards = [
  //   {
  //     title: "Total",
  //     count: cardData?.purge || 0,
  //   },
  //   {
  //     title: "Published",
  //     count: cardData?.metadata || 0,
  //   },
  //   {
  //     title: "Draft",
  //     count: cardData?.federation || 0,
  //   },
  //   {
  //     title: "Disabled",
  //     count: cardData?.migration || 0,
  //   },
  // ];


  const actions = [
    {
      label: "View",
      icon: <MoveUpRight size={16} />,
      onClick: async (row) => {
        const reportId = row.report_id;
        const reportType = row.report_type;
        const reportFileName = row.report_name;
        const embedID = row.embed_id

        // ----------- SUPERSET CODE START -----------
        if ((reportType || "").toUpperCase() === "LIST" || (reportType || "").toUpperCase() === "DASHBOARD") {
          console.log("REPORT TYPE ==> ", reportType);
          console.log("Embed id:", embedID);
          
          if(!embedID){
            toast.error("Dashboard not configured!");
            return;
          }

          setCurrentEmbedId(embedID);
          setShowModal(true);
          return;
        }
         else if ((reportType || "").toUpperCase() === "GRID" || (reportType || "").toUpperCase() === "HYBRID") {
          console.log("REPORT TYPE ==> ", reportType);
            const reportFolder = import.meta.env.VITE_BIRT_REPORT_FOLDER;
            const reportPath = `${reportFolder}/${reportFileName}.rptdesign`;

            window.open(
              `${import.meta.env.VITE_BIRT_API}/frameset?__report=${encodeURIComponent(reportPath)}&__format=${
                import.meta.env.VITE_BIRT_EXPORT_FORMAT
              }`,
              "_blank"
            );
            return;
          }
          else{
            toast.error("Invalid Report Type provided.");
            return;
          }
        // ----------- SUPERSET CODE END -----------

        // ------------- BIRT CODE START -----------------
        // if ((reportType || "").toUpperCase() === "LIST") {
        //     const reportFolder = import.meta.env.VITE_BIRT_REPORT_FOLDER;
        //     const reportPath = `${reportFolder}/${reportFileName}.rptdesign`;

        //     window.open(
        //       `${import.meta.env.VITE_BIRT_API}/frameset?__report=${encodeURIComponent(reportPath)}&__format=${
        //         import.meta.env.VITE_BIRT_EXPORT_FORMAT
        //       }`,
        //       "_blank"
        //     );
        //     return;
        //   }
        //   else if ((reportType || "").toUpperCase() === "GRID") {
        //     const reportFolder = import.meta.env.VITE_BIRT_REPORT_FOLDER;
        //     const reportPath = `${reportFolder}/${reportFileName}.rptdesign`;

        //     window.open(
        //       `${import.meta.env.VITE_BIRT_API}/frameset?__report=${encodeURIComponent(reportPath)}&__format=${
        //         import.meta.env.VITE_BIRT_EXPORT_FORMAT
        //       }`,
        //       "_blank"
        //     );
        //     return;
        //   }
        //   else{
        //     toast.error("Invalid Report Type selected.");
        //     return;
        //   }
        // ------------- BIRT CODE END -----------------


        // const headers = {
        //   "Content-Type": "application/json",
        //   authorization: `Bearer ${token}`,
        // };

        // if ((reportType || "").toUpperCase() !== "LIST") {
        //   try {
        //     const response = await fetch(
        //       `${hostnameV1}/lineItems/reports/${reportId}/exists`,
        //       { headers }
        //     );

        //     if (!response.ok)
        //       return toast.error(
        //         "ERROR OCCURED TRYING TO CHECK IF REPORT EXISTS."
        //       );

        //     const data = await response.json();

        //     if (data.isExists === false)
        //       return toast.error(`Report isn't generated yet.`);
        //   } catch (error) {
        //     console.log(error);
        //     toast.error("Error occured.");
        //   }
        // }

        // try {
        //   const redirectResponse = await fetch(
        //     `${import.meta.env.VITE_BIRT_BACKEND_API
        //     }/templates/generate?report-id=${reportId}&report-name=${reportFileName}&report-type=${reportType}`
        //   );
        //   if (!redirectResponse.ok)
        //     return toast.error("ERROR OCCURED TRYING TO GENERATE REPORT.");

        //   console.log("Redirect Response: ", redirectResponse);
        //   const redirectPath = await redirectResponse.text();
        //   window.open(
        //     `${import.meta.env.VITE_BIRT_API
        //     }/frameset?__report=${redirectPath}&__format=${import.meta.env.VITE_BIRT_EXPORT_FORMAT
        //     }`,
        //     "_blank"
        //   );
        // } catch (error) {
        //   console.log(error);
        //   toast.error("Error occured trying to generate report.");
        // }
      },
    },
    {
      label: "Edit",
      icon: <Pencil size={16} />,
      onClick: (row) => console.log("Edit clicked for", row),
    },
    {
      label: "Delete",
      icon: <Trash2 size={16} />,
      onClick: (row) => console.log("Delete clicked for", row),
    },
    {
      label: "Run",
      icon: <Play size={16} fill="currentColor" />,
      onClick: (row) => console.log("Run clicked for", row),
    },
  ];

  // const columns = [
  //   { key: "s_no", label: "#" },
  //   { key: "id", label: "ID" },
  //   { key: "name", label: "Name" },
  //   { key: "description", label: "Desc" },
  //   { key: "created", label: "Created" },
  //   { key: "updated", label: "Updated" },
  //   { key: "type", label: "Type" },
  //   { label: "Action", sortable: false },
  // ];

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

      console.log("policy ids are =====>", policyIds)

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

      console.log("Reports with serial ", reportsWithSerial);
      setReportsData(reportsWithSerial);
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

  const refetchReports = () => {
    fetchReports();
  };

  // const data = [
  //   {
  //     name: 'Grid',
  //     blue: 40,
  //   },
  //   {
  //     name: 'Other',
  //     teal: 70,
  //   },
  //   {
  //     name: 'Hybrid',
  //     redStripes: 20,
  //   },
  //   {
  //     name: 'List',
  //     gray: 10,
  //   },
  // ];

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

        console.log("policy ids are =====>", policyIds)

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
            <List className={`h-5 w-5 ${isReportsLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            className="text-black shadow-lg hover:bg-[#8e78b7] hover:text-white focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7] transition-colors"
            onClick={handleCreate}
          >
            <Plus className={`h-5 w-5 ${isReportsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>


      <CardGrid cards={cards} onCardClick={handleCardClick} isLoading={isCardLoading} />


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



      <DataTable
        columns={columns}
        data={reportsData}
        actions={actions}
        isLoading={isReportsLoading}
        isError={!!reportError}
        refetch={refetchReports}
      />

      <SupersetReport
        showModal={showModal}
        setShowModal={setShowModal}
        currentReportName={currentEmbedId}
      />
    </div>
  );
};

export default ReportConfigDashboard;