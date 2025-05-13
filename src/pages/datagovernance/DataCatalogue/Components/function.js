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