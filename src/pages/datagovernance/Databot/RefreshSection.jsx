import { useEffect, useState } from "react";
import { useDatabotContext } from "../../../hooks/dataGovernance/DatabotContext";
import Refresh from "../../../assets/databot/Refresh.svg"

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useDatabotAPI } from "../../../hooks/dataGovernance/Databot/useDatabotAPI";


const RefreshSection = ({secureQueryLoading, connectionsLoading, schemaLoading, connections, dropdownRef}) => {
  const [openConnections, setOpenConnections] = useState(false);
  const [openSchemas, setOpenSchemas] = useState(false);
  const [schemaResp, setSchemaResp] = useState([]);
  const [loading, setLoading] = useState(false);

	const { handleSelectedConnectionGlobal,
    selectedConnectionGlobal,
    handleSelectedSchemaGlobal,
    selectedSchemaGlobal,
    policyIdsGlobal,
    handleIsRefreshed,
    isRefreshed
     } = useDatabotContext();
  
  const { getSchemaDetails, refreshDatabotAPI } = useDatabotAPI();

  const uniqueConnections = Array.from(
    new Set((Array.isArray(connections) ? connections : []).map(c => c.connection_name))
  );


  // const schema = connections?.map((conn) => conn?.table_schema)

  const hasSelection = Boolean(selectedConnectionGlobal);
  const hasSchema = Boolean(selectedSchemaGlobal);

  const connectionButtonLabel = hasSelection ? selectedConnectionGlobal : "Select";
  const schemaButtonLabel = hasSchema ? selectedSchemaGlobal : "Select";

  const schemaDetails = async () => {
    if(selectedConnectionGlobal.length > 0) {
      const schema = await getSchemaDetails(selectedConnectionGlobal);
      setSchemaResp(schema);
    }
  }

  useEffect(() => {
    schemaDetails();
  }, [selectedConnectionGlobal])

	return (
		<div ref={dropdownRef} className="flex items-center space-x-2 p-2 px-3 rounded-lg">
			<>
			<span className="text-gray-600 font-medium">Connection</span>

			<div className="relative">
				{/* Button */}
				<button
          disabled={(secureQueryLoading || connectionsLoading || loading)}
					onClick={() => setOpenConnections(!openConnections)}
					className={`flex items-center justify-between w-36 px-3 py-1.5 
            bg-white border border-gray-300 rounded-md shadow-sm text-sm text-gray-700
            hover:border-[#8d77ba] focus:outline-none focus:ring-2 focus:ring-[#8d77ba]
            disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200
            `}
				>
					<span className="truncate max-w-[80%]">{connectionButtonLabel}</span>
					<ChevronDown size={16} className="ml-2 text-gray-500 shrink-0" />
				</button>

				{/* Dropdown menu */}
				{openConnections && (
          <div
            className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 
              rounded-md shadow-lg max-h-40 overflow-y-auto z-50"
          >
            {uniqueConnections?.map((conn, i) => (
              <button
                key={i}
                onClick={() => {
                  handleSelectedConnectionGlobal(conn);
                  setOpenConnections(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#f3eaff]"
              >
                {conn}
              </button>
            ))}
          </div>
        )}


			</div>

      {connectionsLoading && (
        <div className="w-4 h-4 border-2 border-[#8d77ba]/30 border-t-[#8d77ba] rounded-full animate-spin"></div>
      )}
			</>

			<>
			<span className="text-gray-600 font-medium">Schema</span>

			<div className="relative">
				{/* Button */}
				<button
					onClick={() => setOpenSchemas(!openSchemas)}
          disabled={(secureQueryLoading || connectionsLoading || schemaLoading || selectedConnectionGlobal.length === 0 || loading)}
					className="flex items-center justify-between w-36 px-3 py-1.5 
            bg-white border border-gray-300 rounded-md shadow-sm text-sm text-gray-700
            hover:border-[#8d77ba] focus:outline-none focus:ring-2 focus:ring-[#8d77ba]
            disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
				>
					{schemaButtonLabel}
					<ChevronDown size={16} className="ml-2 text-gray-500" />
				</button>

				{/* Dropdown menu */}
				{openSchemas && (
					<div className="absolute right-0 mt-1 bg-white border w-full border-gray-200 
						  rounded-md shadow-lg max-h-40 overflow-y-auto z-50">
						{schemaResp.map((option, i) => (
							<div
								key={i}
								onClick={() => {
									handleSelectedSchemaGlobal(option.table_schema);
									setOpenSchemas(false);
								}}
								className="px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-[#f3eaff]"
							>
								{option.table_schema}
							</div>
						))}
					</div>
				)}
			</div>

      {schemaLoading && (
        <div className="w-4 h-4 border-2 border-[#8d77ba]/30 border-t-[#8d77ba] rounded-full animate-spin"></div>
      )}
			</>

			<button 
        disabled={(secureQueryLoading || connectionsLoading || schemaLoading || selectedConnectionGlobal.length === 0
          || selectedSchemaGlobal.length === 0
        )}
        onClick={async () => {
          setLoading(true);
          handleIsRefreshed(false);
          const respOk = await refreshDatabotAPI(policyIdsGlobal, selectedConnectionGlobal, selectedSchemaGlobal);

          const refreshSuccess = respOk.status === "ok";
          handleIsRefreshed(refreshSuccess);
          setLoading(false)
        }}
        className="p-2 rounded-lg
          disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
        >
        {!loading ? 
				<img src={Refresh} alt="refresh" 
          className="w-5 h-5 hover:text-white
            disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200" 
        /> : 
        <div className="w-4 h-4 border-2 border-[#8d77ba]/30 border-t-[#8d77ba] rounded-full animate-spin"></div>
        }
			</button>

		</div>
	)
}

export default RefreshSection;