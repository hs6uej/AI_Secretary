import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PhoneIcon, PhoneIncomingIcon, PhoneOutgoingIcon, PhoneMissedIcon, PlayIcon, MoreVerticalIcon, UserPlusIcon, UserMinusIcon, PhoneCallIcon } from 'lucide-react';
import { Call } from './CallsList';
interface CallItemProps {
  call: Call;
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
  const getCallIcon = () => {
    switch (call.type) {
      case 'incoming':
        return <PhoneIncomingIcon size={16} className="text-success" />;
      case 'outgoing':
        return <PhoneOutgoingIcon size={16} className="text-primary" />;
      case 'missed':
        return <PhoneMissedIcon size={16} className="text-error" />;
      default:
        return <PhoneIcon size={16} className="text-gray-500" />;
    }
  };
  const getStatusBadge = () => {
    const statusConfig = {
      answered: {
        color: 'bg-success/10 text-success',
        label: 'Answered'
      },
      voicemail: {
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
      }
    };
    const {
      color,
      label
    } = statusConfig[call.status];
    return <span className={`text-xs px-2 py-1 rounded-full ${color}`}>{label}</span>;
  };
  const toggleActions = () => {
    setShowActions(!showActions);
  };
  return <div className="p-4 hover:bg-gray-50">
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
      {/* Mobile-only timestamp and status */}
      <div className="sm:hidden flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500">{call.timestamp}</span>
        {getStatusBadge()}
      </div>
    </div>;
};