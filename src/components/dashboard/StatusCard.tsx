import React from 'react';
import { UserState } from '../../types/user';
interface StatusCardProps {
  status: UserState['status'];
  message?: string;
  duration?: string;
}
export const StatusCard: React.FC<StatusCardProps> = ({
  status,
  message,
  duration
}) => {
  const statusConfig = {
    available: {
      label: 'Available',
      color: 'bg-success/10 border-success/20',
      textColor: 'text-success',
      icon: <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
    },
    busy: {
      label: 'Busy',
      color: 'bg-warning/10 border-warning/20',
      textColor: 'text-warning',
      icon: <div className="w-3 h-3 bg-warning rounded-full"></div>
    },
    dnd: {
      label: 'Do Not Disturb',
      color: 'bg-error/10 border-error/20',
      textColor: 'text-error',
      icon: <div className="w-3 h-3 bg-error rounded-full"></div>
    },
    away: {
      label: 'Away',
      color: 'bg-secondary/10 border-secondary/20',
      textColor: 'text-secondary',
      icon: <div className="w-3 h-3 bg-secondary rounded-full"></div>
    }
  };
  const {
    label,
    color,
    textColor,
    icon
  } = statusConfig[status];
  return <div className={`p-6 rounded-lg border ${color}`}>
      <div className="flex items-center mb-3">
        <div className="mr-2">{icon}</div>
        <h3 className={`font-medium ${textColor}`}>{label}</h3>
      </div>
      {message && <p className="text-gray-700 mb-2">{message}</p>}
      {duration && <p className="text-sm text-gray-500">Duration: {duration}</p>}
    </div>;
};