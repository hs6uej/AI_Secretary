// src/components/dashboard/CallItem.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  PhoneIcon, PhoneIncomingIcon, PhoneOutgoingIcon, PhoneMissedIcon, 
  PlayIcon, MoreVerticalIcon, UserPlusIcon, UserMinusIcon, PhoneCallIcon, 
  RefreshCwIcon, AlertTriangleIcon,
  // MODIFIED: (Case 7, 5) Added Pause and fixed icon names
  PauseIcon, // (Case 7)
  CheckCircle, // (Case 5)
  XCircle, // (Case 5)
  HelpCircle // (Case 5)
} from 'lucide-react'; 
import { CallDisplay } from '../../types/call'; // Import CallDisplay from types
import { format } from 'date-fns'; // Import date-fns

// Use CallDisplay type for the prop
interface CallItemProps {
  call: CallDisplay; // Use CallDisplay type here
  onListenRecording?: (callId: string) => void;
  // MODIFIED (Case 7): Prop to indicate if this item is playing
  playingCallId?: string | null;
  onCallback?: (callNumber: string) => void;
  onAddToWhitelist?: (callNumber: string) => void;
  onAddToBlacklist?: (callNumber: string) => void;
}

export const CallItem: React.FC<CallItemProps> = ({
  call,
  onListenRecording,
  playingCallId, // (Case 7)
  onCallback,
  onAddToWhitelist,
  onAddToBlacklist
}) => {
  const [showActions, setShowActions] = useState(false);
  // MODIFIED (Case 7): Check if this specific item is playing
  const isPlaying = playingCallId === call.id; 

  // Use call.type
  const getCallIcon = () => {
    switch (call.type) {
      case 'Incoming':
        return <PhoneIncomingIcon size={16} className="text-success" />;
      case 'Outgoing':
        return <PhoneOutgoingIcon size={16} className="text-primary" />;
      case 'Missed':
        return <PhoneMissedIcon size={16} className="text-destructive" />;
      default:
        return <PhoneIcon size={16} className="text-gray-500" />;
    }
  };

  // ADDED (Case 5): Helper for contact status icon
  const getContactStatusIcon = () => {
    switch (call.contact_status) {
      case 'WHITELISTED':
        return <CheckCircle size={16} className="text-success mr-1 flex-shrink-0" title="Whitelist" />;
      case 'BLACKLISTED':
        return <XCircle size={16} className="text-destructive mr-1 flex-shrink-0" title="Blacklist" />;
      case 'UNKNOWN':
      default:
        return null;
    }
  };

  // ADDED: Helper for formatting timestamp
  const formatTimestamp = (isoString: string) => {
    try {
      return format(new Date(isoString), 'PP, p'); // e.g., "Oct 30, 2025, 2:42:19 PM"
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // ADDED (Case 8): Format scores
  const formatScore = (score: number | string | null | undefined) => {
    if (score === null || score === undefined) return 'N/A';
    const num = Number(score);
    if (isNaN(num)) return 'N/A';
    return num.toFixed(2);
  };


  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* Desktop View (md and up) */}
      <div className="hidden sm:flex items-center space-x-4">
        <div className="pr-2">{getCallIcon()}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            {/* ADDED (Case 5): Status Icon */}
            {getContactStatusIcon()}
            <span className="font-semibold text-gray-800 truncate" title={call.callerName}>
              {call.callerName}
            </span>
          </div>
           {/* ADDED (Case 6): Clickable phone link */}
          <a 
            href={`tel:${call.callerNumber}`}
            className="text-sm text-gray-500 hover:text-primary hover:underline"
            title={`Call ${call.callerNumber}`}
            onClick={(e) => e.stopPropagation()} // Prevent card click
          >
            {call.callerNumber}
          </a>
        </div>
        
        <div className="flex-1 min-w-0" style={{ flexBasis: '40%' }}>
          {/* MODIFIED (Case 10): Link to new route /calls/:id */}
          <Link 
            to={`/calls/${call.id}`} 
            className="text-sm text-gray-700 hover:text-primary hover:underline"
          >
            {call.summary || <span className="text-gray-400 italic">No summary available</span>}
          </Link>
          
          {/* ADDED (Case 8): Show Scores */}
          <div className="flex space-x-4 text-xs text-gray-500 mt-1">
            <span>
              Spam Risk: <span className="font-medium text-gray-700">{formatScore(call.spam_risk_score)}</span>
            </span>
            <span>
              Confidence: <span className="font-medium text-gray-700">{formatScore(call.confidence)}</span>
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0 text-right">
          <div className="text-sm text-gray-700">{formatTimestamp(call.timestamp)}</div>
          {/* ADDED (Case 9): Category Description */}
          <div className="text-xs text-gray-500 capitalize">
            {call.category_description || call.status}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* MODIFIED (Case 7): Play button logic */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              onListenRecording?.(call.id);
            }}
            disabled={!call.recordingUrl} // Only disable if no URL
            className={`p-2 rounded-full ${
              call.recordingUrl 
                ? 'text-primary hover:bg-primary-100 disabled:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title={call.recordingUrl ? (isPlaying ? 'Pause' : 'Listen to recording') : 'No recording available'}
          >
            {isPlaying ? (
              <PauseIcon size={18} /> // Show Pause icon when playing
            ) : (
              <PlayIcon size={18} /> // Show Play icon
            )}
          </button>
          
          {/* "..." Actions Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click
                setShowActions(prev => !prev);
              }}
              onBlur={() => setTimeout(() => setShowActions(false), 200)} // Delay blur to allow click
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100"
              title="More actions"
            >
              <MoreVerticalIcon size={18} />
            </button>
            {showActions && <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 py-1 border">
                <button onClick={(e) => {
              e.stopPropagation();
              onCallback?.(call.callerNumber);
              setShowActions(false);
            }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                  <PhoneCallIcon size={16} className="mr-2" />
                  Call back
                </button>
                <button onClick={(e) => {
              e.stopPropagation();
              onAddToWhitelist?.(call.callerNumber);
              setShowActions(false);
            }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                  <UserPlusIcon size={16} className="mr-2" />
                  Add to whitelist
                </button>
                <button onClick={(e) => {
              e.stopPropagation();
              onAddToBlacklist?.(call.callerNumber);
              setShowActions(false);
            }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                  <UserMinusIcon size={16} className="mr-2" />
                  Add to blacklist
                </button>
              </div>}
          </div>
        </div>
      </div>
      
      {/* Mobile View (sm only) */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0">
             <div className="mr-2">{getCallIcon()}</div>
             <div className="min-w-0">
                <div className="flex items-center">
                  {/* (Case 5) */}
                  {getContactStatusIcon()}
                  <span className="font-semibold text-gray-800 truncate">{call.callerName}</span>
                </div>
                 {/* (Case 6) */}
                <a 
                  href={`tel:${call.callerNumber}`} 
                  className="text-sm text-gray-500 hover:text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {call.callerNumber}
                </a>
             </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-sm text-gray-700">{formatTimestamp(call.timestamp)}</div>
            {/* (Case 9) */}
            <div className="text-xs text-gray-500 capitalize">{call.category_description || call.status}</div>
          </div>
        </div>
        
        <div className="mt-2">
           {/* (Case 10) */}
          <Link 
            to={`/calls/${call.id}`} 
            className="text-sm text-gray-700 hover:text-primary hover:underline"
          >
            {call.summary || <span className="text-gray-400 italic">No summary available</span>}
          </Link>
          {/* (Case 8) */}
          <div className="flex space-x-4 text-xs text-gray-500 mt-1">
            <span>Spam: <span className="font-medium text-gray-700">{formatScore(call.spam_risk_score)}</span></span>
            <span>Conf: <span className="font-medium text-gray-700">{formatScore(call.confidence)}</span></span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* (Case 7) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onListenRecording?.(call.id);
            }}
            disabled={!call.recordingUrl}
            className={`flex items-center justify-center px-3 py-1.5 rounded-md ${
              call.recordingUrl 
                ? 'bg-primary-100 text-primary hover:bg-primary-200 disabled:text-gray-400 disabled:bg-gray-100' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isPlaying ? (
              <PauseIcon size={16} className="mr-2" />
            ) : (
              <PlayIcon size={16} className="mr-2" />
            )}
            {isPlaying ? 'Playing...' : 'Listen'}
          </button>

          {/* "..." Actions Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(prev => !prev);
              }}
              onBlur={() => setTimeout(() => setShowActions(false), 200)}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100"
              title="More actions"
            >
              <MoreVerticalIcon size={18} />
            </button>
            {showActions && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 py-1 border">
                <button onClick={(e) => { e.stopPropagation(); onCallback?.(call.callerNumber); }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                  <PhoneCallIcon size={16} className="mr-2" />
                  Call back
                </button>
                <button onClick={(e) => { e.stopPropagation(); onAddToWhitelist?.(call.callerNumber); }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                  <UserPlusIcon size={16} className="mr-2" />
                  Add to whitelist
                </button>
                <button onClick={(e) => { e.stopPropagation(); onAddToBlacklist?.(call.callerNumber); }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                  <UserMinusIcon size={16} className="mr-2" />
                  Add to blacklist
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};