import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

const SupersetReport = ({ showModal, setShowModal, currentReportName }) => {
  const [isLoading, setIsLoading] = useState(false);

  const loginToSuperset = async () => {
    try {
      const response = await fetch('https://visualization.app.translab.io/api/v1/security/login', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: "admin",
          provider: "db",
          refresh: true,
          username: "admin"
        })
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Login successful:', data);

      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const fetchDashboard = async () => {
    try {
      const dashboardUrl = `https://visualization.app.translab.io/api/v1/dashboard?q=(filters%3A!((col%3Adashboard_title%2Copr%3Aeq%2Cvalue%3A%27${encodeURIComponent(currentReportName)}%27)))`;

      const response = await fetch(dashboardUrl, {
        method: 'GET',
        headers: {
        //   'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        //   'accept-language': 'en-US,en;q=0.9',
        //   'priority': 'u=0, i',
        //   'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
        //   'sec-ch-ua-mobile': '?0',
        //   'sec-ch-ua-platform': '"Windows"',
        //   'sec-fetch-dest': 'document',
        //   'sec-fetch-mode': 'navigate',
        //   'sec-fetch-site': 'none',
        //   'sec-fetch-user': '?1',
        //   'upgrade-insecure-requests': '1',
        //   'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
          'Cookie': 'session=.eJyVjm1KBDEQRO-S37KTdL42cxWRodPpdoNhZ5hkBRXvbsQT-KuogveoL7XJyf2mVsHW-UlttahVeZNEU3SaCkQnyWvW4gNlRDIRI0mWEgns1QXm7F1xCNFDNImLTeItBUmUCRJGzxLRXE0CL1ZAzzA585TElHMAAesQgy7E7LQlIq3mkUfn8--NmZX6KdvY3_g-hwKCERmiWGMtFQmGrcsQQvaQrrZYZBfSr6bthI0nM8EndeArb7fax35-qPVZ3cY41mV5r_2BrX7iqPv9gsdxGSfee8N8qfty7o370ia1TMU_EC51LE69fP8AaF5xIw.aDNQjw.Bxbxe9U_vvYBBhmM8Xl0SztsLMs'
        }
      });

      if (!response.ok) {
        throw new Error(`Dashboard fetch failed: ${response.status}`);
      }

      const dashboardData = await response.json();
      console.log('Dashboard API Result:', dashboardData);

      return dashboardData;
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      throw error;
    }
  };

  const handleSupersetIntegration = async () => {
    if (!currentReportName) return;

    setIsLoading(true);
    try {
      console.log('Starting Superset integration for report:', currentReportName);

      await loginToSuperset();

      await fetchDashboard();
    } catch (error) {
      console.error('Superset integration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showModal && currentReportName) {
      handleSupersetIntegration();
    }
  }, [showModal, currentReportName]);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Report View</h2>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        <div className="mb-4">
          <p className="text-gray-700">
            Viewing LIST type report: <strong>{currentReportName}</strong>
          </p>
          {isLoading && (
            <div className="mt-2">
              <p className="text-blue-600">Loading Superset dashboard...</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            disabled={isLoading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupersetReport;
