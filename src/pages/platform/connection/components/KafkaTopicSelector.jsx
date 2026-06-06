import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Tag,
  ListFilter,
} from "lucide-react";

const KafkaTopicSelector = ({
  formData,
  hostnameV1,
  token,
  isTestSuccessful,
  selectedTopics = [],
  onSelectedTopicsChange,
  hasError = false,
  savedTopics = [],
}) => {
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState("");
  const [hasFetched, setHasFetched] = useState(false);
  const prevTestRef = useRef(false);

  const fetchTopics = async () => {
    setIsLoading(true);
    setFetchError(null);

    const excludedKeys = [
      "created_at", "updated_at", "is_deleted", "table_count",
      "connection_id", "is_viewed",
    ];
    const filteredData = Object.fromEntries(
      Object.entries(formData).filter(
        ([key, value]) =>
          !excludedKeys.includes(key) && value !== null && value !== undefined
      )
    );

    const body = new URLSearchParams();
    body.append("connection_json", JSON.stringify(filteredData));

    try {
      const res = await fetch(`${hostnameV1}/kafka/topics`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : data.topics ?? data.topic_names ?? [];

        setTopics(list);
        setHasFetched(true);

        if (savedTopics.length > 0) {
          const listSet = new Set(list);
          const preselect = savedTopics.filter((t) => listSet.has(t));
          if (preselect.length > 0) {
            onSelectedTopicsChange(preselect);
          }
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setFetchError(err.detail || err.message || "Failed to fetch topics.");
      }
    } catch {
      setFetchError("Network error while fetching topics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isTestSuccessful && !prevTestRef.current) {
      fetchTopics();
    }
    if (!isTestSuccessful && prevTestRef.current) {
      setTopics([]);
      setHasFetched(false);
      setFetchError(null);
      setSearch("");
      onSelectedTopicsChange([]);
    }
    prevTestRef.current = isTestSuccessful;
  }, [isTestSuccessful]);

  const toggle = (topic) => {
    const next = selectedTopics.includes(topic)
      ? selectedTopics.filter((t) => t !== topic)
      : [...selectedTopics, topic];
    onSelectedTopicsChange(next);
  };

  const selectAll = () => onSelectedTopicsChange([...topics]);
  const clearAll  = () => onSelectedTopicsChange([]);

  const filtered = search
    ? topics.filter((t) => t.toLowerCase().includes(search.toLowerCase()))
    : topics;

  const allSelected  = topics.length > 0 && topics.every((t) => selectedTopics.includes(t));
  const someSelected = topics.some((t) => selectedTopics.includes(t));

  if (!isTestSuccessful) {
    return (
      <div className="col-span-3 mt-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Topics <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3 px-4 py-3 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <Tag size={15} className="text-gray-300 shrink-0" />
          <p className="text-sm text-gray-400">
            Run a successful{" "}
            <span className="font-medium text-gray-500">Test Connection</span>{" "}
            to load available topics
            {savedTopics.length > 0 && (
              <span className="text-gray-400">
                {" "}— your {savedTopics.length} previously selected topic
                {savedTopics.length !== 1 ? "s" : ""} will be pre-selected
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="col-span-3 mt-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Topics <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3 px-4 py-3 border border-[#c4b8e8] border-dashed rounded-lg bg-[#faf8fe]">
          <Loader2 size={15} className="text-[#8e78b7] shrink-0 animate-spin" />
          <span className="text-sm text-[#8e78b7]">
            Fetching topics from broker...
          </span>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="col-span-3 mt-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Topics <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3 p-3 border border-red-200 rounded-lg bg-red-50">
          <AlertCircle size={15} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600 flex-1">{fetchError}</p>
          <button
            type="button"
            onClick={fetchTopics}
            className="text-sm text-red-500 hover:underline shrink-0 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-3 mt-2">
      {/* Label + meta row */}
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">
          Topics <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          {selectedTopics.length > 0 && (
            <span className="text-xs bg-[#f0eafa] text-[#8e78b7] px-2.5 py-0.5 rounded-md font-medium">
              {selectedTopics.length} selected
            </span>
          )}
          <button
            type="button"
            onClick={fetchTopics}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#8e78b7] transition-colors"
            title="Refresh topics"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Empty state */}
      {hasFetched && topics.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-3 border border-dashed border-gray-200 rounded-lg bg-gray-50">
          <ListFilter size={15} className="text-gray-300 shrink-0" />
          <p className="text-sm text-gray-400">No topics found on this broker.</p>
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
              disabled={topics.length === 0}
              title={allSelected ? "Deselect all" : "Select all"}
              className="w-3 h-3 accent-[#8e78b7] cursor-pointer shrink-0 disabled:opacity-30"
            />
            <Search size={13} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics…"
              className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400 min-w-0"
            />
            {search ? (
              <>
                <span className="text-xs text-gray-400 shrink-0">
                  {filtered.length}/{topics.length}
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
                {topics.length} topic{topics.length !== 1 ? "s" : ""}
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

          {/* Topic rows */}
          <div className="overflow-y-auto max-h-[220px] divide-y divide-gray-100 scrollbar-thin scrollbar-thumb-[#c4b8e8] scrollbar-track-transparent bg-white">
            {filtered.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-gray-400">
                  No topics match &ldquo;{search}&rdquo;
                </p>
              </div>
            ) : (
              filtered.map((topic) => {
                const isChecked = selectedTopics.includes(topic);
                return (
                  <label
                    key={topic}
                    className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors group select-none ${
                      isChecked
                        ? "bg-[#faf8fe] hover:bg-[#f5f2fd]"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(topic)}
                      className="w-3 h-3 accent-[#8e78b7] cursor-pointer shrink-0"
                    />
                    <span
                      className={`flex-1 text-sm truncate min-w-0 font-mono ${
                        isChecked
                          ? "text-[#6b52a8] font-medium"
                          : "text-gray-600"
                      }`}
                    >
                      {topic}
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
          At least one topic must be selected
        </p>
      )}

    </div>
  );
};

export default KafkaTopicSelector;