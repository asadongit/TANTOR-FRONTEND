import { Maximize, Plus, 
  Bot, ArrowRight, 
  Paperclip, Mic, 
  X, Minimize } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TantorlOGO from "../../../assets/tantor_favicon.png"
import { useDatabotContext } from '../../../hooks/dataGovernance/DatabotContext';
import { useAuth } from '../../../context/AuthContext';
// import { useRelationship } from '../../../hooks/dataGovernance/Databot/useRelationship';

const DatabotChatSection = ({setIsResultScreen}) => {
  const { databot, triggerNewQuestion } = useDatabotContext();
  const isLoading = databot.is_loading;

  const { decodedToken } = useAuth();
  
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const [newQuery, setNewQuery] = useState("");

  const chatContainerRef = useRef(null);
  const maximizedChatContainerRef = useRef(null);

  const scrollToBottom = (containerRef) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isChatMaximized) {
        scrollToBottom(maximizedChatContainerRef);
      } else {
        scrollToBottom(chatContainerRef);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [databot?.queries, isLoading, isChatMaximized]);

  const handleSubmit = () => {
    if (newQuery.trim()) {
      triggerNewQuestion(newQuery, databot.curr_tab);
      setNewQuery("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full rounded-lg w-[400px]">
      <div className="pb-4 pt-5 px-4 flex-shrink-0">
        <div className="flex justify-between pb-2">
          <div className="flex items-center gap-1">
            <span className="text-[#8d77ba]"><Bot size={20} /></span>
            <span>Databot</span>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <div className="relative group">
              <button 
                onClick={() => setIsChatMaximized(true)}
                className="text-gray-500"
              >
                <Maximize size={20}/>
              </button>

              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1
                text-xs text-white bg-gray-700 px-2 py-1 rounded shadow
                opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Maximize
              </div>
            </div>

            <div className="relative group">
              <button 
                onClick={() => setIsResultScreen(false)}
                className="text-white bg-[#8d77ba] rounded-sm">
                <Plus size={20}/>
              </button>

              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1
                text-xs text-white bg-gray-700 px-2 py-1 rounded shadow
                opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                New chat
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500">Turn your data into instant answers.</p>
      </div>

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 border-t pt-5 space-y-4">
        {databot.queries.map((q, i) => (
            <div key={i} className="space-y-2">
              {/* User message */}
              <div className="flex justify-end items-start gap-2">
                <div className="max-w-xs bg-gray-100 p-3 rounded-2xl text-sm">
                  {q.q}
                </div>
                <div className="w-6 h-6 p-3 flex items-center justify-center rounded-full 
                  bg-gradient-to-r from-[#8d77ba] to-[#a892d1] text-white">
                  {decodedToken.preferred_username?.trim().charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Bot message */}
              <div className="flex justify-start items-start gap-2">
                <div className="flex items-center justify-center rounded-full bg-[#8d77ba] text-white">
                  <img
                    src={TantorlOGO}
                    alt="Tantor"
                    className="w-7 h-6 rounded-full object-contain bg-white border"
                  />
                </div>

                <div className="max-w-xs bg-[#8d77ba]/10 p-3 rounded-2xl text-sm whitespace-pre-line break-words">
                  {
                    q?.a ? (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: q?.a?.replace(
                            /\*\*(.*?)\*\*/g,
                            "<strong>$1</strong>"
                          )
                        }}
                      />
                    ) : isLoading ? (
                      <span className="animate-pulse text-gray-400">Thinking...</span>
                    ) : (
                      <span className="animate-pulse text-gray-400">No response, please try again.</span>
                    )
                  }
                </div>
              </div>
            </div>
          ))}
      </div>


      <div className="border-t mt-3 p-4 h-40">
        <div className="flex flex-col justify-between border-2 rounded-lg p-3 h-32 mb-3 border-[#8d77ba]">
          <textarea 
            placeholder="Ask any follow up question"
            value={newQuery}
            onChange={(e) => setNewQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full h-20 focus:outline-none focus:ring-0 resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">

              {/* Included in V2 */}
              {/* <button className="text-gray-500 cursor-pointer">
                <Paperclip className="-rotate-45" size={18} />
              </button>
              <button className="text-gray-500">
                <Mic size={18} />
              </button> */}

            </div>
            <button 
              onClick={handleSubmit}
              className="text-white bg-[#8d77ba] p-1 rounded-md">
              <ArrowRight size={18}/>
            </button>
          </div>
        </div>
      </div>

      {isChatMaximized && (
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl h-[70vh] rounded-lg shadow-lg flex flex-col">
            <div className="flex justify-between items-center px-5 pt-4">
              <h2 className="font-medium text-lg flex items-center gap-2">
                <Bot className="text-[#8d77ba]" size={20} /> Databot
              </h2>

              <div className="flex items-center gap-3 mt-1">
                <div className="relative group">
                  <button 
                    onClick={() => setIsChatMaximized(false)}
                    className="text-gray-500"
                  >
                    <Minimize size={20}/>
                  </button>

                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1
                    text-xs text-white bg-gray-700 px-2 py-1 rounded shadow
                    opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Minimize
                  </div>
                </div>

                <div className="relative group">
                  <button 
                    onClick={() => setIsResultScreen(false)}
                    className="text-white bg-[#8d77ba] rounded-sm">
                    <Plus size={20}/>
                  </button>

                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1
                    text-xs text-white bg-gray-700 px-2 py-1 rounded shadow
                    opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    New chat
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500 pl-5 border-b pb-3">Turn your data into instant answers.</p>

            <div 
              ref={maximizedChatContainerRef}
              className="flex-1 overflow-y-auto px-4 border-t pt-5 space-y-4">
              {databot.queries.map((q, i) => {
                return (
                  <div key={i} className="space-y-2">
                  <div className="flex justify-end items-start gap-2">
                    <div className="max-w-xs bg-gray-100 p-3 rounded-2xl text-sm">
                      {q.q}
                    </div>
                    <div className="w-7 h-7 p-3 flex items-center justify-center rounded-full 
                      bg-gradient-to-r from-[#8d77ba] to-[#a892d1] text-white">
                      {decodedToken.preferred_username?.trim().charAt(0).toUpperCase()}
                    </div>


                  </div>

                  <div className="flex justify-start items-start gap-2">
                    <div className="flex items-center justify-center rounded-full bg-[#8d77ba] text-white">
                      <img
                        src={TantorlOGO}
                        alt="Tantor"
                        className="w-7 h-6 rounded-full object-contain bg-white border"
                      />
                    </div>

                    {/* Answer */}
                    <div className="max-w-lg bg-[#8d77ba]/10 p-3 rounded-2xl text-sm whitespace-pre-line break-words">
                      {isLoading ? (
                        <span className="animate-pulse text-[#8d77ba]">Thinking...</span>
                      ) : (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: q?.a?.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
                )
              })}
            </div>

            <div className="p-4 h-40 mt-3">
              <div className="flex flex-col justify-between border-2 rounded-lg p-3 h-32 mb-3 border-[#8d77ba]">
                <textarea 
                  placeholder="Ask any follow up question"
                  value={newQuery}
                  onChange={(e) => setNewQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full h-20 focus:outline-none focus:ring-0 resize-none"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">

                    {/* Included in V2 */}
                    {/* <button className="text-gray-500 cursor-pointer">
                      <Paperclip className="-rotate-45" size={18} />
                    </button>
                    <button className="text-gray-500">
                      <Mic size={18} />
                    </button> */}

                  </div>
                  <button 
                    onClick={handleSubmit}
                    className="text-white bg-[#8d77ba] p-1 rounded-md">
                    <ArrowRight size={18}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabotChatSection;
