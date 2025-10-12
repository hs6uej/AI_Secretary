import React, { useEffect, useRef } from 'react';
interface OtpInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}
export const OtpInput: React.FC<OtpInputProps> = ({
  length,
  value,
  onChange,
  disabled = false
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    // Initialize refs array with the correct length
    inputRefs.current = inputRefs.current.slice(0, length);
    // Focus the first input on mount if not disabled
    if (!disabled && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [length, disabled]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = e.target.value.replace(/\D/g, '');
    if (!newValue) return;
    // Update the value
    const newOtp = value.split('');
    newOtp[index] = newValue.slice(-1);
    onChange(newOtp.join(''));
    // Move to the next input if available
    if (index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      // Move to previous input on left arrow
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      // Move to next input on right arrow
      inputRefs.current[index + 1]?.focus();
    }
  };
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      // Fill as many inputs as we have digits
      const newOtp = Array(length).fill('');
      pastedData.split('').forEach((char, idx) => {
        if (idx < length) newOtp[idx] = char;
      });
      onChange(newOtp.join(''));
      // Focus the next empty input or the last one
      const nextEmptyIndex = pastedData.length < length ? pastedData.length : length - 1;
      inputRefs.current[nextEmptyIndex]?.focus();
    }
  };
  return <div className="flex justify-center space-x-2">
      {Array(length).fill('').map((_, index) => <input key={index} ref={el => inputRefs.current[index] = el} type="text" inputMode="numeric" maxLength={1} value={value[index] || ''} onChange={e => handleChange(e, index)} onKeyDown={e => handleKeyDown(e, index)} onPaste={index === 0 ? handlePaste : undefined} disabled={disabled} className="w-10 h-12 text-center text-lg font-medium border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:text-gray-500" />)}
    </div>;
};