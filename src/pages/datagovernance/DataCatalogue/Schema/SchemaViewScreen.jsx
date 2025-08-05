import { useEffect, useState } from "react";
import { CalendarCheck, TableOfContents, Layers, Lightbulb } from 'lucide-react';

const SchemaViewScreen = ({schema}) => {
  const hostnameV1 = window._env_?.VITE_FAST_API;

  const [activeTab, setActiveTab] = useState("summary");
  const [activeTabBusiness, setActiveTabBusiness] = useState("composite-view")

  console.log("schema from schemaViewScreen ", schema)

  const fetchDataCatalogueBusiness = async () => {
    const formData = {
      "connection_set":[
      {
        "table_schema": schema.schema, 
        "connection_name": schema.connectionName,
      }
      ]
    }
    const response = await fetch(`${hostnameV1}/data_catalogue/business_tab`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    })

    const json = await response.json();
    console.log("json ", json)
  }

  useEffect(() => {
    fetchDataCatalogueBusiness()
  }, [])
    
  return (
    <div className="">
      <div className="flex gap-4 mt-10">
         {/* main div */}
         <div className="bg-white w-[70%] h-full p-5">
          {/* heading */}
          <div className="flex justify-between items-center pb-6">
            <h1 className="font-medium">{schema?.schema}</h1>

            <div className="flex gap-7 text-sm">
              <div className="border-r pr-6 text-center">
                <span className="font-medium">{schema?.tables}</span>
                <div className="text-gray-500">Tables</div>
              </div>
              <div className="text-center">
                <span className="font-medium">{schema?.columns}</span>
                <div className="text-gray-500">Columns</div>
              </div>
            </div>
          </div>

          {/* main content */}
          <div className="flex gap-10 text-gray-500">
            <button 
              onClick={() => {
                 setActiveTab("summary")
              }}
              className={`cursor-pointer pb-2 ${
                activeTab === "summary"
                  ? "text-[#8d77ba] border-b-2 font-medium border-[#8d77ba]"
                  : "text-gray-500"
              }`}
              >
              Summary
            </button>
            <button 
              onClick={() => {
                setActiveTab("access")
              }}
              className={`cursor-pointer pb-2 ${
                activeTab === "access"
                  ? "text-[#8d77ba] border-b-2 font-medium border-[#8d77ba]"
                  : "text-gray-500"
              }`}>
                Access
            </button>
            <button 
              onClick={() => {
                setActiveTab("business")
              }}
              className={`cursor-pointer pb-2 ${
                activeTab === "business"
                  ? "text-[#8d77ba] border-b-2 font-medium border-[#8d77ba]"
                  : "text-gray-500"
              }`}>
                Business
            </button>
            <button 
              onClick={() => {
                setActiveTab("description")
              }}
              className={`cursor-pointer pb-2 ${
                activeTab === "description"
                  ? "text-[#8d77ba] border-b-2 font-medium border-[#8d77ba]"
                  : "text-gray-500"
              }`}>
                Description</button>
          </div>

          {activeTab === "summary" && (
            <>
            <div className="text-gray-500 pt-5 font-light border-gray-300 border-t">
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. 
              Autem quae repellendus nihil eveniet numquam quasi ex id, recusandae voluptatum aliquid blanditiis pariatur eos quam enim quidem laborum! 
              Possimus adipisci rerum fuga reiciendis? Nihil, suscipit delectus at voluptatibus fuga, possimus accusamus asperiores nisi laudantium explicabo quasi. Aspernatur praesentium pariatur ad hic sunt consequatur dolorem consectetur, atque error nam impedit nobis deleniti amet autem vel itaque minima iste tenetur dolore alias tempore. 
              Necessitatibus distinctio error doloribus ipsam ex commodi eos eaque animi nemo consequuntur, velit cumque, enim facilis maxime non suscipit ipsa. Reprehenderit mollitia quae, eveniet est ullam commodi rem repudiandae nulla?
            </div>

            <div className="pt-12">
              <div className="flex items-center gap-x-2">
                <span className="text-[#8d77ba]"><CalendarCheck /></span>
                <span className="font-medium">Compliance</span>
              </div>

              <div className="flex gap-3 pt-4 text-sm">
                <span className="bg-purple-100 text-[#8d77ba] border border-[#8d77ba] p-1 w-20 text-center rounded-2xl">GDPR</span>
                <span className="bg-purple-100 text-[#8d77ba] border border-[#8d77ba] p-1 w-20 text-center rounded-2xl">DPDP</span>
                <span className="bg-purple-100 text-[#8d77ba] border border-[#8d77ba] p-1 w-20 text-center rounded-2xl">PCI DSS</span>
              </div>
            </div>
            </>
          )}

          {activeTab === "access" && (
            <div className="text-gray-500 pt-5 font-light border-gray-300 border-t">
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. 
              Autem quae repellendus nihil eveniet numquam quasi ex id, recusandae voluptatum aliquid blanditiis pariatur eos quam enim quidem laborum! 
              Possimus adipisci rerum fuga reiciendis? Nihil, suscipit delectus at voluptatibus fuga, possimus accusamus asperiores nisi laudantium explicabo quasi. Aspernatur praesentium pariatur ad hic sunt consequatur dolorem consectetur, atque error nam impedit nobis deleniti amet autem vel itaque minima iste tenetur dolore alias tempore. 
              Necessitatibus distinctio error doloribus ipsam ex commodi eos eaque animi nemo consequuntur, velit cumque, enim facilis maxime non suscipit ipsa. Reprehenderit mollitia quae, eveniet est ullam commodi rem repudiandae nulla?
            </div>
          )}

          {activeTab === "business" && (
            <>
            <div className="text-gray-500 pt-5 font-light border-b pb-6 border-t">
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. 
              Autem quae repellendus nihil eveniet numquam quasi ex id, 
            </div>

            <div className="flex gap-6 items-center pt-4">
              <div className="flex gap-1">
                <button 
                  onClick={() => setActiveTabBusiness("composite-view")}
                  className="text-[#8d77ba] pb-2"><TableOfContents size={20}/></button>
                <button
                  className={`pb-2 ${activeTabBusiness === "composite-view" ? `text-[#8d77ba] border-b-2 border-[#8d77ba] font-semibold` : `text-gray-500`}`}
                  onClick={() => setActiveTabBusiness("composite-view")}>
                    Composite view
                </button>
              </div>
              <div className="flex gap-1 pb-3 pt-4">
                <button 
                  onClick={() => setActiveTabBusiness("schema-details")}
                  className="text-[#8d77ba] pb-2"><Layers size={20}/></button>
                <button
                   className={`pb-2 ${activeTabBusiness === "schema-details" ? `text-[#8d77ba] border-b-2 border-[#8d77ba] font-semibold` : `text-gray-500`}`}
                  onClick={() => setActiveTabBusiness("schema-details")}>
                    Schema details
                </button>
              </div>
            </div>

            {activeTabBusiness === "composite-view" && (
              <div className="flex-col">

                <div className="flex">
                  <div className="w-[50%]">
                    <div className="mt-3">Domain</div>
                    <div className="mt-3 text-gray-500">
                      <span className="mr-3 p-2 rounded-lg bg-gray-50">Financial</span>
                      <span className="p-2 rounded-lg bg-gray-50">Healthcare</span>
                    </div>
                  </div>
                  <div className="w-[50%]">
                    <div className="mt-3">Terms</div>
                    <div className="mt-3 text-gray-500">
                      <span className="mr-3 p-2 rounded-lg bg-gray-50">Beneficiary</span>
                      <span className="p-2 rounded-lg bg-gray-50">Blockchain</span>
                    </div>
                  </div>
                </div>

                <div className="flex mt-5">
                  <div className="w-[50%]">
                    <div className="mt-3">Categroy</div>
                    <div className="mt-3 text-gray-500">
                      <span className="mr-3 p-2 rounded-lg bg-gray-50">Banking</span>
                      <span className="mr-3 p-2 rounded-lg bg-gray-50">Insurance</span>
                    </div>
                  </div>
                  <div className="w-[50%]">
                    <div className="mt-3">Sub-category</div>
                    <div className="mt-3 text-gray-500">
                      <span className="mr-3 p-2 rounded-lg bg-gray-50">Retail banking</span>
                      <span className="p-2 rounded-lg bg-gray-50">Life insurance</span>
                    </div>
                  </div>
                </div>

                 <div className="flex mt-5">
                  <div className="w-[50%]">
                    <div className="mt-3">Tags</div>
                    <div className="mt-3 text-gray-500">
                      <span className="mr-3 p-2 rounded-lg bg-gray-50">Sensitivity</span>
                      <span className="p-2 rounded-lg bg-gray-50">Compliance and regulatory</span>
                    </div>
                  </div>
                  <div className="w-[50%]">
                    <div className="mt-3">Sub-tags</div>
                    <div className="mt-3 text-gray-500">
                      <span className="mr-3 p-2 rounded-lg bg-gray-50">PII</span>
                      <span className="mr-3 p-2 rounded-lg bg-gray-50">GDPR</span>
                      <span className="mr-3 p-2 rounded-lg bg-gray-50">CCPA</span>
                      <span className="mr-3 p-2 rounded-lg bg-gray-50">KYC</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeTabBusiness === "schema-details" && (
              <div className="bg-white rounded-lg shadow overflow-hidden mt-5 text-sm">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#29304a] text-white">
                      <th className="text-left p-4">ID</th>
                      <th className="text-left p-4">Schema</th>
                      <th className="text-left p-4">Domain</th>
                      <th className="text-left p-4">Category</th>
                      <th className="text-left p-4">Sub-category</th>
                      <th className="text-left p-4">Term</th>
                      <th className="text-left p-4">Tag</th>
                      <th className="text-left p-4">Sub-tag</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-4">#01</td>
                      <td className="p-4">Schema</td>
                      <td className="p-4">Domain</td>
                      <td className="p-4">Category</td>
                      <td className="p-4">Sub-category</td>
                      <td className="p-4">Term</td>
                      <td className="p-4">Tag</td>
                      <td className="p-4">Sub-tag</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">#01</td>
                      <td className="p-4">Schema</td>
                      <td className="p-4">Domain</td>
                      <td className="p-4">Category</td>
                      <td className="p-4">Sub-category</td>
                      <td className="p-4">Term</td>
                      <td className="p-4">Tag</td>
                      <td className="p-4">Sub-tag</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            </>
          )}

          {activeTab === "description" && (
            <div className="text-gray-500 pt-5 font-light border-b pb-6 border-t">
              Schema description
            </div>
          )}

         </div>

        {/* Snapshot div */}
        <div className="bg-white w-[30%] p-5 text-sm">

          <div className="flex items-center gap-2">
            <span className="text-[#8d77ba]"><Lightbulb /></span>
            <h3 className="font-normal text-lg">Snapshot</h3>
          </div>

          <div className="grid grid-cols-2 gap-y-4 border-b pb-3 pt-7">
            <div className="text-gray-500">Connection</div>
            <div className="font-normal">{schema?.connectionName}</div>

            <div className="text-gray-500">Database</div>
            <div className="font-normal">{schema?.database}</div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 border-b pb-3 pt-7">
            <div className="text-gray-500">Created on</div>
            <div className="font-normal">{schema?.CreatedDate.replace(/\//g, '-')}</div>

            <div className="text-gray-500">Last updated</div>
            <div className="font-normal">{schema?.lastUpdated.replace(/\//g, '-')}</div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 border-b pb-3 pt-7">
            <div className="text-gray-500">Owner</div>
            <div className="font-normal">{schema?.owner}</div>

            <div className="text-gray-500">Steward</div>
            <div className="font-normal">Admin</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SchemaViewScreen;