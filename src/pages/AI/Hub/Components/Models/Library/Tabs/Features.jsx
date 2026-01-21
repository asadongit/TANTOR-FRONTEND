import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  const [sampleDrawerOpen, setSampleDrawerOpen] = useState(false);
  const [sampleDrawerTitle, setSampleDrawerTitle] = useState("");
  const [sampleDrawerValues, setSampleDrawerValues] = useState([]);
  const [openRowMenuSno, setOpenRowMenuSno] = useState(null);
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
      samples: Array.isArray(meta.samples) ? meta.samples : [], // keep as array (drawer uses it)
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
    {
      key: "__menu",
      label: "",
      sortable: false,
      width: "60px",
      render: (row) => {
        const isOpen = openRowMenuSno === row?.sno;
        return (
          <div className="relative flex justify-end">
            <button
              type="button"
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
              title="More"
              onClick={(e) => {
                e.stopPropagation();
                setOpenRowMenuSno((prev) => (prev === row?.sno ? null : row?.sno));
              }}
            >
              <Icon icon="material-symbols:more-vert" className="w-5 h-5" />
            </button>

            {isOpen && (
              <>
                {/* click-catcher to close */}
                <button
                  type="button"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setOpenRowMenuSno(null)}
                  aria-label="Close menu"
                />
                <div className="absolute right-0 top-9 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => {
                      setOpenRowMenuSno(null);
                      openSampleDrawer(row?.name, row?.samples);
                    }}
                    disabled={!Array.isArray(row?.samples) || row.samples.length === 0}
                  >
                    Sample values
                  </button>
                </div>
              </>
            )}
          </div>
        );
      },
    },
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

  const closeSampleDrawer = useCallback(() => setSampleDrawerOpen(false), []);
  const openSampleDrawer = useCallback((featureName, samples) => {
    setSampleDrawerTitle(featureName || "Sample Values");
    setSampleDrawerValues(Array.isArray(samples) ? samples : []);
    setSampleDrawerOpen(true);
  }, []);

  // Close drawer/menu on ESC
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpenRowMenuSno(null);
        setSampleDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

      {/* Right Drawer: Sample Values */}
      {sampleDrawerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeSampleDrawer}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 h-full w-[420px] max-w-[90vw] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  Sample Values
                </div>
                <div className="text-xs text-gray-500 truncate" title={sampleDrawerTitle}>
                  {sampleDrawerTitle}
                </div>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
                onClick={closeSampleDrawer}
                title="Close"
              >
                <Icon icon="material-symbols:close" className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {(!sampleDrawerValues || sampleDrawerValues.length === 0) ? (
                <div className="p-4 text-sm text-gray-500">No sample values available.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {sampleDrawerValues.map((v, i) => (
                    <div key={`${String(v)}-${i}`} className="px-4 py-3 text-sm text-gray-800">
                      {String(v)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Features;
