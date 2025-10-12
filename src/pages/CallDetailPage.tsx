import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { callsService } from '../services/callsService';
import { CallLog, CallSegment } from '../types/call';
import { ArrowLeftIcon, PhoneIncomingIcon, PhoneOutgoingIcon, PhoneMissedIcon, UserIcon, UserPlusIcon, UserMinusIcon, PlayIcon, PauseIcon, ClockIcon, TagIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
export const CallDetailPage: React.FC = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const {
    user
  } = useAuth();
  const [call, setCall] = useState<CallLog | null>(null);
  const [segments, setSegments] = useState<CallSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  useEffect(() => {
    const loadCallDetails = async () => {
      if (!user || !id) return;
      setIsLoading(true);
      try {
        const callData = await callsService.getCallDetails(user.user_id, id);
        setCall(callData);
        const segmentsData = await callsService.getCallSegments(id);
        setSegments(segmentsData);
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
    // This would actually control audio playback in a real app
  };
  const handleAddToWhitelist = () => {
    if (!call) return;
    alert(`Added ${call.caller_phone} to whitelist. (This would update the whitelist in a real app)`);
  };
  const handleAddToBlacklist = () => {
    if (!call) return;
    alert(`Added ${call.caller_phone} to blacklist. (This would update the blacklist in a real app)`);
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
          The call you're looking for doesn't exist or was deleted.
        </p>
        <Link to="/calls">
          <Button>Back to Call Logs</Button>
        </Link>
      </div>;
  }
  const getCallIcon = () => {
    switch (call.call_type) {
      case 'incoming':
        return <PhoneIncomingIcon size={20} className="text-success" />;
      case 'outgoing':
        return <PhoneOutgoingIcon size={20} className="text-primary" />;
      case 'missed':
        return <PhoneMissedIcon size={20} className="text-error" />;
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  return <div>
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
            {getCallIcon()}
            <h1 className="text-2xl font-semibold ml-2">
              {call.caller_name || 'Unknown Caller'}
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center text-gray-500 mb-4">
            <span className="flex items-center mr-4">
              <UserIcon size={16} className="mr-1" />
              {call.caller_phone}
            </span>
            <span className="flex items-center mr-4">
              <ClockIcon size={16} className="mr-1" />
              {formatDate(call.created_at)}
            </span>
            {call.category && <span className="flex items-center">
                <TagIcon size={16} className="mr-1" />
                {call.category.charAt(0).toUpperCase() + call.category.slice(1).replace('_', ' ')}
              </span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="flex items-center" onClick={handlePlayRecording}>
              {isPlaying ? <>
                  <PauseIcon size={16} className="mr-1" /> Pause Recording
                </> : <>
                  <PlayIcon size={16} className="mr-1" /> Play Recording
                </>}
            </Button>
            <Button variant="outline" className="flex items-center" onClick={handleAddToWhitelist}>
              <UserPlusIcon size={16} className="mr-1" />
              Add to Whitelist
            </Button>
            <Button variant="outline" className="flex items-center" onClick={handleAddToBlacklist}>
              <UserMinusIcon size={16} className="mr-1" />
              Add to Blacklist
            </Button>
          </div>
        </div>
        {/* Call Summary */}
        {call.summary && <div className="p-6 border-b">
            <h2 className="text-lg font-medium mb-2">Summary</h2>
            <p className="text-gray-700">{call.summary}</p>
          </div>}
        {/* Call Transcript */}
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Transcript</h2>
          {segments.length === 0 ? <p className="text-gray-500">
              No transcript available for this call.
            </p> : <div className="space-y-4">
              {segments.map(segment => <div key={segment.segment_id} className={`p-3 rounded-lg max-w-[80%] ${segment.speaker === 'caller' ? 'bg-gray-100 mr-auto' : 'bg-primary/10 ml-auto'}`}>
                  <div className="text-xs font-medium mb-1">
                    {segment.speaker === 'caller' ? call.caller_name || 'Caller' : 'AI Secretary'}
                  </div>
                  <div className="text-gray-800">{segment.text}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(segment.start_ms).toISOString().substr(11, 8)}
                  </div>
                </div>)}
            </div>}
        </div>
      </div>
    </div>;
};