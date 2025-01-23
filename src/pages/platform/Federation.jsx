import { useState } from "react";
import { useNavigate } from "react-router-dom";


const Federation = () => {

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalState, setModalState] = useState({ 
    queryType: "Regular", 
    viewType: "" 
  });

  const toggleModal = () => {
    setModalState({
      queryType: "Regular", 
      viewType: "" }
    )
    setIsModalOpen(!isModalOpen);
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold">Federation</h1>
      <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={toggleModal}>
        Create View
      </button>

      {/* Modal component with props passed down from Federation */}
      <Modal
        isModalOpen={isModalOpen}
        toggleModal={toggleModal}
        modalState = {modalState}
        setModalState = {setModalState}
      />
    </div>
  );
};

// Modal component
const Modal = ({isModalOpen, toggleModal, modalState, setModalState}) => {
  const navigate = useNavigate();
  
  const handleCreateView = () => {
    if(modalState.viewType === "Source" && modalState.queryType ==="Regular"){
      navigate("/federation/view/source",{
        state: modalState
      });
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[#8E77BB] text-2xl font-bold">Create a view</h2>
          <button onClick={toggleModal} className="text-gray-500">&times;</button>
        </div>

        <div>
          {/* Query Type */}
          <div className="mb-4">
            <label className="block text-[#282F49] text-lg font-semibold">Select Query type</label>
            <div className="flex mt-2">
              <button
                onClick={() => setModalState({ ...modalState, queryType: 'Regular' })}
                className={`w-[7rem] h-[2.5rem] py-1.5 rounded-full border transition-all duration-300 flex items-center justify-center text-center ${modalState.queryType === 'Regular' ? 'border-[#8E77BB] text-[#8E77BB]' : 'border-transparent text-gray-700'}`}
              >
                Regular
              </button>
              <button
                onClick={() => setModalState({ ...modalState, queryType: 'Complex' })}
                className={`w-[7rem] h-[2.5rem] py-1.5 rounded-full border transition-all duration-300 flex items-center justify-center text-center ${modalState.queryType === 'Complex' ? 'border-[#8E77BB] text-[#8E77BB]' : 'border-transparent text-gray-700'}`}
              >
                Complex
              </button>
            </div>
          </div>

          {/* View Type */}
          <div className="mb-6">
            <label className="block text-[#282F49] text-lg font-semibold">Select View type</label>
            <div className="flex gap-4 mt-4">
              <div
                onClick={() => setModalState({ ...modalState, viewType: 'Source' })}
                className={`w-full sm:w-[16rem] h-16 p-3 border rounded-md transition-all duration-300 flex items-center justify-between cursor-pointer ${modalState.viewType === 'Source' ? 'border-[#8E77BB] bg-[rgb(142,119,187,0.15)]' : 'border-[#CCCCCC] bg-white'}`}
              >
                <div className="flex justify-between w-full">
                  <div>
                    <div className="text-[#282F49] font-semibold">Source</div>
                    <div className="text-gray-500 text-xs">By line will come here</div>
                  </div>
                  <input
                    type="radio"
                    name="viewType"
                    value="Source"
                    checked={modalState.viewType === 'Source'}
                    onChange={() => setModalState({ ...modalState, viewType: 'Source' })}
                    className="ml-2"
                    style={{ accentColor: 'rgba(142, 119, 187, 1)' }}
                  />
                </div>
              </div>
              <div
                onClick={() => setModalState({ ...modalState, viewType: 'Business' })}
                className={`w-full sm:w-[16rem] h-16 p-3 border rounded-md transition-all duration-300 flex items-center justify-between cursor-pointer ${modalState.viewType === 'Business' ? 'border-[#8E77BB] bg-[rgb(142,119,187,0.15)]' : 'border-[#CCCCCC] bg-white'}`}
              >
                <div className="flex justify-between w-full">
                  <div>
                    <div className="text-[#282F49] font-semibold">Business</div>
                    <div className="text-gray-500 text-xs">By line will come here</div>
                  </div>
                  <input
                    type="radio"
                    name="viewType"
                    value="Business"
                    checked={modalState.viewType === 'Business'}
                    onChange={() => setModalState({ ...modalState, viewType: 'Business' })}
                    className="ml-2"
                    style={{ accentColor: 'rgba(142, 119, 187, 1)' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-start space-x-4 mt-8">
            <button
              onClick={toggleModal}
              className="bg-white text-gray-700 px-8 py-3 rounded-lg border border-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateView}
              className="bg-[#8E77BB] text-white px-4 py-1.5 rounded-lg"
            >
              Create view
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Federation;
