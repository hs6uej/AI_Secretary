// src/pages/CallDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { callsService } from '../services/callsService';
// Import updated types - CallLog now includes more fields, CallSegment structure changed
import { CallLog, CallSegment, CallType } from '../types/call';
import { ArrowLeftIcon, PhoneIncomingIcon, PhoneOutgoingIcon, PhoneMissedIcon, UserIcon, UserPlusIcon, UserMinusIcon, PlayIcon, PauseIcon, ClockIcon, TagIcon, InfoIcon, BotIcon, MessageSquareIcon } from 'lucide-react'; // Added icons
import { Button } from '../components/ui/Button';

export const CallDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string; }>(); // id is the session_id
  const { user } = useAuth();
  const [call, setCall] = useState<CallLog | null>(null);
  // Segments now come from chat history
  const [segments, setSegments] = useState<CallSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false); // Still mock

  useEffect(() => {
    const loadCallDetails = async () => {
      if (!user || !id) return;
      setIsLoading(true);
      try {
        // callsService.getCallDetails now expects session_id and returns the extended CallLog + segments
        const callData = await callsService.getCallDetails(id);
        setCall(callData);
        // Segments are now part of the response directly
        setSegments(callData.segments || []);
      } catch (error) {
        console.error('Failed to load call details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCallDetails();
  }, [id, user]);

  const handlePlayRecording = () => {
    setIsPlaying(!isPlaying);
    alert("Audio recording playback not available in this schema.");
  };

  const handleAddToWhitelist = () => {
    if (!call) return;
    alert(`Added ${call.caller_phone} to whitelist. (Backend update needed)`);
  };

  const handleAddToBlacklist = () => {
    if (!call) return;
    alert(`Added ${call.caller_phone} to blacklist. (Backend update needed)`);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>;
  }

  if (!call) {
     return <div className="bg-white rounded-lg shadow p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Call Not Found</h2>
        <p className="text-gray-500 mb-6">
          The call session (ID: {id}) you're looking for doesn't exist or data is unavailable.
        </p>
        <Link to="/calls">
          <Button>Back to Call Logs</Button>
        </Link>
      </div>;
  }

  // Use CallType from the updated type definition
  const getCallIcon = (type: CallType) => {
    switch (type) {
      case 'Incoming':
        return <PhoneIncomingIcon size={20} className="text-success" />;
      case 'Outgoing': // Added case based on enum
        return <PhoneOutgoingIcon size={20} className="text-primary" />;
      case 'Missed':
        return <PhoneMissedIcon size={20} className="text-error" />;
      default:
         return <PhoneIncomingIcon size={20} className="text-gray-500" />; // Default fallback
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleString();
    } catch (e) {
        return dateString; // Return original string if parsing fails
    }
  };

  // Helper to format milliseconds to HH:MM:SS (if needed for segments, though not directly available)
  const formatMillis = (ms: number | undefined) => {
      if (typeof ms !== 'number') return '';
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }


  return (
    <div>
      <div className="mb-6">
        <Link to="/calls" className="flex items-center text-primary hover:underline">
          <ArrowLeftIcon size={16} className="mr-1" />
          Back to Call Logs
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Call Header */}
        <div className="p-6 border-b">
          <div className="flex items-center mb-2">
            {getCallIcon(call.call_type)}
            <h1 className="text-2xl font-semibold ml-2">
              {call.caller_name || 'Unknown Caller'}
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center text-gray-500 mb-4 flex-wrap">
            <span className="flex items-center mr-4 mb-1 sm:mb-0">
              <UserIcon size={16} className="mr-1" />
              {call.caller_phone}
            </span>
            <span className="flex items-center mr-4 mb-1 sm:mb-0">
              <ClockIcon size={16} className="mr-1" />
              {formatDate(call.created_at)} {/* Use created_at (mapped from datetime) */}
            </span>
            {call.category && call.category !== 'uncategorized' && (
              <span className="flex items-center mr-4 mb-1 sm:mb-0">
                <TagIcon size={16} className="mr-1" />
                {call.category.charAt(0).toUpperCase() + call.category.slice(1).replace(/_/g, ' ')}
              </span>
            )}
             {call.intent && call.intent !== 'unknown' && (
              <span className="flex items-center mr-4 mb-1 sm:mb-0">
                 <InfoIcon size={16} className="mr-1" />
                 Intent: {call.intent}
              </span>
             )}
              <span className={`flex items-center text-xs px-2 py-1 rounded-full ${
                    call.contact_status === 'WHITELISTED' ? 'bg-success/10 text-success' :
                    call.contact_status === 'BLACKLISTED' ? 'bg-error/10 text-error' : 'bg-gray-100 text-gray-600'
                  }`}>
                {call.contact_status || 'Unknown'} Status
              </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Play Recording button is now disabled/informative */}
             <Button variant="outline" className="flex items-center" onClick={handlePlayRecording} disabled>
                <PlayIcon size={16} className="mr-1" /> No Recording Available
            </Button>
            {call.contact_status !== 'WHITELISTED' && (
                 <Button variant="outline" className="flex items-center" onClick={handleAddToWhitelist}>
                    <UserPlusIcon size={16} className="mr-1" />
                    Whitelist Caller
                </Button>
            )}
             {call.contact_status !== 'BLACKLISTED' && (
                 <Button variant="outline" className="flex items-center text-error border-error hover:bg-error/10" onClick={handleAddToBlacklist}>
                    <UserMinusIcon size={16} className="mr-1" />
                    Blacklist Caller
                </Button>
            )}
          </div>
        </div>

        {/* Call Details Grid */}
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
              {call.tts_response && (
                  <div className="md:col-span-2">
                    <h2 className="text-lg font-medium mb-2">Last TTS Response</h2>
                    <p className="text-gray-700 italic bg-blue-50 p-3 rounded">"{call.tts_response}"</p>
                 </div>
             )}
              {call.spam_risk_score !== null && typeof call.spam_risk_score !== 'undefined' && (
                  <div>
                    <h2 className="text-lg font-medium mb-2">Spam Risk</h2>
                     <p className="text-gray-700">Score: {Number(call.spam_risk_score).toFixed(2)}</p>
                     {call.spam_risk_reason && <p className="text-gray-500 text-sm">Reason: {call.spam_risk_reason}</p>}
                 </div>
              )}
         </div>


        {/* Call Transcript (from chat history) */}
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Conversation Log</h2>
          {segments.length === 0 ? (
            <p className="text-gray-500">
              No conversation log available for this session.
            </p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {segments.map(segment => (
                 // Segment now uses speaker ('human' or 'ai') and text directly
                <div key={segment.segment_id} className={`flex items-start gap-2 ${segment.speaker === 'human' ? '' : 'justify-end'}`}>
                   {segment.speaker === 'human' && (
                       <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-1">
                           <UserIcon size={16} className="text-blue-600"/>
                       </span>
                   )}
                   <div className={`p-3 rounded-lg max-w-[80%] ${segment.speaker === 'human' ? 'bg-blue-50 text-blue-900' : 'bg-primary/10 text-primary-dark'}`}>
                        {/* Attempt to parse JSON content if text is a JSON string */}
                        {typeof segment.text === 'string' && segment.text.startsWith('{') && segment.text.endsWith('}') ? (
                           (() => {
                               try {
                                   const parsed = JSON.parse(segment.text);
                                   // Display relevant part, e.g., 'response'
                                   return <pre className="text-xs whitespace-pre-wrap">{parsed.response || JSON.stringify(parsed, null, 2)}</pre>;
                               } catch (e) {
                                   // If parsing fails, show raw text
                                   return <div className="text-gray-800">{segment.text}</div>;
                               }
                           })()
                        ) : (
                           <div className="text-gray-800">{segment.text || '(No content)'}</div>
                        )}
                        {/* Timestamp not directly available per message in this schema */}
                    </div>
                     {segment.speaker === 'ai' && (
                       <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mt-1">
                           <BotIcon size={16} className="text-green-600"/>
                       </span>
                   )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};