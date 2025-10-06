import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bot,
  Send,
  Lightbulb,
  TrendingUp,
  MessageSquare,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMutation } from "react-query";
import { api } from "../services/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const AIAssistantPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [context, setContext] = useState("general");
  const [ideaContext, setIdeaContext] = useState(null);
  const messagesEndRef = useRef(null);

  const contexts = [
    { value: "general", label: "General", icon: MessageSquare },
    { value: "innovation", label: "Innovation", icon: Lightbulb },
    { value: "investment", label: "Investment", icon: TrendingUp },
  ];

  // AI Chat mutation
  const chatMutation = useMutation((data) => api.ai.chat(data), {
    onSuccess: (response) => {
      const aiMessage = {
        id: Date.now() + 1,
        content: response.data.response,
        sender: "ai",
        timestamp: new Date(),
        context: response.data.context,
      };
      setMessages((prev) => [...prev, aiMessage]);
    },
    onError: (error) => {
      const errorMessage = {
        id: Date.now() + 1,
        content: "Sorry, I encountered an error. Please try again.",
        sender: "ai",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial welcome message or idea context
  useEffect(() => {
    if (location.state && location.state.ideaContext) {
      setIdeaContext(location.state.ideaContext);
      setMessages([
        {
          id: 1,
          content: `You are now chatting about the following idea:\n\n${location.state.ideaContext}`,
          sender: "ai",
          timestamp: new Date(),
          isWelcome: true,
        },
      ]);
    } else {
      const welcomeMessage = {
        id: 1,
        content:
          user?.userType === "investor"
            ? `Hello ${user.name}! I'm your AI investment assistant. I can help you evaluate opportunities, understand market trends, and make informed investment decisions. What would you like to know?`
            : `Hi ${user.name}! I'm your AI innovation assistant. I can help you refine your ideas, understand market opportunities, and connect with the right investors. How can I assist you today?`,
        sender: "ai",
        timestamp: new Date(),
        isWelcome: true,
      };
      setMessages([welcomeMessage]);
    }
  }, [user, location.state]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      content: inputMessage.trim(),
      sender: "user",
      timestamp: new Date(),
    };
    // Add to state immediately for UI
    setMessages((prev) => [...prev, userMessage]);

    // Use latest messages state for AI (including the new user message)
    const messagesForAI = [];
    if (ideaContext) {
      messagesForAI.push({
        role: "system",
        content: `Here is the idea context:\n${ideaContext}`,
      });
    }
    messagesForAI.push(
      ...[...messages, userMessage]
        .filter((msg) => msg.sender === "user" || msg.sender === "ai")
        .map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content,
        }))
    );
    chatMutation.mutate({
      messages: messagesForAI,
      context,
    });
    setInputMessage("");
  };

  const handleContextChange = (newContext) => {
    setContext(newContext);

    // Add context change message
    const contextMessage = {
      id: Date.now(),
      content: `Switched to ${newContext} mode. How can I help you with ${
        newContext === "general" ? "general questions" : newContext
      }?`,
      sender: "ai",
      timestamp: new Date(),
      isContextChange: true,
    };
    setMessages((prev) => [...prev, contextMessage]);
  };

  const clearChat = () => {
    const welcomeMessage = {
      id: Date.now(),
      content:
        user?.userType === "investor"
          ? `Hello ${user.name}! I'm your AI investment assistant. I can help you evaluate opportunities, understand market trends, and make informed investment decisions. What would you like to know?`
          : `Hi ${user.name}! I'm your AI innovation assistant. I can help you refine your ideas, understand market opportunities, and connect with the right investors. How can I assist you today?`,
      sender: "ai",
      timestamp: new Date(),
      isWelcome: true,
    };
    setMessages([welcomeMessage]);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const suggestedQuestions =
    user?.userType === "investor"
      ? [
          "What are the key metrics to evaluate a startup?",
          "How do I assess market size for an investment?",
          "What are the current trends in tech investments?",
          "How do I perform due diligence on a startup?",
        ]
      : [
          "How do I validate my business idea?",
          "What makes a compelling pitch to investors?",
          "How do I calculate my startup's valuation?",
          "What are investors looking for in 2024?",
        ];

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  AI Assistant
                </h1>
                <p className="text-sm text-gray-600">
                  Your personal{" "}
                  {user?.userType === "investor" ? "investment" : "innovation"}{" "}
                  advisor
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Context Selector */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {contexts.map((ctx) => {
                  const Icon = ctx.icon;
                  return (
                    <button
                      key={ctx.value}
                      onClick={() => handleContextChange(ctx.value)}
                      className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        context === ctx.value
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-1.5" />
                      {ctx.label}
                    </button>
                  );
                })}
              </div>

              <Button variant="outline" size="sm" onClick={clearChat}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-44">
        <div className="max-w-4xl mx-auto p-4">
          <div className="space-y-6">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex max-w-3xl ${
                    message.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 ${
                      message.sender === "user" ? "ml-3" : "mr-3"
                    }`}
                  >
                    {message.sender === "user" ? (
                      <img
                        src={
                          user?.profilePicture ||
                          `https://ui-avatars.com/api/?name=${user?.name}&background=667eea&color=fff`
                        }
                        alt={user?.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.isError
                            ? "bg-red-100"
                            : message.isWelcome || message.isContextChange
                            ? "bg-gradient-to-r from-purple-500 to-pink-500"
                            : "bg-gradient-to-r from-blue-500 to-cyan-500"
                        }`}
                      >
                        {message.isError ? (
                          <Bot className="w-4 h-4 text-red-600" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                    )}
                  </div>
                  {/* Message Content */}
                  <div
                    className={`flex flex-col ${
                      message.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-3 rounded-2xl max-w-full ${
                        message.sender === "user"
                          ? "bg-primary-600 text-white"
                          : message.isError
                          ? "bg-red-900/80 text-red-200 border border-red-700"
                          : message.isWelcome || message.isContextChange
                          ? "bg-gradient-to-r from-purple-900/80 to-pink-900/80 text-purple-100 border border-purple-700"
                          : "bg-gray-800 text-gray-100 border border-gray-700 shadow-sm"
                      }`}
                    >
                      {message.isWelcome && (
                        <div className="flex items-center mb-2">
                          <Sparkles className="w-4 h-4 mr-2 text-purple-300" />
                          <span className="text-sm font-medium text-purple-200">
                            Welcome!
                          </span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                    <span
                      className={`text-xs text-gray-500 mt-1 ${
                        message.sender === "user" ? "mr-2" : "ml-2"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {chatMutation.isLoading && (
              <div className="flex justify-start">
                <div className="flex mr-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm text-gray-600">
                      AI is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 sticky bottom-32 z-10"
            >
              <h3 className="text-sm font-medium text-gray-200 mb-3">
                Suggested questions:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(question)}
                    className="text-left p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-primary-400 hover:bg-primary-900/30 transition-colors text-gray-100"
                  >
                    <p className="text-sm">{question}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input with animated border, sticky at bottom */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-gray-950/95 to-transparent z-20">
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <motion.form
            onSubmit={handleSendMessage}
            className="flex items-center space-x-3 relative"
            initial={{ boxShadow: "0 0 0 0 #a78bfa" }}
            animate={{
              boxShadow: [
                "0 0 0 0 #a78bfa",
                "0 0 12px 2px #a78bfa",
                "0 0 0 0 #a78bfa",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              borderRadius: "1rem",
              background: "rgba(24,24,27,0.95)",
              border: "1.5px solid #7c3aed",
            }}
          >
            <div className="flex-1">
              <Input
                placeholder={`Ask me anything about ${
                  context === "general" ? "startups and innovation" : context
                }...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="border-0 bg-gray-900 text-gray-100 focus:bg-gray-800"
              />
            </div>
            <Button
              type="submit"
              disabled={!inputMessage.trim() || chatMutation.isLoading}
              loading={chatMutation.isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </motion.form>
          <div className="flex items-center justify-center mt-2">
            <p className="text-xs text-gray-400">
              AI responses are generated and may not always be accurate. Use as
              guidance only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
