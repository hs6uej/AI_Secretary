// src/pages/DashboardPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusCard } from '../components/dashboard/StatusCard';
import { CallsList } from '../components/dashboard/CallsList';
import { useAuth } from '../context/AuthContext';
import { callsService } from '../services/callsService';
import { CallDisplay, CallLog, AudioData } from '../types/call';
import { 
  BellOffIcon, MessageSquarePlusIcon, PhoneForwardedIcon,
  UserCheckIcon, PhoneMissedIcon, AlertTriangleIcon, RefreshCwIcon 
} from 'lucide-react';

// (Case 11) Audio player instance
let currentAudio: HTMLAudioElement | null = null;

// (Case 11 / Case 9, 8, 5) Helper function to map data for CallItem
const mapCallLogToDisplay = (call: CallLog): CallDisplay => {
   let displayStatus: CallDisplay['status'] = 'other';
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
  const hasValidRecordingUrl = !!call.voice_log;

  return {
    id: call.call_id,
    callerName: call.caller_name || 'Unknown Caller',
    callerNumber: call.caller_phone,
    timestamp: call.created_at,
    type: call.call_type,
    summary: call.summary || null,
    status: displayStatus,
    recordingUrl: hasValidRecordingUrl ? call.voice_log : null,
    contact_status: call.contact_status,
    confidence: call.confidence,
    spam_risk_score: call.spam_risk_score,
    category_description: call.category_description,
  };
};


export const DashboardPage: React.FC = () => {
  const { user, userSettings, userState, updateUserSettings } = useAuth();
  const navigate = useNavigate();
  
  const [recentCalls, setRecentCalls] = useState<CallLog[]>([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);
  const [callsError, setCallsError] = useState<string | null>(null);
  
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isUpdatingQuickAction, setIsUpdatingQuickAction] = useState(false);

  // MODIFIED (Fix Infinite Loop):
  // 1. Define fetchRecentCalls using useCallback, but WITHOUT 'isLoadingCalls' dependency
  const fetchRecentCalls = useCallback(async () => {
    // 2. We use a local loading check to prevent re-entry if already loading
    //    (though useEffect dependency [user] should already handle this)
    
    setIsLoadingCalls(true);
    setCallsError(null);
    setAudioError(null);

    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
      setPlayingCallId(null);
    }

    try {
      // 3. Call service (no userId)
      const response = await callsService.getAllCalls('week', { limit: 5 });
      setRecentCalls(response.items || []);
    } catch (err) {
      console.error('Failed to fetch recent calls:', err);
      setCallsError('Failed to load recent activity.');
    } finally {
      setIsLoadingCalls(false);
    }
  }, []); // <--- Empty dependency array is correct here

  // 4. useEffect depends on 'user' (so it runs on login) and 'fetchRecentCalls'
  useEffect(() => {
    if (user) {
      fetchRecentCalls();
    }
    
    // Cleanup audio on unmount
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
    };
  }, [user, fetchRecentCalls]); // <--- This is now safe

  // Map calls for display (Case 11)
  const displayedCalls = recentCalls.map(mapCallLogToDisplay);
  
  // ADDED (Case 11 / Case 7): Audio playback handler
  const handleListenRecording = async (callId: string) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      currentAudio = null;
    }
    if (playingCallId === callId) {
      setPlayingCallId(null);
      setAudioError(null);
      return;
    }
    setPlayingCallId(callId);
    setAudioError(null);
    try {
      const audioData = await callsService.getCallAudio(callId);
      const audioSrc = `data:${audioData.mimeType};base64,${audioData.data}`;
      currentAudio = new Audio(audioSrc);
      currentAudio.onended = () => {
        setPlayingCallId(null);
        currentAudio = null;
      };
      currentAudio.onerror = () => {
        setAudioError(`Failed to play audio for ${callId}.`);
        setPlayingCallId(null);
        currentAudio = null;
      };
      await currentAudio.play();
    } catch (err) {
      setAudioError('Failed to fetch or play audio.');
      setPlayingCallId(null);
    }
  };

  // (Case 11) Handlers for CallItem
  const handleCallback = (callNumber: string) => window.location.href = `tel:${callNumber}`;
  const handleAddToWhitelist = (callNumber: string) => console.log(`Whitelist: ${callNumber}`); // TODO: Implement
  const handleAddToBlacklist = (callNumber: string) => console.log(`Blacklist: ${callNumber}`); // TODO: Implement

  // --- Quick Actions Handlers (Case 12) ---
  const handleSetAnnouncement = () => {
    navigate('/settings');
  };

  const handleToggleDND = async () => {
    setIsUpdatingQuickAction(true);
    try {
      await updateUserSettings({ dnd_active: !userSettings.dnd_active });
    } catch (e) {
      console.error("Failed to toggle DND", e);
    } finally {
      setIsUpdatingQuickAction(false);
    }
  };

  const handleCallForwarding = () => {
    navigate('/settings'); 
  };

  // (Case 12) Check settings for announcement
  const activeAnnouncement = userSettings?.announcement || null;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Welcome back, {user?.owner_name || 'User'}!
      </h1>

      {/* (Case 12) Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatusCard 
          title="Availability"
          value={userState.status === 'available' ? 'Available' : (userState.status === 'dnd' ? 'DND' : 'Unavailable')}
          description={userState.statusMessage || 'Loading...'}
          icon={<UserCheckIcon />}
          status={userState.status === 'available' ? 'active' : (userState.status === 'dnd' ? 'dnd' : 'inactive')}
        />
        <StatusCard 
          title="Missed Calls (Today)" 
          value="3" // TODO: This should come from an API
          description="View all missed calls" 
          icon={<PhoneMissedIcon />}
          status="warning" 
          linkTo="/calls" 
        />
        <StatusCard 
          title="Spam Blocked (Week)" 
          value="12" // TODO: This should come from an API
          description="See spam statistics" 
          icon={<AlertTriangleIcon />} 
          status="inactive" 
          linkTo="/calls" 
        />
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm border px-4 py-3 flex justify-around mb-6">
         <button 
           className="flex flex-col items-center p-2 text-center" 
           onClick={handleSetAnnouncement}
           disabled={isUpdatingQuickAction}
         >
          <span className={`w-10 h-10 flex items-center justify-center ${activeAnnouncement ? 'bg-yellow-100 text-yellow-600' : 'bg-primary-100 text-primary'} rounded-full`}>
            <MessageSquarePlusIcon size={20} />
          </span>
          <span className="text-xs mt-1">Announcement</span>
        </button>
        <button 
          className="flex flex-col items-center p-2 text-center" 
          onClick={handleToggleDND}
          disabled={isUpdatingQuickAction}
        >
          <span className={`w-10 h-10 flex items-center justify-center ${userSettings.dnd_active ? 'bg-destructive-100 text-destructive' : 'bg-gray-100 text-gray-600'} rounded-full`}>
            <BellOffIcon size={20} />
          </span>
          <span className="text-xs mt-1">DND</span>
        </button>
        <button 
          className="flex flex-col items-center p-2 text-center" 
          onClick={handleCallForwarding}
          disabled={isUpdatingQuickAction}
        >
          <span className={`w-10 h-10 flex items-center justify-center ${userState.callForwarding ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'} rounded-full`}>
            <PhoneForwardedIcon size={20} />
          </span>
          <span className="text-xs mt-1">Forwarding</span>
        </button>
      </div>
      
      {/* Audio Error Display (Case 11) */}
      {audioError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative my-4" role="alert">
          <AlertTriangleIcon className="inline w-5 h-5 mr-2" />
          <strong className="font-bold">Audio Error: </strong>
          <span className="block sm:inline">{audioError}</span>
        </div>
      )}

      {/* MODIFIED (Case 11): Recent Activity List */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <Link to="/calls" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        
        {callsError && (
          <div className="text-destructive p-4 bg-red-50 rounded-md">{callsError}</div>
        )}

        {/* Use the CallsList component and pass audio handlers */}
        <CallsList
          calls={displayedCalls}
          isLoading={isLoadingCalls}
          onListenRecording={handleListenRecording}
          playingCallId={playingCallId}
          onCallback={handleCallback}
          onAddToWhitelist={handleAddToWhitelist}
          onAddToBlacklist={handleAddToBlacklist}
        />
      </div>
    </div>
  );
};