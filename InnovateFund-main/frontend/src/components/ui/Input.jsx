import React, { forwardRef } from "react";

const Input = forwardRef(
  (
    {
      label,
      error,
      helper,
      icon,
      iconPosition = "left",
      className = "",
      containerClassName = "",
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "w-full px-3 py-2 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 bg-white dark:bg-slate-800/70 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400";

    const stateClasses = error
      ? "border-red-300 focus:border-red-500 focus:ring-red-200 dark:border-red-500/60 dark:focus:ring-red-400/30"
      : "border-gray-300 focus:border-primary-500 focus:ring-primary-200 dark:border-slate-600 dark:focus:border-primary-400 dark:focus:ring-primary-500/30";

    const iconClasses = icon
      ? iconPosition === "left"
        ? "pl-10"
        : "pr-10"
      : "";

    return (
      <div className={`space-y-1 ${containerClassName}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div
              className={`absolute inset-y-0 ${
                iconPosition === "left" ? "left-0 pl-3" : "right-0 pr-3"
              } flex items-center pointer-events-none`}
            >
              <span className="text-gray-400 dark:text-slate-400">{icon}</span>
            </div>
          )}

          <input
            ref={ref}
            className={`${baseClasses} ${stateClasses} ${iconClasses} ${className}`}
            {...props}
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        {helper && !error && (
          <p className="text-sm text-gray-500 dark:text-slate-400">{helper}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
