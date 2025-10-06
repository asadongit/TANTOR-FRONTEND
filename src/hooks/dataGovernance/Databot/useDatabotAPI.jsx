import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";

export const useDatabotAPI = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const [secureQueryLoading, setSecureQueryLoading] = useState(false);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);

  const getSecureQuery = async () => {
    setSecureQueryLoading(true);

    try {
      const response = await fetch(
        `${window._env_?.VITE_FAST_API}/secure-query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_query: "" }),
        }
      );

      if(!response.ok) throw new Error(`HTTP error! ${response.status}`);

      const json = await response.json();

      return json;

    } catch (err) {
      setSecureQueryLoading(false);
      return err;

    } finally {
      setSecureQueryLoading(false);
    }
  }


  const getConnectionDetails = async (policy) => {
    setConnectionsLoading(true);

    try {
      const response = await fetch(
        `${window._env_?.VITE_FAST_API}/connection_details`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ policy_id: policy }),
        }
      );

      if(!response.ok) throw new Error(`HTTP error! ${response.status}`);

      const json = await response.json();
      toast.success("Connections fetched successfully!")

      return json;

    } catch (err) {
      setConnectionsLoading(false);
      return err;

    } finally {
      setConnectionsLoading(false);
    }
  }

  const getSchemaDetails = async (connectionName) => {
    setSchemaLoading(true);

    try {
      const response = await fetch(
        `${window._env_?.VITE_FAST_API}/schema/${connectionName}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if(!response.ok) throw new Error(`HTTP error! ${response.status}`);

      const json = await response.json();

      return json;

    } catch {
      setSchemaLoading(false);
      return null;

    } finally {
      setSchemaLoading(false);
    }
  }

  const getRelationshipAPI = async (ques, connection, schema) => {
    const modified_ques = ques.trim().toLowerCase();
    
    setLoading(true);
    try {
      const response = await fetch(
        `${window._env_?.VITE_DATABOT_API}/databot/relationship`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
           body: JSON.stringify({ 
            query: modified_ques,
            schema: schema,
            connection_name: connection
          })
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

  const getLineageAPI = async (ques, connection, schema) => {
    setLoading(true);
    try {
      const response = await fetch(`${window._env_?.VITE_DATABOT_API}/databot/lineage`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          query: ques,
          schema: schema,
          connection_name: connection
        })
      })

      if(!response.ok) throw new Error(`HTTP error! ${response.status}`);

      const json = await response.json();

      return json;

    } catch (err) {
      console.error("Error: ", err);
      setLoading(false);
      return null;

    } finally {
      setLoading(false);
    }
  }

  const getImpactAPI = async (ques, connection, schema) => {
    setLoading(true);
    try {
      const response = await fetch(`${window._env_?.VITE_DATABOT_API}/databot/impact`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          query: ques,
          schema: schema,
          connection_name: connection
        })
      })

      if(!response.ok) throw new Error(`HTTP error! ${response.status}`);

      return await response.json();

    } catch (err) {
      console.error("Error: ", err);
      setLoading(false);
      return null;

    } finally {
      setLoading(false);
    }
  }

  const getDependencyAPI = async (ques, connection, schema) => {
    setLoading(true);
    try {
      const response = await fetch(`${window._env_?.VITE_DATABOT_API}/databot/dependency`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          query: ques,
          schema: schema,
          connection_name: connection
        })
      })

      if(!response.ok) throw new Error(`HTTP error! ${response.status}`);

      return await response.json();

    } catch (err) {
      console.error("Error: ", err);
      setLoading(false);
      return null;

    } finally {
      setLoading(false);
    }
  }

  const refreshDatabotAPI = async (policy, connection, schema) => {
    setLoading(true);
    try {
      const response = await fetch(`${window._env_?.VITE_DATABOT_API}/databot/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          policy_id : policy,
          connection_name: connection,
          schema: schema
        })
      })

      if(!response.ok) {
        throw new Error(`HTTP error! ${response.status}`);
      }

      const json = await response.json();

      if(json.status === "degraded") {
        throw new Error(`HTTP error! ${json.status}`);
      }
      toast.success("Refreshed successfully!")

      return json;

    } catch (err) {
      console.error("Error: ", err);
      setLoading(false);
      toast.error("Refresh was unsuccessful. Try again!")
      return null;

    } finally {
      setLoading(false);
    }
  }

  return { 
    getSecureQuery,
    secureQueryLoading,
    getConnectionDetails,
    connectionsLoading,
    getSchemaDetails,
    schemaLoading,
    getRelationshipAPI,
    getLineageAPI,
    getImpactAPI, 
    getDependencyAPI,
    refreshDatabotAPI,
    loading
   };
};
