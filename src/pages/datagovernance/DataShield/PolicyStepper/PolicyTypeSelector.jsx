import React from "react";
import { Database, FileText, BookOpen } from "lucide-react";

const PolicyTypeSelector = ({ selectedType, onTypeChange }) => {
  const policyTypes = [
    {
      id: "connection",
      title: "Policy For Connection",
      description: "Create policy for database connections and tables",
      icon: <Database className="h-8 w-8 text-[#8e78b7]" />,
    },
    {
      id: "reports",
      title: "Policy For Reports",
      description: "Create policy for reports and dashboards",
      icon: <FileText className="h-8 w-8 text-[#8e78b7]" />,
    },

  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-6">Select Policy Type</h2>
      <p className="text-gray-600 mb-8">
        Choose what this policy should apply to. This determines the next steps in the policy creation process.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {policyTypes.map((type) => (
          <div
            key={type.id}
            onClick={() => onTypeChange(type.id)}
            className={`border rounded-lg p-6 cursor-pointer transition-all ${
              selectedType === type.id
                ? "border-[#8e78b7] bg-purple-50 shadow-md"
                : "border-gray-200 hover:border-[#8e78b7] hover:bg-purple-50"
            }`}
          >
            <div className="flex items-center justify-center mb-4">
              {type.icon}
            </div>
            <h3 className="text-lg font-medium text-center mb-2">
              {type.title}
            </h3>
            <p className="text-gray-500 text-sm text-center">
              {type.description}
            </p>
            <div className="flex justify-center mt-4">
              <div
                className={`w-4 h-4 rounded-full border ${
                  selectedType === type.id
                    ? "border-[#8e78b7] bg-[#8e78b7]"
                    : "border-gray-300"
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      {!selectedType && (
        <p className="text-red-500 mt-4 text-center">
          Please select a policy type to continue
        </p>
      )}
    </div>
  );
};

export default PolicyTypeSelector;
