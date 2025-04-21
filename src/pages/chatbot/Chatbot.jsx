import React, { useState, useEffect, useRef } from "react";
import Logo from "../../assets/tantor_favicon.png";

const Chatbot = () => {
  const hostname = import.meta.env.VITE_CHATBOT_API;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Hi! How may I help you today?",
      isUser: false,
      isError: false,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [retryMessage, setRetryMessage] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (message = inputMessage, isRetry = false) => {
    if ((!message.trim() && !isRetry) || isLoading) return;

    try {
      setMessages((prev) => [...prev, { text: message, isUser: true }]);
      if (!isRetry) setInputMessage("");
      setIsLoading(true);
      setRetryMessage(null);

      const response = await fetch(`${hostname}/proxy-chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: inputMessage,
          username: "tantor_migration",
        }),
      });

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          text: data.answer || "I didn't get that, please try again.",
          isUser: false,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          text: "Oops! Something went wrong.",
          isUser: false,
          isError: true,
        },
      ]);
      setRetryMessage(message);
    } finally {
      setIsLoading(false);
    }
  };


  const LoadingDots = () => (
    <div className="flex space-x-1 p-3">
      <span className="w-2 h-2 bg-[#8e78b7] rounded-full animate-bounce"></span>
      <span
        className="w-2 h-2 bg-[#8e78b7] rounded-full animate-bounce"
        style={{ animationDelay: "0.1s" }}
      ></span>
      <span
        className="w-2 h-2 bg-[#8e78b7] rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      ></span>
    </div>
  );

  const formatResponse = (text) => {
    // Split response into parts with interactive elements
    const parts = text.split(/(```[\s\S]*?```|\[\[.*?\]\])/g);

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        // Code block formatting
        const code = part.slice(3, -3);
        return (
          <pre
            key={index}
            className="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto my-2 text-sm"
          >
            <code>{code}</code>
          </pre>
        );
      } else if (part.startsWith("[[") && part.endsWith("]]")) {
        // Interactive button
        const buttonText = part.slice(2, -2);
        return (
          <button
            key={index}
            onClick={() => handleSendMessage(buttonText)}
            className="mt-2 px-4 py-2 bg-[#8e78b7] text-white rounded-full hover:bg-[#78649c] transition-colors"
          >
            {buttonText}
          </button>
        );
      }

      // Regular text with line breaks
      return part.split("\n").map((line, lineIndex) => (
        <p key={`${index}-${lineIndex}`} className="mb-2">
          {line}
          {lineIndex < part.split("\n").length - 1 && <br />}
        </p>
      ));
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {isOpen ? (
        <div className="w-80 h-[500px] bg-white rounded-xl shadow-2xl flex flex-col transform transition-all duration-300">
          {/* Header */}
          <div className="bg-[#8e78b7] text-white p-4 rounded-t-xl flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={Logo}
                  alt="Tantor Logo"
                  className="w-8 h-8 filter brightness-0 invert"
                />
              </div>
              <h3 className="text-lg font-semibold">Tantor Bot</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/10 p-1 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-3 p-3 rounded-2xl max-w-[85%] ${
                  msg.isUser
                    ? "bg-[#8e78b7] text-white ml-auto"
                    : `bg-white text-gray-800 shadow-md mr-auto ${
                        msg.isError ? "border border-red-200 bg-red-50" : ""
                      }`
                }`}
              >
                {!msg.isUser && !msg.isError
                  ? formatResponse(msg.text)
                  : msg.text}
                {msg.isError && retryMessage && (
                  <button
                    onClick={() => handleSendMessage(retryMessage, true)}
                    className="mt-2 px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm hover:bg-red-200 transition-colors"
                  >
                    Retry
                  </button>
                )}
              </div>
            ))}
            {isLoading && <LoadingDots />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading}
                className="p-2 bg-[#8e78b7] text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-[#8e78b7] to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center relative group"
        >
          <svg
            className="w-8 h-8 text-white transform group-hover:scale-110 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <div className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
        </button>
      )}
    </div>
  );
};

export default Chatbot;
