import axios from "axios";
import React from "react";
import { Pencil, Trash2, Play, Pause, Eye, EyeIcon } from "lucide-react";
import toast from "react-hot-toast";
import { deleteCDCConnectors } from "../hooks/platform/cdc";
export const getActionConfigurations = ({ token, project, hostnameV2, navigate }) => {
  // Modal state management function to be used in component
  const showDeleteConfirmation = (cdcId, onConfirm) => {
    // Create modal element
    const confirmModal = document.createElement("div");
    confirmModal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    confirmModal.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 class="text-lg font-semibold mb-4">Confirm Deletion</h3>
        <p class="mb-6">Are you sure you want to delete this CDC connector?</p>
        <div class="flex justify-end gap-3">
          <button id="cancel-btn" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
          <button id="confirm-btn" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
        </div>
      </div>
    `;

    document.body.appendChild(confirmModal);

    // Add event listeners
    document.getElementById("cancel-btn").addEventListener("click", () => {
      document.body.removeChild(confirmModal);
    });

    document.getElementById("confirm-btn").addEventListener("click", () => {
      onConfirm();
      document.body.removeChild(confirmModal);
    });
  };

  return {
    cdc: [
      // {
      //   label: "Edit",
      //   icon: React.createElement(Pencil, { size: 16 }),
      //   onClick: (row) => navigate(`/cdc/editcdc/${row.cdc_id}`),
      // },
      {
        label: "View",
        icon: React.createElement(Eye, { size: 16 }),
        onClick: (row) => navigate(`/cdc/Viewcdc/${row.cdc_id}`),
      },
      {
        label: "Delete",
        icon: React.createElement(Trash2, { size: 16 }),
        onClick: (row) => {
          showDeleteConfirmation(row.cdc_id, async () => {
            const loadingToast = toast.loading("Deleting CDC connector...");
            try {
              await deleteCDCConnectors(row.cdc_id, token, hostnameV2);
              toast.dismiss(loadingToast);
              toast.success("CDC connector deleted successfully");
            } catch (error) {
              toast.dismiss(loadingToast);
              console.error("Failed to delete CDC connector:", error);
              toast.error("Failed to delete CDC connector");
            }
          });
        },
      },
      {
        label: "Run",
        icon: React.createElement(Play, { size: 16, fill: "currentColor" }),
        onClick: async (row) => {
          try {
            const response = await axios.get(`${hostnameV2}/cdc/trigger/${row.cdc_id}`, {
              headers: {Authorization: `Bearer ${token}`},
            });
            console.log("CDC Run Response:", response.data);
            toast.success("CDC triggered successfully!");
          } catch (error) {
            console.error("Failed to trigger CDC:", error);
            toast.error("Failed to trigger CDC.");
          }
        },
      },
    ],
    migration: [
      {
        label: "Edit",
        icon: React.createElement(Pencil, { size: 16 }),
        onClick: (row) => console.log("Edit Migration", row),
      },
      {
        label: "Delete",
        icon: React.createElement(Trash2, { size: 16 }),
        onClick: (row) => console.log("Delete Migration", row),
      },
    ],
    rules: [
      // {
      //   label: "View",
      //   icon: <EyeIcon size={16} />,
      //   onClick: (row) => handleRuleView(row.id),
      //   show: (row) => row?.status?.toLowerCase() !== "disabled",
      // },
      {
        label: "Edit",
        icon: <Pencil size={16} />,
        onClick: (row) => navigate("/config/rule/edit-rule", {state: {mode: "EDIT", ruleData: {...row}}}),
        show: (row) => row?.status?.toLowerCase() !== "disabled"
      },
    ],
  };
};
