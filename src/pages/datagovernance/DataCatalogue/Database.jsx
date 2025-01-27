import React, { useState } from "react";
import { MoreVertical } from "lucide-react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";
import { useNavigate } from "react-router-dom";
import CatalogueChart from "./Components/CatalogueTrend";
import Hive from './Components/Icons/Hive.png'
import Oracle from './Components/Icons/Oracle.png'
import Snowflake from './Components/Icons/Snowflake.png'

const Database = () => {
  const [isTableView, setIsTableView] = useState(false);
  const [cards, setCards] = useState([
    {
      title: "Oracle",
      enabled: true,
      icon: Oracle,
      count: 9,
      seeDetailsLink: "/database-details",
    },
    {
      title: "Hive",
      enabled: true,
      icon: Hive,
      count: 7,
      seeDetailsLink: "/schema-details",
    },
    {
      title: "Snowflake",
      enabled: true,
      icon: Snowflake,
      count: 12,
      seeDetailsLink: "/tables-details",
    }
  ]);

  const navigate = useNavigate();

  const trendData = [
    { day: '1 day', Database: 20, Schema: 9, Tables: 13, View: 11 },
    { day: '2 day', Database: 25, Schema: 9, Tables: 17, View: 11 },
    { day: '3 day', Database: 26, Schema: 17, Tables: 9, View: 8 },
    { day: '4 day', Database: 27, Schema: 17, Tables: 15, View: 18 },
    { day: '5 day', Database: 25, Schema: 14, Tables: 13, View: 23 },
    { day: '6 day', Database: 23, Schema: 20, Tables: 15, View: 16 },
    { day: '7 day', Database: 21, Schema: 27, Tables: 16, View: 15 },
  ];

  const sampleData = [
    {id: '1', connectionName: 'Oracle', Database: 'Oracle', Schema: '08', Tables: '16', Views: '07', Column: '47', CreatedDate: '26/01/2025', updatedDate:'27/01/2025' },
    {id: '1', connectionName: 'Oracle', Database: 'Oracle', Schema: '08', Tables: '16', Views: '07', Column: '47', CreatedDate: '26/01/2025', updatedDate:'27/01/2025' },
    {id: '1', connectionName: 'Oracle', Database: 'Oracle', Schema: '08', Tables: '16', Views: '07', Column: '47', CreatedDate: '26/01/2025', updatedDate:'27/01/2025' },
    {id: '1', connectionName: 'Oracle', Database: 'Oracle', Schema: '08', Tables: '16', Views: '07', Column: '47', CreatedDate: '26/01/2025', updatedDate:'27/01/2025' },
    {id: '1', connectionName: 'Oracle', Database: 'Oracle', Schema: '08', Tables: '16', Views: '07', Column: '47', CreatedDate: '26/01/2025', updatedDate:'27/01/2025' },
    {id: '1', connectionName: 'Oracle', Database: 'Oracle', Schema: '08', Tables: '16', Views: '07', Column: '47', CreatedDate: '26/01/2025', updatedDate:'27/01/2025' },
    {id: '1', connectionName: 'Oracle', Database: 'Oracle', Schema: '08', Tables: '16', Views: '07', Column: '47', CreatedDate: '26/01/2025', updatedDate:'27/01/2025' },
    {id: '1', connectionName: 'Oracle', Database: 'Oracle', Schema: '08', Tables: '16', Views: '07', Column: '47', CreatedDate: '26/01/2025', updatedDate:'27/01/2025' },
    {id: '1', connectionName: 'Oracle', Database: 'Oracle', Schema: '08', Tables: '16', Views: '07', Column: '47', CreatedDate: '26/01/2025', updatedDate:'27/01/2025' },
  ];

  const recentAccess = [
    "Oracle_2",
    "DWS_customer",
    "rw_acc_summary",
    "Dim_cutomer",
    "dim_account",
    "DWS_customer",
    "Oracle_2"
  ];

  return (
    <div>
      <Breadcrumb title="Data Governance" link="/" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Database</h1>
        <div className="flex items-center gap-2">
          <button
            className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50"
            onClick={() => setIsTableView(!isTableView)}
          >
            <Icon
              icon={isTableView ? "material-symbols-light:cards-outline" : "material-symbols-light:format-list-bulleted"}
              width="24"
              height="24"
              className="text-gray-600"
            />
          </button>

          <button className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50">
            <Icon
              icon="material-symbols:autorenew-rounded"
              width="24"
              height="24"
              className="text-gray-600"
            />
          </button>
        </div>
      </div>

      {!isTableView ? (
        <>
          <div className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((card, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-100"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10">
                          <img
                            src={card.icon}
                            alt={`${card.title} icon`}
                            className="w-6 h-6 md:w-8 md:h-8 object-contain"
                          />
                        </div>
                        <h3 className="text-lg font-semibold">{card.title}</h3>
                      </div>
                      <button className="p-1 rounded-lg hover:bg-gray-100">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-6xl font-semibold text-gray-800 mt-6">
                      {card.count.toString().padStart(2, "0")}
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <a
                        className="text-sm text-[#8d77ba] font-medium underline cursor-pointer opacity-90"
                        onClick={() => navigate(`${card.seeDetailsLink}`)}
                      >
                        See details
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mt-10">
            <CatalogueChart data={trendData} />
            <div className="bg-white p-6 rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium">Recent access</h3>
                <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 text-sm">i</span>
                </div>
              </div>
              <div className="space-y-4">
                {recentAccess.map((item, index) => (
                  <div key={index} className="pb-4 border-b border-gray-100 last:border-0">
                    <span className="text-gray-600">{index + 1}. {item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden mt-5">
          <table className="w-full">
            <thead>
              <tr className="bg-[#29304a] text-white">
                <th className="text-left p-4">Id</th>
                <th className="text-left p-4">Connection Name</th>
                <th className="text-left p-4">Database</th>
                <th className="text-left p-4">Schema</th>
                <th className="text-left p-4">Tables</th>
                <th className="text-left p-4">Views</th>
                <th className="text-left p-4">Columns</th>
                <th className="text-left p-4">Created Date</th>
                <th className="text-left p-4">Updated Date</th>
              </tr>
            </thead>
            <tbody>
              {sampleData.map((user, index) => (
                <tr key={index} className="border-b">
                  <td className="p-4">{user.id}</td>
                  <td className="p-4">{user.connectionName}</td>
                  <td className="p-4">{user.Database}</td>
                  <td className="p-4 text-gray-500 underline">{user.Schema}</td>
                  <td className="p-4 text-gray-500 underline">{user.Tables}</td>
                  <td className="p-4 text-gray-500 underline">{user.Views}</td>
                  <td className="p-4 text-gray-500 underline">{user.Column}</td>
                  <td className="p-4">{user.CreatedDate}</td>
                  <td className="p-4">{user.updatedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Database;