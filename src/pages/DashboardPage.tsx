// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { StatusCard } from '../components/dashboard/StatusCard';
import { QuickActionsBar } from '../components/dashboard/QuickActionsBar';
import { CallsList } from '../components/dashboard/CallsList';
import { useAuth } from '../context/AuthContext';
import { callsService } from '../services/callsService';
import { CallDisplay, CallLog, CallType } from '../types/call'; // Import updated types
import { BellOffIcon, MessageSquarePlusIcon, PhoneForwardedIcon } from 'lucide-react';

// Helper function to map CallLog to CallDisplay
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
    // Assuming 'completed', 'ended', 'scheduled' mean it was handled/answered in some way
     if (['completed', 'ended', 'scheduled'].includes(call.processing_status || '')) {
       displayStatus = 'answered';
     } else if (call.processing_status === 'declined_spam') {
       displayStatus = 'blocked';
     }
     // Add more specific conditions if needed based on call_outcome etc.
     // e.g. map certain outcomes to 'voicemail'
  }
  // Default 'other' or could add more logic

  return {
    id: call.call_id, // Use session_id which is mapped to call_id in backend response
    callerName: call.caller_name || 'Unknown',
    callerNumber: call.caller_phone, // mapped from caller_number
    timestamp: new Date(call.created_at).toLocaleString(), // mapped from datetime
    type: call.call_type, // Direct mapping
    status: displayStatus,
    category: call.category,
    summary: call.summary || undefined, // mapped from sms_summary_th
    recording: true // Keep assumption or fetch real data if available
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
      if (!user) return;
      setIsLoading(true);
      try {
        // Use callsService.getCalls which now returns { items: CallLog[], next_cursor: string | null }
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
  }, [user, timeFilter]);


  const handleListenRecording = (callId: string) => {
    alert(`Playing recording for call ${callId}. (Functionality not available in n8n schema)`);
  };
  const handleCallback = (callNumber: string) => {
    alert(`Calling back ${callNumber}. (This would initiate a real call in a production app)`);
  };
  const handleAddToWhitelist = (callNumber: string) => {
    alert(`Added ${callNumber} to whitelist. (This would update the whitelist in a real app)`);
  };
  const handleAddToBlacklist = (callNumber: string) => {
    alert(`Added ${callNumber} to blacklist. (This would update the blacklist in a real app)`);
  };

  // Rest of the component handlers (handleSetAnnouncement, handleToggleDND, handleCallForwarding) remain the same
  // ... (Keep existing handlers)
  const handleSetAnnouncement = () => {
    if (!userSettings) return;
    const message = prompt('Enter your announcement message:', userSettings.announcement || '');
    if (message !== null) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      updateUserSettings({
        announcement: message,
        announcement_from: now.toISOString(),
        announcement_to: tomorrow.toISOString()
      });
      updateUserState({
        statusMessage: message ? 'Announcement is active' : 'Your AI Secretary is active and handling calls'
      });
      alert('Announcement has been set!');
    }
  };
  const handleToggleDND = () => {
    if (!userSettings) return;
    const newDndActive = !userSettings.dnd_active;
    updateUserSettings({
      dnd_active: newDndActive
    });
    updateUserState({
      status: newDndActive ? 'dnd' : 'available',
      statusMessage: newDndActive ? 'Do Not Disturb mode is active' : 'Your AI Secretary is active and handling calls'
    });
  };
  const handleCallForwarding = () => {
    const number = prompt('Enter the number to forward calls to:', userState.forwardingNumber || '');
    if (number !== null) {
      updateUserState({
        callForwarding: !!number,
        forwardingNumber: number,
        status: number ? 'away' : 'available',
        statusMessage: number ? `Calls are being forwarded to ${number}` : 'Your AI Secretary is active and handling calls'
      });
      if (number) {
        alert(`Call forwarding enabled to ${number}`);
      } else {
        alert('Call forwarding disabled');
      }
    }
  };

  const quickActions = [
      // ... (Keep existing quick actions structure, labels might need slight adjustment based on UserSettings)
     {
        icon: <MessageSquarePlusIcon size={24} />,
        label: userSettings?.announcement ? 'Edit Announcement' : 'Set Announcement',
        onClick: handleSetAnnouncement,
        color: 'bg-primary/10 border-primary/20 text-primary'
      }, {
        icon: <BellOffIcon size={24} />,
        label: userSettings?.dnd_active ? 'Disable DND' : 'Do Not Disturb',
        onClick: handleToggleDND,
        color: userSettings?.dnd_active ? 'bg-success/10 border-success/20 text-success' : 'bg-error/10 border-error/20 text-error'
      }, {
        icon: <PhoneForwardedIcon size={24} />,
        label: userState.callForwarding ? 'Change Forwarding' : 'Call Forwarding',
        onClick: handleCallForwarding,
        color: userState.callForwarding ? 'bg-success/10 border-success/20 text-success' : 'bg-secondary/10 border-secondary/20 text-secondary'
      }
  ];

  return (
      // ... (Keep existing JSX structure, CallsList will receive updated `calls` data)
     <div className="space-y-6">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <StatusCard status={userState.status} message={userState.statusMessage} duration={userSettings?.dnd_active ? 'Until manually disabled' : undefined} />
        </div>
        <div className="lg:col-span-2">
          <h2 className="text-lg font-medium mb-3">Quick Actions</h2>
          <QuickActionsBar actions={quickActions} />
        </div>
      </div>
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Recent Activity</h2>
          <div className="flex items-center">
            <select className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm" value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              {/* Added 'all' option based on callsService */}
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
        <CallsList
            calls={calls}
            isLoading={isLoading}
            onListenRecording={handleListenRecording}
            onCallback={handleCallback}
            onAddToWhitelist={handleAddToWhitelist}
            onAddToBlacklist={handleAddToBlacklist}
          />
      </div>
       {/* Bottom Action Bar for Mobile - Keep as is */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t shadow-lg px-4 py-3 flex justify-around">
         {/* ... buttons ... */}
         <button className="flex flex-col items-center p-2" onClick={handleSetAnnouncement}>
          <span className={`w-10 h-10 flex items-center justify-center ${userSettings?.announcement ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'} rounded-full`}>
            <MessageSquarePlusIcon size={20} />
          </span>
          <span className="text-xs mt-1">Announcement</span>
        </button>
        <button className="flex flex-col items-center p-2" onClick={handleToggleDND}>
          <span className={`w-10 h-10 flex items-center justify-center ${userSettings?.dnd_active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'} rounded-full`}>
            <BellOffIcon size={20} />
          </span>
          <span className="text-xs mt-1">DND</span>
        </button>
        <button className="flex flex-col items-center p-2" onClick={handleCallForwarding}>
          <span className={`w-10 h-10 flex items-center justify-center ${userState.callForwarding ? 'bg-success/10 text-success' : 'bg-secondary/10 text-secondary'} rounded-full`}>
            <PhoneForwardedIcon size={20} />
          </span>
          <span className="text-xs mt-1">Forward</span>
        </button>
      </div>
    </div>
  );
};