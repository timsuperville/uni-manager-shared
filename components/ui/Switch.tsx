import React from 'react';

type SwitchSize = 'sm' | 'default' | 'lg';

interface SwitchProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size' | 'onChange'
> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  size?: SwitchSize;
  className?: string;
}

const sizeClasses: Record<SwitchSize, string> = {
  sm: 'w-9 h-5 after:h-4 after:w-4',
  default: 'w-11 h-6 after:h-5 after:w-5',
  lg: 'w-14 h-7 after:h-6 after:w-6'
};

export const Switch: React.FC<SwitchProps> = ({
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  size = 'default',
  className = '',
  ...props
}) => {
  const [isChecked, setIsChecked] = React.useState(
    defaultChecked || checked || false
  );

  React.useEffect(() => {
    if (checked !== undefined) setIsChecked(checked);
  }, [checked]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    if (checked === undefined) setIsChecked(newChecked);
    onChange?.(e);
  };

  return (
    <label
      className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <input
        type="checkbox"
        className="sr-only peer"
        checked={isChecked}
        onChange={handleChange}
        disabled={disabled}
        {...props}
      />
      <div
        className={`${sizeClasses[size]} [background:var(--glass-outline,rgba(255,255,255,0.18))] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-(--primary-resonance,#4f46e5)/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:transition-all peer-checked:[background:var(--primary-resonance,#4f46e5)] transition-colors duration-200 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      />
    </label>
  );
};

export default Switch;
