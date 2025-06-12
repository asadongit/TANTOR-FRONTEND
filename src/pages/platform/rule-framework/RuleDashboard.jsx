import React from "react";
import {
  Pencil,
  Trash2,
  List,
  Play,
  Download,
  Plus  
} from "lucide-react";

import { LineChart } from "@mui/x-charts/LineChart";

import { useNavigate } from "react-router-dom";
import { encrypt } from "../../../utils/Crypto";
import DataTable from "../../../components/DataTable";
import { useProjectData } from "../../../hooks/platform/project";
import { useProjectCardData } from "../../../hooks/platform/cardCounts";
import { useRuleData } from "../../../hooks/platform/rules";



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

const RuleDashboard = () => {
  const { data: cardData, isLoading: isCardLoading, error: cardError, refetch: refetchCardData } = useProjectCardData();
  const { data: ruleData = [], isLoading: isRuleLoading, error: ruleError, refetch: refetchRules } = useRuleData();


  const navigate = useNavigate();

  
  const handleRefresh = () => {
    refetchRules();
    refetchCardData();
  };


  const handleCreate = () => {
    navigate("/config/rule/create-rule");
  };





  const cards = [
    {
        title: "Total",
        count: cardData?.purge || 0,
      },
      {
        title: "Active",
        count: cardData?.metadata || 0,
      },
    {
        title: "Draft",
        count: cardData?.federation || 0,
      },
      {
        title: "Disabled",
        count: cardData?.migration || 0,
      },
  ];


  const actions = [
      {
        label: "Edit",
        icon: <Pencil size={16} />,
        onClick: (row) => console.log("Edit clicked for", row),
      },
      // {
      //   label: "Delete",
      //   icon: <Trash2 size={16} />,
      //   onClick: (row) => console.log("Delete clicked for", row),
      // },
      // {
      //   label: "Run",
      //   icon: <Play size={16} fill="currentColor" />,
      //   onClick: (row) => console.log("Run clicked for", row),
      // },
    ];
  
  const columns = [
    { key: "s_no", label: "#" },
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "description", label: "Desc" },
    { key: "created", label: "Created" },
    { key: "updated", label: "Updated" },
    { key: "reports", label: "Reports" },
    { label: "Action", sortable: false },
  ];
  
  const handleCardClick = (card) => {
    const url = `/componentType=project&cardType=${card.title}&heading=${card.title}`;
    const encryptedUrl = encodeURIComponent(encrypt(url));
    navigate(`/details?${encryptedUrl}`);
  };

  return (
    <div className="p-6">
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Rules</h1>
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
            <List className={`h-5 w-5 ${isRuleLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            className="text-black shadow-lg hover:bg-[#8e78b7] hover:text-white focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7] transition-colors"
            onClick={handleCreate}
          >
            <Plus className={`h-5 w-5 ${isRuleLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

   
        <CardGrid cards={cards} onCardClick={handleCardClick} isLoading={isCardLoading}/> 


        {/* Chart container */}
      <div className="mt-6 w-full md:w-2/5">
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
      </div>
    

     
        <DataTable
          columns={columns}
          data={ruleData}
          actions={actions}
          isLoading={isRuleLoading}
          isError={!!ruleError}
          refetch={refetchRules}
/>
    </div>
  );
};

export default RuleDashboard;