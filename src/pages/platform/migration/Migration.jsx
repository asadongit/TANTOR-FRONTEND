import React, { useState, useEffect } from 'react';
import MigrationList from './MigrationList'; 
import MigrationEmpty from './MigrationEmpty'; 

const Migration = () => {
  const hostname = import.meta.env.VITE_FAST_API;
  const token = import.meta.env.VITE_ACCESS_TOKEN;
  const [records, setRecords] = useState([]); 
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {

    const fetchData = async () => {
      try {
        const response = await fetch(`${hostname}/metadata-archivals`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        setRecords(data); 
      } catch (error) {
        console.error('Error fetching data:', error);
        setRecords([]); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); 


  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : records.length > 0 ? (
        <MigrationList records={records} />
      ) : (
        <MigrationEmpty />
      )}
    </div>
  );
};

export default Migration;