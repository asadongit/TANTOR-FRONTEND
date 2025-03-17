// components/TableDrawer.jsx
import { useState } from "react";
import { useTableContext } from "../context/TableContext";

const Success = ({ nodes, setNodes }) => {
  //   const [showAlert, setShowAlert] = useTableContext();
  const [showAlert, setShowAlert] = useState(false);

  if (!showAlert) return null;

  return (
    <div>
      {/* Custom Alert */}
      {showAlert && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: "#d1fae5",
            color: "#047857",
            padding: "1rem",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontFamily: "Arial, sans-serif",
            fontSize: "0.875rem",
            lineHeight: "1.5",
          }}
        >
          <span style={{ fontWeight: "bold" }}>Success alert!</span> Change a
          few things up and try submitting again.
        </div>
      )}
    </div>
  );
};

export default Success;
