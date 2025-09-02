import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { relationship_1, relationship_2, impact_1, lineage_1, dependency_1 } from "../../../pages/datagovernance/Databot/SampleResponses";

export const useDatabotAPI = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const getRelationshipAPI = async (ques) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${window._env_?.VITE_FAST_API}/databot/relationship`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: ques }),
        }
      );

      if (!response.ok) throw new Error(`HTTP error! ${response.status}`);

      return await response.json();

    } catch (err) {
      setLoading(false);
      console.error("Error:", err);
      return err;

    } finally {
      setLoading(false);
    }
  };

  const getLineageAPI = async (ques) => {
    setLoading(true);
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/databot/lineage`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: ques })
      })

      if(!response.ok) throw new Error(`HTTP error! ${response.status}`);

      const json = await response.json();

      return json;
      // return lineage_1;

    } catch (err) {
      console.error("Error: ", err);
      setLoading(false);
      return err;

    } finally {
      setLoading(false);
    }
  }

  const getImpactAPI = async (ques) => {
    setLoading(true);
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/databot/impact`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: ques })
      })

      if(!response.ok) throw new Error(`HTTP error! ${response.status}`);

      return await response.json();

    } catch (err) {
      console.error("Error: ", err);
      setLoading(false);
      return err;

    } finally {
      setLoading(false);
    }
  }

  const getDependencyAPI = async (ques) => {
    setLoading(true);
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/databot/dependency`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: ques })
      })

      if(!response.ok) throw new Error(`HTTP error! ${response.status}`);

      return await response.json();

    } catch (err) {
      console.error("Error: ", err);
      setLoading(false);
      return err;

    } finally {
      setLoading(false);
    }
  }

  const refreshDatabotAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/databot/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if(!response.ok) throw new Error(`HTTP error! ${response.status}`);

      return await response.json();

    } catch (err) {
      console.error("Error: ", err);
      setLoading(false);
      return err;

    } finally {
      setLoading(false);
    }
  }

  return { getRelationshipAPI,
    getLineageAPI,
    getImpactAPI, 
    getDependencyAPI,
    refreshDatabotAPI,
    loading
   };
};
