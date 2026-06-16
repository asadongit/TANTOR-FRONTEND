import axios from "axios";
import React from "react";
import { Pencil, Trash2, Play, Pause, Eye, EyeIcon, ClipboardPenLine, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { deleteCDCConnectors } from "../hooks/platform/cdc";
import { deleteMetadata } from "../hooks/platform/metadata";

export const getActionConfigurations = ({ token, project, hostnameV2, hostnameV1, navigate, refetch }) => {
  // Modal state management function to be used in component
  const showDeleteConfirmation = (id, onConfirm, name = "item") => {
    // Create modal element
    const confirmModal = document.createElement("div");
    confirmModal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

    const modalBox = document.createElement("div");
    modalBox.className = "bg-white p-6 rounded-lg shadow-lg max-w-md w-full";

    const title = document.createElement("h3");
    title.className = "text-lg font-semibold mb-4";
    title.textContent = "Confirm Deletion";

    const text = document.createElement("p");
    text.className = "mb-6";
    text.textContent = `Are you sure you want to delete this ${name}?`;

    const btnContainer = document.createElement("div");
    btnContainer.className = "flex justify-end gap-3";

    const cancelBtn = document.createElement("button");
    cancelBtn.id = "cancel-btn";
    cancelBtn.className = "px-4 py-2 bg-gray-200 rounded hover:bg-gray-300";
    cancelBtn.textContent = "Cancel";

    const confirmBtn = document.createElement("button");
    confirmBtn.id = "confirm-btn";
    confirmBtn.className = "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700";
    confirmBtn.textContent = "Delete";

    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(confirmBtn);

    modalBox.appendChild(title);
    modalBox.appendChild(text);
    modalBox.appendChild(btnContainer);

    confirmModal.appendChild(modalBox);
    document.body.appendChild(confirmModal);

    // Add event listeners
    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(confirmModal);
    });

    confirmBtn.addEventListener("click", () => {
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
          }, "CDC Connector");
        },
      },
      {
        label: "Run",
        icon: React.createElement(Play, { size: 16, fill: "currentColor" }),
        show: (row) => !(["running", "pending"].includes(row?.status?.toLowerCase())),
        onClick: async (row) => {
          try {
            const response = await axios.get(`${hostnameV2}/cdc/trigger/${row.cdc_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
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
        show: (row) => (["ready to run", "failed", "completed"].includes(row?.status?.toLowerCase())),
        onClick: (row) => {
          try {
            const nodeJson = row.ui_json
              ? JSON.parse(JSON.stringify(row.ui_json))
              : null;

            console.log("Fetched Migration Node JSON:", nodeJson);

            if (nodeJson) {
              navigate("/migrationCanvas", {
                state: { nodeJson, isEditMode: true, migration_id: row.migration_id },
              });
            } else {
              toast.error("No migration node data found.");
            }
          } catch (error) {
            toast.error("Failed to fetch migration node data.");
          }
        }
      },
      {
        label: "Delete",
        icon: React.createElement(Trash2, { size: 16 }),
        onClick: (row) => {
          showDeleteConfirmation(row.migration_id, async () => {
            const loadingToast = toast.loading("Deleting migration...");
            try {
              await axios.delete(`${hostnameV2}/delete-migration/${row.migration_id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              toast.dismiss(loadingToast);
              toast.success("Migration removed from platform.");
              if (refetch) await refetch();
            } catch (error) {
              toast.dismiss(loadingToast);
              toast.error("Failed to remove migration.");
            }
          }, "Migration");
        },
      },
    ],
    purge: [
      {
        label: "Edit",
        icon: React.createElement(Pencil, { size: 16 }),
        show: (row) => (["ready to run", "failed", "completed"].includes(row?.status?.toLowerCase())),
        onClick: (row) => navigate("/PurgeCanvas", { state: { ui_json: row?.ui_json, purge_id: row?.purge_id } }),
      },
      {
        label: "Delete",
        icon: React.createElement(Trash2, { size: 16 }),
        onClick: (row) => {
          showDeleteConfirmation(row.purge_id, async () => {
            const loadingToast = toast.loading("Deleting purge...");
            try {
              await axios.delete(`${hostnameV1}/purges/${row.purge_id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              toast.dismiss(loadingToast);
              toast.success("Purge removed from platform.");
              if (refetch) await refetch();
            } catch (error) {
              toast.dismiss(loadingToast);
              toast.error("Failed to remove Purge.");
            }
          }, "Purge");
        },
      },
    ],
    metadata: [
      {
        label: "Delete",
        icon: React.createElement(Trash2, { size: 16 }),
        show: (row) => row?.status?.toLowerCase() === "failed",
        onClick: (row) => {
          showDeleteConfirmation(row.metadata_id, async () => {
            const loadingToast = toast.loading("Deleting metadata record...");
            try {
              await deleteMetadata(row.metadata_id, token, hostnameV1);
              toast.dismiss(loadingToast);
              toast.success("Metadata record deleted successfully");
              if (refetch) await refetch();
            } catch (error) {
              toast.dismiss(loadingToast);
              console.error("Failed to delete metadata record:", error);
              toast.error("Failed to delete metadata record");
            }
          }, "Metadata");
        }, 
      },

      {
        label: "Clone",
        icon: React.createElement(Copy, { size: 16 }),
        onClick: (row) => {          
          navigate("/migrationCanvas", {
          state: {
            existingMetadata: row?.extra_info?.ui_json,
            action: "CLONE"
          }
        })
      }, 
      }
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
        onClick: (row) => navigate("/config/rule/edit-rule", { state: { mode: "EDIT", ruleData: { ...row } } }),
        show: (row) => row?.status?.toLowerCase() !== "disabled"
      },
    ],
  };
};
