import React, { useEffect, useState } from "react";
import {
  TableOfContents,
  Layers,
  Lightbulb,
  Pencil,
  ChevronUp,
  ChevronDown,
  Database,
  FileCheck2,
  FilePenLine,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import CompositeViewComponent from "../Schema/CompositeViewComponent";
import SchemaDetailsViewComponent from "./SchemaDetailsViewComponenet";
import toast from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import Breadcrumb from "../../../../components/Breadcrumb";
import { fetchConnectionDetails, secureQuery } from '../Components/function';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  if (!totalItems || totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex justify-between items-center p-2 text-sm text-gray-700 border-t">
      <span>
        Showing <span className="font-semibold">{startItem}</span> to <span className="font-semibold">{endItem}</span> of <span className="font-semibold">{totalItems}</span> Entries
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 py-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="px-3 py-1 font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 py-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};


const SchemaViewScreen = () => {
  const hostnameV1 = window._env_?.VITE_FAST_API;
  const { token, decodedToken } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();
  const schema = location.state?.schemaData;

  const [activeTab, setActiveTab] = useState('summary');
  const [businessTabResponse, setBusinessTabResponse] = useState([]);
  const [complianceResponse, setComplianceResponse] = useState([]);
  const [loadingBusinessTab, setLoadingBusinessTab] = useState(false);
  const [loadingComplianceApi, setLoadingComplianceApi] = useState(false);

  // Access Tab State
  const [accessData, setAccessData] = useState([]);
  const [loadingAccessData, setLoadingAccessData] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  const [schemaData, setSchemaData] = useState(schema);
  const [isEditing, setIsEditing] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [activeTabBusiness, setActiveTabBusiness] = useState("composite-view");

  // Pagination State
  const [accessCurrentPage, setAccessCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);


  if (!schema) {
    return <p>Schema data not available.</p>;
  }

  const refetchSchemaData = async () => {
    try {
      const secureQueryResponse = await secureQuery({ user_query: "" }, token);
      const policyIds = secureQueryResponse.matched_policy_ids || [];
      const allConnectionsData = await fetchConnectionDetails(policyIds, token);

      const currentSchemaData = allConnectionsData.find(
        item => item.connection_name === schema.connectionName &&
          item.table_schema === schema.schema
      );

      if (currentSchemaData) {
        const updatedSchemaData = {
          ...schemaData,
          description: currentSchemaData.table_schema_description || 'Schema description'
        };
        setSchemaData(updatedSchemaData);
        setSummaryText(currentSchemaData.table_schema_description || 'Schema description');
      }
    } catch (error) {
      console.error('Error refetching schema data:', error);
    }
  };

  useEffect(() => {
    if (schemaData) {
      const initialDesc = schemaData.description || 'Schema description';
      setSummaryText(initialDesc);
    }
  }, [schemaData]);

  const fetchDataCatalogueBusiness = async () => {
    if (businessTabResponse.length > 0) {
      return;
    }

    setLoadingBusinessTab(true);

    try {
      const formData = {
        connection_set: [
          {
            table_schema: schema.schema,
            connection_name: schema.connectionName,
          },
        ],
      };
      const response = await fetch(
        `${hostnameV1}/data_catalogue/business_tab`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const json = await response.json();
      setBusinessTabResponse(json);
    } catch {
      toast.error("Error fetching Data Catalogue");
      setLoadingBusinessTab(false);
    } finally {
      setLoadingBusinessTab(false);
    }
  };

  const fetchDataCatalogueCompliance = async () => {
    if (complianceResponse.length > 0) {
      return;
    }

    setLoadingComplianceApi(true);

    try {
      const formData = {
        connection_set: [
          {
            table_schema: schema.schema,
            connection_name: schema.connectionName,
          },
        ],
      };
      const response = await fetch(
        `${hostnameV1}/data_catalogue/compliance_tags`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const json = await response.json();
      setComplianceResponse(json);
    } catch {
      toast.error("Error fetching Compliance");
      setLoadingComplianceApi(false);
    } finally {
      setLoadingComplianceApi(false);
    }
  };

  const fetchAccessData = async () => {
    setLoadingAccessData(true);
    setAccessCurrentPage(1); // Reset page on new fetch

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
                connection_name: schema.connectionName,
                table_schema: schema.schema,
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

  const toggleRow = (name) => {
    setExpandedRows(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  useEffect(() => {
    if (activeTab === "business" && businessTabResponse.length === 0) {
      fetchDataCatalogueBusiness();
    } else if (activeTab === "access" && accessData.length === 0) {
      fetchAccessData();
    } else if (activeTab === "summary" && complianceResponse.length === 0) {
      fetchDataCatalogueCompliance();
    }
  }, [activeTab]);

  const isUserAuthorized = decodedToken?.resource_access?.darch?.roles?.some(
    (role) => ["persona:data steward", "persona:data owner"].includes(role.toLowerCase())
  );

  const handleSaveDescription = async () => {
    if (summaryText.trim() === '') {
      toast.error("Description cannot be empty.");
      return;
    }
    const trimmedDescription = summaryText.trim();
    setIsSaving(true);
    setIsEditing(false);

    try {
      const response = await fetch(
        `${hostnameV1}/data_catalogue/edit_schema_description`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "accept": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            connection_name: schema.connectionName,
            table_schema: schema.schema,
            schema_description: trimmedDescription,
            roles: decodedToken?.resource_access?.darch?.roles || [],
            owner: decodedToken?.preferred_username
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        await refetchSchemaData();
        throw new Error(
          errorData.detail || `Failed to save. Status: ${response.status}`
        );
      }

      const successData = await response.json();
      toast.success(successData.message || "Description updated successfully!");

      await refetchSchemaData();

    } catch (error) {
      console.error("Error updating schema description:", error);
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setSummaryText(schemaData.description || 'Schema description');
    setIsEditing(false);
  };

  // Pagination Logic for Access Data
  const indexOfLastAccessItem = accessCurrentPage * itemsPerPage;
  const indexOfFirstAccessItem = indexOfLastAccessItem - itemsPerPage;
  const currentAccessItems = accessData.slice(indexOfFirstAccessItem, indexOfLastAccessItem);
  const totalAccessPages = Math.ceil(accessData.length / itemsPerPage);

  const handleAccessPageChange = (page) => {
    if (page > 0 && page <= totalAccessPages) {
      setAccessCurrentPage(page);
    }
  };

  return (
    <div className="p-5">
      <Breadcrumb />
      <div className="flex gap-4 mt-10">
        {/* main div */}
        <div className="bg-white w-[70%] h-full p-5">
          {/* heading */}
          <div className="flex justify-between items-center pb-6">
            <div className="flex items-center gap-2">
              <button title="Back" onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <span className="text-[#8d77ba]"><Database /></span>
              <h1 className="font-medium text-xl">{schema?.schema}</h1>
            </div>

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
            <button
              onClick={() => {
                setActiveTab("business");
              }}
              className={`cursor-pointer pb-2 ${activeTab === "business"
                ? "text-[#8d77ba] border-b-2 font-medium border-[#8d77ba]"
                : "text-gray-500"
                }`}
            >
              Business
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
                  isSaving ? (
                    <div className="text-gray-500 pl-7 min-h-[2rem]">
                      Saving description...
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-600 pl-7 min-h-[2rem]">{summaryText}</p>
                      {isUserAuthorized && (
                        <button
                          className="absolute top-3 right-3 pt-2 hover:text-gray-600 text-[#8d77ba]"
                          onClick={() => setIsEditing(true)}
                          title="Edit Schema Description"
                        >
                          <Pencil size={18} />
                        </button>
                      )}
                    </>
                  )
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

              <div className="pt-12">
                <div className="flex items-center gap-x-2">
                  <span className="text-[#8d77ba]">
                    <FileCheck2 className="h-5 w-5 text-[#8d77ba]" />
                  </span>
                  <span className="font-medium text-lg">Compliance</span>
                </div>

                {loadingComplianceApi ? (
                  <div className="pt-4 text-gray-500 text-sm">
                    Loading Compliance tags...
                  </div>
                ) : (
                  <div className="flex gap-3 pt-4 text-sm">
                    {!complianceResponse?.sub_tags || complianceResponse.sub_tags.length === 0 ? (
                      <span className="bg-[#8d77ba] text-white border border-[#8d77ba] p-1 w-20 text-center rounded-2xl">
                        NA
                      </span>
                    ) : (
                      complianceResponse.sub_tags.map((res, idx) => (
                        <span key={idx} className="bg-[#8d77ba] text-white border border-[#8d77ba] p-1 w-20 text-center rounded-2xl">
                          {res.name}
                        </span>
                      ))
                    )}
                  </div>
                )}

              </div>
            </>
          )}

          {activeTab === "access" && (
            loadingAccessData ?
              <div className="pt-7 text-center text-sm text-gray-500 border-t">
                Loading access information...
              </div> :
              <div className="overflow-hidden mt-2 rounded-lg shadow border">
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
                    {currentAccessItems.map((item) => (
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
                                    No users found.
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
                <Pagination
                  currentPage={accessCurrentPage}
                  totalPages={totalAccessPages}
                  onPageChange={handleAccessPageChange}
                  totalItems={accessData.length}
                  itemsPerPage={itemsPerPage}
                />
              </div>
          )}

          {activeTab === "business" && (
            <>
              <div className="flex gap-6 items-center pt-4 border-t">
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveTabBusiness("composite-view")}
                    className="text-[#8d77ba] pb-2"
                  >
                    <Layers size={20} />
                  </button>
                  <button
                    className={`pb-2 ${activeTabBusiness === "composite-view"
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
                    <TableOfContents size={20} />
                  </button>
                  <button
                    className={`pb-2 ${activeTabBusiness === "schema-details"
                      ? `text-[#8d77ba] border-b-2 border-[#8d77ba] font-semibold`
                      : `text-gray-500`
                      }`}
                    onClick={() => setActiveTabBusiness("schema-details")}
                  >
                    Schema detail View
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
          )}
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
            <div className="text-gray-500">Connection</div>
            <div className="font-normal">{schema?.connectionName}</div>

            <div className="text-gray-500">Database</div>
            <div className="font-normal">{schema?.database}</div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 border-b pb-3 pt-7">
            <div className="text-gray-500">Created on</div>
            <div className="font-normal">
              {schema?.CreatedDate.replace(/\//g, "-")}
            </div>

            <div className="text-gray-500">Last updated</div>
            <div className="font-normal">
              {schema?.lastUpdated.replace(/\//g, "-")}
            </div>
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
  );
};

export default SchemaViewScreen;