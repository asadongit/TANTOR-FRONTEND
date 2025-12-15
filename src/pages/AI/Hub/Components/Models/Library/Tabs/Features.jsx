import React, { useState, useMemo } from "react";
import { Icon } from "@iconify-icon/react";
import DataTable from "../../../../../../../components/DataTable";
import { StatCard, LinkCard, StatsContainer, StatsRow } from "../../../StatsCard";

function Features() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const statsCards = [
    { title: "Features", value: "30" },
    { title: "Data points", value: "10,000" },
  ];

  const linkCards = [
    { title: "Raw Data" },
    { title: "DQ Report" },
    { title: "Feature Impact" },
  ];

  const columns = [
    { key: "sno", label: "Sno", sortable: true, width: "90px" },
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row) => (
        <span className="text-purple-600 hover:underline cursor-pointer">
          {row.name}
        </span>
      ),
    },
    { key: "description", label: "Description", sortable: true },
    { key: "created_date", label: "Created Date", sortable: true },
    { key: "type", label: "Type", sortable: true },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <span
          className={`px-3 py-1 rounded-md text-xs font-medium ${getStatusStyle(
            row.status
          )}`}
        >
          {row.status}
        </span>
      ),
    },
    { label: "Action", sortable: false },
  ];

  const projectsData = [
    {
      sno: 1,
      name: "Project - Churn",
      description: "Churn",
      created_date: "01/10/2025",
      type: "Salish",
      status: "Deployed",
    },
    {
      sno: 2,
      name: "Project - Analysis",
      description: "Churn",
      created_date: "01/10/2025",
      type: "Salish",
      status: "Archived",
    },
    {
      sno: 3,
      name: "Project - Retention",
      description: "Retention",
      created_date: "15/11/2025",
      type: "Mekong",
      status: "Deployed",
    },
    {
      sno: 4,
      name: "Project - Acquisition",
      description: "Acquisition",
      created_date: "01/12/2025",
      type: "Amazon",
      status: "Deployed",
    },
    {
      sno: 5,
      name: "Project - Engagement",
      description: "Engagement",
      created_date: "20/12/2025",
      type: "Nile",
      status: "In progress",
    },
    {
      sno: 6,
      name: "Project - Onboarding",
      description: "Onboarding",
      created_date: "05/01/2026",
      type: "Yangtze",
      status: "Inactive",
    },
    {
      sno: 7,
      name: "Project - Feedback",
      description: "Feedback",
      created_date: "30/01/2026",
      type: "Danube",
      status: "Deployed",
    },
    {
      sno: 8,
      name: "Project - Analysis",
      description: "Analysis",
      created_date: "15/02/2026",
      type: "Thames",
      status: "Archived",
    },
    {
      sno: 9,
      name: "Project - Strategy",
      description: "Strategy",
      created_date: "01/03/2026",
      type: "Seine",
      status: "Deployed",
    },
    {
      sno: 10,
      name: "Project - Optimization",
      description: "Optimization",
      created_date: "15/03/2026",
      type: "Mississippi",
      status: "Archived",
    },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case "Deployed":
        return "bg-green-100 text-green-700";
      case "Archived":
        return "bg-gray-100 text-gray-600";
      case "In progress":
        return "bg-blue-100 text-blue-700";
      case "Inactive":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const actions = [
    {
      label: "Library",
      icon: (
        <Icon
          icon="material-symbols:library-books-outline"
          className="w-5 h-5"
        />
      ),
      onClick: (row) =>
        navigate("/ai/hub/models/library", { state: { modelData: row } }),
      tooltip: "Library",
    },
    {
      label: "F1 Mode",
      icon: <Icon icon="material-symbols:speed-outline" className="w-5 h-5" />,
      onClick: (row) => console.log("F1 Mode:", row),
      tooltip: "F1 Mode",
    },
    {
      label: "AI Canvas",
      icon: <Icon icon="material-symbols:draw-outline" className="w-5 h-5" />,
      onClick: (row) => console.log("AI Canvas:", row),
      tooltip: "AI Canvas",
    },
    {
      label: "Deploy",
      icon: (
        <Icon
          icon="material-symbols:rocket-launch-outline"
          className="w-5 h-5"
        />
      ),
      onClick: (row) => console.log("Deploy:", row),
      tooltip: "Deploy",
    },
    {
      label: "Archive",
      icon: (
        <Icon icon="material-symbols:archive-outline" className="w-5 h-5" />
      ),
      onClick: (row) => console.log("Archive:", row),
      tooltip: "Archive",
    },
    {
      label: "Delete",
      icon: <Icon icon="material-symbols:delete-outline" className="w-5 h-5" />,
      onClick: (row) => console.log("Delete:", row),
      tooltip: "Delete",
    },
  ];

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return projectsData;
    const q = searchTerm.toLowerCase();
    return projectsData.filter((row) =>
      Object.values(row || {}).some((val) =>
        String(val ?? "")
          .toLowerCase()
          .includes(q)
      )
    );
  }, [searchTerm, projectsData]);

  return (
    <div>
      <StatsContainer gradient="from-purple-400 via-purple-300 to-purple-100">
        <StatsRow
          statsCards={statsCards}
          linkCards={linkCards}
          variant="default"
          gap={4}
        />
      </StatsContainer>

      <DataTable
        columns={columns}
        data={filteredData}
        actions={actions}
        isLoading={isLoading}
        isError={false}
      />
    </div>
  );
}

export default Features;
