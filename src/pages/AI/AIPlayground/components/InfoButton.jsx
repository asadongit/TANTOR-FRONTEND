import { Info } from "lucide-react";
import { useState } from "react";

const InfoButton = ({ sectionDescriptions,section }) => {
        const [isHovered, setIsHovered] = useState(false);

        return (
            <div className="relative inline-block">
                <button
                    type="button"
                    className="text-gray-400 hover:text-[#8e78b7] transition-colors"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <Info size={16} />
                </button>
                {isHovered && (
                    <div className="absolute left-0 top-6 z-50 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                        <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                        {sectionDescriptions[section]}
                    </div>
                )}
            </div>
        );
    };
export default InfoButton;