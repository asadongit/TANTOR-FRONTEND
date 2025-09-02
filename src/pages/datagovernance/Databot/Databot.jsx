import { Bot, PanelRightClose, MessageSquare, Paperclip, 
  Mic, ArrowRight, PanelLeftClose, Search } from 'lucide-react';
import { useState } from 'react';
import { useDatabotContext } from '../../../hooks/dataGovernance/DatabotContext';
import ResultSection from './ResultSection';
import DatabotChatSection from './DatabotChatSection';
import { useAuth } from '../../../context/AuthContext';
// import { useRelationship } from '../../../hooks/dataGovernance/Databot/useRelationship';

const Databot = () => {
  const { token } = useAuth();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isResultScreen, setIsResultScreen] = useState(false);
  const [query, setQuery] = useState("");

  const { relationshipResponse, 
    triggerNewQuestion, 
    resetChat } = useDatabotContext();


  const handleQueryChange = (e) => {
    const value = e.target.value
    setQuery(value)
  }

  const handleExpand = () => {
    setIsExpanded(!isExpanded)
  }


  console.log("relationshipResponse ", relationshipResponse)

  return (
    <div className="flex justify-between bg-gray-50"
      style={{ height: "calc(100vh - 5rem)" }}>

      {/* Included in V2 */}
      {/* {isExpanded ? (
        <div className='w-56 flex flex-col gap-3 bg-white shadow-xl shadow-black/20 border-r border-gray-200 
          relative z-20'>
          <div className='flex flex-col items-end'>
            <button 
              onClick={handleExpand}
              className="p-4 rounded-lg hover:bg-gray-100 text-gray-500">
              <PanelLeftClose size={22} />
            </button>

            <div className="w-56 border-t border-gray-200"></div>
          </div>

          <div className="text-sm p-3">
            <p className="mb-2 text-gray-600 font-medium">Chats</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                placeholder="Search"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-[#8d77ba] focus:border-transparent"
              />
            </div>
            <p className='text-sm text-gray-500 text-center pt-3'>No chats yet</p>
          </div>

        </div>
      ) :
       <div className=" bg-white p-1 shadow-sm mr-2 flex flex-col items-center py-4 space-y-2">
          <button 
            onClick={handleExpand}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <PanelRightClose size={22} />
          </button>

          <div className="w-12 border-t border-gray-200"></div>

          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <MessageSquare size={22} />
          </button>
        </div>
      } */}

      {!isResultScreen ? 
        <div className="flex-1 bg-gradient-to-t from-[#8d77ba]/30 via-white to-white flex flex-col justify-center items-center text-center overflow-hidden">
          <div className="w-16 h-16 flex items-center justify-center bg-[#8d77ba] text-white rounded-full shadow mb-4">
            <Bot size={32} />
          </div>

          <h1 className="text-3xl font-semibold text-gray-800">Databot</h1>
          <p className="text-[#8d77ba] mt-1">Turn your data into instant answers.</p>

          {/* Input */}
          <div className="flex items-center w-full max-w-2xl mt-8 px-4 py-2
            bg-white border border-gray-200 rounded-full shadow-sm focus-within:ring-2 focus-within:ring-[#8d77ba]">
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e)}
              placeholder="Ask Anything"
              className="flex-1 outline-none text-lg text-gray-700 placeholder-gray-400"
            />

            {/* Included in V2 */}
            {/* <button className="p-2 text-gray-500 hover:text-[#8d77ba]">
              <Paperclip size={22} />
            </button>
            <button className="p-2 text-gray-500 hover:text-[#8d77ba]">
              <Mic size={22} />
            </button> */}

            <button 
              disabled={query.length === 0}
              onClick={async () => 
              {
                resetChat()
                triggerNewQuestion(query, "relationship")
                setIsResultScreen(true)
              }}
              className="p-2 text-white disabled:bg-opacity-50 disabled:cursor-not-allowed
                bg-[#8d77ba] hover:bg-[#7a66a8] rounded-xl ml-2">
              <ArrowRight size={22} />
            </button>
          </div>
        </div> : 

        <>
          <div className='flex-1 bg-white border-white rounded-md'>
            <ResultSection />
          </div>

          <div className='bg-white ml-2 border-white rounded-md'>
            <DatabotChatSection setIsResultScreen={setIsResultScreen}/>
          </div>
        </>
      }
    </div>
  );
};

export default Databot;