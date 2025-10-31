// src/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { 
  UserIcon, BellIcon, ShieldIcon, LogOutIcon, 
  SaveIcon, RefreshCwIcon, AlertTriangleIcon 
} from 'lucide-react';
// ADDED (Case 12, 15): Import type for saving
import { UpdateSettingsData } from '../services/settingsService';

export const SettingsPage: React.FC = () => {
  const {
    user,
    logout,
    userSettings,
    updateUserSettings, // This is the new function from context
  } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'secretary' | 'security'>('profile');
  
  // --- Form States (Combined for simplicity) ---
  const [name, setName] = useState('');
  const [spelling, setSpelling] = useState(''); // (Case 15)
  const [announcement, setAnnouncement] = useState(''); // (Case 12)
  // TODO: Add DND/Forwarding states here
  
  // --- General States ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load initial data from context
  useEffect(() => {
    if (user) {
      setName(user.owner_name || '');
      setSpelling(user.owner_name_spelling || ''); // (Case 15)
    }
    if (userSettings) {
      setAnnouncement(userSettings.announcement || ''); // (Case 12)
      // TODO: Set DND/Forwarding states here
    }
  }, [user, userSettings]);

  // MODIFIED (Case 12, 15): Combined Save Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const updateData: UpdateSettingsData = {
      owner_name: name,
      owner_name_spelling: spelling, // (Case 15)
      announcement: announcement, // (Case 12)
      // TODO: Add DND/Forwarding fields
    };

    try {
      await updateUserSettings(updateData);
      setSuccess('Settings saved successfully!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // ADDED (Case 12): Handler to clear announcement
  const handleCancelAnnouncement = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Call update with only the announcement field set to null
      await updateUserSettings({ announcement: null });
      setAnnouncement(''); // Clear local input
      setSuccess('Announcement cancelled successfully!');
    } catch (err) {
      setError('Failed to cancel announcement.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = () => {
    alert('Change password functionality not implemented yet.');
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      {/* --- Error/Success Alerts --- */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4" role="alert">
          <AlertTriangleIcon className="inline w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md relative mb-4" role="alert">
          {success}
        </div>
      )}
      
      {/* --- Tabs --- */}
      <div className="mb-6 flex border-b">
        <button className={`flex items-center px-4 py-3 ${activeTab === 'profile' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`} onClick={() => setActiveTab('profile')}>
          <UserIcon size={18} className="mr-2" />
          Profile
        </button>
        <button className={`flex items-center px-4 py-3 ${activeTab === 'secretary' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`} onClick={() => setActiveTab('secretary')}>
          <BellIcon size={18} className="mr-2" />
          AI Secretary
        </button>
        <button className={`flex items-center px-4 py-3 ${activeTab === 'security' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`} onClick={() => setActiveTab('security')}>
          <ShieldIcon size={18} className="mr-2" />
          Security
        </button>
      </div>

      <form onSubmit={handleSave}>
        {/* Profile Settings */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h2 className="text-lg font-medium mb-6">Profile Settings</h2>
            <div className="space-y-4">
              <Input
                label="Name (e.g. ,นภพล)"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />
              {/* ADDED (Case 15): Spelling Field */}
              <Input
                label="Spelling (คำอ่าน)"
                id="spelling"
                placeholder="e.g., นะ-พะ-พน"
                value={spelling}
                onChange={(e) => setSpelling(e.target.value)}
                fullWidth
              />
              <Input
                label="Phone Number"
                id="phone"
                value={user?.owner_number || ''}
                disabled
                fullWidth
                className="bg-gray-100"
              />
              <Input
                label="Email (Optional)"
                id="email"
                type="email"
                placeholder="p.golf@example.com"
                disabled // Assuming email isn't editable for now
                fullWidth
                className="bg-gray-100"
              />
            </div>
          </div>
        )}

        {/* AI Secretary Settings */}
        {activeTab === 'secretary' && (
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h2 className="text-lg font-medium mb-6">AI Secretary Settings</h2>
            <div className="space-y-6">
              {/* MODIFIED (Case 12): Announcement Field */}
              <div>
                <label htmlFor="announcement" className="block text-sm font-medium text-gray-700 mb-1">
                  Active Announcement
                </label>
                <textarea
                  id="announcement"
                  rows={3}
                  className="w-full p-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., ไปต่างประเทศ กลับวันที่ 15 มกร..."
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                />
                {/* ADDED (Case 12): Cancel Button */}
                {announcement && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 text-destructive border-destructive hover:bg-destructive-50"
                    onClick={handleCancelAnnouncement}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Cancelling...' : 'Cancel Announcement'}
                  </Button>
                )}
              </div>
              
              {/* TODO: Add DND / Call Forwarding controls here */}
              
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h2 className="text-lg font-medium mb-6">Security Settings</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium mb-4">Password</h3>
                <Button type="button" onClick={handleChangePassword}>Change Password</Button>
              </div>
              <div className="border-t pt-6">
                <h3 className="text-md font-medium mb-4 text-destructive">
                  Danger Zone
                </h3>
                <Button type="button" variant="outline" className="border-destructive text-destructive hover:bg-destructive-50" onClick={logout}>
                  <LogOutIcon size={18} className="mr-2" />
                  Log Out
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Save Button (Only show if not on Security tab) */}
        {activeTab !== 'security' && (
          <div className="mt-6">
            <Button 
              type="submit" 
              className="w-full md:w-auto"
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <SaveIcon className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};