import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../../../context/AuthContext";
import { useWorkflow } from "../../context/WorkflowContext";
import { useModal } from "../../context/ModalProvider";
import { useNavigate } from "react-router-dom";
import { useMigrationData } from "../../../../../hooks/platform/migration";
import { encrypt } from "../../../../../utils/Crypto";
import { useDrawerContext } from "../../context/DrawerContext";

const AddTable = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [affixType, setAffixType] = useState('prefix');
  const [affixValue, setAffixValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);



  const baseTableName = data?.table_name || '';

  const { token, decodedToken, hostnameV1, project } = useAuth();
  const { pipelines, updateData } = useWorkflow();
  const { openModal, closeModal } = useModal();
  const { closeDrawer } = useDrawerContext();
  const navigate = useNavigate();
  const { refetch } = useMigrationData();

   const pipelineData = Object.values(pipelines)[0]?.data;
  console.log(pipelineData?.source)
  const getTableName = () => {
    if (affixType === 'prefix') {
      return `${affixValue}${baseTableName}`;
    } else {
      return `${baseTableName}${affixValue}`;
    }
  };

  const onCreateTable = async ({ tableName, affixType, affixValue, baseTableName }) => {
    try {
      const pipelineData = Object.values(pipelines)[0]?.data;

      if (!pipelineData) {
        throw new Error("No pipeline data found");
      }

      console.log(pipelineData)
      const newTableMapping = { [baseTableName]: tableName };

      const payload = {
        metadata_name: pipelineData?.define?.name || `Metadata_${Date.now()}`,
        metadata_auto_name: pipelineData?.define?.autoName || true,
        description: pipelineData?.define?.description || `Created table: ${tableName}`,
        project: project,
        created_by: decodedToken?.preferred_username,
        conn_type: pipelineData?.source?.source_conn_type || pipelineData?.source_conn_type,
        source_conn_id: pipelineData?.source?.source_conn_id,
        target_conn_id: pipelineData?.target?.target_conn_id,
        table_list: [newTableMapping],
      };

      console.log(payload)

      const response = await axios.post(
        `${hostnameV1}/ddl-migration`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data) {
        toast.success("Table created successfully!");
        closeDrawer("cdc");
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('tableCreated', {
            detail: {
              tableName: getTableName(),
              sourceTable: baseTableName,
              connectionName: pipelineData?.target?.connection || "",
              schema: pipelineData?.target?.schema || "",
              connectionId: pipelineData?.target?.target_conn_id,
              pipelineId: pipelineData?.pipelineId || ""
            }
          }));
        }, 100);
      }

      return response.data;
    } catch (error) {
      console.error('Error creating table:', error);
      toast.error(`Failed to create table: ${error.response?.data?.detail || error.message}`);
      throw error;
    }
  };

  const handleCreateTable = async () => {
    setIsLoading(true);
    setStatus(null);

    try {
      await onCreateTable({
        tableName: getTableName(),
        affixType,
        affixValue,
        baseTableName
      });
      setStatus('success');
    } catch (error) {
      console.error('Error creating table:', error);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">

      <div className="space-y-4">

        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Original Table Name</label>
          <div className="mt-1 p-2 bg-gray-100 rounded-md border border-gray-300">
            <p className="text-gray-800 font-mono">{baseTableName}</p>
          </div>
        </div> */}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
            >
              <span className="block truncate">{affixType === 'prefix' ? 'Prefix' : 'Suffix'}</span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </button>

            {isOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1">
                <button
                  onClick={() => {
                    setAffixType('prefix');
                    setAffixValue("")
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${affixType === 'prefix' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Prefix
                </button>
                <button
                  onClick={() => {
                    setAffixType('suffix');
                    setAffixValue("")
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${affixType === 'suffix' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Suffix
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {affixType === 'prefix' ? 'Prefix Value' : 'Suffix Value'}
          </label>
          <input
            type="text"
            value={affixValue}
            onChange={(e) => setAffixValue(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#8e78b7] focus:border-[#8e78b7]"
            placeholder={affixType === 'prefix' ? "Enter prefix..." : "Enter suffix..."}
          />
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">Table Name:</label>
          <p className="text-sm font-mono font-medium">{getTableName()}</p>
        </div>

        <div className="mt-5">
          <button
            onClick={handleCreateTable}
            disabled={isLoading  || !baseTableName}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#8e78b7] hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8e78b7] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Table...
              </>
            ) : "Create Table"}
          </button>

          {status && (
            <div className={`mt-2 text-center text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {status === 'success' ? 'Table created successfully!' : 'Error creating table. Please try again.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTable;