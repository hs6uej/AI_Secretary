// src/pages/SettingsPage.tsx (FIXED: Added DND controls)
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { 
  UserIcon, BellIcon, ShieldIcon, LogOutIcon, 
  SaveIcon, RefreshCwIcon, AlertTriangleIcon, ClockIcon 
} from 'lucide-react';
import { UpdateSettingsData } from '../services/settingsService';

// --- ADDED: Import useLocation ---
import { useLocation } from 'react-router-dom';

// --- ADDED: Toggle Switch Component (สำหรับ DND) ---
const ToggleSwitch: React.FC<{
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  srLabel: string;
}> = ({ enabled, onChange, srLabel }) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
        enabled ? 'bg-primary' : 'bg-gray-200'
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span className="sr-only">{srLabel}</span>
      <span
        aria-hidden="true"
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
};
// --- END ADDED ---


export const SettingsPage: React.FC = () => {
  const {
    user,
    logout,
    userSettings,
    updateUserSettings,
  } = useAuth();
  
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'profile' | 'secretary' | 'security'>('profile');
  
  // --- Form States ---
  const [name, setName] = useState('');
  const [spelling, setSpelling] = useState(''); 
  const [announcement, setAnnouncement] = useState(''); 
  
  // --- ADDED: DND States ---
  const [fDnd, setFDnd] = useState(false);
  const [fDndStart, setFDndStart] = useState('22:00');
  const [fDndEnd, setFDndEnd] = useState('07:00');
  
  // --- General States ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // useEffect (อ่าน Hash URL)
  useEffect(() => {
    const hash = location.hash.replace('#', ''); 
    if (hash === 'secretary' || hash === 'ai_secretary') {
      setActiveTab('secretary');
    } else if (hash === 'security') {
      setActiveTab('security');
    } else {
      setActiveTab('profile'); 
    }
  }, [location.hash]); 

  // --- MODIFIED: Load initial data (เพิ่ม DND) ---
  useEffect(() => {
    if (user) {
      setName(user.owner_name || '');
      setSpelling(user.owner_name_spelling || ''); 
    }
    if (userSettings) {
      setAnnouncement(userSettings.announcement || ''); 
      
      // Load DND settings from context (ที่ตอนนี้ดึงมาจาก DB ถูกต้องแล้ว)
      setFDnd(userSettings.dnd_active || false);
      setFDndStart(userSettings.dnd_start || '22:00');
      setFDndEnd(userSettings.dnd_end || '07:00');
    }
  }, [user, userSettings]);

  // --- MODIFIED: Combined Save Handler (เพิ่ม DND) ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // รวบรวมข้อมูลทั้งหมดที่จะส่ง
    const updateData: UpdateSettingsData = {
      owner_name: name,
      owner_name_spelling: spelling,
      announcement: announcement,
      
      // ส่งข้อมูล DND
      dnd_active: fDnd,
      dnd_start: fDnd ? fDndStart : null, // ส่งค่าเวลาต่อเมื่อ DND เปิด
      dnd_end: fDnd ? fDndEnd : null,
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
  
  // Handler (Cancel Announcement)
  const handleCancelAnnouncement = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // ส่งเฉพาะ announcement: null
      await updateUserSettings({ announcement: null });
      setAnnouncement(''); 
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
            {/* ... (ส่วน Profile เหมือนเดิม) ... */}
            <h2 className="text-lg font-medium mb-6">Profile Settings</h2>
            <div className="space-y-4">
              <Input
                label="Name (e.g. ,นภพล)"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />
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
                placeholder="napaphon@example.com"
                disabled 
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
              {/* Announcement Field */}
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
              
              {/* --- ADDED: DND Controls --- */}
              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Do Not Disturb (DND)</span>
                    <span className="text-xs text-gray-500">Silence all calls during specific hours.</span>
                  </span>
                  <ToggleSwitch
                    enabled={fDnd}
                    onChange={setFDnd}
                    srLabel="Toggle Do Not Disturb"
                  />
                </div>

                {/* Show time inputs only if DND is enabled */}
                {fDnd && (
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        label="Start Time"
                        id="dnd_start"
                        type="time" 
                        value={fDndStart} 
                        onChange={e => setFDndStart(e.target.value)} 
                        leftIcon={<ClockIcon size={16} className="text-gray-500" />}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        label="End Time"
                        id="dnd_end"
                        type="time" 
                        value={fDndEnd} 
                        onChange={e => setFDndEnd(e.target.value)} 
                        leftIcon={<ClockIcon size={16} className="text-gray-500" />}
                      />
                    </div>
                  </div>
                )}
              </div>
              {/* --- END ADDED --- */}
              
              {/* TODO: Add Call Forwarding controls here */}
              
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-lg shadow-sm p-6 border">
             {/* ... (ส่วน Security เหมือนเดิม) ... */}
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