import { Icon } from "@iconify-icon/react";
import { useState, useEffect } from "react";

const Project = () => {
  const cards = [
    {
      icon: "material-symbols:database-upload-outline",
      bgcolor: "bg-[#d8d3e4]",
      iconcolor: "text-purple-700",
      title: "Purge",
      count:"27"
    },
    {
      icon: "material-symbols-light:two-pager-store-outline",
      bgcolor: "bg-[#FFC93F]",
      iconcolor: "text-orange-700",
      title: "Migration",
      count:"11"
    },
    {
      icon: "material-symbols:cloud-sync-outline",
      bgcolor: "bg-[#96CF7B]",
      iconcolor: "text-green-700",
      title: "CDC",
      count:"07"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] Opacity-25",
      iconcolor: "text-cyan-700",
      title: "Federation",
      count:"17",
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] Opacity-25",
      iconcolor: "text-cyan-700",
      title: "Transformation",
      count:"06"
    }
  ];



  return (
    <div className="max-w-fit mx-auto">
      <h1 className="text-2xl font-semibold">Project</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`bg-white p-6 rounded-lg shadow-sm border-gray-200`}
          >
            <div className="flex items-center mb-2">
              <div
                className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 ${card.bgcolor} rounded-full ${card.iconcolor} mr-2`}
              >
                <Icon icon={card.icon} />
              </div>
              <h3 className="text-lg font-semibold">{card.title}</h3>
            </div>
            <p className="text-black text-5xl font-bold">{card.count}</p>
            <button className="mt-4 text-purple-600 text-sm hover:text-purple-700">
              See details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Project;
