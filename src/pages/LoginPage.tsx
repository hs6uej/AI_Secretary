import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneIcon, KeyIcon, AlertCircleIcon, TerminalIcon, UserPlusIcon, LogInIcon, UserCheckIcon } from 'lucide-react'; // Added UserCheckIcon
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  // isAuthLoading is true only during the initial check on app load
  // isLoading is for actions triggered on this page (login, register)
  const { login, register, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [ownerNumber, setOwnerNumber] = useState('');
  const [password, setPassword] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Page specific loading state

  // Redirect if already authenticated
  useEffect(() => {
    // Only redirect if authentication status is confirmed (not during initial load)
    if (!isAuthLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  const handleOwnerNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setOwnerNumber(value);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // Prevent form submission if used in a form
    if (!ownerNumber || !password) {
      setError('Please enter both owner number and password');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await login(ownerNumber, password);
      // Navigate is handled by useEffect
    } catch (err: any) {
        const errMsg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
        setError(errMsg);
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // Prevent form submission
    if (!ownerNumber || !password) {
      setError('Owner number and password are required for registration');
      return;
    }
     if (ownerNumber.length !== 10) {
        setError('Owner number must be 10 digits.');
        return;
    }
     if (password.length < 4) {
        setError('Password must be at least 4 characters long.');
        return;
    }

    setError('');
    setIsLoading(true);
    try {
      await register(ownerNumber, password, ownerName || undefined);
       // Navigate is handled by useEffect
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errMsg);
    } finally {
        setIsLoading(false);
    }
  };

  // Handler for Bypass Login button
  const handleBypass = async () => {
     setIsLoading(true);
     setError('');
     try {
         await login('0888888888', 'bypasspassword'); // Use the bypass creds from authService
     } catch (err) {
         setError('Bypass login failed.');
     } finally {
         setIsLoading(false);
     }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError('');
    // Clear fields when switching modes for better UX
    setOwnerNumber('');
    setPassword('');
    setOwnerName('');
  };

  // Show loading indicator during initial auth check
  if (isAuthLoading) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-background-light p-4">
             <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
             <p className="ml-4 text-gray-600">Loading...</p>
        </div>
     );
  }

  // Determine which action to perform on Enter key press
  const handleSubmit = isRegisterMode ? handleRegister : handleLogin;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 md:p-8">
        <div className="flex flex-col items-center mb-8">
          <img src="https://placehold.co/200x80?text=AIS+Logo" alt="AIS Logo" className="h-16 mb-6" />
          <h1 className="text-2xl font-semibold text-center">
             {isRegisterMode ? 'Register New Account' : 'AI Secretary Portal'}
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-sm">
            <AlertCircleIcon size={18} className="text-error mr-2 flex-shrink-0" />
            <span className="text-error">{error}</span>
          </div>
        )}

        {/* Use form element for better accessibility and Enter key submission */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Owner Number Input */}
          <div>
            <Input
              label="Owner Number"
              type="tel" // Use tel for numeric keypad on mobile
              inputMode="numeric" // Hint for numeric input
              placeholder="Enter your 10-digit number"
              value={ownerNumber}
              onChange={handleOwnerNumberChange}
              leftIcon={<PhoneIcon size={18} className="text-gray-500" />}
              fullWidth
              disabled={isLoading}
              maxLength={10}
              required
              autoComplete="tel-national" // Autocomplete hint
            />
          </div>

          {/* Password Input */}
          <div>
            <Input
              label="Password"
              type="password"
              placeholder={isRegisterMode ? "Choose a password (min. 4 chars)" : "Enter your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<KeyIcon size={18} className="text-gray-500" />}
              fullWidth
              disabled={isLoading}
              required
              autoComplete={isRegisterMode ? "new-password" : "current-password"} // Autocomplete hint
            />
             {isRegisterMode && password.length > 0 && password.length < 4 && (
                <p className="mt-1 text-xs text-orange-500">Password must be at least 4 characters long.</p>
             )}
          </div>

          {/* Owner Name Input (Only for Register Mode) */}
          {isRegisterMode && (
            <div>
              <Input
                label="Your Name (Optional)"
                type="text"
                placeholder="Enter your display name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                leftIcon={<UserCheckIcon size={18} className="text-gray-500" />} // Changed Icon
                fullWidth
                disabled={isLoading}
                autoComplete="name" // Autocomplete hint
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
             {isRegisterMode ? (
               <Button type="submit" fullWidth loading={isLoading} disabled={!ownerNumber || !password || ownerNumber.length !== 10 || password.length < 4 || isLoading}>
                 <UserPlusIcon size={18} className="mr-2"/> Register
               </Button>
             ) : (
               <Button type="submit" fullWidth loading={isLoading} disabled={!ownerNumber || !password || isLoading}>
                 <LogInIcon size={18} className="mr-2"/> Login
               </Button>
             )}
          </div>
        </form> {/* End of form */}

          {/* Mode Toggle Link */}
          <div className="text-center text-sm mt-4">
             {isRegisterMode ? (
               <>
                 Already have an account?{' '}
                 <Button variant="text" onClick={toggleMode} disabled={isLoading} className="text-primary px-1 py-0 h-auto">
                   Login here
                 </Button>
               </>
             ) : (
               <>
                 Don't have an account?{' '}
                 <Button variant="text" onClick={toggleMode} disabled={isLoading} className="text-primary px-1 py-0 h-auto">
                   Register now
                 </Button>
               </>
             )}
           </div>

          {/* Forgot Password */}
          {!isRegisterMode && (
             <div className="text-center mt-2">
                <Button variant="text" className="text-sm text-secondary px-1 py-0 h-auto" disabled={isLoading}>
                Forgot Password?
                </Button>
             </div>
          )}

          {/* Bypass Button */}
          {!isRegisterMode && (
            <div className="pt-4 border-t mt-4">
                <div className="flex items-center justify-center mb-2">
                  <div className="h-px bg-gray-200 flex-grow"></div>
                  <span className="px-2 text-xs text-gray-500">FOR TESTING ONLY</span>
                  <div className="h-px bg-gray-200 flex-grow"></div>
                </div>
                <Button variant="outline" fullWidth onClick={handleBypass} disabled={isLoading} className="border-dashed border-gray-300 text-gray-500">
                  <TerminalIcon size={16} className="mr-2" />
                  Bypass Login (เบอร์ลงท้าย 888)
                </Button>
            </div>
          )}
      </div>
    </div>
  );
};