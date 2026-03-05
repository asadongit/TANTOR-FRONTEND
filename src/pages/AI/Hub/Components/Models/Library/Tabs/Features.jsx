import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Icon } from "@iconify-icon/react";
import DataTable from "../../../../../../../components/DataTable";
import { StatCard, LinkCard, StatsContainer, StatsRow } from "../../../StatsCard";
import { useAuth } from "../../../../../../../context/AuthContext";
import { aithemestyle } from "../../../../../../../components/themeContext";
import features from "../../../../../../../assets/ai/view_list.svg";
import fact_check from "../../../../../../../assets/ai/fact_check.svg";
import bubble_chart from "../../../../../../../assets/ai/bubble_chart.svg";

function Features({ modelData }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [dataType, setDataType] = useState("processed");
  const [statsCards, setStatsCards] = useState([
    { title: "Features", value: "-", icon: features },
    { title: "Datapoints", value: "-", icon: bubble_chart },
  ]);
  const [sampleDrawerOpen, setSampleDrawerOpen] = useState(false);
  const [sampleDrawerTitle, setSampleDrawerTitle] = useState("");
  const [sampleDrawerValues, setSampleDrawerValues] = useState([]);
  const [openRowMenuSno, setOpenRowMenuSno] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [noDataMessage, setNoDataMessage] = useState("");
  const menuButtonRef = useRef(null);
  const hostnameAI = window._env_?.VITE_AI_API;
  const { token, decodedToken } = useAuth();

  const processedToRows = (dataObj) => {
    // Handle both formats:
    // Format 1 (flat): { "PC_1": 0.352..., "PC_2": 0.011..., ... }
    // Format 2 (nested): { "0": {feature: importance, ...}, ... }
    if (!dataObj) return [];
    const rows = [];
    
    // Check if it's nested format (value is an object) or flat format (value is a number/string)
    const isNested = Object.values(dataObj).some(val => typeof val === 'object' && val !== null);
    
    if (isNested) {
      // Format 2: nested structure
      Object.entries(dataObj).forEach(([classIdx, features], idx) => {
        Object.entries(features).forEach(([feature, importance]) => {
          rows.push({
            sno: rows.length + 1,
            class: classIdx,
            feature,
            importance,
          });
        });
      });
    } else {
      // Format 1: flat structure
      Object.entries(dataObj).forEach(([feature, importance], idx) => {
        rows.push({
          sno: idx + 1,
          feature,
          importance,
        });
      });
    }
    return rows;
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
      setNoDataMessage(""); // reset
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
        console.log("API Response:", json); // Debug: see the actual response structure
        if (
          (dataType === "processed" && !json.data) ||
          (dataType === "raw" && !json.data)
        ) {
          setTableData([]);
          setNoDataMessage(json.message || "No data available.");
          setStatsCards([
            { title: "Features", value: "-", icon: features },
          ]);
        } else if (dataType === "processed") {
          // Handle both formats:
          // Format 1 (flat): { "PC_1": importance, ... }
          // Format 2 (nested): { "0": {feature: importance, ...}, ... }
          const processedData = json.data || {};
          const rows = processedToRows(processedData);
          console.log("Transformed processed rows:", rows); // Debug
          setTableData(rows);
          
          // Count features based on format
          const isNested = Object.values(processedData).some(val => typeof val === 'object' && val !== null);
          let featureCount = 0;
          if (isNested) {
            const featureSet = new Set();
            Object.values(processedData).forEach((features) => {
              Object.keys(features).forEach((f) => featureSet.add(f));
            });
            featureCount = featureSet.size;
          } else {
            featureCount = Object.keys(processedData).length;
          }
          
          setStatsCards([
            { title: "Features", value: featureCount, icon: features },
          ]);
        } else {
          const rows = rawToRows(json.data);
          console.log("Transformed raw rows:", rows); // Debug: see the transformed data
          setTableData(rows);
          setStatsCards([
            { title: "Features", value: json.data?.no_of_features ?? "-", icon: features },
            { title: "Datapoints", value: json.data?.no_of_datapoints ?? "-", icon: bubble_chart },
          ]);
        }
      } catch (e) {
        console.error("Features fetch error:", e);
        setTableData([]);
        setNoDataMessage("No data available.");
      }
      setIsLoading(false);
    };
    fetchData();
  }, [dataType, modelData.dataset_id, hostnameAI, token]);

  const processedColumns = useMemo(() => {
    // Check if data has 'class' field (nested format) or not (flat format)
    const hasClass = tableData.length > 0 && tableData[0].class !== undefined;
    const cols = [];
    if (hasClass) {
      cols.push({ key: "class", label: "Class", sortable: true, width: "80px" });
    } else {
      cols.push({ key: "sno", label: "Sno", sortable: true, width: "90px" });
    }
    cols.push(
      { key: "feature", label: "Feature", sortable: true },
      { key: "importance", label: "Importance", sortable: true }
    );
    return cols;
  }, [tableData]);

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
              ref={isOpen ? menuButtonRef : null}
              type="button"
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
              title="More"
              onClick={(e) => {
                e.stopPropagation();
                if (!isOpen) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuPosition({
                    top: rect.bottom + window.scrollY,
                    right: window.innerWidth - rect.right,
                  });
                }
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
                <div
                  className="fixed z-20 w-32 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                  style={{
                    top: `${menuPosition.top}px`,
                    right: `${menuPosition.right}px`,
                  }}
                >
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
      <StatsContainer gradient={aithemestyle.statsCardGradient270}>
        <StatsRow
          statsCards={statsCards}
          linkCards={[
            { title: "DQ Report", icon: fact_check, style: { color: aithemestyle.iconColor } },
          ]}
          variant="default"
          gap={4}
        />
      </StatsContainer>

      <div className="flex justify-end items-center mb-2 mt-2">
        <div className="flex items-center gap-2">
          <span className="font-medium" style={{ color: aithemestyle.iconColor }}>Raw Data</span>
          <button
            type="button"
            aria-pressed={dataType === "raw"}
            onClick={() => setDataType(dataType === "raw" ? "processed" : "raw")}
            className="relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none bg-gray-200"
            style={{
              minWidth: "48px",
            }}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full shadow transform transition-transform ${
                dataType === "raw" ? "translate-x-6" : "translate-x-1"
              }`}
              style={{
                backgroundColor: dataType === "raw" ? aithemestyle.iconColor : "white",
              }}
            />
          </button>
        </div>
      </div>

      {noDataMessage ? (
        <div className="p-8 text-center text-gray-500 text-base">{noDataMessage}</div>
      ) : (
        <DataTable
          columns={dataType === "processed" ? processedColumns : rawColumns}
          data={filteredData}
          actions={[]} // No actions for feature table
          isLoading={isLoading}
          isError={false}
        />
      )}

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
