import { useLocation, useNavigate } from "react-router-dom";
import Breadcrumb from "../../../../components/Breadcrumb";
import { ChevronDown, ChevronUp, Database, Lightbulb, Pencil, ChevronLeft, FilePenLine } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import toast from "react-hot-toast";

const DatabaseViewScreen = () => {
  const navigate = useNavigate();
  const { token, decodedToken } = useAuth();
  const location = useLocation();
  const connection = location.state?.connectionData;
  const schema = location.state?.schema;
  const hostnameV1 = window._env_?.VITE_FAST_API;

  const connectionName = connection?.connectionName;

  const schemaList = schema.find((item) => item[connectionName])?.[connectionName]?.schemas || [];

  const [activeTab, setActiveTab] = useState("summary");

  // Access Tab State
  const [accessData, setAccessData] = useState([]);
  const [loadingAccessData, setLoadingAccessData] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  const [isEditing, setIsEditing] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (connection) {
      const initialDesc = connection.description || 'Connection description';
      setSummaryText(initialDesc);
    }
  }, [schema]);

  const handleSaveDescription = async () => {

    if (summaryText.trim() === '') {
      toast.error("Description cannot be empty.");
      return;
    }
    const trimmedDescription = summaryText.trim();
    setIsSaving(true);
    try {
      const response = await fetch(
        `${hostnameV1}/data_catalogue/edit_connection_description`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "accept": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            connection_name: connection.connectionName,
            description: trimmedDescription,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save. Status: ${response.status}`);
      }

      await response.json();
      toast.success("Description updated successfully!");
      setIsEditing(false);

    } catch (error) {
      console.error("Error updating schema description:", error);
      toast.error("Failed to update description.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setSummaryText(schema.description);
    setIsEditing(false);
  };

  const [activeTabBusiness, setActiveTabBusiness] = useState("composite-view");

  const isUserAuthorized = decodedToken?.resource_access?.darch?.roles?.some(
    (role) => ["data steward", "data owner"].includes(role.toLowerCase())
  );

  const fetchAccessData = async () => {
    setLoadingAccessData(true);

    try {
      const response = await fetch(
        `${window._env_?.VITE_FAST_API}/data_catalogue/access_tab`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            connection_set: [
              {
                connection_name: connection.connectionName,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch access data. Status: ${response.status}`
        );
      }

      const data = await response.json();

      const processedData = [];
      if (data.role) {
        for (const [name, users] of Object.entries(data.role)) {
          processedData.push({ type: "Role", name, users: users || [] });
        }
      }
      if (data.group) {
        for (const [name, users] of Object.entries(data.group)) {
          processedData.push({ type: "Group", name, users: users || [] });
        }
      }
      if (data.subgroup) {
        for (const [name, users] of Object.entries(data.subgroup)) {
          processedData.push({ type: "Sub-group", name, users: users || [] });
        }
      }

      setAccessData(processedData);
    } catch (error) {
      console.error("Error fetching access data:", error);
      toast.error("Failed to load access information.");
      setLoadingAccessData(false);
    } finally {
      setLoadingAccessData(false);
    }
  };

  useEffect(() => {
    if (activeTab === "access" && accessData.length === 0) {
      fetchAccessData();
    }
  }, [activeTab]);

  const toggleRow = (name) => {
    setExpandedRows(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <div className="p-4">
      <Breadcrumb />
      <div className="flex gap-4 mt-10">
        {/* main div */}
        <div className="bg-white w-[70%] h-full p-5">
          {/* heading */}
          <div className="flex justify-between items-center pb-6">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <span className="text-[#8d77ba]"><Database /></span>
              <h1 className="font-medium text-xl">{connection?.connectionName}</h1>
            </div>

            <div className="flex gap-7 text-sm">
              <div className="border-r pr-6 text-center">
                <span className="font-medium">{connection?.Schema}</span>
                <div className="text-gray-500">Schema</div>
              </div>
              <div className="pr-6 text-center">
                <span className="font-medium">{connection?.Tables}</span>
                <div className="text-gray-500">Tables</div>
              </div>
            </div>
          </div>

          {/* main content */}
          <div className="flex gap-10 text-gray-500">
            <button
              onClick={() => {
                setActiveTab("summary");
              }}
              className={`cursor-pointer pb-2 ${activeTab === "summary"
                ? "text-[#8d77ba] border-b-2 font-medium border-[#8d77ba]"
                : "text-gray-500"
                }`}
            >
              Summary
            </button>
            <button
              onClick={() => {
                setActiveTab("access");
              }}
              className={`cursor-pointer pb-2 ${activeTab === "access"
                ? "text-[#8d77ba] border-b-2 font-medium border-[#8d77ba]"
                : "text-gray-500"
                }`}
            >
              Access
            </button>
          </div>

          {activeTab === "summary" && (
            <>
              <div className="text-gray-500 pt-5 border-t border-gray-300 relative group">
                <div className='flex items-center justify-between mb-2'>
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FilePenLine className="h-5 w-5 text-[#8d77ba]" /> Description
                  </h3>
                </div>
                {!isEditing ? (
                  <>
                    <p className="text-gray-600 pl-7 min-h-[2rem]">{summaryText}</p>
                    {isUserAuthorized && (
                      <button
                        className="absolute top-3 right-3 pt-2 hover:text-gray-600 text-[#8d77ba]"
                        onClick={() => setIsEditing(true)}
                      >
                        <Pencil size={18} />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-md text-sm text-gray-700"
                      rows={6}
                      value={summaryText}
                      onChange={(e) => setSummaryText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-1.5 text-sm font-medium bg-[#8d77ba] text-white rounded hover:bg-[#7a66a8] disabled:bg-gray-400 disabled:cursor-not-allowed"
                        onClick={handleSaveDescription}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden mt-10 text-sm">
                <table className="w-full">
                  <thead className="bg-[#29304a] text-white">
                    <tr>
                      <th className="text-left p-4">ID</th>
                      <th className="text-left p-4">Database</th>
                      <th className="text-left p-4">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemaList.map((schema, idx) =>
                      <tr key={idx} className="border-b">
                        <td className="p-4">{idx + 1}</td>
                        <td className="p-4">{schema}</td>
                        <td className="p-4">Description</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "access" && (
            loadingAccessData ?
              <div className="pt-7 text-center text-sm text-gray-500 border-t">
                Loading access api...
              </div> :
              <div className="overflow-x-auto mt-2 rounded-lg shadow border border-t">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Count</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {accessData.map((item) => (
                      <React.Fragment key={`${item.type}-${item.name}`}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <button onClick={() => toggleRow(item.name)} className="text-gray-500 hover:text-[#8d77ba] transition-colors">
                              {expandedRows[item.name] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.users.length}</td>
                        </tr>
                        {expandedRows[item.name] && (
                          <tr>
                            <td colSpan="4" className="px-6 py-4 bg-purple-50/50">
                              <div className="flex items-center flex-wrap gap-2">
                                <h4 className="font-semibold text-gray-700 text-sm">Users:</h4>
                                {item.users.length > 0 ? (
                                  item.users.map(user => (
                                    <span key={user} className="bg-purple-100 text-[#8d77ba] text-xs font-semibold px-2.5 py-1 rounded-full">
                                      {user}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-500 italic text-sm">
                                    No users found in this {item.type.toLowerCase()}.
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
          )}

          {/* {activeTab === "business" && (
            <>
              <div className="flex gap-6 items-center pt-4 border-t">
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveTabBusiness("composite-view")}
                    className="text-[#8d77ba] pb-2"
                  >
                    <TableOfContents size={20} />
                  </button>
                  <button
                    className={`pb-2 ${
                      activeTabBusiness === "composite-view"
                        ? `text-[#8d77ba] border-b-2 border-[#8d77ba] font-semibold`
                        : `text-gray-500`
                    }`}
                    onClick={() => setActiveTabBusiness("composite-view")}
                  >
                    Composite view
                  </button>
                </div>
                <div className="flex gap-1 pb-3 pt-4">
                  <button
                    onClick={() => setActiveTabBusiness("schema-details")}
                    className="text-[#8d77ba] pb-2"
                  >
                    <Layers size={20} />
                  </button>
                  <button
                    className={`pb-2 ${
                      activeTabBusiness === "schema-details"
                        ? `text-[#8d77ba] border-b-2 border-[#8d77ba] font-semibold`
                        : `text-gray-500`
                    }`}
                    onClick={() => setActiveTabBusiness("schema-details")}
                  >
                    Schema details
                  </button>
                </div>
              </div>

              {activeTabBusiness === "composite-view" &&
                (loadingBusinessTab ? (
                  <div className="text-sm text-center text-gray-500 p-3">
                    Loading business information...
                  </div>
                ) : (
                  <CompositeViewComponent
                    tableData={businessTabResponse}
                    componentInfo={schema}
                    activeTabBusiness={activeTabBusiness}
                  />
                ))}

              {activeTabBusiness === "schema-details" &&
                (loadingBusinessTab ? (
                  <div className="text-sm text-center text-gray-500 p-3">
                    Loading business information...
                  </div>
                ) : (
                  <SchemaDetailsViewComponent
                    tableData={businessTabResponse}
                    componentInfo={schema}
                    activeTabBusiness={activeTabBusiness}
                  />
                ))}
            </>
          )} */}
        </div>

        {/* Snapshot div */}
        <div className="bg-white w-[30%] p-5 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#8d77ba]">
              <Lightbulb />
            </span>
            <h3 className="font-normal text-lg">Snapshot</h3>
          </div>

          <div className="grid grid-cols-2 gap-y-4 border-b pb-3 pt-7">
            <div className="text-gray-500">Data Source</div>
            <div className="font-normal">{connection?.Database}</div>

            <div className="text-gray-500">Created on</div>
            <div className="font-normal">
              {connection?.CreatedDate.replace(/\//g, "-")}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 border-b pb-3 pt-7">
            <div className="text-gray-500">Last updated</div>
            <div className="font-normal">
              {connection?.updatedDate.replace(/\//g, "-")}
            </div>
            <div className="text-gray-500">Owner</div>
            <div className="font-normal">{connection?.owner}</div>

          </div>

          <div className="grid grid-cols-2 gap-y-4 border-b pb-3 pt-7">
            <div className="text-gray-500">Steward</div>
            <div className="font-normal">Admin</div>
          </div>
        </div>
      </div>
    </div>
  )
};

export default DatabaseViewScreen;
