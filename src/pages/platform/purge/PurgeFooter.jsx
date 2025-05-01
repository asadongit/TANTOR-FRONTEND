import { BadgeCheck, X } from "lucide-react";
import { useState } from "react";
import successBackground from "../../../assets/green.png";
import PropTypes from "prop-types";
import { usePurgeContext } from "../react-flow/context/PurgeContext";
import { useAuth } from "../../../context/AuthContext";
import { useStateContext } from "../react-flow/context/ContextProvider";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";


const PurgeFooter = ({ onCancel }) => {

  const hostname = import.meta.env.VITE_FAST_API;
  const hostnameV2 = import.meta.env.VITE_FAST_API_V2;
  const { token, decodedToken, project } = useAuth();

  const navigate = useNavigate();

  const {sourceData, targetData, filters, dropPartitions, selectedBulkTargetTablesPayload, bulkFiltersAndPartitions} = usePurgeContext("");

  const { defineNodeName, defineNodeDesc, selectedScope } = useStateContext("");  

  const sourceList = Array.isArray(bulkFiltersAndPartitions?.source)
  ? bulkFiltersAndPartitions.source
  : [];

  const targetList = Array.isArray(bulkFiltersAndPartitions?.target)
  ? bulkFiltersAndPartitions.target
  : [];

  const purgeList = (selectedBulkTargetTablesPayload || []).map(({ source_table, target_table }) => {
    const sourceMatch = sourceList.find(s => s.source_table === source_table);
    const targetMatch = targetList.find(
      t => t.source_table === source_table && t.target_table === target_table
    );

    let whereConditionConcat = "";
    if (typeof sourceMatch?.whereCondition === "string") {
      whereConditionConcat = sourceMatch.whereCondition.trim();
    } else if (
      typeof sourceMatch?.whereCondition === "object" &&
      sourceMatch.whereCondition !== null
    ) {
      const { columnName, filter, value } = sourceMatch.whereCondition;
      if (columnName && filter && value !== undefined) {
        whereConditionConcat = `WHERE ${columnName}${filter}${value}`;
      }
    }

    return {
      source_table,
      target_table,
      schedule: {},
      whereCondition: whereConditionConcat || "",
      source_partition: sourceMatch?.source_partition ? sourceMatch.source_partition : {},
      target_partition: targetMatch?.target_partition ? targetMatch.target_partition : {}
    };
  });

  function convertDateFormat(dateString) {
    var date = new Date(dateString);
    var year = date.getFullYear();
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    var hours = ('0' + date.getHours()).slice(-2);
    var minutes = ('0' + date.getMinutes()).slice(-2);
    var seconds = ('0' + date.getSeconds()).slice(-2);
    var formattedDate = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds;
    return formattedDate;
  }

  const buildPurgeSubsetSavePayload = () => {
    return {
      created_by: decodedToken.preferred_username,
      description: defineNodeDesc,
      extra_info: {},
      gather_stats: false,
      is_paused: false,
      project: project,
      purge_auto_name: defineNodeName,
      purge_name: defineNodeName,
      scheduler: {
        endLoadDate: "",
        scheduleinterval: {},
        schedulerColumn: "",
        startLoadDate: "",
        startdatetime: convertDateFormat(new Date()),
      },
      source_conn_id: sourceData.connectionId,
      source_conn_name: sourceData.connectionName,
      source_conn_type: sourceData.connectionType,
      source_purge_info: {
        iscomplexwherecondition: filters.source.isComplex ? filters.source.details : "No",
        partition_details: dropPartitions?.source || [],
        sourceConnName: sourceData.connectionName,
        sourceObjectName: sourceData.tableName,
        sourcePath: "",
        sourceSchemaName: sourceData.schemaName,
        sourceType: sourceData.sourceType,
        wherecondition: [
          {
            wherecolumn: filters?.source?.details?.columnName || "",
            whereoperator: filters?.source?.details?.filter || "",
            wherevalues: filters?.source?.details?.value || "",
          },
        ],
      },
      source_table: sourceData.tableName,
      status: "Pending",
      target_conn_id: targetData.connectionId,
      target_conn_name: targetData.connectionName,
      target_conn_type: targetData.connectionType,
      target_purge_info: {
        loadParams: {
          changeCondition: "",
          changeType: "",
          checksumColumns: "",
          loadType: "FULL",
          surrogateKey: "",
          targetPk: "",
        },
        partition_details: dropPartitions?.target || "",
        sourceDF: "s_df_1",
        targetConnName: targetData.connectionName,
        targetObjectName: targetData.tableName,
        targetPath: "",
        targetType: targetData.targetType,
        targetschema: targetData.schemaName,
      },
      target_table: targetData.tableName,
      transformation: {},
    };
  };

  //bulding payload for bulk payload
  const buildPurgeBulkSavePayload = () => {
    return {
        purge_name: defineNodeName,
        purge_auto_name: defineNodeName,
        description: defineNodeDesc,
        project: project,
        created_by: decodedToken.preferred_username,
        source_conn_id: sourceData.connectionId,
        target_conn_id: targetData.connectionId,
        //source_conn_type: sourceData.connectionType,
        //target_conn_type: targetData.connectionType,
        purge_list: purgeList
    }
  }

  const createBulkPurge = async () => {
    try {
      const res = await fetch(`${hostnameV2}/create-purge`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPurgeBulkSavePayload()),
      });

      if (!res.ok) throw new Error('Failed to post data');

      const data = await res.json();
      toast.success("Purge fow submitted successfully!", 
        {
          duration: 2000,
          position: "top-right",
          icon:"✅"
        }
      )
      openModal("modal2")
      setTimeout(() => navigate("/purge"), 2000)
    } catch (err) {
      setIsModalOpen(false)
      toast.error("Submission failed!")
      console.error('Error:', err.message);
    }
  };

  const createPurge = async () => {
    try {
      const res = await fetch(`${hostname}/purges`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPurgeSubsetSavePayload()),
      });

      if (!res.ok) throw new Error('Failed to post data');

      const data = await res.json();
      toast.success("Purge fow submitted successfully!", 
        {
          duration: 2000,
          position: "top-right",
          icon:"✅"
        }
      )
      openModal("modal2");
      setTimeout(() => navigate("/purge"), 2000)
    } catch (err) {
      setIsModalOpen(false);
      toast.error("Submission failed!")
      console.error('Error:', err.message);
    }
  };

  const handleCreatePurge = () => {
    if(selectedScope === "bulk") {
      createBulkPurge();
    }
    else if(selectedScope === "subset") {
      createPurge();
    }
  }

  const [isModalOpen, setIsModalOpen] = useState({
    modal1: false,
    modal2: false,
    modal3: false,
  });

  const openModal = (modalName) => {
    setIsModalOpen((prevState) => ({ ...prevState, [modalName]: true }));
  };

  const closeModal = (modalName) => {
    setIsModalOpen((prev) => ({ ...prev, [modalName]: false }));
  };

  return (
    <div className="bg-gray-50 w-full py-4 flex justify-end border-solid border-t-2">
      <div className="mr-3">
        <button
          type="button"
          onClick={onCancel}
          className="text-black bg-white hover:bg-gray-50 focus:ring-1  rounded-lg text-sm px-8 py-1 mr-2 focus:outline-none border-solid border-2"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => openModal("modal3")}
          className="text-black bg-white border-solid border-2 focus:outline-none hover:bg-[#8e78b7] hover:text-white focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-8 py-1 mr-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] dark:focus:ring-[#8e78b7]"
        >
          Create Purge
        </button>
        <button
          type="button"
          onClick={() => openModal("modal3")}
          className="text-black bg-white border-solid border-2 hover:bg-[#8e78b7] hover:text-white focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-8 py-1 mr-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
        >
          Save Purge
        </button>
      </div>

      {isModalOpen.modal3 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[600px] overflow-hidden">
            <div className="relative h-24">
              {" "}
              {/* Increased height */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${successBackground})` }}
              >
                <button
                  onClick={() => closeModal("modal2")}
                  className="absolute top-4 right-4 text-black p-1"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center space-x-4 mb-4">
                <BadgeCheck className="w-8 h-8 text-green-500" />{" "}
                {/* Increased icon size */}
                <h2 className="text-2xl text-gray-800 font-bold">
                  Confirmation submission
                </h2>{" "}
                {/* Larger text */}
              </div>
              <p className="text-lg text-gray-800">
                {" "}
                {/* Larger text */}
                Are you sure want to save this Purge?
              </p>

              <div className="flex justify-start gap-4 mt-8">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-lg text-black border border-gray-400 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors"
                >
                  No
                </button>
                <button
                  onClick={() => 
                  {
                    //createPurge()
                    handleCreatePurge();
                    //openModal("modal2")
                  }}
                  className="px-6 py-3 text-black text-lg border border-gray-400 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen.modal2 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[600px] overflow-hidden">
            <div className="relative h-24">
              {" "}
              {/* Increased height */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${successBackground})` }}
              >
                <button
                  onClick={() => closeModal("modal2")}
                  className="absolute top-4 right-4 text-black p-1"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center space-x-4 mb-4">
                <BadgeCheck className="w-8 h-8 text-green-500" />{" "}
                {/* Increased icon size */}
                <h2 className="text-2xl text-gray-800 font-bold">
                  Congratulations!
                </h2>{" "}
                {/* Larger text */}
              </div>
              <p className="text-lg text-gray-800">
                {" "}
                {/* Larger text */}
                You have successfully created a project.
              </p>

              <div className="flex justify-start gap-4 mt-8">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    onCancel();
                  }}
                  className="px-6 py-3 text-lg text-gray-800 border border-gray-400 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors"
                >
                  Alright
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

PurgeFooter.propTypes = {
  onCancel: PropTypes.func.isRequired,
};

export default PurgeFooter;
