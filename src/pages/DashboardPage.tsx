// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { StatusCard } from '../components/dashboard/StatusCard';
import { QuickActionsBar } from '../components/dashboard/QuickActionsBar';
import { CallsList } from '../components/dashboard/CallsList';
import { useAuth } from '../context/AuthContext';
import { callsService } from '../services/callsService';
import { CallDisplay, CallLog, CallType } from '../types/call'; // Import updated types
import { BellOffIcon, MessageSquarePlusIcon, PhoneForwardedIcon } from 'lucide-react';

// Helper function (ปรับปรุงเรื่อง recording)
const mapCallLogToDisplay = (call: CallLog): CallDisplay => {
  let displayStatus: CallDisplay['status'] = 'other';

  // Mapping logic based on calltype and processing_status from n8n_call_history
  if (call.processing_status === 'failed') {
    displayStatus = 'failed';
  } else if (call.processing_status === 'processing' || call.processing_status === 'in_progress') {
    displayStatus = 'processing';
  } else if (call.call_type === 'Missed') {
    displayStatus = 'missed';
  } else if (call.call_type === 'Incoming' || call.call_type === 'Outgoing') {
     if (['completed', 'ended', 'scheduled'].includes(call.processing_status || '')) {
       displayStatus = 'answered';
     } else if (call.processing_status === 'declined_spam') {
       displayStatus = 'blocked';
     }
  }

  // *** ตรวจสอบ voice_log ก่อนกำหนดค่า recording ***
  const hasValidRecordingUrl = !!call.voice_log &&
                                (call.voice_log.startsWith('http://') || call.voice_log.startsWith('https://'));

  return {
    id: call.call_id, // Use session_id which is mapped to call_id in backend response
    callerName: call.caller_name || 'Unknown',
    callerNumber: call.caller_phone, // mapped from caller_number
    timestamp: new Date(call.created_at).toLocaleString(), // mapped from datetime
    type: call.call_type, // Direct mapping
    status: displayStatus,
    category: call.category,
    summary: call.summary || undefined, // mapped from sms_summary_th
    recording: hasValidRecordingUrl, // อัปเดตตรงนี้
  };
};


export const DashboardPage: React.FC = () => {
  const {
    user,
    userSettings,
    userState,
    updateUserSettings,
    updateUserState
  } = useAuth();
  const [calls, setCalls] = useState<CallDisplay[]>([]);
  const [timeFilter, setTimeFilter] = useState<string>('today');
  const [isLoading, setIsLoading] = useState(true);

  // Load calls
  useEffect(() => {
    const loadCalls = async () => {
      // Ensure user object and user_id are available
      if (!user?.user_id) {
          console.warn("User ID not available, skipping call load.");
          setIsLoading(false); // Stop loading if no user ID
          return;
      }
      setIsLoading(true);
      try {
        // Pass user.user_id to the service call
        const response = await callsService.getCalls(user.user_id, timeFilter);
        const displayCalls: CallDisplay[] = response.items.map(mapCallLogToDisplay); // Use helper function
        setCalls(displayCalls);
      } catch (error) {
        console.error('Failed to load calls:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCalls();
  }, [user, timeFilter]); // Include user in dependency array


  // --- Handlers for CallItem actions (Keep as examples) ---
  const handleListenRecording = (callId: string) => {
    // Note: The play button was removed from CallItem in the previous step.
    // This function might not be directly used by CallItem now.
    console.log(`Listen recording action triggered for call ${callId}, navigate to detail page.`);
     // Example navigation (if using useNavigate hook from react-router-dom):
    // navigate(`/calls/${callId}`);
  };
  const handleCallback = (callNumber: string) => {
    alert(`Calling back ${callNumber}. (Implement actual call logic)`);
  };
  const handleAddToWhitelist = (callNumber: string) => {
     // TODO: Implement actual API call using contactsService.updateContact
    alert(`Added ${callNumber} to whitelist. (Implement backend update)`);
     // Optimistically update UI or refetch data
  };
  const handleAddToBlacklist = (callNumber: string) => {
     // TODO: Implement actual API call using contactsService.updateContact
    alert(`Added ${callNumber} to blacklist. (Implement backend update)`);
     // Optimistically update UI or refetch data
  };
  // -----------------------------------------------------------


  // --- Handlers for Quick Actions ---
  const handleSetAnnouncement = () => {
    // Check if userSettings is available before accessing its properties
    if (!userSettings) {
        console.error("UserSettings not available");
        alert("Cannot set announcement, settings not loaded.");
        return;
    }
    const message = prompt('Enter your announcement message:', userSettings.announcement || '');
    if (message !== null) { // User didn't cancel the prompt
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Call updateUserSettings from AuthContext
      updateUserSettings({
        announcement: message || null, // Store null if message is empty
        // Reset times if clearing the announcement, or set them if adding one
        announcement_from: message ? now.toISOString() : null,
        announcement_to: message ? tomorrow.toISOString() : null,
      }).then(() => {
         alert('Announcement updated!');
          // updateUserState might be called automatically within updateUserSettings if you implemented it there
          // Or call it manually if needed:
          // updateUserState({ statusMessage: message ? 'Announcement is active' : 'Your AI Secretary is active'});
      }).catch((err) => {
          console.error("Failed to update announcement:", err);
          // Error alert is handled within updateUserSettings in AuthContext
      });
    }
  };

  const handleToggleDND = () => {
    if (!userSettings) {
        console.error("UserSettings not available");
        alert("Cannot toggle DND, settings not loaded.");
        return;
    }
    const newDndActive = !userSettings.dnd_active;
    updateUserSettings({
      dnd_active: newDndActive,
      // Optionally reset dnd times if turning off? Depends on desired logic.
      // dnd_start: newDndActive ? userSettings.dnd_start : null,
      // dnd_end: newDndActive ? userSettings.dnd_end : null,
    }).then(() => {
        alert(`Do Not Disturb ${newDndActive ? 'enabled' : 'disabled'}.`);
        // updateUserState should be handled within updateUserSettings based on new settings
    }).catch((err) => {
         console.error("Failed to toggle DND:", err);
    });
  };

  const handleCallForwarding = () => {
    // Note: Call forwarding state is currently local UI state (userState) in AuthContext
    // It's not saved via updateUserSettings unless UserSettings type is updated
    const number = prompt('Enter the number to forward calls to (leave blank to disable):', userState.forwardingNumber || '');
    if (number !== null) { // User didn't cancel
      const isForwarding = !!number; // True if number is not empty
      updateUserState({ // Update local UI state
        callForwarding: isForwarding,
        forwardingNumber: number || '', // Store empty string if disabled
        // Update status based on forwarding state
        status: isForwarding ? 'away' : 'available',
        statusMessage: isForwarding
          ? `Calls are being forwarded to ${number}`
          : 'Your AI Secretary is active and handling calls'
      });
      alert(`Call forwarding ${isForwarding ? `enabled to ${number}` : 'disabled'}.`);
      // TODO: If call forwarding needs to be saved persistently,
      // you'd need to add corresponding fields to UserSettings and call updateUserSettings here.
    }
  };
  // ------------------------------------

  // Update quickActions based on the latest state/settings
  const quickActions = [
     {
        icon: <MessageSquarePlusIcon size={24} />,
        label: userSettings?.announcement ? 'Edit Announcement' : 'Set Announcement',
        onClick: handleSetAnnouncement,
        color: 'bg-primary/10 border-primary/20 text-primary'
      }, {
        icon: <BellOffIcon size={24} />,
        label: userSettings?.dnd_active ? 'Disable DND' : 'Do Not Disturb',
        onClick: handleToggleDND,
        // Color changes based on DND status
        color: userSettings?.dnd_active ? 'bg-success/10 border-success/20 text-success' : 'bg-error/10 border-error/20 text-error'
      }, {
        icon: <PhoneForwardedIcon size={24} />,
        label: userState.callForwarding ? 'Change Forwarding' : 'Call Forwarding',
        onClick: handleCallForwarding,
         // Color changes based on forwarding status
        color: userState.callForwarding ? 'bg-success/10 border-success/20 text-success' : 'bg-secondary/10 border-secondary/20 text-secondary'
      }
  ];

  return (
     <div className="space-y-6 pb-20 md:pb-6"> {/* Add padding-bottom for mobile nav */}
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {/* StatusCard uses userState from context */}
          <StatusCard
            status={userState.status}
            message={userState.statusMessage}
            duration={userSettings?.dnd_active ? 'Until manually disabled' : undefined} // Example duration display
          />
        </div>
        <div className="lg:col-span-2">
          <h2 className="text-lg font-medium mb-3">Quick Actions</h2>
          {/* QuickActionsBar uses updated quickActions array */}
          <QuickActionsBar actions={quickActions} />
        </div>
      </div>
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Recent Activity</h2>
          <div className="flex items-center">
            <select
              className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm"
              value={timeFilter}
              onChange={e => setTimeFilter(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
        {/* CallsList displays calls fetched in this component */}
        <CallsList
            calls={calls}
            isLoading={isLoading}
            onListenRecording={handleListenRecording} // Pass down handlers
            onCallback={handleCallback}
            onAddToWhitelist={handleAddToWhitelist}
            onAddToBlacklist={handleAddToBlacklist}
          />
      </div>

      {/* Bottom Action Bar for Mobile - Uses handlers directly */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t shadow-lg px-4 py-3 flex justify-around">
         <button className="flex flex-col items-center p-2 text-center" onClick={handleSetAnnouncement}>
          {/* Icon color/style can reflect state */}
          <span className={`w-10 h-10 flex items-center justify-center ${userSettings?.announcement ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'} rounded-full`}>
            <MessageSquarePlusIcon size={20} />
          </span>
          <span className="text-xs mt-1">Announcement</span>
        </button>
        <button className="flex flex-col items-center p-2 text-center" onClick={handleToggleDND}>
           {/* Icon color reflects DND state */}
          <span className={`w-10 h-10 flex items-center justify-center ${userSettings?.dnd_active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'} rounded-full`}>
            <BellOffIcon size={20} />
          </span>
          <span className="text-xs mt-1">DND</span>
        </button>
        <button className="flex flex-col items-center p-2 text-center" onClick={handleCallForwarding}>
          {/* Icon color reflects forwarding state */}
          <span className={`w-10 h-10 flex items-center justify-center ${userState.callForwarding ? 'bg-success/10 text-success' : 'bg-secondary/10 text-secondary'} rounded-full`}>
            <PhoneForwardedIcon size={20} />
          </span>
          <span className="text-xs mt-1">Forward</span>
        </button>
      </div>
    </div>
  );
};