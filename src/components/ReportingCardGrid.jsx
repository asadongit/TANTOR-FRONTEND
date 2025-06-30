import React from "react";
export const CardGrid = ({ cards, isLoading = false, onCardClick }) => {

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <React.Fragment key={card.title}>
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition-transform transform hover:scale-105 hover:shadow-md"
            onClick={() => onCardClick && onCardClick(card)}
          >
            <div className="flex items-center mb-2">
              <h3 className="text-lg font-semibold">{card.title}</h3>
            </div>
            {isLoading ? (
              <div className="w-8 md:w-10 h-8 md:h-10 bg-gray-200 rounded-full mr-2"></div>
            ) : (
              <p className="text-black text-5xl font-bold">{card.count}</p>
            )}
          </div>
          {/* {index === 1 && <div className="col-span-1"></div>} */}
        </React.Fragment>
      ))}
    </div>
  );
};