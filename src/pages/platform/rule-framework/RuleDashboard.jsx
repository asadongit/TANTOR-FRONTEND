import React, { useEffect, useState, useRef } from "react";
import {
  Pencil,
  Trash2,
  List,
  Play,
  Download,
  RefreshCcw,
  Plus,
  EyeIcon,
  Search,
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import { Icon } from "@iconify-icon/react";

import { LineChart } from "@mui/x-charts/LineChart";

import { useNavigate } from "react-router-dom";
import { encrypt } from "../../../utils/Crypto";
import DataTable from "../../../components/DataTable";
import { useAuth } from "../../../context/AuthContext";
import { CardGrid } from "../../../components/ReportingCardGrid";
import toast from "react-hot-toast";
import RuleSummary from "./RuleSummary";
import { useRuleData } from "../../../hooks/platform/reportingframework/rules";
import { useRulesCardData } from "../../../hooks/platform/cardCounts";
import Breadcrumb from "../../../components/Breadcrumb";
const RuleDashboard = () => {
  const { hostnameV1, token, decodedToken } = useAuth();

  const [showRuleSummary, setShowRuleSummary] = useState(false);
  const [ruleSummaryData, setRuleSummaryData] = useState({});

  const [ruleData, setRuleData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [viewMode, setViewMode] = useState("list");





  const [resetSortTrigger, setResetSortTrigger] = useState(0);
  const handleClearSort = () => {
    setResetSortTrigger(prev => prev + 1);
  };

  const {
    data: ruleList = [],
    isLoading: isRuleLoading,
    isFetching: isRuleFetching,
    isError: ruleError,
    refetch: refetchRules,
  } = useRuleData();

  const {
    data: cardData,
    isLoading: isCardLoading,
    error: cardError,
    refetch: refetchCardData,
  } = useRulesCardData();

  // Filter active rules. Filter rules by search
  useEffect(() => {
    let updatedRuleList = ruleList
      .filter((row) => row?.status?.toLowerCase() === "active")
      .map((row, index) => ({ ...row, s_no: index + 1 }));

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      updatedRuleList = updatedRuleList.filter((row) =>
        Object.values(row).some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(lowerSearch)
        )
      );
    }
    setRuleData(updatedRuleList);
  }, [ruleData, searchTerm]);

  const navigate = useNavigate();

  const handleRefresh = () => {
    refetchCardData();
    refetchRules();
    setSearchTerm("");
    handleClearSort();
  };



  const handleCreate = () => {
    navigate("/config/rule/create-rule", { state: { mode: "CREATE" } });
  };

  const cards = [
    {
      title: "Total",
      count: cardData?.total || 0,
    },
    {
      title: "Active",
      count: cardData?.active || 0,
    },
    {
      title: "Draft",
      count: cardData?.draft || 0,
    },
    {
      title: "Disabled",
      count: cardData?.disabled || 0,
    },
  ];

  const actions = [
    {
      label: "View",
      icon: <EyeIcon size={16} />,
      onClick: (row) => {
        const ruleId = row.id;
        if (!ruleId) {
          toast.error("Rule ID not provided.");
          return;
        }

        (async () => {
          try {
            const headers = {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            };
            const response = await fetch(
              `${window._env_?.VITE_REPORTING_BACKEND_API}/ruleJson?rule_id=${ruleId}`,
              { headers }
            );

            if (!response.ok) {
              const errorData = await response.json().catch(() => null);
              throw new Error(
                errorData?.detail ||
                "Error occured while trying to display rule."
              );
            }

            const ruleJson = await response.json();

            if (ruleJson === null) throw new Error("Rule JSON not found!");

            const sourceNode = ruleJson.find((nd) => nd.type === "source");

            if (!sourceNode) throw new Error("Invalid Rule JSON!");

            setRuleSummaryData({
              nodeId: sourceNode.id,
              selectedFact: sourceNode.data.selectedFact,
              filterConditions: sourceNode.data.filterConditions,
              ruleName: sourceNode.data.ruleName,
              ruleId: sourceNode.data.ruleId,
              ruleDescription: sourceNode.data.ruleDescription,
              dimensionFilters: sourceNode.data.dimensionFilters || [],
              timeTransformationFilters:
                sourceNode.data.timeTransformationFilters || [],
              nodes: ruleJson,
            });

            setShowRuleSummary(true);
          } catch (error) {
            console.error(error);
            toast.error(error.message);
          }
        })();
      },
    },
    {
      label: "Edit",
      icon: <Pencil size={16} />,
      onClick: (row) => {
        navigate("/config/rule/edit-rule", {
          state: { mode: "EDIT", ruleData: { ...row } },
        });
      },
    },
  ];

  const columns = [
    { key: "s_no", label: "#" },
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "description", label: "Desc" },
    {
      key: "created",
      label: "Created",
      render: (row) => (
        <span className="text-sm text-gray-700">{row.created}</span>
      ),
    },
    {
      key: "updated",
      label: "Updated",
      render: (row) => (
        <span className="text-sm text-gray-700">{row.updated}</span>
      ),
    },
    // { key: "reports", label: "Reports" },
    { label: "Action", sortable: false },
  ];

  const handleCardClick = (card) => {
    const cardType = "rules";

    if (card?.title?.toLowerCase() === "disabled") return;

    const url =
      card?.title?.toLowerCase() === "total"
        ? `componentType=rules&cardType=${cardType}&heading=${card.title}`
        : `componentType=rules&cardType=${cardType}&heading=${card.title}&dataScope=${card.title}`;

    const encryptedUrl = encodeURIComponent(encrypt(url));
    navigate(`/details?${encryptedUrl}`);
  };

  const RuleMovement = () => {
    const chartData = [
      { day: "1 day", Total: 20, Active: 15, Draft: 12, Disabled: 18 },
      { day: "2 day", Total: 25, Active: 8, Draft: 18, Disabled: 20 },
      { day: "3 day", Total: 22, Active: 15, Draft: 10, Disabled: 23 },
      { day: "4 day", Total: 27, Active: 12, Draft: 18, Disabled: 23 },
      { day: "5 day", Total: 26, Active: 10, Draft: 14, Disabled: 20 },
      { day: "6 day", Total: 24, Active: 9, Draft: 14, Disabled: 25 },
      { day: "7 day", Total: 20, Active: 17, Draft: 17, Disabled: 26 },
    ];

    const colors = {
      Total: "#ff9999",
      Active: "#9999ff",
      Draft: "#66cccc",
      Disabled: "#99cc99",
      // Transformations: '#ffcc66'
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Icon
            icon="material-symbols:trending-up"
            className="w-5 h-5 text-[#8d77ba]"
          />
          <h3 className="text-lg font-semibold text-gray-800">Rule Movement</h3>
        </div>

        <div className="relative h-100% mb-4">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* Y-axis labels */}
            {[30, 25, 20, 15, 10, 5].map((value, index) => (
              <g key={value}>
                <text
                  x="15"
                  y={30 + index * 25}
                  className="text-xs fill-gray-500"
                  textAnchor="middle"
                >
                  {value}
                </text>
                <line
                  x1="25"
                  y1={30 + index * 25}
                  x2="370"
                  y2={30 + index * 25}
                  stroke="#f0f0f0"
                  strokeWidth="1"
                />
              </g>
            ))}

            {/* X-axis labels */}
            {chartData.map((item, index) => (
              <text
                key={index}
                x={50 + index * 50}
                y="190"
                className="text-xs fill-gray-500"
                textAnchor="middle"
              >
                {item.day}
              </text>
            ))}

            {/* Data lines */}
            {Object.keys(colors).map((key) => {
              const points = chartData
                .map((item, index) => {
                  const x = 50 + index * 50;
                  const y = 180 - item[key] * 5;
                  return `${x},${y}`;
                })
                .join(" ");

              return (
                <g key={key}>
                  <polyline
                    points={points}
                    fill="none"
                    stroke={colors[key]}
                    strokeWidth="2"
                  />
                  {chartData.map((item, index) => (
                    <circle
                      key={index}
                      cx={50 + index * 50}
                      cy={180 - item[key] * 5}
                      r="3"
                      fill={colors[key]}
                    />
                  ))}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          {Object.entries(colors).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-gray-600">{key}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const SchemaOverallScore = () => {
    const schemaData = {
      highest: [
        { name: "Oracle_1", score: "97%" },
        { name: "Oracle_1", score: "97%" },
        { name: "Oracle_1", score: "97%" },
        { name: "Oracle_1", score: "97%" },
        { name: "Oracle_1", score: "97%" },
      ],
      lowest: [
        { name: "Oracle_1", score: "97%" },
        { name: "Oracle_1", score: "97%" },
        { name: "Oracle_1", score: "97%" },
        { name: "Oracle_1", score: "97%" },
        { name: "Oracle_1", score: "97%" },
      ],
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Icon
            icon="material-symbols:bar-chart"
            className="w-5 h-5 text-[#8d77ba]"
          />
          <h3 className="text-lg font-semibold text-gray-800">
            Schema overall score
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium mb-3 inline-block">
              Highest
            </div>
            <div className="space-y-2">
              {schemaData.highest.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-gray-700 text-sm">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{item.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-sm font-medium mb-3 inline-block">
              Lowest
            </div>
            <div className="space-y-2">
              {schemaData.lowest.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-gray-700 text-sm">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{item.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="p-6">
      <Breadcrumb title="Platform" link={"/"} />
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Rules</h1>
        <div className="flex items-center gap-2">

          <div className="relative flex items-center">
            <button
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-400 hover:bg-gray-50 transition-colors"
              onClick={handleRefresh}
              title="Refresh data"
              disabled={isRuleFetching}
            >
              <RefreshCcw
                className={`h-5 w-5 text-gray-600 ${isRuleFetching ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          <button
            className={`w-10 h-10 flex items-center justify-center rounded-lg border ${viewMode === "list"
              ? "bg-gray-100 border-gray-500"
              : "border-gray-400"
              } hover:bg-gray-50`}
            onClick={() => setViewMode(viewMode === "list" ? "both" : "list")}
            title={viewMode === "list" ? "Show All Views" : "Show List Only"}
          >
            <Icon
              icon="material-symbols-light:format-list-bulleted"
              width="24"
              height="24"
              className="text-[#8d77ba]"
            />
          </button>

          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg bg-[#8d77ba] text-white flex items-center gap-2 hover:bg-opacity-90 transition-colors h-10"
          >
            <Icon
              icon="material-symbols:add"
              width="20"
              height="20"
              className="text-white"
            />
            <span className="text-sm font-medium">Create</span>
          </button>
        </div>
      </div>

      {viewMode === "both" && (<CardGrid
        cards={cards}
        onCardClick={handleCardClick}
        isLoading={isCardLoading}
      />)}

      {/* Chart container */}
      {/* <div className="mt-6 w-full md:w-2/5">
        <LineChart
          width={500}
          height={300}
          series={[
            {
              curve: "linear",
              data: cards.map(card => card.count),
              label: "Rules Status",
              showMarkers: true,
            },
          ]}
          xAxis={[
            {
              scaleType: "point",
              data: cards.map(card => card.title),
              label: "Status Types",
            },
          ]}
          yAxis={[
            {
              label: "Count",
            },
          ]}
          sx={{
            '.MuiLineElement-root': {
              stroke: '#8e78b7',
              strokeWidth: 2,
            },
            '.MuiMarkers-root': {
              fill: '#8e78b7',
              strokeWidth: 0,
            },
            '.MuiChartsAxis-label': {
              fill: '#6b7280',
            }
          }}
        />
      </div> */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6"> */}
      {/* <RuleMovement /> */}
      {/* <SchemaOverallScore /> */}
      {/* </div> */}

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
        data={ruleData}
        actions={actions}
        isLoading={isRuleLoading}
        isError={!!ruleError}
        refetch={refetchRules}
        resetSortTrigger={resetSortTrigger}
      />

      {showRuleSummary && (
        <RuleSummary
          setIsOpen={setShowRuleSummary}
          mode={"DISPLAY"}
          {...ruleSummaryData}
        />
      )}
    </div>
  );
};

export default RuleDashboard;
