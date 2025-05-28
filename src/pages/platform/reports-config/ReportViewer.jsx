import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Download, FileText, FileSpreadsheet } from 'lucide-react';

const ReportViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!location.state?.reportPath) {
      navigate('/reports-config');
      return;
    }

    fetchParameterPrompt();
  }, [location.state, navigate]);

  const fetchParameterPrompt = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${import.meta.env.VITE_BIRT_API}/frameset?__report=${location.state.reportPath}`;
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch parameter prompt');
      }
      const text = await response.text();
      setContent(text);
    } catch (err) {
      console.error('Error fetching parameter prompt:', err);
      setError('Failed to load parameter prompt: ' + err.message);
    }
    setLoading(false);
  };

  const fetchReport = async (format, params = {}) => {
    if (isFetching) return;
    setIsFetching(true);
    setLoading(true);
    setError(null);
    try {
      const urlParams = new URLSearchParams({
        __report: location.state.reportPath,
        __format: format === 'html' ? 'html' : format,
        ...params,
      });
      const url = `${import.meta.env.VITE_BIRT_API}/run?${urlParams.toString()}`;
      console.log('Fetching Report URL:', url);
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }

      if (format === 'html') {
        const text = await response.text();
        setContent(text);
      } else {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${location.state.reportName}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to load report: ' + err.message);
    }
    setLoading(false);
    setIsFetching(false);
  };

  const handleExport = (format) => {
    setIsDropdownOpen(false);
    fetchReport(format);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const params = {};
    formData.forEach((value, key) => {
      if (key !== '__report' && key !== '__format') {
        params[key] = value;
      }
    });
    console.log('Submitted Parameters:', params);
    fetchReport('html', params);
  };

  const handleLinkClick = (e) => {
    const target = e.target.closest('a');
    if (target && target.href.includes('/birt')) {
      e.preventDefault();
      console.log('Intercepted BIRT link:', target.href);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col">
      <header className="bg-white shadow-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              <Download className="w-6 h-6" />
              <ChevronDown className="w-5 h-5" />
            </button>
            {isDropdownOpen && (
              <div className="absolute top-10 left-0 bg-white shadow-lg rounded-lg py-2 w-48 z-10">
                <button
                  onClick={() => handleExport('html')}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <FileText className="w-5 h-5" />
                  <span>Export as HTML</span>
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <FileText className="w-5 h-5" />
                  <span>Export as PDF</span>
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Export as CSV</span>
                </button>
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {location.state?.reportName || 'Report Viewer'}
          </h1>
        </div>
        <button
          onClick={() => navigate('/reports-config')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <span>Back to Reports</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </header>
      <main className="flex-1 p-6 overflow-auto">
        {loading && (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
          </div>
        )}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            {error}
          </div>
        )}
        {content && (
          <div
            className="bg-white shadow-lg rounded-lg p-6 border border-gray-200 report-container"
            dangerouslySetInnerHTML={{ __html: content }}
            onClick={handleLinkClick}
            onSubmit={handleFormSubmit}
          />
        )}
      </main>
      <style jsx>{`
        .report-container a[href^="/birt"] {
          display: none;
        }
        .report-container form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .report-container input {
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .report-container button {
          padding: 0.5rem 1rem;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .report-container button:hover {
          background-color: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default ReportViewer;