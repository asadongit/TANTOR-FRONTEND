import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Maximize, Minimize, GripVertical, User } from 'lucide-react';
import Logo from '../../assets/tantor_favicon.png';

const Chatbot = () => {
  const hostname = window._env_?.VITE_CHATBOT_API || '';  // Add fallback empty string

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! How may I help you today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Drag & position state
  const [position, setPosition] = useState({ y: window.innerHeight - 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const positionRef = useRef(position);
  const buttonRef = useRef(null);

  // Update default window size
  const [isMaximized, setIsMaximized] = useState(false);
  const chatWidth = isMaximized ? '60vw' : '400px';
  const chatHeight = isMaximized ? '80vh' : '500px';

  // Scroll to bottom on new message
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages, isLoading]);

  useEffect(() => { positionRef.current = position; }, [position]);

  // Drag handlers
  const handleDragStart = e => {
    e.stopPropagation();
    setIsDragging(true);
    const rect = buttonRef.current.getBoundingClientRect();
    setDragOffset(e.clientY - rect.top);
  };
  const handleDrag = e => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent text selection during drag
    requestAnimationFrame(() => {
      const newY = e.clientY - dragOffset;
      const maxY = window.innerHeight - 80;
      if (newY >= 0 && newY <= maxY) setPosition({ y: newY });
    });
  };
  const handleDragEnd = () => setIsDragging(false);
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  // Toggle open/minimize
  const toggleOpen = () => setIsOpen(open => !open);
  const toggleMaximize = () => setIsMaximized(max => !max);

  // Sending message
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    const userMsg = { sender: 'user', text: inputMessage };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);
    try {
      const res = await fetch(`${hostname}/proxy-chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg.text, username: 'tantor_migration' }),
        credentials: 'include' // Add credentials if needed for cookies
      });
      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`);
      }
      const data = await res.json();
      const botMsg = { sender: 'bot', text: data.answer || "I didn't get that." };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Oops! Something went wrong.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-10 z-40" onClick={toggleOpen} />}

      {/* Trigger Button when closed */}
      {!isOpen && (
        <div
          ref={buttonRef}
          className={`fixed right-0 flex flex-col items-center z-50 ${isDragging ? 'opacity-90 cursor-grabbing' : ''}`}
          style={{ top: position.y, transition: isDragging ? 'none' : 'top 0.2s ease-out' }}
        >
          <button
            onClick={toggleOpen}
            onMouseDown={e => e.stopPropagation()}
            className="bg-purple-600 hover:bg-purple-700 text-white w-12 h-10 flex items-center justify-center shadow-lg border-l-4 border-purple-700 rounded-tl-lg transition"
            onMouseEnter={() => {}}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <div
            onMouseDown={handleDragStart}
            className="bg-purple-600 hover:bg-purple-700 w-12 h-10 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg border-l-4 border-purple-700 rounded-bl-lg"
          >
            <GripVertical className="w-5 h-5 text-white" />
          </div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 shadow-2xl" style={{ width: chatWidth, height: chatHeight }}>
          <div className="flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden h-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <img src={Logo} alt="Logo" className="w-8 h-8 bg-white rounded-full p-1 shadow-md" />
                <h2 className="text-white font-bold text-xl">Tantor Bot</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={toggleMaximize} className="p-1.5 rounded-full bg-purple-500 hover:bg-purple-400 transition">
                  {isMaximized ? <Minimize className="w-5 h-5 text-white" /> : <Maximize className="w-5 h-5 text-white" />}
                </button>
                <button onClick={toggleOpen} className="p-1.5 rounded-full bg-purple-500 hover:bg-purple-400 transition">
                  <Minimize className="w-5 h-5 text-white rotate-45" />
                </button>
              </div>
            </div>
            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-5 bg-white"
              style={{ height: 'calc(100% - 140px)' }}
            >
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex items-start space-x-3 mb-5 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${msg.sender === 'user' ? 'bg-purple-600' : 'bg-gray-100'}`}>
                      {msg.sender === 'user' ? <User className="text-white w-5 h-5" /> : <img src={Logo} alt="bot" className="w-6 h-6" />}
                    </div>
                  </div>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.sender === 'user' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none shadow-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <img src={Logo} alt="bot" className="w-6 h-6" />
                  </div>
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                    <div className="flex space-x-2">
                      <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce delay-150"></div>
                      <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce delay-300"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Input */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center bg-white rounded-full p-1.5 shadow-sm border border-gray-200">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-none px-4 py-2.5 focus:outline-none text-gray-700"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className={`p-3 rounded-full text-white ${isLoading || !inputMessage.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 hover:shadow-md transition'}`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="text-xs text-gray-500 text-center mt-2">
                Powered by Tantor AI
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
