export const secureQuery = async (queryParams, token) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_FAST_API}/secure-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(queryParams)
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in secure query:", error);
    throw error;
  }
};

export const fetchConnectionDetails = async (policyIds, token) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_FAST_API}/connection_details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        policy_id: policyIds
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error(`Error fetching connection details:`, error);
    return [];
  }
};