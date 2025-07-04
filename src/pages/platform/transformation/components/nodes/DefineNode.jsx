import React, { useState, useEffect, useRef, useCallback } from "react";
import { Handle, Position } from "reactflow";
import { FilePlus, Loader } from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";

const hostname = window._env_?.VITE_FAST_API;

// Use a module-level cache for transformation names
const transformationNamesCache = {
  names: [],
  timestamp: 0,
  expiryTime: 60000,
  lastProject: null,
  lastUser: null,
};

export const DefineNode = ({ id, data }) => {
  const [nameExists, setNameExists] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [nameError, setNameError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [attemptedSave, setAttemptedSave] = useState(false);
  const nameCheckTimeout = useRef(null);
  const { project, decodedToken, token } = useAuth();

  // Memoized fetch function to avoid repeated calls
  const getExistingTransformationNames = useCallback(async () => {
    const now = Date.now();
    const currentUser = decodedToken?.preferred_username;
    // Only fetch if cache is expired or project/user changed
    if (
      now - transformationNamesCache.timestamp < transformationNamesCache.expiryTime &&
      transformationNamesCache.lastProject === project &&
      transformationNamesCache.lastUser === currentUser
    ) {
      return transformationNamesCache.names;
    }

    // Prevent concurrent fetches
    if (transformationNamesCache._fetchPromise) {
      return transformationNamesCache._fetchPromise;
    }

    transformationNamesCache._fetchPromise = (async () => {
      try {
        const response = await fetch(
          `${hostname}/etl/transformation/tableview?project=${project}&created_by=${currentUser}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch transformation names");
        }

        const data = await response.json();
        const names = data.map((item) => item.transformation_name.toLowerCase());

        transformationNamesCache.names = names;
        transformationNamesCache.timestamp = now;
        transformationNamesCache.lastProject = project;
        transformationNamesCache.lastUser = currentUser;
        return names;
      } catch (error) {
        console.error("Error fetching transformation names:", error);
        return [];
      } finally {
        delete transformationNamesCache._fetchPromise;
      }
    })();

    return transformationNamesCache._fetchPromise;
  }, [project, decodedToken, token]);

  const generateUniqueName = useCallback(async (baseName) => {
    const existingNames = await getExistingTransformationNames();
    let uniqueName = baseName;
    let suffix = 1;

    while (existingNames.includes(uniqueName.toLowerCase())) {
      uniqueName = `${baseName}_${suffix}`;
      suffix++;
    }

    return uniqueName;
  }, [getExistingTransformationNames]);

  const validateName = useCallback(async (name) => {
    if (!name) {
      setNameError("Name is required");
      return;
    }

    setIsChecking(true);
    try {
      const existingNames = await getExistingTransformationNames();
      const nameExists = existingNames.includes(name.toLowerCase());

      if (nameExists) {
        setNameExists(true);
        setNameError("Transformation name already exists");
      } else {
        const response = await fetch(
          `${hostname}/etl/check-transformation-name?name=${encodeURIComponent(name)}`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to check transformation name");
        }

        const result = await response.json();
        setNameExists(result.exists);

        if (result.exists) {
          setNameError("Transformation name already exists");
        } else {
          setNameError("");
        }
      }
    } catch (error) {
      console.error("Error checking transformation name:", error);
    } finally {
      setIsChecking(false);
    }
  }, [getExistingTransformationNames]);

  const handleNameChange = (e) => {
    const value = e.target.value;
    data.onDataChange({ name: value });

    if (attemptedSave) {
      setNameError("");
    }

    clearTimeout(nameCheckTimeout.current);

    if (value) {
      nameCheckTimeout.current = setTimeout(() => {
        validateName(value);
      }, 500);
    } else {
      setNameError("Name is required");
      setNameExists(false);
    }
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    data.onDataChange({ description: value });

    if (attemptedSave) {
      if (!value) {
        setDescriptionError("Description is required");
      } else {
        setDescriptionError("");
      }
    }
  };

  useEffect(() => {
    // Only validate if name is present and not already checked
    if (data.name && data.name.trim() !== "" && !nameError && !nameExists) {
      validateName(data.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    if (data.onSave) {
      const originalOnSave = data.onSave;
      data.onSave = () => {
        setAttemptedSave(true);

        let isValid = true;
        if (!data.name || data.name.trim() === "") {
          setNameError("Name is required");
          isValid = false;
        }

        if (!data.description) {
          setDescriptionError("Description is required");
          isValid = false;
        }

        if (nameExists) {
          isValid = false;
        }

        if (isValid) {
          return originalOnSave();
        }
        return false;
      };
    }
  }, [data, nameExists]);

  useEffect(() => {
    if (data.onDataChange) {
      data.generateUniqueName = generateUniqueName;
    }
  }, [data.onDataChange, generateUniqueName]);

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[250px] max-w-[280px] relative group">
      <Handle type="source" position={Position.Right} style={{ width: 10, height: 10 }} />

      <div className="flex items-center space-x-3 mb-3">
        <FilePlus className="w-5 h-5 text-[#96CF7B]" />
        <h3 className="text-black font-medium">Define</h3>
      </div>

      <div className="space-y-1.5">
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Name<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              className={`w-full p-1 text-[10px] bg-white rounded-sm border ${
                attemptedSave && nameError ? "border-red-500" : "border-gray-300"
              } text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 ${
                attemptedSave && nameError ? "focus:ring-red-500" : "focus:ring-gray-400"
              } focus:border-gray-400`}
              placeholder="Enter transformation name"
              value={data.name || ""}
              onChange={handleNameChange}
            />
            {isChecking && (
              <div className="absolute right-2 top-1">
                <Loader size={10} className="animate-spin text-gray-400" />
              </div>
            )}
          </div>
          {attemptedSave && nameError && (
            <p className="text-[9px] text-red-500 mt-1">{nameError}</p>
          )}
        </div>
        <div className="mb-2">
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Description
          </label>
          <textarea
            className={`w-full p-1 text-[10px] bg-white rounded-sm border ${
              attemptedSave && descriptionError ? "border-red-500" : "border-gray-300"
            } text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 ${
              attemptedSave && descriptionError ? "focus:ring-red-500" : "focus:ring-gray-400"
            } focus:border-gray-400`}
            placeholder="Enter description"
            rows="2"
            value={data.description || ""}
            onChange={handleDescriptionChange}
          />
          {attemptedSave && descriptionError && (
            <p className="text-[9px] text-red-500 mt-1">{descriptionError}</p>
          )}
        </div>
      </div>
    </div>
  );
};
