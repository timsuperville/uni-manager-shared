// Unified Select component for all Uni-Manager applications
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const ChevronDownIcon = () => (
  <svg
    className='w-5 h-5'
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M19 9l-7 7-7-7'
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    className='w-4 h-4'
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M5 13l4 4L19 7'
    />
  </svg>
);

const Select = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  searchable = false,
  multiple = false,
  size = 'medium',
  variant = 'default',
  error = false,
  helperText = '',
  className = '',
  name,
  id,
  required = false,
  clearable = false,
  loading = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    typeof document !== "undefined" && document.addEventListener('mousedown', handleClickOutside);
    return () => typeof document !== "undefined" && document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  const filteredOptions = searchable
    ? options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    : options;

  const getSelectedOption = () => {
    if (multiple) {
      return options.filter((option) => value?.includes(option.value));
    }
    return options.find((option) => option.value === value);
  };

  const handleOptionClick = (option) => {
    if (multiple) {
      const newValue = value?.includes(option.value)
        ? value.filter((v) => v !== option.value)
        : [...(value || []), option.value];
      onChange?.(newValue);
    } else {
      onChange?.(option.value);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.(multiple ? [] : '');
  };

  const getSizeClasses = () => {
    const sizes = {
      small: 'px-3 py-1.5 text-sm',
      medium: 'px-3 py-2 text-sm',
      large: 'px-4 py-3 text-base',
    };
    return sizes[size] || sizes.medium;
  };

  const getVariantClasses = () => {
    const variants = {
      default: 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700',
      outlined:
        'border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700',
      filled: 'border-transparent bg-gray-100 dark:bg-gray-800',
    };
    return variants[variant] || variants.default;
  };

  const selectedOption = getSelectedOption();
  const hasValue = multiple
    ? value?.length > 0
    : value !== undefined && value !== '';

  const buttonClasses = `
    relative w-full cursor-pointer rounded-md border
    ${getSizeClasses()}
    ${getVariantClasses()}
    ${error ? 'border-red-500 ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}
    ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-gray-400 dark:hover:border-gray-500'}
    text-left focus:outline-none focus:ring-2 focus:ring-offset-2
    transition-colors duration-200
    ${className}
  `.trim();

  const dropdownClasses = `
    absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg rounded-md border
    border-gray-300 dark:border-gray-600 max-h-60 overflow-auto focus:outline-none
    ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}
    transition-all duration-200 ease-in-out
  `.trim();

  return (
    <div ref={selectRef} className='relative'>
      {/* Select Button */}
      <button
        type='button'
        className={buttonClasses}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup='listbox'
        aria-expanded={isOpen}
        {...props}
      >
        <span className='flex items-center justify-between'>
          <span className='block truncate'>
            {multiple && selectedOption?.length > 0 ? (
              <span className='flex flex-wrap gap-1'>
                {selectedOption.map((opt) => (
                  <span
                    key={opt.value}
                    className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  >
                    {opt.label}
                  </span>
                ))}
              </span>
            ) : selectedOption ? (
              selectedOption.label || selectedOption.label
            ) : (
              <span className='text-gray-500 dark:text-gray-400'>
                {placeholder}
              </span>
            )}
          </span>

          <span className='flex items-center ml-2'>
            {loading && (
              <svg
                className='animate-spin h-4 w-4 text-gray-400 mr-2'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                />
              </svg>
            )}

            {clearable && hasValue && !disabled && (
              <button
                type='button'
                onClick={handleClear}
                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mr-2'
                aria-label='Clear selection'
              >
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            )}

            <ChevronDownIcon />
          </span>
        </span>
      </button>

      {/* Dropdown */}
      <div className={dropdownClasses}>
        {searchable && (
          <div className='p-2 border-b border-gray-200 dark:border-gray-600'>
            <input
              ref={searchRef}
              type='text'
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              placeholder='Search options...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        <ul className='py-1'>
          {filteredOptions.length === 0 ? (
            <li className='px-3 py-2 text-gray-500 dark:text-gray-400 text-sm'>
              {searchTerm ? 'No options found' : 'No options available'}
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
                    ${isSelected ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}
                  `}
                  onClick={() => handleOptionClick(option)}
                  role='option'
                  aria-selected={isSelected}
                >
                  <span
                    className={`block truncate ${isSelected ? 'font-medium' : 'font-normal'}`}
                  >
                    {option.label}
                  </span>

                  {isSelected && (
                    <span className='absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600 dark:text-blue-400'>
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
          className={`mt-1 text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {helperText}
        </p>
      )}

      {/* Hidden select for form submission */}
      <select
        name={name}
        id={id}
        value={multiple ? '' : value || ''}
        onChange={() => { }} // Controlled by our custom logic
        required={required}
        multiple={multiple}
        className='sr-only'
        tabIndex={-1}
        aria-hidden='true'
      >
        {multiple ? (
          value?.map((val) => <option key={val} value={val} selected />)
        ) : (
          <option value={value || ''} selected />
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
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  searchable: PropTypes.bool,
  multiple: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['default', 'outlined', 'filled']),
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
