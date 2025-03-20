import { BadgeCheck, X } from "lucide-react"
import { useState } from "react"
import successBackground from "../../../assets/green.png";
import PropTypes from "prop-types";


const PurgeFooter = ({ onCancel }) => {
    const [isModalOpen, setIsModalOpen] = useState({
        modal1: false,
        modal2: false,
        modal3: false
    });

    const openModal = (modalName) => {
        setIsModalOpen((prevState) => ({ ...prevState, [modalName]: true }));
    };

    const closeModal = (modalName) => {
        setIsModalOpen((prev) => ({ ...prev, [modalName]: false }));
    };

    return (
        <div className='bg-white w-full py-2.5 flex justify-end border-solid border-t-2'>
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
                                <h2 className="text-2xl text-gray-800 font-bold">Confirmation submission</h2>{" "}
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
                                    onClick={() => openModal("modal2")}
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
                                <h2 className="text-2xl text-gray-800 font-bold">Congratulations!</h2>{" "}
                                {/* Larger text */}
                            </div>
                            <p className="text-lg text-gray-800">
                                {" "}
                                {/* Larger text */}
                                You have successfully created a project.
                            </p>

                            <div className="flex justify-start gap-4 mt-8">
                                <button
                                    onClick={() => {setIsModalOpen(false)
                                        onCancel()
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
    )
}

PurgeFooter.propTypes = {
    onCancel: PropTypes.func.isRequired, // Ensures `onCancel` is a required function
  };

export default PurgeFooter