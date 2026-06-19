import React from "react";
import { FiShare2 } from "react-icons/fi";

export default function JoinConfig() {
  return (
    <div
      style={{
        padding: 16,
        background: "#ECFDF5",
        borderRadius: 12,
        fontSize: 12,
        color: "#065F46",
        border: "1px solid #A7F3D0",
        lineHeight: 1.6,
      }}
    >
      <div
        style={{
          fontWeight: 800,
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <FiShare2 size={14} /> SYNCHRONIZATION POINT
      </div>
      Use this node to merge parallel branches. The workflow will continue once
      all incoming parallel paths have reached this point.
    </div>
  );
}
