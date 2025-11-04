// src/pages/CallsPage.tsx (FIXED: Corrected Race Condition Logic)
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { callsService } from '../services/callsService';
import { CallsList } from '../components/dashboard/CallsList';
import { CallDisplay, CallLog, CallType } from '../types/call';
import { SearchIcon, AlertTriangleIcon } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { useSearchParams } from 'react-router-dom';

// (Helper function mapCallLogToDisplay - ไม่เปลี่ยนแปลง)
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

let currentAudio: HTMLAudioElement | null = null;

type StatusFilterType = 'all' | 'missed' | 'blocked' | 'answered' | 'processing' | 'other' | 'failed';

export const CallsPage: React.FC = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('week');

  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');

  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const isLoadingAudio = useRef(false);

  const fetchCalls = useCallback(async (filter: string, reset = false) => {
    setIsLoading(true);
    setError(null);
    setAudioError(null);

    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
      setPlayingCallId(null);
    }
    
    isLoadingAudio.current = false;

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

  useEffect(() => {
    if (user) {
      fetchCalls(timeFilter, true);
    }
  }, [user, timeFilter, fetchCalls]);

  useEffect(() => {
    const filterFromUrl = searchParams.get('filter');
    if (filterFromUrl === 'missed') {
      setStatusFilter('missed');
    } else if (filterFromUrl === 'spam') {
      setStatusFilter('blocked');
    }
  }, [searchParams]);


  const filteredCalls = calls
    .map(mapCallLogToDisplay)
    .filter(call => {
      const statusMatch = (statusFilter === 'all') || (call.status === statusFilter);
      const searchMatch =
        call.callerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.callerNumber.includes(searchTerm) ||
        (call.summary && call.summary.toLowerCase().includes(searchTerm.toLowerCase()));
      return statusMatch && searchMatch;
    });


  // --- (MODIFIED) นี่คือ Logic ที่ถูกต้อง ---
  const handleListenRecording = async (callId: string) => {

    // 1. ตรวจสอบก่อนว่า "กำลังกดปุ่มหยุด" หรือไม่
    // (เช็ค state playingCallId)
    if (playingCallId === callId) {
      console.log('Stopping audio (already playing)...');
      
      // ไม่ว่าเสียงจะกำลังโหลด (busy) หรือกำลังเล่น
      // เราจะหยุดมัน และปลด lock
      if (currentAudio) {
          currentAudio.pause();
          currentAudio.src = '';
          currentAudio = null;
      }
      setPlayingCallId(null);
      setAudioError(null);
      isLoadingAudio.current = false; // บังคับปลด lock
      return;
    }
    
    // 2. ถ้ากดปุ่มใหม่ ในขณะที่ "กำลังโหลด" (busy) เสียงอื่นอยู่
    // (เช็ค ref isLoadingAudio)
    if (isLoadingAudio.current) {
        console.warn('Audio is busy, please wait.');
        return;
    }

    // 3. ถ้ากดปุ่มใหม่ ในขณะที่เสียงอื่น "กำลังเล่น" (แต่ไม่ busy)
    // ให้หยุดเสียงเก่าก่อน
    if (currentAudio) {
        console.log('Stopping previous audio...');
        currentAudio.pause();
        currentAudio.src = '';
        currentAudio = null;
        // ไม่ต้องตั้ง lock เพราะเราไม่ได้ await
    }

    // 4. ถ้ามาถึงตรงนี้ คือการ "เริ่มเล่นเสียงใหม่"
    console.log('Starting new audio...');
    isLoadingAudio.current = true; // <-- ตั้ง LOCK
    setPlayingCallId(callId);     // อัปเดต UI
    setAudioError(null);

    try {
        const audioData = await callsService.getCallAudio(callId);

        // 5. (Safety check) ตรวจสอบว่าผู้ใช้กดยกเลิก (ปุ่มหยุด)
        // ในระหว่างที่เรากำลัง fetch ข้อมูลหรือไม่
        if (isLoadingAudio.current === false) {
             console.warn('Audio request was cancelled during fetch.');
             return;
        }

        const audioSrc = `data:${audioData.mimeType};base64,${audioData.data}`;
        currentAudio = new Audio(audioSrc);

        currentAudio.onended = () => {
            console.log('Audio finished playing.');
            // เช็คว่า ID ที่เล่นจบ คือ ID ที่ state ถืออยู่หรือไม่
            // (ป้องกันกรณีผู้ใช้กดปุ่มอื่นรัวๆ)
            if (playingCallId === callId) {
               setPlayingCallId(null);
            }
            currentAudio = null;
            isLoadingAudio.current = false; // <-- ปลด LOCK
        };

        currentAudio.onerror = (e) => {
            console.error('Audio playback error', e);
            if (playingCallId === callId) {
               setAudioError(`Failed to play audio for ${callId}.`);
               setPlayingCallId(null);
            }
            currentAudio = null;
            isLoadingAudio.current = false; // <-- ปลด LOCK
        };

        // เริ่มเล่น
        await currentAudio.play();
        
        // 6. [สำคัญ] เราจะไม่ปลด lock ตรงนี้
        // Lock จะถูกปลดโดย onended หรือ onerror เท่านั้น

    } catch (err) {
        console.error('Failed to fetch audio:', err);
        setAudioError('Failed to fetch or play audio.');
        setPlayingCallId(null);
        currentAudio = null;
        isLoadingAudio.current = false; // <-- ปลด LOCK (กรณี fetch พลาด)
    }
  };
  // --- จบการแก้ไข ---


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

      {/* Filter Bar (ไม่เปลี่ยนแปลง) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <Input
          placeholder="Search name, number, summary..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          leftIcon={<SearchIcon size={18} className="text-gray-500" />}
          className="md:max-w-xs"
          fullWidth
        />
        
        <div className="flex items-center gap-4">
          
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

      </div>
      
      {/* CallsList (ไม่เปลี่ยนแปลง) */}
      <CallsList
        calls={filteredCalls}
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