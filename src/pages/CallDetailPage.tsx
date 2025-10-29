// src/pages/CallDetailPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { callsService } from '../services/callsService';
import { CallLog, CallSegment, CallType } from '../types/call';
import { ArrowLeftIcon, PhoneIncomingIcon, PhoneOutgoingIcon, PhoneMissedIcon, UserIcon, UserPlusIcon, UserMinusIcon, PlayIcon, PauseIcon, ClockIcon, TagIcon, InfoIcon, BotIcon, MessageSquareIcon, Volume2Icon, VolumeXIcon, RotateCcwIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../services/api';

// --- Helper Function to format time (seconds to MM:SS) ---
const formatTime = (timeInSeconds: number | undefined): string => {
  if (timeInSeconds === undefined || isNaN(timeInSeconds)) {
    return '00:00';
  }
  const totalSeconds = Math.floor(timeInSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
// -----------------------------------------------------------


export const CallDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string; }>();
  const { user } = useAuth();
  const [call, setCall] = useState<CallLog | null>(null);
  const [segments, setSegments] = useState<CallSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Loading for call details
  const [isPlaying, setIsPlaying] = useState(false); // Playback state
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null); // State to store Base64 Data URI
  const [isAudioLoading, setIsAudioLoading] = useState(false); // Loading state specifically for audio data
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- NEW States for Audio Controls ---
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  // ------------------------------------

  // Load initial call details (without audio)
  useEffect(() => {
    const loadCallDetails = async () => {
      if (!user || !id) return;
      setIsLoading(true);
      setAudioDataUri(null); // Reset audio state when call changes
      setIsPlaying(false);
      setCurrentTime(0); // Reset time
      setDuration(undefined); // Reset duration
      try {
        const callData = await callsService.getCallDetails(id);
        setCall(callData);
        setSegments(callData.segments || []);
      } catch (error) {
        console.error('Failed to load call details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCallDetails();
  }, [id, user]);

  // Function to load Base64 audio data and start playback
  const loadAndPlayAudio = async () => {
     if (!id || audioDataUri) {
         if (audioRef.current) {
             if (isPlaying) {
                 audioRef.current.pause();
             } else {
                 audioRef.current.play().catch(e => console.error("Audio play failed:", e));
             }
         }
         return;
     }

     if (!call?.voice_log) {
        alert("No recording URL available for this call.");
        return;
     }

     setIsAudioLoading(true);
     setAudioDataUri(null);
     setIsPlaying(false);
     setCurrentTime(0); // Reset time on new load
     setDuration(undefined); // Reset duration on new load

     try {
         console.log(`Fetching audio data via proxy for session: ${id}`);
         const response = await api.get<{ mimeType: string; data: string }>(`/calls/${id}/audio`);
         const { mimeType, data } = response.data;
         const dataUri = `data:${mimeType};base64,${data}`;
         console.log(`Audio data received, creating Data URI (mime: ${mimeType})`);
         setAudioDataUri(dataUri);

         setTimeout(() => {
              if (audioRef.current) {
                 audioRef.current.src = dataUri;
                 audioRef.current.load();
                 // Don't auto-play here, let the user click play again
                 console.log("Audio ready, press play.");
             }
         }, 50);

     } catch (error: any) {
         console.error('Failed to load audio data:', error);
         alert(`Failed to load audio: ${error.response?.data?.message || error.message || 'Unknown error'}`);
         setAudioDataUri(null);
     } finally {
         setIsAudioLoading(false);
     }
  };

  // Main handler for the Play/Pause button
  const handlePlayPauseControl = () => {
      if (!audioDataUri && !isAudioLoading) { // Load if not loaded and not currently loading
          loadAndPlayAudio();
      } else if (audioRef.current) { // If loaded, toggle play/pause
          if (isPlaying) {
              audioRef.current.pause();
          } else {
              audioRef.current.play().catch(e => console.error("Audio play failed:", e));
          }
      }
  };

  // Event handlers for the <audio> element to sync state
  const handleAudioPlay = () => setIsPlaying(true);
  const handleAudioPause = () => setIsPlaying(false);
  const handleAudioEnded = () => {
      setIsPlaying(false);
  };
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Handler for seeking using the progress bar
  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = Number(event.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Handler for mute toggle
  const toggleMute = () => {
      if (audioRef.current) {
          audioRef.current.muted = !isMuted;
          setIsMuted(!isMuted);
      }
  };

  // Handler for rewind (e.g., back 10 seconds)
  const handleRewind = (seconds: number = 10) => {
      if (audioRef.current) {
          const newTime = Math.max(0, audioRef.current.currentTime - seconds);
          audioRef.current.currentTime = newTime;
          setCurrentTime(newTime);
      }
  };


  // --- Helper functions (getCallIcon, formatDate, add/remove blacklist/whitelist) ---
  const getCallIcon = (type: CallType | undefined) => {
    if (!type) return <PhoneIncomingIcon size={20} className="text-gray-500" />;
    switch (type) {
      case 'Incoming': return <PhoneIncomingIcon size={20} className="text-success" />;
      case 'Outgoing': return <PhoneOutgoingIcon size={20} className="text-primary" />;
      case 'Missed': return <PhoneMissedIcon size={20} className="text-error" />;
      default: return <PhoneIncomingIcon size={20} className="text-gray-500" />;
    }
   };
   const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        try { const date = new Date(dateString); return date.toLocaleString(); }
        catch (e) { return dateString; }
    };
   const handleAddToWhitelist = () => {
        if (!call || !user) return;
        alert(`Added ${call.caller_phone} to whitelist. (Backend update needed)`);
        setCall(prev => prev ? { ...prev, contact_status: 'WHITELISTED' } : null);
    };
   const handleAddToBlacklist = () => {
        if (!call || !user) return;
        alert(`Added ${call.caller_phone} to blacklist. (Backend update needed)`);
        setCall(prev => prev ? { ...prev, contact_status: 'BLACKLISTED' } : null);
    };
   // --- End Helper Functions ---


  // --- Render Loading State ---
  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>;
   }
  // --- Render Not Found State ---
  if (!call) {
     return <div className="bg-white rounded-lg shadow p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Call Not Found</h2>
        <p className="text-gray-500 mb-6"> The call session (ID: {id}) you are looking for does not exist or data is unavailable.</p>
        <Link to="/calls"><Button>Back to Call Logs</Button></Link>
      </div>;
   }

  // Determine if audio can potentially be loaded
  const canAttemptLoadAudio = !!call.voice_log;

  // --- Render Call Details ---
  return (
    <div>
      {/* Back Link */}
      <div className="mb-6">
        <Link to="/calls" className="flex items-center text-primary hover:underline">
          <ArrowLeftIcon size={16} className="mr-1" /> Back to Call Logs
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Call Header */}
        <div className="p-6 border-b">
           <div className="flex items-center mb-2">
            {getCallIcon(call.call_type)}
            <h1 className="text-2xl font-semibold ml-2">{call.caller_name || 'Unknown Caller'}</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center text-gray-500 mb-4 flex-wrap gap-x-4 gap-y-1">
              <span className="flex items-center"><UserIcon size={16} className="mr-1" />{call.caller_phone}</span>
              <span className="flex items-center"><ClockIcon size={16} className="mr-1" />{formatDate(call.created_at)}</span>
              {call.category && call.category !== 'uncategorized' && (<span className="flex items-center"><TagIcon size={16} className="mr-1" />{call.category.charAt(0).toUpperCase() + call.category.slice(1).replace(/_/g, ' ')}</span>)}
              {call.intent && call.intent !== 'unknown' && (<span className="flex items-center"><InfoIcon size={16} className="mr-1" />Intent: {call.intent}</span>)}
              <span className={`flex items-center text-xs px-2 py-1 rounded-full ${call.contact_status === 'WHITELISTED' ? 'bg-success/10 text-success' : call.contact_status === 'BLACKLISTED' ? 'bg-error/10 text-error' : 'bg-gray-100 text-gray-600'}`}>{call.contact_status || 'Unknown'} Status</span>
          </div>

          {/* --- Audio Player Controls --- */}
          {canAttemptLoadAudio && (
            <div className="mt-4 p-3 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <Button variant="primary" size="sm" className="flex items-center justify-center w-10 h-10 p-0 rounded-full" onClick={handlePlayPauseControl} loading={isAudioLoading} disabled={isAudioLoading} title={isPlaying ? 'Pause' : 'Play'}>
                    {isAudioLoading ? (<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>) : isPlaying ? (<PauseIcon size={20} />) : (<PlayIcon size={20} className="ml-0.5" />)}
                </Button>
                 <Button variant="outline" size="sm" className="flex items-center justify-center w-10 h-10 p-0 rounded-full" onClick={() => handleRewind(10)} disabled={isAudioLoading || !audioDataUri} title="Rewind 10s">
                    <RotateCcwIcon size={18} />
                 </Button>
                <div className="text-sm text-gray-600 font-mono">{formatTime(currentTime)} / {formatTime(duration)}</div>
                <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} disabled={isAudioLoading || !audioDataUri} className="flex-grow h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50" />
                 <Button variant="outline" size="sm" className="flex items-center justify-center w-10 h-10 p-0 rounded-full" onClick={toggleMute} disabled={isAudioLoading || !audioDataUri} title={isMuted ? 'Unmute' : 'Mute'}>
                    {isMuted ? <VolumeXIcon size={18} /> : <Volume2Icon size={18} />}
                 </Button>
              </div>
              <audio ref={audioRef} onPlay={handleAudioPlay} onPause={handleAudioPause} onEnded={handleAudioEnded} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onError={(e) => { console.error("Audio playback error:", e); setAudioDataUri(null); setIsPlaying(false); setIsAudioLoading(false); setDuration(undefined); setCurrentTime(0); alert("Error playing audio."); }} preload="metadata" className="hidden" />
            </div>
          )}
          {!canAttemptLoadAudio && (<div className="mt-4 text-sm text-gray-500">No recording available for this call.</div>)}
          {/* --- End Audio Player Controls --- */}


          {/* --- Whitelist/Blacklist Actions --- */}
          <div className="mt-4 flex flex-wrap gap-2">
            {call.contact_status !== 'WHITELISTED' && (<Button variant="outline" size="sm" className="flex items-center" onClick={handleAddToWhitelist} disabled={isAudioLoading}><UserPlusIcon size={16} className="mr-1" /> Whitelist Caller</Button>)}
            {call.contact_status !== 'BLACKLISTED' && (<Button variant="outline" size="sm" className="flex items-center text-error border-error hover:bg-error/10" onClick={handleAddToBlacklist} disabled={isAudioLoading}><UserMinusIcon size={16} className="mr-1" /> Blacklist Caller</Button>)}
          </div>
          {/* --- End Actions --- */}
        </div>

        {/* Call Details Grid - *** ใส่โค้ดแสดงผลจริงตรงนี้ *** */}
         <div className="p-6 border-b grid grid-cols-1 md:grid-cols-2 gap-4">
              {call.summary && (
                  <div>
                    <h2 className="text-lg font-medium mb-2">Summary (TH)</h2>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{call.summary}</p>
                 </div>
             )}
              {call.sms_summary_en && (
                 <div>
                    <h2 className="text-lg font-medium mb-2">Summary (EN)</h2>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{call.sms_summary_en}</p>
                 </div>
             )}
             {call.note && (
                  <div>
                    <h2 className="text-lg font-medium mb-2">Internal Note</h2>
                    <p className="text-gray-700 bg-yellow-50 p-3 rounded">{call.note}</p>
                 </div>
             )}
              {call.call_outcome && (
                  <div>
                    <h2 className="text-lg font-medium mb-2">Call Outcome</h2>
                    <p className="text-gray-700 font-mono text-sm">{call.call_outcome}</p>
                 </div>
             )}
              {call.spam_risk_score !== null && typeof call.spam_risk_score !== 'undefined' && (
                  <div>
                    <h2 className="text-lg font-medium mb-2">Spam Risk</h2>
                     <p className="text-gray-700">Score: {Number(call.spam_risk_score).toFixed(2)}</p>
                     {call.spam_risk_reason && <p className="text-gray-500 text-sm">Reason: {call.spam_risk_reason}</p>}
                 </div>
              )}
               {call.confidence !== null && typeof call.confidence !== 'undefined' && (
                  <div>
                    <h2 className="text-lg font-medium mb-2">Intent Confidence</h2>
                     <p className="text-gray-700">{Number(call.confidence).toFixed(2)}</p>
                 </div>
              )}
         </div>


        {/* Call Transcript (from chat history) */}
        <div className="p-6">
            <h2 className="text-lg font-medium mb-4">Conversation Log</h2>
             {segments.length === 0 ? (
                <p className="text-gray-500">No conversation log available for this session.</p>
             ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                 {segments.map(segment => (
                    <div key={segment.segment_id} className={`flex items-start gap-2 ${segment.speaker === 'human' ? '' : 'justify-end'}`}>
                       {segment.speaker === 'human' && (<span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-1" title="Caller"><UserIcon size={16} className="text-blue-600"/></span>)}
                       <div className={`p-3 rounded-lg max-w-[80%] ${segment.speaker === 'human' ? 'bg-blue-50 text-blue-900' : 'bg-primary/10 text-primary-dark'}`}>
                            {typeof segment.text === 'string' && segment.text.startsWith('{') && segment.text.endsWith('}') ? (
                               (() => {
                                   try { const parsed = JSON.parse(segment.text); return <pre className="text-xs whitespace-pre-wrap font-sans">{parsed.response || JSON.stringify(parsed, null, 2)}</pre>; }
                                   catch (e) { return <div className="text-gray-800 whitespace-pre-wrap">{segment.text}</div>; }
                               })()
                            ) : (<div className="text-gray-800 whitespace-pre-wrap">{segment.text || '(No content)'}</div>)}
                        </div>
                         {segment.speaker === 'ai' && (<span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mt-1" title="AI Secretary"><BotIcon size={16} className="text-green-600"/></span>)}
                    </div>
                  ))}
                </div>
              )}
        </div>
      </div>
    </div>
  );
};