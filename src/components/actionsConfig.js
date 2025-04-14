import React from "react";
import { Pencil, Trash2, Play } from "lucide-react";

export const getActionConfigurations = (navigate) => ({
  cdc: [
    {
      label: "Edit",
      icon: React.createElement(Pencil, { size: 16 }),
      onClick: (row) => navigate(`/cdc/editcdc/${row.cdc_id}`),
    },
    {
      label: "Delete",
      icon: React.createElement(Trash2, { size: 16 }),
      onClick: (row) => console.log("Delete clicked for", row),
    },
    {
      label: "Run",
      icon: React.createElement(Play, { size: 16, fill: "currentColor" }),
      onClick: (row) => console.log("Run clicked for", row),
    },
  ],
  migration: [
    {
      label: "Edit",
      icon: React.createElement(Pencil, { size: 16 }),
      onClick: (row) => navigate(`/editmigration/${row.id}`),
    },
    {
      label: "Delete",
      icon: React.createElement(Trash2, { size: 16 }),
      onClick: (row) => console.log("Delete clicked for", row),
    },
  ],
});
