import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CDCDashboard from "./CDCDashboard.jsx";
import { usePlatform } from "../../../context/platformContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import Breadcrumb from "../../../components/Breadcrumb.jsx";
const CDC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
              <Breadcrumb title="Platform" link={"/"} />

      <CDCDashboard />
    </div>
  );
};

export default CDC;
