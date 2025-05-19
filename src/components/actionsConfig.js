import axios from "axios";
import React from "react";
import { Pencil, Trash2, Play, Pause, Eye } from "lucide-react";
import toast from "react-hot-toast";
export const getActionConfigurations = ({ token, project, hostnameV2, navigate }) => ({
  cdc: [
    {
      label: "Edit",
      icon: React.createElement(Pencil, { size: 16 }),
      onClick: (row) => navigate(`/cdc/editcdc/${row.cdc_id}`),
    },
    {
      label: "View",
      icon: React.createElement(Eye, { size: 16 }),
      onClick: (row) => navigate(`/cdc/Viewcdc/${row.cdc_id}`),
    },
    {
      label: "Delete",
      icon: React.createElement(Trash2, { size: 16 }),
      onClick: (row) => console.log("Delete CDC", row),
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
});
