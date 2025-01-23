import React, { useState } from "react";
import {  MoreVertical, Search, Plus, Info, MoreHorizontal, Pencil, Trash2, RotateCw } from "lucide-react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";

const Toggle = ({ enabled, onToggle }) => {
  return (
    <div
      onClick={onToggle}
      className={`relative inline-flex h-5 w-10 cursor-pointer rounded-full transition-colors ease-in-out duration-200 ${
        enabled ? "bg-[#1a9962]" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ease-in-out duration-200 m-0.5 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </div>
  );
};

const DataCatalogue = () => {

  const [cards, setCards] = useState([
          {
            title: "Database",
            enabled: true,
            icon: "material-symbols:tab-group-outline",
            bgcolor: "bg-[#8d77ba] bg-opacity-25",
            iconcolor: "text-[#8d77ba]",
            count: 9,
          },
          {
            title: "Schema",
            enabled: true,
            icon: "material-symbols:tab-group-outline",
            bgcolor: "bg-[#8d77ba] bg-opacity-25",
            iconcolor: "text-[#8d77ba]",
            count: 9,
          },
          {
              title: "Table",
              enabled: true,
              icon: "material-symbols:tab-group-outline",
              bgcolor: "bg-[#8d77ba] bg-opacity-25",
              iconcolor: "text-[#8d77ba]",
              count: 9,
            },
            {
              title: "Views",
              enabled: true,
              icon: "material-symbols:tab-group-outline",
              bgcolor: "bg-[#8d77ba] bg-opacity-25",
              iconcolor: "text-[#8d77ba]",
              count: 9,
            },
        ]);


  const toggleRole = (index) => {
        const newCards = [...cards];
        newCards[index].enabled = !newCards[index].enabled;
        setCards(newCards);
      };


  return (
    <div>
      <Breadcrumb title="Data Governance" link="/" />
      <h1 className="text-2xl font-semibold">Data Catalogue</h1>
      <div className="mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((cards, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm border border-gray-100"
        >
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 ${cards.bgcolor} rounded-full ${cards.iconcolor} mr-2`}
                >
                  <Icon icon={cards.icon} />
                </div>
                <h3 className="text-lg font-semibold">{cards.title}</h3>
              </div>
              <button className="p-1 rounded-lg hover:bg-gray-100">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
            <p className="text-gray-500 mt-4 text-sm">{cards.description}</p>
            <div className="flex items-center justify-between mt-6">
            <div className="text-4xl font-bold text-gray-800 mb-4">
              {cards.count.toString().padStart(2, "0")}
            </div>
              <div className="flex items-center gap-2">
                <Toggle
                  enabled={cards.enabled}
                  onToggle={() => toggleRole(index)}
                />
                <span
                  className={`text-sm ${
                    cards.enabled ? "text-[#1a9962]" : "text-gray-400"
                  }`}
                >
                  {cards.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
      </div>
    </div>
  );
};

export default DataCatalogue;