import { Bot, PanelRightClose, MessageSquare, Paperclip, 
  Mic, ArrowRight, PanelLeftClose, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDatabotContext } from './context/DatabotContext';
import ResultSection from './ResultSection';
import DatabotChatSection from './DatabotChatSection';
import { useAuth } from '../../../context/AuthContext';
import { ChevronDown, ChevronUp } from 'lucide-react';
import RefreshSection from './RefreshSection';
import { useDatabotAPI } from '../../../hooks/dataGovernance/Databot/useDatabotAPI';
import toast from 'react-hot-toast';

const Databot = () => {
  const { token } = useAuth();

  const dropdownRef = useRef(null);
  const { triggerNewQuestion, resetChat, 
    handlePolicyIdsGlobal, isRefreshed, 
    handleFirstSelectedTab, 
    firstSelectedTab, handleSelectedConnectionGlobal, handleSelectedSchemaGlobal } = useDatabotContext();

  const { secureQueryLoading,
    getSecureQuery, 
    connectionsLoading,
    getConnectionDetails } = useDatabotAPI();

  const tabbedSection = ["relationship", "lineage", "impact", "dependency"];

  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(tabbedSection[0]);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isResultScreen, setIsResultScreen] = useState(false);
  const [query, setQuery] = useState("");
  const [connections, setConnections] = useState([])

  const handleSelect = (option) => {
    setSelectedTab(option);
    handleFirstSelectedTab(option)
    setIsOpen(false);
  };

  
  const getConnectionSchemaDetails = async () => {
    handleSelectedConnectionGlobal(null);
    handleSelectedSchemaGlobal(null);
    const policyId = await getSecureQuery();
    handlePolicyIdsGlobal(policyId?.matched_policy_ids);

    const connectionsResp = await getConnectionDetails(policyId?.matched_policy_ids);
    setConnections(connectionsResp);
  }

  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;

    didRun.current = true;
    toast("Connections are being fetched, Please wait!");
    getConnectionSchemaDetails()
  }, [])

  const handleQueryChange = (e) => {
    const value = e.target.value
    setQuery(value)
  }

  // Included in V2
  // const handleExpand = () => {
  //   setIsExpanded(!isExpanded)
  // }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
        <div className="flex-1 relative bg-gradient-to-t from-[#8d77ba]/30 via-white to-white 
          flex flex-col justify-center items-center text-center overflow-hidden">

          {/* connection and schema name */}
          <div className="absolute top-4 right-6">
            <RefreshSection 
              secureQueryLoading={secureQueryLoading} 
              connectionsLoading={connectionsLoading}
              dropdownRef={dropdownRef}
              connections={connections}/>
          </div>

          {/* Databot */}
          <div className='flex flex-col justify-center items-center text-center'>
            <div className="w-16 h-16 flex items-center justify-center bg-[#8d77ba] text-white rounded-full shadow mb-4">
              <Bot size={32} />
            </div>

            <h1 className="text-3xl font-semibold text-gray-800">Databot</h1>
            <p className="text-[#8d77ba] mt-1">Turn your data into instant answers.</p>

            {/* Input */}
           <div className="w-[700px] mt-8 px-4 py-2
            bg-white border border-gray-200 rounded-lg shadow-sm 
            focus-within:ring-2 focus-within:ring-[#8d77ba]">
            <textarea
              disabled={!isRefreshed}
              value={query}
              onChange={(e) => handleQueryChange(e)}
              placeholder="Ask Anything"
              className="w-full h-32 p-3 outline-none text-lg text-gray-700 placeholder-gray-400
              disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 resize-none"
            />


              {/* Included in V2 */}
              {/* <button className="p-2 text-gray-500 hover:text-[#8d77ba]">
                <Paperclip size={22} />
              </button>
              <button className="p-2 text-gray-500 hover:text-[#8d77ba]">
                <Mic size={22} />
              </button> */}

              <div className='flex justify-between mt-2'>
                <div ref={dropdownRef} className="relative w-36">
                  <button
                    disabled={query.length === 0}
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex justify-between items-center px-3 py-2 bg-white border 
                      border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 
                      focus:outline-none focus:ring-2 focus:ring-[#8d77ba] 
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                  >
                    <span className="text-sm capitalize">{selectedTab}</span>
                    <ChevronDown
                      size={18}
                      className={`transform transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <ul
                      className="absolute left-0 mt-1 w-full bg-white border border-gray-200 
                        rounded-lg shadow-lg max-h-40 overflow-y-auto z-10 text-sm"
                    >
                      {tabbedSection.map((option, i) => (
                        <li
                          key={i}
                          onClick={() => {
                            handleSelect(option)
                          }}
                          className="px-3 py-2 cursor-pointer capitalize hover:bg-[#f2f0f8] text-gray-700"
                        >
                          {option}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button 
                  disabled={query.length === 0}
                  onClick={async () => 
                  {
                    resetChat()
                    triggerNewQuestion(query, selectedTab)
                    setIsResultScreen(true)
                  }}
                  className="p-2 text-white disabled:bg-opacity-50 disabled:cursor-not-allowed
                    bg-[#8d77ba] hover:bg-[#7a66a8] rounded-xl ml-2">
                  <ArrowRight size={22} />
              </button>
              </div>
            </div>
          </div>
        </div> : 

        <div className="flex w-full">
          <div className="flex flex-col bg-white flex-[2] min-w-0 overflow-hidden">
            <RefreshSection 
              secureQueryLoading={secureQueryLoading} 
              connectionsLoading={connectionsLoading}
              dropdownRef={dropdownRef}
              connections={connections}
            />
            <ResultSection />
          </div>

          <div className="flex-[1] bg-white ml-2 border-white rounded-md min-w-0 overflow-hidden">
            <div className="h-full overflow-auto">
              <DatabotChatSection 
                setIsResultScreen={setIsResultScreen}
                setQuery={setQuery}
              />
            </div>
          </div>
        </div>
      }
    </div>
  );
};

export default Databot;