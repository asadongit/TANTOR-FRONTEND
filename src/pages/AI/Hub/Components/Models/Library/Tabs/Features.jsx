import React, { useState, useMemo, useEffect } from "react";
import { Icon } from "@iconify-icon/react";
import DataTable from "../../../../../../../components/DataTable";
import { StatCard, LinkCard, StatsContainer, StatsRow } from "../../../StatsCard";
import { useAuth } from "../../../../../../../context/AuthContext";

function Features({ modelData }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [dataType, setDataType] = useState("processed");
  const [statsCards, setStatsCards] = useState([
    { title: "Features", value: "-" },
    { title: "Data points", value: "-" },
  ]);
    const hostnameAI = window._env_?.VITE_AI_API;
    const { token, decodedToken } = useAuth();


  const processedToRows = (dataObj) => {
    if (!dataObj) return [];
    return Object.entries(dataObj).map(([name, value], idx) => ({
      sno: idx + 1,
      name,
      description: "",
      created_date: "",
      type: "",
      status: "",
      value,
    }));
  };

  // Helper to transform raw API data to table rows
  const rawToRows = (dataObj) => {
    if (!dataObj) return [];
    // Remove summary keys
    const { no_of_features, no_of_datapoints, ...features } = dataObj;
    return Object.entries(features).map(([name, meta], idx) => ({
      sno: idx + 1,
      name,
      description: meta.type,
      created_date: "",
      type: meta.type,
      status: "",
      missing_count: meta.missing_count,
      unique_count: meta.unique_count,
      mode: meta.mode,
      mean: meta.mean,
      std: meta.std,
      min: meta.min,
      max: meta.max,
      median: meta.median,
      samples: Array.isArray(meta.samples) ? meta.samples.slice(0, 3).join(", ") : "",
    }));
  };

  // Fetch API data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${hostnameAI}/canvas/dataset/metadata/raw/processed?data_type=${dataType}&dataset_id=${modelData.dataset_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const json = await res.json();
        if (dataType === "processed") {
          const featureImportance = json.data?.feature_importance || {};
          setTableData(processedToRows(featureImportance));
          setStatsCards([
            { title: "Features", value: Object.keys(featureImportance).length },
            { title: "Data points", value: "-" },
          ]);
        } else {
          setTableData(rawToRows(json.data));
          setStatsCards([
            { title: "Features", value: json.data?.no_of_features ?? "-" },
            { title: "Data points", value: json.data?.no_of_datapoints ?? "-" },
          ]);
        }
      } catch (e) {
        setTableData([]);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [dataType, modelData.dataset_id, hostnameAI, token]);

  const processedColumns = [
    { key: "sno", label: "Sno", sortable: true, width: "90px" },
    { key: "name", label: "Name", sortable: true },
    { key: "value", label: "Importance", sortable: true },
  ];

  const rawColumns = [
    { key: "sno", label: "Sno", sortable: true, width: "90px" },
    { key: "name", label: "Name", sortable: true },
    { key: "type", label: "Type", sortable: true },
    { key: "missing_count", label: "Missing", sortable: true },
    { key: "unique_count", label: "Unique", sortable: true },
    { key: "mode", label: "Mode", sortable: true },
    { key: "mean", label: "Mean", sortable: true },
    { key: "std", label: "Std", sortable: true },
    { key: "min", label: "Min", sortable: true },
    { key: "max", label: "Max", sortable: true },
    { key: "median", label: "Median", sortable: true },
    { key: "samples", label: "Samples", sortable: false },
  ];

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return tableData;
    const q = searchTerm.toLowerCase();
    return tableData.filter((row) =>
      Object.values(row || {}).some((val) =>
        String(val ?? "")
          .toLowerCase()
          .includes(q)
      )
    );
  }, [searchTerm, tableData]);

  return (
    <div>
      <StatsContainer gradient="from-purple-400 via-purple-300 to-purple-100">
        <StatsRow
          statsCards={statsCards}
          linkCards={[
            { title: "Raw Data" },
            { title: "DQ Report" },
            { title: "Feature Impact" },
          ]}
          variant="default"
          gap={4}
        />
      </StatsContainer>

      <div className="flex justify-end items-center mb-2 mt-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-purple-600">Raw Data</span>
          <button
            type="button"
            aria-pressed={dataType === "raw"}
            onClick={() => setDataType(dataType === "raw" ? "processed" : "raw")}
            className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none ${
              dataType === "raw" ? "bg-purple-400" : "bg-gray-200"
            }`}
            style={{ minWidth: "48px" }}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                dataType === "raw" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <DataTable
        columns={dataType === "processed" ? processedColumns : rawColumns}
        data={filteredData}
        actions={[]} // No actions for feature table
        isLoading={isLoading}
        isError={false}
      />
    </div>
  );
}

export default Features;
