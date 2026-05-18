import React from 'react';

type SpinnerSize = 'small' | 'medium' | 'large' | 'xl';
type SpinnerColor = 'blue' | 'gray' | 'white' | 'green' | 'red';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  className?: string;
  text?: string;
}

const sizeMap: Record<SpinnerSize, string> = {
  small: 'h-4 w-4',
  medium: 'h-8 w-8',
  large: 'h-12 w-12',
  xl: 'h-16 w-16'
};

const colorMap: Record<SpinnerColor, string> = {
  blue: 'border-blue-600',
  gray: 'border-gray-600',
  white: 'border-white',
  green: 'border-green-600',
  red: 'border-red-600'
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'blue',
  className = '',
  text = ''
}) => (
  <div className={`flex flex-col items-center justify-center ${className}`}>
    <div
      className={`animate-spin rounded-full border-2 border-t-transparent ${sizeMap[size]} ${colorMap[color]}`}
    />
    {text && (
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{text}</p>
    )}
  </div>
);

export default LoadingSpinner;
export { LoadingSpinner };
