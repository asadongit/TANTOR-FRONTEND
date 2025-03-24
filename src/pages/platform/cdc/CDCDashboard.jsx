import { Icon } from "@iconify-icon/react";
import { useState, useEffect } from "react";
import { List, RefreshCcw } from "lucide-react";
import Charts from "./components/Charts";
import { Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
// import { Toaster, toast as hotToast } from "react-hot-toast";

import { ToastContainer, toast as notifyToast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CDCDashboard = ({ setActivePage }) => {
  const navigate = useNavigate();

  const cards = [
    {
      icon: "material-symbols:database-upload-outline",
      bgcolor: "bg-[#d8d3e4] bg-opacity-25",
      iconcolor: "text-purple-700",
      title: "Oracle",
      count: "27",
    },
    {
      icon: "material-symbols-light:two-pager-store-outline",
      bgcolor: "bg-[#FFC93F] bg-opacity-25",
      iconcolor: "text-orange-700",
      title: "MYSQL",
      count: "11",
    },
    {
      icon: "material-symbols:cloud-sync-outline",
      bgcolor: "bg-[#96CF7B] bg-opacity-25",
      iconcolor: "text-green-700",
      title: "DB2",
      count: "07",
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Hive",
      count: "17",
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Postgres",
      count: "06",
    },
  ];

  const handleCreateCDC = () => {
    navigate("/canvas/CDCcanvas");
  };

  return (
    <div>
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">CDC</h1>
        <div>
          <button
            type="button"
            className="text-black shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
            onClick={() => setActivePage("list")}
          >
            <List className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="text-black shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
            // onClick={handleRefresh}
            // onClick={() => {
            //   hotToast.success("Refreshed successfully!");
            //   // hotToast.error("Something went wrong!");

            // }}
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
          <button
            onClick={handleCreateCDC}
            type="button"
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            + Create CDC
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`bg-white p-6 rounded-lg shadow-sm border-gray-200`}
          >
            <div className="flex items-center mb-2">
              <div
                className={`flex items-center justify-center aspect-square w-8 md:w-10 ${card.bgcolor} rounded-full ${card.iconcolor} mr-2`}
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

      <div className="flex flex-col items-start gap-2.5 m-2">
        <h2
          size="heading_h2_proxima_bold_20_px"
          as="h4"
          className="text-[20px] font-medium"
        >
          {" "}
          CDC Overview{" "}
        </h2>
      </div>
      <div className="flex gap-4 self-stretch ">
        <Charts />
      </div>
    </div>
  );
};

export default CDCDashboard;
