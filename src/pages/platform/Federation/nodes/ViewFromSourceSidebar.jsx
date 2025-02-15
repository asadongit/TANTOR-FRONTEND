import { useState } from 'react';
import { PanelLeftOpen, PanelLeftClose, Plus, SquareKanban, Cable } from 'lucide-react';

export default function SourceSidebar({ setUserSelection }) {
    const [expanded, setExpanded] = useState(true);

    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const handleClick = (event) => {
        event.preventDefault();
        setUserSelection(prev => ({ ...prev, selectedMode: event.target.id }));
    };

    const handleToggle = () => {
        setExpanded(!expanded);
    };

    return (
        <div className="w-25 px-1 py-2 ml-0 overflow-y-auto h-fit bg-white rounded-lg shadow-lg">
            <div className="space-y-1">
                <div className="bg-white rounded-lg overflow-hidden">
                    <button
                        onClick={handleToggle}
                        className="w-full flex items-center justify-between p-1 hover:bg-gray-750 transition-colors text-left border-l-4 border-transparent hover:border-[#8E77BB]"
                    >
                        {expanded && (
                            <div className="flex items-center space-x-2">
                                <span className="text-black font-medium text-lg">Federation</span>
                            </div>
                        )}
                        {expanded ? (
                            <PanelLeftClose className="w-5 h-5 text-black" />
                        ) : (
                            <PanelLeftOpen className="w-5 h-5 text-black" />
                        )}
                    </button>

                    <div className="grid grid-cols-1 gap-2 p-2 bg-gray-850 border-gray-700">
                        {[{ id: 'baseNode', name: 'Source view', icon: SquareKanban }, { id: 'connection', name: 'Connection', icon: Cable }].map((item) => (
                            <button
                                key={item.id}
                                id={item.id}
                                className="flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-move hover:bg-gray-50 group border-solid border-2"
                                draggable
                                onDragStart={(e) => onDragStart(e, item.id)}
                            >
                                <div className="flex items-center justify-center">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-lg">
                                        <item.icon className="w-4 h-4 text-[#8E77BB] transition-colors" />
                                    </div>
                                    {expanded && (
                                        <span className="text-black text-sm ml-1">{item.name}</span>
                                    )}
                                </div>
                                <button
                                    className={`rounded-md hover:bg-gray-200 ${expanded && 'ml-3'}`}
                                >
                                    <Plus className="h-4 text-gray-500" />
                                </button>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
