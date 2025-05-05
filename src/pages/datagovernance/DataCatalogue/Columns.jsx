import React, { useState } from "react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";



function Columns() {

    const sampleData = [
        {id: '#456', name: 'Oracle_1', diagram: '07', joins: '17/02/2025',  },
        {id: '#456', name: 'Oracle_1', diagram: '07', joins: '17/02/2025',  },
        {id: '#456', name: 'Oracle_1', diagram: '07', joins: '17/02/2025',  },
        {id: '#456', name: 'Oracle_1', diagram: '07', joins: '17/02/2025',  },
        {id: '#456', name: 'Oracle_1', diagram: '07', joins: '17/02/2025',  },
        {id: '#456', name: 'Oracle_1', diagram: '07', joins: '17/02/2025',  },
        {id: '#456', name: 'Oracle_1', diagram: '07', joins: '17/02/2025',  },
        {id: '#456', name: 'Oracle_1', diagram: '07', joins: '17/02/2025',  },
        {id: '#456', name: 'Oracle_1', diagram: '07', joins: '17/02/2025',  },
      ];


  return (
    <div>
      <Breadcrumb title="Data Governance" link="/" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Column</h1>
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
                <th className="text-left p-4">Diagram</th>

                <th className="text-left p-4">Joins</th>
                <th className="text-left p-4">Action</th>
                <th className="text-left p-4">Select All</th>

              </tr>
            </thead>
            <tbody>
              {sampleData.map((user, index) => (
                <tr key={index} className="border-b">
                  <td className="p-4">{user.id}</td>
                  <td className="p-4">{user.name}</td>
                  <td className="p-4 text-gray-500 underline">{user.diagram}</td>
                  <td className="p-4">{user.joins}</td>
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

export default Columns