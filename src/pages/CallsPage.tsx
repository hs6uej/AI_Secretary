// src/pages/CallsPage.tsx (MODIFIED)
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { callsService } from '../services/callsService';
import { CallsList } from '../components/dashboard/CallsList';
import { CallDisplay, CallLog, CallType } from '../types/call'; 
import { SearchIcon, AlertTriangleIcon } from 'lucide-react'; 
import { Input } from '../components/ui/Input';

// --- ADDED: Import hook สำหรับอ่าน URL Params ---
import { useSearchParams } from 'react-router-dom';

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

// ADDED (Case 7): Audio player instance
let currentAudio: HTMLAudioElement | null = null;

// --- ADDED: ประเภทของ Status Filter ---
type StatusFilterType = 'all' | 'missed' | 'blocked' | 'answered' | 'processing' | 'other' | 'failed';

export const CallsPage: React.FC = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('week');

  // --- ADDED: Hook และ State สำหรับ Status Filter ---
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');

  // ADDED (Case 7): State for audio playback
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  // MODIFIED (Fix Infinite Loop):
  const fetchCalls = useCallback(async (filter: string, reset = false) => {
    setIsLoading(true);
    setError(null);
    setAudioError(null); 

    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
      setPlayingCallId(null);
    }
    
    try {
      const response = await callsService.getAllCalls(filter, { limit: 50 });
      setCalls(response.items || []);
    } catch (err) {
      console.error('Failed to fetch calls:', err);
      setError('Failed to load call history.');
    } finally {
      setIsLoading(false);
    }
  }, []); 

  // useEffect สำหรับดึงข้อมูล (เหมือนเดิม)
  useEffect(() => {
    if (user) { 
      fetchCalls(timeFilter, true);
    }
  }, [user, timeFilter, fetchCalls]);
  
  // --- ADDED: useEffect ใหม่ สำหรับอ่าน Filter จาก URL ---
  useEffect(() => {
    const filterFromUrl = searchParams.get('filter');
    if (filterFromUrl === 'missed') {
      setStatusFilter('missed');
    } else if (filterFromUrl === 'spam') {
      setStatusFilter('blocked'); // 'blocked' คือ status ที่เรา map ไว้สำหรับ spam
    }
  }, [searchParams]);
  // --- END ADDED ---

  
  // --- MODIFIED: แก้ไข Logic การกรอง (Frontend) ---
  const filteredCalls = calls
    .map(mapCallLogToDisplay)
    .filter(call => {
      // 1. ตรวจสอบ Status Filter
      const statusMatch = (statusFilter === 'all') || (call.status === statusFilter);

      // 2. ตรวจสอบ Search Term
      const searchMatch =
        call.callerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.callerNumber.includes(searchTerm) ||
        (call.summary && call.summary.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return statusMatch && searchMatch; // ต้องตรงทั้ง 2 เงื่อนไข
    });
  // --- END MODIFIED ---


  // --- Handlers (เหมือนเดิม) ---
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
    console.log(`Adding ${callNumber} to whitelist...`);
  };

  const handleAddToBlacklist = (callNumber: string) => {
    console.log(`Adding ${callNumber} to blacklist...`);
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-4">Call Logs</h1>

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
          placeholder="Search name, number, summary..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          leftIcon={<SearchIcon size={18} className="text-gray-500" />}
          className="md:max-w-xs"
          fullWidth
        />
        
        {/* --- MODIFIED: หุ้ม Dropdowns ด้วย flex --- */}
        <div className="flex items-center gap-4">
          
          {/* --- ADDED: Status Filter Dropdown --- */}
          <div className="flex items-center">
            <label className="mr-2 text-sm font-medium">Status:</label>
            <select
              className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusFilterType)}
            >
              <option value="all">All Status</option>
              <option value="missed">Missed</option>
              <option value="blocked">Spam Blocked</option>
              <option value="answered">Answered</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Time Filter (เดิม) */}
          <div className="flex items-center">
            <label className="mr-2 text-sm font-medium">Time:</label>
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
        {/* --- END MODIFIED --- */}

      </div>
      <CallsList
        calls={filteredCalls} // Display filtered calls
        isLoading={isLoading}
        onListenRecording={handleListenRecording} 
        playingCallId={playingCallId} 
        onCallback={handleCallback}
        onAddToWhitelist={handleAddToWhitelist}
        onAddToBlacklist={handleAddToBlacklist}
      />
    </div>
  );
};