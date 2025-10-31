// src/pages/CallsPage.tsx
import React, { useEffect, useState, useCallback } from 'react'; // ADDED useCallback
import { useAuth } from '../context/AuthContext';
import { callsService } from '../services/callsService';
import { CallsList } from '../components/dashboard/CallsList';
import { CallDisplay, CallLog, CallType } from '../types/call'; // Import updated types
import { SearchIcon, AlertTriangleIcon } from 'lucide-react'; // ADDED AlertTriangleIcon
import { Input } from '../components/ui/Input';

// MODIFIED (Case 5, 7, 8, 9): อัปเดต Helper function
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

  // MODIFIED (Case 7): แก้บั๊กปุ่ม Play หาย
  // เปลี่ยนจาก call.tts_response เป็น call.voice_log
  const hasValidRecordingUrl = !!call.voice_log; 

  return {
    id: call.call_id, // Use session_id
    callerName: call.caller_name || 'Unknown Caller',
    callerNumber: call.caller_phone,
    timestamp: call.created_at,
    type: call.call_type,
    summary: call.summary || null,
    status: displayStatus,
    // MODIFIED (Case 7): map 'voice_log' ไปยัง 'recordingUrl'
    recordingUrl: hasValidRecordingUrl ? call.voice_log : null, 
    
    // ADDED (Case 5, 8, 9): Pass additional data
    contact_status: call.contact_status,
    confidence: call.confidence,
    spam_risk_score: call.spam_risk_score,
    category_description: call.category_description,
  };
};

// ADDED (Case 7): Audio player instance
let currentAudio: HTMLAudioElement | null = null;

export const CallsPage: React.FC = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('week'); // Default filter

  // ADDED (Case 7): State for audio playback
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  // MODIFIED (Fix Infinite Loop):
  // 1. useCallback ห้าม depend on 'isLoading'
  const fetchCalls = useCallback(async (filter: string, reset = false) => {
    setIsLoading(true);
    setError(null);
    setAudioError(null); // Clear audio error on new fetch

    // Stop audio on fetch
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
      setPlayingCallId(null);
    }
    
    try {
      // 2. MODIFIED: ลบ user.user_id ออกจาก (Fixes the loop)
      const response = await callsService.getAllCalls(filter, { limit: 50 });
      setCalls(response.items || []);
    } catch (err) {
      console.error('Failed to fetch calls:', err);
      setError('Failed to load call history.');
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array is correct

  // 3. MODIFIED: useEffect ต้อง depend on 'user' (เผื่อ login) และ 'timeFilter'
  useEffect(() => {
    if (user) { // Only fetch if user is loaded
      fetchCalls(timeFilter, true);
    }
  }, [user, timeFilter, fetchCalls]); // This is now safe
  
  // Filter calls based on search term
  const filteredCalls = calls
    .map(mapCallLogToDisplay)
    .filter(call =>
      call.callerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.callerNumber.includes(searchTerm) ||
      (call.summary && call.summary.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  // --- Handlers ---

  // MODIFIED (Case 1, 7): Implement audio playback
  const handleListenRecording = async (callId: string) => {
    // Stop currently playing audio if any
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = ''; // Release resource
      currentAudio = null;
    }

    // If clicking the same call that is playing, stop it
    if (playingCallId === callId) {
      setPlayingCallId(null);
      setAudioError(null);
      return;
    }

    // Start playing new audio
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
        console.error('Audio playback error');
        setAudioError(`Failed to play audio for ${callId}.`);
        setPlayingCallId(null);
        currentAudio = null;
      };

      await currentAudio.play();

    } catch (err) {
      console.error('Failed to play audio:', err);
      setAudioError('Failed to fetch or play audio.');
      setPlayingCallId(null);
    }
  };

  const handleCallback = (callNumber: string) => {
    console.log(`Calling back ${callNumber}...`);
    window.location.href = `tel:${callNumber}`;
  };

  const handleAddToWhitelist = (callNumber: string) => {
    // TODO: Implement
    console.log(`Adding ${callNumber} to whitelist...`);
  };

  const handleAddToBlacklist = (callNumber: string) => {
    // TODO: Implement
    console.log(`Adding ${callNumber} to blacklist...`);
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-4">Call Logs</h1>

      {/* ADDED (Case 7): Audio Error Display */}
      {audioError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4" role="alert">
          <AlertTriangleIcon className="inline w-5 h-5 mr-2" />
          <strong className="font-bold">Audio Error: </strong>
          <span className="block sm:inline">{audioError}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <Input
          placeholder="Search name, number, summary..." // Update placeholder
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          leftIcon={<SearchIcon size={18} className="text-gray-500" />}
          className="md:max-w-xs"
          fullWidth
        />
        <div className="flex items-center">
          <label className="mr-2 text-sm font-medium">Time Period:</label>
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
      <CallsList
        calls={filteredCalls} // Display filtered calls
        isLoading={isLoading}
        // MODIFIED: Pass new props down to CallItem
        onListenRecording={handleListenRecording} 
        playingCallId={playingCallId} // (Case 7)
        onCallback={handleCallback}
        onAddToWhitelist={handleAddToWhitelist}
        onAddToBlacklist={handleAddToBlacklist}
        // TODO: Add onNextPage when pagination is implemented
      />
    </div>
  );
};