import React from 'react';
import PropTypes from 'prop-types';

const Switch = ({ 
  checked = false,
  defaultChecked = false,
  onChange,
  disabled = false,
  size = 'default',
  className = '',
  ...props 
}) => {
  const [isChecked, setIsChecked] = React.useState(defaultChecked || checked);

  React.useEffect(() => {
    if (checked !== undefined) {
      setIsChecked(checked);
    }
  }, [checked]);

  const handleChange = (e) => {
    const newChecked = e.target.checked;
    if (checked === undefined) {
      setIsChecked(newChecked);
    }
    if (onChange) {
      onChange(e);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-9 h-5 after:h-4 after:w-4';
      case 'lg':
        return 'w-14 h-7 after:h-6 after:w-6';
      default:
        return 'w-11 h-6 after:h-5 after:w-5';
    }
  };

  return (
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={isChecked}
        onChange={handleChange}
        disabled={disabled}
        {...props}
      />
      <div className={`
        ${getSizeClasses()}
        bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 
        rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white 
        after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
        after:border-gray-300 after:border after:rounded-full after:transition-all 
        peer-checked:bg-blue-600 transition-colors duration-200
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
      `} />
    </label>
  );
};

Switch.propTypes = {
  checked: PropTypes.bool,
  defaultChecked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'default', 'lg']),
  className: PropTypes.string,
};

export { Switch };
