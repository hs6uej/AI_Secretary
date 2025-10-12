import React from 'react';
import { BellOffIcon, PhoneForwardedIcon, MessageSquarePlusIcon } from 'lucide-react';
interface QuickAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}
interface QuickActionsBarProps {
  actions?: QuickAction[];
}
export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  actions
}) => {
  const defaultActions: QuickAction[] = [{
    icon: <MessageSquarePlusIcon size={24} />,
    label: 'Set Announcement',
    onClick: () => console.log('Set announcement'),
    color: 'bg-primary/10 border-primary/20 text-primary'
  }, {
    icon: <BellOffIcon size={24} />,
    label: 'Do Not Disturb',
    onClick: () => console.log('Toggle DND'),
    color: 'bg-error/10 border-error/20 text-error'
  }, {
    icon: <PhoneForwardedIcon size={24} />,
    label: 'Call Forwarding',
    onClick: () => console.log('Call forwarding'),
    color: 'bg-secondary/10 border-secondary/20 text-secondary'
  }];
  const displayActions = actions || defaultActions;
  return <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {displayActions.map((action, index) => <button key={index} onClick={action.onClick} className={`
            flex items-center justify-center sm:justify-start
            p-4 rounded-lg border
            ${action.color}
            transition-colors hover:bg-opacity-20
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
          `}>
          <span className="mr-0 sm:mr-3">{action.icon}</span>
          <span className="hidden sm:block font-medium">{action.label}</span>
        </button>)}
    </div>;
};