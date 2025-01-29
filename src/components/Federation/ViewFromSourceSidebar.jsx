import { Icon } from "@iconify/react";
export default function SourceSidebar({ setUserSelection }) {
    // NEW CODE START
    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };
    // NEW CODE END


  const handleClick = (event) => {
      event.preventDefault();
      setUserSelection(prev => ({...prev, selectedMode: event.target.id}));
  };

  return (
      <div className="w-64 p-4 mt-1 bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Federation</h2>
              <button className="text-gray-400 hover:text-gray-600">
                  <Icon icon="mdi:chevron-right" width={20} height={20} />
              </button>
          </div>
          <div className="space-y-2">
              <button
                  id="sourceView"
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg group border-solid border-2"
                //   onClick={handleClick}
                  draggable
                  onDragStart={(e) => onDragStart(e, 'sourceView')}
              >
                  <div className="flex items-center space-x-3 pointer-events-none">
                      <Icon icon="mdi:chart-line" className="w-5 h-5 text-[#8E77BB]" />
                      <span className="text-gray-700">Source view</span>
                  </div>
                  <span className="text-gray-400 group-hover:text-gray-600 pointer-events-none">+</span>
              </button>

              <button
                  id="connection"
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg group border-solid border-2"
                //   onClick={handleClick}
                  draggable
                  onDragStart={(e) => onDragStart(e, 'connection')}
              >
                  <div className="flex items-center space-x-3 pointer-events-none">
                      <Icon icon="mdi:link" className="w-5 h-5 text-[#8E77BB]" />
                      <span className="text-gray-700">Connection</span>
                  </div>
                  <span className="text-gray-400 group-hover:text-gray-600 pointer-events-none">+</span>
              </button>
          </div>
      </div>
  );
}