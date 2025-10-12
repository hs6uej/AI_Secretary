import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneIcon, KeyIcon, AlertCircleIcon, TerminalIcon } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { OtpInput } from '../components/ui/OtpInput';
import { useAuth } from '../context/AuthContext';
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    login,
    isAuthenticated
  } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', {
        replace: true
      });
    }
  }, [isAuthenticated, navigate]);
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to reasonable phone length
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhoneNumber(value);
    }
  };
  const handleGetOtp = () => {
    if (phoneNumber.length < 9) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    setIsLoading(true);
    // Mock API call to send OTP
    setTimeout(() => {
      setIsOtpSent(true);
      setIsLoading(false);
      setCountdown(30);
      // Start countdown
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 1000);
  };
  const handleLogin = async () => {
    if (otpValue.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      // Call login function from auth context
      await login(otpValue, `+66${phoneNumber}`);
      // No need to navigate here, the useEffect will handle it
    } catch (err) {
      setError('Invalid OTP. Please try again.');
      setIsLoading(false);
    }
  };
  const handleBypass = async () => {
    setIsLoading(true);
    try {
      // Use a predefined test account
      await login('123456', '+66812345678');
      // No need to navigate here, the useEffect will handle it
    } catch (err) {
      setError('Bypass login failed.');
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-background-light p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 md:p-8">
        <div className="flex flex-col items-center mb-8">
          <img src="https://placehold.co/200x80?text=AIS+Logo" alt="AIS Logo" className="h-16 mb-6" />
          <h1 className="text-2xl font-semibold text-center">
            AI Secretary Portal
          </h1>
        </div>
        {error && <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircleIcon size={20} className="text-error mr-2" />
            <span className="text-error text-sm">{error}</span>
          </div>}
        <div className="space-y-6">
          {/* Phone Number Input */}
          <div>
            <Input label="Mobile Number" type="tel" placeholder="Enter your mobile number" value={phoneNumber.length > 0 ? `+66 ${phoneNumber}` : ''} onChange={handlePhoneNumberChange} leftIcon={<PhoneIcon size={18} className="text-gray-500" />} fullWidth disabled={isOtpSent || isLoading} />
          </div>
          {/* OTP Section */}
          {isOtpSent && <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Enter the 6-digit code sent to +66 {phoneNumber}
                </p>
                <OtpInput length={6} value={otpValue} onChange={setOtpValue} disabled={isLoading} />
              </div>
            </div>}
          {/* Action Buttons */}
          <div className="space-y-3">
            {!isOtpSent ? <Button onClick={handleGetOtp} fullWidth loading={isLoading} disabled={phoneNumber.length < 9 || isLoading}>
                Get OTP
              </Button> : <>
                <Button onClick={handleLogin} fullWidth loading={isLoading} disabled={otpValue.length !== 6 || isLoading}>
                  Login
                </Button>
                <div className="text-center">
                  <Button variant="text" disabled={countdown > 0 || isLoading} onClick={handleGetOtp}>
                    {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                  </Button>
                </div>
              </>}
          </div>
          {/* Forgot Password */}
          <div className="text-center">
            <Button variant="text" className="text-secondary">
              Forgot Password?
            </Button>
          </div>
          {/* Bypass Button for Testing */}
          <div className="pt-4 border-t mt-4">
            <div className="flex items-center justify-center mb-2">
              <div className="h-px bg-gray-200 flex-grow"></div>
              <span className="px-2 text-xs text-gray-500">
                FOR TESTING ONLY
              </span>
              <div className="h-px bg-gray-200 flex-grow"></div>
            </div>
            <Button variant="outline" fullWidth onClick={handleBypass} disabled={isLoading} className="border-dashed border-gray-300 text-gray-500">
              <TerminalIcon size={16} className="mr-2" />
              Bypass Login (สำหรับทดสอบ)
            </Button>
          </div>
        </div>
      </div>
    </div>;
};