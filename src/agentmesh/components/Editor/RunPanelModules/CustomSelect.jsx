import React from "react";

export default function CustomSelect({
  value,
  options,
  required,
  disabled,
  placeholder,
  hasError,
  onChange,
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => {
    const optValue = typeof opt === "string" ? opt : opt.value;
    return String(optValue) === String(value);
  });

  const displayLabel = selectedOption
    ? typeof selectedOption === "string"
      ? selectedOption
      : selectedOption.label
    : placeholder;

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((opt) => {
      const label = typeof opt === "string" ? opt : opt.label || "";
      return label.toLowerCase().includes(query);
    });
  }, [options, searchQuery]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 10,
          border: `1px solid ${hasError ? "#EF4444" : "#E5E7EB"}`,
          background: "#F9FAFB",
          fontSize: 13,
          color: value ? "#1E293B" : "#9CA3AF",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxSizing: "border-box",
          userSelect: "none",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayLabel}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          style={{
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            color: "#6B7280",
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 1000,
            background: "white",
            border: "1px solid #E5E7EB",
            borderRadius: 10,
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "240px",
            padding: 4,
          }}
        >
          {options.length > 5 && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: "4px 6px",
                borderBottom: "1px solid #F1F5F9",
                marginBottom: 4,
              }}
            >
              <input
                type="text"
                placeholder="Search option..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #E2E8F0",
                  borderRadius: 6,
                  fontSize: 12,
                  outline: "none",
                  background: "#F8FAFC",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          <div
            className="modern-scrollbar"
            style={{ overflowY: "auto", flex: 1, maxHeight: "180px" }}
          >
            {!required && !searchQuery && (
              <div
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "#6B7280",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#F3F4F6")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {placeholder}
              </div>
            )}
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "#94A3B8",
                  textAlign: "center",
                }}
              >
                No options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const optValue = typeof opt === "string" ? opt : opt.value;
                const optLabel = typeof opt === "string" ? opt : opt.label;
                const isSelected = String(optValue) === String(value);

                return (
                  <div
                    key={optValue}
                    onClick={() => {
                      onChange(optValue);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      fontSize: 13,
                      color: isSelected
                        ? "var(--theme-primary, #4285F4)"
                        : "#374151",
                      fontWeight: isSelected ? 600 : 400,
                      background: isSelected
                        ? "var(--theme-primary-glow, #F0F4FF)"
                        : "transparent",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background = "#F3F4F6";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {optLabel}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
