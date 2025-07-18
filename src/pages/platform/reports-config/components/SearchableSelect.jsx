import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

  const SearchableSelect = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    
    const filteredOptions = options?.filter((option) => 
        option?.label?.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleSelectClick = () => {
      setIsOpen(!isOpen);
    };

    const handleOptionClick = (option) => {
      onChange(option);
      setIsOpen(false);
      setSearchTerm("");
    };

    return (
      <div className="relative w-full text-black text-sm bg-white">
        <div
          className="w-full mt-1 px-2 py-2 border-2 text-black rounded-md hover:bg-gray-50 cursor-pointer flex justify-between items-center"
          onClick={handleSelectClick}
        >
          <span>{value?.label || placeholder}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg text-sm">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full p-2 pl-8 border rounded-md"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions?.map((option, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleOptionClick(option)}
                >
                  {option.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

export default SearchableSelect;