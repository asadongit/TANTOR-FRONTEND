import { useLocation, useNavigate } from "react-router-dom";
import Breadcrumb from "../../../../components/Breadcrumb";
import { ChevronDown, ChevronUp, Database, Lightbulb, Pencil, ChevronLeft, FilePenLine, Check, X, ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import toast from "react-hot-toast";
import { fetchConnectionDetails, secureQuery } from '../Components/function.js';
import { usePersonaStatuses } from '../../../../hooks/dataGovernance/Users/auth';

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

const DatabaseViewScreen = () => {
  const navigate = useNavigate();
  const { token, decodedToken } = useAuth();
  const { personaStatuses } = usePersonaStatuses();
  const location = useLocation();
  const connection = location.state?.connectionData;
  const schema = location.state?.schema;
  const hostnameV1 = window._env_?.VITE_FAST_API;

  const connectionName = connection?.connectionName;

  const [schemaList, setSchemaList] = useState([]);
  const [connectionData, setConnectionData] = useState(connection);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("summary");

  // Access Tab State
  const [accessData, setAccessData] = useState([]);
  const [loadingAccessData, setLoadingAccessData] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  // Connection Description State
  const [isEditing, setIsEditing] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Schema Description State
  const [editingSchemaName, setEditingSchemaName] = useState(null);
  const [editedSchemaDescription, setEditedSchemaDescription] = useState('');
  const [isSavingSchemaDesc, setIsSavingSchemaDesc] = useState(false);

  const [activeTabBusiness, setActiveTabBusiness] = useState("composite-view");
  const [savingSchemaName, setSavingSchemaName] = useState(null);

  const [schemaCurrentPage, setSchemaCurrentPage] = useState(1);
  const [schemaItemsPerPage] = useState(5);

  const [accessCurrentPage, setAccessCurrentPage] = useState(1);
  const [accessItemsPerPage] = useState(5);


  const hasRoleInToken = (roleKey) =>
    decodedToken?.resource_access?.darch?.roles?.some(
        role => role.toLowerCase() === roleKey
    );

  const isUserAuthorized = 
      (hasRoleInToken('persona:data steward') && personaStatuses['persona:data steward'] === true) ||
      (hasRoleInToken('persona:data owner')   && personaStatuses['persona:data owner']   === true);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const secureQueryResponse = await secureQuery({ user_query: "" }, token);
      const policyIds = secureQueryResponse.matched_policy_ids || [];
      const allConnectionsData = await fetchConnectionDetails(policyIds, token);

      const currentConnectionData = allConnectionsData.find(
        item => item.connection_name === connectionName
      );

      if (currentConnectionData) {
        const updatedConnectionData = {
          ...connection,
          description: currentConnectionData.description
        };
        setConnectionData(updatedConnectionData);
        setSummaryText(currentConnectionData.description || 'Connection description');
      }

      const connectionSchemas = {};
      allConnectionsData.forEach(item => {
        if (item.connection_name === connectionName) {
          if (!connectionSchemas[item.connection_name]) {
            connectionSchemas[item.connection_name] = {
              schemas: []
            };
          }

          const existingSchema = connectionSchemas[item.connection_name].schemas.find(
            s => s.name === item.table_schema
          );

          if (!existingSchema) {
            connectionSchemas[item.connection_name].schemas.push({
              name: item.table_schema,
              description: item.table_schema_description || 'Schema description'
            });
          }
        }
      });

      setSchemaList(connectionSchemas[connectionName]?.schemas || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Function to refetch connection data
  const refetchConnectionData = async () => {
    try {
      const secureQueryResponse = await secureQuery({ user_query: "" }, token);
      const policyIds = secureQueryResponse.matched_policy_ids || [];
      const allConnectionsData = await fetchConnectionDetails(policyIds, token);

      // Find the current connection data
      const currentConnectionData = allConnectionsData.find(
        item => item.connection_name === connectionName
      );

      if (currentConnectionData) {
        const updatedConnectionData = {
          ...connectionData,
          description: currentConnectionData.description
        };
        setConnectionData(updatedConnectionData);
        setSummaryText(currentConnectionData.description || 'Connection description');
      }
    } catch (error) {
      console.error('Error refetching connection data:', error);
    }
  };

  // Function to refetch schema data
  const refetchSchemaData = async () => {
    try {
      const secureQueryResponse = await secureQuery({ user_query: "" }, token);
      const policyIds = secureQueryResponse.matched_policy_ids || [];
      const allConnectionsData = await fetchConnectionDetails(policyIds, token);

      // Process the data to get updated schema information
      const connectionSchemas = {};
      allConnectionsData.forEach(item => {
        if (item.connection_name === connectionName) {
          if (!connectionSchemas[item.connection_name]) {
            connectionSchemas[item.connection_name] = {
              schemas: []
            };
          }

          // Check if schema already exists in the array
          const existingSchema = connectionSchemas[item.connection_name].schemas.find(
            s => s.name === item.table_schema
          );

          if (!existingSchema) {
            connectionSchemas[item.connection_name].schemas.push({
              name: item.table_schema,
              description: item.table_schema_description || 'Schema description'
            });
          }
        }
      });

      // Update the schema list
      setSchemaList(connectionSchemas[connectionName]?.schemas || []);
    } catch (error) {
      console.error('Error refetching schema data:', error);
    }
  };

  // Initial data fetch on component mount
  useEffect(() => {
    fetchAllData();
  }, [connectionName, token]);

  const handleSaveConnectionDescription = async () => {
    if (summaryText.trim() === '') {
      toast.error("Description cannot be empty.");
      return;
    }
    const trimmedDescription = summaryText.trim();
    setIsSaving(true);
    setIsEditing(false);
    const creatorRoles = decodedToken?.resource_access?.darch?.roles || [];
    const creatorArray = creatorRoles.map(role =>
      role.startsWith('persona:') ? role.replace('persona:', '') : role
    );
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
            roles: creatorArray || [],
            owner: decodedToken?.preferred_username
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        await refetchConnectionData();
        throw new Error(
          errorData.detail || `Failed to save. Status: ${response.status}`
        );
      }

      const successData = await response.json();
      toast.success(successData.message || "Description updated successfully!");

      await refetchConnectionData();

    } catch (error) {
      console.error("Error updating connection description:", error);
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelConnectionEdit = () => {
    setSummaryText(connectionData.description || 'Connection description');
    setIsEditing(false);
  };

  // Schema description editing handlers
  const handleSchemaEditClick = (schemaItem) => {
    setEditingSchemaName(schemaItem.name);
    setEditedSchemaDescription(schemaItem.description || '');
  };

  const handleSchemaEditCancel = () => {
    setEditingSchemaName(null);
    setEditedSchemaDescription('');
  };

  const handleSaveSchemaDescription = async () => {
    if (!editingSchemaName) return;
    if (editedSchemaDescription.trim() === '') {
      toast.error("Description cannot be empty.");
      return;
    }

    const schemaToSave = editingSchemaName;
    const trimmedDescription = editedSchemaDescription.trim();

    setIsSavingSchemaDesc(true);
    setSavingSchemaName(schemaToSave);
    handleSchemaEditCancel();
    const creatorRoles = decodedToken?.resource_access?.darch?.roles || [];
    const creatorArray = creatorRoles.map(role =>
      role.startsWith('persona:') ? role.replace('persona:', '') : role
    );
    try {
      const response = await fetch(`${hostnameV1}/data_catalogue/edit_schema_description`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          connection_name: connectionName,
          table_schema: schemaToSave,
          schema_description: trimmedDescription,
          roles: creatorArray || [],
          owner: decodedToken?.preferred_username
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update schema description.");
      }

      const successData = await response.json();
      toast.success(successData.message || "Description updated successfully!");
      await refetchSchemaData();

    } catch (error) {
      console.error("Error saving schema description:", error);
      toast.error(error.message || "An error occurred.");
      await refetchSchemaData();
    } finally {
      setIsSavingSchemaDesc(false);
      setSavingSchemaName(null);
    }
  };

  const fetchAccessData = async () => {
    setLoadingAccessData(true);
    setAccessCurrentPage(1);
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
                connection_name: connectionData.connectionName,
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

  // Schema pagination logic
  const schemaTotalItems = schemaList.length;
  const schemaTotalPages = Math.ceil(schemaTotalItems / schemaItemsPerPage);
  const schemaIndexOfLastItem = schemaCurrentPage * schemaItemsPerPage;
  const schemaIndexOfFirstItem = schemaIndexOfLastItem - schemaItemsPerPage;
  const currentSchemaItems = schemaList.slice(schemaIndexOfFirstItem, schemaIndexOfLastItem);

  const handleSchemaPageChange = (newPage) => {
    if (newPage > 0 && newPage <= schemaTotalPages) {
      setSchemaCurrentPage(newPage);
    }
  };

  const accessTotalItems = accessData.length;
  const accessTotalPages = Math.ceil(accessTotalItems / accessItemsPerPage);
  const accessIndexOfLastItem = accessCurrentPage * accessItemsPerPage;
  const accessIndexOfFirstItem = accessIndexOfLastItem - accessItemsPerPage;
  const currentAccessItems = accessData.slice(accessIndexOfFirstItem, accessIndexOfLastItem);

  const handleAccessPageChange = (newPage) => {
    if (newPage > 0 && newPage <= accessTotalPages) {
      setAccessCurrentPage(newPage);
    }
  };

  return (
    <div className="p-4">
      <Breadcrumb />
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-lg text-gray-500">Loading...</div>
          </div>
        </div>
      ) : (
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
                <h1 className="font-medium text-xl">{connectionData?.connectionName}</h1>
              </div>

              <div className="flex gap-7 text-sm">
                <div className="border-r pr-6 text-center">
                  <span className="font-medium">{connectionData?.Schema}</span>
                  <div className="text-gray-500">Schema</div>
                </div>
                <div className="pr-6 text-center">
                  <span className="font-medium">{connectionData?.Tables}</span>
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
                            title="Edit Connection Description"
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
                          onClick={handleCancelConnectionEdit}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-4 py-1.5 text-sm font-medium bg-[#8d77ba] text-white rounded hover:bg-[#7a66a8] disabled:bg-gray-400 disabled:cursor-not-allowed"
                          onClick={handleSaveConnectionDescription}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden mt-10 text-sm border">
                  <table className="w-full">
                    <thead className="bg-[#29304a] text-white">
                      <tr>
                        <th className="text-left p-4 w-16">Id</th>
                        <th className="text-left p-4">Schema Name</th>
                        <th className="text-left p-4">Schema Description</th>
                        {isUserAuthorized && (
                          <th className="text-left p-4 w-20">Action</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {currentSchemaItems.length > 0 ? (
                        currentSchemaItems.map((schemaItem, idx) => {
                          const isEditingThisRow = editingSchemaName === schemaItem.name;
                          return (
                            <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                              <td className="p-4">{schemaIndexOfFirstItem + idx + 1}</td>
                              <td className="p-4 font-medium text-gray-800">{schemaItem.name}</td>
                              <td className="p-4 text-gray-600 max-w-xs">
                                {isEditingThisRow ? (
                                  <input
                                    type="text"
                                    value={editedSchemaDescription}
                                    onChange={(e) => setEditedSchemaDescription(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-400"
                                    autoFocus
                                    disabled={isSavingSchemaDesc}
                                  />
                                ) : savingSchemaName === schemaItem.name ? (
                                  <span className="text-gray-500 italic">Saving...</span>
                                ) : (
                                  <span className="truncate">
                                    {schemaItem.description || 'Schema Description.'}
                                  </span>
                                )}
                              </td>
                              {isUserAuthorized && (
                                <td className="p-4 text-sm font-medium">
                                  {isEditingThisRow ? (
                                    <div className="flex items-center gap-3">
                                      <button
                                        onClick={handleSaveSchemaDescription}
                                        disabled={isSavingSchemaDesc}
                                        className="text-green-600 hover:text-green-800 disabled:text-gray-300"
                                        title="Save"
                                      >
                                        <Check size={20} />
                                      </button>
                                      <button
                                        onClick={handleSchemaEditCancel}
                                        disabled={isSavingSchemaDesc}
                                        className="text-red-500 hover:text-red-700 disabled:text-gray-300"
                                        title="Cancel"
                                      >
                                        <X size={20} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleSchemaEditClick(schemaItem)}
                                      className="text-[#8d77ba]"
                                      title="Edit Schema Description"
                                      disabled={savingSchemaName !== null}
                                    >
                                      <Pencil size={16} />
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={isUserAuthorized ? "4" : "3"} className="p-4 text-center text-gray-500">
                            No schemas found for this connection.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <Pagination
                    currentPage={schemaCurrentPage}
                    totalPages={schemaTotalPages}
                    onPageChange={handleSchemaPageChange}
                    totalItems={schemaTotalItems}
                    itemsPerPage={schemaItemsPerPage}
                  />
                </div>
              </>
            )}

            {activeTab === "access" && (
              loadingAccessData ?
                <div className="pt-7 text-center text-sm text-gray-500 border-t">
                  Loading access information ...
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
                  <Pagination
                    currentPage={accessCurrentPage}
                    totalPages={accessTotalPages}
                    onPageChange={handleAccessPageChange}
                    totalItems={accessTotalItems}
                    itemsPerPage={accessItemsPerPage}
                  />
                </div>
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
              <div className="text-gray-500">Data Source</div>
              <div className="font-normal">{connectionData?.Database}</div>

              <div className="text-gray-500">Created on</div>
              <div className="font-normal">
                {connectionData?.CreatedDate?.replace(/\//g, "-")}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 border-b pb-3 pt-7">
              <div className="text-gray-500">Last updated</div>
              <div className="font-normal">
                {connectionData?.updatedDate?.replace(/\//g, "-")}
              </div>
              <div className="text-gray-500">Owner</div>
              <div className="font-normal">{connectionData?.owner}</div>

            </div>

            <div className="grid grid-cols-2 gap-y-4 border-b pb-3 pt-7">
              <div className="text-gray-500">Steward</div>
              <div className="font-normal">Admin</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseViewScreen;