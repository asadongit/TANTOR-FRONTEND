import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../../../../../context/AuthContext.jsx';

const Profiling = ({ query,setProfilingSuccess }) => {
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef(null);
  const [profilingData, updateProfilingData] = useState("");
  const { token, hostnameV1, decodedToken } = useAuth();

  useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        setProfilingSuccess(false)
        try {
          const response = await fetch(`${hostnameV1}/profiling`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                query: query 
            })
          });

          if (response.ok) {
            var result = await response.text();
            result = result.replace(/Brought to you by YData/g, '');
            updateProfilingData(result);
            setProfilingSuccess(true)
          } else {
            console.error('Failed to fetch data:', response.statusText);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
  }, []);

  useEffect(() => {
    if (profilingData && iframeRef.current) {
      const blob = new Blob([profilingData], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      iframeRef.current.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [profilingData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height: 'calc(68vh)' }}>
        <Loader2 className="w-12 h-12 animate-spin text-[#8d77ba]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex space-x-4 justify-between items-center">
        <div
          className="w-full"
          style={{
            height: 'calc(68vh)',
            border: '1px solid #ddd',
            backgroundColor: '#fff',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <iframe
            ref={iframeRef}
            title="HTML Content"
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
};

export default Profiling;