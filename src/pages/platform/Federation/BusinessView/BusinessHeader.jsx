/*eslint-disable*/
import { LayoutDashboard } from "lucide-react";
import {Link } from "react-router-dom";

export function BusinessHeader() {

    return (
      <div className="flex items-center gap-6 px-4 py-2">
        {/* Dashboard Button */}
        <Link
          to="/"
          className="flex items-center border-solid border gap-2 px-4 py-2 bg-white text-[#8E77BB] font-semibold rounded-md hover:bg-[#E8E4F1] transition-colors"
        >
          <LayoutDashboard size={20} />
          Dashboard
        </Link>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center">
          <Link to="/" className="text-gray-600 hover:text-gray-900">
            Platform
          </Link>
          <span className="mx-2 text-gray-500">&gt;</span>
          <Link to="/federation" className="text-gray-600 hover:text-gray-900">
            Federation
          </Link>
          <span className="mx-2 text-gray-500">&gt;</span>
          <Link
            to="/viewcanvas"
            className="text-gray-600 hover:text-gray-900"
            // onClick={handleViewLinkClick}
          >
            View
          </Link>
          <span className="mx-2 text-gray-500">&gt;</span>
          {<span className="text-[#8E77BB] font-medium">Business</span>}
        </div>
      </div>
    )}
