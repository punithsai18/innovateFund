import React from "react";
import { Cog, Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Button from "../components/ui/Button";

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="flex items-center mb-6">
        <Cog className="w-8 h-8 text-primary-600 mr-3" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          Settings
        </h1>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-slate-200">
          Account Settings
        </h2>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Email Notifications
          </label>
          <input type="checkbox" className="mr-2" checked readOnly />
          <span className="text-gray-600 dark:text-slate-400">
            Receive important updates via email
          </span>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Push Notifications
          </label>
          <input type="checkbox" className="mr-2" checked readOnly />
          <span className="text-gray-600 dark:text-slate-400">
            Enable push notifications on this device
          </span>
        </div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Dark Theme
            </label>
            <p className="text-xs text-gray-500 dark:text-slate-500">
              Switch between light and dark interface
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleTheme}
            className="flex items-center gap-2"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
        </div>
        <div className="mt-8">
          <Button variant="danger">Delete Account</Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
