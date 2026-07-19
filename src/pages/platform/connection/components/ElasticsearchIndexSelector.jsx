import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  AlertCircle,
  Loader2,
  Table2,
  ListFilter,
} from "lucide-react";

const ElasticsearchIndexSelector = ({
  isTestSuccessful,
  indices = [],
  isLoadingIndices = false,
  selectedIndices = [],
  onSelectedIndicesChange,
  hasError = false,
}) => {
  const [search, setSearch] = useState("");
  const prevTestRef = useRef(false);

  useEffect(() => {
    if (!isTestSuccessful && prevTestRef.current) {
      setSearch("");
      onSelectedIndicesChange([]);
    }
    prevTestRef.current = isTestSuccessful;
  }, [isTestSuccessful]);

  const filtered = (
    search
      ? indices.filter((t) => t.toLowerCase().includes(search.toLowerCase()))
      : indices
  ).slice().sort((a, b) => {
    const aSelected = selectedIndices.includes(a);
    const bSelected = selectedIndices.includes(b);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return a.localeCompare(b);
  });

  const allSelected =
    filtered.length > 0 && filtered.every((t) => selectedIndices.includes(t));
  const someSelected = filtered.some((t) => selectedIndices.includes(t));

  const toggle = (index) => {
    const next = selectedIndices.includes(index)
      ? selectedIndices.filter((t) => t !== index)
      : [...selectedIndices, index];
    onSelectedIndicesChange(next);
  };

  const selectAll = () => {
    const next = Array.from(new Set([...selectedIndices, ...filtered]));
    onSelectedIndicesChange(next);
  };

  const clearAll = () => {
    if (search) {
      const filteredSet = new Set(filtered);
      onSelectedIndicesChange(selectedIndices.filter((t) => !filteredSet.has(t)));
    } else {
      onSelectedIndicesChange([]);
    }
  };

  if (!isTestSuccessful) {
    return (
      <div className="col-span-3 mt-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Indices <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3 px-4 py-3 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <Table2 size={15} className="text-gray-300 shrink-0" />
          <p className="text-sm text-gray-400">
            Run a successful{" "}
            <span className="font-medium text-gray-500">Test Connection</span>{" "}
            to load available indices
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingIndices) {
    return (
      <div className="col-span-3 mt-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Indices <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3 px-4 py-3 border border-[#c4b8e8] border-dashed rounded-lg bg-[#faf8fe]">
          <Loader2 size={15} className="text-[#8e78b7] shrink-0 animate-spin" />
          <span className="text-sm text-[#8e78b7]">
            Fetching indices from Elasticsearch…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-3 mt-2">
      {/* Label + selected badge */}
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">
          Indices <span className="text-red-500">*</span>
        </label>
        {selectedIndices.length > 0 && (
          <span className="text-xs bg-[#f0eafa] text-[#8e78b7] px-2.5 py-0.5 rounded-md font-medium">
            {selectedIndices.length} selected
          </span>
        )}
      </div>

      {/* Empty state */}
      {indices.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-3 border border-dashed border-gray-200 rounded-lg bg-gray-50">
          <ListFilter size={15} className="text-gray-300 shrink-0" />
          <p className="text-sm text-gray-400">
            No indices found in this Elasticsearch cluster.
          </p>
        </div>
      ) : (
        <div
          className={`border rounded-lg overflow-hidden transition-colors ${
            hasError ? "border-red-400" : "border-gray-200"
          }`}
        >
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected && !allSelected;
              }}
              onChange={() => (allSelected ? clearAll() : selectAll())}
              disabled={indices.length === 0}
              title={allSelected ? "Deselect all" : "Select all"}
              className="w-3 h-3 accent-[#8e78b7] cursor-pointer shrink-0 disabled:opacity-30"
            />
            <Search size={13} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search indices…"
              className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400 min-w-0"
            />
            {search ? (
              <>
                <span className="text-xs text-gray-400 shrink-0">
                  {filtered.length}/{indices.length}
                </span>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <X size={13} />
                </button>
              </>
            ) : (
              <span className="text-xs text-gray-400 shrink-0">
                {indices.length} index{indices.length !== 1 ? "es" : ""}
              </span>
            )}
            {someSelected && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-[#8e78b7] hover:underline shrink-0 font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Index rows */}
          <div className="overflow-y-auto max-h-[220px] divide-y divide-gray-100 scrollbar-thin scrollbar-thumb-[#c4b8e8] scrollbar-track-transparent bg-white">
            {filtered.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-gray-400">
                  No indices match &ldquo;{search}&rdquo;
                </p>
              </div>
            ) : (
              filtered.map((index) => {
                const isChecked = selectedIndices.includes(index);
                return (
                  <label
                    key={index}
                    className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors group select-none ${
                      isChecked
                        ? "bg-[#faf8fe] hover:bg-[#f5f2fd]"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(index)}
                      className="w-3 h-3 accent-[#8e78b7] cursor-pointer shrink-0"
                    />
                    <span
                      className={`flex-1 text-sm truncate min-w-0 font-mono ${
                        isChecked
                          ? "text-[#6b52a8] font-medium"
                          : "text-gray-600"
                      }`}
                    >
                      {index}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}

      {hasError && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <AlertCircle size={12} />
          At least one index must be selected
        </p>
      )}
    </div>
  );
};

export default ElasticsearchIndexSelector;
