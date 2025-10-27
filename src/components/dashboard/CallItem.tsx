import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PhoneIcon, PhoneIncomingIcon, PhoneOutgoingIcon, PhoneMissedIcon, PlayIcon, MoreVerticalIcon, UserPlusIcon, UserMinusIcon, PhoneCallIcon, RefreshCwIcon, AlertTriangleIcon } from 'lucide-react'; // Added icons
import { CallDisplay } from '../../types/call'; // Import CallDisplay from types

// Use CallDisplay type for the prop
interface CallItemProps {
  call: CallDisplay; // Use CallDisplay type here
  onListenRecording?: (callId: string) => void;
  onCallback?: (callNumber: string) => void;
  onAddToWhitelist?: (callNumber: string) => void;
  onAddToBlacklist?: (callNumber: string) => void;
}

export const CallItem: React.FC<CallItemProps> = ({
  call,
  onListenRecording,
  onCallback,
  onAddToWhitelist,
  onAddToBlacklist
}) => {
  const [showActions, setShowActions] = useState(false);

  // Use call.type (which is CallType: 'Incoming' | 'Missed' | 'Outgoing')
  const getCallIcon = () => {
    switch (call.type) {
      case 'Incoming':
        return <PhoneIncomingIcon size={16} className="text-success" />;
      case 'Outgoing':
        return <PhoneOutgoingIcon size={16} className="text-primary" />;
      case 'Missed':
        return <PhoneMissedIcon size={16} className="text-error" />;
      default:
        // Provide a sensible default or handle unexpected types
        console.warn(`Unexpected call type: ${call.type}`);
        return <PhoneIcon size={16} className="text-gray-500" />;
    }
  };

  // *** CORRECTED getStatusBadge ***
  const getStatusBadge = () => {
    // Define status configurations including new ones
    const statusConfig: { [key in CallDisplay['status'] | 'default']: { color: string; label: string; icon?: React.ReactNode } } = {
      answered: {
        color: 'bg-success/10 text-success',
        label: 'Answered'
      },
      voicemail: { // Assuming voicemail might be mapped later
        color: 'bg-secondary/10 text-secondary',
        label: 'Voicemail'
      },
      missed: {
        color: 'bg-error/10 text-error',
        label: 'Missed'
      },
      blocked: {
        color: 'bg-gray-100 text-gray-700',
        label: 'Blocked'
      },
      processing: { // Added
        color: 'bg-blue-100 text-blue-700',
        label: 'Processing',
        icon: <RefreshCwIcon size={12} className="inline mr-1 animate-spin" />
      },
      failed: { // Added
        color: 'bg-red-100 text-red-700',
        label: 'Failed',
        icon: <AlertTriangleIcon size={12} className="inline mr-1" />
      },
      other: { // Added for fallback
          color: 'bg-yellow-100 text-yellow-700',
          label: 'Other' // Or use call.status directly if meaningful
      },
      default: { // Fallback for truly undefined keys
          color: 'bg-gray-100 text-gray-500',
          label: 'Unknown'
      }
    };

    // Safely get the config or use the default
    const config = statusConfig[call.status] || statusConfig.default;

    return (
        <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center ${config.color}`}>
            {config.icon}
            {config.label}
        </span>
    );
  };


  const toggleActions = () => {
    setShowActions(!showActions);
  };

  return (
      <div className="p-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-3">{getCallIcon()}</div>
          <div>
            <Link to={`/calls/${call.id}`} className="font-medium hover:text-primary">
              {call.callerName || 'Unknown'}
            </Link>
            <p className="text-sm text-gray-500">{call.callerNumber}</p>
          </div>
        </div>
        <div className="flex items-center">
          <div className="hidden sm:flex items-center mr-4">
            <span className="text-sm text-gray-500 mr-3">{call.timestamp}</span>
            {getStatusBadge()}
          </div>
          <div className="relative">
            {call.recording && <button onClick={() => onListenRecording?.(call.id)} className="p-2 text-primary hover:bg-primary/10 rounded-full mr-1" aria-label="Listen to recording">
                <PlayIcon size={16} />
              </button>}
            <button onClick={toggleActions} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" aria-label="More actions">
              <MoreVerticalIcon size={16} />
            </button>
            {showActions && <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 py-1 border">
                <button onClick={() => {
              onCallback?.(call.callerNumber);
              setShowActions(false);
            }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                  <PhoneCallIcon size={16} className="mr-2" />
                  Call back
                </button>
                <button onClick={() => {
              onAddToWhitelist?.(call.callerNumber);
              setShowActions(false);
            }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                  <UserPlusIcon size={16} className="mr-2" />
                  Add to whitelist
                </button>
                <button onClick={() => {
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
      <div className="sm:hidden flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500">{call.timestamp}</span>
        {getStatusBadge()}
      </div>
    </div>
  );
};