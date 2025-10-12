import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { UserIcon, BellIcon, PhoneIcon, MessageSquareIcon, ShieldIcon, LogOutIcon } from 'lucide-react';
export const SettingsPage: React.FC = () => {
  const {
    user,
    logout,
    userSettings,
    updateUserSettings
  } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'secretary' | 'security'>('profile');
  // Initialize with safe default values
  const [profileForm, setProfileForm] = useState({
    name: user?.owner_name || '',
    email: '',
    phoneNumber: user?.owner_number || ''
  });
  const [secretaryForm, setSecretaryForm] = useState({
    voicemailEnabled: userSettings?.voicemailEnabled || false,
    announcementEnabled: userSettings?.announcementEnabled || false,
    announcementMessage: userSettings?.announcementMessage || '',
    callForwarding: userSettings?.callForwarding || false,
    forwardingNumber: userSettings?.forwardingNumber || ''
  });
  const handleProfileSave = () => {
    // In a real app, this would update the user profile via an API call
    alert('Profile updated! (This would save to the server in a real app)');
  };
  const handleSecretarySave = () => {
    if (updateUserSettings) {
      updateUserSettings({
        voicemailEnabled: secretaryForm.voicemailEnabled,
        announcementEnabled: secretaryForm.announcementEnabled,
        announcementMessage: secretaryForm.announcementMessage,
        callForwarding: secretaryForm.callForwarding,
        forwardingNumber: secretaryForm.forwardingNumber
      });
      alert('Secretary settings updated!');
    }
  };
  const handleChangePassword = () => {
    // In a real app, this would initiate a password change flow
    alert('Password change functionality would be implemented here in a real app');
  };
  return <div>
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button className={`py-2 px-4 font-medium ${activeTab === 'profile' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`} onClick={() => setActiveTab('profile')}>
          <span className="flex items-center">
            <UserIcon size={18} className="mr-2" />
            Profile
          </span>
        </button>
        <button className={`py-2 px-4 font-medium ${activeTab === 'secretary' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`} onClick={() => setActiveTab('secretary')}>
          <span className="flex items-center">
            <PhoneIcon size={18} className="mr-2" />
            AI Secretary
          </span>
        </button>
        <button className={`py-2 px-4 font-medium ${activeTab === 'security' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`} onClick={() => setActiveTab('security')}>
          <span className="flex items-center">
            <ShieldIcon size={18} className="mr-2" />
            Security
          </span>
        </button>
      </div>
      {/* Profile Settings */}
      {activeTab === 'profile' && <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-6">Profile Settings</h2>
          <div className="flex flex-col md:flex-row items-start mb-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4 md:mb-0 md:mr-6">
              {user?.avatar ? <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" /> : <UserIcon size={36} className="text-gray-500" />}
            </div>
            <div className="flex-1">
              <Button size="sm" className="mb-2">
                Upload Photo
              </Button>
              <p className="text-sm text-gray-500">JPG or PNG. Max size 2MB.</p>
            </div>
          </div>
          <div className="space-y-4">
            <Input label="Name" value={profileForm.name} onChange={e => setProfileForm({
          ...profileForm,
          name: e.target.value
        })} fullWidth />
            <Input label="Email" type="email" value={profileForm.email} onChange={e => setProfileForm({
          ...profileForm,
          email: e.target.value
        })} fullWidth />
            <Input label="Phone Number" value={profileForm.phoneNumber} disabled helpText="Phone number cannot be changed" fullWidth />
            <div className="pt-4">
              <Button onClick={handleProfileSave}>Save Changes</Button>
            </div>
          </div>
        </div>}
      {/* AI Secretary Settings */}
      {activeTab === 'secretary' && <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-6">AI Secretary Settings</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-medium mb-2 flex items-center">
                <BellIcon size={18} className="mr-2 text-primary" />
                Notifications & Voicemail
              </h3>
              <div className="pl-7 space-y-4">
                <label className="flex items-center">
                  <input type="checkbox" checked={secretaryForm.voicemailEnabled} onChange={e => setSecretaryForm({
                ...secretaryForm,
                voicemailEnabled: e.target.checked
              })} className="mr-2 h-4 w-4" />
                  <span>Enable voicemail for missed calls</span>
                </label>
              </div>
            </div>
            <div>
              <h3 className="text-md font-medium mb-2 flex items-center">
                <MessageSquareIcon size={18} className="mr-2 text-primary" />
                Announcements
              </h3>
              <div className="pl-7 space-y-4">
                <label className="flex items-center">
                  <input type="checkbox" checked={secretaryForm.announcementEnabled} onChange={e => setSecretaryForm({
                ...secretaryForm,
                announcementEnabled: e.target.checked
              })} className="mr-2 h-4 w-4" />
                  <span>Play announcement for callers</span>
                </label>
                {secretaryForm.announcementEnabled && <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Announcement Message
                    </label>
                    <textarea className="w-full rounded-lg border border-gray-300 p-3" rows={3} value={secretaryForm.announcementMessage} onChange={e => setSecretaryForm({
                ...secretaryForm,
                announcementMessage: e.target.value
              })} placeholder="Enter your announcement message here..." />
                  </div>}
              </div>
            </div>
            <div>
              <h3 className="text-md font-medium mb-2 flex items-center">
                <PhoneIcon size={18} className="mr-2 text-primary" />
                Call Forwarding
              </h3>
              <div className="pl-7 space-y-4">
                <label className="flex items-center">
                  <input type="checkbox" checked={secretaryForm.callForwarding} onChange={e => setSecretaryForm({
                ...secretaryForm,
                callForwarding: e.target.checked
              })} className="mr-2 h-4 w-4" />
                  <span>Enable call forwarding</span>
                </label>
                {secretaryForm.callForwarding && <Input label="Forward calls to" value={secretaryForm.forwardingNumber} onChange={e => setSecretaryForm({
              ...secretaryForm,
              forwardingNumber: e.target.value
            })} placeholder="Enter phone number" />}
              </div>
            </div>
            <div className="pt-4">
              <Button onClick={handleSecretarySave}>Save Settings</Button>
            </div>
          </div>
        </div>}
      {/* Security Settings */}
      {activeTab === 'security' && <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-6">Security Settings</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-medium mb-4">Password</h3>
              <Button onClick={handleChangePassword}>Change Password</Button>
            </div>
            <div className="border-t pt-6">
              <h3 className="text-md font-medium mb-4 text-error">
                Danger Zone
              </h3>
              <Button variant="outline" className="border-error text-error hover:bg-error/10" onClick={logout}>
                <LogOutIcon size={18} className="mr-2" />
                Log Out
              </Button>
            </div>
          </div>
        </div>}
    </div>;
};