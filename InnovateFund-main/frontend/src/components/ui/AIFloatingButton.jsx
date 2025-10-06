import React from "react";
import { Bot } from "lucide-react";

// A consistent floating action button used across pages to open the AI assistant
// Props: onClick: () => void
const AIFloatingButton = ({ onClick }) => (
  <button
    onClick={onClick}
    type="button"
    aria-label="Ask AI"
    title="Ask AI"
    className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full text-white shadow-xl shadow-primary-500/20 bg-gradient-to-br from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-transform duration-200 ease-out active:scale-95 group"
  >
    <Bot className="w-6 h-6 mx-auto" />
    {/* Tooltip */}
    <span className="absolute opacity-0 group-hover:opacity-100 bg-gray-900/95 text-white text-xs font-medium rounded-lg px-2 py-1 left-1/2 -translate-x-1/2 -top-2 -translate-y-full pointer-events-none transition-opacity whitespace-nowrap">
      Ask AI
    </span>
    {/* Subtle glow ring */}
    <span
      className="absolute inset-0 rounded-full ring-2 ring-white/10"
      aria-hidden="true"
    />
  </button>
);

export default AIFloatingButton;
