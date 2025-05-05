import React, { useState } from "react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";



function Schema() {

    const sampleData = [
        {id: '#456', connectionName: 'Oracle_1', description: 'some description', database: 'oracle', owner: 'Namit', tables: '07', views: '04', CreatedDate: '26/01/2025', lastUpdated:'27/01/2025' },
        {id: '#456', connectionName: 'Oracle_1', description: 'some description', database: 'oracle', owner: 'Namit', tables: '07', views: '04', CreatedDate: '26/01/2025', lastUpdated:'27/01/2025' },
        {id: '#456', connectionName: 'Oracle_1', description: 'some description', database: 'oracle', owner: 'Namit', tables: '07', views: '04', CreatedDate: '26/01/2025', lastUpdated:'27/01/2025' },
        {id: '#456', connectionName: 'Oracle_1', description: 'some description', database: 'oracle', owner: 'Namit', tables: '07', views: '04', CreatedDate: '26/01/2025', lastUpdated:'27/01/2025' },
        {id: '#456', connectionName: 'Oracle_1', description: 'some description', database: 'oracle', owner: 'Namit', tables: '07', views: '04', CreatedDate: '26/01/2025', lastUpdated:'27/01/2025' },
        {id: '#456', connectionName: 'Oracle_1', description: 'some description', database: 'oracle', owner: 'Namit', tables: '07', views: '04', CreatedDate: '26/01/2025', lastUpdated:'27/01/2025' },
        {id: '#456', connectionName: 'Oracle_1', description: 'some description', database: 'oracle', owner: 'Namit', tables: '07', views: '04', CreatedDate: '26/01/2025', lastUpdated:'27/01/2025' },
        {id: '#456', connectionName: 'Oracle_1', description: 'some description', database: 'oracle', owner: 'Namit', tables: '07', views: '04', CreatedDate: '26/01/2025', lastUpdated:'27/01/2025' },
        {id: '#456', connectionName: 'Oracle_1', description: 'some description', database: 'oracle', owner: 'Namit', tables: '07', views: '04', CreatedDate: '26/01/2025', lastUpdated:'27/01/2025' },
      ];


  return (
    <div>
      <Breadcrumb title="Data Governance" link="/" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Schema</h1>
        <div className="flex items-center gap-2">


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


      <div className="bg-white rounded-lg shadow overflow-hidden mt-5">
          <table className="w-full">
            <thead>
              <tr className="bg-[#29304a] text-white">
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Description</th>
                <th className="text-left p-4">Database</th>
                <th className="text-left p-4">Owner</th>
                <th className="text-left p-4">Tables</th>
                <th className="text-left p-4">Views</th>
                <th className="text-left p-4">Created Date</th>
                <th className="text-left p-4">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {sampleData.map((user, index) => (
                <tr key={index} className="border-b">
                  <td className="p-4">{user.id}</td>
                  <td className="p-4">{user.connectionName}</td>
                  <td className="p-4">{user.description}</td>
                  <td className="p-4">{user.database}</td>
                  <td className="p-4">{user.owner}</td>
                  <td className="p-4 text-gray-500 underline">{user.tables}</td>
                  <td className="p-4 text-gray-500 underline">{user.views}</td>
                  <td className="p-4">{user.CreatedDate}</td>
                  <td className="p-4">{user.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

    </div>
  )
}

export default Schema