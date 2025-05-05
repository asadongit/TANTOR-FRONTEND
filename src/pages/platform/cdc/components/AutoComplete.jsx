import { useState, useEffect, useRef } from "react";
import { ChevronDown, X } from "lucide-react";

function AutoComplete({
  options = [],
  placeholder = "Select option",
  onSelect = () => {},
  onChange = null, 
  labelKey = "name",
  valueKey = "id",
  className = "",
  disabled = false,
  returnFullObject = false,
  value = null,
  isLoading = false,
  loadingText = "Loading...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const optionsListRef = useRef(null);
  const optionsRef = useRef([]);

  useEffect(() => {
    if (value) {
      if (typeof value === "object") {
        setSelectedOption(value);
        setSearchTerm(value[labelKey] || "");
      } else {
        const matchingOption = options.find(
          (option) => option[valueKey] === value || option === value
        );
        if (matchingOption) {
          setSelectedOption(matchingOption);
          setSearchTerm(
            typeof matchingOption === "object"
              ? matchingOption[labelKey]
              : matchingOption
          );
        }
      }
    } else {
      setSelectedOption(null);
      setSearchTerm("");
    }
  }, [value, options, labelKey, valueKey]);

  useEffect(() => {
    if (!options || options.length === 0) {
      setFilteredOptions([]);
      return;
    }

    const filtered = options.filter((option) => {
      const label = typeof option === "object" ? option[labelKey] : option;
      return label?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });

    setFilteredOptions(filtered);
    setActiveIndex(filtered.length > 0 ? 0 : -1);
  }, [searchTerm, options, labelKey]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, []);

  useEffect(() => {
    if (isOpen && activeIndex >= 0 && optionsRef.current[activeIndex]) {
      optionsRef.current[activeIndex].scrollIntoView({
        block: "nearest",
        inline: "start",
      });
    }
  }, [activeIndex, isOpen]);

  const handleSelect = (option) => {
    setSelectedOption(option);

    const displayValue = typeof option === "object" ? option[labelKey] : option;
    setSearchTerm(displayValue);

    setIsOpen(false);

    if (returnFullObject) {
      onSelect(option);
    } else {
      onSelect(typeof option === "object" ? option[valueKey] : option);
    }

    if (onChange) {
      const syntheticEvent = {
        target: {
          value: typeof option === "object" ? option[valueKey] : option,
          selectedOption: option, 
        },
      };
      onChange(syntheticEvent);
    }
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedOption(null);
    setSearchTerm("");
    onSelect(null);

    if (onChange) {
      const syntheticEvent = {
        target: {
          value: "",
          selectedOption: null,
        },
      };
      onChange(syntheticEvent);
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const toggleDropdown = (e) => {
    if (disabled) return;

    e.stopPropagation();

    setIsOpen(!isOpen);
    if (!isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    e.stopPropagation();

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && filteredOptions[activeIndex]) {
          handleSelect(filteredOptions[activeIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const getOptionLabel = (option) => {
    if (option === null || option === undefined) return "";
    return typeof option === "object" ? option[labelKey] : option;
  };

  return (
    <div
      className={`relative ${className}`}
      ref={dropdownRef}
      onWheelCapture={(e) => {
        e.stopPropagation();
      }}
    >
      <div
        className={`flex items-center justify-between w-full border bg-white px-2 text-sm rounded-sm text-gray-800 `}
        onClick={toggleDropdown}
      >
        <input
          ref={inputRef}
          type="text"
          className={`w-full focus:outline-none text-sm `}
          placeholder={isLoading ? loadingText : placeholder}
          value={searchTerm}
          onChange={(e) => {
            e.stopPropagation();
            setSearchTerm(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) setIsOpen(true);
          }}
          disabled={disabled || isLoading}
          readOnly={isLoading}
        />
        <div className="flex items-center gap-1 ml-2">
          {selectedOption && !disabled && !isLoading && (
            <button
              onClick={clearSelection}
              className="p-1 rounded text-black hover:bg-gray-100"
              aria-label="Clear selection"
              disabled={disabled}
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-black transition-transform duration-200 ${
              isOpen && !disabled ? "transform rotate-180" : ""
            } ${disabled ? "text-gray-300" : ""}`}
          />
        </div>
      </div>

      {isOpen && !disabled && !isLoading && (
        <div
          ref={optionsListRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => {
              const optionValue =
                typeof option === "object" ? option[valueKey] : option;
              const optionLabel = getOptionLabel(option);
              const isSelected =
                selectedOption &&
                ((typeof selectedOption === "object" &&
                  typeof option === "object" &&
                  selectedOption[valueKey] === option[valueKey]) ||
                  (typeof selectedOption !== "object" &&
                    typeof option !== "object" &&
                    selectedOption === option));

              return (
                <div
                  key={
                    typeof optionValue === "string" ||
                    typeof optionValue === "number"
                      ? optionValue
                      : index
                  }
                  ref={(el) => (optionsRef.current[index] = el)}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors duration-100 ${
                    isSelected
                      ? "bg-purple-50 text-black"
                      : activeIndex === index
                      ? "bg-purple-50 text-purple-600"
                      : "text-gray-700 hover:bg-purple-50 hover:text-black"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {optionLabel}
                </div>
              );
            })
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500 text-center">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AutoComplete;
