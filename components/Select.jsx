// Unified Select component for all Uni-Manager applications
import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

const ChevronDownIcon = () => (
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
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const Select = ({
  options = [],
  value,
  onChange,
  placeholder = "Select an option...",
  disabled = false,
  searchable = false,
  multiple = false,
  size = "medium",
  variant = "default",
  error = false,
  helperText = "",
  className = "",
  name,
  id,
  required = false,
  clearable = false,
  loading = false,
  onSearchChange,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    typeof document !== "undefined" &&
      document.addEventListener("mousedown", handleClickOutside);
    return () =>
      typeof document !== "undefined" &&
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Handle search changes
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearchChange?.(term);
  };

  const filteredOptions =
    searchable && !onSearchChange
      ? options.filter((option) =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : options;

  const handleOptionClick = (option) => {
    if (multiple) {
      const newValue = value?.includes(option.value)
        ? value.filter((v) => v !== option.value)
        : [...(value || []), option.value];
      onChange(newValue);
    } else {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  const dropdownClasses = `
    absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg rounded-md border
    border-gray-300 dark:border-gray-600 max-h-60 overflow-auto focus:outline-none
    ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"}
    transition-all duration-200 ease-in-out
  `.trim();

  return (
    <div ref={selectRef} className="relative">
      <button
        type="button"
        className={`
          relative w-full bg-white dark:bg-gray-700 border rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm
          ${error ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500" : "border-gray-300 dark:border-gray-600 dark:text-gray-100"}
          ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500" : ""}
          ${className}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="listbox-label"
        disabled={disabled}
      >
        <span className="block truncate">
          {multiple
            ? value && value.length > 0
              ? `${value.length} selected`
              : placeholder
            : value
              ? options.find((o) => o.value === value)?.label || value
              : placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon />
        </span>
      </button>

      {/* Dropdown */}
      <div className={dropdownClasses}>
        {searchable && (
          <div className="p-2 border-b border-gray-200 dark:border-gray-600">
            <input
              ref={searchRef}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Search options..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        )}

        <ul className="py-1">
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
              {searchTerm ? "No options found" : "No options available"}
            </li>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = multiple
                ? value?.includes(option.value)
                : value === option.value;

              return (
                <li
                  key={option.value}
                  className={`
                    relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-600
                    ${isSelected ? "bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-gray-100"}
                  `}
                  onClick={() => handleOptionClick(option)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span
                    className={`block truncate ${isSelected ? "font-medium" : "font-normal"}`}
                  >
                    {option.label}
                  </span>

                  {isSelected && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600 dark:text-blue-400">
                      <CheckIcon />
                    </span>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Helper Text / Error */}
      {helperText && (
        <p
          className={`mt-1 text-sm ${error ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}
        >
          {helperText}
        </p>
      )}

      {/* Hidden select for form submission */}
      <select
        name={name}
        id={id}
        value={multiple ? "" : value || ""}
        onChange={() => {}} // Controlled by our custom logic
        required={required}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        {multiple ? (
          value?.map((val) => <option key={val} value={val} selected />)
        ) : (
          <option value={value || ""}>{placeholder}</option>
        )}
      </select>
    </div>
  );
};

Select.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ),
  ]),
  onChange: PropTypes.func,
  onSearchChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  searchable: PropTypes.bool,
  multiple: PropTypes.bool,
  size: PropTypes.oneOf(["small", "medium", "large"]),
  variant: PropTypes.oneOf(["default", "outlined", "filled"]),
  error: PropTypes.bool,
  helperText: PropTypes.string,
  className: PropTypes.string,
  name: PropTypes.string,
  id: PropTypes.string,
  required: PropTypes.bool,
  clearable: PropTypes.bool,
  loading: PropTypes.bool,
};

export default Select;
