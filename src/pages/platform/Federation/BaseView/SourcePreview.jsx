import React, { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUpDown, GripVertical } from "lucide-react";

const SourcePreview = ({ previewData, setPreviewData, setShowPreview, toggleModal }) => {
  const tableColumnNames = Object.keys(previewData[0]);

  const [colOrder, setColOrder] = useState(tableColumnNames.map((_, i) => i));
  const [dragOverCol, setDragOverCol] = useState(null);
  const dragSrcCol = useRef(null);
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });

  const scrollContainerRef = useRef(null);
  const autoScrollRAF = useRef(null);
  const dragClientX = useRef(0);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRAF.current) {
      cancelAnimationFrame(autoScrollRAF.current);
      autoScrollRAF.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    const step = () => {
      const el = scrollContainerRef.current;
      if (!el) return;
      const { left, right, width } = el.getBoundingClientRect();
      const ZONE = width * 0.12;
      const MAX_SPEED = 18;
      let speed = 0;
      if (dragClientX.current < left + ZONE) {
        speed = -MAX_SPEED * (1 - (dragClientX.current - left) / ZONE);
      } else if (dragClientX.current > right - ZONE) {
        speed = MAX_SPEED * (1 - (right - dragClientX.current) / ZONE);
      }
      if (speed !== 0) el.scrollLeft += speed;
      autoScrollRAF.current = requestAnimationFrame(step);
    };
    autoScrollRAF.current = requestAnimationFrame(step);
  }, [stopAutoScroll]);

  useEffect(() => {
    setColOrder(tableColumnNames.map((_, i) => i));
    setSortConfig({ key: "", direction: "asc" });
  }, [previewData]);

  useEffect(() => () => stopAutoScroll(), [stopAutoScroll]);

  const orderedCols = colOrder.map(i => tableColumnNames[i]);

  const handleColDragStart = (e, vi) => {
    dragSrcCol.current = vi;
    e.dataTransfer.effectAllowed = "move";
    startAutoScroll();
  };

  const handleColDragOver = (e, vi) => {
    e.preventDefault();
    dragClientX.current = e.clientX;
    setDragOverCol(vi);
  };

  const handleTableDragOver = (e) => {
    e.preventDefault();
    dragClientX.current = e.clientX;
  };

  const handleColDrop = (e, vi) => {
    e.preventDefault();
    const src = dragSrcCol.current;
    if (src === null || src === vi) { setDragOverCol(null); return; }
    const next = [...colOrder];
    const [m] = next.splice(src, 1);
    next.splice(vi, 0, m);
    setColOrder(next);
    setDragOverCol(null);
    dragSrcCol.current = null;
  };

  const handleColDragEnd = () => {
    setDragOverCol(null);
    dragSrcCol.current = null;
    stopAutoScroll();
  };

  const handleSort = (key) =>
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));

  const sortedData = [...previewData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const av = a[sortConfig.key], bv = b[sortConfig.key];
    if (typeof av === "number" && typeof bv === "number")
      return sortConfig.direction === "asc" ? av - bv : bv - av;
    return sortConfig.direction === "asc"
      ? String(av ?? "").localeCompare(String(bv ?? ""))
      : String(bv ?? "").localeCompare(String(av ?? ""));
  });

  const toTitleCase = s =>
    s.replace(/_/g, " ").toLowerCase().replace(/\w/g, c => c.toUpperCase());

  return (
    <div className="fixed inset-x-0 bottom-0 h-[50vh] bg-white flex flex-col">
      <div className="p-4 pb-2 bg-white border-b">
        <p className="text-lg font-semibold mb-0">Output Preview</p>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-auto mx-1"
      >
        <div className="relative mx-1">
          <table
            className="w-full bg-white"
            style={{ borderCollapse: "collapse" }}
            onDragOver={handleTableDragOver}
          >
            <thead className="border-b border-gray-200">
              <tr>
                {orderedCols.map((col, vi) => (
                  <th
                    key={col}
                    draggable
                    onDragStart={e => handleColDragStart(e, vi)}
                    onDragOver={e => handleColDragOver(e, vi)}
                    onDrop={e => handleColDrop(e, vi)}
                    onDragEnd={handleColDragEnd}
                    title={toTitleCase(col)}
                    onClick={() => handleSort(col)}
                    style={{
                      background: "#F9F9F9",
                      color: "#332849",
                      padding: "12px 16px",
                      fontSize: "13px",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      maxWidth: "160px",
                      overflow: "hidden",
                      cursor: "grab",
                      userSelect: "none",
                      borderLeft: dragOverCol === vi ? "2px solid #8e78b7" : "2px solid transparent",
                      transition: "border-color 0.15s ease, background 0.15s ease",
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      textAlign: "left",
                      verticalAlign: "middle",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                      <GripVertical size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                        {toTitleCase(col)}
                      </span>
                      <ArrowUpDown
                        size={13}
                        style={{ flexShrink: 0, opacity: sortConfig.key === col ? 1 : 0.5 }}
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: "1px solid #e5e5e5" }} className="hover:bg-gray-50">
                  {orderedCols.map((col, ci) => {
                    const val = row[col];
                    const isLink = typeof val === "string" && val.startsWith("http");
                    return (
                      <td
                        key={ci}
                        title={String(val ?? "")}
                        style={{
                          padding: "11px 16px",
                          fontSize: "14px",
                          color: "#23252D",
                          whiteSpace: "nowrap",
                          maxWidth: "260px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          verticalAlign: "middle",
                        }}
                      >
                        {isLink
                          ? <a href={val} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">{val}</a>
                          : (val === 0 ? 0 : val ?? "-")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 border-t shadow-lg flex justify-end gap-4 bg-white">
        <button
          onClick={() => setShowPreview(false)}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={toggleModal}
          className="px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[rgb(142,119,187,0.8)]"
        >
          Create a View
        </button>
      </div>
    </div>
  );
};

export default SourcePreview;