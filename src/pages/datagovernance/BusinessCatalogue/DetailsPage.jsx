import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight, Lightbulb, FilePenLine } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Breadcrumb from '../../../components/Breadcrumb';
import { secureQuery } from '../DataCatalogue/Components/function';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';


const DetailsPage = () => {
  const location = useLocation();
  const item = location.state?.glossaryItem;
  const navigate = useNavigate();
  const { token, decodedToken } = useAuth();


  const [mainTab, setMainTab] = useState('Overview');
  const [activeDetail, setActiveDetail] = useState(null);

  const [overviewData, setOverviewData] = useState(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState(null);

  const [technicalData, setTechnicalData] = useState([]);
  const [isTechnicalLoading, setIsTechnicalLoading] = useState(false);
  const [technicalError, setTechnicalError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    const fetchOverviewData = async () => {
      if (!item) return;
      setIsOverviewLoading(true);
      setOverviewError(null);
      try {
        const DomainId = Array.isArray(item?.DomainId) ? item.DomainId[0] : item?.DomainId;
        const payload = { asset: [{ asset_id: item.id, domain_id: DomainId, asset_type: item.AssetType }] };
        const response = await fetch(`${window._env_?.VITE_FAST_API}/business_glossary/overview`, {
          method: 'POST',
          headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
        const data = await response.json();
        setOverviewData(data);
      } catch (error) {
        console.error("Failed to fetch overview data:", error);
        setOverviewError(error.message);
        setOverviewData(null);
      } finally {
        setIsOverviewLoading(false);
      }
    };
    fetchOverviewData();
  }, [item]);

  useEffect(() => {
    const transformApiResponse = (apiData) => {
      const flattenedData = [];
      let idCounter = 1;
      apiData.forEach(entry => {
        if (entry.columns && entry.columns.length > 0) {
          entry.columns.forEach(columnName => {
            flattenedData.push({ id: idCounter++, connection: entry.connection, schema: entry.schema, table: entry.table, column: columnName });
          });
        } else {
          flattenedData.push({ id: idCounter++, connection: entry.connection, schema: entry.schema, table: entry.table, column: '-' });
        }
      });
      return flattenedData;
    };

    const fetchTechnicalData = async () => {
      if (!item) return;
      setIsTechnicalLoading(true);
      setTechnicalError(null);
      setCurrentPage(1);
      try {
        const secureQueryResponse = await secureQuery({ user_query: "" }, token);
        const policyIds = secureQueryResponse.matched_policy_ids || [];

        if (policyIds.length === 0) {
          // toast.error("No policy is linked to this user")
          return;
        }

        const payload = { policy_ids: policyIds, asset: [{ asset_id: item.id, domain_id: item.DomainId, asset_type: item.AssetType }] };
        const response = await fetch(`${window._env_?.VITE_FAST_API}/business_glossary/overview/technical`, {
          method: 'POST',
          headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
        const data = await response.json();
        const formattedData = transformApiResponse(data);
        setTechnicalData(formattedData);
      } catch (error) {
        console.error("Failed to fetch technical data:", error);
        setTechnicalError(error.message);
        setTechnicalData([]);
      } finally {
        setIsTechnicalLoading(false);
      }
    };

    if (mainTab === 'Technical') {
      fetchTechnicalData();
    }
  }, [mainTab, item]);

  const detailTabs = ['Domain', 'Category', 'Sub-category', 'Term', 'Tag', 'Sub-tag'];
  const getApiKeyFromDetail = (detail) => detail ? detail.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('') : null;
  const activeDetailDataKey = getApiKeyFromDetail(activeDetail);
  const currentDetails = overviewData && activeDetailDataKey ? overviewData[activeDetailDataKey] || [] : [];
  const handleDetailClick = (detailType) => setActiveDetail(detailType);

  const totalPages = Math.ceil(technicalData.length / rowsPerPage);
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentTechnicalItems = technicalData.slice(indexOfFirstItem, indexOfLastItem);
  const goToNextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  const goToPreviousPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));


  const handleQuickAction = (detailItem) => {

    const glossaryItemForNav = {
      id: detailItem.asset_id,
      Name: detailItem.name,
      Description: detailItem.description,
      status: detailItem.status,
      AssetType: detailItem.asset_type,
      DomainId: detailItem.domain_id,
      Owner: detailItem.owner,
      CreatedDate: detailItem.created_date,
      UpdatedDate: detailItem.updated_date
    };

    const urlFriendlyName = detailItem.asset_type?.toLowerCase();
    const destinationUrl = `/datagovernance/business-catalogue/glossary/${urlFriendlyName}`;
    navigate(destinationUrl, { state: { glossaryItem: glossaryItemForNav } });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Breadcrumb />
      <div className="flex items-center gap-4 mb-3">
        <button title="Back" onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold">{item?.Name}</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow bg-white px-6 py-3 rounded-lg shadow">
          <div className="flex mb-4 mt-2">
            <button onClick={() => setMainTab('Overview')} className={`px-4 py-1 font-semibold rounded-lg ${mainTab === 'Overview' ? 'text-[#8d77ba] bg-[#8d77ba] bg-opacity-25' : 'text-gray-500 hover:text-black'}`}>Overview</button>
            <button onClick={() => setMainTab('Technical')} className={`px-4 py-1 font-semibold rounded-lg ${mainTab === 'Technical' ? 'text-[#8d77ba] bg-[#8d77ba] bg-opacity-25' : 'text-gray-500 hover:text-black'}`}>Technical</button>
          </div>

          {mainTab === 'Overview' && (
            isOverviewLoading ? <p className="text-center p-8">Loading overview data...</p> :
              overviewError ? <p className="text-center p-8 text-red-500">Error: {overviewError}</p> :
                !overviewData ? <p className="text-center p-8 text-gray-500">No overview data available.</p> :
                  (
                    <>
                      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-2 pt-2">
                        <FilePenLine className="h-5 w-5 text-[#8d77ba]" />
                        <span>Description</span>
                      </h2>
                      <p className="text-gray-600 mb-4">{item?.Description}</p>

                      <div className="overflow-x-auto rounded-lg shadow">
                        <table className="w-full text-left mb-3">
                          <thead className="bg-[#29304a] text-white uppercase text-xs">
                            <tr>{detailTabs.map(tab => <th key={tab} className="p-3">{tab}</th>)}</tr>
                          </thead>
                          <tbody>
                            <tr>
                              {detailTabs.map(tab => {
                                const stateKey = tab.toLowerCase().replace('-', '-');
                                const apiKey = getApiKeyFromDetail(stateKey);
                                const count = overviewData.Counts[apiKey] || 0;
                                return (
                                  <td key={stateKey} className="px-3 pt-3">
                                    <button onClick={() => handleDetailClick(stateKey)} className="text-blue-600 underline font-medium" disabled={count === 0}>{count}</button>
                                  </td>
                                );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      {activeDetail && (
                        <div className="mt-6">
                          <h2 className="text-2xl font-semibold mb-2">Details</h2>
                          <div className="flex border-b mb-4 flex-wrap">
                            {detailTabs.map(tab => {
                              const tabKey = tab.toLowerCase().replace(' - ', '-');
                              return (<button key={tabKey} onClick={() => handleDetailClick(tabKey)} className={`px-10 py-2 font-semibold ${activeDetail === tabKey ? 'text-[#8e78b7] border-b-2 border-[#8e78b7]' : 'text-gray-500'}`}>{tab}</button>);
                            })}
                          </div>
                          <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left">
                              <thead className="bg-[#29304a] text-white">
                                <tr>
                                  <th className="p-4 font-medium">S.No.</th>
                                  <th className="p-4 font-medium">Name</th>
                                  <th className="p-4 font-medium">Description</th>
                                  <th className="p-4 font-medium">Quick action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentDetails.length > 0 ? (
                                  currentDetails.map((detailItem, index) => (
                                    <tr key={`${detailItem.asset_id}-${index}`} className="border-b hover:bg-gray-50">
                                      <td className="p-2 text-gray-600">{index + 1}</td>
                                      <td className="p-2 text-gray-800">{detailItem.name}</td>
                                      <td className="p-2 text-gray-600">{detailItem.description || 'N/A'}</td>
                                      <td className="p-2">
                                        <button title="See Details" onClick={() => handleQuickAction(detailItem)} className="p-1.5 hover:bg-gray-200 rounded-full">
                                          <ArrowUpRight className="h-5 w-5 text-gray-600" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr><td colSpan="4" className="text-center p-8 text-gray-500">No data available for this section.</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )
          )}

          {mainTab === 'Technical' && (
            <div className="mt-4">
              {isTechnicalLoading ? <p className="text-center p-8">Loading technical data...</p> :
                technicalError ? <p className="text-center p-8 text-red-500">Error: {technicalError}</p> :
                  (
                    <>
                      <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-left">
                          <thead className="bg-[#29304a] text-white">
                            <tr>
                              <th className="p-3 font-medium">Id</th>
                              <th className="p-3 font-medium">Connection</th>
                              <th className="p-3 font-medium">Schema</th>
                              <th className="p-3 font-medium">Table</th>
                              <th className="p-3 font-medium">Column</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentTechnicalItems.length > 0 ? currentTechnicalItems.map((techItem, index) => (
                              <tr key={techItem.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 text-gray-600">{indexOfFirstItem + index + 1}</td>
                                <td className="p-3 text-gray-800 ">{techItem.connection}</td>
                                <td className="p-3 text-gray-800 ">{techItem.schema}</td>
                                <td className="p-3 text-gray-800 ">{techItem.table}</td>
                                <td className="p-3 text-gray-800">{techItem.column}</td>
                              </tr>
                            )) : (
                              <tr><td colSpan="5" className="text-center p-8 text-gray-500">No technical data available.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {technicalData.length > 0 && (
                        <div className="flex justify-between items-center px-4 py-3">
                          <span className="text-sm text-gray-600">Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, technicalData.length)} of {technicalData.length} results</span>
                          <div className="flex items-center gap-1">
                            <button title="Back" onClick={goToPreviousPage} disabled={currentPage === 1} className="p-2 rounded-lg disabled:text-gray-300 text-gray-600 hover:bg-gray-100"><ChevronLeft className="h-5 w-5" /></button>
                            <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                            <button title="Next" onClick={goToNextPage} disabled={currentPage === totalPages} className="p-2 rounded-lg disabled:text-gray-300 text-gray-600 hover:bg-gray-100"><ChevronRight className="h-5 w-5" /></button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
            </div>
          )}
        </div>

        <div className="w-full lg:w-1/4">
          <div className="bg-white p-5 rounded-lg shadow-sm text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#8d77ba]">
                <Lightbulb />
              </span>
              <h3 className="font-normal text-lg">Metadata</h3>
            </div>

            <div className="grid grid-cols-2 gap-y-4 border-b pb-3 pt-7">
              <div className="text-gray-500">Created Date</div>
              <div className="font-normal">
                {item.CreatedDate ? new Date(item.CreatedDate).toLocaleDateString() : 'N/A'}
              </div>

              <div className="text-gray-500">Updated Date</div>
              <div className="font-normal">
                {item.UpdatedDate ? new Date(item.UpdatedDate).toLocaleDateString() : 'N/A'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 border-b pb-3 pt-7">
              <div className="text-gray-500">Status</div>
              <div className="font-normal">
                {item.status}
              </div>
              <div className="text-gray-500">Owner</div>
              <div className="font-normal">{item.Owner || '-'}</div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsPage;