import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { encrypt } from "../utils/Crypto";

const CardGrid = ({ cards, onCardClick }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition-transform transform hover:scale-105 hover:shadow-md"
        >
          <div className="flex items-center mb-2">
            <div
              className={`flex items-center justify-center aspect-square w-8 md:w-10 ${card.bgcolor} rounded-full ${card.iconcolor} mr-2`}
            >
              <Icon icon={card.icon} />
            </div>
            <h3 className="text-lg font-semibold">{card.title}</h3>
          </div>
          <p className="text-black text-5xl font-bold">{card.count}</p>

          <button
            className="mt-4 text-purple-600 text-sm font-normal relative transition-all duration-300 group hover:scale-105 hover:font-medium"
            onClick={() => onCardClick(card)}
          >
            See details
            <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-purple-600 transition-all duration-300 group-hover:w-full"></span>
          </button>
        </div>
      ))}
    </div>
  );
};

export default CardGrid;
