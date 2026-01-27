import { Info } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const InfoButton = ({ sectionDescriptions, section, isLastSection = false }) => {
    const [isHovered, setIsHovered] = useState(false);
    const hideTimeoutRef = useRef(null);

    const handleMouseEnter = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        hideTimeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 200);
    };

    useEffect(() => {
        return () => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);

    const tooltipPositionClass = isLastSection ? "left-7 -top-8" : "left-7 -top-2";
    const arrowPositionClass = isLastSection ? "-left-1 top-8" : "-left-1 top-4";

    return (
        <div
            className="relative inline-block"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                type="button"
                className="text-gray-400 hover:text-[#8e78b7] transition-colors"
            >
                <Info size={16} />
            </button>
            {isHovered && (
                <div className={`absolute ${tooltipPositionClass} z-50 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg`}>
                    <div className={`absolute ${arrowPositionClass} w-2 h-2 bg-gray-900 transform rotate-45`}></div>
                    {sectionDescriptions[section]}
                </div>
            )}
        </div>
    );
};

export default InfoButton;