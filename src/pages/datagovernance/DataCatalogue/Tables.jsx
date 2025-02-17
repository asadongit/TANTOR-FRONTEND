import React, { useState } from "react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";



function Tables() {

    const sampleData = [
        {id: '#456', name: 'Oracle_1', alias: 'Mr', description: 'some description', schema: 'Oracle', database: 'oracle', owner: 'Namit', column: '07', tags: 'Senstive', CreatedDate: '26/01/2025', lastUpdated:'27/01/2025' },
        {id: '#456', name: 'Oracle_1', alias: 'Mr', description: 'some description', schema: 'Oracle', database: 'oracle', owner: 'Namit', column: '07', tags: 'Critical', CreatedDate: '26/01/2025', lastUpdated:'27/01/2025' },
        {id: '#456', name: 'Oracle_1', alias: 'Mr', description: 'some description', schema: 'Oracle', database: 'oracle', owner: 'Namit', column: '07', tags: 'Senstive', CreatedDate: '26/01/2025', lastUpdated:'27/01/2025' },
        {id: '#456', name: 'Oracle_1', alias: 'Mr', description: 'some description', schema: 'Oracle', database: 'oracle', owner: 'Namit', column: '07', tags: 'Senstive', CreatedDate: '26/01/2025', lastUpdated:'27/01/2025' },
        {id: '#456', name: 'Oracle_1', alias: 'Mr', description: 'some description', schema: 'Oracle', database: 'oracle', owner: 'Namit', column: '07', tags: 'Pill', CreatedDate: '26/01/2025', lastUpdated:'27/01/2025' },
        {id: '#456', name: 'Oracle_1', alias: 'Mr', description: 'some description', schema: 'Oracle', database: 'oracle', owner: 'Namit', column: '07', tags: 'Senstive', CreatedDate: '26/01/2025', lastUpdated:'27/01/2025' },
        {id: '#456', name: 'Oracle_1', alias: 'Mr', description: 'some description', schema: 'Oracle', database: 'oracle', owner: 'Namit', column: '07', tags: 'Internal', CreatedDate: '26/01/2025', lastUpdated:'27/01/2025' },
        {id: '#456', name: 'Oracle_1', alias: 'Mr', description: 'some description', schema: 'Oracle', database: 'oracle', owner: 'Namit', column: '07', tags: 'Senstive', CreatedDate: '26/01/2025', lastUpdated:'27/01/2025' },
        {id: '#456', name: 'Oracle_1', alias: 'Mr', description: 'some description', schema: 'Oracle', database: 'oracle', owner: 'Namit', column: '07', tags: 'Senstive', CreatedDate: '26/01/2025', lastUpdated:'27/01/2025' },
      ];


  return (
    <div>
      <Breadcrumb title="Data Governance" link="/" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Table</h1>
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
                <th className="text-left p-4">Alias</th>

                <th className="text-left p-4">Description</th>
                <th className="text-left p-4">Schema</th>

                <th className="text-left p-4">Database</th>
                <th className="text-left p-4">Owner</th>
                <th className="text-left p-4">Columns</th>
                <th className="text-left p-4">Tags</th>
                <th className="text-left p-4">Created Date</th>
                <th className="text-left p-4">Last Updated</th>
                <th className="text-left p-4">Action</th>
                <th className="text-left p-4">Select All</th>

              </tr>
            </thead>
            <tbody>
              {sampleData.map((user, index) => (
                <tr key={index} className="border-b">
                  <td className="p-4">{user.id}</td>
                  <td className="p-4">{user.name}</td>
                  <td className="p-4">{user.alias}</td>
                  <td className="p-4">{user.description}</td>
                  <td className="p-4">{user.schema}</td>
                  <td className="p-4">{user.database}</td>
                  <td className="p-4 text-gray-500 underline">{user.owner}</td>
                  <td className="p-4 text-gray-500 underline">{user.column}</td>
                  <td className="p-4 text-gray-500 underline">{user.tags}</td>


                  <td className="p-4">{user.CreatedDate}</td>
                  <td className="p-4">{user.lastUpdated}</td>
                  <td><input type="checkbox" name="select" /></td>

                  <td><input type="checkbox" name="select" /></td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

    </div>
  )
}

export default Tables