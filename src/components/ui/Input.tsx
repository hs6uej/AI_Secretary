import React from 'react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helpText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const widthClass = fullWidth ? 'w-full' : '';
  const errorClass = error ? 'border-error focus:border-error focus:ring-error' : 'border-gray-300 focus:border-primary focus:ring-primary';
  return <div className={`${widthClass} ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>}
      <div className="relative">
        {leftIcon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>}
        <input className={`
            block rounded-lg shadow-sm
            ${leftIcon ? 'pl-10' : 'pl-4'}
            ${rightIcon ? 'pr-10' : 'pr-4'}
            py-2.5 w-full
            bg-white
            ${errorClass}
            focus:outline-none focus:ring-1
            disabled:bg-gray-100 disabled:text-gray-500
          `} {...props} />
        {rightIcon && <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightIcon}
          </div>}
      </div>
      {(error || helpText) && <p className={`mt-1 text-sm ${error ? 'text-error' : 'text-gray-500'}`}>
          {error || helpText}
        </p>}
    </div>;
};