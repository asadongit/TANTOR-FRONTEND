import React, { useState, useEffect } from 'react';
import { Drawer, CircularProgress } from '@mui/material';
import { X, Clock, Play, Copy, Check, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from "../../../../context/AuthContext";

const QueryItem = ({ query, index, onSelectQuery, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLong = query.split('\n').length > 4 || query.length > 200;

  return (
    <div className="group relative bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-[#d4cbe8] transition-all duration-200 overflow-hidden flex flex-col">
      <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/90 backdrop-blur-sm p-1 rounded-lg border border-gray-100 shadow-sm">
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1 p-1.5 text-gray-500 hover:text-[#8e78b7] hover:bg-[#f3f0fb] rounded-md transition-colors"
          title="Copy query"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
        <button
          onClick={() => {
            onSelectQuery(query);
            onClose();
          }}
          className="flex items-center gap-1 p-1.5 text-[#8e78b7] hover:text-white hover:bg-[#8e78b7] rounded-md transition-colors"
          title="Use Query"
        >
          <Play size={14} />
        </button>
      </div>
      
      {/* Query Text */}
      <div 
        className={`p-4 bg-white text-gray-700 text-[12.5px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed relative ${!expanded && isLong ? 'max-h-[120px] overflow-hidden' : 'qe-scroll'}`}
      >
        {query}
        {!expanded && isLong && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
        )}
      </div>
      
      {isLong && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="w-full py-1.5 flex justify-center items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {expanded ? (
              <>Show Less <ChevronUp size={12} /></>
            ) : (
              <>Show More <ChevronDown size={12} /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default function QueryHistoryDrawer({ isOpen, onClose, onSelectQuery }) {
  const { token, hostnameV1, project, decodedToken } = useAuth();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const owner = decodedToken?.preferred_username;
      const proj = project === 'default' || project === 'none' ? 'default' : project;
      
      const res = await fetch(`${hostnameV1}/queries/${owner}/${proj}/df`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch query history');
      }
      
      const data = await res.json();
      setQueries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredQueries = queries.filter(q => q.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: { width: 500, backgroundColor: '#ffffff', borderLeft: '1px solid #eaeaea' }
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between p-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#f3f0fb] rounded-lg">
                <Clock size={18} className="text-[#8e78b7]" />
              </div>
              <h2 className="text-md font-medium text-gray-800 tracking-tight">Query History</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="px-5 pb-4">
            <div className="relative flex items-center w-full">
              <Search size={14} className="absolute left-3 text-gray-400" />
              <input 
                type="text"
                placeholder="Search past queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7]/30 focus:border-[#8e78b7] transition-all text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 qe-scroll bg-[#faf9fc]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <CircularProgress size={22} sx={{ color: "#8e78b7" }} />
              <span className="text-[13px] text-gray-500 font-medium">Loading history...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-red-500">
              <span className="text-[13px] font-medium">{error}</span>
              <button 
                onClick={fetchHistory}
                className="text-[12px] underline hover:text-red-600"
              >
                Try Again
              </button>
            </div>
          ) : queries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
              <Clock size={32} className="opacity-30" />
              <span className="text-[13px] font-medium">No recent queries found</span>
            </div>
          ) : filteredQueries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
              <Search size={32} className="opacity-30" />
              <span className="text-[13px] font-medium">No queries match '{searchTerm}'</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredQueries.map((query, index) => (
                <QueryItem 
                  key={index} 
                  query={query} 
                  index={index} 
                  onSelectQuery={onSelectQuery} 
                  onClose={onClose} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
