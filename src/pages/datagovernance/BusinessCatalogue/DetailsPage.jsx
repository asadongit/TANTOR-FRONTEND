import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight, Lightbulb,FilePenLine } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '../../../components/Breadcrumb';

const DetailsPage = () => {
  const navigate = useNavigate();
  const { itemName } = useParams();

  const [mainTab, setMainTab] = useState('Overview');
  const [activeDetail, setActiveDetail] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const formatTitle = (slug) => {
    if (!slug) return '';
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  const pageTitle = formatTitle(itemName);

  const metadata = { status: 'Data type', createdOn: '24-10-2024', lastUpdated: '31-10-2024', owner: 'Abhishek Singh', standard: 'Data source' };
  const summaryData = { domain: '01', category: '01', 'sub-category': '02', terms: '02', tag: '02', 'sub-tag': '50' };
  const allDetailsData = {
    domain: [{ id: '#D01', name: 'Healthcare Domain', description: 'Details related to the primary healthcare domain.' }, { id: '#D02', name: 'Finance Domain', description: 'Financial sector information and data points.' }],
    category: [{ id: '#C01', name: 'Patient Data', description: 'Category for all patient-related information.' }, { id: '#C02', name: 'Billing Data', description: 'Information concerning invoices and payments.' }, { id: '#C03', name: 'Provider Data', description: 'Category for doctors and hospital information.' }],
    'sub-category': [{ id: '#S01', name: 'Demographics', description: 'Sub-category for patient demographic details.' }, { id: '#S02', name: 'Insurance Info', description: 'Patient insurance and coverage details.' }],
    terms: [{ id: '#T01', name: 'HIPAA', description: 'Term related to Health Insurance Portability and Accountability Act.' }],
    tag: [{ id: '#TG1', name: 'PII', description: 'Tag for Personally Identifiable Information.' }, { id: '#TG2', name: 'Confidential', description: 'Tag for confidential data.' }],
    'sub-tag': [{ id: '#ST1', name: 'PHI', description: 'Sub-tag for Protected Health Information.' }],
  };
  
  const technicalData = [
    { id: 1, connection: 'Oracle', database: 'DataSphere', schema: 'A', table: 'B', column: '1' },
    { id: 2, connection: 'Oracle', database: 'DataNest', schema: 'A', table: 'B', column: '1' },
    { id: 3, connection: 'Oracle', database: 'InfoVault', schema: 'A', table: 'B', column: '1' },
    { id: 4, connection: 'Oracle', database: 'DataSphere', schema: 'A', table: 'B', column: '1' },
    { id: 5, connection: 'Oracle', database: 'DataSphere', schema: 'A', table: 'B', column: '1' },
    { id: 6, connection: 'PostgreSQL', database: 'CoreDB', schema: 'C', table: 'D', column: '2' },
    { id: 7, connection: 'PostgreSQL', database: 'ArchiveDB', schema: 'C', table: 'D', column: '2' },
    { id: 8, connection: 'MySQL', database: 'WebAppDB', schema: 'E', table: 'F', column: '3' },
  ];

  const totalPages = Math.ceil(technicalData.length / rowsPerPage);
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentTechnicalItems = technicalData.slice(indexOfFirstItem, indexOfLastItem);
  const goToNextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  const goToPreviousPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

  const handleDetailClick = (detailType) => setActiveDetail(detailType);
  const detailTabs = ['Domain', 'Category', 'Sub - category', 'Terms', 'Tag', 'Sub - tag'];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Breadcrumb />
      <div className="flex items-center gap-4 mb-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow bg-white px-6 py-3 rounded-lg shadow">
          <div className="flex mb-4 mt-2">
            <button onClick={() => setMainTab('Overview')} className={`px-4 py-1 font-semibold rounded-lg ${mainTab === 'Overview' ? 'text-[#8d77ba] bg-[#8d77ba] bg-opacity-25' : 'text-gray-500 hover:text-black'}`}>Overview</button>
            <button onClick={() => setMainTab('Technical')} className={`px-4 py-1 font-semibold rounded-lg ${mainTab === 'Technical' ? 'text-[#8d77ba] bg-[#8d77ba] bg-opacity-25' : 'text-gray-500 hover:text-black'}`}>Technical</button>
          </div>

          {mainTab === 'Overview' && (
            <>
              <p className="text-gray-600 mb-4">This is the description for {pageTitle}. It refers to the information associated with a user's profile in a system...</p>
              <div className="overflow-x-auto rounded-lg shadow">
                <table className="w-full text-left mb-3">
                  <thead className="bg-[#29304a] text-white uppercase text-xs"><tr>{detailTabs.map(tab => <th key={tab} className="p-3">{tab.replace(' - ', '-')}</th>)}</tr></thead>
                  <tbody><tr>{Object.entries(summaryData).map(([key, value]) => (<td key={key} className="px-3 pt-3"><button onClick={() => handleDetailClick(key)} className="text-blue-600 underline font-medium">{value}</button></td>))}</tr></tbody>
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
                      <thead className="bg-[#29304a] text-white"><tr><th className="p-4 font-medium">ID</th><th className="p-4 font-medium">Name</th><th className="p-4 font-medium">Description</th><th className="p-4 font-medium">Quick action</th></tr></thead>
                      <tbody>
                        {(allDetailsData[activeDetail] || []).map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-4 text-gray-600">{item.id}</td><td className="p-4 text-gray-800">{item.name}</td><td className="p-4 text-gray-600">{item.description}</td>
                            <td className="p-4"><button className="p-1.5 hover:bg-gray-200 rounded-full"><ArrowUpRight className="h-5 w-5 text-gray-600" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {mainTab === 'Technical' && (
            <div className="mt-4">
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-left">
                  <thead className="bg-[#29304a] text-white">
                    <tr>
                      <th className="p-4 font-medium">Connection</th><th className="p-4 font-medium">Database</th><th className="p-4 font-medium">Schema</th><th className="p-4 font-medium">Table</th><th className="p-4 font-medium">Column</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTechnicalItems.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-4"><a href="#" className="text-blue-600 hover:underline">{item.connection}</a></td>
                        <td className="p-4 text-gray-800">{item.database}</td>
                        <td className="p-4"><a href="#" className="text-blue-600 hover:underline">{item.schema}</a></td>
                        <td className="p-4"><a href="#" className="text-blue-600 hover:underline">{item.table}</a></td>
                        <td className="p-4"><a href="#" className="text-blue-600 hover:underline">{item.column}</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-gray-600">Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, technicalData.length)} of {technicalData.length} results</span>
                <div className="flex items-center gap-1">
                  <button onClick={goToPreviousPage} disabled={currentPage === 1} className="p-2 rounded-lg disabled:text-gray-300 text-gray-600 hover:bg-gray-100"><ChevronLeft className="h-5 w-5" /></button>
                  <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                  <button onClick={goToNextPage} disabled={currentPage === totalPages} className="p-2 rounded-lg disabled:text-gray-300 text-gray-600 hover:bg-gray-100"><ChevronRight className="h-5 w-5" /></button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-1/4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-purple-400" /> Metadata
            </h3>
            <div className="space-y-3 text-sm">
              {Object.entries(metadata).map(([key, value]) => (<div key={key} className="flex justify-between"><span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span><span className="font-medium text-gray-800">{value}</span></div>))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsPage;